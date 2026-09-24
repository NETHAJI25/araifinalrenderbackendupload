import { problemStatements } from "../../data/problemStatements";
import { Badge } from "../../components/ui/Badge";

export default function AdminProblemStatements() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Problem Statements</h1>
      </div>
      
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Theme</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {problemStatements.slice(0, 50).map((ps) => (
                <tr key={ps.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono font-medium text-gray-900">{ps.id}</td>
                  <td className="px-6 py-4">{ps.title}</td>
                  <td className="px-6 py-4"><Badge variant={ps.category === "Software" ? "blue" : "violet"}>{ps.category}</Badge></td>
                  <td className="px-6 py-4">{ps.theme}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
