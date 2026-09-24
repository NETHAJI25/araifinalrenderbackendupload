import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { announcementService } from "../../services/announcementService";
import type { Announcement } from "../../types";

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "Normal" as "Normal" | "Important" | "Urgent",
    status: "published" as "draft" | "published"
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    setIsLoading(true);
    try {
      const data = await announcementService.getAll();
      setAnnouncements(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (currentId) {
        await announcementService.update(currentId, formData);
      } else {
        await announcementService.create(formData);
      }
      setIsEditing(false);
      loadAnnouncements();
    } catch (error) {
      console.error(error);
      alert("Failed to save announcement");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await announcementService.delete(id);
      loadAnnouncements();
    } catch (error) {
      console.error(error);
    }
  }

  function handleEdit(a: Announcement) {
    setFormData({
      title: a.title,
      content: a.content,
      priority: a.priority,
      status: a.status
    });
    setCurrentId(a.id);
    setIsEditing(true);
  }

  function openNew() {
    setFormData({ title: "", content: "", priority: "Normal", status: "published" });
    setCurrentId(null);
    setIsEditing(true);
  }

  if (isEditing) {
    return (
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900">{currentId ? "Edit" : "New"} Announcement</h1>
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input required type="text" className="input-field w-full" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea required rows={4} className="input-field w-full" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select className="input-field w-full" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}>
                <option value="Normal">Normal</option>
                <option value="Important">Important</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="input-field w-full" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button type="submit">Save Announcement</Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Announcements</h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage global dashboard announcements.</p>
        </div>
        <Button onClick={openNew} leftIcon={<Plus className="w-4 h-4" />}>New Announcement</Button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="card p-12 flex justify-center">
            <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : announcements.length === 0 ? (
          <div className="card p-12 text-center text-gray-500">No announcements found.</div>
        ) : (
          announcements.map((a) => (
            <div key={a.id} className="card p-5 flex flex-col sm:flex-row gap-4 justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900">{a.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    a.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                    a.priority === 'Important' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{a.priority}</span>
                  {a.status === 'draft' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500">Draft</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">{a.content}</p>
                <p className="text-xs text-gray-400">Created: {new Date(a.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => handleEdit(a)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(a.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
