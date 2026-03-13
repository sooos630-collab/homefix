"use client";

import { useState } from "react";
import {
  Calculator,
  Search,
  ChevronRight,
  Users,
  ArrowRight,
  Calendar,
  List,
  Columns3,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Quote } from "@/lib/types";

type SettlementStatus = "계약" | "정산완료";

interface SettlementListProps {
  quotes: Quote[];
  onView: (q: Quote) => void;
  onSettle?: (q: Quote) => void;
}

export function SettlementList({ quotes, onView, onSettle }: SettlementListProps) {
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [viewMode, setViewMode] = useState<"monthly" | "all">("all");
  const [displayMode, setDisplayMode] = useState<"list" | "kanban">("list");
  const [kanbanTab, setKanbanTab] = useState<SettlementStatus>("계약");

  const years = Array.from({ length: 7 }, (_, i) => 2024 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // 정산 관련 프로젝트: 계약 + 시공완료
  const allProjects = quotes.filter(
    (q) => q.status === "계약" || q.status === "시공완료",
  );

  const filteredProjects = allProjects
    .filter((q) => {
      if (viewMode === "monthly") {
        const d = new Date(q.date);
        return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
      }
      return true;
    })
    .filter((q) => {
      if (!search) return true;
      return (
        q.client.name.toLowerCase().includes(search.toLowerCase()) ||
        q.client.address?.toLowerCase().includes(search.toLowerCase()) ||
        q.items.some((i) => i.description.toLowerCase().includes(search.toLowerCase()))
      );
    })
    .sort((a, b) => {
      const dateA = a.settlement?.settledAt || a.date;
      const dateB = b.settlement?.settledAt || b.date;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

  const pendingProjects = filteredProjects.filter((q) => q.status === "계약");
  const settledProjects = filteredProjects.filter((q) => q.status === "시공완료" && q.settlement);
  const pendingTotal = pendingProjects.reduce((s, q) => s + q.total, 0);
  const totalRevenue = settledProjects.reduce((s, q) => s + (q.settlement?.totalQuotedAmount || 0), 0);

  const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

  // 카드 렌더러
  const renderProjectCard = (q: Quote) => {
    const isSettled = q.status === "시공완료" && !!q.settlement;
    const s = q.settlement;

    return (
      <div
        key={q.id}
        className="bg-white rounded-2xl p-4 border border-toss-border/50 hover:border-toss-border transition-all cursor-pointer group"
        onClick={() => onView(q)}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[15px] font-bold text-toss-text truncate">{q.client.name}</span>
              {isSettled ? (
                <span className="text-[10px] font-bold bg-toss-green-light text-toss-green px-2 py-0.5 rounded-full shrink-0 flex items-center gap-0.5">
                  <CheckCircle2 size={10} /> 정산완료
                </span>
              ) : (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-0.5">
                  <Clock size={10} /> 정산대기
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[12px] text-toss-text-tertiary">
              <span className="tabular-nums">{q.date}</span>
              {q.client.address && <span className="truncate">{q.client.address}</span>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[16px] font-extrabold text-toss-text tabular-nums block">{formatCurrency(q.total)}</span>
            {isSettled && s && (
              <span className={`text-[12px] font-bold tabular-nums ${s.finalMargin >= 0 ? "text-toss-green" : "text-toss-red"}`}>
                마진 {s.finalMarginPercent}%
              </span>
            )}
            {!isSettled && (
              <span className="text-[12px] font-medium text-toss-text-tertiary tabular-nums">
                예상마진 {q.subtotal > 0 ? Math.round(((q.totalMargin || 0) / q.subtotal) * 100) : 0}%
              </span>
            )}
          </div>
        </div>

        {isSettled && s ? (
          <>
            <div className="mb-2">
              <div className="flex h-2 rounded-full overflow-hidden bg-toss-divider">
                {s.totalQuotedAmount > 0 && (
                  <>
                    <div className="bg-blue-400" style={{ width: `${(s.totalMaterialCost / s.totalQuotedAmount) * 100}%` }} />
                    <div className="bg-orange-400" style={{ width: `${(s.totalPayments / s.totalQuotedAmount) * 100}%` }} />
                    <div className={s.finalMargin >= 0 ? "bg-toss-green" : "bg-toss-red"} style={{ width: `${Math.max(0, (s.finalMargin / s.totalQuotedAmount) * 100)}%` }} />
                  </>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                <span className="text-toss-text-tertiary">자재</span>
                <span className="font-bold text-toss-text tabular-nums ml-auto">{fmt(s.totalMaterialCost)}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                <span className="text-toss-text-tertiary">지급</span>
                <span className="font-bold text-toss-text tabular-nums ml-auto">{fmt(s.totalPayments)}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.finalMargin >= 0 ? "bg-toss-green" : "bg-toss-red"}`} />
                <span className="text-toss-text-tertiary">순수익</span>
                <span className={`font-bold tabular-nums ml-auto ${s.finalMargin >= 0 ? "text-toss-green" : "text-toss-red"}`}>{fmt(s.finalMargin)}</span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3 mt-2 pt-2 border-t border-toss-border/30 text-[11px] text-toss-text-tertiary">
              {s.payments && s.payments.length > 0 && (
                <div className="flex items-center gap-1">
                  <Users size={11} />
                  {s.payments.map((p) => `${p.name} ${fmt(p.amount)}원`).join(", ")}
                </div>
              )}
              <div className="ml-auto">
                정산일 {new Date(s.settledAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between pt-2 border-t border-toss-border/30" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-[12px] text-toss-text-tertiary">
              <span>예상 원가 {formatCurrency(q.totalCost || 0)}</span>
              <span>예상 마진 {formatCurrency(q.totalMargin || 0)}</span>
            </div>
            {onSettle && (
              <button
                onClick={() => onSettle(q)}
                className="flex items-center gap-1 px-3 py-1.5 bg-toss-green text-white text-[12px] font-semibold rounded-lg hover:bg-toss-green/80 active:scale-[0.97] transition-all"
              >
                시공완료 · 정산 <ArrowRight size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── 프로젝트 목록 영역 ──
  const renderProjects = () => (
    <div className="space-y-3">
      {/* Filters + Search */}
      <div className="flex items-center gap-2 flex-wrap">
        {viewMode === "monthly" && (
          <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl">
            <Calendar size={15} className="text-toss-text-tertiary flex-shrink-0" />
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-[14px] font-semibold text-toss-text focus:outline-none cursor-pointer min-w-0">
              {years.map((y) => <option key={y} value={y}>{y}년</option>)}
            </select>
            <div className="w-px h-3.5 bg-toss-border" />
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-[14px] font-semibold text-toss-text focus:outline-none cursor-pointer min-w-0">
              {months.map((m) => <option key={m} value={m}>{m}월</option>)}
            </select>
          </div>
        )}
        <button onClick={() => setViewMode(viewMode === "monthly" ? "all" : "monthly")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap ${viewMode === "all" ? "bg-toss-blue text-white" : "bg-white text-toss-text-secondary hover:text-toss-text"}`}>
          <List size={14} />
          {viewMode === "all" ? "월별 보기" : "전체 보기"}
        </button>
        <div className="flex items-center bg-white rounded-xl p-0.5">
          <button onClick={() => setDisplayMode("list")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${displayMode === "list" ? "bg-toss-blue text-white" : "text-toss-text-tertiary hover:text-toss-text"}`}>
            <List size={14} />
            <span className="hidden md:inline">리스트</span>
          </button>
          <button onClick={() => setDisplayMode("kanban")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${displayMode === "kanban" ? "bg-toss-blue text-white" : "text-toss-text-tertiary hover:text-toss-text"}`}>
            <Columns3 size={14} />
            <span className="hidden md:inline">칸반</span>
          </button>
        </div>
        <div className="relative flex-1 min-w-[140px] md:min-w-0 md:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-toss-text-tertiary" size={16} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="고객명, 현장 검색"
            className="w-full pl-10 pr-3 py-2 bg-white rounded-xl text-[14px] text-toss-text placeholder:text-toss-text-tertiary focus:outline-none focus:ring-2 focus:ring-toss-blue/20 transition-all" />
        </div>
        <span className="text-[13px] text-toss-text-tertiary hidden md:block font-medium">{filteredProjects.length}건</span>
      </div>

      {/* Empty / No results */}
      {filteredProjects.length === 0 && !search && (
        <div className="py-16 text-center bg-white rounded-2xl">
          <div className="w-16 h-16 bg-toss-divider rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Calculator size={28} className="text-toss-text-tertiary" />
          </div>
          <p className="text-[16px] font-bold text-toss-text mb-1">정산할 프로젝트가 없어요</p>
          <p className="text-[14px] text-toss-text-secondary">견적서를 계약 상태로 변경하면 여기에 표시됩니다</p>
        </div>
      )}
      {filteredProjects.length === 0 && search && (
        <div className="py-16 text-center bg-white rounded-2xl">
          <p className="text-[14px] text-toss-text-tertiary">&ldquo;{search}&rdquo; 검색 결과가 없습니다</p>
        </div>
      )}

      {/* Kanban */}
      {filteredProjects.length > 0 && displayMode === "kanban" && (
        <>
          <div className="md:hidden">
            <div className="flex bg-white rounded-2xl p-1 mb-3">
              {(["계약", "정산완료"] as SettlementStatus[]).map((status) => {
                const count = status === "계약" ? pendingProjects.length : settledProjects.length;
                return (
                  <button key={status} onClick={() => setKanbanTab(status)}
                    className={`flex-1 py-2.5 text-center rounded-xl text-[13px] font-semibold transition-all ${kanbanTab === status ? (status === "정산완료" ? "bg-toss-green-light text-toss-green" : "bg-amber-100 text-amber-700") : "text-toss-text-tertiary"}`}>
                    {status === "계약" ? "정산대기" : "정산완료"}
                    <span className={`ml-1 text-[11px] ${kanbanTab === status ? "opacity-100" : "opacity-50"}`}>{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="space-y-2">
              {(kanbanTab === "계약" ? pendingProjects : settledProjects).length === 0 ? (
                <div className="py-12 text-center bg-white rounded-2xl"><p className="text-[14px] text-toss-text-tertiary">해당 상태의 프로젝트가 없습니다</p></div>
              ) : (
                (kanbanTab === "계약" ? pendingProjects : settledProjects).map(renderProjectCard)
              )}
            </div>
          </div>
          <div className="hidden md:grid md:grid-cols-2 gap-4">
            <div className="flex flex-col min-h-0">
              <div className="flex items-center justify-between px-4 py-3 rounded-2xl mb-2 bg-amber-50">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-amber-600" />
                  <span className="text-[15px] font-bold text-amber-700">정산대기</span>
                  <span className="text-[12px] font-bold text-toss-text-tertiary">{pendingProjects.length}건</span>
                </div>
                <span className="text-[13px] font-bold text-toss-text-secondary tabular-nums">{formatCurrency(pendingTotal)}</span>
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto">
                {pendingProjects.length === 0 ? (
                  <div className="py-10 text-center rounded-2xl border-2 border-dashed border-toss-border/40"><p className="text-[13px] text-toss-text-tertiary">없음</p></div>
                ) : pendingProjects.map(renderProjectCard)}
              </div>
            </div>
            <div className="flex flex-col min-h-0">
              <div className="flex items-center justify-between px-4 py-3 rounded-2xl mb-2 bg-toss-green-light">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-toss-green" />
                  <span className="text-[15px] font-bold text-toss-green">정산완료</span>
                  <span className="text-[12px] font-bold text-toss-text-tertiary">{settledProjects.length}건</span>
                </div>
                <span className="text-[13px] font-bold text-toss-text-secondary tabular-nums">{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto">
                {settledProjects.length === 0 ? (
                  <div className="py-10 text-center rounded-2xl border-2 border-dashed border-toss-border/40"><p className="text-[13px] text-toss-text-tertiary">없음</p></div>
                ) : settledProjects.map(renderProjectCard)}
              </div>
            </div>
          </div>
        </>
      )}

      {/* List */}
      {filteredProjects.length > 0 && displayMode === "list" && (
        <>
          <section className="bg-white rounded-2xl overflow-hidden hidden md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[12px] text-toss-text-tertiary font-semibold border-b border-toss-divider">
                  <th className="px-5 py-3 font-semibold">상태</th>
                  <th className="px-4 py-3 font-semibold">고객명</th>
                  <th className="px-4 py-3 font-semibold">현장</th>
                  <th className="px-4 py-3 font-semibold text-right">계약금액</th>
                  <th className="px-4 py-3 font-semibold text-right">자재비</th>
                  <th className="px-4 py-3 font-semibold text-right">지급내역</th>
                  <th className="px-4 py-3 font-semibold text-right">마진</th>
                  <th className="px-4 py-3 font-semibold w-28"></th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((q) => {
                  const isSettled = q.status === "시공완료" && !!q.settlement;
                  const s = q.settlement;
                  return (
                    <tr key={q.id} className="border-b border-toss-divider last:border-0 hover:bg-toss-divider/50 transition-colors group cursor-pointer" onClick={() => onView(q)}>
                      <td className="px-5 py-3">
                        {isSettled ? (
                          <span className="text-[11px] font-bold bg-toss-green-light text-toss-green px-2.5 py-1 rounded-full inline-flex items-center gap-1"><CheckCircle2 size={11} /> 완료</span>
                        ) : (
                          <span className="text-[11px] font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full inline-flex items-center gap-1"><Clock size={11} /> 대기</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[14px] font-semibold text-toss-text">{q.client.name}</td>
                      <td className="px-4 py-3 text-[13px] text-toss-text-secondary truncate max-w-[160px]">{q.client.address}</td>
                      <td className="px-4 py-3 text-[14px] font-bold text-toss-text text-right tabular-nums">{formatCurrency(q.total)}</td>
                      <td className="px-4 py-3 text-[13px] text-right tabular-nums text-toss-text-secondary">{isSettled && s ? formatCurrency(s.totalMaterialCost) : "-"}</td>
                      <td className="px-4 py-3 text-[13px] text-right tabular-nums text-toss-text-secondary">{isSettled && s ? formatCurrency(s.totalPayments) : "-"}</td>
                      <td className="px-4 py-3 text-right">
                        {isSettled && s ? (
                          <span className={`text-[13px] font-bold tabular-nums ${s.finalMargin >= 0 ? "text-toss-green" : "text-toss-red"}`}>
                            {formatCurrency(s.finalMargin)}<span className="text-[11px] ml-0.5">({s.finalMarginPercent}%)</span>
                          </span>
                        ) : (
                          <span className="text-[13px] text-toss-text-tertiary tabular-nums">~{formatCurrency(q.totalMargin || 0)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {!isSettled && onSettle && (
                          <button onClick={() => onSettle(q)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-toss-green text-white text-[11px] font-semibold rounded-lg hover:bg-toss-green/80 active:scale-[0.97] transition-all">
                            정산 <ArrowRight size={11} />
                          </button>
                        )}
                        {isSettled && <ChevronRight size={16} className="text-toss-text-tertiary ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
          <div className="md:hidden space-y-2">
            {filteredProjects.map(renderProjectCard)}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-toss-bg">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white">
        <div className="px-4 md:px-6">
          <div className="flex items-center justify-between h-12 md:h-14">
            <h2 className="text-[18px] md:text-[20px] font-bold text-toss-text tracking-tight">
              비용정산관리
            </h2>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-6 py-3 md:py-4 pb-24 md:pb-8">
        {renderProjects()}
      </div>
    </div>
  );
}
