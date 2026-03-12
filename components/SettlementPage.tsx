"use client";

import { useState } from "react";
import {
  ChevronLeft,
  Plus,
  Trash2,
  CheckCircle,
} from "lucide-react";
import { generateId, formatCurrency } from "@/lib/utils";
import type {
  Quote,
  Settlement,
  SettlementCostEntry,
  PaymentEntry,
} from "@/lib/types";

interface SettlementPageProps {
  quote: Quote;
  onConfirm: (settlement: Settlement) => void;
  onCancel: () => void;
}

export function SettlementPage({ quote, onConfirm, onCancel }: SettlementPageProps) {
  const buildInitialEntries = (): SettlementCostEntry[] => {
    const entries: SettlementCostEntry[] = [];
    for (const item of quote.items) {
      if (item.costItems.length > 0) {
        for (const cItem of item.costItems) {
          entries.push({
            id: generateId(),
            parentItemId: item.id,
            costItemId: cItem.id,
            category: item.category,
            description: cItem.description,
            quotedAmount: cItem.amount + (Number(cItem.margin) || 0) + (Number(cItem.laborCost) || 0),
            materialCost: cItem.amount,
          });
        }
      } else {
        entries.push({
          id: generateId(),
          parentItemId: item.id,
          costItemId: "",
          category: item.category,
          description: item.description,
          quotedAmount: item.amount,
          materialCost: 0,
        });
      }
    }
    return entries;
  };

  const [costEntries, setCostEntries] = useState<SettlementCostEntry[]>(buildInitialEntries());
  const [payments, setPayments] = useState<PaymentEntry[]>([
    { id: generateId(), name: "", amount: 0 },
  ]);

  const handleCostChange = (id: string, value: number) => {
    setCostEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, materialCost: value } : e)),
    );
  };

  const addPayment = () =>
    setPayments((prev) => [...prev, { id: generateId(), name: "", amount: 0 }]);
  const removePayment = (id: string) =>
    setPayments((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== id) : prev));
  const updatePayment = (id: string, field: "name" | "amount", value: string | number) =>
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );

  const totalQuotedAmount = quote.total;
  const totalMaterialCost = costEntries.reduce((sum, e) => sum + (Number(e.materialCost) || 0), 0);
  const totalPayments = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const finalMargin = totalQuotedAmount - totalMaterialCost - totalPayments;
  const finalMarginPercent = totalQuotedAmount > 0 ? Math.round((finalMargin / totalQuotedAmount) * 100) : 0;

  const isMaterialValid = costEntries.every((e) => Number(e.materialCost) > 0);
  const isPaymentValid = payments.every((p) => p.name.trim() !== "" && Number(p.amount) > 0);
  const isAllValid = isMaterialValid && isPaymentValid;

  const handleConfirm = () => {
    if (!isAllValid) {
      alert("모든 항목을 빠짐없이 입력해주세요.\n\n- 실제원가: 모든 항목 입력\n- 지급내역: 대상과 금액 모두 입력");
      return;
    }
    const settlement: Settlement = {
      costEntries,
      payments: payments.filter((p) => p.name.trim() && p.amount > 0),
      totalQuotedAmount,
      totalMaterialCost,
      totalPayments,
      finalMargin,
      finalMarginPercent,
      settledAt: new Date().toISOString(),
    };
    onConfirm(settlement);
  };

  const inputStyle = "w-full px-3 py-2 bg-toss-input rounded-xl text-[13px] text-toss-text placeholder:text-toss-text-tertiary focus:outline-none focus:bg-toss-divider transition-colors";

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
              <p className="text-[12px] text-toss-text-tertiary -mt-0.5">{quote.client.name}</p>
            </div>
          </div>
          <button
            onClick={handleConfirm}
            disabled={!isAllValid}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-[14px] font-semibold rounded-2xl transition-all active:scale-[0.97] ${
              isAllValid
                ? "bg-toss-green text-white hover:bg-toss-green/80"
                : "bg-toss-divider text-toss-text-tertiary cursor-not-allowed"
            }`}
          >
            <CheckCircle size={16} />
            확정
          </button>
        </div>
      </header>

      <div className="px-4 md:px-6 py-3 md:py-4 space-y-3 pb-28">
        {/* Section 1: 실제원가 */}
        <section className="bg-white rounded-2xl p-4 md:p-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-[14px] font-bold text-toss-text">실제원가</h3>
            {isMaterialValid
              ? <span className="text-[10px] font-bold bg-toss-green-light text-toss-green px-2 py-0.5 rounded-full">완료</span>
              : <span className="text-[10px] font-bold bg-toss-red-light text-toss-red px-2 py-0.5 rounded-full">미입력</span>
            }
          </div>

          {/* Desktop */}
          <div className="hidden md:block space-y-0">
            <div className="flex items-center gap-3 text-[11px] text-toss-text-tertiary font-medium px-1 pb-2">
              <span className="w-[80px]">공정</span>
              <span className="flex-1">항목</span>
              <span className="w-28 text-right">견적금액</span>
              <span className="w-36 text-right">실구매비용</span>
              <span className="w-24 text-right">차액</span>
            </div>
            {costEntries.map((entry) => {
              const diff = entry.quotedAmount - (Number(entry.materialCost) || 0);
              return (
                <div key={entry.id} className="flex items-center gap-3 py-1.5">
                  <span className="w-[80px] text-[12px] text-toss-text-tertiary truncate">{entry.category}</span>
                  <span className="flex-1 text-[13px] font-medium text-toss-text truncate">{entry.description}</span>
                  <span className="w-28 text-right text-[13px] text-toss-text-tertiary tabular-nums">
                    {new Intl.NumberFormat("ko-KR").format(entry.quotedAmount)}
                  </span>
                  <div className="w-36">
                    <input
                      type="number" min="0"
                      value={entry.materialCost || ""}
                      onChange={(e) => handleCostChange(entry.id, Number(e.target.value))}
                      placeholder="실구매 비용"
                      className="w-full px-3 py-2 bg-toss-input rounded-xl text-[13px] text-right text-toss-text tabular-nums placeholder:text-toss-text-tertiary focus:outline-none focus:bg-toss-divider transition-colors"
                    />
                  </div>
                  <span className={`w-24 text-right text-[13px] font-semibold tabular-nums ${Number(entry.materialCost) > 0 ? (diff >= 0 ? "text-toss-green" : "text-toss-red") : "text-toss-text-tertiary"}`}>
                    {Number(entry.materialCost) > 0 ? new Intl.NumberFormat("ko-KR").format(diff) : "-"}
                  </span>
                </div>
              );
            })}
            <div className="flex items-center gap-3 pt-3 mt-2 border-t border-toss-divider">
              <span className="w-[80px]"></span>
              <span className="flex-1 text-[13px] font-bold text-toss-text text-right">합계</span>
              <span className="w-28 text-right text-[13px] font-bold text-toss-text tabular-nums">
                {formatCurrency(costEntries.reduce((s, e) => s + e.quotedAmount, 0))}
              </span>
              <span className="w-36 text-right text-[13px] font-bold text-toss-blue tabular-nums pr-3">
                {formatCurrency(totalMaterialCost)}
              </span>
              <span className={`w-24 text-right text-[13px] font-bold tabular-nums ${costEntries.reduce((s, e) => s + e.quotedAmount, 0) - totalMaterialCost >= 0 ? "text-toss-green" : "text-toss-red"}`}>
                {formatCurrency(costEntries.reduce((s, e) => s + e.quotedAmount, 0) - totalMaterialCost)}
              </span>
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-2">
            {costEntries.map((entry) => (
              <div key={entry.id} className="bg-toss-bg/50 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-toss-text-tertiary">{entry.category}</span>
                  <span className="text-[12px] text-toss-text-tertiary tabular-nums">견적 {new Intl.NumberFormat("ko-KR").format(entry.quotedAmount)}원</span>
                </div>
                <div className="text-[14px] font-medium text-toss-text">{entry.description}</div>
                <input
                  type="number" min="0"
                  value={entry.materialCost || ""}
                  onChange={(e) => handleCostChange(entry.id, Number(e.target.value))}
                  placeholder="실구매 비용 입력"
                  className={inputStyle + " text-right tabular-nums"}
                />
              </div>
            ))}
            <div className="bg-toss-bg p-3 rounded-xl flex justify-between text-[13px] font-bold">
              <span className="text-toss-text-secondary">실제원가 합계</span>
              <span className="text-toss-blue tabular-nums">{formatCurrency(totalMaterialCost)}</span>
            </div>
          </div>
        </section>

        {/* Section 2: 지급내역 (통합) */}
        <section className="bg-white rounded-2xl p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-bold text-toss-text">지급내역</h3>
              <span className="text-[11px] text-toss-text-tertiary">인건비 · 협력사 · 기타</span>
              {isPaymentValid
                ? <span className="text-[10px] font-bold bg-toss-green-light text-toss-green px-2 py-0.5 rounded-full">완료</span>
                : <span className="text-[10px] font-bold bg-toss-red-light text-toss-red px-2 py-0.5 rounded-full">미입력</span>
              }
            </div>
            <button
              onClick={addPayment}
              className="text-[13px] font-medium text-toss-text-secondary hover:text-toss-text hover:bg-toss-divider px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
            >
              <Plus size={14} /> 추가
            </button>
          </div>

          <div className="space-y-2">
            {payments.map((payment, idx) => (
              <div key={payment.id} className="flex items-center gap-2">
                <span className="text-[12px] text-toss-text-tertiary w-5 text-center shrink-0">{idx + 1}</span>
                <input
                  type="text"
                  value={payment.name}
                  onChange={(e) => updatePayment(payment.id, "name", e.target.value)}
                  placeholder="지급 대상 (이름/업체명)"
                  className="flex-1 px-3 py-2 bg-toss-input rounded-xl text-[13px] placeholder:text-toss-text-tertiary focus:outline-none focus:bg-toss-divider transition-colors"
                />
                <input
                  type="number" min="0"
                  value={payment.amount || ""}
                  onChange={(e) => updatePayment(payment.id, "amount", Number(e.target.value))}
                  placeholder="금액"
                  className="w-28 md:w-36 px-3 py-2 bg-toss-input rounded-xl text-[13px] text-right tabular-nums placeholder:text-toss-text-tertiary focus:outline-none focus:bg-toss-divider transition-colors"
                />
                <button
                  onClick={() => removePayment(payment.id)}
                  disabled={payments.length === 1}
                  className="p-1.5 text-toss-text-tertiary hover:text-toss-red rounded-lg transition-colors disabled:opacity-0 shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <div className="bg-toss-bg p-3 rounded-xl flex justify-between text-[13px] font-bold mt-2">
              <span className="text-toss-text-secondary">지급 합계</span>
              <span className="text-toss-text tabular-nums">{formatCurrency(totalPayments)}</span>
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="bg-toss-text rounded-2xl p-4 md:p-5 text-white">
          <h3 className="text-[14px] font-bold text-white/70 mb-3">정산 요약</h3>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between">
              <span className="text-white/60">총 견적금액 (수금액)</span>
              <span className="font-semibold tabular-nums">{formatCurrency(totalQuotedAmount)}</span>
            </div>
            <div className="h-px bg-white/10"></div>
            <div className="flex justify-between">
              <span className="text-white/60">실제원가</span>
              <span className="font-medium text-toss-red/70 tabular-nums">- {formatCurrency(totalMaterialCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">지급내역</span>
              <span className="font-medium text-toss-red/70 tabular-nums">- {formatCurrency(totalPayments)}</span>
            </div>
            <div className="h-px bg-white/20 mt-2"></div>
            <div className="flex justify-between items-baseline pt-2">
              <span className="text-[15px] font-bold">최종 순수익</span>
              <div className="text-right">
                <span className={`text-[24px] md:text-[28px] font-extrabold tracking-tight tabular-nums ${finalMargin >= 0 ? "text-toss-green" : "text-toss-red"}`}>
                  {formatCurrency(finalMargin)}
                </span>
                <span className={`ml-1.5 text-[14px] font-bold ${finalMargin >= 0 ? "text-toss-green" : "text-toss-red"}`}>
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
            <ul className="space-y-0.5 text-toss-red">
              {!isMaterialValid && <li>· 실제원가: 모든 항목의 실구매비용을 입력해주세요</li>}
              {!isPaymentValid && <li>· 지급내역: 대상과 금액을 모두 입력해주세요</li>}
            </ul>
          </div>
        )}
      </div>

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-2xl shadow-[0_-1px_12px_rgba(0,0,0,0.06)] md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="min-w-0 flex-1 mr-3">
            <span className="text-[11px] text-toss-text-tertiary block">최종 순수익</span>
            <span className={`text-[18px] font-extrabold tabular-nums ${finalMargin >= 0 ? "text-toss-green" : "text-toss-red"}`}>
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
