import React from "react";
import { BookOpen, LogIn, LogOut, History, HelpCircle } from "lucide-react";
import { auth, loginWithGoogle, logout } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { cn } from "../lib/utils";

interface HeaderProps {
  onShowHistory: () => void;
  onShowHome: () => void;
  onShowGuide: () => void;
}

export default function Header({ onShowHistory, onShowHome, onShowGuide }: HeaderProps) {
  const [user] = useAuthState(auth);

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={onShowHome}
        >
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">Tiểu học Lê Kim Lăng</h1>
            <p className="text-xs text-orange-600 font-medium">Cô giáo AI chấm chính tả</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={onShowGuide}
            className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-600 rounded-full font-bold hover:bg-pink-100 transition-all border border-pink-100 shadow-sm"
          >
            <HelpCircle size={18} />
            <span className="hidden sm:inline">Hướng dẫn chấm</span>
          </button>

          {user ? (
            <>
              <button 
                onClick={onShowHistory}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                title="Lịch sử"
              >
                <History size={22} />
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
                <img 
                  src={user.photoURL || ""} 
                  alt={user.displayName || ""} 
                  className="w-8 h-8 rounded-full border border-gray-200"
                />
                <button 
                  onClick={logout}
                  className="text-sm font-medium text-gray-600 hover:text-red-500 transition-colors"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </>
          ) : (
            <button 
              onClick={loginWithGoogle}
              className="p-2 text-gray-400 hover:text-orange-500 transition-colors"
              title="Đăng nhập"
            >
              <LogIn size={20} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
