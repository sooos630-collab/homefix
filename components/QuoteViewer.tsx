"use client";

import React from "react";
import {
  FileText,
  Printer,
  ChevronLeft,
  Trash2,
  Edit2,
} from "lucide-react";
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
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto pb-32 print:p-0 print:pb-0 print:max-w-none">
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors font-medium"
        >
          <ChevronLeft size={20} />
          목록으로
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-xl font-medium text-neutral-700 hover:bg-neutral-50 transition-colors shadow-sm"
          >
            <Edit2 size={16} />
            수정
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors shadow-sm"
          >
            <Printer size={16} />
            인쇄 / PDF 저장
          </button>
          <div className="w-px h-6 bg-neutral-200 mx-1"></div>
          <button
            onClick={onDelete}
            className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Printable Document */}
      <div className="bg-white p-10 md:p-16 rounded-none md:rounded-2xl border border-neutral-200 shadow-sm print:shadow-none print:border-none print:p-0 max-w-[210mm] mx-auto min-h-[297mm]">
        {/* Document Header */}
        <div className="text-center mb-12 border-b-2 border-neutral-900 pb-8">
          <h1 className="text-4xl font-bold tracking-widest mb-2">
            견 적 서
          </h1>
          <p className="text-neutral-500 font-mono tracking-wider">ESTIMATE</p>
        </div>

        {/* Info Section */}
        <div className="flex flex-col md:flex-row justify-between mb-12 gap-8">
          <div className="flex-1">
            <div className="text-xl font-bold mb-4 border-b border-neutral-200 pb-2">
              <span className="text-2xl">{quote.client.name}</span> 귀하
            </div>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1.5 font-medium text-neutral-500 w-24">
                    견적일자
                  </td>
                  <td className="py-1.5">{formatDate(quote.date)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-medium text-neutral-500">
                    현장주소
                  </td>
                  <td className="py-1.5">{quote.client.address || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-medium text-neutral-500">
                    연락처
                  </td>
                  <td className="py-1.5">{quote.client.contact || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-medium text-neutral-500">
                    공사예정일
                  </td>
                  <td className="py-1.5">
                    {quote.client.projectDate || "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex-1 bg-neutral-50 p-6 rounded-xl border border-neutral-200">
            <h3 className="font-bold text-neutral-900 mb-4">공급자 정보</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1.5 font-medium text-neutral-500 w-20">
                    상호
                  </td>
                  <td className="py-1.5 font-bold">꼼꼼한 집수리</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-medium text-neutral-500">
                    대표자
                  </td>
                  <td className="py-1.5">홍길동</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-medium text-neutral-500">
                    연락처
                  </td>
                  <td className="py-1.5">02-1234-5678</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-medium text-neutral-500">
                    주소
                  </td>
                  <td className="py-1.5">서울시 서초구 서초대로 123</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Total Amount Highlight */}
        <div className="bg-neutral-900 text-white p-6 rounded-xl mb-12 flex items-center justify-between">
          <div className="text-lg font-medium opacity-80">
            총 견적 금액 (VAT 포함)
          </div>
          <div className="text-3xl font-bold tracking-tight">
            {formatCurrency(quote.total)}
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-sm mb-12 border-collapse">
          <thead>
            <tr className="border-y-2 border-neutral-900 bg-neutral-50">
              <th className="py-3 px-2 text-center font-bold w-12">NO</th>
              <th className="py-3 px-2 text-left font-bold w-[15%]">공정</th>
              <th className="py-3 px-2 text-left font-bold w-[35%]">내용</th>
              <th className="py-3 px-2 text-center font-bold w-[8%]">수량</th>
              <th className="py-3 px-2 text-right font-bold w-[15%]">단가</th>
              <th className="py-3 px-2 text-right font-bold w-[15%]">
                시공비
              </th>
              <th className="py-3 px-2 text-right font-bold w-[15%]">금액</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {quote.items.map((item, index) => (
              <React.Fragment key={item.id}>
                <tr className={item.costItems.length > 0 ? "bg-white" : ""}>
                  <td className="py-3 px-2 text-center text-neutral-500">
                    {index + 1}
                  </td>
                  <td className="py-3 px-2 font-medium text-neutral-900">
                    {item.category}
                  </td>
                  <td className="py-3 px-2 font-bold text-neutral-900">
                    {item.description}
                  </td>
                  <td className="py-3 px-2 text-center">{item.quantity}</td>
                  <td className="py-3 px-2 text-right">
                    {new Intl.NumberFormat("ko-KR").format(item.unitPrice)}
                  </td>
                  <td className="py-3 px-2 text-right">
                    {new Intl.NumberFormat("ko-KR").format(item.laborCost)}
                  </td>
                  <td className="py-3 px-2 text-right font-bold text-neutral-900">
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
                      <td className="py-2 px-2"></td>
                      <td className="py-2 px-2 text-sm text-neutral-400 text-right">
                        자재/기타
                      </td>
                      <td className="py-2 px-2 text-sm pl-4">
                        <span className="text-neutral-400 mr-2">└</span>
                        {cItem.description}
                      </td>
                      <td className="py-2 px-2 text-center text-sm">
                        {cItem.quantity}
                      </td>
                      <td className="py-2 px-2 text-right text-sm">
                        {new Intl.NumberFormat("ko-KR").format(
                          customerUnitPrice,
                        )}
                      </td>
                      <td className="py-2 px-2 text-right text-sm text-neutral-400">
                        -
                      </td>
                      <td className="py-2 px-2 text-right text-sm">
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
                colSpan={6}
                className="py-3 px-2 text-right font-medium text-neutral-600"
              >
                공급가액
              </td>
              <td className="py-3 px-2 text-right font-medium">
                {formatCurrency(quote.subtotal)}
              </td>
            </tr>
            <tr className="border-t-2 border-neutral-900 bg-neutral-50">
              <td
                colSpan={6}
                className="py-4 px-2 text-right font-bold text-lg"
              >
                합계 금액 (VAT 별도)
              </td>
              <td className="py-4 px-2 text-right font-bold text-lg">
                {formatCurrency(quote.total)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Notes */}
        {quote.notes && (
          <div className="border border-neutral-200 rounded-xl p-6 bg-neutral-50/50">
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <FileText size={16} />
              특기사항
            </h4>
            <div className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
              {quote.notes}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-neutral-500">
          <p>위와 같이 견적서를 제출합니다.</p>
          <p className="mt-4 font-bold text-neutral-900">
            꼼꼼한 집수리 (인)
          </p>
        </div>
      </div>
    </div>
  );
}
