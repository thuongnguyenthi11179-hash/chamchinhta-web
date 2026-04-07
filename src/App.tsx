import React, { useState } from "react";
import Header from "./components/Header";
import InputSection from "./components/InputSection";
import ResultSection from "./components/ResultSection";
import HistorySection from "./components/HistorySection";
import CameraModal from "./components/CameraModal";
import GuideModal from "./components/GuideModal";
import { analyzeText, generateSpeech, CorrectionResult } from "./services/gemini";
import { auth, db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [user] = useAuthState(auth);
  const [view, setView] = useState<"home" | "result" | "history">("home");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CorrectionResult | null>(null);
  const [audioBase64, setAudioBase64] = useState<string>("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [pendingSubject, setPendingSubject] = useState<"Vietnamese" | "English">("Vietnamese");

  const handleAnalyze = async (
    data: { text?: string; imageBase64?: string; mimeType?: string },
    subject: "Vietnamese" | "English"
  ) => {
    console.log("handleAnalyze triggered", { hasText: !!data.text, hasImage: !!data.imageBase64, subject });
    setIsLoading(true);
    try {
      const res = await analyzeText(data, subject);
      console.log("Analysis result received:", res);
      setResult(res);
      
      // Generate speech for the comment
      const audio = await generateSpeech(res.comment, subject);
      setAudioBase64(audio);
      
      // Save to history if logged in
      if (user) {
        await addDoc(collection(db, "corrections"), {
          ...res,
          userId: user.uid,
          audioBase64: audio,
          createdAt: new Date().toISOString()
        });
      }
      
      setView("result");
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Có lỗi xảy ra khi chấm bài. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistory = (res: CorrectionResult) => {
    setResult(res);
    setAudioBase64((res as any).audioBase64 || "");
    setView("result");
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-gray-900 font-sans selection:bg-orange-100 selection:text-orange-900">
      <Header 
        onShowHistory={() => {
          setView("history");
          setCapturedImage(null);
        }} 
        onShowHome={() => {
          setView("home");
          setCapturedImage(null);
        }} 
        onShowGuide={() => setIsGuideOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {view === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4 max-w-2xl mx-auto">
                <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                  Chấm chính tả Tiếng Việt và Tiếng Anh cùng cô giáo trường <span className="text-orange-500">Tiểu học Lê Kim Lăng</span>
                </h2>
                <p className="text-base text-green-600 font-medium">
                  Chấm chính tả Tiếng Việt & Tiếng Anh siêu tốc bằng trí tuệ nhân tạo. <br />
                  Dễ dàng như chụp một tấm ảnh!
                </p>
              </div>

              <InputSection 
                onAnalyze={handleAnalyze} 
                isLoading={isLoading} 
                capturedImage={capturedImage}
                studentName={studentName}
                onStudentNameChange={setStudentName}
                onOpenCamera={(subj) => {
                  setPendingSubject(subj);
                  setCapturedImage(null);
                  setIsCameraOpen(true);
                }}
              />
              
              <div className="grid md:grid-cols-3 gap-8 pt-12">
                {[
                  { title: "Chụp ảnh bài viết", desc: "Sử dụng camera để nhận diện chữ viết tay của em.", color: "bg-orange-50" },
                  { title: "Phân tích thông minh", desc: "AI phát hiện lỗi sai và giải thích dễ hiểu.", color: "bg-blue-50" },
                  { title: "Nhận xét giọng nói", desc: "Nghe cô giáo AI nhận xét bài làm của em.", color: "bg-green-50" }
                ].map((item, i) => (
                  <div key={i} className={`${item.color} p-8 rounded-3xl border border-white shadow-sm`}>
                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <ResultSection 
                result={result} 
                studentName={studentName}
                audioBase64={audioBase64} 
                onReset={() => {
                  setView("home");
                  setCapturedImage(null);
                }} 
              />
            </motion.div>
          )}

          {view === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <HistorySection onSelect={handleSelectHistory} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <CameraModal 
        isOpen={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)} 
        onCapture={(base64) => {
          if (!base64) {
            console.error("No image data captured");
            setIsCameraOpen(false);
            return;
          }
          console.log("onCapture received data", { length: base64.length });
          setCapturedImage(base64); // Set for preview in InputSection
          setIsCameraOpen(false); // Close modal
        }}
      />

      <GuideModal 
        isOpen={isGuideOpen} 
        onClose={() => setIsGuideOpen(false)} 
      />

      <footer className="py-12 border-t border-gray-100 text-center">
        <p className="text-gray-400 text-sm">
          © 2026 AI Spelling Bee. Thiết kế cho học sinh tiểu học Việt Nam.
        </p>
      </footer>
    </div>
  );
}
