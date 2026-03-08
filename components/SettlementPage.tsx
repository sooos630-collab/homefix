"use client";

import { useState } from "react";
import {
  ChevronLeft,
  Plus,
  Trash2,
  Calculator,
  CheckCircle,
} from "lucide-react";
import { generateId, formatCurrency } from "@/lib/utils";
import type {
  Quote,
  Settlement,
  SettlementCostEntry,
  LaborPayment,
  PartnerPayment,
} from "@/lib/types";

interface SettlementPageProps {
  quote: Quote;
  onConfirm: (settlement: Settlement) => void;
  onCancel: () => void;
}

export function SettlementPage({ quote, onConfirm, onCancel }: SettlementPageProps) {
  // Build all cost entries from every sub-item across all quote items
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
  const [laborPayments, setLaborPayments] = useState<LaborPayment[]>([
    { id: generateId(), name: "", amount: 0 },
  ]);
  const [partnerPayments, setPartnerPayments] = useState<PartnerPayment[]>([
    { id: generateId(), name: "", amount: 0 },
  ]);

  const handleCostChange = (id: string, value: number) => {
    setCostEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, materialCost: value } : e)),
    );
  };

  // Labor payments
  const addLaborPayment = () =>
    setLaborPayments((prev) => [...prev, { id: generateId(), name: "", amount: 0 }]);
  const removeLaborPayment = (id: string) =>
    setLaborPayments((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== id) : prev));
  const updateLaborPayment = (id: string, field: "name" | "amount", value: string | number) =>
    setLaborPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );

  // Partner payments
  const addPartnerPayment = () =>
    setPartnerPayments((prev) => [...prev, { id: generateId(), name: "", amount: 0 }]);
  const removePartnerPayment = (id: string) =>
    setPartnerPayments((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== id) : prev));
  const updatePartnerPayment = (id: string, field: "name" | "amount", value: string | number) =>
    setPartnerPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );

  // Calculations
  const totalQuotedAmount = quote.total;
  const totalMaterialCost = costEntries.reduce((sum, e) => sum + (Number(e.materialCost) || 0), 0);
  const totalLaborCost = laborPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalPartnerCost = partnerPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const finalMargin = totalQuotedAmount - totalMaterialCost - totalLaborCost - totalPartnerCost;
  const finalMarginPercent = totalQuotedAmount > 0 ? Math.round((finalMargin / totalQuotedAmount) * 100) : 0;

  // Validation - all fields must be filled
  const isMaterialValid = costEntries.every((e) => Number(e.materialCost) > 0);
  const isLaborValid = laborPayments.every((p) => p.name.trim() !== "" && Number(p.amount) > 0);
  const isPartnerValid = partnerPayments.every((p) => p.name.trim() !== "" && Number(p.amount) > 0);
  const isAllValid = isMaterialValid && isLaborValid && isPartnerValid;

  const handleConfirm = () => {
    if (!isAllValid) {
      alert("모든 항목을 빠짐없이 입력해주세요.\n\n- 자재구매비용: 모든 항목 입력\n- 인건비: 이름과 금액 모두 입력\n- 협력사: 업체명과 금액 모두 입력");
      return;
    }
    const settlement: Settlement = {
      costEntries,
      laborPayments: laborPayments.filter((p) => p.name.trim() && p.amount > 0),
      partnerPayments: partnerPayments.filter((p) => p.name.trim() && p.amount > 0),
      totalQuotedAmount,
      totalMaterialCost,
      totalLaborCost,
      totalPartnerCost,
      finalMargin,
      finalMarginPercent,
      settledAt: new Date().toISOString(),
    };
    onConfirm(settlement);
  };

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto pb-28 md:pb-32">
      {/* Header */}
      <header className="flex items-center justify-between mb-6 md:mb-8">
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Calculator size={22} />
              최종 정산
            </h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              {quote.client.name} — {quote.client.address || "주소 없음"}
            </p>
          </div>
        </div>
        <button
          onClick={handleConfirm}
          disabled={!isAllValid}
          className={`flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-medium text-sm md:text-base transition-colors shadow-sm ${
            isAllValid
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
          }`}
        >
          <CheckCircle size={18} />
          정산 확정
        </button>
      </header>

      <div className="space-y-6">
        {/* Section 1: 자재구매비용 */}
        <section className="bg-white p-4 md:p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <h3 className="text-base md:text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">1</span>
            실자재구매비용
            {isMaterialValid
              ? <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full ml-2">완료</span>
              : <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full ml-2">미입력 있음</span>
            }
          </h3>

          {/* Desktop Table */}
          <div className="hidden md:block">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-neutral-300 text-neutral-500">
                  <th className="pb-2 text-left font-medium w-[12%]">공정</th>
                  <th className="pb-2 text-left font-medium w-[35%]">세부항목</th>
                  <th className="pb-2 text-right font-medium w-[18%]">견적금액</th>
                  <th className="pb-2 text-right font-medium w-[20%]">실구매비용</th>
                  <th className="pb-2 text-right font-medium w-[15%]">차액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {costEntries.map((entry) => {
                  const diff = entry.quotedAmount - (Number(entry.materialCost) || 0);
                  return (
                    <tr key={entry.id}>
                      <td className="py-2.5 pr-2 text-neutral-600 text-xs">{entry.category}</td>
                      <td className="py-2.5 pr-2 font-medium">{entry.description}</td>
                      <td className="py-2.5 px-2 text-right text-neutral-500">
                        {new Intl.NumberFormat("ko-KR").format(entry.quotedAmount)}
                      </td>
                      <td className="py-2.5 px-2">
                        <input
                          type="number" min="0"
                          value={entry.materialCost || ""}
                          onChange={(e) => handleCostChange(entry.id, Number(e.target.value))}
                          placeholder="실구매 비용"
                          className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </td>
                      <td className={`py-2.5 pl-2 text-right font-medium text-sm ${diff >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {Number(entry.materialCost) > 0 ? new Intl.NumberFormat("ko-KR").format(diff) : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-neutral-300">
                  <td colSpan={2} className="py-3 font-bold text-right">합계</td>
                  <td className="py-3 px-2 text-right font-bold">
                    {formatCurrency(costEntries.reduce((s, e) => s + e.quotedAmount, 0))}
                  </td>
                  <td className="py-3 px-2 text-right font-bold text-blue-700">
                    {formatCurrency(totalMaterialCost)}
                  </td>
                  <td className={`py-3 pl-2 text-right font-bold ${costEntries.reduce((s, e) => s + e.quotedAmount, 0) - totalMaterialCost >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {formatCurrency(costEntries.reduce((s, e) => s + e.quotedAmount, 0) - totalMaterialCost)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {costEntries.map((entry) => (
              <div key={entry.id} className="border border-neutral-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">{entry.category}</span>
                  <span className="text-xs text-neutral-400">견적 {new Intl.NumberFormat("ko-KR").format(entry.quotedAmount)}원</span>
                </div>
                <div className="text-sm font-medium">{entry.description}</div>
                <div>
                  <label className="text-xs text-neutral-500 block mb-0.5">실구매비용</label>
                  <input
                    type="number" min="0"
                    value={entry.materialCost || ""}
                    onChange={(e) => handleCostChange(entry.id, Number(e.target.value))}
                    placeholder="실구매 비용 입력"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-right"
                  />
                </div>
              </div>
            ))}
            <div className="bg-neutral-50 p-3 rounded-xl text-sm font-bold flex justify-between">
              <span>자재비 합계</span>
              <span className="text-blue-700">{formatCurrency(totalMaterialCost)}</span>
            </div>
          </div>
        </section>

        {/* Section 2: 인건비지급 */}
        <section className="bg-white p-4 md:p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-bold">2</span>
              인건비지급
              {isLaborValid
                ? <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full ml-2">완료</span>
                : <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full ml-2">미입력 있음</span>
              }
            </h3>
            <button
              onClick={addLaborPayment}
              className="text-sm font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
            >
              <Plus size={14} /> 추가
            </button>
          </div>

          <div className="space-y-3">
            {laborPayments.map((payment, idx) => (
              <div key={payment.id} className="flex items-center gap-2 md:gap-3">
                <span className="text-xs text-neutral-400 w-6 text-center flex-shrink-0">{idx + 1}</span>
                <input
                  type="text"
                  value={payment.name}
                  onChange={(e) => updateLaborPayment(payment.id, "name", e.target.value)}
                  placeholder="지급 대상 (예: 홍길동)"
                  className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                <input
                  type="number" min="0"
                  value={payment.amount || ""}
                  onChange={(e) => updateLaborPayment(payment.id, "amount", Number(e.target.value))}
                  placeholder="금액"
                  className="w-32 md:w-40 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                <button
                  onClick={() => removeLaborPayment(payment.id)}
                  disabled={laborPayments.length === 1}
                  className="p-1.5 text-neutral-400 hover:text-red-600 rounded-md disabled:opacity-30"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <div className="bg-orange-50 p-3 rounded-xl text-sm font-bold flex justify-between border border-orange-100">
              <span className="text-orange-800">인건비 합계</span>
              <span className="text-orange-700">{formatCurrency(totalLaborCost)}</span>
            </div>
          </div>
        </section>

        {/* Section 3: 협력사정산 */}
        <section className="bg-white p-4 md:p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold">3</span>
              협력사정산비용
              {isPartnerValid
                ? <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full ml-2">완료</span>
                : <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full ml-2">미입력 있음</span>
              }
            </h3>
            <button
              onClick={addPartnerPayment}
              className="text-sm font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
            >
              <Plus size={14} /> 추가
            </button>
          </div>

          <div className="space-y-3">
            {partnerPayments.map((payment, idx) => (
              <div key={payment.id} className="flex items-center gap-2 md:gap-3">
                <span className="text-xs text-neutral-400 w-6 text-center flex-shrink-0">{idx + 1}</span>
                <input
                  type="text"
                  value={payment.name}
                  onChange={(e) => updatePartnerPayment(payment.id, "name", e.target.value)}
                  placeholder="협력사명 (예: ○○설비)"
                  className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
                <input
                  type="number" min="0"
                  value={payment.amount || ""}
                  onChange={(e) => updatePartnerPayment(payment.id, "amount", Number(e.target.value))}
                  placeholder="금액"
                  className="w-32 md:w-40 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
                <button
                  onClick={() => removePartnerPayment(payment.id)}
                  disabled={partnerPayments.length === 1}
                  className="p-1.5 text-neutral-400 hover:text-red-600 rounded-md disabled:opacity-30"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <div className="bg-purple-50 p-3 rounded-xl text-sm font-bold flex justify-between border border-purple-100">
              <span className="text-purple-800">협력사 합계</span>
              <span className="text-purple-700">{formatCurrency(totalPartnerCost)}</span>
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="bg-neutral-900 text-white p-5 md:p-8 rounded-2xl shadow-sm">
          <h3 className="font-bold text-lg mb-5 flex items-center gap-2">
            <Calculator size={20} />
            정산 요약
          </h3>
          <div className="space-y-3 text-sm md:text-base">
            <div className="flex justify-between">
              <span className="opacity-70">총 견적금액 (수금액)</span>
              <span className="font-bold">{formatCurrency(totalQuotedAmount)}</span>
            </div>
            <div className="border-t border-white/10 my-2"></div>
            <div className="flex justify-between">
              <span className="opacity-70">실자재구매비용</span>
              <span className="font-medium text-red-300">- {formatCurrency(totalMaterialCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">인건비지급</span>
              <span className="font-medium text-red-300">- {formatCurrency(totalLaborCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">협력사정산</span>
              <span className="font-medium text-red-300">- {formatCurrency(totalPartnerCost)}</span>
            </div>
            <div className="border-t border-white/20 pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">최종 마진</span>
                <div className="text-right">
                  <span className={`text-3xl md:text-4xl font-bold ${finalMargin >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatCurrency(finalMargin)}
                  </span>
                  <span className={`ml-3 text-xl font-bold ${finalMargin >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    ({finalMarginPercent}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Validation Status */}
        {!isAllValid && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-700">
            <p className="font-bold mb-1">아래 항목을 모두 입력해야 정산을 확정할 수 있습니다:</p>
            <ul className="list-disc pl-5 space-y-0.5">
              {!isMaterialValid && <li>자재구매비용: 모든 항목의 실구매비용을 입력해주세요</li>}
              {!isLaborValid && <li>인건비: 지급 대상 이름과 금액을 모두 입력해주세요</li>}
              {!isPartnerValid && <li>협력사: 업체명과 금액을 모두 입력해주세요</li>}
            </ul>
          </div>
        )}

        {/* Bottom Confirm Button */}
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl font-medium text-neutral-600 hover:bg-neutral-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isAllValid}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-base transition-colors shadow-sm ${
              isAllValid
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
            }`}
          >
            <CheckCircle size={20} />
            정산 확정하기
          </button>
        </div>
      </div>
    </div>
  );
}
