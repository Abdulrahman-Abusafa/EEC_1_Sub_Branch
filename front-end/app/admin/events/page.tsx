"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Link as LinkIcon, CalendarDays } from "lucide-react";

type Event = {
  id: number;
  event_title: string;
  description: string;
  category: string;
  location: string;
  time: string;
  start_date: string;
  end_date: string;
  status: string;
  registration_link: string;
  image?: any;
};

export default function EventsAdmin() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Form State
  const [eventTitle, setEventTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [time, setTime] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("upcoming");
  const [registrationLink, setRegistrationLink] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const fetchEvents = async () => {
    try {
      const res = await fetch("http://localhost:4000/events");
      if (res.ok) {
        setEvents(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const resetForm = () => {
    setEventTitle("");
    setDescription("");
    setCategory("");
    setLocation("");
    setTime("");
    setStartDate("");
    setEndDate("");
    setStatus("upcoming");
    setRegistrationLink("");
    setImageFile(null);
    setEditingEvent(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (ev: Event) => {
    setEditingEvent(ev);
    setEventTitle(ev.event_title);
    setDescription(ev.description || "");
    setCategory(ev.category || "");
    setLocation(ev.location || "");
    setTime(ev.time || "");
    setStartDate(ev.start_date ? new Date(ev.start_date).toISOString().split('T')[0] : "");
    setEndDate(ev.end_date ? new Date(ev.end_date).toISOString().split('T')[0] : "");
    setStatus(ev.status || "upcoming");
    setRegistrationLink(ev.registration_link || "");
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      await fetch(`http://localhost:4000/events/${id}`, { method: "DELETE" });
      fetchEvents();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("event_title", eventTitle);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("location", location);
    formData.append("time", time);
    formData.append("start_date", startDate);
    formData.append("end_date", endDate);
    formData.append("status", status);
    formData.append("registration_link", registrationLink);
    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      const url = editingEvent
        ? `http://localhost:4000/events/${editingEvent.id}`
        : "http://localhost:4000/events";
      const method = editingEvent ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: formData,
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchEvents();
      } else {
        alert("Failed to save event");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto mt-24">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-orbitron)] text-gray-900 dark:text-white">Events Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Add, edit, or remove club events.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-neon-blue text-white rounded-lg hover:bg-neon-blue/90 transition"
        >
          <Plus size={20} />
          Add Event
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800">
                <th className="p-4 font-semibold text-gray-900 dark:text-gray-200">Title</th>
                <th className="p-4 font-semibold text-gray-900 dark:text-gray-200">Date/Time</th>
                <th className="p-4 font-semibold text-gray-900 dark:text-gray-200">Location</th>
                <th className="p-4 font-semibold text-gray-900 dark:text-gray-200">Status</th>
                <th className="p-4 font-semibold text-gray-900 dark:text-gray-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">Loading events...</td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No events found.</td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr key={ev.id} className="border-b border-gray-100 dark:border-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/20 transition">
                    <td className="p-4 text-gray-800 dark:text-gray-300 font-medium">
                      {ev.event_title}
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-400 flex flex-col">
                      <span className="flex items-center gap-1 text-sm"><CalendarDays size={14}/> {ev.start_date ? new Date(ev.start_date).toLocaleDateString() : 'N/A'}</span>
                      <span className="text-xs opacity-70 ml-5">{ev.time}</span>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">{ev.location}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${ev.status === 'upcoming' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                        {ev.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {ev.registration_link && (
                          <a href={ev.registration_link} target="_blank" rel="noreferrer" className="p-2 text-gray-500 hover:bg-gray-500/10 rounded-lg transition" title="Registration Link">
                            <LinkIcon size={18} />
                          </a>
                        )}
                        <button onClick={() => openEditModal(ev)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(ev.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition">
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
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl border border-gray-200 dark:border-zinc-800 shadow-2xl relative my-8">
             <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:hover:text-white">
               <X size={24} />
             </button>
             <div className="p-6">
                <h2 className="text-2xl font-bold dark:text-white mb-6 font-[family-name:var(--font-orbitron)]">
                  {editingEvent ? "Edit Event" : "Add New Event"}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Title</label>
                      <input type="text" value={eventTitle} onChange={e => setEventTitle(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                      <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue"></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                      <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                      <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue [color-scheme:light] dark:[color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
                      <input type="text" value={time} onChange={e => setTime(e.target.value)} placeholder="e.g. 6:00 PM - 8:00 PM" className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                      <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue">
                        <option value="upcoming" className="dark:bg-zinc-800">Upcoming</option>
                        <option value="past" className="dark:bg-zinc-800">Past</option>
                        <option value="ongoing" className="dark:bg-zinc-800">Ongoing</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Registration Link (optional)</label>
                      <input type="url" value={registrationLink} onChange={e => setRegistrationLink(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Image</label>
                      <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-neon-blue/10 file:text-neon-blue hover:file:bg-neon-blue/20" />
                    </div>
                  </div>

                  <div className="pt-6 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-neon-blue text-white rounded-lg hover:bg-neon-blue/90 transition">Save Event</button>
                  </div>
                </form>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
