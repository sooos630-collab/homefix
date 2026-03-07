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

      {/* Printable Document */}
      <div className="bg-white p-5 md:p-16 rounded-2xl border border-neutral-200 shadow-sm print:shadow-none print:border-none print:rounded-none print:p-0 print:m-0 print:max-w-none print:min-h-0 max-w-[210mm] mx-auto md:min-h-[297mm]">
        {/* Document Header */}
        <div className="text-center mb-6 md:mb-8 border-b-2 border-neutral-900 pb-4 md:pb-6 print:mb-4 print:pb-4">
          <h1 className="text-2xl md:text-4xl font-bold tracking-widest mb-1 md:mb-2 print:text-2xl print:mb-1">
            견 적 서
          </h1>
          <p className="text-neutral-500 font-mono tracking-wider text-xs md:text-base print:text-xs">ESTIMATE</p>
        </div>

        {/* Info Section */}
        <div className="flex flex-col md:flex-row justify-between mb-6 md:mb-8 gap-4 md:gap-8 print:flex-row print:gap-4 print:mb-4">
          <div className="flex-1">
            <div className="text-lg md:text-xl font-bold mb-3 md:mb-4 border-b border-neutral-200 pb-2 print:text-base print:mb-2 print:pb-1">
              <span className="text-xl md:text-2xl print:text-lg">{quote.client.name}</span> 귀하
            </div>
            <table className="w-full text-sm print:text-xs">
              <tbody>
                <tr>
                  <td className="py-1 md:py-1.5 font-medium text-neutral-500 w-20 md:w-24 print:py-0.5 print:w-16">
                    견적일자
                  </td>
                  <td className="py-1 md:py-1.5 print:py-0.5">{formatDate(quote.date)}</td>
                </tr>
                <tr>
                  <td className="py-1 md:py-1.5 font-medium text-neutral-500 print:py-0.5">
                    현장주소
                  </td>
                  <td className="py-1 md:py-1.5 print:py-0.5">{quote.client.address || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 md:py-1.5 font-medium text-neutral-500 print:py-0.5">
                    연락처
                  </td>
                  <td className="py-1 md:py-1.5 print:py-0.5">{quote.client.contact || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1 md:py-1.5 font-medium text-neutral-500 print:py-0.5">
                    공사예정일
                  </td>
                  <td className="py-1 md:py-1.5 print:py-0.5">
                    {quote.client.projectDate || "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex-1 bg-neutral-50 p-4 md:p-6 rounded-xl border border-neutral-200 print:rounded-none print:border print:border-neutral-300 print:p-3">
            <div className="flex items-center justify-between mb-3 md:mb-4 print:mb-2">
              <h3 className="font-bold text-neutral-900 text-sm md:text-base print:text-sm">공급자 정보</h3>
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
            <table className="w-full text-sm print:text-xs">
              <tbody>
                <tr>
                  <td className="py-1 md:py-1.5 font-medium text-neutral-500 w-16 md:w-20 print:py-0.5 print:w-14">
                    발급자
                  </td>
                  <td className="py-1 md:py-1.5 font-bold print:py-0.5">
                    {editingSupplier ? (
                      <input type="text" value={supplier.name} onChange={(e) => setSupplier({ ...supplier, name: e.target.value })} className="w-full px-2 py-0.5 border border-neutral-300 rounded text-sm" />
                    ) : supplier.name}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 md:py-1.5 font-medium text-neutral-500 print:py-0.5">
                    대표자
                  </td>
                  <td className="py-1 md:py-1.5 print:py-0.5">
                    {editingSupplier ? (
                      <input type="text" value={supplier.representative} onChange={(e) => setSupplier({ ...supplier, representative: e.target.value })} className="w-full px-2 py-0.5 border border-neutral-300 rounded text-sm" />
                    ) : supplier.representative}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 md:py-1.5 font-medium text-neutral-500 print:py-0.5">
                    연락처
                  </td>
                  <td className="py-1 md:py-1.5 print:py-0.5">
                    {editingSupplier ? (
                      <input type="text" value={supplier.contact} onChange={(e) => setSupplier({ ...supplier, contact: e.target.value })} className="w-full px-2 py-0.5 border border-neutral-300 rounded text-sm" />
                    ) : supplier.contact}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 md:py-1.5 font-medium text-neutral-500 print:py-0.5">
                    주소
                  </td>
                  <td className="py-1 md:py-1.5 print:py-0.5">
                    {editingSupplier ? (
                      <input type="text" value={supplier.address} onChange={(e) => setSupplier({ ...supplier, address: e.target.value })} className="w-full px-2 py-0.5 border border-neutral-300 rounded text-sm" />
                    ) : supplier.address}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Total Amount Highlight */}
        <div className="bg-neutral-900 text-white p-4 md:p-6 rounded-xl mb-6 md:mb-8 flex items-center justify-between print:rounded-none print:p-3 print:mb-4">
          <div className="text-sm md:text-lg font-medium opacity-80 print:text-sm">
            총 견적 금액 (VAT 별도)
          </div>
          <div className="text-xl md:text-3xl font-bold tracking-tight print:text-xl">
            {formatCurrency(quote.total)}
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm mb-6 md:mb-8 border-collapse print:text-xs print:mb-4">
            <thead>
              <tr className="border-y-2 border-neutral-900 bg-neutral-50">
                <th className="py-2 md:py-3 px-1 md:px-2 text-center font-bold w-8 md:w-12 print:py-1.5 print:px-1 text-xs md:text-sm">NO</th>
                <th className="py-2 md:py-3 px-1 md:px-2 text-left font-bold print:py-1.5 print:px-1 text-xs md:text-sm">공정</th>
                <th className="py-2 md:py-3 px-1 md:px-2 text-left font-bold print:py-1.5 print:px-1 text-xs md:text-sm">내용</th>
                <th className="py-2 md:py-3 px-1 md:px-2 text-center font-bold print:py-1.5 print:px-1 text-xs md:text-sm">수량</th>
                <th className="py-2 md:py-3 px-1 md:px-2 text-right font-bold print:py-1.5 print:px-1 text-xs md:text-sm">단가</th>
                <th className="py-2 md:py-3 px-1 md:px-2 text-right font-bold print:py-1.5 print:px-1 text-xs md:text-sm hidden sm:table-cell">
                  시공비
                </th>
                <th className="py-2 md:py-3 px-1 md:px-2 text-right font-bold print:py-1.5 print:px-1 text-xs md:text-sm">금액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {quote.items.map((item, index) => (
                <React.Fragment key={item.id}>
                  <tr className={item.costItems.length > 0 ? "bg-white" : ""}>
                    <td className="py-2 md:py-3 px-1 md:px-2 text-center text-neutral-500 print:py-1.5 print:px-1 text-xs md:text-sm">
                      {index + 1}
                    </td>
                    <td className="py-2 md:py-3 px-1 md:px-2 font-medium text-neutral-900 print:py-1.5 print:px-1 text-xs md:text-sm">
                      {item.category}
                    </td>
                    <td className="py-2 md:py-3 px-1 md:px-2 font-bold text-neutral-900 print:py-1.5 print:px-1 text-xs md:text-sm">
                      {item.description}
                    </td>
                    <td className="py-2 md:py-3 px-1 md:px-2 text-center print:py-1.5 print:px-1 text-xs md:text-sm">{item.quantity}</td>
                    <td className="py-2 md:py-3 px-1 md:px-2 text-right print:py-1.5 print:px-1 text-xs md:text-sm">
                      {new Intl.NumberFormat("ko-KR").format(item.unitPrice)}
                    </td>
                    <td className="py-2 md:py-3 px-1 md:px-2 text-right print:py-1.5 print:px-1 text-xs md:text-sm hidden sm:table-cell">
                      {new Intl.NumberFormat("ko-KR").format(item.laborCost)}
                    </td>
                    <td className="py-2 md:py-3 px-1 md:px-2 text-right font-bold text-neutral-900 print:py-1.5 print:px-1 text-xs md:text-sm">
                      {new Intl.NumberFormat("ko-KR").format(item.amount)}
                    </td>
                  </tr>
                  {item.costItems.map((cItem) => {
                    const customerAmount = cItem.amount + (cItem.margin || 0);
                    const customerUnitPrice =
                      cItem.quantity > 0 ? customerAmount / cItem.quantity : 0;
                    return (
                      <tr
                        key={cItem.id}
                        className="bg-neutral-50/80 text-neutral-600"
                      >
                        <td className="py-1.5 md:py-2 px-1 md:px-2 print:py-1 print:px-1"></td>
                        <td className="py-1.5 md:py-2 px-1 md:px-2 print:py-1 print:px-1"></td>
                        <td className="py-1.5 md:py-2 px-1 md:px-2 text-xs md:text-sm pl-3 md:pl-4 print:py-1 print:px-1 print:text-xs print:pl-2">
                          <span className="text-neutral-400 mr-1 md:mr-2">&lsaquo;</span>
                          {cItem.description}
                        </td>
                        <td className="py-1.5 md:py-2 px-1 md:px-2 text-center text-xs md:text-sm print:py-1 print:px-1 print:text-xs">
                          {cItem.quantity}
                        </td>
                        <td className="py-1.5 md:py-2 px-1 md:px-2 text-right text-xs md:text-sm print:py-1 print:px-1 print:text-xs">
                          {new Intl.NumberFormat("ko-KR").format(customerUnitPrice)}
                        </td>
                        <td className="py-1.5 md:py-2 px-1 md:px-2 text-right text-xs md:text-sm text-neutral-400 print:py-1 print:px-1 print:text-xs hidden sm:table-cell">
                          -
                        </td>
                        <td className="py-1.5 md:py-2 px-1 md:px-2 text-right text-xs md:text-sm print:py-1 print:px-1 print:text-xs">
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
                <td
                  colSpan={5}
                  className="py-2 md:py-3 px-1 md:px-2 text-right font-medium text-neutral-600 print:py-1.5 print:px-1 text-xs md:text-sm sm:hidden"
                >
                  공급가액
                </td>
                <td
                  colSpan={6}
                  className="py-2 md:py-3 px-1 md:px-2 text-right font-medium text-neutral-600 print:py-1.5 print:px-1 text-xs md:text-sm hidden sm:table-cell"
                >
                  공급가액
                </td>
                <td className="py-2 md:py-3 px-1 md:px-2 text-right font-medium print:py-1.5 print:px-1 text-xs md:text-sm">
                  {formatCurrency(quote.subtotal)}
                </td>
              </tr>
              <tr className="border-t-2 border-neutral-900 bg-neutral-50">
                <td
                  colSpan={5}
                  className="py-3 md:py-4 px-1 md:px-2 text-right font-bold text-sm md:text-lg print:py-2 print:px-1 print:text-sm sm:hidden"
                >
                  합계 (VAT 별도)
                </td>
                <td
                  colSpan={6}
                  className="py-3 md:py-4 px-1 md:px-2 text-right font-bold text-sm md:text-lg print:py-2 print:px-1 print:text-sm hidden sm:table-cell"
                >
                  합계 금액 (VAT 별도)
                </td>
                <td className="py-3 md:py-4 px-1 md:px-2 text-right font-bold text-sm md:text-lg print:py-2 print:px-1 print:text-sm">
                  {formatCurrency(quote.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="border border-neutral-200 rounded-xl p-4 md:p-6 bg-neutral-50/50 print:rounded-none print:p-3">
            <h4 className="font-bold mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base print:mb-1 print:text-sm">
              <FileText size={16} />
              특이사항
            </h4>
            <div className="text-xs md:text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed print:text-xs print:leading-normal">
              {quote.notes}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 md:mt-12 text-center text-xs md:text-sm text-neutral-500 print:mt-6 print:text-xs">
          <p>위와 같이 견적서를 제출합니다.</p>
        </div>
      </div>
    </div>
  );
}
