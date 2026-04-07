import React from "react";
import { X, Camera, Upload, CheckCircle2, Sparkles, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GuideModal({ isOpen, onClose }: GuideModalProps) {
  const steps = [
    {
      icon: <Camera className="text-orange-500" size={24} />,
      title: "Chụp ảnh bài viết",
      description: "Sử dụng camera để chụp ảnh bài viết của học sinh. Hãy đảm bảo ảnh rõ nét và đủ ánh sáng."
    },
    {
      icon: <Upload className="text-blue-500" size={24} />,
      title: "Tải ảnh lên",
      description: "Bạn cũng có thể tải ảnh có sẵn từ thư viện ảnh trong máy tính hoặc điện thoại của mình."
    },
    {
      icon: <CheckCircle2 className="text-green-500" size={24} />,
      title: "Kiểm tra ảnh",
      description: "Sau khi chụp hoặc tải ảnh, ảnh sẽ hiện ra để bạn xem lại. Bạn có thể xóa và chọn lại nếu cần."
    },
    {
      icon: <Sparkles className="text-purple-500" size={24} />,
      title: "Bắt đầu chấm bài",
      description: "Nhấn nút 'Bắt đầu chấm bài' để AI phân tích và chỉ ra các lỗi sai trong bài viết."
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-orange-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white">
                  <BookOpen size={24} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Hướng dẫn sử dụng</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/50 rounded-full transition-colors text-gray-500"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                    {step.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <button
                onClick={onClose}
                className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200"
              >
                Đã hiểu, bắt đầu thôi!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
