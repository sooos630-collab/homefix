"use client";

import React, { useState } from "react";
import {
  Plus,
  ChevronLeft,
  Trash2,
  Calculator,
  FileDown,
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
  const [showMargin] = useState(true);
  // Cost items always visible (no toggle)

  const recalcFromCostItems = (item: QuoteItem): QuoteItem => {
    if (item.costItems.length === 0) {
      return { ...item, quantity: 0, unitPrice: 0, laborCost: 0, amount: 0, margin: 0, materialMargin: 0 };
    }
    const totalMaterialCost = item.costItems.reduce((sum, c) => sum + c.amount, 0);
    const totalMarginSum = item.costItems.reduce((sum, c) => sum + (Number(c.margin) || 0), 0);
    const totalLaborCost = item.costItems.reduce((sum, c) => sum + (Number(c.laborCost) || 0), 0);
    const totalQuantity = item.costItems.reduce((sum, c) => sum + (Number(c.quantity) || 0), 0);
    const unitPrice = totalQuantity > 0
      ? (totalMaterialCost + totalMarginSum) / totalQuantity
      : 0;
    const amount = totalQuantity * unitPrice + totalLaborCost;
    const margin = totalMarginSum + totalLaborCost;
    return { ...item, quantity: totalQuantity, unitPrice, laborCost: totalLaborCost, materialMargin: totalMarginSum, margin, amount };
  };

  const handleItemChange = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          return recalcFromCostItems(updatedItem);
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

          return recalcFromCostItems({ ...item, costItems: updatedCostItems });
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
                laborCost: 0,
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
          return recalcFromCostItems({ ...item, costItems: updatedCostItems });
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
      item.costItems.reduce((cSum, c) => cSum + c.amount + (Number(c.laborCost) || 0), 0) +
      (item.costItems.length === 0 ? Number(item.laborCost) || 0 : 0),
    0,
  );
  const totalMargin = items.reduce((sum, item) => sum + item.margin, 0);

  const handlePrintMargin = () => {
    const win = window.open("", "_blank");
    if (!win) return;

    const rows = items
      .map((item, idx) => {
        const parentRow = `<tr style="background:#f5f5f5;font-weight:bold">
          <td style="padding:6px 8px;border:1px solid #ddd;text-align:center">${idx + 1}</td>
          <td style="padding:6px 8px;border:1px solid #ddd">${item.category}</td>
          <td style="padding:6px 8px;border:1px solid #ddd">${item.description}</td>
          <td style="padding:6px 8px;border:1px solid #ddd;text-align:center">${item.quantity}</td>
          <td style="padding:6px 8px;border:1px solid #ddd;text-align:right">${new Intl.NumberFormat("ko-KR").format(item.unitPrice)}</td>
          <td style="padding:6px 8px;border:1px solid #ddd;text-align:right">${new Intl.NumberFormat("ko-KR").format(item.laborCost)}</td>
          <td style="padding:6px 8px;border:1px solid #ddd;text-align:right">${new Intl.NumberFormat("ko-KR").format(item.margin)}</td>
          <td style="padding:6px 8px;border:1px solid #ddd;text-align:right">${new Intl.NumberFormat("ko-KR").format(item.amount)}</td>
        </tr>`;

        const costRows = item.costItems
          .map(
            (c) =>
              `<tr style="color:#555">
                <td style="padding:4px 8px;border:1px solid #ddd;text-align:center"></td>
                <td style="padding:4px 8px;border:1px solid #ddd"></td>
                <td style="padding:4px 8px;border:1px solid #ddd;padding-left:24px">\u2514 ${c.description}</td>
                <td style="padding:4px 8px;border:1px solid #ddd;text-align:center">${c.quantity}</td>
                <td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${new Intl.NumberFormat("ko-KR").format(c.unitPrice)} <span style="color:#999;font-size:11px">(원가)</span></td>
                <td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${new Intl.NumberFormat("ko-KR").format(c.laborCost)}</td>
                <td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${new Intl.NumberFormat("ko-KR").format(c.margin)}</td>
                <td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${new Intl.NumberFormat("ko-KR").format(c.amount + (Number(c.margin) || 0) + (Number(c.laborCost) || 0))}</td>
              </tr>`,
          )
          .join("");

        return parentRow + costRows;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>원가/마진 내역서 - ${client.name || "미입력"}</title>
  <style>
    @page { size: A4; margin: 10mm; }
    body { font-family: -apple-system, sans-serif; font-size: 13px; color: #222; margin: 0; padding: 20px; }
    h1 { font-size: 20px; text-align: center; margin-bottom: 4px; }
    .info { text-align: center; color: #666; margin-bottom: 16px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #222; color: #fff; padding: 8px; border: 1px solid #222; font-size: 12px; }
    .summary { margin-top: 16px; text-align: right; font-size: 14px; }
    .summary span { font-weight: bold; }
  </style>
</head>
<body>
  <h1>원가 / 마진 내역서</h1>
  <div class="info">${client.name || "-"} | ${date} | ${client.address || "-"}</div>
  <table>
    <thead>
      <tr>
        <th style="width:5%">NO</th>
        <th style="width:12%">공정</th>
        <th style="width:25%">내용</th>
        <th style="width:7%">수량</th>
        <th style="width:14%">단가</th>
        <th style="width:12%">시공비</th>
        <th style="width:12%">마진</th>
        <th style="width:13%">금액</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="summary">
    <p>총 원가: <span>${formatCurrency(totalCost)}</span></p>
    <p>총 마진: <span>${formatCurrency(totalMargin)}</span> (마진율: ${subtotal > 0 ? Math.round((totalMargin / subtotal) * 100) : 0}%)</p>
    <p style="font-size:16px;margin-top:8px">총 견적 금액 (VAT 별도): <span>${formatCurrency(total)}</span></p>
  </div>
  <script>window.onload=function(){window.print();}</script>
</body>
</html>`;

    win.document.write(html);
    win.document.close();
  };

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

  // Shared input styles
  const inp = "px-3 py-2 bg-white border border-toss-border rounded-lg text-[14px] text-toss-text placeholder:text-toss-text-tertiary focus:outline-none focus:border-toss-blue focus:ring-1 focus:ring-toss-blue/20 transition-colors w-full";
  const costInp = "px-2.5 py-1.5 bg-white border border-toss-border rounded-lg text-[13px] text-toss-text tabular-nums focus:outline-none focus:border-toss-blue focus:ring-1 focus:ring-toss-blue/20 transition-colors w-full";
  const costInpBlue = "px-2.5 py-1.5 bg-toss-blue-light border border-toss-blue/20 rounded-lg text-[13px] text-toss-blue font-medium tabular-nums focus:outline-none focus:border-toss-blue focus:ring-1 focus:ring-toss-blue/20 transition-colors w-full";
  const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

  // Desktop grid: NO | 공정 | 시공명 | 수량 | 공급가 | 시공비 | 중간마진 | 합계 | 삭제
  const itemGrid = "grid-cols-[32px_120px_1fr_64px_96px_96px_96px_96px_36px]";
  // Cost sub-grid (indented): 내용 | 수량 | 원가단가 | 중간마진 | 시공비 | 합계 | 삭제
  const costGrid = "grid-cols-[1fr_64px_96px_96px_96px_96px_36px]";

  return (
    <div className="min-h-screen bg-toss-bg overflow-y-auto h-full">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-white">
        <div className="px-4 md:px-6 h-12 md:h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onCancel} className="p-1 -ml-1 hover:bg-toss-divider rounded-full transition-colors">
              <ChevronLeft size={22} className="text-toss-text" />
            </button>
            <h2 className="text-[17px] md:text-[18px] font-bold text-toss-text">
              {initialQuote ? "견적서 수정" : "새 견적서"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrintMargin}
              className="hidden md:flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-toss-text-secondary hover:text-toss-text hover:bg-toss-divider rounded-xl transition-colors">
              <FileDown size={15} /> 원가 PDF
            </button>
            <button onClick={handleSave}
              className="px-5 py-2 bg-toss-blue text-white text-[14px] font-semibold rounded-xl hover:bg-toss-blue-dark active:scale-[0.97] transition-all">
              저장
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-6 py-3 md:py-4 pb-28 md:pb-8 space-y-3">

        {/* ── Basic Info ── */}
        <section className="bg-white rounded-2xl p-4 md:p-5">
          <h3 className="text-[15px] font-bold text-toss-text mb-3">고객 정보</h3>
          <div className="hidden md:grid md:grid-cols-4 gap-x-3 gap-y-3">
            <div>
              <label className="text-[12px] font-medium text-toss-text-secondary mb-1 block">고객명 *</label>
              <input type="text" value={client.name}
                onChange={(e) => setClient({ ...client, name: e.target.value })}
                placeholder="홍길동" className={inp} />
            </div>
            <div>
              <label className="text-[12px] font-medium text-toss-text-secondary mb-1 block">연락처</label>
              <input type="text" value={client.contact}
                onChange={(e) => setClient({ ...client, contact: e.target.value })}
                placeholder="010-0000-0000" className={inp} />
            </div>
            <div>
              <label className="text-[12px] font-medium text-toss-text-secondary mb-1 block">견적일</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="text-[12px] font-medium text-toss-text-secondary mb-1 block">공사예정일</label>
              <input type="text" value={client.projectDate}
                onChange={(e) => setClient({ ...client, projectDate: e.target.value })}
                placeholder="2026년 4월" className={inp} />
            </div>
            <div className="col-span-4">
              <label className="text-[12px] font-medium text-toss-text-secondary mb-1 block">현장주소</label>
              <input type="text" value={client.address}
                onChange={(e) => setClient({ ...client, address: e.target.value })}
                placeholder="서울시 강남구..." className={inp} />
            </div>
          </div>
          <div className="md:hidden grid grid-cols-2 gap-x-2.5 gap-y-2.5">
            <div className="col-span-2">
              <label className="text-[12px] font-medium text-toss-text-secondary mb-1 block">고객명 *</label>
              <input type="text" value={client.name}
                onChange={(e) => setClient({ ...client, name: e.target.value })}
                placeholder="홍길동" className={inp} />
            </div>
            <div>
              <label className="text-[12px] font-medium text-toss-text-secondary mb-1 block">연락처</label>
              <input type="text" value={client.contact}
                onChange={(e) => setClient({ ...client, contact: e.target.value })}
                placeholder="010-0000-0000" className={inp} />
            </div>
            <div>
              <label className="text-[12px] font-medium text-toss-text-secondary mb-1 block">견적일</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="text-[12px] font-medium text-toss-text-secondary mb-1 block">공사예정일</label>
              <input type="text" value={client.projectDate}
                onChange={(e) => setClient({ ...client, projectDate: e.target.value })}
                placeholder="2026년 4월" className={inp} />
            </div>
            <div>
              <label className="text-[12px] font-medium text-toss-text-secondary mb-1 block">현장주소</label>
              <input type="text" value={client.address}
                onChange={(e) => setClient({ ...client, address: e.target.value })}
                placeholder="서울시 강남구..." className={inp} />
            </div>
          </div>
        </section>

        {/* ── Items ── */}
        <section className="bg-white rounded-2xl p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-bold text-toss-text">상세 내역</h3>
            <button onClick={handlePrintMargin}
              className="md:hidden flex items-center gap-1 px-2.5 py-1.5 text-[13px] font-medium text-toss-text-secondary hover:bg-toss-divider rounded-lg transition-colors">
              <FileDown size={14} /> PDF
            </button>
          </div>

          {/* Desktop: Table header */}
          <div className={`hidden md:grid ${itemGrid} gap-2 items-center px-4 py-2 bg-toss-bg rounded-t-lg border border-toss-border/60 text-[12px] font-bold text-toss-text-secondary`}>
            <span className="text-center">NO</span>
            <span>공정</span>
            <span>시공명</span>
            <span className="text-center">수량</span>
            <span className="text-right">공급가</span>
            <span className="text-right">시공비</span>
            <span className="text-right text-toss-blue">중간마진</span>
            <span className="text-right">합계</span>
            <span></span>
          </div>

          <div className="md:space-y-0 space-y-3">
            {items.map((item, idx) => (
              <div key={item.id} className="md:border-x md:border-b border-toss-border/60 md:rounded-none rounded-xl md:last:rounded-b-lg overflow-hidden">

                {/* ─ Desktop Item Row ─ */}
                <div className={`hidden md:grid ${itemGrid} gap-2 items-center px-4 py-2.5 bg-toss-bg/30 border-b border-toss-border/20`}>
                  <span className="text-[14px] font-bold text-toss-text-tertiary text-center">{idx + 1}</span>
                  <select value={item.category}
                    onChange={(e) => handleItemChange(item.id, "category", e.target.value)}
                    className={inp}>
                    {CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                  </select>
                  <input type="text" value={item.description}
                    onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                    placeholder="시공 내용" className={inp} />
                  <span className="text-[13px] text-toss-text tabular-nums text-center font-medium">{item.quantity}</span>
                  <span className="text-[13px] text-toss-text tabular-nums text-right font-medium">{fmt(item.unitPrice)}</span>
                  <span className="text-[13px] text-toss-text tabular-nums text-right font-medium">{fmt(item.laborCost)}</span>
                  <span className="text-[13px] text-toss-blue tabular-nums text-right font-bold">{fmt(item.margin)}</span>
                  <span className="text-[14px] text-toss-text tabular-nums text-right font-extrabold">{fmt(item.amount)}</span>
                  <button onClick={() => removeItem(item.id)} disabled={items.length === 1}
                    className="p-1 text-toss-text-tertiary hover:text-toss-red rounded-lg transition-colors disabled:opacity-0 justify-self-center">
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* ─ Mobile Item Row ─ */}
                <div className="md:hidden bg-toss-bg/50 px-4 py-3 border border-toss-border/60 rounded-t-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[14px] font-bold text-toss-text-tertiary w-6 text-center shrink-0">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <select value={item.category}
                        onChange={(e) => handleItemChange(item.id, "category", e.target.value)}
                        className={inp}>
                        {CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                      </select>
                    </div>
                    <button onClick={() => removeItem(item.id)} disabled={items.length === 1}
                      className="p-1.5 text-toss-text-tertiary hover:text-toss-red rounded-lg transition-colors disabled:opacity-0 shrink-0">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="pl-8 mb-2">
                    <input type="text" value={item.description}
                      onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                      placeholder="시공 내용" className={inp} />
                  </div>
                  <div className="grid grid-cols-4 gap-2 pl-8 text-center">
                    <div>
                      <span className="text-[10px] text-toss-text-tertiary block">수량</span>
                      <span className="text-[13px] font-medium text-toss-text tabular-nums">{item.quantity}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-toss-text-tertiary block">공급가</span>
                      <span className="text-[13px] font-medium text-toss-text tabular-nums">{fmt(item.unitPrice)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-toss-blue block">중간마진</span>
                      <span className="text-[13px] font-bold text-toss-blue tabular-nums">{fmt(item.margin)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-toss-text-tertiary block">합계</span>
                      <span className="text-[14px] font-extrabold text-toss-text tabular-nums">{fmt(item.amount)}</span>
                    </div>
                  </div>
                </div>

                {/* ─ Cost Items (always open) ─ */}
                <div className="bg-white md:border-b md:border-toss-border/20 md:last:border-b-0">
                  <div className="px-4 py-2 flex items-center gap-1.5 text-[12px] font-medium text-toss-text-tertiary md:pl-[48px]">
                    <Calculator size={13} /> 원가 상세 ({item.costItems.length})
                  </div>

                  <div className="px-4 pb-3 md:pl-[48px]">
                    {item.costItems.length > 0 ? (
                      <>
                        {/* Desktop cost header */}
                        <div className={`hidden md:grid ${costGrid} gap-2 items-center mb-1 text-[11px] font-medium text-toss-text-tertiary`}>
                          <span>내용</span>
                          <span className="text-center">수량</span>
                          <span className="text-right text-toss-blue">원가단가</span>
                          <span className="text-right text-toss-blue">중간마진</span>
                          <span className="text-right text-toss-blue">시공비</span>
                          <span className="text-right">합계</span>
                          <span></span>
                        </div>

                        <div className="space-y-1.5">
                          {item.costItems.map((cItem, cIndex) => {
                            const cTotal = cItem.amount + (Number(cItem.margin) || 0) + (Number(cItem.laborCost) || 0);
                            return (
                            <React.Fragment key={cItem.id}>
                              {/* Desktop Cost Row */}
                              <div className={`hidden md:grid ${costGrid} gap-2 items-center`}>
                                <input type="text" value={cItem.description}
                                  onChange={(e) => handleCostItemChange(item.id, cItem.id, "description", e.target.value)}
                                  placeholder="원가 내용" className={costInp} />
                                <input type="number" min="0" value={cItem.quantity || ""}
                                  onChange={(e) => handleCostItemChange(item.id, cItem.id, "quantity", Number(e.target.value))}
                                  className={`${costInp} text-center`} />
                                <input type="number" min="0" value={cItem.unitPrice || ""}
                                  onChange={(e) => handleCostItemChange(item.id, cItem.id, "unitPrice", Number(e.target.value))}
                                  className={`${costInpBlue} text-right`} />
                                <input type="number" value={cItem.margin || ""}
                                  onChange={(e) => handleCostItemChange(item.id, cItem.id, "margin", Number(e.target.value))}
                                  className={`${costInpBlue} text-right`} />
                                <input type="number" min="0" value={cItem.laborCost || ""}
                                  onChange={(e) => handleCostItemChange(item.id, cItem.id, "laborCost", Number(e.target.value))}
                                  className={`${costInpBlue} text-right`} />
                                <span className="text-[13px] font-bold text-toss-text tabular-nums text-right">
                                  {fmt(cTotal)}
                                </span>
                                <button onClick={() => removeCostItem(item.id, cItem.id)}
                                  className="p-1 text-toss-text-tertiary hover:text-toss-red rounded-lg transition-colors justify-self-center">
                                  <Trash2 size={14} />
                                </button>
                              </div>

                              {/* Mobile Cost Row */}
                              <div className="md:hidden bg-toss-bg/30 border border-toss-border/40 p-3 rounded-xl space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[12px] font-bold text-toss-text-tertiary shrink-0">#{cIndex + 1}</span>
                                  <input type="text" value={cItem.description}
                                    onChange={(e) => handleCostItemChange(item.id, cItem.id, "description", e.target.value)}
                                    placeholder="원가 내용" className={costInp} />
                                  <button onClick={() => removeCostItem(item.id, cItem.id)}
                                    className="p-1 text-toss-text-tertiary hover:text-toss-red rounded shrink-0">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                  <div>
                                    <label className="text-[11px] font-medium text-toss-text-secondary mb-0.5 block">수량</label>
                                    <input type="number" min="0" value={cItem.quantity || ""}
                                      onChange={(e) => handleCostItemChange(item.id, cItem.id, "quantity", Number(e.target.value))}
                                      className={`${costInp} text-center`} />
                                  </div>
                                  <div>
                                    <label className="text-[11px] font-medium text-toss-blue mb-0.5 block">원가</label>
                                    <input type="number" min="0" value={cItem.unitPrice || ""}
                                      onChange={(e) => handleCostItemChange(item.id, cItem.id, "unitPrice", Number(e.target.value))}
                                      className={`${costInpBlue} text-right`} />
                                  </div>
                                  <div>
                                    <label className="text-[11px] font-medium text-toss-blue mb-0.5 block">중간마진</label>
                                    <input type="number" value={cItem.margin || ""}
                                      onChange={(e) => handleCostItemChange(item.id, cItem.id, "margin", Number(e.target.value))}
                                      className={`${costInpBlue} text-right`} />
                                  </div>
                                  <div>
                                    <label className="text-[11px] font-medium text-toss-blue mb-0.5 block">시공비</label>
                                    <input type="number" min="0" value={cItem.laborCost || ""}
                                      onChange={(e) => handleCostItemChange(item.id, cItem.id, "laborCost", Number(e.target.value))}
                                      className={`${costInpBlue} text-right`} />
                                  </div>
                                </div>
                                <div className="text-right text-[14px] font-bold text-toss-text tabular-nums">
                                  {fmt(cTotal)}원
                                </div>
                              </div>
                            </React.Fragment>
                            );
                          })}
                        </div>

                        {/* Desktop Subtotal - same cost grid */}
                        <div className={`hidden md:grid ${costGrid} gap-2 items-center mt-2 pt-2 border-t border-toss-border/40`}>
                          <span className="text-[12px] font-bold text-toss-text-secondary text-right">소계</span>
                          <span></span>
                          <span className="text-[12px] font-bold text-toss-blue tabular-nums text-right">
                            {fmt(item.costItems.reduce((s, c) => s + c.amount, 0))}
                          </span>
                          <span className="text-[12px] font-bold text-toss-blue tabular-nums text-right">
                            {fmt(item.costItems.reduce((s, c) => s + (Number(c.margin) || 0), 0))}
                          </span>
                          <span className="text-[12px] font-bold text-toss-blue tabular-nums text-right">
                            {fmt(item.costItems.reduce((s, c) => s + (Number(c.laborCost) || 0), 0))}
                          </span>
                          <span className="text-[13px] font-extrabold text-toss-text tabular-nums text-right">
                            {fmt(item.amount)}
                          </span>
                          <span></span>
                        </div>

                        {/* Mobile Subtotal */}
                        <div className="md:hidden flex items-center justify-between mt-2 pt-2 border-t border-toss-border/40 text-[12px]">
                          <div className="flex gap-3 tabular-nums">
                            <span className="text-toss-blue font-medium">원가 {fmt(item.costItems.reduce((s, c) => s + c.amount, 0))}</span>
                            <span className="text-toss-blue font-medium">중간마진 {fmt(item.costItems.reduce((s, c) => s + (Number(c.margin) || 0), 0))}</span>
                            <span className="text-toss-blue font-medium">시공 {fmt(item.costItems.reduce((s, c) => s + (Number(c.laborCost) || 0), 0))}</span>
                          </div>
                          <span className="font-extrabold text-toss-text text-[15px] tabular-nums">{fmt(item.amount)}원</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-[13px] text-toss-text-tertiary py-4 text-center">원가 내역을 추가해주세요</div>
                    )}

                    <button onClick={() => addCostItem(item.id)}
                      className="w-full mt-2 py-2 text-[13px] font-semibold text-toss-text-secondary hover:text-toss-text border border-dashed border-toss-text-tertiary hover:border-toss-text-secondary rounded-lg transition-colors flex items-center justify-center gap-1.5 bg-toss-bg/50 hover:bg-toss-bg">
                      <Plus size={14} /> 원가 추가
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={addItem}
            className="w-full mt-3 py-2.5 text-[14px] font-medium text-toss-blue hover:bg-toss-blue-light border border-dashed border-toss-blue/40 hover:border-toss-blue rounded-xl transition-colors flex items-center justify-center gap-1.5">
            <Plus size={16} /> 항목 추가
          </button>

          {/* Totals */}
          <div className="mt-4 pt-4 border-t-2 border-toss-text/10">
            {showMargin && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mb-2 text-[13px] tabular-nums">
                <span className="text-toss-text-secondary">원가 <b className="text-toss-text">{formatCurrency(totalCost)}</b></span>
                <span className="text-toss-blue">마진 <b>{formatCurrency(totalMargin)}</b></span>
                <span className="text-toss-text-secondary">마진율 <b className="text-toss-text">{subtotal > 0 ? Math.round((totalMargin / subtotal) * 100) : 0}%</b></span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-toss-text">총 견적 금액 <span className="text-[12px] font-normal text-toss-text-tertiary ml-1">VAT별도</span></span>
              <span className="text-[22px] md:text-[24px] font-extrabold text-toss-text tabular-nums tracking-tight">{formatCurrency(total)}</span>
            </div>
          </div>
        </section>

        {/* ── Notes ── */}
        <section className="bg-white rounded-2xl p-4 md:p-5">
          <h3 className="text-[15px] font-bold text-toss-text mb-2">특이사항</h3>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            className="w-full px-3 py-2.5 bg-white border border-toss-border rounded-lg text-[14px] text-toss-text placeholder:text-toss-text-tertiary focus:outline-none focus:border-toss-blue focus:ring-1 focus:ring-toss-blue/20 transition-colors resize-y"
            placeholder="특이사항을 입력하세요" />
        </section>
      </div>

      {/* Floating Bottom Bar - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-2xl shadow-[0_-1px_12px_rgba(0,0,0,0.06)] md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="min-w-0 flex-1 mr-3">
            <span className="text-[12px] text-toss-text-tertiary block">총 견적 금액</span>
            <span className="text-[20px] font-extrabold text-toss-text tabular-nums truncate block">{formatCurrency(total)}</span>
          </div>
          <button onClick={handleSave}
            className="px-6 py-2.5 bg-toss-blue text-white text-[15px] font-semibold rounded-2xl hover:bg-toss-blue-dark active:scale-[0.97] transition-all shrink-0">
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
