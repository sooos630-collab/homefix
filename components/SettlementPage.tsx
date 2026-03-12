"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  CheckCircle,
} from "lucide-react";
import { generateId, formatCurrency } from "@/lib/utils";
import { loadVendors } from "@/lib/vendors";
import type {
  Quote,
  Settlement,
  SettlementCostEntry,
  PaymentEntry,
  Vendor,
} from "@/lib/types";

interface SettlementPageProps {
  quote: Quote;
  onConfirm: (settlement: Settlement) => void;
  onCancel: () => void;
}

interface CostEntryRow {
  entry: SettlementCostEntry;
  payments: PaymentEntry[];
}

interface ItemGroup {
  itemId: string;
  category: string;
  description: string;
  quotedTotal: number;
  rows: CostEntryRow[];
}

export function SettlementPage({ quote, onConfirm, onCancel }: SettlementPageProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    setVendors(loadVendors());
  }, []);

  const buildInitialGroups = (): ItemGroup[] => {
    return quote.items.map((item) => {
      const rows: CostEntryRow[] =
        item.costItems.length > 0
          ? item.costItems.map((cItem) => ({
              entry: {
                id: generateId(),
                parentItemId: item.id,
                costItemId: cItem.id,
                vendorId: "",
                category: item.category,
                description: cItem.description,
                quotedAmount: cItem.amount + (Number(cItem.margin) || 0) + (Number(cItem.laborCost) || 0),
                materialCost: 0,
              },
              payments: [],
            }))
          : [
              {
                entry: {
                  id: generateId(),
                  parentItemId: item.id,
                  costItemId: "",
                  vendorId: "",
                  category: item.category,
                  description: item.description,
                  quotedAmount: item.amount,
                  materialCost: 0,
                },
                payments: [],
              },
            ];

      return {
        itemId: item.id,
        category: item.category,
        description: item.description,
        quotedTotal: item.amount,
        rows,
      };
    });
  };

  const [groups, setGroups] = useState<ItemGroup[]>(buildInitialGroups);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    () => new Set(quote.items.map((i) => i.id)),
  );

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  // 실자재구매 변경
  const handleMaterialChange = (itemId: string, entryId: string, value: number) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.itemId === itemId
          ? {
              ...g,
              rows: g.rows.map((r) =>
                r.entry.id === entryId ? { ...r, entry: { ...r.entry, materialCost: value } } : r,
              ),
            }
          : g,
      ),
    );
  };

  // 거래처 지급 추가
  const addPayment = (itemId: string, entryId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.itemId === itemId
          ? {
              ...g,
              rows: g.rows.map((r) =>
                r.entry.id === entryId
                  ? {
                      ...r,
                      payments: [
                        ...r.payments,
                        { id: generateId(), parentItemId: itemId, vendorId: "", name: "", amount: 0 },
                      ],
                    }
                  : r,
              ),
            }
          : g,
      ),
    );
  };

  // 거래처 지급 삭제
  const removePayment = (itemId: string, entryId: string, paymentId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.itemId === itemId
          ? {
              ...g,
              rows: g.rows.map((r) =>
                r.entry.id === entryId
                  ? { ...r, payments: r.payments.filter((p) => p.id !== paymentId) }
                  : r,
              ),
            }
          : g,
      ),
    );
  };

  // 거래처 지급 업데이트
  const updatePaymentVendor = (itemId: string, entryId: string, paymentId: string, vendorId: string) => {
    const v = vendors.find((vendor) => vendor.id === vendorId);
    setGroups((prev) =>
      prev.map((g) =>
        g.itemId === itemId
          ? {
              ...g,
              rows: g.rows.map((r) =>
                r.entry.id === entryId
                  ? {
                      ...r,
                      payments: r.payments.map((p) =>
                        p.id === paymentId ? { ...p, vendorId, name: v?.name || p.name } : p,
                      ),
                    }
                  : r,
              ),
            }
          : g,
      ),
    );
  };

  const updatePaymentAmount = (itemId: string, entryId: string, paymentId: string, amount: number) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.itemId === itemId
          ? {
              ...g,
              rows: g.rows.map((r) =>
                r.entry.id === entryId
                  ? {
                      ...r,
                      payments: r.payments.map((p) =>
                        p.id === paymentId ? { ...p, amount } : p,
                      ),
                    }
                  : r,
              ),
            }
          : g,
      ),
    );
  };

  const vendorOptions = useMemo(
    () =>
      vendors.map((vendor) => ({
        id: vendor.id,
        name: vendor.name,
        label: `${vendor.name} · ${vendor.vendorType === "partner" ? "시공/인건비" : "매입/구매"}`,
      })),
    [vendors],
  );

  // Totals
  const allRows = groups.flatMap((g) => g.rows);
  const totalQuotedAmount = quote.total;
  const totalMaterialCost = allRows.reduce((sum, r) => sum + (Number(r.entry.materialCost) || 0), 0);
  const totalPayments = allRows.reduce(
    (sum, r) => sum + r.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0),
    0,
  );
  const finalMargin = totalQuotedAmount - totalMaterialCost - totalPayments;
  const finalMarginPercent = totalQuotedAmount > 0 ? Math.round((finalMargin / totalQuotedAmount) * 100) : 0;

  const isAllValid = allRows.every((r) => Number(r.entry.materialCost) > 0);

  const handleConfirm = () => {
    if (!isAllValid) {
      alert("모든 항목의 실자재구매 비용을 입력해주세요.");
      return;
    }
    const settlement: Settlement = {
      costEntries: allRows.map((r) => r.entry),
      payments: allRows
        .flatMap((r) => r.payments)
        .filter((p) => p.name.trim() && p.amount > 0),
      totalQuotedAmount,
      totalMaterialCost,
      totalPayments,
      finalMargin,
      finalMarginPercent,
      settledAt: new Date().toISOString(),
    };
    onConfirm(settlement);
  };

  const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

  return (
    <div className="min-h-screen bg-toss-bg">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 bg-white">
        <div className="px-4 md:px-6 h-12 md:h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="p-1.5 -ml-1.5 hover:bg-toss-divider rounded-full transition-colors"
            >
              <ChevronLeft size={22} className="text-toss-text" />
            </button>
            <div>
              <h2 className="text-[17px] md:text-[19px] font-bold text-toss-text tracking-tight">최종 정산</h2>
              <p className="text-[12px] text-toss-text-tertiary -mt-0.5">{quote.client.name} · {quote.client.address}</p>
            </div>
          </div>
          <button
            onClick={handleConfirm}
            disabled={!isAllValid}
            className={`hidden md:flex items-center gap-1.5 px-5 py-2.5 text-[14px] font-semibold rounded-2xl transition-all active:scale-[0.97] ${
              isAllValid
                ? "bg-toss-green text-white hover:bg-toss-green/80"
                : "bg-toss-divider text-toss-text-tertiary cursor-not-allowed"
            }`}
          >
            <CheckCircle size={16} />
            정산 확정
          </button>
        </div>
      </header>

      <div className="px-4 md:px-6 py-3 md:py-4 space-y-3 pb-28">
        {/* Item Groups */}
        {groups.map((group, groupIdx) => {
          const isExpanded = expandedItems.has(group.itemId);
          const groupMaterial = group.rows.reduce((s, r) => s + (Number(r.entry.materialCost) || 0), 0);
          const groupVendorPay = group.rows.reduce(
            (s, r) => s + r.payments.reduce((s2, p) => s2 + (Number(p.amount) || 0), 0),
            0,
          );
          const groupQuoted = group.rows.reduce((s, r) => s + r.entry.quotedAmount, 0);
          const groupProfit = groupQuoted - groupMaterial - groupVendorPay;
          const groupValid = group.rows.every((r) => Number(r.entry.materialCost) > 0);

          return (
            <section key={group.itemId} className="bg-white rounded-2xl overflow-hidden">
              {/* Card Header */}
              <button
                onClick={() => toggleExpand(group.itemId)}
                className="w-full px-4 md:px-5 py-3 md:py-4 flex items-center gap-3 hover:bg-toss-bg/30 transition-colors"
              >
                <span className="text-[12px] font-bold text-toss-text-tertiary bg-toss-bg w-6 h-6 rounded-lg flex items-center justify-center shrink-0">
                  {groupIdx + 1}
                </span>
                <span className="text-[11px] font-bold text-toss-blue bg-toss-blue/10 px-2 py-0.5 rounded-md shrink-0">
                  {group.category}
                </span>
                <span className="text-[14px] font-semibold text-toss-text truncate text-left flex-1">
                  {group.description}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {groupValid ? (
                    <span className="text-[10px] font-bold bg-toss-green-light text-toss-green px-1.5 py-0.5 rounded-full hidden md:inline">완료</span>
                  ) : (
                    <span className="text-[10px] font-bold bg-toss-red-light text-toss-red px-1.5 py-0.5 rounded-full hidden md:inline">미입력</span>
                  )}
                  <span className="text-[13px] font-bold text-toss-text tabular-nums">{formatCurrency(group.quotedTotal)}</span>
                  {isExpanded ? <ChevronUp size={16} className="text-toss-text-tertiary" /> : <ChevronDown size={16} className="text-toss-text-tertiary" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 md:px-5 pb-4 md:pb-5">
                  {/* Desktop: 테이블 헤더 */}
                  <div className="hidden md:flex items-center gap-2 text-[11px] text-toss-text-tertiary font-medium px-1 pb-2 border-b border-toss-border/30">
                    <span className="w-[18%] min-w-0">세부항목</span>
                    <span className="w-[10%] text-right">견적금액</span>
                    <span className="flex-1">거래처 지급</span>
                    <span className="w-[14%]">실자재구매</span>
                    <span className="w-[10%] text-right">순수익</span>
                  </div>

                  {/* Rows */}
                  {group.rows.map((row) => {
                    const rowVendorPay = row.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
                    const rowMaterial = Number(row.entry.materialCost) || 0;
                    const rowProfit = row.entry.quotedAmount - rowVendorPay - rowMaterial;

                    return (
                      <div key={row.entry.id}>
                        {/* Desktop Row */}
                        <div className="hidden md:flex items-start gap-2 py-2 border-b border-toss-border/20">
                          {/* 세부항목 */}
                          <span className="w-[18%] min-w-0 text-[13px] font-medium text-toss-text truncate pt-1.5">
                            {row.entry.description}
                          </span>
                          {/* 견적금액 */}
                          <span className="w-[10%] text-right text-[12px] text-toss-text-tertiary tabular-nums pt-1.5">
                            {fmt(row.entry.quotedAmount)}
                          </span>
                          {/* 거래처 지급 */}
                          <div className="flex-1 space-y-1">
                            {row.payments.map((payment) => (
                              <div key={payment.id} className="flex items-center gap-1">
                                <select
                                  value={payment.vendorId}
                                  onChange={(e) => updatePaymentVendor(group.itemId, row.entry.id, payment.id, e.target.value)}
                                  className="flex-1 min-w-0 px-2 py-1 bg-white border border-toss-border rounded-lg text-[11px] text-toss-text focus:outline-none focus:border-toss-blue transition-colors"
                                >
                                  <option value="">거래처</option>
                                  {vendorOptions.map((v) => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  min="0"
                                  value={payment.amount || ""}
                                  onChange={(e) => updatePaymentAmount(group.itemId, row.entry.id, payment.id, Number(e.target.value))}
                                  placeholder="금액"
                                  className="w-24 px-2 py-1 bg-toss-input rounded-lg text-[11px] text-right tabular-nums placeholder:text-toss-text-tertiary focus:outline-none focus:bg-toss-divider transition-colors"
                                />
                                <button
                                  onClick={() => removePayment(group.itemId, row.entry.id, payment.id)}
                                  className="p-0.5 text-toss-text-tertiary hover:text-toss-red transition-colors shrink-0"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => addPayment(group.itemId, row.entry.id)}
                              className="text-[10px] font-medium text-toss-blue hover:text-toss-blue-dark flex items-center gap-0.5 px-1"
                            >
                              <Plus size={10} /> 거래처
                            </button>
                          </div>
                          {/* 실자재구매 */}
                          <div className="w-[14%]">
                            <input
                              type="number"
                              min="0"
                              value={row.entry.materialCost || ""}
                              onChange={(e) => handleMaterialChange(group.itemId, row.entry.id, Number(e.target.value))}
                              placeholder="자재비"
                              className="w-full px-2 py-1 bg-toss-input rounded-lg text-[12px] text-right tabular-nums placeholder:text-toss-text-tertiary focus:outline-none focus:bg-toss-divider transition-colors"
                            />
                          </div>
                          {/* 순수익 */}
                          <span
                            className={`w-[10%] text-right text-[12px] font-bold tabular-nums pt-1.5 ${
                              rowMaterial > 0
                                ? rowProfit >= 0 ? "text-toss-green" : "text-toss-red"
                                : "text-toss-text-tertiary"
                            }`}
                          >
                            {rowMaterial > 0 ? (rowProfit >= 0 ? "+" : "") + fmt(rowProfit) : "-"}
                          </span>
                        </div>

                        {/* Mobile Row (compact) */}
                        <div className="md:hidden bg-toss-bg/40 rounded-xl p-3 mb-1.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-semibold text-toss-text">{row.entry.description}</span>
                            <span className="text-[11px] text-toss-text-tertiary tabular-nums">견적 {fmt(row.entry.quotedAmount)}</span>
                          </div>
                          {/* 거래처 지급 */}
                          {row.payments.map((payment) => (
                            <div key={payment.id} className="flex items-center gap-1.5">
                              <select
                                value={payment.vendorId}
                                onChange={(e) => updatePaymentVendor(group.itemId, row.entry.id, payment.id, e.target.value)}
                                className="flex-1 min-w-0 px-2 py-1.5 bg-white border border-toss-border rounded-lg text-[11px] focus:outline-none focus:border-toss-blue"
                              >
                                <option value="">거래처</option>
                                {vendorOptions.map((v) => (
                                  <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                              </select>
                              <input
                                type="number"
                                min="0"
                                value={payment.amount || ""}
                                onChange={(e) => updatePaymentAmount(group.itemId, row.entry.id, payment.id, Number(e.target.value))}
                                placeholder="금액"
                                className="w-24 px-2 py-1.5 bg-toss-input rounded-lg text-[11px] text-right tabular-nums placeholder:text-toss-text-tertiary focus:outline-none"
                              />
                              <button onClick={() => removePayment(group.itemId, row.entry.id, payment.id)} className="p-0.5 text-toss-text-tertiary hover:text-toss-red shrink-0">
                                <Trash2 size={11} />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => addPayment(group.itemId, row.entry.id)}
                            className="text-[10px] font-medium text-toss-blue flex items-center gap-0.5"
                          >
                            <Plus size={10} /> 거래처
                          </button>
                          {/* 자재 + 순수익 한줄 */}
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={row.entry.materialCost || ""}
                              onChange={(e) => handleMaterialChange(group.itemId, row.entry.id, Number(e.target.value))}
                              placeholder="실자재구매"
                              className="flex-1 px-2 py-1.5 bg-toss-input rounded-lg text-[11px] text-right tabular-nums placeholder:text-toss-text-tertiary focus:outline-none"
                            />
                            <span
                              className={`text-[12px] font-bold tabular-nums shrink-0 w-20 text-right ${
                                rowMaterial > 0
                                  ? rowProfit >= 0 ? "text-toss-green" : "text-toss-red"
                                  : "text-toss-text-tertiary"
                              }`}
                            >
                              {rowMaterial > 0 ? (rowProfit >= 0 ? "+" : "") + fmt(rowProfit) : "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Group Subtotal */}
                  <div className="bg-toss-bg rounded-xl px-3 py-2.5 flex items-center justify-between text-[12px] mt-2">
                    <span className="font-semibold text-toss-text-secondary">소계</span>
                    <div className="flex items-center gap-3 tabular-nums">
                      {groupVendorPay > 0 && (
                        <span className="text-toss-text-tertiary">
                          거래처 <span className="font-bold text-toss-text">{fmt(groupVendorPay)}</span>
                        </span>
                      )}
                      <span className="text-toss-text-tertiary">
                        자재 <span className="font-bold text-toss-text">{fmt(groupMaterial)}</span>
                      </span>
                      <span className={`font-bold ${groupProfit >= 0 ? "text-toss-green" : "text-toss-red"}`}>
                        {groupProfit >= 0 ? "+" : ""}{fmt(groupProfit)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </section>
          );
        })}

        {/* Summary */}
        <section className="bg-toss-text rounded-2xl p-4 md:p-5 text-white">
          <h3 className="text-[14px] font-bold text-white/70 mb-3">정산 요약</h3>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between">
              <span className="text-white/60">총 견적금액 (수금액)</span>
              <span className="font-semibold tabular-nums">{formatCurrency(totalQuotedAmount)}</span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex justify-between">
              <span className="text-white/60">거래처 지급 합계</span>
              <span className="font-medium text-orange-300 tabular-nums">- {formatCurrency(totalPayments)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">실자재구매 합계</span>
              <span className="font-medium text-orange-300 tabular-nums">- {formatCurrency(totalMaterialCost)}</span>
            </div>
            <div className="h-px bg-white/20 mt-2" />
            <div className="flex justify-between items-baseline pt-2">
              <span className="text-[15px] font-bold">최종 순수익</span>
              <div className="text-right">
                <span
                  className={`text-[24px] md:text-[28px] font-extrabold tracking-tight tabular-nums ${
                    finalMargin >= 0 ? "text-toss-green" : "text-toss-red"
                  }`}
                >
                  {formatCurrency(finalMargin)}
                </span>
                <span
                  className={`ml-1.5 text-[14px] font-bold ${
                    finalMargin >= 0 ? "text-toss-green" : "text-toss-red"
                  }`}
                >
                  ({finalMarginPercent}%)
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Validation */}
        {!isAllValid && (
          <div className="bg-toss-red-light p-3 rounded-2xl text-[12px] text-toss-red">
            <p className="font-bold mb-1">입력이 필요한 항목이 있습니다</p>
            <ul className="space-y-0.5">
              {groups
                .flatMap((g) =>
                  g.rows
                    .filter((r) => !(Number(r.entry.materialCost) > 0))
                    .map((r) => (
                      <li key={r.entry.id}>· [{g.category}] {r.entry.description} — 실자재구매 미입력</li>
                    )),
                )}
            </ul>
          </div>
        )}
      </div>

      {/* Floating Bottom Bar (mobile) */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-2xl shadow-[0_-1px_12px_rgba(0,0,0,0.06)] md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="min-w-0 flex-1 mr-3">
            <span className="text-[11px] text-toss-text-tertiary block">최종 순수익</span>
            <span
              className={`text-[18px] font-extrabold tabular-nums ${
                finalMargin >= 0 ? "text-toss-green" : "text-toss-red"
              }`}
            >
              {formatCurrency(finalMargin)}
            </span>
          </div>
          <button
            onClick={handleConfirm}
            disabled={!isAllValid}
            className={`flex items-center gap-1.5 px-6 py-3 text-[14px] font-semibold rounded-2xl transition-all active:scale-[0.97] shrink-0 ${
              isAllValid
                ? "bg-toss-green text-white hover:bg-toss-green/80"
                : "bg-toss-divider text-toss-text-tertiary cursor-not-allowed"
            }`}
          >
            <CheckCircle size={16} />
            정산 확정
          </button>
        </div>
      </div>
    </div>
  );
}
