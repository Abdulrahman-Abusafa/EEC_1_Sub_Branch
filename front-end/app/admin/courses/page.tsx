"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Edit2, Trash2, X, Play, Calculator, BookOpen, FileText, Layers, ChevronDown, ChevronUp, HelpCircle, UploadCloud, CheckCircle2, AlertCircle, Info, ClipboardList } from "lucide-react";
import { fetchCourseResources, createResource, deleteResource, Resource, API_BASE } from "@/lib/api";

const MAX_PDF_MB = 200;
const MAX_FILENAME_LENGTH = 32;

function truncateFilename(name: string, maxLength = MAX_FILENAME_LENGTH): string {
  if (name.length <= maxLength) return name;
  const dotIndex = name.lastIndexOf(".");
  const ext = dotIndex > 0 ? name.slice(dotIndex + 1) : "";
  const base = dotIndex > 0 ? name.slice(0, dotIndex) : name;
  const keep = Math.max(maxLength - ext.length - 3, 4);
  return ext ? `${base.slice(0, keep)}...${ext}` : `${name.slice(0, maxLength - 3)}...`;
}

function ExamFileDrop({ selectedFile, onFile, onReject }: { selectedFile?: File; onFile: (file: File) => void; onReject: (msg: string) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    const looksLikePdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!looksLikePdf) {
      onReject(`"${file.name}" isn't a PDF`);
      return;
    }
    if (file.size > MAX_PDF_MB * 1024 * 1024) {
      onReject(`"${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)} MB — max is ${MAX_PDF_MB} MB`);
      return;
    }
    onFile(file);
  };

  if (selectedFile) {
    return (
      <div
        onClick={() => inputRef.current?.click()}
        className="w-full flex items-center justify-between gap-1.5 text-xs px-3 py-2 border border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400 rounded cursor-pointer"
      >
        <span className="flex items-center gap-1.5 truncate">
          <CheckCircle2 size={13} className="shrink-0" />
          <span className="truncate" title={selectedFile.name}>{truncateFilename(selectedFile.name)}</span>
          <span className="text-green-600/70 dark:text-green-400/70 shrink-0">({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
        </span>
        <span className="underline shrink-0">Change</span>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
      className={`w-full flex items-center justify-center gap-1.5 text-xs px-3 py-2 border border-dashed rounded cursor-pointer transition-colors ${
        dragOver
          ? "border-neon-blue bg-neon-blue/10 text-neon-blue"
          : "border-gray-300 dark:border-zinc-700 text-gray-500 dark:text-gray-400 hover:border-neon-blue/50 hover:text-neon-blue"
      }`}
    >
      <UploadCloud size={13} className="shrink-0" />
      <span>{dragOver ? "Drop PDF here" : "Drag PDF or click to browse"}</span>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
        className="hidden"
      />
    </div>
  );
}

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
  syllabus?: string | null;
  industry_overview?: string | null;
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
  const [syllabus, setSyllabus] = useState("");
  const [industryOverview, setIndustryOverview] = useState("");
  const [books, setBooks] = useState<BookItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resources State - restructured for bulk management
  const [videos, setVideos] = useState<{ title: string; url: string }[]>([]);
  type ExamFileItem = { title: string; url: string; file?: File };
  type SingleQuizItem = { type: 'single'; title: string; url: string; file?: File };
  type QuizFolderItem = { type: 'folder'; folderName: string; items: ExamFileItem[] };
  type QuizEntry = SingleQuizItem | QuizFolderItem;
  const [quizzes, setQuizzes] = useState<QuizEntry[]>([]);
  type SingleBookNote = { type: 'single'; title: string; url: string; file?: File };
  type ListBookNote  = { type: 'list'; groupTitle: string; items: { title: string; url: string; file?: File }[] };
  type BookNoteEntry = SingleBookNote | ListBookNote;
  const [booksAndNotes, setBooksAndNotes] = useState<BookNoteEntry[]>([]);
  type SingleHomework = { type: 'single'; title: string; url: string; file?: File };
  type HomeworkFolder = { type: 'folder'; folderName: string; items: ExamFileItem[] };
  type HomeworkEntry = SingleHomework | HomeworkFolder;
  const [homeworks, setHomeworks] = useState<HomeworkEntry[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<number, boolean>>({});
  type SingleExamItem = { type: 'single'; term: string; url: string; file?: File };
  type ExamFolderItem = { type: 'folder'; folderName: string; items: ExamFileItem[] };
  type ExamEntry = SingleExamItem | ExamFolderItem;
  type SingleChapterItem = { type: 'single'; chapterName: string; url: string; file?: File };
  type ChapterFolderItem = { type: 'folder'; folderName: string; items: ExamFileItem[] };
  type ChapterEntry = SingleChapterItem | ChapterFolderItem;
  const [oldExams, setOldExams] = useState<{ major1: ExamEntry[]; major2: ExamEntry[]; final: ExamEntry[] }>({ major1: [], major2: [], final: [] });
  const [byChapter, setByChapter] = useState<ChapterEntry[]>([]);
  const [collapsedExamFolders, setCollapsedExamFolders] = useState<Record<string, boolean>>({});
  const [collapsedExams, setCollapsedExams] = useState<Record<string, boolean>>({ major1: true, major2: true, final: true, byChapter: true, quizzes: true, videos: true, homeworks: true });

  // Toasts
  type Toast = { id: number; type: 'success' | 'error' | 'info'; message: string };
  const [toasts, setToasts] = useState<Toast[]>([]);
  const pushToast = (type: Toast['type'], message: string) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
  };

  // Upload progress
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number; percent: number } | null>(null);
  const uploadPdfWithProgress = (file: File, onProgress: (pct: number) => void): Promise<{ filename: string; url: string }> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/upload/pdf`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({ filename: data.filename, url: `/api/files/${data.filename}` });
          } catch {
            reject(new Error('Invalid server response'));
          }
        } else {
          let msg = `Upload failed (${xhr.status})`;
          try { const data = JSON.parse(xhr.responseText); if (data.error) msg = data.error; } catch { /* ignore */ }
          reject(new Error(msg));
        }
      };
      xhr.onerror = () => reject(new Error('Network error during upload'));
      const formData = new FormData();
      formData.append('file', file);
      xhr.send(formData);
    });
  };

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
      const quizEntries: QuizEntry[] = [];
      const quizFolders: Record<string, ExamFileItem[]> = {};
      const booksAndNotesEntries: BookNoteEntry[] = [];
      const listGroups: Record<string, { title: string; url: string }[]> = {};
      const homeworkEntries: HomeworkEntry[] = [];
      const homeworkFolders: Record<string, ExamFileItem[]> = {};
      const examBuckets: { major1: Record<string, ExamFileItem[]>; major2: Record<string, ExamFileItem[]>; final: Record<string, ExamFileItem[]> } = { major1: {}, major2: {}, final: {} };
      const chapterBuckets: Record<string, ExamFileItem[]> = {};
      const examSubCatToKey: Record<string, 'major1' | 'major2' | 'final'> = { 'Major 1': 'major1', 'Major 2': 'major2', 'Final': 'final' };

      resourcesData.forEach(resource => {
        if (resource.sub_category === 'Videos') {
          videosList.push({ title: resource.resource_title, url: resource.url });
        } else if (resource.sub_category === 'Quizzes') {
          if (resource.unit) {
            if (!quizFolders[resource.unit]) quizFolders[resource.unit] = [];
            quizFolders[resource.unit].push({ title: resource.resource_title, url: resource.url });
          } else {
            quizEntries.push({ type: 'single', title: resource.resource_title, url: resource.url });
          }
        } else if (resource.sub_category === 'Books & Notes') {
          if (resource.unit) {
            if (!listGroups[resource.unit]) listGroups[resource.unit] = [];
            listGroups[resource.unit].push({ title: resource.resource_title, url: resource.url });
          } else {
            booksAndNotesEntries.push({ type: 'single', title: resource.resource_title, url: resource.url });
          }
        } else if (resource.sub_category === 'Homeworks') {
          if (resource.unit) {
            if (!homeworkFolders[resource.unit]) homeworkFolders[resource.unit] = [];
            homeworkFolders[resource.unit].push({ title: resource.resource_title, url: resource.url });
          } else {
            homeworkEntries.push({ type: 'single', title: resource.resource_title, url: resource.url });
          }
        } else if (resource.sub_category && examSubCatToKey[resource.sub_category]) {
          const key = examSubCatToKey[resource.sub_category];
          const bucketKey = resource.semester || '';
          if (!examBuckets[key][bucketKey]) examBuckets[key][bucketKey] = [];
          examBuckets[key][bucketKey].push({ title: resource.resource_title, url: resource.url });
        } else if (resource.sub_category === 'Chapter') {
          const bucketKey = resource.chapter || resource.resource_title;
          if (!chapterBuckets[bucketKey]) chapterBuckets[bucketKey] = [];
          chapterBuckets[bucketKey].push({ title: resource.resource_title, url: resource.url });
        }
      });

      Object.entries(listGroups).forEach(([groupTitle, items]) => {
        booksAndNotesEntries.push({ type: 'list', groupTitle, items });
      });

      Object.entries(quizFolders).forEach(([folderName, items]) => {
        quizEntries.push({ type: 'folder', folderName, items });
      });

      Object.entries(homeworkFolders).forEach(([folderName, items]) => {
        homeworkEntries.push({ type: 'folder', folderName, items });
      });

      const examsData: { major1: ExamEntry[]; major2: ExamEntry[]; final: ExamEntry[] } = { major1: [], major2: [], final: [] };
      (['major1', 'major2', 'final'] as const).forEach(key => {
        Object.entries(examBuckets[key]).forEach(([term, items]) => {
          if (items.length > 1) {
            examsData[key].push({ type: 'folder', folderName: term, items });
          } else {
            examsData[key].push({ type: 'single', term, url: items[0].url });
          }
        });
      });

      const byChapterEntries: ChapterEntry[] = [];
      Object.entries(chapterBuckets).forEach(([chapterName, items]) => {
        if (items.length > 1) {
          byChapterEntries.push({ type: 'folder', folderName: chapterName, items });
        } else {
          byChapterEntries.push({ type: 'single', chapterName, url: items[0].url });
        }
      });

      setVideos(videosList);
      setQuizzes(quizEntries);
      setBooksAndNotes(booksAndNotesEntries);
      setHomeworks(homeworkEntries);
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
    setSyllabus("");
    setIndustryOverview("");
    setBooks([]);
    setVideos([]);
    setQuizzes([]);
    setBooksAndNotes([]);
    setHomeworks([]);
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
    setSyllabus(c.syllabus || "");
    setIndustryOverview(c.industry_overview || "");
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
        books: processedBooks as Array<{ title: string; url: string }>,
        syllabus,
        industry_overview: industryOverview
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
        pushToast('error', `Failed to save course: ${String(errorMsg).slice(0, 200)}`);
        return;
      }

      // 3. Save resources for both add and edit flows
      await saveAllResources(courseIdStr);

      setIsModalOpen(false);
      fetchCourses();
      pushToast('success', `Course "${courseIdStr}" saved successfully`);
    } catch (e) {
      console.error(e);
      pushToast('error', 'An error occurred while saving the course');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
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

      // Count how many files need uploading, to drive the progress bar
      let filesTotal = 0;
      quizzes.forEach(e => e.type === 'single' ? (e.file && filesTotal++) : e.items.forEach(it => it.file && filesTotal++));
      booksAndNotes.forEach(e => e.type === 'single' ? (e.file && filesTotal++) : e.items.forEach(it => it.file && filesTotal++));
      homeworks.forEach(e => e.type === 'single' ? (e.file && filesTotal++) : e.items.forEach(it => it.file && filesTotal++));
      Object.values(oldExams).forEach(entries => entries.forEach(e => e.type === 'single' ? (e.file && filesTotal++) : e.items.forEach(it => it.file && filesTotal++)));
      byChapter.forEach(e => e.type === 'single' ? (e.file && filesTotal++) : e.items.forEach(it => it.file && filesTotal++));

      let filesDone = 0;
      if (filesTotal > 0) setUploadProgress({ done: 0, total: filesTotal, percent: 0 });

      const doUpload = async (file: File, label: string): Promise<string> => {
        try {
          const result = await uploadPdfWithProgress(file, (pct) => {
            setUploadProgress({ done: filesDone, total: filesTotal, percent: Math.round(((filesDone + pct / 100) / filesTotal) * 100) });
          });
          filesDone++;
          setUploadProgress({ done: filesDone, total: filesTotal, percent: Math.round((filesDone / filesTotal) * 100) });
          return result.url;
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          pushToast('error', `${label} upload failed for "${file.name}": ${msg}`);
          throw err;
        }
      };

      // Running sort_order counter — increments per pushed resource row, not per
      // entry, so files inside a folder get distinct values. groupResources()
      // buckets by category before rendering, so cross-section values never collide.
      let order = 0;

      // Add videos
      videos.forEach(video => {
        allResources.push({
          course_id: courseId,
          resource_title: video.title,
          url: video.url,
          category: 'Lecture',
          sub_category: 'Videos',
          sort_order: order++
        });
      });

      // Add quizzes — upload any new PDF files first
      for (const entry of quizzes) {
        if (entry.type === 'single') {
          let url = entry.url;
          if (entry.file) {
            url = await doUpload(entry.file, 'Quiz PDF');
          }
          if (!url) continue;
          allResources.push({ course_id: courseId, resource_title: entry.title, url, category: 'Quiz', sub_category: 'Quizzes', sort_order: order++ });
        } else {
          for (const item of entry.items) {
            let url = item.url;
            if (item.file) {
              url = await doUpload(item.file, 'Quiz PDF');
            }
            if (!url) continue;
            allResources.push({ course_id: courseId, resource_title: item.title, url, category: 'Quiz', sub_category: 'Quizzes', unit: entry.folderName, sort_order: order++ });
          }
        }
      }

      // Add books and notes — upload any new PDF files first
      for (const entry of booksAndNotes) {
        if (entry.type === 'single') {
          let url = entry.url;
          if (entry.file) {
            url = await doUpload(entry.file, 'Books & Notes PDF');
          }
          if (!url) continue;
          allResources.push({ course_id: courseId, resource_title: entry.title, url, category: 'Material', sub_category: 'Books & Notes', sort_order: order++ });
        } else {
          for (const item of entry.items) {
            let url = item.url;
            if (item.file) {
              url = await doUpload(item.file, 'Books & Notes PDF');
            }
            if (!url) continue;
            allResources.push({ course_id: courseId, resource_title: item.title, url, category: 'Material', sub_category: 'Books & Notes', unit: entry.groupTitle, sort_order: order++ });
          }
        }
      }

      // Add homeworks — upload any new PDF files first
      for (const entry of homeworks) {
        if (entry.type === 'single') {
          let url = entry.url;
          if (entry.file) {
            url = await doUpload(entry.file, 'Homework PDF');
          }
          if (!url) continue;
          allResources.push({ course_id: courseId, resource_title: entry.title, url, category: 'Homework', sub_category: 'Homeworks', sort_order: order++ });
        } else {
          for (const item of entry.items) {
            let url = item.url;
            if (item.file) {
              url = await doUpload(item.file, 'Homework PDF');
            }
            if (!url) continue;
            allResources.push({ course_id: courseId, resource_title: item.title, url, category: 'Homework', sub_category: 'Homeworks', unit: entry.folderName, sort_order: order++ });
          }
        }
      }

      // Add old exams — upload any new PDF files first
      const examLabels: Record<string, string> = { major1: 'Major 1', major2: 'Major 2', final: 'Final' };
      for (const [key, entries] of Object.entries(oldExams) as [keyof typeof oldExams, ExamEntry[]][]) {
        for (const entry of entries) {
          if (entry.type === 'single') {
            let url = entry.url;
            if (entry.file) {
              url = await doUpload(entry.file, `${examLabels[key]} Exam PDF`);
            }
            if (!url) continue;
            allResources.push({ course_id: courseId, resource_title: `${examLabels[key]} Exam - ${entry.term}`, url, category: 'Exam', sub_category: examLabels[key], semester: entry.term, sort_order: order++ });
          } else {
            for (const item of entry.items) {
              let url = item.url;
              if (item.file) {
                url = await doUpload(item.file, `${examLabels[key]} Exam PDF`);
              }
              if (!url) continue;
              allResources.push({ course_id: courseId, resource_title: item.title, url, category: 'Exam', sub_category: examLabels[key], semester: entry.folderName, sort_order: order++ });
            }
          }
        }
      }

      // Add by-chapter items
      for (const entry of byChapter) {
        if (entry.type === 'single') {
          let url = entry.url;
          if (entry.file) {
            url = await doUpload(entry.file, 'Chapter PDF');
          }
          if (!url) continue;
          allResources.push({ course_id: courseId, resource_title: entry.chapterName, url, category: 'Exam', sub_category: 'Chapter', chapter: entry.chapterName, sort_order: order++ });
        } else {
          for (const item of entry.items) {
            let url = item.url;
            if (item.file) {
              url = await doUpload(item.file, 'Chapter PDF');
            }
            if (!url) continue;
            allResources.push({ course_id: courseId, resource_title: item.title, url, category: 'Exam', sub_category: 'Chapter', chapter: entry.folderName, sort_order: order++ });
          }
        }
      }

      // Save all resources — sequential, not Promise.all, so sort_order maps to
      // insertion order deterministically and a single failure doesn't get
      // swallowed by the outer catch while leaving partial state.
      for (const resource of allResources) {
        await createResource(resource);
      }
    } catch (e) {
      console.error('Failed to save resources:', e);
      pushToast('error', 'Failed to save some course resources — they may have been deleted. Please reload and try again.');
    }
  };

  const moveVideo = (index: number, delta: -1 | 1) => {
    setVideos(prev => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto mt-24">
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 w-80">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-sm border flex items-start gap-2 ${
              t.type === 'success'
                ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400'
                : t.type === 'error'
                ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400'
                : 'bg-blue-50 dark:bg-blue-500/10 border-neon-blue/30 text-neon-blue'
            }`}
          >
            {t.type === 'success' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : t.type === 'error' ? <AlertCircle size={16} className="shrink-0 mt-0.5" /> : <Info size={16} className="shrink-0 mt-0.5" />}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="opacity-60 hover:opacity-100 shrink-0">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
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
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Syllabus</label>
                      <textarea value={syllabus} onChange={e => setSyllabus(e.target.value)} rows={4} className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue" placeholder="Course syllabus / topics outline..."></textarea>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Industry Overview</label>
                      <textarea value={industryOverview} onChange={e => setIndustryOverview(e.target.value)} rows={4} className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue" placeholder="How this course relates to industry / real-world applications..."></textarea>
                    </div>
                  </div>

  

                  <div className="pt-4 border-t border-gray-200 dark:border-zinc-800">
                    <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Course Resources</h3>

                    {/* Videos Section */}
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                        <Play size={16} className="text-neon-blue" />
                        Videos Section
                      </h4>
                      <div className="border border-neon-blue/20 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-neon-blue/5">
                          <button
                            type="button"
                            onClick={() => setCollapsedExams(prev => ({ ...prev, videos: !prev.videos }))}
                            className="flex items-center gap-2 font-medium text-gray-800 dark:text-gray-200 flex-1 text-left"
                          >
                            <ChevronDown size={15} className={`text-neon-blue transition-transform duration-200 ${!collapsedExams.videos ? 'rotate-180' : ''}`} />
                            Videos
                            {videos.length > 0 && <span className="text-xs font-mono text-gray-400 dark:text-white/30">{videos.length} playlists</span>}
                          </button>
                          {!collapsedExams.videos && (
                            <button
                              type="button"
                              onClick={() => setVideos(prev => [...prev, { title: "", url: "" }])}
                              className="text-xs bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue border border-neon-blue/20 px-3 py-1.5 rounded-lg"
                            >
                              + Add
                            </button>
                          )}
                        </div>
                        {!collapsedExams.videos && (
                          <div className="p-3 flex flex-col gap-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400 px-1 mb-1">Add multiple direct links to video explanations. Each link should lead to a playlist.</p>
                            {videos.length === 0 && (
                              <p className="text-sm text-gray-400 dark:text-gray-500 italic px-1">No video playlists added yet</p>
                            )}
                            {videos.map((video, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    placeholder="Playlist Title (e.g., Complete EE201 Playlist)"
                                    value={video.title}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setVideos(prev => prev.map((it, idx) => idx === i ? { ...it, title: val } : it));
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded bg-transparent dark:text-white outline-none focus:border-neon-blue"
                                  />
                                </div>
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    placeholder="Playlist URL"
                                    value={video.url}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setVideos(prev => prev.map((it, idx) => idx === i ? { ...it, url: val } : it));
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded bg-transparent dark:text-white outline-none focus:border-neon-blue"
                                  />
                                </div>
                                <div className="flex flex-col shrink-0">
                                  <button type="button" disabled={i === 0} onClick={() => moveVideo(i, -1)}
                                    className="p-0.5 disabled:opacity-25 hover:bg-black/5 dark:hover:bg-white/5 rounded text-gray-600 dark:text-gray-300"
                                    aria-label="Move video up">
                                    <ChevronUp size={14} />
                                  </button>
                                  <button type="button" disabled={i === videos.length - 1} onClick={() => moveVideo(i, 1)}
                                    className="p-0.5 disabled:opacity-25 hover:bg-black/5 dark:hover:bg-white/5 rounded text-gray-600 dark:text-gray-300"
                                    aria-label="Move video down">
                                    <ChevronDown size={14} />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setVideos(prev => prev.filter((_, idx) => idx !== i))}
                                  className="text-red-500 p-1 hover:bg-red-500/10 rounded shrink-0"
                                >
                                  <X size={15} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quizzes Section */}
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                        <HelpCircle size={16} className="text-neon-blue" />
                        Quizzes Section
                      </h4>
                      <div className="border border-neon-blue/20 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-neon-blue/5">
                          <button
                            type="button"
                            onClick={() => setCollapsedExams(prev => ({ ...prev, quizzes: !prev.quizzes }))}
                            className="flex items-center gap-2 font-medium text-gray-800 dark:text-gray-200 flex-1 text-left"
                          >
                            <ChevronDown size={15} className={`text-neon-blue transition-transform duration-200 ${!collapsedExams.quizzes ? 'rotate-180' : ''}`} />
                            Quizzes
                            {quizzes.length > 0 && <span className="text-xs font-mono text-gray-400 dark:text-white/30">{quizzes.reduce((acc, entry) => acc + (entry.type === 'single' ? 1 : entry.items.length), 0)} files</span>}
                          </button>
                          {!collapsedExams.quizzes && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setQuizzes(prev => [...prev, { type: 'single', title: "", url: "" }])}
                                className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg"
                              >
                                + Add
                              </button>
                              <button
                                type="button"
                                onClick={() => setQuizzes(prev => [...prev, { type: 'folder', folderName: '', items: [{ title: '', url: '' }] }])}
                                className="flex items-center gap-1.5 text-xs bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue px-3 py-1.5 rounded-lg border border-neon-blue/20"
                              >
                                <Layers size={13} /> Add Folder
                              </button>
                            </div>
                          )}
                        </div>
                        {!collapsedExams.quizzes && (
                          <div className="p-3 flex flex-col gap-2">
                            {quizzes.length === 0 && (
                              <p className="text-sm text-gray-400 dark:text-gray-500 italic px-1">No quizzes added yet</p>
                            )}
                            {quizzes.map((entry, i) => entry.type === 'single' ? (
                              // ── Single Item ──
                              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    placeholder="Quiz Title (e.g., Chapter 1 Quiz)"
                                    value={entry.title}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setQuizzes(prev => prev.map((it, idx) => idx === i && it.type === 'single' ? { ...it, title: val } : it));
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded bg-transparent dark:text-white outline-none focus:border-neon-blue"
                                  />
                                </div>
                                <div className="flex-1">
                                  {entry.url && !entry.file ? (
                                    <span className="text-xs text-green-500 flex items-center gap-1">✓ Uploaded</span>
                                  ) : (
                                    <ExamFileDrop
                                      selectedFile={entry.file}
                                      onFile={(file) => setQuizzes(prev => prev.map((it, idx) => idx === i && it.type === 'single' ? { ...it, file } : it))}
                                      onReject={(msg) => pushToast('error', msg)}
                                    />
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setQuizzes(prev => prev.filter((_, idx) => idx !== i))}
                                  className="text-red-500 p-1 hover:bg-red-500/10 rounded shrink-0"
                                >
                                  <X size={15} />
                                </button>
                              </div>
                            ) : (
                              // ── Folder ──
                              <div key={i} className="border border-neon-blue/20 rounded-xl overflow-hidden">
                                <div className="flex items-center gap-3 px-4 py-3 bg-neon-blue/5 border-b border-neon-blue/10">
                                  <Layers size={15} className="text-neon-blue flex-shrink-0" />
                                  <input
                                    type="text"
                                    placeholder="Folder name (e.g. Midterm Quizzes)"
                                    value={entry.folderName}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setQuizzes(prev => prev.map((it, idx) => idx === i && it.type === 'folder' ? { ...it, folderName: val } : it));
                                    }}
                                    className="flex-1 px-3 py-1.5 text-sm font-medium border border-transparent focus:border-neon-blue/40 rounded bg-transparent dark:text-white outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setCollapsedExamFolders(prev => ({ ...prev, [`quiz-${i}`]: !prev[`quiz-${i}`] }))}
                                    className="p-1.5 hover:bg-neon-blue/10 rounded text-neon-blue flex-shrink-0"
                                  >
                                    <ChevronDown size={15} className={`transition-transform duration-200 ${collapsedExamFolders[`quiz-${i}`] ? "-rotate-90" : ""}`} />
                                  </button>
                                  <button type="button" onClick={() => setQuizzes(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 p-1.5 hover:bg-red-500/10 rounded flex-shrink-0">
                                    <X size={15} />
                                  </button>
                                </div>
                                <div className={`p-3 flex flex-col gap-2 ${collapsedExamFolders[`quiz-${i}`] ? "hidden" : ""}`}>
                                  {entry.items.map((item, j) => (
                                    <div key={j} className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                                      <span className="text-xs font-mono text-gray-400 dark:text-white/30 w-5 text-center">{j + 1}</span>
                                      <div className="flex-1">
                                        <input
                                          type="text"
                                          placeholder={`File ${j + 1} title`}
                                          value={item.title}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setQuizzes(prev => prev.map((en, idx) => {
                                              if (idx !== i || en.type !== 'folder') return en;
                                              return { ...en, items: en.items.map((it, jdx) => jdx === j ? { ...it, title: val } : it) };
                                            }));
                                          }}
                                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded bg-transparent dark:text-white outline-none focus:border-neon-blue"
                                        />
                                      </div>
                                      <div className="flex-1">
                                        {item.url && !item.file ? (
                                          <span className="text-xs text-green-500">✓ Uploaded</span>
                                        ) : (
                                          <ExamFileDrop
                                            selectedFile={item.file}
                                            onFile={(file) => setQuizzes(prev => prev.map((en, idx) => {
                                              if (idx !== i || en.type !== 'folder') return en;
                                              return { ...en, items: en.items.map((it, jdx) => jdx === j ? { ...it, file } : it) };
                                            }))}
                                            onReject={(msg) => pushToast('error', msg)}
                                          />
                                        )}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setQuizzes(prev => prev.map((en, idx) => {
                                          if (idx !== i || en.type !== 'folder') return en;
                                          return { ...en, items: en.items.filter((_, jdx) => jdx !== j) };
                                        }))}
                                        className="text-red-500 p-1 hover:bg-red-500/10 rounded flex-shrink-0"
                                      >
                                        <X size={13} />
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => setQuizzes(prev => prev.map((en, idx) => {
                                      if (idx !== i || en.type !== 'folder') return en;
                                      return { ...en, items: [...en.items, { title: '', url: '' }] };
                                    }))}
                                    className="mt-1 flex items-center gap-1.5 text-xs text-neon-blue hover:text-neon-blue/80 px-2 py-1.5 rounded transition-colors self-start"
                                  >
                                    <Plus size={13} /> Add File
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Homeworks Section */}
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                        <ClipboardList size={16} className="text-neon-blue" />
                        Homeworks Section
                      </h4>
                      <div className="border border-neon-blue/20 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-neon-blue/5">
                          <button
                            type="button"
                            onClick={() => setCollapsedExams(prev => ({ ...prev, homeworks: !prev.homeworks }))}
                            className="flex items-center gap-2 font-medium text-gray-800 dark:text-gray-200 flex-1 text-left"
                          >
                            <ChevronDown size={15} className={`text-neon-blue transition-transform duration-200 ${!collapsedExams.homeworks ? 'rotate-180' : ''}`} />
                            Homeworks
                            {homeworks.length > 0 && <span className="text-xs font-mono text-gray-400 dark:text-white/30">{homeworks.reduce((acc, entry) => acc + (entry.type === 'single' ? 1 : entry.items.length), 0)} files</span>}
                          </button>
                          {!collapsedExams.homeworks && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setHomeworks(prev => [...prev, { type: 'single', title: "", url: "" }])}
                                className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg"
                              >
                                + Add
                              </button>
                              <button
                                type="button"
                                onClick={() => setHomeworks(prev => [...prev, { type: 'folder', folderName: '', items: [{ title: '', url: '' }] }])}
                                className="flex items-center gap-1.5 text-xs bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue px-3 py-1.5 rounded-lg border border-neon-blue/20"
                              >
                                <Layers size={13} /> Add Folder
                              </button>
                            </div>
                          )}
                        </div>
                        {!collapsedExams.homeworks && (
                          <div className="p-3 flex flex-col gap-2">
                            {homeworks.length === 0 && (
                              <p className="text-sm text-gray-400 dark:text-gray-500 italic px-1">No homeworks added yet</p>
                            )}
                            {homeworks.map((entry, i) => entry.type === 'single' ? (
                              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    placeholder="Homework Title (e.g., Homework 1)"
                                    value={entry.title}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setHomeworks(prev => prev.map((it, idx) => idx === i && it.type === 'single' ? { ...it, title: val } : it));
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded bg-transparent dark:text-white outline-none focus:border-neon-blue"
                                  />
                                </div>
                                <div className="flex-1">
                                  {entry.url && !entry.file ? (
                                    <span className="text-xs text-green-500 flex items-center gap-1">✓ Uploaded</span>
                                  ) : (
                                    <ExamFileDrop
                                      selectedFile={entry.file}
                                      onFile={(file) => setHomeworks(prev => prev.map((it, idx) => idx === i && it.type === 'single' ? { ...it, file } : it))}
                                      onReject={(msg) => pushToast('error', msg)}
                                    />
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setHomeworks(prev => prev.filter((_, idx) => idx !== i))}
                                  className="text-red-500 p-1 hover:bg-red-500/10 rounded shrink-0"
                                >
                                  <X size={15} />
                                </button>
                              </div>
                            ) : (
                              <div key={i} className="border border-neon-blue/20 rounded-xl overflow-hidden">
                                <div className="flex items-center gap-3 px-4 py-3 bg-neon-blue/5 border-b border-neon-blue/10">
                                  <Layers size={15} className="text-neon-blue flex-shrink-0" />
                                  <input
                                    type="text"
                                    placeholder="Folder name (e.g. Weekly Homeworks)"
                                    value={entry.folderName}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setHomeworks(prev => prev.map((it, idx) => idx === i && it.type === 'folder' ? { ...it, folderName: val } : it));
                                    }}
                                    className="flex-1 px-3 py-1.5 text-sm font-medium border border-transparent focus:border-neon-blue/40 rounded bg-transparent dark:text-white outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setCollapsedExamFolders(prev => ({ ...prev, [`hw-${i}`]: !prev[`hw-${i}`] }))}
                                    className="p-1.5 hover:bg-neon-blue/10 rounded text-neon-blue flex-shrink-0"
                                  >
                                    <ChevronDown size={15} className={`transition-transform duration-200 ${collapsedExamFolders[`hw-${i}`] ? "-rotate-90" : ""}`} />
                                  </button>
                                  <button type="button" onClick={() => setHomeworks(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 p-1.5 hover:bg-red-500/10 rounded flex-shrink-0">
                                    <X size={15} />
                                  </button>
                                </div>
                                <div className={`p-3 flex flex-col gap-2 ${collapsedExamFolders[`hw-${i}`] ? "hidden" : ""}`}>
                                  {entry.items.map((item, j) => (
                                    <div key={j} className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                                      <span className="text-xs font-mono text-gray-400 dark:text-white/30 w-5 text-center">{j + 1}</span>
                                      <div className="flex-1">
                                        <input
                                          type="text"
                                          placeholder={`File ${j + 1} title`}
                                          value={item.title}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setHomeworks(prev => prev.map((en, idx) => {
                                              if (idx !== i || en.type !== 'folder') return en;
                                              return { ...en, items: en.items.map((it, jdx) => jdx === j ? { ...it, title: val } : it) };
                                            }));
                                          }}
                                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded bg-transparent dark:text-white outline-none focus:border-neon-blue"
                                        />
                                      </div>
                                      <div className="flex-1">
                                        {item.url && !item.file ? (
                                          <span className="text-xs text-green-500">✓ Uploaded</span>
                                        ) : (
                                          <ExamFileDrop
                                            selectedFile={item.file}
                                            onFile={(file) => setHomeworks(prev => prev.map((en, idx) => {
                                              if (idx !== i || en.type !== 'folder') return en;
                                              return { ...en, items: en.items.map((it, jdx) => jdx === j ? { ...it, file } : it) };
                                            }))}
                                            onReject={(msg) => pushToast('error', msg)}
                                          />
                                        )}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setHomeworks(prev => prev.map((en, idx) => {
                                          if (idx !== i || en.type !== 'folder') return en;
                                          return { ...en, items: en.items.filter((_, jdx) => jdx !== j) };
                                        }))}
                                        className="text-red-500 p-1 hover:bg-red-500/10 rounded flex-shrink-0"
                                      >
                                        <X size={13} />
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => setHomeworks(prev => prev.map((en, idx) => {
                                      if (idx !== i || en.type !== 'folder') return en;
                                      return { ...en, items: [...en.items, { title: '', url: '' }] };
                                    }))}
                                    className="mt-1 flex items-center gap-1.5 text-xs text-neon-blue hover:text-neon-blue/80 px-2 py-1.5 rounded transition-colors self-start"
                                  >
                                    <Plus size={13} /> Add File
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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
                        const entries = oldExams[examType];
                        const totalFiles = entries.reduce((acc, entry) => acc + (entry.type === 'single' ? 1 : entry.items.length), 0);
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
                                {totalFiles > 0 && <span className="text-xs font-mono text-gray-400 dark:text-white/30">{totalFiles} files</span>}
                              </button>
                              {isOpen && (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setOldExams(prev => ({ ...prev, [examType]: [...prev[examType], { type: 'single', term: '', url: '' }] }))}
                                    className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg"
                                  >
                                    + Add
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setOldExams(prev => ({ ...prev, [examType]: [...prev[examType], { type: 'folder', folderName: '', items: [{ title: '', url: '' }] }] }))}
                                    className="flex items-center gap-1.5 text-xs bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue px-3 py-1.5 rounded-lg border border-neon-blue/20"
                                  >
                                    <Layers size={13} /> Add Folder
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Items */}
                            {isOpen && (
                              <div className="p-3 flex flex-col gap-2">
                                {entries.length === 0 && (
                                  <p className="text-sm text-gray-400 dark:text-gray-500 italic px-1">No exams added yet</p>
                                )}
                                {entries.map((entry, i) => entry.type === 'single' ? (
                                  // ── Single Item ──
                                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                                    <input
                                      type="text"
                                      placeholder="Term (e.g. 241)"
                                      value={entry.term}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setOldExams(prev => ({ ...prev, [examType]: prev[examType].map((it, idx) => idx === i && it.type === 'single' ? { ...it, term: val } : it) }));
                                      }}
                                      className="w-40 shrink-0 px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded bg-transparent dark:text-white outline-none focus:border-neon-blue"
                                    />
                                    <div className="flex-1">
                                      {entry.url && !entry.file ? (
                                        <span className="text-xs text-green-500">✓ Uploaded</span>
                                      ) : (
                                        <ExamFileDrop
                                          selectedFile={entry.file}
                                          onFile={(file) => setOldExams(prev => ({ ...prev, [examType]: prev[examType].map((it, idx) => idx === i && it.type === 'single' ? { ...it, file } : it) }))}
                                          onReject={(msg) => pushToast('error', msg)}
                                        />
                                      )}
                                    </div>
                                    <button type="button" onClick={() => setOldExams(prev => ({ ...prev, [examType]: prev[examType].filter((_, idx) => idx !== i) }))} className="text-red-500 p-1 hover:bg-red-500/10 rounded shrink-0">
                                      <X size={15} />
                                    </button>
                                  </div>
                                ) : (
                                  // ── Folder ──
                                  <div key={i} className="border border-neon-blue/20 rounded-xl overflow-hidden">
                                    <div className="flex items-center gap-3 px-4 py-3 bg-neon-blue/5 border-b border-neon-blue/10">
                                      <Layers size={15} className="text-neon-blue flex-shrink-0" />
                                      <input
                                        type="text"
                                        placeholder="Folder term (e.g. 241)"
                                        value={entry.folderName}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setOldExams(prev => ({ ...prev, [examType]: prev[examType].map((it, idx) => idx === i && it.type === 'folder' ? { ...it, folderName: val } : it) }));
                                        }}
                                        className="flex-1 px-3 py-1.5 text-sm font-medium border border-transparent focus:border-neon-blue/40 rounded bg-transparent dark:text-white outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setCollapsedExamFolders(prev => ({ ...prev, [`${examType}-${i}`]: !prev[`${examType}-${i}`] }))}
                                        className="p-1.5 hover:bg-neon-blue/10 rounded text-neon-blue flex-shrink-0"
                                      >
                                        <ChevronDown size={15} className={`transition-transform duration-200 ${collapsedExamFolders[`${examType}-${i}`] ? "-rotate-90" : ""}`} />
                                      </button>
                                      <button type="button" onClick={() => setOldExams(prev => ({ ...prev, [examType]: prev[examType].filter((_, idx) => idx !== i) }))} className="text-red-500 p-1.5 hover:bg-red-500/10 rounded flex-shrink-0">
                                        <X size={15} />
                                      </button>
                                    </div>
                                    <div className={`p-3 flex flex-col gap-2 ${collapsedExamFolders[`${examType}-${i}`] ? "hidden" : ""}`}>
                                      {entry.items.map((item, j) => (
                                        <div key={j} className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                                          <span className="text-xs font-mono text-gray-400 dark:text-white/30 w-5 text-center">{j + 1}</span>
                                          <div className="flex-1">
                                            <input
                                              type="text"
                                              placeholder={`File ${j + 1} title`}
                                              value={item.title}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setOldExams(prev => ({ ...prev, [examType]: prev[examType].map((en, idx) => {
                                                  if (idx !== i || en.type !== 'folder') return en;
                                                  return { ...en, items: en.items.map((it, jdx) => jdx === j ? { ...it, title: val } : it) };
                                                }) }));
                                              }}
                                              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded bg-transparent dark:text-white outline-none focus:border-neon-blue"
                                            />
                                          </div>
                                          <div className="flex-1">
                                            {item.url && !item.file ? (
                                              <span className="text-xs text-green-500">✓ Uploaded</span>
                                            ) : (
                                              <ExamFileDrop
                                                selectedFile={item.file}
                                                onFile={(file) => setOldExams(prev => ({ ...prev, [examType]: prev[examType].map((en, idx) => {
                                                  if (idx !== i || en.type !== 'folder') return en;
                                                  return { ...en, items: en.items.map((it, jdx) => jdx === j ? { ...it, file } : it) };
                                                }) }))}
                                                onReject={(msg) => pushToast('error', msg)}
                                              />
                                            )}
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => setOldExams(prev => ({ ...prev, [examType]: prev[examType].map((en, idx) => {
                                              if (idx !== i || en.type !== 'folder') return en;
                                              return { ...en, items: en.items.filter((_, jdx) => jdx !== j) };
                                            }) }))}
                                            className="text-red-500 p-1 hover:bg-red-500/10 rounded flex-shrink-0"
                                          >
                                            <X size={13} />
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        type="button"
                                        onClick={() => setOldExams(prev => ({ ...prev, [examType]: prev[examType].map((en, idx) => {
                                          if (idx !== i || en.type !== 'folder') return en;
                                          return { ...en, items: [...en.items, { title: '', url: '' }] };
                                        }) }))}
                                        className="mt-1 flex items-center gap-1.5 text-xs text-neon-blue hover:text-neon-blue/80 px-2 py-1.5 rounded transition-colors self-start"
                                      >
                                        <Plus size={13} /> Add File
                                      </button>
                                    </div>
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
                            {byChapter.length > 0 && <span className="text-xs font-mono text-gray-400 dark:text-white/30">{byChapter.reduce((acc, entry) => acc + (entry.type === 'single' ? 1 : entry.items.length), 0)} files</span>}
                          </button>
                          {!collapsedExams.byChapter && (
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => setByChapter(prev => [...prev, { type: 'single', chapterName: '', url: '' }])}
                                className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg">
                                + Add
                              </button>
                              <button type="button" onClick={() => setByChapter(prev => [...prev, { type: 'folder', folderName: '', items: [{ title: '', url: '' }] }])}
                                className="flex items-center gap-1.5 text-xs bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue px-3 py-1.5 rounded-lg border border-neon-blue/20">
                                <Layers size={13} /> Add Folder
                              </button>
                            </div>
                          )}
                        </div>
                        {!collapsedExams.byChapter && (
                          <div className="p-3 flex flex-col gap-2">
                            {byChapter.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500 italic px-1">No chapters added yet</p>}
                            {byChapter.map((entry, i) => entry.type === 'single' ? (
                              // ── Single Item ──
                              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                                <input type="text" placeholder="Chapter name" value={entry.chapterName}
                                  onChange={(e) => { const val = e.target.value; setByChapter(prev => prev.map((it, idx) => idx === i && it.type === 'single' ? { ...it, chapterName: val } : it)); }}
                                  className="w-40 shrink-0 px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded bg-transparent dark:text-white outline-none focus:border-neon-blue"
                                />
                                <div className="flex-1">
                                  {entry.url && !entry.file ? (
                                    <span className="text-xs text-green-500">✓ Uploaded</span>
                                  ) : (
                                    <ExamFileDrop
                                      selectedFile={entry.file}
                                      onFile={(file) => setByChapter(prev => prev.map((it, idx) => idx === i && it.type === 'single' ? { ...it, file } : it))}
                                      onReject={(msg) => pushToast('error', msg)}
                                    />
                                  )}
                                </div>
                                <button type="button" onClick={() => setByChapter(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 p-1 hover:bg-red-500/10 rounded shrink-0">
                                  <X size={15} />
                                </button>
                              </div>
                            ) : (
                              // ── Folder ──
                              <div key={i} className="border border-neon-blue/20 rounded-xl overflow-hidden">
                                <div className="flex items-center gap-3 px-4 py-3 bg-neon-blue/5 border-b border-neon-blue/10">
                                  <Layers size={15} className="text-neon-blue flex-shrink-0" />
                                  <input
                                    type="text"
                                    placeholder="Folder name (e.g. Chapter 3)"
                                    value={entry.folderName}
                                    onChange={(e) => { const val = e.target.value; setByChapter(prev => prev.map((it, idx) => idx === i && it.type === 'folder' ? { ...it, folderName: val } : it)); }}
                                    className="flex-1 px-3 py-1.5 text-sm font-medium border border-transparent focus:border-neon-blue/40 rounded bg-transparent dark:text-white outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setCollapsedExamFolders(prev => ({ ...prev, [`chapter-${i}`]: !prev[`chapter-${i}`] }))}
                                    className="p-1.5 hover:bg-neon-blue/10 rounded text-neon-blue flex-shrink-0"
                                  >
                                    <ChevronDown size={15} className={`transition-transform duration-200 ${collapsedExamFolders[`chapter-${i}`] ? "-rotate-90" : ""}`} />
                                  </button>
                                  <button type="button" onClick={() => setByChapter(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 p-1.5 hover:bg-red-500/10 rounded flex-shrink-0">
                                    <X size={15} />
                                  </button>
                                </div>
                                <div className={`p-3 flex flex-col gap-2 ${collapsedExamFolders[`chapter-${i}`] ? "hidden" : ""}`}>
                                  {entry.items.map((item, j) => (
                                    <div key={j} className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                                      <span className="text-xs font-mono text-gray-400 dark:text-white/30 w-5 text-center">{j + 1}</span>
                                      <div className="flex-1">
                                        <input
                                          type="text"
                                          placeholder={`File ${j + 1} title`}
                                          value={item.title}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setByChapter(prev => prev.map((en, idx) => {
                                              if (idx !== i || en.type !== 'folder') return en;
                                              return { ...en, items: en.items.map((it, jdx) => jdx === j ? { ...it, title: val } : it) };
                                            }));
                                          }}
                                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded bg-transparent dark:text-white outline-none focus:border-neon-blue"
                                        />
                                      </div>
                                      <div className="flex-1">
                                        {item.url && !item.file ? (
                                          <span className="text-xs text-green-500">✓ Uploaded</span>
                                        ) : (
                                          <ExamFileDrop
                                            selectedFile={item.file}
                                            onFile={(file) => setByChapter(prev => prev.map((en, idx) => {
                                              if (idx !== i || en.type !== 'folder') return en;
                                              return { ...en, items: en.items.map((it, jdx) => jdx === j ? { ...it, file } : it) };
                                            }))}
                                            onReject={(msg) => pushToast('error', msg)}
                                          />
                                        )}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setByChapter(prev => prev.map((en, idx) => {
                                          if (idx !== i || en.type !== 'folder') return en;
                                          return { ...en, items: en.items.filter((_, jdx) => jdx !== j) };
                                        }))}
                                        className="text-red-500 p-1 hover:bg-red-500/10 rounded flex-shrink-0"
                                      >
                                        <X size={13} />
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => setByChapter(prev => prev.map((en, idx) => {
                                      if (idx !== i || en.type !== 'folder') return en;
                                      return { ...en, items: [...en.items, { title: '', url: '' }] };
                                    }))}
                                    className="mt-1 flex items-center gap-1.5 text-xs text-neon-blue hover:text-neon-blue/80 px-2 py-1.5 rounded transition-colors self-start"
                                  >
                                    <Plus size={13} /> Add File
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {uploadProgress && (
                    <div className="pt-4">
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>Uploading files… ({uploadProgress.done}/{uploadProgress.total})</span>
                        <span>{uploadProgress.percent}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div className="h-full bg-neon-blue transition-all duration-200" style={{ width: `${uploadProgress.percent}%` }} />
                      </div>
                    </div>
                  )}

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
