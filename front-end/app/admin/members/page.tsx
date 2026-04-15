"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Image as ImageIcon } from "lucide-react";

type Member = {
  id: number;
  name: string;
  role: string;
  linkedin: string;
  sort_order: number;
  term: string;
  image?: any;
};

export default function MembersAdmin() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [term, setTerm] = useState("1");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const fetchMembers = async () => {
    try {
      const res = await fetch("http://localhost:4000/members");
      if (res.ok) {
        setMembers(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const resetForm = () => {
    setName("");
    setRole("");
    setLinkedin("");
    setSortOrder("");
    setTerm("1");
    setImageFile(null);
    setEditingMember(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setName(member.name);
    setRole(member.role);
    setLinkedin(member.linkedin || "");
    setSortOrder(member.sort_order?.toString() || "");
    setTerm(member.term || "1");
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this member?")) return;
    try {
      await fetch(`http://localhost:4000/members/${id}`, { method: "DELETE" });
      fetchMembers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    formData.append("role", role);
    formData.append("linkedin", linkedin);
    formData.append("sort_order", sortOrder);
    formData.append("term", term);
    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      const url = editingMember
        ? `http://localhost:4000/members/${editingMember.id}`
        : "http://localhost:4000/members";
      const method = editingMember ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: formData,
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchMembers();
      } else {
        alert("Failed to save member");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto mt-24">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-orbitron)] text-gray-900 dark:text-white">Members Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Add, edit, or remove club members.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-neon-blue text-white rounded-lg hover:bg-neon-blue/90 transition"
        >
          <Plus size={20} />
          Add Member
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800">
                <th className="p-4 font-semibold text-gray-900 dark:text-gray-200">Name</th>
                <th className="p-4 font-semibold text-gray-900 dark:text-gray-200">Role</th>
                <th className="p-4 font-semibold text-gray-900 dark:text-gray-200">Term</th>
                <th className="p-4 font-semibold text-gray-900 dark:text-gray-200">Sort Order</th>
                <th className="p-4 font-semibold text-gray-900 dark:text-gray-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">Loading members...</td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No members found.</td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="border-b border-gray-100 dark:border-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/20 transition">
                    <td className="p-4 text-gray-800 dark:text-gray-300 font-medium flex items-center gap-3">
                      {member.image && member.image[0] ? (
                        <img src={`http://localhost:4000/image?token=${member.image[0].token}`} alt={member.name} className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-gray-500"><ImageIcon size={20} /></div>
                      )}
                      {member.name}
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">{member.role}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">{member.term}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">{member.sort_order}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(member)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(member.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg border border-gray-200 dark:border-zinc-800 shadow-2xl relative">
             <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:hover:text-white">
               <X size={24} />
             </button>
             <div className="p-6">
                <h2 className="text-2xl font-bold dark:text-white mb-6 font-[family-name:var(--font-orbitron)]">
                  {editingMember ? "Edit Member" : "Add New Member"}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                    <input type="text" value={role} onChange={e => setRole(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">LinkedIn URL</label>
                    <input type="url" value={linkedin} onChange={e => setLinkedin(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Term</label>
                      <input type="text" value={term} onChange={e => setTerm(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort Order</label>
                      <input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profile Image</label>
                    <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-neon-blue/10 file:text-neon-blue hover:file:bg-neon-blue/20" />
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-neon-blue text-white rounded-lg hover:bg-neon-blue/90 transition">Save Member</button>
                  </div>
                </form>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
