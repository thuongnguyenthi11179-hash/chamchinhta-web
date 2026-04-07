import React, { useState, useRef, useEffect } from "react";
import { Camera, Upload, Type, Languages, Sparkles, Loader2, RefreshCw, X, User } from "lucide-react";
import { cn } from "../lib/utils";

interface InputSectionProps {
  onAnalyze: (data: { text?: string; imageBase64?: string; mimeType?: string }, subject: "Vietnamese" | "English") => void;
  onOpenCamera: (subject: "Vietnamese" | "English") => void;
  isLoading: boolean;
  capturedImage?: string | null;
  studentName: string;
  onStudentNameChange: (name: string) => void;
}

export default function InputSection({ 
  onAnalyze, 
  onOpenCamera, 
  isLoading, 
  capturedImage,
  studentName,
  onStudentNameChange
}: InputSectionProps) {
  const [subject, setSubject] = useState<"Vietnamese" | "English">("Vietnamese");
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (capturedImage) {
      setPreview(capturedImage);
      setMimeType("image/jpeg");
      setText("");
    }
  }, [capturedImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setMimeType(file.type);
        setText("");
      };
      reader.readAsDataURL(file);
    }
    // Reset value to allow selecting the same file again
    e.target.value = "";
  };

  const handleSubmit = () => {
    console.log("Submit clicked", { hasPreview: !!preview, textLength: text.length, studentName });
    if (preview) {
      const base64 = preview.split(",")[1];
      onAnalyze({ imageBase64: base64, mimeType: mimeType || "image/jpeg" }, subject);
    } else if (text.trim()) {
      onAnalyze({ text }, subject);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-50">
      {/* Student Name Input */}
      <div className="mb-6 relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400 group-focus-within:text-orange-600 transition-colors">
          <User size={20} />
        </div>
        <input
          type="text"
          value={studentName}
          onChange={(e) => onStudentNameChange(e.target.value)}
          placeholder="Nhập tên của em..."
          className="w-full pl-12 pr-6 py-4 bg-orange-50/80 rounded-2xl border-2 border-orange-100 focus:border-orange-500 focus:bg-white focus:ring-0 text-lg font-medium transition-all outline-none placeholder:text-orange-400 shadow-sm"
        />
      </div>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setSubject("Vietnamese")}
          className={cn(
            "flex-1 py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 border-2",
            subject === "Vietnamese" 
              ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-200 scale-105" 
              : "bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100"
          )}
        >
          <Languages size={24} />
          Tiếng Việt
        </button>
        <button
          onClick={() => setSubject("English")}
          className={cn(
            "flex-1 py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 border-2",
            subject === "English" 
              ? "bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-200 scale-105" 
              : "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
          )}
        >
          <Languages size={24} />
          English
        </button>
      </div>

      <div className="space-y-6">
        <div className="relative">
          {preview ? (
            <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 aspect-video bg-gray-50">
              <img src={preview} alt="Preview" className="w-full h-full object-contain" />
              <button 
                onClick={() => setPreview(null)}
                className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                title="Xóa ảnh"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
              placeholder={subject === "Vietnamese" ? "Nhập văn bản cần chấm hoặc chụp ảnh..." : "Type text or take a photo to check..."}
              className="w-full h-48 p-6 bg-orange-50/30 rounded-2xl border-2 border-orange-100 focus:border-orange-500 focus:bg-white focus:ring-0 text-lg resize-none placeholder:text-gray-400 transition-all outline-none shadow-inner"
            />
          )}
        </div>

        <div className="flex gap-4">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
          />
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            ref={cameraInputRef} 
            onChange={handleFileChange} 
          />
          
          <button 
            onClick={() => onOpenCamera(subject)}
            className="flex-1 py-4 bg-orange-50 text-orange-700 rounded-2xl font-semibold hover:bg-orange-100 transition-colors flex items-center justify-center gap-2 border border-orange-100"
          >
            <Camera size={22} />
            Chụp ảnh
          </button>
          <button 
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 py-4 bg-blue-50 text-blue-700 rounded-2xl font-semibold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 md:hidden border border-blue-100"
            title="Sử dụng camera hệ thống"
          >
            <RefreshCw size={22} />
            Hệ thống
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-4 bg-purple-50 text-purple-700 rounded-2xl font-semibold hover:bg-purple-100 transition-all flex items-center justify-center gap-2 border border-purple-100"
          >
            <Upload size={22} />
            Tải bài lên
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading || (!text.trim() && !preview)}
          className="w-full py-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-bold text-xl shadow-xl shadow-orange-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={24} />
              <span>Đang chấm bài...</span>
            </>
          ) : (
            <>
              <Sparkles size={24} />
              <span>Bắt đầu chấm bài</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
