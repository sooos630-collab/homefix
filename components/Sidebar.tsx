"use client";

import {
  Building2,
  Calculator,
  FileText,
  LayoutDashboard,
  Plus,
  Settings,
} from "lucide-react";
import type { Quote } from "@/lib/types";

type AppView =
  | "overview"
  | "quotes"
  | "editor"
  | "viewer"
  | "settlement"
  | "settlements"
  | "vendors-purchase"
  | "vendors-partner";

interface SidebarProps {
  currentView: AppView;
  editingQuote: Quote | null;
  onNavigate: (view: AppView) => void;
  onCreateNew: () => void;
}

export function Sidebar({
  currentView,
  editingQuote,
  onNavigate,
  onCreateNew,
}: SidebarProps) {
  return (
    <>
      <aside className="hidden md:flex w-60 bg-white flex-shrink-0 flex-col print:hidden">
        <div className="px-5 py-6">
          <h1 className="text-[17px] font-bold tracking-tight text-toss-text flex items-center gap-2.5">
            <div className="w-8 h-8 bg-toss-blue text-white rounded-xl flex items-center justify-center">
              <FileText size={16} />
            </div>
            꼼꼼한 집수리
          </h1>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          <button
            onClick={() => onNavigate("overview")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 ${
              currentView === "overview"
                ? "bg-toss-blue-light text-toss-blue font-semibold"
                : "text-toss-text-secondary hover:bg-toss-divider hover:text-toss-text"
            }`}
          >
            <LayoutDashboard size={18} />
            대시보드
          </button>
          <button
            onClick={() => onNavigate("quotes")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 ${
              currentView === "quotes"
                ? "bg-toss-blue-light text-toss-blue font-semibold"
                : "text-toss-text-secondary hover:bg-toss-divider hover:text-toss-text"
            }`}
          >
            <FileText size={18} />
            견적서관리
          </button>
          <button
            onClick={() => onNavigate("settlements")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 ${
              currentView === "settlements"
                ? "bg-toss-blue-light text-toss-blue font-semibold"
                : "text-toss-text-secondary hover:bg-toss-divider hover:text-toss-text"
            }`}
          >
            <Calculator size={18} />
            비용정산관리
          </button>
          <div className="pt-2">
            <div className="flex items-center gap-3 px-3.5 py-2 text-[12px] font-semibold text-toss-text-tertiary">
              <Building2 size={16} />
              거래처 관리
            </div>
            <div className="space-y-0.5 pl-3">
              <button
                onClick={() => onNavigate("vendors-purchase")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  currentView === "vendors-purchase"
                    ? "bg-toss-blue-light text-toss-blue font-semibold"
                    : "text-toss-text-secondary hover:bg-toss-divider hover:text-toss-text"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                매입/구매 거래처
              </button>
              <button
                onClick={() => onNavigate("vendors-partner")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  currentView === "vendors-partner"
                    ? "bg-toss-blue-light text-toss-blue font-semibold"
                    : "text-toss-text-secondary hover:bg-toss-divider hover:text-toss-text"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                인건비/시공 협력사
              </button>
            </div>
          </div>
        </nav>
        <div className="px-3 py-4 space-y-0.5">
          <button
            onClick={onCreateNew}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 ${
              currentView === "editor" && !editingQuote
                ? "bg-toss-blue-light text-toss-blue font-semibold"
                : "text-toss-text-secondary hover:bg-toss-divider hover:text-toss-text"
            }`}
          >
            <Plus size={18} />
            새 견적서
          </button>
          <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-medium text-toss-text-tertiary hover:bg-toss-divider hover:text-toss-text-secondary transition-all duration-200">
            <Settings size={18} />
            설정
          </button>
        </div>
      </aside>

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl shadow-[0_-1px_12px_rgba(0,0,0,0.06)] z-50 flex items-center justify-around px-2 print:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <button
          onClick={() => onNavigate("overview")}
          className={`flex flex-col items-center gap-0.5 py-2 px-1.5 text-[10px] font-medium transition-colors ${
            currentView === "overview"
              ? "text-toss-blue"
              : "text-toss-text-tertiary"
          }`}
        >
          <LayoutDashboard
            size={20}
            strokeWidth={currentView === "overview" ? 2.5 : 1.5}
          />
          대시보드
        </button>
        <button
          onClick={() => onNavigate("quotes")}
          className={`flex flex-col items-center gap-0.5 py-2 px-1.5 text-[10px] font-medium transition-colors ${
            currentView === "quotes"
              ? "text-toss-blue"
              : "text-toss-text-tertiary"
          }`}
        >
          <FileText size={20} strokeWidth={currentView === "quotes" ? 2.5 : 1.5} />
          견적
        </button>
        <button
          onClick={onCreateNew}
          className="flex flex-col items-center gap-0.5 py-2 px-2"
        >
          <div className="w-12 h-12 bg-toss-blue text-white rounded-2xl flex items-center justify-center -mt-6 shadow-lg shadow-toss-blue/30">
            <Plus size={24} strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-bold text-toss-blue">새 견적</span>
        </button>
        <button
          onClick={() => onNavigate("settlements")}
          className={`flex flex-col items-center gap-0.5 py-2 px-1.5 text-[10px] font-medium transition-colors ${
            currentView === "settlements"
              ? "text-toss-blue"
              : "text-toss-text-tertiary"
          }`}
        >
          <Calculator
            size={20}
            strokeWidth={currentView === "settlements" ? 2.5 : 1.5}
          />
          정산
        </button>
        <button
          onClick={() => onNavigate("vendors-purchase")}
          className={`flex flex-col items-center gap-0.5 py-2 px-1.5 text-[10px] font-medium transition-colors ${
            currentView === "vendors-purchase" || currentView === "vendors-partner"
              ? "text-toss-blue"
              : "text-toss-text-tertiary"
          }`}
        >
          <Building2
            size={20}
            strokeWidth={
              currentView === "vendors-purchase" || currentView === "vendors-partner" ? 2.5 : 1.5
            }
          />
          거래처
        </button>
      </nav>
    </>
  );
}
