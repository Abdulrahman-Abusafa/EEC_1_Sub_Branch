"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Book } from "lucide-react";

type BookItem = { title: string; url: string; file?: File };

type Course = {
  course_name: string;
  title: string;
  description: string;
  level: string;
  credits: number;
  difficulty: string;
  prerequisites: string[];
  objectives: string[];
  books: BookItem[];
};

export default function CoursesAdmin() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  // Form State
  const [courseIdStr, setCourseIdStr] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("Undergraduate");
  const [credits, setCredits] = useState(3);
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [prereqStr, setPrereqStr] = useState("");
  const [objStr, setObjStr] = useState("");
  const [books, setBooks] = useState<BookItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCourses = async () => {
    try {
      const res = await fetch("http://localhost:4000/courses");
      if (res.ok) {
        setCourses(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const resetForm = () => {
    setCourseIdStr("");
    setCourseTitle("");
    setDescription("");
    setLevel("Undergraduate");
    setCredits(3);
    setDifficulty("Intermediate");
    setPrereqStr("");
    setObjStr("");
    setBooks([]);
    setEditingCourseId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (c: Course) => {
    setEditingCourseId(c.course_name);
    setCourseIdStr(c.course_name);
    setCourseTitle(c.title);
    setDescription(c.description || "");
    setLevel(c.level || "Undergraduate");
    setCredits(c.credits || 3);
    setDifficulty(c.difficulty || "Intermediate");
    setPrereqStr(c.prerequisites ? c.prerequisites.join(", ") : "");
    setObjStr(c.objectives ? c.objectives.join("\\n") : "");
    setBooks(c.books || []);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      await fetch(`http://localhost:4000/courses/${id}`, { method: "DELETE" });
      fetchCourses();
    } catch (e) {
      console.error(e);
    }
  };

  const uploadBookAndGetUrl = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("http://localhost:4000/upload/pdf", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("PDF upload failed");
    const data = await res.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Upload any new PDFs first
      const processedBooks = await Promise.all(
        books.map(async (b) => {
          if (b.file) {
            const url = await uploadBookAndGetUrl(b.file);
            return { title: b.title, url };
          }
          return { title: b.title, url: b.url };
        })
      );

      // 2. Prepare payload
      const payload = {
        course_id: courseIdStr,
        title: courseTitle,
        description,
        level,
        credits: Number(credits),
        difficulty,
        prerequisites: prereqStr.split(",").map(s => s.trim()).filter(Boolean),
        objectives: objStr.split("\\n").map(s => s.trim()).filter(Boolean),
        books: processedBooks
      };

      const url = editingCourseId
        ? `http://localhost:4000/courses/${editingCourseId}`
        : "http://localhost:4000/courses";
      const method = editingCourseId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchCourses();
      } else {
        alert("Failed to save course");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred while saving the course");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto mt-24">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-orbitron)] text-gray-900 dark:text-white">Courses Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Add, edit, or remove club courses and resources.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-neon-blue text-white rounded-lg hover:bg-neon-blue/90 transition"
        >
          <Plus size={20} />
          Add Course
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800">
                <th className="p-4 font-semibold text-gray-900 dark:text-gray-200">Course ID</th>
                <th className="p-4 font-semibold text-gray-900 dark:text-gray-200">Title</th>
                <th className="p-4 font-semibold text-gray-900 dark:text-gray-200">Level</th>
                <th className="p-4 font-semibold text-gray-900 dark:text-gray-200">Credits</th>
                <th className="p-4 font-semibold text-gray-900 dark:text-gray-200">Difficulty</th>
                <th className="p-4 font-semibold text-gray-900 dark:text-gray-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">Loading courses...</td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No courses found.</td>
                </tr>
              ) : (
                courses.map((c) => (
                  <tr key={c.course_name} className="border-b border-gray-100 dark:border-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/20 transition">
                    <td className="p-4 font-bold text-neon-blue">{c.course_name}</td>
                    <td className="p-4 text-gray-800 dark:text-gray-300 font-medium">{c.title}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">{c.level}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">{c.credits}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">{c.difficulty}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(c)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(c.course_name)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl border border-gray-200 dark:border-zinc-800 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
             <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:hover:text-white">
               <X size={24} />
             </button>
             <div className="p-6">
                <h2 className="text-2xl font-bold dark:text-white mb-6 font-[family-name:var(--font-orbitron)]">
                  {editingCourseId ? "Edit Course" : "Add New Course"}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course ID</label>
                      <input type="text" value={courseIdStr} onChange={e => setCourseIdStr(e.target.value)} required disabled={!!editingCourseId} className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue disabled:opacity-50" placeholder="e.g. EE201" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                      <input type="text" value={courseTitle} onChange={e => setCourseTitle(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                      <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue"></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Level</label>
                      <input type="text" value={level} onChange={e => setLevel(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Credits</label>
                      <input type="number" value={credits} onChange={e => setCredits(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty</label>
                      <input type="text" value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prerequisites (comma separated)</label>
                      <input type="text" value={prereqStr} onChange={e => setPrereqStr(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue" placeholder="e.g. MATH102, PHYS102" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Objectives (one per line)</label>
                      <textarea value={objStr} onChange={e => setObjStr(e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue" placeholder="Understand X\nAnalyze Y..."></textarea>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-zinc-800">
                    <div className="flex justify-between items-center mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Course Materials (PDFs)</label>
                      <button type="button" onClick={() => setBooks([...books, { title: "", url: "" }])} className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-300 px-3 py-1 rounded">Add Material</button>
                    </div>
                    {books.map((b, i) => (
                      <div key={i} className="flex items-center gap-3 mb-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                        <Book size={16} className="text-gray-400" />
                        <input
                          type="text"
                          placeholder="Material Title"
                          value={b.title}
                          onChange={(e) => {
                            const newBooks = [...books];
                            newBooks[i].title = e.target.value;
                            setBooks(newBooks);
                          }}
                          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded bg-transparent dark:text-white outline-none"
                        />
                        <div className="flex-1">
                           {b.url && !b.file ? (
                             <span className="text-xs text-green-500 truncate block">Stored on server</span>
                           ) : (
                             <input type="file" accept="application/pdf" onChange={(e) => {
                               const newBooks = [...books];
                               newBooks[i].file = e.target.files?.[0] || undefined;
                               setBooks(newBooks);
                             }} className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-200 file:text-gray-700 dark:file:bg-zinc-700 dark:file:text-white" />
                           )}
                        </div>
                        <button type="button" onClick={() => setBooks(books.filter((_, idx) => idx !== i))} className="text-red-500 p-1 hover:bg-red-500/10 rounded"><X size={16} /></button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition" disabled={isSubmitting}>Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-neon-blue text-white rounded-lg hover:bg-neon-blue/90 transition disabled:opacity-50">
                      {isSubmitting ? "Saving..." : "Save Course"}
                    </button>
                  </div>
                </form>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
