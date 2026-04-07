import React, { useRef, useEffect, useState } from "react";
import { X, Camera, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64: string) => void;
}

export default function CameraModal({ isOpen, onClose, onCapture }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const startCamera = async () => {
    stopCamera();
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Trình duyệt của bạn không hỗ trợ camera.");
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      });
      
      setStream(newStream);
      setError(null);
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      setError(err.message || "Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.");
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setIsReady(false);
    }
    return () => stopCamera();
  }, [isOpen, facingMode]);

  // Set srcObject when video element is available
  useEffect(() => {
    if (stream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = stream;
      
      const handleReady = () => {
        console.log("Camera video is ready");
        setIsReady(true);
      };

      video.onloadedmetadata = () => {
        console.log("Video metadata loaded", { width: video.videoWidth, height: video.videoHeight });
        video.play().catch(e => console.error("Video play error:", e));
        handleReady();
      };

      video.onplaying = () => {
        console.log("Video started playing");
        handleReady();
      };

      // Fallback if metadata already loaded or playing
      if (video.readyState >= 2 || !video.paused) {
        console.log("Video already ready or playing", { readyState: video.readyState, paused: video.paused });
        handleReady();
      }

      // Final fallback after 2 seconds
      const timer = setTimeout(() => {
        if (!isReady) {
          console.log("Ready timeout fallback triggered");
          handleReady();
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [stream]);

  const captureImage = () => {
    console.log("captureImage called", { isReady, hasVideo: !!videoRef.current, hasCanvas: !!canvasRef.current });
    if (videoRef.current && canvasRef.current) {
      setIsCapturing(true);
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Ensure dimensions are valid
        const width = video.videoWidth || video.clientWidth || 1280;
        const height = video.videoHeight || video.clientHeight || 720;
        
        console.log("Capturing with dimensions:", { width, height });
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext("2d", { alpha: false });
        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          const base64 = canvas.toDataURL("image/jpeg", 0.85);
          console.log("Image captured successfully, length:", base64.length);
          
          if (base64.length < 100) {
            throw new Error("Dữ liệu ảnh quá nhỏ, có thể camera chưa sẵn sàng.");
          }
          
          // Small delay for the flash effect to be visible
          setTimeout(() => {
            onCapture(base64);
            onClose();
          }, 100);
        } else {
          throw new Error("Không thể khởi tạo bộ vẽ ảnh.");
        }
      } catch (err: any) {
        console.error("Capture error:", err);
        setError("Lỗi khi chụp ảnh: " + (err.message || "Vui lòng thử lại."));
        setIsCapturing(false);
      }
    } else {
      console.error("Video or Canvas ref is missing");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-full max-w-2xl bg-gray-900 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="aspect-video bg-black flex items-center justify-center relative">
              {error ? (
                <div className="text-white text-center p-8">
                  <p className="mb-4">{error}</p>
                  <button
                    onClick={startCamera}
                    className="px-6 py-2 bg-orange-500 rounded-full font-bold"
                  >
                    Thử lại
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {isCapturing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 bg-white z-20"
                    />
                  )}
                  {!isReady && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 text-white">
                      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
                      <p className="text-sm font-medium">Đang khởi động camera...</p>
                    </div>
                  )}
                </>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="p-8 flex justify-center items-center gap-6 bg-gray-900">
              <button
                onClick={() => setFacingMode(prev => prev === "user" ? "environment" : "user")}
                className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors disabled:opacity-30"
                title="Đổi camera"
                disabled={!isReady}
              >
                <RefreshCw size={24} className={!isReady ? "" : "animate-pulse"} />
              </button>
              <button
                onClick={captureImage}
                disabled={!!error || !isReady}
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all disabled:opacity-30 disabled:scale-90 group"
              >
                <div className={cn(
                  "w-16 h-16 border-4 border-gray-900 rounded-full transition-all",
                  isReady ? "group-hover:scale-110" : ""
                )} />
              </button>
              <div className="w-14" /> {/* Spacer for balance */}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
