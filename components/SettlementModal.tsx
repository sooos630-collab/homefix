"use client";

import { useState } from "react";
import { X, Calculator } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Quote, Settlement, SettlementItem } from "@/lib/types";

interface SettlementModalProps {
  quote: Quote;
  onConfirm: (settlement: Settlement) => void;
  onCancel: () => void;
}

export function SettlementModal({ quote, onConfirm, onCancel }: SettlementModalProps) {
  const [items, setItems] = useState<SettlementItem[]>(
    quote.items.map((item) => ({
      itemId: item.id,
      category: item.category,
      description: item.description,
      amount: item.amount,
      materialCost: item.costItems.reduce((sum, c) => sum + c.amount, 0),
      laborCost: item.costItems.reduce((sum, c) => sum + (Number(c.laborCost) || 0), 0) ||
        (item.costItems.length === 0 ? Number(item.laborCost) || 0 : 0),
      finalMargin: 0,
    })).map((item) => ({
      ...item,
      finalMargin: item.amount - item.materialCost - item.laborCost,
    })),
  );

  const handleChange = (index: number, field: "materialCost" | "laborCost", value: number) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        updated.finalMargin = updated.amount - updated.materialCost - updated.laborCost;
        return updated;
      }),
    );
  };

  const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);
  const totalMaterialCost = items.reduce((sum, i) => sum + i.materialCost, 0);
  const totalLaborCost = items.reduce((sum, i) => sum + i.laborCost, 0);
  const finalMargin = totalAmount - totalMaterialCost - totalLaborCost;
  const finalMarginPercent = totalAmount > 0 ? Math.round((finalMargin / totalAmount) * 100) : 0;

  const handleConfirm = () => {
    const settlement: Settlement = {
      items,
      totalAmount,
      totalMaterialCost,
      totalLaborCost,
      finalMargin,
      finalMarginPercent,
      settledAt: new Date().toISOString(),
    };
    onConfirm(settlement);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-200">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Calculator size={20} />
              최종 정산
            </h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              {quote.client.name} — 실제 지출을 입력하여 최종 마진을 확정하세요.
            </p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-neutral-900 text-neutral-500">
                  <th className="pb-2 text-left font-medium">공정</th>
                  <th className="pb-2 text-left font-medium">내용</th>
                  <th className="pb-2 text-right font-medium">견적금액</th>
                  <th className="pb-2 text-right font-medium">자재구매원가</th>
                  <th className="pb-2 text-right font-medium">인건비지급</th>
                  <th className="pb-2 text-right font-medium">최종마진</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {items.map((item, idx) => (
                  <tr key={item.itemId}>
                    <td className="py-3 pr-2 text-neutral-700 font-medium">{item.category}</td>
                    <td className="py-3 pr-2 text-neutral-900">{item.description}</td>
                    <td className="py-3 px-2 text-right text-neutral-600">
                      {new Intl.NumberFormat("ko-KR").format(item.amount)}
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="number"
                        min="0"
                        value={item.materialCost || ""}
                        onChange={(e) => handleChange(idx, "materialCost", Number(e.target.value))}
                        className="w-full px-2 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="number"
                        min="0"
                        value={item.laborCost || ""}
                        onChange={(e) => handleChange(idx, "laborCost", Number(e.target.value))}
                        className="w-full px-2 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900"
                      />
                    </td>
                    <td className={`py-3 pl-2 text-right font-bold ${item.finalMargin >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {new Intl.NumberFormat("ko-KR").format(item.finalMargin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {items.map((item, idx) => (
              <div key={item.itemId} className="border border-neutral-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700">{item.category}</span>
                  <span className="text-sm text-neutral-500">{new Intl.NumberFormat("ko-KR").format(item.amount)}원</span>
                </div>
                <div className="text-sm font-bold text-neutral-900">{item.description}</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-neutral-500 block mb-0.5">자재구매원가</label>
                    <input
                      type="number" min="0" value={item.materialCost || ""}
                      onChange={(e) => handleChange(idx, "materialCost", Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-right"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 block mb-0.5">인건비지급</label>
                    <input
                      type="number" min="0" value={item.laborCost || ""}
                      onChange={(e) => handleChange(idx, "laborCost", Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-right"
                    />
                  </div>
                </div>
                <div className="text-right pt-1 border-t border-neutral-100">
                  <span className="text-xs text-neutral-500">최종마진 </span>
                  <span className={`text-sm font-bold ${item.finalMargin >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {new Intl.NumberFormat("ko-KR").format(item.finalMargin)}원
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 bg-neutral-900 text-white p-5 rounded-xl">
            <h3 className="font-bold mb-3 text-sm opacity-80">정산 요약</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="opacity-70">총 견적금액</span>
                <span className="font-medium">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">총 자재구매원가</span>
                <span className="font-medium text-red-300">- {formatCurrency(totalMaterialCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">총 인건비지급</span>
                <span className="font-medium text-red-300">- {formatCurrency(totalLaborCost)}</span>
              </div>
              <div className="border-t border-white/20 pt-3 mt-3 flex justify-between items-center">
                <span className="font-bold text-base">최종 마진</span>
                <div className="text-right">
                  <span className={`text-2xl font-bold ${finalMargin >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatCurrency(finalMargin)}
                  </span>
                  <span className={`ml-2 text-lg font-bold ${finalMargin >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    ({finalMarginPercent}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-neutral-200">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm"
          >
            정산 확정
          </button>
        </div>
      </div>
    </div>
  );
}
