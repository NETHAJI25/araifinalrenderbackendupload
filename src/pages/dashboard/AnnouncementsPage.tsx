import { useState, useEffect } from "react";
import { Megaphone, Info, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { eventConfig } from "../../config/eventConfig";
import Seo from "../../components/seo/Seo";
import { announcementService } from "../../services/announcementService";
import type { Announcement } from "../../types";

const typeConfig = {
  info: { icon: <Info className="w-4 h-4" />, cls: "bg-blue-50 border-blue-200 text-blue-700" },
  success: { icon: <CheckCircle className="w-4 h-4" />, cls: "bg-green-50 border-green-200 text-green-700" },
  warning: { icon: <AlertTriangle className="w-4 h-4" />, cls: "bg-amber-50 border-amber-200 text-amber-700" },
  update: { icon: <RefreshCw className="w-4 h-4" />, cls: "bg-violet-50 border-violet-200 text-violet-700" },
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await announcementService.getAll();
        setAnnouncements(data.filter(a => a.status === 'published'));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <>
      <Seo title={`Announcements | ${eventConfig.hackathonName}`} noindex />
      <div className="mb-8">
        <p className="text-violet-700 text-xs font-bold tracking-widest uppercase mb-1">Updates</p>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-violet-600" /> Announcements
        </h1>
      </div>
      <div className="space-y-4">
        {isLoading ? (
          <div className="card p-12 flex justify-center">
             <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : announcements.length === 0 ? (
          <div className="card p-12 text-center text-gray-400 text-sm">No announcements yet.</div>
        ) : announcements.map((ann) => {
          let type = "info";
          if (ann.priority === "Urgent") type = "warning";
          else if (ann.priority === "Important") type = "update";
          
          const cfg = typeConfig[type as keyof typeof typeConfig] || typeConfig.info;
          return (
            <div key={ann.id} className={`card p-5 border ${cfg.cls.split(" ")[1]}`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.cls}`}>{cfg.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <h2 className="text-sm font-bold text-gray-900">{ann.title}</h2>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400">{new Date(ann.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{ann.content}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
