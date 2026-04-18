// server.js — EEC Club Express + PostgreSQL backend
require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { createClient } = require("redis");

// ─── App & DB ─────────────────────────────────────────────────────────────────
const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const PORT = process.env.PORT || 4000;

// ─── Redis Setup ──────────────────────────────────────────────────────────────
let isRedisConnected = false;
const redisClient = createClient({ 
    url: process.env.REDIS_URL,
    socket: {
        reconnectStrategy: false // Disable infinite reconnects
    }
});

redisClient.on("error", (err) => {
    if (isRedisConnected) {
        console.error("Redis Connection Error:", err.message);
        isRedisConnected = false;
    }
});

(async () => {
    try {
        await redisClient.connect();
        isRedisConnected = true;
        console.log("✓ Redis connected");
    } catch (err) {
        console.warn("⚠ Redis connection failed (cache disabled)");
    }
})();

// Helper functions for optional redis usage
async function getCache(key) {
    if (!isRedisConnected) return null;
    try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 500));
        return await Promise.race([redisClient.get(key), timeout]);
    } catch (e) { return null; }
}
async function setCache(key, value, options) {
    if (!isRedisConnected) return;
    try { await redisClient.set(key, value, options); } catch (e) {}
}
async function delCache(key) {
    if (!isRedisConnected) return;
    try { await redisClient.del(key); } catch (e) {}
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
const UPLOADS_DIR = path.join(__dirname, "uploads");
const FILES_DIR   = path.join(__dirname, "files");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(FILES_DIR))   fs.mkdirSync(FILES_DIR);
app.use("/uploads", express.static(UPLOADS_DIR));

// Multer — images
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, unique + path.extname(file.originalname));
    },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5 MB

// Multer — PDFs
const pdfStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, FILES_DIR),
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, unique + path.extname(file.originalname)); // keeps .pdf extension
    },
});
const uploadPdf = multer({
    storage: pdfStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === "application/pdf") cb(null, true);
        else cb(new Error("Only PDF files are allowed"));
    },
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ─── File Uploads ─────────────────────────────────────────────────────────────
app.post("/upload/pdf", uploadPdf.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.json({ filename: req.file.filename, path: `/files/${req.file.filename}` });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  COURSES
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /courses — list all courses (cached) */
app.get("/courses", async (_req, res) => {
    try {
        // Try to get from cache first
        const cacheKey = "all_courses";
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            console.log("Serving courses from cache");
            return res.json(JSON.parse(cachedData));
        }

        const { rows } = await pool.query(
            `SELECT course_id AS course_name, title, description, level, credits,
              difficulty, prerequisites, objectives, books,
              major_1_date, major_2_date, final_date
       FROM courses
       ORDER BY level, course_id`
        );
        const parsed = rows.map(r => ({ ...r, books: tryParseJson(r.books) }));

        // Store in Redis for 1 hour
        await setCache(cacheKey, JSON.stringify(parsed), { EX: 3600 });
        
        res.json(parsed);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch courses" });
    }
});

