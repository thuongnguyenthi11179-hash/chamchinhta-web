import React, { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { Clock, Star, Languages, ChevronRight } from "lucide-react";
import { CorrectionResult } from "../services/gemini";
import { motion } from "motion/react";

interface HistorySectionProps {
  onSelect: (result: CorrectionResult) => void;
}

export default function HistorySection({ onSelect }: HistorySectionProps) {
  const [user] = useAuthState(auth);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, "corrections"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  if (loading) return <div className="text-center py-20 text-gray-400">Đang tải lịch sử...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Clock size={24} className="text-orange-500" />
        Lịch sử chấm bài
      </h2>

      {history.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
          <p className="text-gray-400">Bạn chưa có bài chấm nào. Hãy bắt đầu ngay!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {history.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelect(item)}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${item.subject === 'Vietnamese' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                  <Languages size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 truncate max-w-md">
                    {item.originalText.substring(0, 60)}...
                  </h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      {item.stars}/5 sao
                    </span>
                    <span>•</span>
                    <span>{new Date(item.createdAt).toLocaleDateString("vi-VN")}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-orange-500 transition-colors" />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
