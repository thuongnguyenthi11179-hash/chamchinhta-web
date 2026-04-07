import React, { useEffect, useRef, useState } from "react";
import { Star, Volume2, Download, FileText, RotateCcw, CheckCircle2 } from "lucide-react";
import { CorrectionResult } from "../services/gemini";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { playPCM } from "../lib/audio";
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  BorderStyle, 
  AlignmentType,
  VerticalAlign,
  ShadingType
} from "docx";
import { saveAs } from "file-saver";

interface ResultSectionProps {
  result: CorrectionResult;
  studentName: string;
  audioBase64?: string;
  onReset: () => void;
}

export default function ResultSection({ result, studentName, audioBase64, onReset }: ResultSectionProps) {
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result.stars >= 4) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#fbbf24', '#3b82f6']
      });
    }
    
    // Play success sound if possible
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3");
    audio.play().catch(() => {});
  }, [result]);

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadDocx = async () => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    console.log("Starting .docx generation...");

    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Header
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "TRƯỜNG TIỂU HỌC LÊ KIM LĂNG",
                  bold: true,
                  size: 32,
                  color: "f97316",
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "CÔ GIÁO AI CHẤM CHÍNH TẢ",
                  bold: true,
                  size: 24,
                  color: "ea580c",
                }),
              ],
              spacing: { after: 400 },
            }),

            // Student Info
            new Paragraph({
              children: [
                new TextRun({
                  text: `Học sinh: ${studentName || "Chưa nhập tên"}`,
                  bold: true,
                  size: 28,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Môn: ${result.subject === "Vietnamese" ? "Tiếng Việt" : "English"}`,
                  size: 24,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Đánh giá: ${"★".repeat(result.stars)}${"☆".repeat(5 - result.stars)} (${result.stars}/5 sao)`,
                  bold: true,
                  size: 24,
                  color: "fbbf24",
                }),
              ],
              spacing: { after: 400 },
            }),

            // Corrections Section
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [
                new TextRun({
                  text: "SỬA LẠI CHO ĐÚNG",
                  bold: true,
                  size: 28,
                  color: "dc2626",
                }),
              ],
              spacing: { before: 200, after: 200 },
            }),

            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Lỗi sai", bold: true })] })],
                      shading: { fill: "fee2e2", type: ShadingType.CLEAR },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Sửa lại", bold: true })] })],
                      shading: { fill: "dcfce7", type: ShadingType.CLEAR },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Giải thích", bold: true })] })],
                      shading: { fill: "f3f4f6", type: ShadingType.CLEAR },
                    }),
                  ],
                }),
                ...result.highlights.map(h => new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h.text, color: "dc2626", strike: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h.error, color: "16a34a", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h.explanation, size: 20, italics: true })] })] }),
                  ],
                })),
              ],
            }),

            // Full Texts
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [
                new TextRun({
                  text: "BÀI VIẾT CỦA EM",
                  bold: true,
                  size: 28,
                  color: "f97316",
                }),
              ],
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: result.originalText, size: 24 })],
              spacing: { after: 400 },
            }),

            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [
                new TextRun({
                  text: "BÀI ĐÃ SỬA HOÀN CHỈNH",
                  bold: true,
                  size: 28,
                  color: "16a34a",
                }),
              ],
              spacing: { before: 200, after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: result.correctedText, size: 24, bold: true })],
              spacing: { after: 400 },
            }),

            // AI Comment
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [
                new TextRun({
                  text: "LỜI KHUYÊN TỪ CÔ GIÁO AI",
                  bold: true,
                  size: 28,
                  color: "1e40af",
                }),
              ],
              spacing: { before: 200, after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: `"${result.comment}"`, italics: true, size: 24, color: "1e3a8a" })],
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const fileName = studentName 
        ? `ket-qua-${studentName.toLowerCase().replace(/\s+/g, '-')}.docx`
        : `ket-qua-cham-bai.docx`;
        
      saveAs(blob, fileName);
      console.log(".docx download triggered successfully");
    } catch (error: any) {
      console.error(".docx generation failed:", error);
      alert(`Lỗi tải Word: ${error.message || "Vui lòng thử lại sau!"}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<{ source: AudioBufferSourceNode; audioContext: AudioContext } | null>(null);

  const handlePlayAudio = async () => {
    console.log("Play audio clicked", { hasAudio: !!audioBase64, isPlaying: isAudioPlaying });
    if (audioBase64) {
      if (isAudioPlaying && audioRef.current) {
        audioRef.current.source.stop();
        setIsAudioPlaying(false);
        return;
      }

      const result = await playPCM(audioBase64);
      if (result) {
        audioRef.current = result;
        setIsAudioPlaying(true);
        result.source.onended = () => {
          setIsAudioPlaying(false);
          audioRef.current = null;
        };
      }
    }
  };

  const renderHighlightedText = (text: string, highlights: any[]) => {
    if (!highlights || highlights.length === 0) return text;

    // Create a regex to match all highlight texts
    // Sort by length descending to match longer phrases first
    const sortedHighlights = [...highlights].sort((a, b) => b.text.length - a.text.length);
    const escapedHighlights = sortedHighlights.map(h => h.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escapedHighlights.join('|')})`, 'g');
    
    const segments = text.split(regex);
    
    return segments.map((segment, i) => {
      const isHighlight = highlights.some(h => h.text === segment);
      if (isHighlight) {
        return (
          <span key={i} className="text-red-600 font-bold underline decoration-red-600 decoration-2 underline-offset-4 bg-red-50 px-0.5 rounded">
            {segment}
          </span>
        );
      }
      return segment;
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div ref={resultRef} id="result-container" className="bg-white rounded-3xl shadow-2xl shadow-gray-200 border border-gray-50 overflow-hidden">
        {/* Header with Stars */}
        <div className="bg-gradient-to-b from-orange-50 to-white p-8 text-center border-b border-orange-100">
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <motion.div
                key={s}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: s * 0.1, type: "spring" }}
              >
                <Star 
                  size={48} 
                  className={cn(
                    "transition-all",
                    s <= result.stars ? "fill-yellow-400 text-yellow-400 drop-shadow-md" : "text-gray-200"
                  )} 
                />
              </motion.div>
            ))}
          </div>
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
            {result.subject === "English" ? (
              <>
                {result.stars === 5 
                  ? "Tuyệt vời! Excellent job! You're a spelling genius! 🌟" 
                  : result.stars === 4 
                    ? "Rất tốt! Very good! Just a little more focus. ✨" 
                    : result.stars === 3
                      ? "Khá tốt! Good job! Keep practicing. 💪"
                      : result.stars === 2
                        ? "Cố gắng lên nhé! Keep trying! You can do it. ❤️"
                        : "Đừng nản lòng! Don't give up! Keep learning. 🌱"}
              </>
            ) : (
              <>
                {result.stars === 5 
                  ? "Tuyệt vời! Em là một thiên tài chính tả đấy! 🌟" 
                  : result.stars === 4 
                    ? "Rất tốt! Em chỉ cần chú ý thêm một chút xíu nữa thôi. ✨" 
                    : result.stars === 3
                      ? "Khá tốt! Hãy luyện tập thêm để đạt kết quả cao hơn nhé. 💪"
                      : result.stars === 2
                        ? "Cố gắng lên nhé! Cô tin em sẽ làm tốt hơn ở lần sau. ❤️"
                        : "Đừng nản lòng nhé! Mỗi lần sai là một lần học thêm điều mới. 🌱"}
              </>
            )}
          </h2>
          {studentName && (
            <p className="text-orange-600 font-bold text-lg mb-1">
              Học sinh: {studentName}
            </p>
          )}
          <p className="text-gray-600 font-medium text-xs">Bạn đạt được {result.stars}/5 sao</p>
        </div>

        <div className="p-8 space-y-10">
          {/* Highlights Section - Renamed to "Sửa lại cho đúng" - MOVED UP */}
          {result.highlights.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-2 h-8 bg-red-500 rounded-full"></span>
                Sửa lại cho đúng
              </h3>
              <div className="grid gap-4">
                {result.highlights.map((h, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold border border-red-100">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                        <span className="text-red-500 font-bold line-through decoration-red-300 decoration-2">{h.text}</span>
                        <span className="text-gray-400 font-bold">→</span>
                        <span className="text-green-600 font-black text-lg">{h.error}</span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded uppercase">
                          {h.type === 'spelling' ? 'Chính tả' : h.type === 'grammar' ? 'Ngữ pháp' : h.type === 'punctuation' ? 'Dấu câu' : 'Từ vựng'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-50 italic">
                        {h.explanation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comparison Section */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-orange-500 uppercase tracking-wider flex items-center gap-2">
                <FileText size={16} />
                Bài viết của em
              </h3>
              <div className="p-6 bg-gray-50 rounded-2xl text-lg leading-relaxed text-gray-700 min-h-[200px] border border-gray-100 whitespace-pre-wrap">
                {renderHighlightedText(result.originalText, result.highlights)}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-green-500 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 size={16} />
                Bài đã sửa hoàn chỉnh
              </h3>
              <div className="p-6 bg-green-50 rounded-2xl text-lg leading-relaxed text-gray-800 min-h-[200px] border border-green-100 whitespace-pre-wrap">
                {result.correctedText}
              </div>
            </div>
          </div>

          {/* AI Teacher Comment */}
          <div className="p-8 bg-blue-50 rounded-3xl border border-blue-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Volume2 size={80} />
            </div>
            <div className="flex items-start gap-6 relative z-10">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-blue-900 mb-1">Lời khuyên từ cô giáo AI</h3>
                  <p className="text-blue-800 text-lg italic leading-relaxed">"{result.comment}"</p>
                </div>
                {audioBase64 && (
                  <button 
                    onClick={handlePlayAudio}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all shadow-md active:scale-95",
                      isAudioPlaying
                        ? "bg-orange-500 text-white shadow-orange-100"
                        : "bg-blue-500 text-white shadow-blue-100 hover:bg-blue-600"
                    )}
                  >
                    <Volume2 size={20} />
                    {isAudioPlaying ? "Đang phát..." : "Nghe nhận xét"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button 
          onClick={handleDownloadDocx}
          disabled={isDownloading}
          className={cn(
            "flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all shadow-sm",
            isDownloading 
              ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
              : "bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100"
          )}
        >
          {isDownloading ? (
            <>
              <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              Đang tạo file...
            </>
          ) : (
            <>
              <FileText size={22} />
              Tải bài chấm (.docx)
            </>
          )}
        </button>
        <button 
          onClick={onReset}
          className="flex items-center gap-2 px-8 py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200"
        >
          <RotateCcw size={22} />
          Làm bài mới
        </button>
      </div>
    </div>
  );
}
