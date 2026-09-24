import { useRef, useState } from "react";
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react";
import { ProgressBar } from "./ProgressBar";

interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  label?: string;
  error?: string;
}

export function FileUpload({
  accept = ".ppt,.pptx,.pdf",
  maxSizeMB = 50,
  onFileSelect,
  onFileRemove,
  label,
  error: externalError,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFile(f: File) {
    setError(null);
    if (f.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }
    const validTypes = accept.split(",").map((t) => t.trim());
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!validTypes.includes(ext)) {
      setError(`File type not supported. Please upload: ${accept}`);
      return;
    }
    setFile(f);
    setUploadState("uploading");
    setProgress(0);
    // Simulate upload progress
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 20;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setProgress(100);
        setUploadState("success");
        onFileSelect(f);
      } else {
        setProgress(Math.round(p));
      }
    }, 200);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  function handleRemove() {
    setFile(null);
    setUploadState("idle");
    setProgress(0);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onFileRemove?.();
  }

  const displayError = externalError || error;

  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}

      {uploadState === "idle" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          aria-label="Upload file"
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-150
            ${isDragging
              ? "border-violet-500 bg-violet-50"
              : "border-gray-300 bg-gray-50 hover:border-violet-400 hover:bg-violet-50/40"
            } ${displayError ? "border-red-400" : ""}`}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
              <Upload className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Drag & drop your file here, or{" "}
                <span className="text-violet-700 underline">browse</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Accepted: {accept} — Max: {maxSizeMB}MB
              </p>
            </div>
          </div>
        </div>
      )}

      {(uploadState === "uploading" || uploadState === "success" || uploadState === "error") && file && (
        <div className="border border-gray-200 rounded-xl p-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
              <p className="text-xs text-gray-400">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              {uploadState === "success" && <CheckCircle className="w-5 h-5 text-green-500" />}
              {uploadState === "error" && <AlertCircle className="w-5 h-5 text-red-500" />}
              <button
                onClick={handleRemove}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {uploadState === "uploading" && (
            <div className="mt-3">
              <ProgressBar value={progress} size="sm" color="violet" />
              <p className="text-xs text-gray-500 mt-1">Uploading... {progress}%</p>
            </div>
          )}
          {uploadState === "success" && (
            <p className="text-xs text-green-600 mt-2 font-medium">Upload complete</p>
          )}
        </div>
      )}

      {displayError && (
        <p className="mt-1.5 text-sm text-red-600" role="alert">{displayError}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
