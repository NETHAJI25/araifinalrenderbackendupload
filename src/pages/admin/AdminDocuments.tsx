import { documents } from "../../data/documents";
import { Button } from "../../components/ui/Button";

export default function AdminDocuments() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <Button>Upload Document</Button>
      </div>
      
      <div className="grid sm:grid-cols-2 gap-6">
        {documents.map(doc => (
          <div key={doc.id} className="bg-white p-5 rounded-xl border border-gray-200">
            <h3 className="font-bold text-gray-900">{doc.title}</h3>
            <p className="text-sm text-gray-500 mb-3">{doc.description}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">Edit</Button>
              <Button size="sm" variant="danger">Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
