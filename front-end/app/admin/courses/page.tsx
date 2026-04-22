"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Play, Calculator, BookOpen, FileText, Layers, ChevronDown } from "lucide-react";
import { fetchCourseResources, createResource, deleteResource, Resource } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type BookItem = { title: string; url: string; file?: File };

type Course = {
  course_name: string;
  title: string;
  description: string;
  level: number;
  credits: number;
  difficulty: number;
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
  const [level, setLevel] = useState(1);
  const [credits, setCredits] = useState(3);
  const [difficulty, setDifficulty] = useState(3.0);
  const [prereqStr, setPrereqStr] = useState("");
  const [objStr, setObjStr] = useState("");
  const [books, setBooks] = useState<BookItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resources State - restructured for bulk management
  const [videos, setVideos] = useState<{ title: string; url: string }[]>([]);
  type SingleBookNote = { type: 'single'; title: string; url: string; file?: File };
  type ListBookNote  = { type: 'list'; groupTitle: string; items: { title: string; url: string; file?: File }[] };
  type BookNoteEntry = SingleBookNote | ListBookNote;
  const [booksAndNotes, setBooksAndNotes] = useState<BookNoteEntry[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<number, boolean>>({});
  type ExamItem = { term: string; url: string; file?: File };
  type ChapterItem = { chapterName: string; url: string; file?: File };
  const [oldExams, setOldExams] = useState<{ major1: ExamItem[]; major2: ExamItem[]; final: ExamItem[] }>({ major1: [], major2: [], final: [] });
  const [byChapter, setByChapter] = useState<ChapterItem[]>([]);
  const [collapsedExams, setCollapsedExams] = useState<Record<string, boolean>>({ major1: true, major2: true, final: true, byChapter: true });

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${API_BASE}/courses`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCourses(data);
        } else {
          console.error("Invalid courses data format", data);
          alert("Error: Invalid courses format from server");
        }
      } else {
        console.error(`Failed to fetch courses: ${res.status} ${res.statusText}`);
        alert(`Failed to load courses: ${res.statusText || "Server error"}`);
      }
    } catch (e) {
      console.error("Error fetching courses:", e);
      alert(`Error loading courses: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async (courseId: string) => {
    try {
      const resourcesData = await fetchCourseResources(courseId);
      const videosList: { title: string; url: string }[] = [];
      const booksAndNotesEntries: BookNoteEntry[] = [];
      const examsData: { major1: ExamItem[]; major2: ExamItem[]; final: ExamItem[] } = { major1: [], major2: [], final: [] };
      const byChapterEntries: ChapterItem[] = [];
      const listGroups: Record<string, { title: string; url: string }[]> = {};

      resourcesData.forEach(resource => {
        if (resource.sub_category === 'Videos') {
          videosList.push({ title: resource.resource_title, url: resource.url });
        } else if (resource.sub_category === 'Books & Notes') {
          if (resource.unit) {
            if (!listGroups[resource.unit]) listGroups[resource.unit] = [];
            listGroups[resource.unit].push({ title: resource.resource_title, url: resource.url });
          } else {
            booksAndNotesEntries.push({ type: 'single', title: resource.resource_title, url: resource.url });
          }
        } else if (resource.sub_category === 'Major 1') {
          examsData.major1.push({ term: resource.semester || '', url: resource.url });
        } else if (resource.sub_category === 'Major 2') {
          examsData.major2.push({ term: resource.semester || '', url: resource.url });
        } else if (resource.sub_category === 'Final') {
          examsData.final.push({ term: resource.semester || '', url: resource.url });
        } else if (resource.sub_category === 'Chapter') {
          byChapterEntries.push({ chapterName: resource.chapter || resource.resource_title, url: resource.url });
        }
      });

      Object.entries(listGroups).forEach(([groupTitle, items]) => {
        booksAndNotesEntries.push({ type: 'list', groupTitle, items });
      });

      setVideos(videosList);
      setBooksAndNotes(booksAndNotesEntries);
      setOldExams(examsData);
      setByChapter(byChapterEntries);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const resetForm = () => {
    setCourseIdStr("");
    setCourseTitle("");
    setDescription("");
    setLevel(1);
    setCredits(3);
    setDifficulty(3.0);
    setPrereqStr("");
    setObjStr("");
    setBooks([]);
    setVideos([]);
    setBooksAndNotes([]);
    setOldExams({ major1: [], major2: [], final: [] });
    setByChapter([]);
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
    setLevel(typeof c.level === 'string' ? parseInt(c.level) : c.level || 1);
    setCredits(c.credits || 3);
    setDifficulty(typeof c.difficulty === 'string' ? parseFloat(c.difficulty) : c.difficulty || 3.0);
    setPrereqStr(Array.isArray(c.prerequisites) ? c.prerequisites.join(", ") : c.prerequisites || "");
    setObjStr(Array.isArray(c.objectives) ? c.objectives.join("\n") : c.objectives || "");
    setBooks(c.books || []);
    
    // Load existing resources into structured format
    fetchResources(c.course_name);
    
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      await fetch(`${API_BASE}/courses/${id}`, { method: "DELETE" });
      fetchCourses();
    } catch (e) {
      console.error(e);
    }
  };

  const uploadBookAndGetUrl = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/upload/pdf`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("PDF upload failed");
    const data = await res.json();
    return data.url;
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Validate required fields
      if (!courseIdStr.trim()) {
        alert("Course ID is required");
        setIsSubmitting(false);
        return;
      }
      if (!courseTitle.trim()) {
        alert("Course Title is required");
        setIsSubmitting(false);
        return;
      }

      // 1. Upload any new PDFs first
      const processedBooks = (await Promise.all(
        books.map(async (b) => {
          if (b.file) {
            const url = await uploadBookAndGetUrl(b.file);
            return { title: b.title, url };
          }
          return { title: b.title, url: b.url };
        })
      )).filter(b => b.title.trim()); // Filter out empty titles

      // 2. Prepare course payload
      const payload = {
        course_id: courseIdStr,
        title: courseTitle,
        description,
        level: Number(level),
        credits: Number(credits),
        difficulty: Number(difficulty),
        prerequisites: prereqStr.split(",").map(s => s.trim()).filter(Boolean),
        objectives: objStr.split("\n").map(s => s.trim()).filter(Boolean),
        books: processedBooks as Array<{ title: string; url: string }>
      };

      const url = editingCourseId
        ? `${API_BASE}/courses/${editingCourseId}`
        : `${API_BASE}/courses`;
      const method = editingCourseId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMsg = "Unknown error";
        try {
          const errorData = await res.json();
          errorMsg = typeof errorData.error === 'string' 
            ? errorData.error 
            : typeof errorData === 'object'
              ? Object.values(errorData).find(v => typeof v === 'string') as string || "Server error"
              : "Server error";
        } catch (e) {
          errorMsg = res.statusText || "Server error";
        }
        console.error("Server error response:", String(errorMsg).slice(0, 200));
        alert(`Failed to save course: ${String(errorMsg).slice(0, 200)}`);
        return;
      }

      // 3. Save resources for both add and edit flows
      await saveAllResources(courseIdStr);

      setIsModalOpen(false);
      fetchCourses();
    } catch (e) {
      console.error(e);
      alert("An error occurred while saving the course");
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveAllResources = async (courseId: string) => {
    try {
      // Delete existing resources
      try {
        const existingResources = await fetchCourseResources(courseId);
        await Promise.all(existingResources.map(r => deleteResource(r.id!)));
      } catch (e) {
        // If there are no resources yet, that's fine
        console.log("No existing resources to delete");
      }

      // Create new resources
      const allResources: Omit<Resource, 'id'>[] = [];

      // Add videos
      videos.forEach(video => {
        allResources.push({
          course_id: courseId,
          resource_title: video.title,
          url: video.url,
          category: 'Lecture',
          sub_category: 'Videos'
        });
      });

      // Add books and notes — upload any new PDF files first
      for (const entry of booksAndNotes) {
        if (entry.type === 'single') {
          let url = entry.url;
          if (entry.file) {
            const formData = new FormData();
            formData.append('file', entry.file);
            const uploadRes = await fetch(`${API_BASE}/upload/pdf`, { method: 'POST', body: formData });
            if (!uploadRes.ok) throw new Error('Books & Notes PDF upload failed');
            const uploadData = await uploadRes.json();
            url = `/api/files/${uploadData.filename}`;
          }
          if (!url) continue;
          allResources.push({ course_id: courseId, resource_title: entry.title, url, category: 'Material', sub_category: 'Books & Notes' });
        } else {
          for (const item of entry.items) {
            let url = item.url;
            if (item.file) {
              const formData = new FormData();
              formData.append('file', item.file);
              const uploadRes = await fetch(`${API_BASE}/upload/pdf`, { method: 'POST', body: formData });
              if (!uploadRes.ok) throw new Error('Books & Notes PDF upload failed');
              const uploadData = await uploadRes.json();
              url = `/api/files/${uploadData.filename}`;
            }
            if (!url) continue;
            allResources.push({ course_id: courseId, resource_title: item.title, url, category: 'Material', sub_category: 'Books & Notes', unit: entry.groupTitle });
          }
        }
      }

      // Add old exams — upload any new PDF files first
      const examLabels: Record<string, string> = { major1: 'Major 1', major2: 'Major 2', final: 'Final' };
      for (const [key, items] of Object.entries(oldExams) as [keyof typeof oldExams, ExamItem[]][]) {
        for (const item of items) {
          let url = item.url;
          if (item.file) {
            const formData = new FormData();
            formData.append('file', item.file);
            const uploadRes = await fetch(`${API_BASE}/upload/pdf`, { method: 'POST', body: formData });
            if (!uploadRes.ok) throw new Error('Exam PDF upload failed');
            const uploadData = await uploadRes.json();
            url = `/api/files/${uploadData.filename}`;
          }
          if (!url) continue;
          allResources.push({ course_id: courseId, resource_title: `${examLabels[key]} Exam - ${item.term}`, url, category: 'Exam', sub_category: examLabels[key], semester: item.term });
        }
      }

      // Add by-chapter items
      for (const item of byChapter) {
        let url = item.url;
        if (item.file) {
          const formData = new FormData();
          formData.append('file', item.file);
          const uploadRes = await fetch(`${API_BASE}/upload/pdf`, { method: 'POST', body: formData });
          if (!uploadRes.ok) throw new Error('Chapter PDF upload failed');
          const uploadData = await uploadRes.json();
          url = `/api/files/${uploadData.filename}`;
        }
        if (!url) continue;
        allResources.push({ course_id: courseId, resource_title: item.chapterName, url, category: 'Exam', sub_category: 'Chapter', chapter: item.chapterName });
      }

      // Save all resources
      if (allResources.length > 0) {
        await Promise.all(allResources.map(resource => createResource(resource)));
      }
    } catch (e) {
      console.error('Failed to save resources:', e);
      // Don't throw - allow course to be saved even if resources fail
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Level (1-5)</label>
                      <input type="number" min="1" max="5" value={level} onChange={e => setLevel(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Credits</label>
                      <input type="number" value={credits} onChange={e => setCredits(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty (0.0-5.0)</label>
                      <input type="number" min="0" max="5" step="0.1" value={difficulty} onChange={e => setDifficulty(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue" />
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
                    <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Course Resources</h3>

                    {/* Videos Section */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Play size={16} className="text-neon-blue" />
                          Videos Section
                        </h4>
                        <button
                          type="button"
                          onClick={() => setVideos([...videos, { title: "", url: "" }])}
                          className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-300 px-3 py-1 rounded"
                        >
                          Add Playlist
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Add multiple direct links to video explanations. Each link should lead to a playlist.</p>
                      {videos.map((video, i) => (
                        <div key={i} className="flex items-center gap-3 mb-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-8">{i + 1}.</span>
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Playlist Title (e.g., Complete EE201 Playlist)"
                              value={video.title}
                              onChange={(e) => {
                                const newVideos = [...videos];
                                newVideos[i].title = e.target.value;
                                setVideos(newVideos);
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded bg-transparent dark:text-white outline-none focus:border-neon-blue"
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="url"
                              placeholder="Playlist URL"
                              value={video.url}
                              onChange={(e) => {
                                const newVideos = [...videos];
                                newVideos[i].url = e.target.value;
                                setVideos(newVideos);
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded bg-transparent dark:text-white outline-none focus:border-neon-blue"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setVideos(videos.filter((_, idx) => idx !== i))}
                            className="text-red-500 p-2 hover:bg-red-500/10 rounded"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      {videos.length === 0 && (
                        <p className="text-sm text-gray-400 dark:text-gray-500 italic">No video playlists added yet</p>
                      )}
                    </div>

                    {/* Books & Notes Section */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <BookOpen size={16} className="text-neon-blue" />
                          Books & Notes Section
                        </h4>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setBooksAndNotes([...booksAndNotes, { type: 'single', title: '', url: '', file: undefined }])}
                            className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <FileText size={13} /> Add Single
                          </button>
                          <button
                            type="button"
                            onClick={() => setBooksAndNotes([...booksAndNotes, { type: 'list', groupTitle: '', items: [{ title: '', url: '' }] }])}
                            className="flex items-center gap-1.5 text-xs bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue px-3 py-1.5 rounded-lg border border-neon-blue/20 transition-colors"
                          >
                            <Layers size={13} /> Add List
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        {booksAndNotes.length === 0 && (
                          <p className="text-sm text-gray-400 dark:text-gray-500 italic py-2">No books or notes added yet</p>
                        )}

                        {booksAndNotes.map((entry, i) => entry.type === 'single' ? (
                          // ── Single Item ──
                          <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg">
                            <FileText size={15} className="text-gray-400 dark:text-white/30 flex-shrink-0" />
                            <div className="flex-1">
                              <input
                                type="text"
                                placeholder="Title (e.g. Main Textbook)"
                                value={entry.title}
                                onChange={(e) => {
                                  const next = [...booksAndNotes];
                                  (next[i] as SingleBookNote).title = e.target.value;
                                  setBooksAndNotes(next);
                                }}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded bg-transparent dark:text-white outline-none focus:border-neon-blue"
                              />
                            </div>
                            <div className="flex-1">
                              {entry.url && !entry.file ? (
                                <span className="text-xs text-green-500 flex items-center gap-1">✓ Uploaded</span>
                              ) : (
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const next = [...booksAndNotes];
                                    next[i] = { ...(next[i] as SingleBookNote), file };
                                    setBooksAndNotes(next);
                                  }}
                                  className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-200 file:text-gray-700 dark:file:bg-zinc-700 dark:file:text-white"
                                />
                              )}
                            </div>
                            <button type="button" onClick={() => setBooksAndNotes(booksAndNotes.filter((_, idx) => idx !== i))} className="text-red-500 p-1.5 hover:bg-red-500/10 rounded flex-shrink-0">
                              <X size={15} />
                            </button>
                          </div>
                        ) : (
                          // ── List Group ──
                          <div key={i} className="border border-neon-blue/20 rounded-xl overflow-hidden">
                            {/* Group Header */}
                            <div className="flex items-center gap-3 px-4 py-3 bg-neon-blue/5 border-b border-neon-blue/10">
                              <Layers size={15} className="text-neon-blue flex-shrink-0" />
                              <input
                                type="text"
                                placeholder="List title (e.g. Lecture Slides)"
                                value={entry.groupTitle}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBooksAndNotes(prev => prev.map((en, idx) =>
                                    idx === i ? { ...(en as ListBookNote), groupTitle: val } : en
                                  ));
                                }}
                                className="flex-1 px-3 py-1.5 text-sm font-medium border border-transparent focus:border-neon-blue/40 rounded bg-transparent dark:text-white outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => setCollapsedGroups(prev => ({ ...prev, [i]: !prev[i] }))}
                                className="p-1.5 hover:bg-neon-blue/10 rounded text-neon-blue flex-shrink-0"
                              >
                                <ChevronDown size={15} className={`transition-transform duration-200 ${collapsedGroups[i] ? "-rotate-90" : ""}`} />
                              </button>
                              <button type="button" onClick={() => setBooksAndNotes(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 p-1.5 hover:bg-red-500/10 rounded flex-shrink-0">
                                <X size={15} />
                              </button>
                            </div>

                            {/* List Items */}
                            <div className={`p-3 flex flex-col gap-2 ${collapsedGroups[i] ? "hidden" : ""}`}>
                              {entry.items.map((item, j) => (
                                <div key={j} className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                                  <span className="text-xs font-mono text-gray-400 dark:text-white/30 w-5 text-center">{j + 1}</span>
                                  <div className="flex-1">
                                    <input
                                      type="text"
                                      placeholder={`Item ${j + 1} title`}
                                      value={item.title}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setBooksAndNotes(prev => prev.map((en, idx) => {
                                          if (idx !== i) return en;
                                          const l = en as ListBookNote;
                                          return { ...l, items: l.items.map((it, jdx) => jdx === j ? { ...it, title: val } : it) };
                                        }));
                                      }}
                                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded bg-transparent dark:text-white outline-none focus:border-neon-blue"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    {item.url && !item.file ? (
                                      <span className="text-xs text-green-500">✓ Uploaded</span>
                                    ) : (
                                      <input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          setBooksAndNotes(prev => prev.map((en, idx) => {
                                            if (idx !== i) return en;
                                            const l = en as ListBookNote;
                                            return { ...l, items: l.items.map((it, jdx) => jdx === j ? { ...it, file } : it) };
                                          }));
                                        }}
                                        className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-200 file:text-gray-700 dark:file:bg-zinc-700 dark:file:text-white"
                                      />
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setBooksAndNotes(prev => prev.map((en, idx) => {
                                      if (idx !== i) return en;
                                      const l = en as ListBookNote;
                                      return { ...l, items: l.items.filter((_, jdx) => jdx !== j) };
                                    }))}
                                    className="text-red-500 p-1 hover:bg-red-500/10 rounded flex-shrink-0"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              ))}

                              <button
                                type="button"
                                onClick={() => setBooksAndNotes(prev => prev.map((en, idx) => {
                                  if (idx !== i) return en;
                                  const l = en as ListBookNote;
                                  return { ...l, items: [...l.items, { title: '', url: '' }] };
                                }))}
                                className="mt-1 flex items-center gap-1.5 text-xs text-neon-blue hover:text-neon-blue/80 px-2 py-1.5 rounded transition-colors self-start"
                              >
                                <Plus size={13} /> Add Item
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Old Exams Section */}
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                        <Calculator size={16} className="text-neon-blue" />
                        Old Exams Section
                      </h4>

                      {(['major1', 'major2', 'final'] as const).map((examType) => {
                        const label = examType === 'major1' ? 'Major 1' : examType === 'major2' ? 'Major 2' : 'Final';
                        const items = oldExams[examType];
                        const isOpen = !collapsedExams[examType];
                        return (
                          <div key={examType} className="mb-3 border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden">
                            {/* Collapsible Header */}
                            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-zinc-800/50">
                              <button
                                type="button"
                                onClick={() => setCollapsedExams(prev => ({ ...prev, [examType]: !prev[examType] }))}
                                className="flex items-center gap-2 font-medium text-gray-800 dark:text-gray-200 flex-1 text-left"
                              >
                                <ChevronDown size={15} className={`text-neon-blue transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                {label} Exams
                                {items.length > 0 && <span className="text-xs font-mono text-gray-400 dark:text-white/30">{items.length} files</span>}
                              </button>
                              {isOpen && (
                                <button
                                  type="button"
                                  onClick={() => setOldExams(prev => ({ ...prev, [examType]: [...prev[examType], { term: '', url: '' }] }))}
                                  className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg"
                                >
                                  + Add
                                </button>
                              )}
                            </div>

                            {/* Items */}
                            {isOpen && (
                              <div className="p-3 flex flex-col gap-2">
                                {items.length === 0 && (
                                  <p className="text-sm text-gray-400 dark:text-gray-500 italic px-1">No exams added yet</p>
                                )}
                                {items.map((item, i) => (
                                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                                    <input
                                      type="text"
                                      placeholder="Term (e.g. 241)"
                                      value={item.term}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setOldExams(prev => ({ ...prev, [examType]: prev[examType].map((it, idx) => idx === i ? { ...it, term: val } : it) }));
                                      }}
                                      className="w-40 shrink-0 px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded bg-transparent dark:text-white outline-none focus:border-neon-blue"
                                    />
                                    <div className="flex-1">
                                      {item.url && !item.file ? (
                                        <span className="text-xs text-green-500">✓ Uploaded</span>
                                      ) : (
                                        <input type="file" accept="application/pdf"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            setOldExams(prev => ({ ...prev, [examType]: prev[examType].map((it, idx) => idx === i ? { ...it, file } : it) }));
                                          }}
                                          className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-200 file:text-gray-700 dark:file:bg-zinc-700 dark:file:text-white"
                                        />
                                      )}
                                    </div>
                                    <button type="button" onClick={() => setOldExams(prev => ({ ...prev, [examType]: prev[examType].filter((_, idx) => idx !== i) }))} className="text-red-500 p-1 hover:bg-red-500/10 rounded shrink-0">
                                      <X size={15} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* By Chapter Section */}
                      <div className="mb-3 border border-neon-blue/20 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-neon-blue/5">
                          <button type="button" onClick={() => setCollapsedExams(prev => ({ ...prev, byChapter: !prev.byChapter }))}
                            className="flex items-center gap-2 font-medium text-gray-800 dark:text-gray-200 flex-1 text-left">
                            <ChevronDown size={15} className={`text-neon-blue transition-transform duration-200 ${!collapsedExams.byChapter ? 'rotate-180' : ''}`} />
                            By Chapter
                            {byChapter.length > 0 && <span className="text-xs font-mono text-gray-400 dark:text-white/30">{byChapter.length} files</span>}
                          </button>
                          {!collapsedExams.byChapter && (
                            <button type="button" onClick={() => setByChapter(prev => [...prev, { chapterName: '', url: '' }])}
                              className="text-xs bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue border border-neon-blue/20 px-3 py-1.5 rounded-lg">
                              + Add
                            </button>
                          )}
                        </div>
                        {!collapsedExams.byChapter && (
                          <div className="p-3 flex flex-col gap-2">
                            {byChapter.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500 italic px-1">No chapters added yet</p>}
                            {byChapter.map((item, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                                <input type="text" placeholder="Chapter name" value={item.chapterName}
                                  onChange={(e) => { const val = e.target.value; setByChapter(prev => prev.map((it, idx) => idx === i ? { ...it, chapterName: val } : it)); }}
                                  className="w-40 shrink-0 px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded bg-transparent dark:text-white outline-none focus:border-neon-blue"
                                />
                                <div className="flex-1">
                                  {item.url && !item.file ? (
                                    <span className="text-xs text-green-500">✓ Uploaded</span>
                                  ) : (
                                    <input type="file" accept="application/pdf"
                                      onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; setByChapter(prev => prev.map((it, idx) => idx === i ? { ...it, file } : it)); }}
                                      className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-200 file:text-gray-700 dark:file:bg-zinc-700 dark:file:text-white"
                                    />
                                  )}
                                </div>
                                <button type="button" onClick={() => setByChapter(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 p-1 hover:bg-red-500/10 rounded shrink-0">
                                  <X size={15} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
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
