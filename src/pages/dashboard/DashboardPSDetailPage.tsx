import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { problemStatements } from "../../data/problemStatements";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { eventConfig } from "../../config/eventConfig";
import Seo from "../../components/seo/Seo";

export default function DashboardPSDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ps = problemStatements.find((p) => p.id === id);

  if (!ps) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg font-bold text-gray-900 mb-2">Problem Statement Not Found</p>
        <Button variant="secondary" size="sm" onClick={() => navigate("/dashboard/problem-statements")}>
          Back to Problem Statements
        </Button>
      </div>
    );
  }

  return (
    <>
      <Seo title={`${ps.localPsNumber} | ${eventConfig.hackathonName}`} noindex />

      <div className="mb-6">
        <button onClick={() => navigate("/dashboard/problem-statements")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-violet-700 transition-colors mb-4 focus:outline-none focus:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Problem Statements
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono text-sm bg-violet-50 text-violet-800 px-3 py-1.5 rounded-lg border border-violet-200 tracking-wider font-bold">
                {ps.localPsNumber}
              </span>
              <Badge variant={ps.category === "Software" ? "blue" : "amber"}>{ps.category}</Badge>
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">{ps.title}</h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant="violet">{ps.theme}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "PS Number", value: ps.localPsNumber },
            { label: "Category", value: ps.category },
            { label: "Theme", value: ps.theme },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
              <p className="text-sm font-bold text-gray-800">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500 leading-relaxed">
            This problem statement is available for team selection. Use the Team page to select this problem for your team.
          </p>
        </div>
      </div>
    </>
  );
}
