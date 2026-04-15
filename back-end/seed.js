// seed.js — populate the eeclub database with sample data
// Run: node seed.js

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ── Courses ──────────────────────────────────────────────────────────────
    const courses = [
      {
        course_id: "EE200",
        title: "Electric Circuit I",
        description: "Fundamentals of DC and AC circuit analysis including Kirchhoff's laws, Thevenin/Norton theorems, and phasor analysis.",
        level: 2,
        credits: 3,
        difficulty: 3.0,
        prerequisites: "",
        objectives: "Analyze DC circuits,Apply Kirchhoff's laws,Understand AC phasors,Apply Thevenin and Norton theorems",
      },
      {
        course_id: "EE201",
        title: "Electric Circuit II",
        description: "Continuation of circuit theory covering Laplace transforms, frequency response, two-port networks, and filters.",
        level: 2,
        credits: 3,
        difficulty: 3.5,
        prerequisites: "EE200",
        objectives: "Apply Laplace transforms,Analyze frequency response,Design filters,Understand two-port networks",
      },
      {
        course_id: "EE303",
        title: "Signals and Systems",
        description: "Continuous and discrete time signals, LTI systems, Fourier series, Fourier transform, sampling theorem, and Z-transform.",
        level: 3,
        credits: 3,
        difficulty: 4.0,
        prerequisites: "EE201,MATH201",
        objectives: "Analyze LTI systems,Apply Fourier analysis,Understand sampling,Work with Z-transforms",
      },
      {
        course_id: "EE305",
        title: "Electronics I",
        description: "Semiconductor devices, diodes, BJT and FET transistors, biasing, and small-signal models.",
        level: 3,
        credits: 3,
        difficulty: 3.5,
        prerequisites: "EE201",
        objectives: "Understand semiconductor physics,Analyze diode circuits,Design BJT amplifiers,Model FET transistors",
      },
      {
        course_id: "EE400",
        title: "Electromagnetic Fields",
        description: "Vector calculus, electrostatics, magnetostatics, Maxwell's equations, and wave propagation.",
        level: 4,
        credits: 3,
        difficulty: 4.5,
        prerequisites: "EE303,MATH202",
        objectives: "Apply vector calculus,Solve electrostatic problems,Understand Maxwell's equations,Analyze wave propagation",
      },
    ];

    for (const c of courses) {
      await client.query(
        `INSERT INTO courses (course_id, title, description, level, credits, difficulty, prerequisites, objectives)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (course_id) DO NOTHING`,
        [c.course_id, c.title, c.description, c.level, c.credits, c.difficulty, c.prerequisites, c.objectives]
      );
    }
    console.log("✓ Courses seeded");

    // ── Resources ────────────────────────────────────────────────────────────
    const resources = [
      { course_id: "EE200", resource_title: "Chapter 1 – Basic Concepts", url: "#", category: "Lecture" },
      { course_id: "EE200", resource_title: "Chapter 2 – Resistive Circuits", url: "#", category: "Lecture" },
      { course_id: "EE200", resource_title: "Major 1 – Spring 2024", url: "#", category: "Exam" },
      { course_id: "EE200", resource_title: "Final Exam – Fall 2023", url: "#", category: "Exam" },
      { course_id: "EE200", resource_title: "Formula Sheet", url: "#", category: "Material" },

      { course_id: "EE201", resource_title: "Lecture 1 – Laplace Transform Intro", url: "#", category: "Lecture" },
      { course_id: "EE201", resource_title: "Lecture 2 – Frequency Response", url: "#", category: "Lecture" },
      { course_id: "EE201", resource_title: "Major 2 – Fall 2024", url: "#", category: "Exam" },
      { course_id: "EE201", resource_title: "Filter Design Notes", url: "#", category: "Material" },

      { course_id: "EE303", resource_title: "Fourier Series Slides", url: "#", category: "Lecture" },
      { course_id: "EE303", resource_title: "Z-Transform Summary", url: "#", category: "Material" },
      { course_id: "EE303", resource_title: "Final – Spring 2023", url: "#", category: "Exam" },
    ];

    for (const r of resources) {
      await client.query(
        `INSERT INTO resources (course_id, resource_title, url, category) VALUES ($1,$2,$3,$4)`,
        [r.course_id, r.resource_title, r.url, r.category]
      );
    }
    console.log("✓ Resources seeded");

    // ── Events ───────────────────────────────────────────────────────────────
    const events = [
      {
        event_title: "PCB Design Workshop",
        description: "A hands-on workshop covering Altium Designer basics, PCB layout best practices, and manufacturing considerations.",
        category: "Workshop",
        location: "Engineering Building, Lab 204",
        time: "2:00 PM – 5:00 PM",
        start_date: "2025-05-10",
        end_date: "2025-05-10",
        status: "Upcoming",
        registration_link: "#",
      },
      {
        event_title: "EEC Hackathon 2025",
        description: "48-hour hackathon where teams compete to build innovative electrical engineering solutions. Prizes up to 5000 SAR!",
        category: "Hackathon",
        location: "Student Activity Center",
        time: "9:00 AM",
        start_date: "2025-05-23",
        end_date: "2025-05-25",
        status: "Upcoming",
        registration_link: "#",
      },
      {
        event_title: "Career Day with STC",
        description: "Network with recruitors from Saudi Telecom Company. Learn about internship and graduate opportunities.",
        category: "Career",
        location: "King Fahd Hall",
        time: "10:00 AM – 3:00 PM",
        start_date: "2025-04-15",
        end_date: "2025-04-15",
        status: "Active",
        registration_link: "#",
      },
      {
        event_title: "Arduino & IoT Bootcamp",
        description: "Two-day bootcamp on microcontroller programming, sensor integration, and building real IoT projects.",
        category: "Workshop",
        location: "Engineering Lab 101",
        time: "9:00 AM – 4:00 PM",
        start_date: "2025-03-01",
        end_date: "2025-03-02",
        status: "Complete",
        registration_link: null,
      },
    ];

    for (const e of events) {
      await client.query(
        `INSERT INTO events (event_title, description, category, location, time, start_date, end_date, status, registration_link)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [e.event_title, e.description, e.category, e.location, e.time, e.start_date, e.end_date, e.status, e.registration_link]
      );
    }
    console.log("✓ Events seeded");

    // ── Members ──────────────────────────────────────────────────────────────
    const members = [
      { name: "Abdullah Al-Ghamdi", role: "Club President", linkedin: null, sort_order: 1, term: "Term 5" },
      { name: "Sara Al-Otaibi", role: "Vice President", linkedin: null, sort_order: 2, term: "Term 5" },
      { name: "Mazen Osama", role: "Web Developer", linkedin: null, sort_order: 3, term: "Term 4" },
      { name: "Khalid ElSayed", role: "Web Developer", linkedin: null, sort_order: 4, term: "Term 4" },
    ];

    for (const m of members) {
      await client.query(
        `INSERT INTO members (name, role, linkedin, sort_order, term) VALUES ($1,$2,$3,$4,$5)`,
        [m.name, m.role, m.linkedin, m.sort_order, m.term]
      );
    }
    console.log("✓ Members seeded");

    await client.query("COMMIT");
    console.log("\n🎉 Database seeded successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
