"use client";

import { useState, useMemo } from "react";
import {
  Calculator,
  Search,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  ArrowRight,
  Calendar,
  List,
  Columns3,
  Clock,
  CheckCircle2,
  BarChart3,
  PieChart,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Quote } from "@/lib/types";

type SettlementStatus = "계약" | "정산완료";
type TabMode = "dashboard" | "projects";

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
  const [tabMode, setTabMode] = useState<TabMode>("dashboard");

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

  // 통계
  const totalRevenue = settledProjects.reduce((s, q) => s + (q.settlement?.totalQuotedAmount || 0), 0);
  const totalMaterial = settledProjects.reduce((s, q) => s + (q.settlement?.totalMaterialCost || 0), 0);
  const totalPayments = settledProjects.reduce((s, q) => s + (q.settlement?.totalPayments || 0), 0);
  const totalMargin = settledProjects.reduce((s, q) => s + (q.settlement?.finalMargin || 0), 0);
  const avgMarginPercent = totalRevenue > 0 ? Math.round((totalMargin / totalRevenue) * 100) : 0;
  const pendingTotal = pendingProjects.reduce((s, q) => s + q.total, 0);
  const totalCostSum = totalMaterial + totalPayments;

  const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

  // 월별 집계 (차트용)
  const monthlyData = useMemo(() => {
    const settled = quotes.filter((q) => q.status === "시공완료" && q.settlement);
    const map = new Map<string, { revenue: number; material: number; payments: number; margin: number; count: number }>();

    for (const q of settled) {
      const s = q.settlement!;
      const d = new Date(s.settledAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const existing = map.get(key) || { revenue: 0, material: 0, payments: 0, margin: 0, count: 0 };
      map.set(key, {
        revenue: existing.revenue + s.totalQuotedAmount,
        material: existing.material + s.totalMaterialCost,
        payments: existing.payments + s.totalPayments,
        margin: existing.margin + s.finalMargin,
        count: existing.count + 1,
      });
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, val]) => ({
        label: key.split("-")[1] + "월",
        ...val,
      }));
  }, [quotes]);

  // 공정별 집계 (정산완료 프로젝트의 costEntries 기반)
  const categoryData = useMemo(() => {
    const map = new Map<string, { quoted: number; actual: number }>();
    for (const q of settledProjects) {
      const s = q.settlement!;
      for (const entry of s.costEntries) {
        const existing = map.get(entry.category) || { quoted: 0, actual: 0 };
        map.set(entry.category, {
          quoted: existing.quoted + entry.quotedAmount,
          actual: existing.actual + entry.materialCost,
        });
      }
    }
    return Array.from(map.entries())
      .map(([category, val]) => ({ category, ...val, diff: val.quoted - val.actual }))
      .sort((a, b) => b.actual - a.actual);
  }, [settledProjects]);

  // 프로젝트별 마진 비교 (정산완료)
  const projectMarginData = useMemo(() => {
    return settledProjects
      .map((q) => ({
        name: q.client.name,
        revenue: q.settlement!.totalQuotedAmount,
        margin: q.settlement!.finalMargin,
        marginPct: q.settlement!.finalMarginPercent,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [settledProjects]);

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

  // ── 대시보드 차트 영역 ──
  const renderDashboard = () => {
    const maxRevenue = Math.max(...monthlyData.map((d) => d.revenue), 1);
    const maxCatActual = Math.max(...categoryData.map((d) => d.actual), 1);
    const maxProjectRevenue = Math.max(...projectMarginData.map((d) => d.revenue), 1);

    return (
      <div className="space-y-3">
        {/* 상단 KPI 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="bg-white rounded-2xl p-3 md:p-4 col-span-2 md:col-span-1">
            <span className="text-[11px] font-semibold text-toss-text-tertiary block mb-0.5">총 수금액</span>
            <span className="text-[18px] md:text-[20px] font-bold text-toss-text tabular-nums tracking-tight">
              {formatCurrency(totalRevenue)}
            </span>
          </div>
          <div className="bg-white rounded-2xl p-3 md:p-4">
            <span className="text-[11px] font-semibold text-toss-text-tertiary block mb-0.5">정산대기</span>
            <div className="flex items-baseline gap-1">
              <span className="text-[18px] md:text-[20px] font-bold text-amber-600 tabular-nums">{pendingProjects.length}건</span>
              {pendingProjects.length > 0 && (
                <span className="text-[11px] text-toss-text-tertiary tabular-nums">{formatCurrency(pendingTotal)}</span>
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-3 md:p-4">
            <span className="text-[11px] font-semibold text-toss-text-tertiary block mb-0.5">정산완료</span>
            <span className="text-[18px] md:text-[20px] font-bold text-toss-green tabular-nums">{settledProjects.length}건</span>
          </div>
          <div className="bg-white rounded-2xl p-3 md:p-4">
            <span className="text-[11px] font-semibold text-toss-text-tertiary block mb-0.5">평균 마진율</span>
            <span className={`text-[18px] md:text-[20px] font-bold tabular-nums ${totalMargin >= 0 ? "text-toss-green" : "text-toss-red"}`}>
              {avgMarginPercent}%
            </span>
            {totalRevenue > 0 && (
              <span className={`text-[11px] font-medium tabular-nums block ${totalMargin >= 0 ? "text-toss-green" : "text-toss-red"}`}>
                {formatCurrency(totalMargin)}
              </span>
            )}
          </div>
        </div>

        {/* 비용 구성 도넛 + 월별 수금 차트 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* 비용 구성 (도넛 차트 스타일) */}
          <div className="bg-white rounded-2xl p-4 md:p-5">
            <div className="flex items-center gap-2 mb-4">
              <PieChart size={16} className="text-toss-text-tertiary" />
              <span className="text-[14px] font-bold text-toss-text">비용 구성</span>
            </div>
            {totalRevenue === 0 ? (
              <div className="py-8 text-center text-[13px] text-toss-text-tertiary">정산 데이터가 없습니다</div>
            ) : (
              <div className="flex items-center gap-6">
                {/* CSS 도넛 차트 */}
                <div className="relative w-32 h-32 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    {(() => {
                      const matPct = (totalMaterial / totalRevenue) * 100;
                      const payPct = (totalPayments / totalRevenue) * 100;
                      const marginPct = Math.max(0, (totalMargin / totalRevenue) * 100);
                      let offset = 0;
                      const segments = [
                        { pct: matPct, color: "#60a5fa" },
                        { pct: payPct, color: "#fb923c" },
                        { pct: marginPct, color: totalMargin >= 0 ? "#22c55e" : "#ef4444" },
                      ];
                      return segments.map((seg, i) => {
                        const el = (
                          <circle
                            key={i}
                            cx="18" cy="18" r="15.9155"
                            fill="none"
                            stroke={seg.color}
                            strokeWidth="3.5"
                            strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
                            strokeDashoffset={`${-offset}`}
                            strokeLinecap="round"
                          />
                        );
                        offset += seg.pct;
                        return el;
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-[16px] font-extrabold tabular-nums ${totalMargin >= 0 ? "text-toss-green" : "text-toss-red"}`}>
                      {avgMarginPercent}%
                    </span>
                    <span className="text-[10px] text-toss-text-tertiary">마진율</span>
                  </div>
                </div>

                {/* 범례 */}
                <div className="flex-1 space-y-2.5 text-[12px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-blue-400" />
                      <span className="text-toss-text-secondary">자재비</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-toss-text tabular-nums">{formatCurrency(totalMaterial)}</span>
                      <span className="text-toss-text-tertiary ml-1 tabular-nums">{totalRevenue > 0 ? Math.round((totalMaterial / totalRevenue) * 100) : 0}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-orange-400" />
                      <span className="text-toss-text-secondary">지급내역</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-toss-text tabular-nums">{formatCurrency(totalPayments)}</span>
                      <span className="text-toss-text-tertiary ml-1 tabular-nums">{totalRevenue > 0 ? Math.round((totalPayments / totalRevenue) * 100) : 0}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${totalMargin >= 0 ? "bg-toss-green" : "bg-toss-red"}`} />
                      <span className="text-toss-text-secondary">순수익</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold tabular-nums ${totalMargin >= 0 ? "text-toss-green" : "text-toss-red"}`}>{formatCurrency(totalMargin)}</span>
                      <span className="text-toss-text-tertiary ml-1 tabular-nums">{avgMarginPercent}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 월별 수금/마진 추이 바 차트 */}
          <div className="bg-white rounded-2xl p-4 md:p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={16} className="text-toss-text-tertiary" />
              <span className="text-[14px] font-bold text-toss-text">월별 추이</span>
            </div>
            {monthlyData.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-toss-text-tertiary">정산 데이터가 없습니다</div>
            ) : (
              <div className="space-y-0">
                {/* 범례 */}
                <div className="flex items-center gap-4 text-[11px] mb-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded bg-toss-blue" />
                    <span className="text-toss-text-tertiary">수금액</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded bg-toss-green" />
                    <span className="text-toss-text-tertiary">마진</span>
                  </div>
                </div>
                {/* 바 */}
                <div className="space-y-2">
                  {monthlyData.map((d) => (
                    <div key={d.label} className="flex items-center gap-2">
                      <span className="text-[12px] font-medium text-toss-text-secondary w-8 shrink-0 tabular-nums">{d.label}</span>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <div className="h-3 bg-toss-blue/80 rounded-r-full transition-all" style={{ width: `${(d.revenue / maxRevenue) * 100}%`, minWidth: 4 }} />
                          <span className="text-[10px] font-bold text-toss-text tabular-nums shrink-0">{fmt(d.revenue)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`h-3 rounded-r-full transition-all ${d.margin >= 0 ? "bg-toss-green/70" : "bg-toss-red/70"}`} style={{ width: `${(Math.abs(d.margin) / maxRevenue) * 100}%`, minWidth: 4 }} />
                          <span className={`text-[10px] font-bold tabular-nums shrink-0 ${d.margin >= 0 ? "text-toss-green" : "text-toss-red"}`}>
                            {fmt(d.margin)} ({d.revenue > 0 ? Math.round((d.margin / d.revenue) * 100) : 0}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 프로젝트별 마진 비교 + 공정별 비용 분석 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* 프로젝트별 마진 비교 */}
          <div className="bg-white rounded-2xl p-4 md:p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={16} className="text-toss-text-tertiary" />
              <span className="text-[14px] font-bold text-toss-text">프로젝트별 마진</span>
            </div>
            {projectMarginData.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-toss-text-tertiary">정산 데이터가 없습니다</div>
            ) : (
              <div className="space-y-2">
                {projectMarginData.map((p) => (
                  <div key={p.name} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-semibold text-toss-text truncate flex-1 mr-2">{p.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-toss-text-tertiary tabular-nums">{formatCurrency(p.revenue)}</span>
                        <span className={`text-[12px] font-bold tabular-nums ${p.margin >= 0 ? "text-toss-green" : "text-toss-red"}`}>
                          {p.marginPct}%
                        </span>
                      </div>
                    </div>
                    <div className="h-4 bg-toss-divider rounded-full overflow-hidden flex">
                      {p.revenue > 0 && (
                        <>
                          <div
                            className="h-full bg-toss-text/20 transition-all"
                            style={{ width: `${((p.revenue - Math.max(0, p.margin)) / maxProjectRevenue) * 100}%` }}
                          />
                          <div
                            className={`h-full transition-all ${p.margin >= 0 ? "bg-toss-green" : "bg-toss-red"}`}
                            style={{ width: `${(Math.max(0, p.margin) / maxProjectRevenue) * 100}%` }}
                          />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 공정별 비용 분석 */}
          <div className="bg-white rounded-2xl p-4 md:p-5">
            <div className="flex items-center gap-2 mb-4">
              <Package size={16} className="text-toss-text-tertiary" />
              <span className="text-[14px] font-bold text-toss-text">공정별 비용</span>
              <span className="text-[11px] text-toss-text-tertiary ml-auto">견적 vs 실비용</span>
            </div>
            {categoryData.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-toss-text-tertiary">정산 데이터가 없습니다</div>
            ) : (
              <div className="space-y-2">
                {categoryData.slice(0, 8).map((c) => {
                  const maxVal = Math.max(...categoryData.map((d) => Math.max(d.quoted, d.actual)), 1);
                  return (
                    <div key={c.category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-semibold text-toss-text">{c.category}</span>
                        <div className="flex items-center gap-2 text-[11px] tabular-nums">
                          <span className="text-toss-text-tertiary">{fmt(c.quoted)}</span>
                          <span className="text-toss-text-secondary font-medium">{fmt(c.actual)}</span>
                          <span className={`font-bold ${c.diff >= 0 ? "text-toss-green" : "text-toss-red"}`}>
                            {c.diff >= 0 ? "+" : ""}{fmt(c.diff)}
                          </span>
                        </div>
                      </div>
                      <div className="relative h-3.5 bg-toss-divider rounded-full overflow-hidden">
                        <div className="absolute inset-y-0 left-0 bg-toss-text/10 rounded-full" style={{ width: `${(c.quoted / maxVal) * 100}%` }} />
                        <div className={`absolute inset-y-0 left-0 rounded-full ${c.actual <= c.quoted ? "bg-blue-400/70" : "bg-toss-red/60"}`} style={{ width: `${(c.actual / maxVal) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center gap-3 text-[10px] text-toss-text-tertiary pt-1 border-t border-toss-divider mt-2">
                  <div className="flex items-center gap-1"><div className="w-2.5 h-2 rounded bg-toss-text/10" /> 견적금액</div>
                  <div className="flex items-center gap-1"><div className="w-2.5 h-2 rounded bg-blue-400/70" /> 실비용</div>
                </div>
              </div>
            )}
          </div>
        </div>
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
          {/* Tab 바 */}
          <div className="flex border-b border-toss-divider -mx-4 md:-mx-6 px-4 md:px-6">
            <button
              onClick={() => setTabMode("dashboard")}
              className={`px-4 py-2.5 text-[14px] font-semibold border-b-2 transition-colors ${
                tabMode === "dashboard"
                  ? "border-toss-blue text-toss-blue"
                  : "border-transparent text-toss-text-tertiary hover:text-toss-text"
              }`}
            >
              정산현황
            </button>
            <button
              onClick={() => setTabMode("projects")}
              className={`px-4 py-2.5 text-[14px] font-semibold border-b-2 transition-colors ${
                tabMode === "projects"
                  ? "border-toss-blue text-toss-blue"
                  : "border-transparent text-toss-text-tertiary hover:text-toss-text"
              }`}
            >
              프로젝트 목록
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-6 py-3 md:py-4 pb-24 md:pb-8">
        {tabMode === "dashboard" ? renderDashboard() : renderProjects()}
      </div>
    </div>
  );
}
