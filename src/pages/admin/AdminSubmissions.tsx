import { Link } from "react-router-dom";
import { Send, ExternalLink, ArrowUpRight } from "lucide-react";
import { eventConfig } from "../../config/eventConfig";

export default function AdminSubmissions() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
        <p className="text-gray-500 text-sm mt-1">
          Round 1 project submissions are collected through the official Google Form.
        </p>
      </div>

      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <Send className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="space-y-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">Submission form</h2>
              <p className="text-sm text-gray-600 mt-1">
                Teams submit their project after the Team Leader pays the Round 1 fee. All responses are stored in the
                linked Google Form — open its <strong>Responses</strong> tab in Google Forms to review them, then
                promote the selected teams to Round 2 from <strong>Manage Teams</strong>.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={eventConfig.submissionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 btn-primary px-4 py-2 rounded-lg text-sm font-semibold"
              >
                <ExternalLink className="w-4 h-4" /> Open Submission Form
              </a>
              <Link
                to="/admin/teams"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <ArrowUpRight className="w-4 h-4" /> Manage Teams &amp; Promote
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
