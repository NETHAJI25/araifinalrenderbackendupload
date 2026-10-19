import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { SplitText } from "../components/animations/SplitText";
import { problemStatements, themes } from "../data/problemStatements";
import { eventConfig } from "../config/eventConfig";
import Seo from "../components/seo/Seo";

const PAGE_SIZE = 20;

export default function ProblemStatementsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [theme, setTheme] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return problemStatements.filter((ps) => {
      const matchQ = !q || ps.title.toLowerCase().includes(q) || ps.localPsNumber.toLowerCase().includes(q);
      const matchCat = !category || ps.category === category;
      const matchTheme = !theme || ps.theme === theme;
      return matchQ && matchCat && matchTheme;
    });
  }, [query, category, theme]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function clearFilters() { setQuery(""); setCategory(""); setTheme(""); setPage(1); }
  function onFilter(fn: () => void) { fn(); setPage(1); }

  return (
    <>
      <Seo
        title={`Problem Statements | ${eventConfig.hackathonName} Hackathon`}
        description={`Explore 240+ hackathon problem statements at ${eventConfig.hackathonName} across 16 themes including Smart Education, Healthcare, Agriculture and more. Filter by software or hardware and register to select yours.`}
        path="/problem-statements"
      />

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <p className="text-violet-700 text-xs font-bold tracking-widest uppercase mb-2">Challenges</p>
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            <SplitText text="Problem Statements" />
          </h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 text-sm">
            {problemStatements.length} problem statements across {themes.length} themes.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="search" placeholder="Search by title or PS number..."
              value={query} onChange={(e) => onFilter(() => setQuery(e.target.value))}
              className="input-field pl-10 text-sm" aria-label="Search problem statements" />
          </div>
          <select value={category} onChange={(e) => onFilter(() => setCategory(e.target.value))}
            className="input-field text-sm sm:w-44" aria-label="Filter by category">
            <option value="">All Categories</option>
            <option value="Software">Software</option>
            <option value="Hardware">Hardware</option>
          </select>
          <select value={theme} onChange={(e) => onFilter(() => setTheme(e.target.value))}
            className="input-field text-sm sm:w-52" aria-label="Filter by theme">
            <option value="">All Themes</option>
            {themes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {(query || category || theme) && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 whitespace-nowrap">
              <X className="w-4 h-4" /> Reset
            </button>
          )}
        </div>

        {/* Count row */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-700">
            {filtered.length} Problem Statement{filtered.length !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-gray-400">
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
        </div>

        {/* SIH-style table */}
        <p className="sm:hidden text-xs text-gray-400 mb-2 text-center">Swipe the table sideways to see all columns →</p>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm" style={{ minWidth: 640 }}>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["SNO", "Problem Statement", "Category", "PS Number", "Theme"].map((col) => (
                  <th key={col} scope="col"
                    className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap first:pl-5 last:pr-5">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-gray-400 text-sm">
                    No problem statements match your search.{" "}
                    <button onClick={clearFilters} className="text-violet-700 underline font-medium">Clear Filters</button>
                  </td>
                </tr>
              ) : paginated.map((ps, i) => (
                <motion.tr
                  key={ps.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.01 }}
                  className="hover:bg-violet-50/40 transition-colors group">
                  <td className="px-5 py-3.5 text-gray-400 font-mono text-xs">{String(ps.serialNo).padStart(2, "0")}</td>
                  <td className="px-4 py-3.5 text-gray-900 font-medium max-w-[360px]">
                    <Link to={`/problem-statements/${ps.id}`}
                      className="line-clamp-2 group-hover:text-violet-700 transition-colors hover:underline">
                      {ps.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border
                      ${ps.category === "Software" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                      {ps.category}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-violet-700 text-xs font-semibold whitespace-nowrap">
                    {ps.localPsNumber}
                  </td>
                  <td className="px-4 py-3.5 pr-5 text-gray-600 text-xs">{ps.theme}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-between mt-4">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) p = i + 1;
                else if (safePage <= 3) p = i + 1;
                else if (safePage >= totalPages - 2) p = totalPages - 4 + i;
                else p = safePage - 2 + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors
                      ${safePage === p ? "bg-violet-700 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                    {p}
                  </button>
                );
              })}
              {totalPages > 5 && safePage < totalPages - 2 && (
                <span className="px-1 text-gray-400">…{totalPages}</span>
              )}
            </div>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
