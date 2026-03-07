"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Printer,
  ChevronLeft,
  Trash2,
  Edit2,
  Check,
} from "lucide-react";

interface SupplierInfo {
  name: string;
  representative: string;
  contact: string;
  address: string;
}

const DEFAULT_SUPPLIER: SupplierInfo = {
  name: "꼼꼼한집수리",
  representative: "송예담",
  contact: "010-9573-7996",
  address: "수원시 장안구 서부로 2181번길 4",
};

function loadSupplier(): SupplierInfo {
  if (typeof window === "undefined") return DEFAULT_SUPPLIER;
  try {
    const saved = localStorage.getItem("supplierInfo");
    return saved ? JSON.parse(saved) : DEFAULT_SUPPLIER;
  } catch {
    return DEFAULT_SUPPLIER;
  }
}
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Quote } from "@/lib/types";

interface QuoteViewerProps {
  quote: Quote;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function QuoteViewer({
  quote,
  onBack,
  onEdit,
  onDelete,
}: QuoteViewerProps) {
  const [supplier, setSupplier] = useState<SupplierInfo>(DEFAULT_SUPPLIER);
  const [editingSupplier, setEditingSupplier] = useState(false);

  useEffect(() => {
    setSupplier(loadSupplier());
  }, []);

  const handleSaveSupplier = () => {
    localStorage.setItem("supplierInfo", JSON.stringify(supplier));
    setEditingSupplier(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto pb-28 md:pb-32 print:p-0 print:pb-0 print:m-0 print:max-w-none">
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-6 md:mb-8 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-1 md:gap-2 text-neutral-600 hover:text-neutral-900 transition-colors font-medium text-sm md:text-base"
        >
          <ChevronLeft size={20} />
          목록으로
        </button>
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 md:px-4 py-2 bg-white border border-neutral-200 rounded-xl font-medium text-neutral-700 hover:bg-neutral-50 transition-colors shadow-sm text-sm"
          >
            <Edit2 size={14} />
            <span className="hidden sm:inline">수정</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 md:px-4 py-2 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors shadow-sm text-sm"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">인쇄 / PDF 저장</span>
            <span className="sm:hidden">PDF</span>
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* A4 Document - same layout for screen and print */}
      <div className="overflow-x-auto print:overflow-visible">
        <div className="bg-white border border-neutral-200 shadow-sm mx-auto print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:min-h-0"
          style={{ width: "210mm", minHeight: "297mm", padding: "15mm 18mm" }}>

          {/* Document Header */}
          <div className="text-center mb-4 border-b-2 border-neutral-900 pb-4">
            <h1 className="text-2xl font-bold tracking-widest mb-1">
              견 적 서
            </h1>
            <p className="text-neutral-500 font-mono tracking-wider text-xs">ESTIMATE</p>
          </div>

          {/* Info Section */}
          <div className="flex flex-row justify-between mb-4 gap-4">
            <div className="flex-1">
              <div className="text-base font-bold mb-2 border-b border-neutral-200 pb-1">
                <span className="text-lg">{quote.client.name}</span> 귀하
              </div>
              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="py-0.5 font-medium text-neutral-500 w-16">견적일자</td>
                    <td className="py-0.5">{formatDate(quote.date)}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 font-medium text-neutral-500">현장주소</td>
                    <td className="py-0.5">{quote.client.address || "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 font-medium text-neutral-500">연락처</td>
                    <td className="py-0.5">{quote.client.contact || "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 font-medium text-neutral-500">공사예정일</td>
                    <td className="py-0.5">{quote.client.projectDate || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex-1 bg-neutral-50 p-3 border border-neutral-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-neutral-900 text-sm">공급자 정보</h3>
                {!editingSupplier ? (
                  <button
                    onClick={() => setEditingSupplier(true)}
                    className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1 print:hidden"
                  >
                    <Edit2 size={12} />
                    수정
                  </button>
                ) : (
                  <button
                    onClick={handleSaveSupplier}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium print:hidden"
                  >
                    <Check size={12} />
                    저장
                  </button>
                )}
              </div>
              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="py-0.5 font-medium text-neutral-500 w-14">발급자</td>
                    <td className="py-0.5 font-bold">
                      {editingSupplier ? (
                        <input type="text" value={supplier.name} onChange={(e) => setSupplier({ ...supplier, name: e.target.value })} className="w-full px-2 py-0.5 border border-neutral-300 rounded text-xs print:hidden" />
                      ) : supplier.name}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5 font-medium text-neutral-500">대표자</td>
                    <td className="py-0.5">
                      {editingSupplier ? (
                        <input type="text" value={supplier.representative} onChange={(e) => setSupplier({ ...supplier, representative: e.target.value })} className="w-full px-2 py-0.5 border border-neutral-300 rounded text-xs print:hidden" />
                      ) : supplier.representative}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5 font-medium text-neutral-500">연락처</td>
                    <td className="py-0.5">
                      {editingSupplier ? (
                        <input type="text" value={supplier.contact} onChange={(e) => setSupplier({ ...supplier, contact: e.target.value })} className="w-full px-2 py-0.5 border border-neutral-300 rounded text-xs print:hidden" />
                      ) : supplier.contact}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5 font-medium text-neutral-500">주소</td>
                    <td className="py-0.5">
                      {editingSupplier ? (
                        <input type="text" value={supplier.address} onChange={(e) => setSupplier({ ...supplier, address: e.target.value })} className="w-full px-2 py-0.5 border border-neutral-300 rounded text-xs print:hidden" />
                      ) : supplier.address}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Total Amount Highlight */}
          <div className="bg-neutral-900 text-white p-3 mb-4 flex items-center justify-between">
            <div className="text-sm font-medium opacity-80">
              총 견적 금액 (VAT 별도)
            </div>
            <div className="text-xl font-bold tracking-tight">
              {formatCurrency(quote.total)}
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-xs mb-4 border-collapse">
            <thead>
              <tr className="border-y-2 border-neutral-900 bg-neutral-50">
                <th className="py-1.5 px-1 text-center font-bold w-8">NO</th>
                <th className="py-1.5 px-1 text-left font-bold w-[15%]">공정</th>
                <th className="py-1.5 px-1 text-left font-bold w-[35%]">내용</th>
                <th className="py-1.5 px-1 text-center font-bold w-[8%]">수량</th>
                <th className="py-1.5 px-1 text-right font-bold w-[15%]">단가</th>
                <th className="py-1.5 px-1 text-right font-bold w-[12%]">시공비</th>
                <th className="py-1.5 px-1 text-right font-bold w-[15%]">금액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {quote.items.map((item, index) => (
                <React.Fragment key={item.id}>
                  <tr className={item.costItems.length > 0 ? "bg-white" : ""}>
                    <td className="py-1.5 px-1 text-center text-neutral-500">{index + 1}</td>
                    <td className="py-1.5 px-1 font-medium text-neutral-900">{item.category}</td>
                    <td className="py-1.5 px-1 font-bold text-neutral-900">{item.description}</td>
                    <td className="py-1.5 px-1 text-center">{item.quantity}</td>
                    <td className="py-1.5 px-1 text-right">
                      {new Intl.NumberFormat("ko-KR").format(item.unitPrice)}
                    </td>
                    <td className="py-1.5 px-1 text-right">
                      {new Intl.NumberFormat("ko-KR").format(item.laborCost)}
                    </td>
                    <td className="py-1.5 px-1 text-right font-bold text-neutral-900">
                      {new Intl.NumberFormat("ko-KR").format(item.amount)}
                    </td>
                  </tr>
                  {item.costItems.map((cItem) => {
                    const customerAmount = cItem.amount + (cItem.margin || 0);
                    const customerUnitPrice =
                      cItem.quantity > 0 ? customerAmount / cItem.quantity : 0;
                    return (
                      <tr key={cItem.id} className="bg-neutral-50/80 text-neutral-600">
                        <td className="py-1 px-1"></td>
                        <td className="py-1 px-1"></td>
                        <td className="py-1 px-1 text-xs pl-2">
                          <span className="text-neutral-400 mr-2">└</span>
                          {cItem.description}
                        </td>
                        <td className="py-1 px-1 text-center text-xs">{cItem.quantity}</td>
                        <td className="py-1 px-1 text-right text-xs">
                          {new Intl.NumberFormat("ko-KR").format(customerUnitPrice)}
                        </td>
                        <td className="py-1 px-1 text-right text-xs text-neutral-400">-</td>
                        <td className="py-1 px-1 text-right text-xs">
                          {new Intl.NumberFormat("ko-KR").format(customerAmount)}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-neutral-900">
                <td colSpan={6} className="py-1.5 px-1 text-right font-medium text-neutral-600 text-xs">
                  공급가액
                </td>
                <td className="py-1.5 px-1 text-right font-medium text-xs">
                  {formatCurrency(quote.subtotal)}
                </td>
              </tr>
              <tr className="border-t-2 border-neutral-900 bg-neutral-50">
                <td colSpan={6} className="py-2 px-1 text-right font-bold text-sm">
                  합계 금액 (VAT 별도)
                </td>
                <td className="py-2 px-1 text-right font-bold text-sm">
                  {formatCurrency(quote.total)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Notes */}
          {quote.notes && (
            <div className="border border-neutral-200 p-3 bg-neutral-50/50">
              <h4 className="font-bold mb-1 flex items-center gap-2 text-sm">
                <FileText size={14} />
                특이사항
              </h4>
              <div className="text-xs text-neutral-700 whitespace-pre-wrap leading-normal">
                {quote.notes}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-neutral-500">
            <p>위와 같이 견적서를 제출합니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