/** GET /courses/:courseId — single course */
app.get("/courses/:courseId", async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT course_id AS course_name, title, description, level, credits,
              difficulty, prerequisites, objectives, books,
              major_1_date, major_2_date, final_date
       FROM courses WHERE course_id = $1`,
            [req.params.courseId]
        );
        if (!rows.length) return res.status(404).json({ error: "Course not found" });
        const course = { ...rows[0], books: tryParseJson(rows[0].books) };
        res.json(course);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch course" });
    }
});

/** POST /courses — create a course */
app.post("/courses", async (req, res) => {
    const { course_id, title, description, level, credits, difficulty,
        prerequisites, objectives, books, major_1_date, major_2_date, final_date } = req.body;
    try {
        // Validate required fields
        if (!course_id || !title || level === undefined) {
            return res.status(400).json({ error: "course_id, title, and level are required" });
        }

        // Validate data types
        if (typeof level !== 'number' || isNaN(level)) {
            return res.status(400).json({ error: "level must be a valid number (1-5)" });
        }
        if (typeof credits !== 'number' || isNaN(credits)) {
            return res.status(400).json({ error: "credits must be a valid number" });
        }
        if (difficulty !== null && difficulty !== undefined) {
            if (typeof difficulty !== 'number' || isNaN(difficulty)) {
                return res.status(400).json({ error: "difficulty must be a valid number (0.0-5.0)" });
            }
        }

        // Convert arrays to comma-separated strings for storage
        const prereqStr = Array.isArray(prerequisites) ? prerequisites.join(", ") : prerequisites || "";
        const objStr = Array.isArray(objectives) ? objectives.join("\n") : objectives || "";

        const { rows } = await pool.query(
            `INSERT INTO courses (course_id, title, description, level, credits, difficulty,
                            prerequisites, objectives, books, major_1_date, major_2_date, final_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
            [course_id, title, description, level, credits, difficulty,
                prereqStr, objStr, JSON.stringify(books),
                major_1_date || null, major_2_date || null, final_date || null]
        );
        res.status(201).json(rows[0]);
        await delCache("all_courses");
    } catch (err) {
        const errorMsg = err.detail || err.message || JSON.stringify(err);
        console.error("Course creation error:", errorMsg);
        res.status(500).json({ error: errorMsg });
    }
});

/** PUT /courses/:courseId */
app.put("/courses/:courseId", async (req, res) => {
    const { title, description, level, credits, difficulty,
        prerequisites, objectives, books, major_1_date, major_2_date, final_date } = req.body;
    try {
        if (!title || level === undefined) {
            return res.status(400).json({ error: "title and level are required" });
        }

        const prereqStr = Array.isArray(prerequisites) ? prerequisites.join(", ") : prerequisites || "";
        const objStr = Array.isArray(objectives) ? objectives.join("\n") : objectives || "";

        const { rows } = await pool.query(
            `UPDATE courses SET title=$1, description=$2, level=$3, credits=$4, difficulty=$5,
        prerequisites=$6, objectives=$7, books=$8,
        major_1_date=$9, major_2_date=$10, final_date=$11
       WHERE course_id=$12 RETURNING *`,
            [title, description, level, credits, difficulty,
                prereqStr, objStr, JSON.stringify(books),
                major_1_date || null, major_2_date || null, final_date || null,
                req.params.courseId]
        );
        if (!rows.length) return res.status(404).json({ error: "Course not found" });
        res.json(rows[0]);
        await delCache("all_courses");
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update course" });
    }
});

