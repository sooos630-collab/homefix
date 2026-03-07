"use client";

import { FileText, LayoutDashboard, Plus, Settings } from "lucide-react";
import type { Quote } from "@/lib/types";

interface SidebarProps {
  currentView: "dashboard" | "editor" | "viewer";
  editingQuote: Quote | null;
  onNavigate: (view: "dashboard" | "editor" | "viewer") => void;
  onCreateNew: () => void;
}

export function Sidebar({
  currentView,
  editingQuote,
  onNavigate,
  onCreateNew,
}: SidebarProps) {
  return (
    <aside className="w-full md:w-64 bg-white border-r border-neutral-200 flex-shrink-0 flex flex-col print:hidden">
      <div className="p-6 border-b border-neutral-100">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
          <div className="w-8 h-8 bg-neutral-900 text-white rounded-lg flex items-center justify-center">
            <FileText size={18} />
          </div>
          꼼꼼한 집수리
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        <button
          onClick={() => onNavigate("dashboard")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
            currentView === "dashboard"
              ? "bg-neutral-100 text-neutral-900"
              : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
          }`}
        >
          <LayoutDashboard size={18} />
          대시보드
        </button>
        <button
          onClick={onCreateNew}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
            currentView === "editor" && !editingQuote
              ? "bg-neutral-100 text-neutral-900"
              : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
          }`}
        >
          <Plus size={18} />새 견적서 작성
        </button>
      </nav>
      <div className="p-4 border-t border-neutral-100">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors">
          <Settings size={18} />
          설정
        </button>
      </div>
    </aside>
  );
}
