"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Star, ChevronDown, ChevronUp } from "lucide-react";
import { API_BASE, getPhotoUrl } from "@/lib/api";

type Term = { id: number; name: string; is_current: boolean };

type ImageAttachment = { token: string; name?: string };
type Member = {
  id: number;
  name: string;
  role: string;
  linkedin?: string;
  bio?: string;
  email?: string;
  twitter?: string;
  sort_order: number;
  term: string;
  image?: ImageAttachment[] | null;
};

export default function MembersAdmin() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedTerms, setCollapsedTerms] = useState<Set<number>>(new Set());

  // Term modal
  const [termModalOpen, setTermModalOpen] = useState(false);
  const [newTermName, setNewTermName] = useState("");
  const [newTermIsCurrent, setNewTermIsCurrent] = useState(false);
  const [termSaving, setTermSaving] = useState(false);

  // Member modal
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [mName, setMName] = useState("");
  const [mRole, setMRole] = useState("");
  const [mLinkedin, setMLinkedin] = useState("");
  const [mBio, setMBio] = useState("");
  const [mEmail, setMEmail] = useState("");
  const [mTwitter, setMTwitter] = useState("");
  const [mSortOrder, setMSortOrder] = useState("");
  const [mTerm, setMTerm] = useState("");
  const [mImageFile, setMImageFile] = useState<File | null>(null);

  const fetchAll = async () => {
    try {
      const [termsRes, membersRes] = await Promise.all([
        fetch(`${API_BASE}/terms`),
        fetch(`${API_BASE}/members`),
      ]);
      if (termsRes.ok) setTerms(await termsRes.json());
      if (membersRes.ok) setMembers(await membersRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Term actions ─────────────────────────────────────────────────────────────

  const handleAddTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTermName.trim()) return;
    if (!/^\d{3}-\d{3}$/.test(newTermName.trim())) {
      alert('Academic year must be in the format XXX-XXX (e.g. 251-252)');
      return;
    }
    setTermSaving(true);
    try {
      const res = await fetch(`${API_BASE}/terms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTermName.trim(), is_current: newTermIsCurrent }),
      });
      if (res.ok) {
        setTermModalOpen(false);
        setNewTermName("");
        setNewTermIsCurrent(false);
        fetchAll();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create term");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTermSaving(false);
    }
  };

  const handleSetCurrent = async (termId: number) => {
    try {
      const res = await fetch(`${API_BASE}/terms/${termId}/current`, { method: "PATCH" });
      if (res.ok) fetchAll();
    } catch (e) { console.error(e); }
  };

  const handleDeleteTerm = async (termId: number, termName: string) => {
    const termMembers = members.filter(m => m.term === termName);
    const msg = termMembers.length > 0
      ? `Delete term "${termName}"? Its ${termMembers.length} member(s) will not be deleted but will be unlinked.`
      : `Delete term "${termName}"?`;
    if (!confirm(msg)) return;
    try {
      await fetch(`${API_BASE}/terms/${termId}`, { method: "DELETE" });
      fetchAll();
    } catch (e) { console.error(e); }
  };

  // ── Member actions ────────────────────────────────────────────────────────────

  const resetMemberForm = () => {
    setMName(""); setMRole(""); setMLinkedin(""); setMBio(""); setMEmail("");
    setMTwitter(""); setMSortOrder(""); setMTerm(""); setMImageFile(null);
    setEditingMember(null);
  };

  const openAddMemberModal = (termName: string) => {
    resetMemberForm();
    setMTerm(termName);
    setMemberModalOpen(true);
  };

  const openEditMemberModal = (member: Member) => {
    setEditingMember(member);
    setMName(member.name);
    setMRole(member.role);
    setMLinkedin(member.linkedin || "");
    setMBio(member.bio || "");
    setMEmail(member.email || "");
    setMTwitter(member.twitter || "");
    setMSortOrder(member.sort_order?.toString() || "");
    setMTerm(member.term);
    setMImageFile(null);
    setMemberModalOpen(true);
  };

  const handleDeleteMember = async (id: number) => {
    if (!confirm("Delete this member?")) return;
    try {
      await fetch(`${API_BASE}/members/${id}`, { method: "DELETE" });
      fetchAll();
    } catch (e) { console.error(e); }
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", mName);
    formData.append("role", mRole);
    formData.append("linkedin", mLinkedin);
    formData.append("bio", mBio);
    formData.append("email", mEmail);
    formData.append("twitter", mTwitter);
    formData.append("sort_order", mSortOrder);
    formData.append("term", mTerm);
    if (mImageFile) formData.append("image", mImageFile);

    try {
      const url = editingMember ? `${API_BASE}/members/${editingMember.id}` : `${API_BASE}/members`;
      const method = editingMember ? "PUT" : "POST";
      const res = await fetch(url, { method, body: formData });
      if (res.ok) { setMemberModalOpen(false); fetchAll(); }
      else alert("Failed to save member");
    } catch (e) { console.error(e); }
  };

  const toggleCollapse = (id: number) => {
    setCollapsedTerms(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Members not linked to any known term
  const knownTermNames = new Set(terms.map(t => t.name));
  const orphanMembers = members.filter(m => !knownTermNames.has(m.term));

  return (
    <div className="p-8 max-w-6xl mx-auto mt-24">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-orbitron)] text-gray-900 dark:text-white">
            Members Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create a term first, then add members inside it.
          </p>
        </div>
        <button
          onClick={() => { setNewTermName(""); setNewTermIsCurrent(false); setTermModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-neon-blue text-white rounded-lg hover:bg-neon-blue/90 transition font-semibold"
        >
          <Plus size={18} /> Add Academic Year
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : terms.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-white/30 font-mono">
          No academic years yet. Click "Add Academic Year" to get started.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {terms.map(term => {
            const termMembers = members.filter(m => m.term === term.name).sort((a, b) => a.sort_order - b.sort_order);
            const isCollapsed = collapsedTerms.has(term.id);
            return (
              <div
                key={term.id}
                className={`bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm border ${term.is_current ? "border-neon-blue/50" : "border-gray-200 dark:border-zinc-800"}`}
              >
                {/* Term header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${term.is_current ? "bg-neon-blue/5 border-neon-blue/20" : "bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-800"}`}>
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleCollapse(term.id)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition">
                      {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </button>
                    <h2 className="font-bold font-[family-name:var(--font-orbitron)] text-gray-900 dark:text-white">
                      {term.name}
                    </h2>
                    {term.is_current && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-neon-blue/10 border border-neon-blue/30 rounded-full text-xs font-mono text-neon-blue">
                        <Star size={10} fill="currentColor" /> Current
                      </span>
                    )}
                    <span className="text-sm text-gray-400 dark:text-gray-500">
                      {termMembers.length} member{termMembers.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!term.is_current && (
                      <button
                        onClick={() => handleSetCurrent(term.id)}
                        className="px-3 py-1.5 text-xs font-semibold border border-neon-blue/40 text-neon-blue rounded-lg hover:bg-neon-blue/10 transition"
                      >
                        Set as Current
                      </button>
                    )}
                    <button
                      onClick={() => openAddMemberModal(term.name)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-neon-blue text-white rounded-lg hover:bg-neon-blue/90 transition"
                    >
                      <Plus size={14} /> Add Member
                    </button>
                    <button
                      onClick={() => handleDeleteTerm(term.id, term.name)}
                      className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      title="Delete term"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Members table */}
                {!isCollapsed && (
                  termMembers.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-400 dark:text-white/30 font-mono text-sm">
                      No members yet — click "Add Member" above.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-zinc-800">
                            <th className="px-6 py-3">Member</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Sort</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {termMembers.map(member => {
                            const imgUrl = getPhotoUrl(member.image);
                            return (
                              <tr key={member.id} className="border-b border-gray-50 dark:border-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/20 transition last:border-0">
                                <td className="px-6 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-zinc-700 flex items-center justify-center border border-gray-200 dark:border-zinc-600">
                                      {imgUrl
                                        ? <img src={imgUrl} alt={member.name} className="w-full h-full object-cover" />
                                        : <ImageIcon size={18} className="text-gray-400" />}
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-800 dark:text-gray-200">{member.name}</p>
                                      {member.email && <p className="text-xs text-gray-400">{member.email}</p>}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-3 text-gray-600 dark:text-gray-400 text-sm">{member.role}</td>
                                <td className="px-6 py-3 text-gray-500 text-sm">{member.sort_order}</td>
                                <td className="px-6 py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => openEditMemberModal(member)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition">
                                      <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDeleteMember(member.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition">
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>
            );
          })}

          {/* Orphan members (term name doesn't match any term) */}
          {orphanMembers.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm border border-amber-400/30">
              <div className="flex items-center gap-3 px-6 py-4 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-200/50 dark:border-amber-400/20">
                <h2 className="font-bold font-[family-name:var(--font-orbitron)] text-amber-600 dark:text-amber-400">Unassigned</h2>
                <span className="text-sm text-gray-400">{orphanMembers.length} member{orphanMembers.length !== 1 ? "s" : ""} with no matching term</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-zinc-800">
                      <th className="px-6 py-3">Member</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3">Term Value</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orphanMembers.map(member => {
                      const imgUrl = getPhotoUrl(member.image);
                      return (
                        <tr key={member.id} className="border-b border-gray-50 dark:border-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/20 transition last:border-0">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-zinc-700 flex items-center justify-center border border-gray-200 dark:border-zinc-600">
                                {imgUrl
                                  ? <img src={imgUrl} alt={member.name} className="w-full h-full object-cover" />
                                  : <ImageIcon size={18} className="text-gray-400" />}
                              </div>
                              <p className="font-medium text-gray-800 dark:text-gray-200">{member.name}</p>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-gray-600 dark:text-gray-400 text-sm">{member.role}</td>
                          <td className="px-6 py-3 text-amber-500 text-sm font-mono">"{member.term}"</td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openEditMemberModal(member)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => handleDeleteMember(member.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Add Academic Year Modal ─────────────────────────────────────────────────────── */}
      {termModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm border border-gray-200 dark:border-zinc-800 shadow-2xl relative">
            <button onClick={() => setTermModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:hover:text-white">
              <X size={22} />
            </button>
            <div className="p-6">
              <h2 className="text-xl font-bold dark:text-white mb-5 font-[family-name:var(--font-orbitron)]">Add Academic Year</h2>
              <form onSubmit={handleAddTerm} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Academic Year Name</label>
                  <input
                    type="text"
                    value={newTermName}
                    onChange={e => setNewTermName(e.target.value)}
                    placeholder="e.g. 251-252"
                    required
                    autoFocus
                    className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue"
                  />
                  <p className="mt-1 text-xs text-gray-400">Format: three digits, dash, three digits (e.g. 251-252)</p>
                </div>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newTermIsCurrent}
                    onChange={e => setNewTermIsCurrent(e.target.checked)}
                    className="w-4 h-4 accent-neon-blue"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mark as <span className="text-neon-blue">Current</span> academic year
                    <span className="block text-xs text-gray-400 font-normal">Members of this academic year will appear on the home page</span>
                  </span>
                </label>
                <div className="pt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setTermModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={termSaving} className="px-4 py-2 bg-neon-blue text-white rounded-lg hover:bg-neon-blue/90 transition disabled:opacity-60">
                    {termSaving ? "Saving…" : "Create Academic Year"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Member Modal ───────────────────────────────────────────── */}
      {memberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg border border-gray-200 dark:border-zinc-800 shadow-2xl relative my-4">
            <button onClick={() => setMemberModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:hover:text-white z-10">
              <X size={24} />
            </button>
            <div className="p-6">
              <h2 className="text-2xl font-bold dark:text-white mb-1 font-[family-name:var(--font-orbitron)]">
                {editingMember ? "Edit Member" : "Add Member"}
              </h2>
              <p className="text-sm text-neon-blue font-mono mb-5">{mTerm}</p>

              <form onSubmit={handleMemberSubmit} className="space-y-4">
                {/* Current image preview */}
                {editingMember && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                    <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-zinc-700 flex items-center justify-center border border-gray-200 dark:border-zinc-600">
                      {getPhotoUrl(editingMember.image)
                        ? <img src={getPhotoUrl(editingMember.image)!} alt={editingMember.name} className="w-full h-full object-cover" />
                        : <ImageIcon size={22} className="text-gray-400" />}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Current photo — upload below to replace</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                    <input type="text" value={mName} onChange={e => setMName(e.target.value)} required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role *</label>
                    <input type="text" value={mRole} onChange={e => setMRole(e.target.value)} required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                    <textarea value={mBio} onChange={e => setMBio(e.target.value)} rows={2}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input type="text" value={mEmail} onChange={e => setMEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort Order</label>
                    <input type="number" value={mSortOrder} onChange={e => setMSortOrder(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Twitter / X</label>
                    <input type="text" value={mTwitter} onChange={e => setMTwitter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Term</label>
                    <select value={mTerm} onChange={e => setMTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 dark:text-white outline-none focus:border-neon-blue">
                      {terms.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">LinkedIn URL</label>
                    <input type="text" value={mLinkedin} onChange={e => setMLinkedin(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-transparent dark:text-white outline-none focus:border-neon-blue" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profile Image</label>
                  <input type="file" accept="image/*" onChange={e => setMImageFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-neon-blue/10 file:text-neon-blue hover:file:bg-neon-blue/20" />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setMemberModalOpen(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-neon-blue text-white rounded-lg hover:bg-neon-blue/90 transition">
                    Save Member
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