/** DELETE /api/courses/:courseId */
app.delete("/courses/:courseId", async (req, res) => {
    try {
        await pool.query("DELETE FROM courses WHERE course_id=$1", [req.params.courseId]);
        await delCache("all_courses");
        res.json({ message: "Deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete course" });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  RESOURCES
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/resources?courseId=EE201 — list resources (optionally filtered) */
app.get("/resources", async (req, res) => {
    try {
        const { courseId } = req.query;
        let query = "SELECT * FROM resources";
        const params = [];
        if (courseId) {
            query += " WHERE course_id = $1";
            params.push(courseId);
        }
        query += " ORDER BY id";
        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch resources" });
    }
});

/** POST /api/resources */
app.post("/resources", async (req, res) => {
    const { course_id, resource_title, url, category, sub_category, semester, chapter, unit } = req.body;
    try {
        const { rows } = await pool.query(
            `INSERT INTO resources (course_id, resource_title, url, category, sub_category, semester, chapter, unit)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [course_id, resource_title, url, category, sub_category || null, semester || null, chapter || null, unit || null]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create resource" });
    }
});

/** PUT /api/resources/:id */
app.put("/resources/:id", async (req, res) => {
    const { resource_title, url, category, sub_category, semester, chapter, unit } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE resources SET resource_title=$1, url=$2, category=$3,
        sub_category=$4, semester=$5, chapter=$6, unit=$7
       WHERE id=$8 RETURNING *`,
            [resource_title, url, category, sub_category || null, semester || null, chapter || null, unit || null, req.params.id]
        );
        if (!rows.length) return res.status(404).json({ error: "Resource not found" });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update resource" });
    }
});

/** DELETE /api/resources/:id */
app.delete("/resources/:id", async (req, res) => {
    try {
        await pool.query("DELETE FROM resources WHERE id=$1", [req.params.id]);
        res.json({ message: "Deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete resource" });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  EVENTS
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/events */
app.get("/events", async (_req, res) => {
    try {
        const { rows } = await pool.query(
            "SELECT * FROM events ORDER BY start_date DESC"
        );
        // Parse image field if it's a JSON string
        const parsed = rows.map(e => ({
            ...e,
            image: tryParseJson(e.image),
        }));
        res.json(parsed);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch events" });
    }
});

/** POST /api/events (with optional image upload) */
app.post("/events", upload.single("image"), async (req, res) => {
    const { event_title, description, category, location, time,
        start_date, end_date, status, registration_link } = req.body;
    let image = null;
    if (req.file) {
        const token = req.file.filename;
        image = JSON.stringify([{ token, name: req.file.originalname }]);
    }
    try {
        const { rows } = await pool.query(
            `INSERT INTO events (event_title, description, category, location, time,
                           start_date, end_date, status, registration_link, image)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
            [event_title, description, category, location, time,
                start_date, end_date, status, registration_link, image]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create event" });
    }
});

/** PUT /api/events/:id */
app.put("/events/:id", upload.single("image"), async (req, res) => {
    const { event_title, description, category, location, time,
        start_date, end_date, status, registration_link } = req.body;
    try {
        // Get existing image if no new file was uploaded
        let imageUpdate = "";
        const params = [event_title, description, category, location, time,
            start_date, end_date, status, registration_link];
        if (req.file) {
            const token = req.file.filename;
            params.push(JSON.stringify([{ token, name: req.file.originalname }]));
            imageUpdate = `, image=$${params.length}`;
        }
        params.push(req.params.id);
        const { rows } = await pool.query(
            `UPDATE events SET event_title=$1, description=$2, category=$3, location=$4, time=$5,
        start_date=$6, end_date=$7, status=$8, registration_link=$9${imageUpdate}
       WHERE id=$${params.length} RETURNING *`,
            params
        );
        if (!rows.length) return res.status(404).json({ error: "Event not found" });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update event" });
    }
});

/** DELETE /api/events/:id */
app.delete("/events/:id", async (req, res) => {
    try {
        await pool.query("DELETE FROM events WHERE id=$1", [req.params.id]);
        res.json({ message: "Deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete event" });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  MEMBERS
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/members */
app.get("/members", async (_req, res) => {
    try {
        const { rows } = await pool.query(
            "SELECT * FROM members ORDER BY sort_order"
        );
        const parsed = rows.map(m => ({ ...m, image: tryParseJson(m.image) }));
        res.json(parsed);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch members" });
    }
});

/** POST /members */
app.post("/members", upload.single("image"), async (req, res) => {
    const { name, role, linkedin, sort_order, term } = req.body;
    let image = null;
    if (req.file) {
        image = JSON.stringify([{ token: req.file.filename, name: req.file.originalname }]);
    }
    try {
        const { rows } = await pool.query(
            `INSERT INTO members (name, role, linkedin, sort_order, term, image)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [name, role, linkedin, sort_order || 0, term || '1', image]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create member" });
    }
});

/** PUT /members/:id */
app.put("/members/:id", upload.single("image"), async (req, res) => {
    const { name, role, linkedin, sort_order, term } = req.body;
    try {
        let imageUpdate = "";
        const params = [name, role, linkedin, sort_order, term];
        if (req.file) {
            params.push(JSON.stringify([{ token: req.file.filename, name: req.file.originalname }]));
            imageUpdate = `, image=$${params.length}`;
        }
        params.push(req.params.id);
        const { rows } = await pool.query(
            `UPDATE members SET name=$1, role=$2, linkedin=$3,
        sort_order=$4, term=$5${imageUpdate}
       WHERE id=$${params.length} RETURNING *`,
            params
        );
        if (!rows.length) return res.status(404).json({ error: "Member not found" });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update member" });
    }
});

/** DELETE /api/members/:id */
app.delete("/members/:id", async (req, res) => {
    try {
        await pool.query("DELETE FROM members WHERE id=$1", [req.params.id]);
        res.json({ message: "Deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete member" });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  CLUB STATS
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /stats (cached) */
app.get("/stats", async (_req, res) => {
    try {
        const cacheKey = "club_stats";
        const cachedData = await getCache(cacheKey);
        if (cachedData) return res.json(JSON.parse(cachedData));

        const { rows } = await pool.query("SELECT * FROM club_stats LIMIT 1");
        const data = rows[0] || null;
        if (data) await setCache(cacheKey, JSON.stringify(data), { EX: 3600 });
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

/** PUT /api/stats — update the single stats row */
app.put("/stats", async (req, res) => {
    const { active_members, workshops_per_year, industry_partners, current_term,
        commitment_percentage, club_email, club_insta, club_linked, club_location, club_x } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE club_stats SET
        active_members=$1, workshops_per_year=$2, industry_partners=$3,
        current_term=$4, commitment_percentage=$5, club_email=$6,
        club_insta=$7, club_linked=$8, club_location=$9, club_x=$10
       WHERE id=(SELECT id FROM club_stats LIMIT 1)
       RETURNING *`,
            [active_members, workshops_per_year, industry_partners, current_term,
                commitment_percentage, club_email, club_insta, club_linked, club_location, club_x]
        );
        res.json(rows[0]);
        await delCache("club_stats");
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update stats" });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  IMAGE PROXY
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /image?token=<filename> */
app.get("/image", (req, res) => {
    const token = req.query.token;
    if (!token) return res.status(400).json({ error: "Missing token" });
    const filePath = path.join(UPLOADS_DIR, String(token));
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Image not found" });
    res.sendFile(filePath);
});

// ═══════════════════════════════════════════════════════════════════════════════
//  PDF UPLOAD & DOWNLOAD
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /upload/pdf
 * Body: multipart/form-data with field "file" (PDF)
 * Returns: { filename, url } — store url in courses.books
 */
app.post("/upload/pdf", uploadPdf.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No PDF file uploaded" });
    res.status(201).json({
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: `/files/${req.file.filename}`,
    });
});

/**
 * GET /files/:filename
 * Serves the PDF as a downloadable attachment
 */
app.get("/files/:filename", (req, res) => {
    const filePath = path.join(FILES_DIR, req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });
    res.download(filePath); // sets Content-Disposition: attachment
});

/**
 * PUT /courses/:courseId/books
 * Body: { books: [{title, file}] }  — update just the books list
 */
app.put("/courses/:courseId/books", async (req, res) => {
    const { books } = req.body; // array of { title, file }
    try {
        const { rows } = await pool.query(
            `UPDATE courses SET books=$1 WHERE course_id=$2 RETURNING *`,
            [JSON.stringify(books), req.params.courseId]
        );
        if (!rows.length) return res.status(404).json({ error: "Course not found" });
        res.json({ ...rows[0], books: tryParseJson(rows[0].books) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update books" });
    }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function tryParseJson(value) {
    if (!value) return null;
    if (typeof value !== "string") return value;
    try { return JSON.parse(value); } catch { return value; }
}

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`✅  EEC backend running → http://localhost:${PORT}`);
    console.log(`   DB  : ${process.env.DATABASE_URL}`);
});
