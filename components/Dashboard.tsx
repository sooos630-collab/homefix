"use client";

import { useState } from "react";
import {
  Plus,
  FileText,
  Search,
  Trash2,
  Calendar,
  ChevronRight,
  ArrowRight,
  List,
  Columns3,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Quote, QuoteStatus } from "@/lib/types";

interface DashboardProps {
  quotes: Quote[];
  loading?: boolean;
  onCreateNew: () => void;
  onView: (q: Quote) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: QuoteStatus) => void;
}

export function Dashboard({
  quotes,
  loading,
  onCreateNew,
  onView,
  onDelete,
  onUpdateStatus,
}: DashboardProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"monthly" | "all">("monthly");
  const [displayMode, setDisplayMode] = useState<"list" | "kanban">("list");
  const [kanbanTab, setKanbanTab] = useState<QuoteStatus>("견적");

  const years = Array.from({ length: 7 }, (_, i) => 2024 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const filteredQuotes = quotes
    .filter((q) => {
      if (viewMode === "monthly") {
        const d = new Date(q.date);
        const matchDate =
          d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
        if (!matchDate) return false;
      }
      if (!searchQuery) return true;
      return (
        q.client.name.includes(searchQuery) ||
        q.client.address.includes(searchQuery)
      );
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalQuoteAmount = filteredQuotes.reduce((sum, q) => sum + q.total, 0);
  const quoteCount = filteredQuotes.length;

  const contractedQuotes = filteredQuotes.filter(
    (q) => q.status === "계약" || q.status === "시공완료",
  );
  const contractCount = contractedQuotes.length;
  const contractedMargin = contractedQuotes.reduce(
    (sum, q) =>
      sum + (q.settlement ? q.settlement.finalMargin : (q.totalMargin || 0)),
    0,
  );
  const contractedTotal = contractedQuotes.reduce(
    (sum, q) => sum + q.subtotal,
    0,
  );
  const marginPercent =
    contractedTotal > 0
      ? Math.round((contractedMargin / contractedTotal) * 100)
      : 0;

  const statusLabel = (status: QuoteStatus) => {
    switch (status) {
      case "시공완료": return "시공완료";
      case "계약": return "계약";
      default: return "견적";
    }
  };

  const nextStatus = (status: QuoteStatus): QuoteStatus | null => {
    if (status === "견적") return "계약";
    if (status === "계약") return "시공완료";
    return null;
  };

  const prevStatus = (status: QuoteStatus): QuoteStatus | null => {
    if (status === "시공완료") return "계약";
    if (status === "계약") return "견적";
    return null;
  };

  const statusStyle = (status: QuoteStatus) => {
    switch (status) {
      case "시공완료":
        return "bg-toss-green-light text-toss-green";
      case "계약":
        return "bg-toss-blue-light text-toss-blue";
      default:
        return "bg-toss-divider text-toss-text-secondary";
    }
  };

  return (
    <div className="min-h-screen bg-toss-bg">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white">
        <div className="px-4 md:px-6">
          <div className="flex items-center justify-between h-12 md:h-14">
            <h2 className="text-[18px] md:text-[20px] font-bold text-toss-text tracking-tight">
              견적서관리
            </h2>
            <button
              onClick={onCreateNew}
              className="hidden md:flex items-center gap-1.5 px-6 py-3 bg-toss-blue text-white text-[14px] font-semibold rounded-2xl hover:bg-toss-blue-dark active:scale-[0.97] transition-all"
            >
              <Plus size={16} />
              새 견적서
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-6 py-3 md:py-4 space-y-3 pb-24 md:pb-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="bg-white rounded-2xl p-3 md:p-4 col-span-2 md:col-span-1">
            <span className="text-[11px] font-semibold text-toss-text-tertiary block mb-0.5">총 견적 금액</span>
            <span className="text-[18px] md:text-[20px] font-bold text-toss-text tabular-nums tracking-tight">
              {formatCurrency(totalQuoteAmount)}
            </span>
          </div>
          <div className="bg-white rounded-2xl p-3 md:p-4">
            <span className="text-[11px] font-semibold text-toss-text-tertiary block mb-0.5">견적</span>
            <span className="text-[18px] md:text-[20px] font-bold text-toss-text tabular-nums">{quoteCount}건</span>
          </div>
          <div className="bg-white rounded-2xl p-3 md:p-4">
            <span className="text-[11px] font-semibold text-toss-text-tertiary block mb-0.5">계약</span>
            <span className="text-[18px] md:text-[20px] font-bold text-toss-blue tabular-nums">{contractCount}건</span>
          </div>
          <div className="bg-white rounded-2xl p-3 md:p-4">
            <span className="text-[11px] font-semibold text-toss-text-tertiary block mb-0.5">마진률</span>
            <span className={`text-[18px] md:text-[20px] font-bold tabular-nums ${marginPercent >= 0 ? "text-toss-green" : "text-toss-red"}`}>{marginPercent}%</span>
          </div>
        </div>

        {/* Filters + Search (single row) */}
        <div className="flex items-center gap-2 flex-wrap">
          {viewMode === "monthly" && (
            <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl">
              <Calendar size={15} className="text-toss-text-tertiary flex-shrink-0" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-[14px] font-semibold text-toss-text focus:outline-none cursor-pointer min-w-0"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>
              <div className="w-px h-3.5 bg-toss-border"></div>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-[14px] font-semibold text-toss-text focus:outline-none cursor-pointer min-w-0"
              >
                {months.map((m) => (
                  <option key={m} value={m}>{m}월</option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={() => setViewMode(viewMode === "monthly" ? "all" : "monthly")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap ${
              viewMode === "all"
                ? "bg-toss-blue text-white"
                : "bg-white text-toss-text-secondary hover:text-toss-text"
            }`}
          >
            <List size={14} />
            {viewMode === "all" ? "월별 보기" : "전체 보기"}
          </button>
          <div className="flex items-center bg-white rounded-xl p-0.5">
            <button
              onClick={() => setDisplayMode("list")}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${
                displayMode === "list"
                  ? "bg-toss-blue text-white"
                  : "text-toss-text-tertiary hover:text-toss-text"
              }`}
            >
              <List size={14} />
              <span className="hidden md:inline">리스트</span>
            </button>
            <button
              onClick={() => setDisplayMode("kanban")}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${
                displayMode === "kanban"
                  ? "bg-toss-blue text-white"
                  : "text-toss-text-tertiary hover:text-toss-text"
              }`}
            >
              <Columns3 size={14} />
              <span className="hidden md:inline">칸반</span>
            </button>
          </div>
          <div className="relative flex-1 min-w-[140px] md:min-w-0 md:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-toss-text-tertiary" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="고객명, 현장 검색"
              className="w-full pl-10 pr-3 py-2 bg-white rounded-xl text-[14px] text-toss-text placeholder:text-toss-text-tertiary focus:outline-none focus:ring-2 focus:ring-toss-blue/20 transition-all"
            />
          </div>
          <span className="text-[13px] text-toss-text-tertiary hidden md:block font-medium">{filteredQuotes.length}건</span>
        </div>

        {loading ? (
          <div className="py-16 text-center bg-white rounded-2xl">
            <div className="inline-block w-7 h-7 border-[2.5px] border-toss-divider border-t-toss-blue rounded-full animate-spin mb-4"></div>
            <p className="text-[14px] text-toss-text-tertiary">불러오는 중...</p>
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl">
            <div className="w-16 h-16 bg-toss-divider rounded-2xl flex items-center justify-center mx-auto mb-5">
              <FileText size={28} className="text-toss-text-tertiary" />
            </div>
            <p className="text-[16px] font-bold text-toss-text mb-1">
              {viewMode === "all" ? "견적서가 없습니다" : "이 달에 견적서가 없어요"}
            </p>
            <p className="text-[14px] text-toss-text-secondary mb-6">
              새 견적서를 작성해보세요
            </p>
            <button
              onClick={onCreateNew}
              className="px-6 py-3 bg-toss-blue text-white text-[14px] font-semibold rounded-2xl hover:bg-toss-blue-dark active:scale-[0.97] transition-all"
            >
              견적서 작성
            </button>
          </div>
        ) : displayMode === "kanban" ? (
          /* ── Kanban Board ── */
          <>
            {/* Kanban Card renderer */}
            {(() => {
              const kanbanStatuses: QuoteStatus[] = ["견적", "계약", "시공완료"];
              const grouped = kanbanStatuses.map((status) => ({
                status,
                quotes: filteredQuotes.filter((q) => q.status === status),
                total: filteredQuotes.filter((q) => q.status === status).reduce((s, q) => s + q.total, 0),
              }));

              const renderCard = (quote: Quote) => {
                const margin = quote.settlement ? quote.settlement.finalMargin : (quote.totalMargin || 0);
                const pct = quote.settlement
                  ? quote.settlement.finalMarginPercent
                  : (quote.subtotal > 0 ? Math.round((margin / quote.subtotal) * 100) : 0);
                const isSettled = !!quote.settlement;
                const next = nextStatus(quote.status);
                const prev = prevStatus(quote.status);

                return (
                  <div
                    key={quote.id}
                    className="bg-white rounded-2xl p-4 border border-toss-border/50 hover:border-toss-border transition-all cursor-pointer group"
                    onClick={() => onView(quote)}
                  >
                    {/* Row 1: Name + Amount */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <span className="text-[15px] font-bold text-toss-text block truncate">{quote.client.name}</span>
                        <span className="text-[12px] text-toss-text-tertiary tabular-nums">{quote.date}</span>
                        {quote.client.address && (
                          <span className="text-[12px] text-toss-text-tertiary"> · {quote.client.address}</span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[16px] font-extrabold text-toss-text tabular-nums block">{formatCurrency(quote.total)}</span>
                        <span className={`text-[12px] font-bold tabular-nums ${margin > 0 ? "text-toss-green" : margin < 0 ? "text-toss-red" : "text-toss-text-tertiary"}`}>
                          {isSettled && <span className="text-[9px] bg-toss-green-light text-toss-green px-1 py-0.5 rounded mr-1">확정</span>}
                          마진 {pct}%
                        </span>
                      </div>
                    </div>

                    {/* Row 2: Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-toss-border/30" onClick={(e) => e.stopPropagation()}>
                      {prev && (
                        <button
                          onClick={() => onUpdateStatus(quote.id, prev)}
                          className="px-3 py-1.5 text-[12px] font-medium text-toss-text-tertiary hover:text-toss-text hover:bg-toss-divider rounded-lg transition-colors"
                        >
                          ← {prev}
                        </button>
                      )}
                      <div className="flex-1" />
                      <button
                        onClick={() => onDelete(quote.id)}
                        className="p-1.5 text-toss-text-tertiary hover:text-toss-red rounded-lg transition-colors opacity-0 group-hover:opacity-100 md:opacity-0"
                      >
                        <Trash2 size={14} />
                      </button>
                      {next && (
                        <button
                          onClick={() => onUpdateStatus(quote.id, next)}
                          className={`flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-all active:scale-[0.97] ${
                            next === "계약"
                              ? "bg-toss-blue text-white hover:bg-toss-blue-dark"
                              : "bg-toss-green text-white hover:opacity-90"
                          }`}
                        >
                          {next} <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              };

              return (
                <>
                  {/* ── Mobile: Tab-based ── */}
                  <div className="md:hidden">
                    {/* Status Tabs */}
                    <div className="flex bg-white rounded-2xl p-1 mb-3">
                      {grouped.map(({ status, quotes: colQ }) => (
                        <button
                          key={status}
                          onClick={() => setKanbanTab(status)}
                          className={`flex-1 py-2.5 text-center rounded-xl text-[13px] font-semibold transition-all ${
                            kanbanTab === status
                              ? status === "시공완료"
                                ? "bg-toss-green-light text-toss-green"
                                : status === "계약"
                                ? "bg-toss-blue-light text-toss-blue"
                                : "bg-toss-bg text-toss-text"
                              : "text-toss-text-tertiary"
                          }`}
                        >
                          {status}
                          <span className={`ml-1 text-[11px] ${kanbanTab === status ? "opacity-100" : "opacity-50"}`}>
                            {colQ.length}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Tab summary */}
                    {(() => {
                      const col = grouped.find((g) => g.status === kanbanTab)!;
                      return (
                        <div className="flex items-center justify-between px-1 mb-2">
                          <span className="text-[13px] text-toss-text-secondary">{col.quotes.length}건</span>
                          <span className="text-[13px] font-bold text-toss-text tabular-nums">{formatCurrency(col.total)}</span>
                        </div>
                      );
                    })()}

                    {/* Cards */}
                    <div className="space-y-2">
                      {grouped.find((g) => g.status === kanbanTab)!.quotes.length === 0 ? (
                        <div className="py-12 text-center bg-white rounded-2xl">
                          <p className="text-[14px] text-toss-text-tertiary">해당 상태의 견적이 없습니다</p>
                        </div>
                      ) : (
                        grouped.find((g) => g.status === kanbanTab)!.quotes.map(renderCard)
                      )}
                    </div>
                  </div>

                  {/* ── Desktop: 3 Columns ── */}
                  <div className="hidden md:grid md:grid-cols-3 gap-4">
                    {grouped.map(({ status, quotes: colQ, total: colTotal }) => (
                      <div key={status} className="flex flex-col min-h-0">
                        {/* Column Header */}
                        <div className={`flex items-center justify-between px-4 py-3 rounded-2xl mb-2 ${
                          status === "시공완료"
                            ? "bg-toss-green-light"
                            : status === "계약"
                            ? "bg-toss-blue-light"
                            : "bg-white"
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className={`text-[15px] font-bold ${
                              status === "시공완료" ? "text-toss-green" : status === "계약" ? "text-toss-blue" : "text-toss-text"
                            }`}>{status}</span>
                            <span className="text-[12px] font-bold text-toss-text-tertiary">{colQ.length}건</span>
                          </div>
                          <span className="text-[13px] font-bold text-toss-text-secondary tabular-nums">{formatCurrency(colTotal)}</span>
                        </div>

                        {/* Column Cards */}
                        <div className="space-y-2 flex-1 overflow-y-auto">
                          {colQ.length === 0 ? (
                            <div className="py-10 text-center rounded-2xl border-2 border-dashed border-toss-border/40">
                              <p className="text-[13px] text-toss-text-tertiary">없음</p>
                            </div>
                          ) : (
                            colQ.map(renderCard)
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </>
        ) : (
          /* ── List View ── */
          <section className="bg-white rounded-2xl overflow-hidden">
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[12px] text-toss-text-tertiary font-semibold border-b border-toss-divider">
                      <th className="px-5 py-3 font-semibold">작성일</th>
                      <th className="px-4 py-3 font-semibold">고객명</th>
                      <th className="px-4 py-3 font-semibold">현장</th>
                      <th className="px-4 py-3 font-semibold text-right">금액</th>
                      <th className="px-4 py-3 font-semibold text-center">마진률</th>
                      <th className="px-4 py-3 font-semibold text-center">상태</th>
                      <th className="px-4 py-3 font-semibold w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuotes.map((quote) => (
                      <tr
                        key={quote.id}
                        className="border-b border-toss-divider last:border-0 hover:bg-toss-divider/50 transition-colors group cursor-pointer"
                        onClick={() => onView(quote)}
                      >
                        <td className="px-5 py-3 text-[13px] text-toss-text-secondary tabular-nums">
                          {quote.date}
                        </td>
                        <td className="px-4 py-3 text-[14px] font-semibold text-toss-text">
                          {quote.client.name}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-toss-text-secondary truncate max-w-[180px]">
                          {quote.client.address}
                        </td>
                        <td className="px-4 py-3 text-[14px] font-bold text-toss-text text-right tabular-nums">
                          {formatCurrency(quote.total)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {(() => {
                            const margin = quote.settlement ? quote.settlement.finalMargin : (quote.totalMargin || 0);
                            const pct = quote.settlement
                              ? quote.settlement.finalMarginPercent
                              : (quote.subtotal > 0 ? Math.round((margin / quote.subtotal) * 100) : 0);
                            const isSettled = !!quote.settlement;
                            return (
                              <span className={`text-[13px] font-bold tabular-nums ${margin > 0 ? "text-toss-green" : margin < 0 ? "text-toss-red" : "text-toss-text-tertiary"}`}>
                                {isSettled && <span className="text-[10px] bg-toss-green-light text-toss-green px-1.5 py-0.5 rounded-md mr-1 font-bold">확정</span>}
                                {pct}%
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={quote.status}
                            onChange={(e) => {
                              const newStatus = e.target.value as QuoteStatus;
                              onUpdateStatus(quote.id, newStatus);
                            }}
                            className={`text-[11px] font-bold px-3 py-1.5 rounded-full focus:outline-none cursor-pointer transition-colors ${statusStyle(quote.status)}`}
                          >
                            <option value="견적">견적</option>
                            <option value="계약">계약</option>
                            <option value="시공완료">시공완료</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => onDelete(quote.id)}
                              className="p-1.5 text-toss-text-tertiary hover:text-toss-red rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile List */}
              <div className="md:hidden">
                {filteredQuotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="px-4 py-3.5 border-b border-toss-divider last:border-0 active:bg-toss-divider/50 transition-colors cursor-pointer"
                    onClick={() => onView(quote)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[16px] font-bold text-toss-text">{quote.client.name}</span>
                      <div onClick={(e) => e.stopPropagation()}>
                        <select
                          value={quote.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as QuoteStatus;
                            onUpdateStatus(quote.id, newStatus);
                          }}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full focus:outline-none cursor-pointer ${statusStyle(quote.status)}`}
                        >
                          <option value="견적">견적</option>
                          <option value="계약">계약</option>
                          <option value="시공완료">시공완료</option>
                        </select>
                      </div>
                    </div>
                    <div className="text-[12px] text-toss-text-tertiary mb-1.5">
                      <span className="tabular-nums">{quote.date}</span>
                      {quote.client.address && (
                        <span className="ml-2">{quote.client.address}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[12px]">
                        {(() => {
                          const margin = quote.settlement ? quote.settlement.finalMargin : (quote.totalMargin || 0);
                          const pct = quote.settlement
                            ? quote.settlement.finalMarginPercent
                            : (quote.subtotal > 0 ? Math.round((margin / quote.subtotal) * 100) : 0);
                          const isSettled = !!quote.settlement;
                          return (
                            <>
                              {isSettled && <span className="text-[10px] bg-toss-green-light text-toss-green px-1.5 py-0.5 rounded-md font-bold">확정</span>}
                              <span className="text-toss-text-tertiary">마진률</span>
                              <span className={`font-bold tabular-nums ${margin > 0 ? "text-toss-green" : margin < 0 ? "text-toss-red" : "text-toss-text-tertiary"}`}>
                                {pct}%
                              </span>
                            </>
                          );
                        })()}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[15px] font-bold text-toss-text tabular-nums">{formatCurrency(quote.total)}</span>
                        <ChevronRight size={14} className="text-toss-text-tertiary" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          </section>
        )}
      </div>
    </div>
  );
}
