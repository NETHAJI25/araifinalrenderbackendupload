import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, AlertCircle } from "lucide-react";
import { problemStatements } from "../data/problemStatements";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { eventConfig } from "../config/eventConfig";

export default function ProblemStatementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ps = problemStatements.find((p) => p.id === id);

  if (!ps) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Problem Statement Not Found</h1>
        <p className="text-gray-500 mb-6">The problem statement "{id}" does not exist.</p>
        <Link to="/problem-statements">
          <Button variant="primary">Browse All Problem Statements</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <title>{`${ps.localPsNumber} — ${ps.title} | ${eventConfig.hackathonName}`}</title>

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-gray-400 mb-4" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-violet-700 transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/problem-statements" className="hover:text-violet-700 transition-colors">Problem Statements</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-700 font-medium">{ps.localPsNumber}</span>
          </nav>

          <div className="flex flex-wrap items-start gap-4 justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="font-mono text-sm bg-violet-50 text-violet-800 px-3 py-1.5 rounded-lg border border-violet-200 tracking-wider font-bold">
                  {ps.localPsNumber}
                </span>
                <Badge variant={ps.category === "Software" ? "blue" : "amber"}>{ps.category}</Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">{ps.title}</h1>
              <div className="flex flex-wrap gap-2">
                <Badge variant="violet">{ps.theme}</Badge>
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <Button onClick={() => navigate(-1)} variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
              <Link to="/login">
                <Button variant="primary" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                  Register to Select
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="text-base font-bold text-gray-900 mb-3">Problem Statement Details</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                This problem statement is available for selection by registered teams. Log in or register to select this problem statement for your team.
              </p>
            </div>

            <div className="card p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">Problem Information</h2>
              <dl className="grid grid-cols-2 gap-4">
                {[
                  { label: "PS Number", value: ps.localPsNumber },
                  { label: "Category", value: ps.category },
                  { label: "Theme", value: ps.theme },
                  { label: "Serial No.", value: String(ps.serialNo) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</dt>
                    <dd className="text-sm font-bold text-gray-800">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            <div className="card p-5 bg-violet-50 border-violet-200">
              <p className="text-xs font-bold text-violet-700 uppercase tracking-wider mb-3">Quick Details</p>
              <dl className="space-y-3 text-sm">
                {[
                  { label: "PS Number", value: ps.localPsNumber },
                  { label: "Category", value: ps.category },
                  { label: "Theme", value: ps.theme },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-xs font-semibold text-violet-500 uppercase tracking-wider">{label}</dt>
                    <dd className="text-violet-800 font-semibold mt-0.5">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <Link to="/login" className="block">
              <Button variant="primary" size="lg" className="w-full" rightIcon={<ChevronRight className="w-4 h-4" />}>
                Register to Select
              </Button>
            </Link>
            <Link to="/problem-statements" className="block">
              <Button variant="secondary" size="md" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to All Problems
              </Button>
            </Link>
          </aside>
        </div>
      </div>
    </>
  );
}
