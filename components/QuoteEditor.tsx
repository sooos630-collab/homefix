"use client";

import React, { useState } from "react";
import {
  Plus,
  ChevronLeft,
  Trash2,
  Calculator,
} from "lucide-react";
import { generateId, formatCurrency } from "@/lib/utils";
import type { Quote, QuoteItem, CostItem, ClientInfo } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";

interface QuoteEditorProps {
  initialQuote: Quote | null;
  onSave: (q: Quote) => void;
  onCancel: () => void;
}

export function QuoteEditor({
  initialQuote,
  onSave,
  onCancel,
}: QuoteEditorProps) {
  const [date, setDate] = useState(
    initialQuote?.date || new Date().toISOString().split("T")[0],
  );
  const [client, setClient] = useState<ClientInfo>(
    initialQuote?.client || {
      name: "",
      contact: "",
      address: "",
      projectDate: "",
    },
  );
  const [items, setItems] = useState<QuoteItem[]>(
    initialQuote?.items || [
      {
        id: generateId(),
        category: "가설/철거",
        description: "",
        quantity: 1,
        unitPrice: 0,
        laborCost: 0,
        amount: 0,
        costItems: [],
        materialMargin: 0,
        margin: 0,
      },
    ],
  );
  const [notes, setNotes] = useState(
    initialQuote?.notes ||
      "1. 본 견적서는 발행일로부터 14일간 유효합니다.\n2. 부가세(VAT) 별도 금액입니다.",
  );
  const [showMargin, setShowMargin] = useState(false);

  const handleItemChange = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          const totalMaterialCost = updatedItem.costItems.reduce(
            (sum: number, c: CostItem) => sum + c.amount,
            0,
          );

          if (field === "unitPrice") {
            updatedItem.materialMargin =
              Number(updatedItem.unitPrice) * Number(updatedItem.quantity) -
              totalMaterialCost;
          } else if (field === "materialMargin") {
            updatedItem.unitPrice =
              Number(updatedItem.quantity) > 0
                ? (totalMaterialCost + Number(updatedItem.materialMargin)) /
                  Number(updatedItem.quantity)
                : 0;
          } else if (field === "quantity") {
            updatedItem.materialMargin =
              Number(updatedItem.unitPrice) * Number(updatedItem.quantity) -
              totalMaterialCost;
          }

          updatedItem.margin = Number(updatedItem.materialMargin);
          updatedItem.amount =
            Number(updatedItem.quantity) * Number(updatedItem.unitPrice) +
            Number(updatedItem.laborCost);

          return updatedItem;
        }
        return item;
      }),
    );
  };

  const handleCostItemChange = (
    quoteItemId: string,
    costItemId: string,
    field: keyof CostItem,
    value: any,
  ) => {
    setItems(
      items.map((item) => {
        if (item.id === quoteItemId) {
          const updatedCostItems = item.costItems.map((cItem) => {
            if (cItem.id === costItemId) {
              const updatedCItem = { ...cItem, [field]: value };
              if (field === "quantity" || field === "unitPrice") {
                updatedCItem.amount =
                  (Number(updatedCItem.quantity) || 0) *
                  (Number(updatedCItem.unitPrice) || 0);
              }
              return updatedCItem;
            }
            return cItem;
          });

          const totalMaterialCost = updatedCostItems.reduce(
            (sum, c) => sum + c.amount,
            0,
          );
          const totalMaterialMargin = updatedCostItems.reduce(
            (sum, c) => sum + (Number(c.margin) || 0),
            0,
          );
          const unitPrice =
            Number(item.quantity) > 0
              ? (totalMaterialCost + totalMaterialMargin) /
                Number(item.quantity)
              : 0;
          const margin = totalMaterialMargin;
          const amount =
            Number(item.quantity) * unitPrice + Number(item.laborCost);

          return {
            ...item,
            costItems: updatedCostItems,
            materialMargin: totalMaterialMargin,
            unitPrice,
            margin,
            amount,
          };
        }
        return item;
      }),
    );
  };

  const addCostItem = (quoteItemId: string) => {
    setItems(
      items.map((item) => {
        if (item.id === quoteItemId) {
          return {
            ...item,
            costItems: [
              ...item.costItems,
              {
                id: generateId(),
                description: "",
                quantity: 1,
                unitPrice: 0,
                margin: 0,
                amount: 0,
              },
            ],
          };
        }
        return item;
      }),
    );
  };

  const removeCostItem = (quoteItemId: string, costItemId: string) => {
    setItems(
      items.map((item) => {
        if (item.id === quoteItemId) {
          const updatedCostItems = item.costItems.filter(
            (c) => c.id !== costItemId,
          );
          const totalMaterialCost = updatedCostItems.reduce(
            (sum, c) => sum + c.amount,
            0,
          );
          const unitPrice =
            Number(item.quantity) > 0
              ? (totalMaterialCost + Number(item.materialMargin)) /
                Number(item.quantity)
              : 0;
          const margin = Number(item.materialMargin);
          const amount =
            Number(item.quantity) * unitPrice + Number(item.laborCost);
          return {
            ...item,
            costItems: updatedCostItems,
            unitPrice,
            margin,
            amount,
          };
        }
        return item;
      }),
    );
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: generateId(),
        category: "기타/잡비",
        description: "",
        quantity: 1,
        unitPrice: 0,
        laborCost: 0,
        amount: 0,
        costItems: [],
        materialMargin: 0,
        margin: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const tax = 0;
  const total = subtotal;
  const totalCost = items.reduce(
    (sum, item) =>
      sum +
      item.costItems.reduce((cSum, c) => cSum + c.amount, 0) +
      (Number(item.laborCost) || 0),
    0,
  );
  const totalMargin = items.reduce((sum, item) => sum + item.margin, 0);

  const handleSave = () => {
    if (!client.name) {
      alert("고객명을 입력해주세요.");
      return;
    }

    const quote: Quote = {
      id: initialQuote?.id || generateId(),
      date,
      client,
      items,
      subtotal,
      tax,
      total,
      totalCost,
      totalMargin,
      notes,
      status: initialQuote?.status || "견적",
    };
    onSave(quote);
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto pb-32">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold">
            {initialQuote ? "견적서 수정" : "새 견적서 작성"}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl font-medium text-neutral-600 hover:bg-neutral-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="bg-neutral-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-neutral-800 transition-colors shadow-sm"
          >
            저장하기
          </button>
        </div>
      </header>

      <div className="space-y-8">
        {/* Basic Info */}
        <section className="bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-sm">
              1
            </span>
            기본 정보
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                견적일자
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                고객명 / 상호명 *
              </label>
              <input
                type="text"
                value={client.name}
                onChange={(e) => setClient({ ...client, name: e.target.value })}
                placeholder="홍길동 또는 (주)회사명"
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                연락처
              </label>
              <input
                type="text"
                value={client.contact}
                onChange={(e) =>
                  setClient({ ...client, contact: e.target.value })
                }
                placeholder="010-0000-0000"
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                공사 예정일
              </label>
              <input
                type="text"
                value={client.projectDate}
                onChange={(e) =>
                  setClient({ ...client, projectDate: e.target.value })
                }
                placeholder="2026년 4월 중순"
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                현장 주소
              </label>
              <input
                type="text"
                value={client.address}
                onChange={(e) =>
                  setClient({ ...client, address: e.target.value })
                }
                placeholder="서울시 강남구 테헤란로..."
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
              />
            </div>
          </div>
        </section>

        {/* Items */}
        <section className="bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-sm">
                2
              </span>
              상세 내역
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMargin(!showMargin)}
                className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                  showMargin
                    ? "bg-blue-100 text-blue-700"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                <Calculator size={16} />
                {showMargin ? "원가/마진 숨기기" : "원가/마진 입력하기"}
              </button>
              <button
                onClick={addItem}
                className="text-sm font-medium text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Plus size={16} />
                항목 추가
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-neutral-200 text-sm text-neutral-500">
                  <th className="pb-3 font-medium w-[15%]">공정</th>
                  <th className="pb-3 font-medium w-[25%]">내용</th>
                  <th className="pb-3 font-medium w-[8%] text-center">수량</th>
                  <th className="pb-3 font-medium w-[15%] text-right">단가</th>
                  <th className="pb-3 font-medium w-[15%] text-right">
                    시공비
                  </th>
                  {showMargin && (
                    <th className="pb-3 font-medium w-[10%] text-right text-blue-600">
                      마진
                    </th>
                  )}
                  <th className="pb-3 font-medium w-[12%] text-right">금액</th>
                  <th className="pb-3 font-medium w-[5%]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {items.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr className="group">
                      <td className="py-3 pr-2 align-top">
                        <select
                          value={item.category}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "category",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-2 align-top">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "description",
                              e.target.value,
                            )
                          }
                          placeholder="상세 내용을 입력하세요"
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900"
                        />
                      </td>
                      <td className="py-3 px-2 align-top">
                        <input
                          type="number"
                          min="0"
                          value={item.quantity || ""}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "quantity",
                              Number(e.target.value),
                            )
                          }
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 text-center"
                        />
                      </td>
                      <td className="py-3 px-2 align-top">
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice || ""}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "unitPrice",
                              Number(e.target.value),
                            )
                          }
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 text-right"
                          placeholder="청구 단가"
                        />
                      </td>
                      <td className="py-3 px-2 align-top">
                        <input
                          type="number"
                          min="0"
                          value={item.laborCost || ""}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "laborCost",
                              Number(e.target.value),
                            )
                          }
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 text-right"
                          placeholder="청구 시공비"
                        />
                      </td>
                      {showMargin && (
                        <td className="py-3 px-2 text-right font-medium text-blue-600 align-top pt-5">
                          {new Intl.NumberFormat("ko-KR").format(item.margin)}
                        </td>
                      )}
                      <td className="py-3 px-2 text-right font-medium text-neutral-900 align-top pt-5">
                        {new Intl.NumberFormat("ko-KR").format(item.amount)}
                      </td>
                      <td className="py-3 pl-2 text-right align-top pt-4">
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-neutral-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                    {showMargin && (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-0 border-b border-neutral-100 pb-4"
                        >
                          <div className="bg-blue-50/30 p-4 pl-12 border-l-2 border-blue-400 ml-2 rounded-r-lg">
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="text-sm font-semibold text-blue-800 flex items-center gap-1.5">
                                  <Calculator size={14} />
                                  자재/기타 원가 및 마진 (단가 산정)
                                </h5>
                                <button
                                  onClick={() => addCostItem(item.id)}
                                  className="text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1"
                                >
                                  <Plus size={12} />
                                  원가 추가
                                </button>
                              </div>

                              {item.costItems.length > 0 ? (
                                <div className="space-y-2">
                                  {item.costItems.map((cItem, cIndex) => (
                                    <div
                                      key={cItem.id}
                                      className="flex items-center gap-2"
                                    >
                                      <span className="text-xs text-blue-400 w-4 text-center">
                                        {cIndex + 1}
                                      </span>
                                      <input
                                        type="text"
                                        value={cItem.description}
                                        onChange={(e) =>
                                          handleCostItemChange(
                                            item.id,
                                            cItem.id,
                                            "description",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="원가 내용 (예: 석고보드)"
                                        className="flex-1 px-3 py-1.5 bg-white border border-blue-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                      />
                                      <input
                                        type="number"
                                        min="0"
                                        value={cItem.quantity || ""}
                                        onChange={(e) =>
                                          handleCostItemChange(
                                            item.id,
                                            cItem.id,
                                            "quantity",
                                            Number(e.target.value),
                                          )
                                        }
                                        placeholder="수량"
                                        className="w-16 px-3 py-1.5 bg-white border border-blue-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-center"
                                      />
                                      <input
                                        type="number"
                                        min="0"
                                        value={cItem.unitPrice || ""}
                                        onChange={(e) =>
                                          handleCostItemChange(
                                            item.id,
                                            cItem.id,
                                            "unitPrice",
                                            Number(e.target.value),
                                          )
                                        }
                                        placeholder="단가"
                                        className="w-24 px-3 py-1.5 bg-white border border-blue-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-right"
                                      />
                                      <input
                                        type="number"
                                        value={cItem.margin || ""}
                                        onChange={(e) =>
                                          handleCostItemChange(
                                            item.id,
                                            cItem.id,
                                            "margin",
                                            Number(e.target.value),
                                          )
                                        }
                                        placeholder="마진"
                                        className="w-24 px-3 py-1.5 bg-white border border-blue-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-right"
                                      />
                                      <div className="w-24 text-right text-sm font-medium text-blue-900 px-2">
                                        {new Intl.NumberFormat("ko-KR").format(
                                          cItem.amount,
                                        )}
                                        원
                                      </div>
                                      <button
                                        onClick={() =>
                                          removeCostItem(item.id, cItem.id)
                                        }
                                        className="p-1.5 text-blue-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-blue-500 py-3 text-center bg-white/50 rounded-md border border-blue-100 border-dashed mb-2">
                                  등록된 원가 내역이 없습니다.
                                </div>
                              )}

                              <div className="mt-3 bg-white/60 p-3 rounded-md border border-blue-100 space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-blue-700">
                                    원가 합계
                                  </span>
                                  <span className="font-medium text-blue-900">
                                    {new Intl.NumberFormat("ko-KR").format(
                                      item.costItems.reduce(
                                        (sum, c) => sum + c.amount,
                                        0,
                                      ),
                                    )}
                                    원
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-blue-700">
                                    + 자재 마진 합계
                                  </span>
                                  <span className="font-medium text-blue-900">
                                    {new Intl.NumberFormat("ko-KR").format(
                                      item.materialMargin,
                                    )}
                                    원
                                  </span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-blue-200/50">
                                  <span className="text-sm font-bold text-blue-900">
                                    = 청구 단가
                                  </span>
                                  <span className="font-bold text-blue-900">
                                    {new Intl.NumberFormat("ko-KR").format(
                                      item.unitPrice,
                                    )}
                                    원
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-8 flex flex-col md:flex-row justify-end border-t border-neutral-200 pt-6 gap-6">
            {showMargin && (
              <div className="w-full md:w-1/3 space-y-3 bg-blue-50 p-5 rounded-xl border border-blue-100">
                <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <Calculator size={16} />
                  마진 분석
                </h4>
                <div className="flex justify-between text-blue-800">
                  <span>총 원가</span>
                  <span>{formatCurrency(totalCost)}</span>
                </div>
                <div className="flex justify-between text-blue-800 font-bold">
                  <span>예상 총 마진</span>
                  <span>{formatCurrency(totalMargin)}</span>
                </div>
                <div className="flex justify-between text-blue-800 text-sm pt-2 border-t border-blue-200/50">
                  <span>마진율 (공급가액 기준)</span>
                  <span className="font-bold">
                    {subtotal > 0
                      ? Math.round((totalMargin / subtotal) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            )}

            <div className="w-full md:w-1/3 space-y-3">
              <div className="flex justify-between text-neutral-600">
                <span>공급가액</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-3 border-t border-neutral-200">
                <span>총 견적 금액 (VAT 별도)</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Notes */}
        <section className="bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-sm">
              3
            </span>
            특기사항 및 안내
          </h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all resize-y"
            placeholder="고객에게 전달할 특기사항, 결제 조건, 공사 유의사항 등을 입력하세요."
          />
        </section>
      </div>
    </div>
  );
}
