"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Printer,
  ChevronLeft,
  Trash2,
  Edit2,
  Check,
  History,
  X,
  CheckCircle,
  Package,
  Users,
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
import type { Quote, QuoteVersion } from "@/lib/types";

interface QuoteViewerProps {
  quote: Quote;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSettlement?: () => void;
}

export function QuoteViewer({
  quote,
  onBack,
  onEdit,
  onDelete,
  onSettlement,
}: QuoteViewerProps) {
  const [supplier, setSupplier] = useState<SupplierInfo>(DEFAULT_SUPPLIER);
  const [editingSupplier, setEditingSupplier] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [viewingVersion, setViewingVersion] = useState<QuoteVersion | null>(null);

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
    <div className="min-h-screen bg-toss-bg print:bg-white print:min-h-0">
      {/* Sticky Action Bar */}
      <header className="sticky top-0 z-20 bg-white print:hidden">
        <div className="px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-[14px] font-medium text-toss-text-secondary hover:text-toss-text transition-colors"
          >
            <ChevronLeft size={20} />
            목록
          </button>
          <div className="flex items-center gap-2">
            {quote.versions && quote.versions.length > 0 && (
              <button
                onClick={() => { setShowVersions(!showVersions); setViewingVersion(null); }}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium rounded-xl transition-colors ${showVersions ? "bg-toss-blue/10 text-toss-blue" : "text-toss-text-secondary hover:text-toss-text hover:bg-toss-divider"}`}
              >
                <History size={14} />
                <span className="hidden sm:inline">버전 ({quote.versions.length})</span>
                <span className="sm:hidden">{quote.versions.length}</span>
              </button>
            )}
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-toss-text-secondary hover:text-toss-text hover:bg-toss-divider rounded-xl transition-colors"
            >
              <Edit2 size={14} />
              <span className="hidden sm:inline">수정</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-toss-blue text-white text-[13px] font-semibold rounded-2xl hover:bg-toss-blue-dark active:scale-[0.97] transition-all"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">인쇄 / PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-toss-text-tertiary hover:text-toss-red rounded-xl transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        {/* 시공완료/정산 버튼 바 */}
        {quote.status === "계약" && onSettlement && (
          <div className="px-4 md:px-6 py-2 border-t border-toss-divider bg-toss-green-light/50 flex items-center justify-between">
            <span className="text-[13px] text-toss-text-secondary font-medium">시공이 완료되었나요?</span>
            <button
              onClick={() => onSettlement()}
              className="flex items-center gap-1.5 px-4 py-2 bg-toss-green text-white text-[13px] font-semibold rounded-xl hover:bg-toss-green/80 active:scale-[0.97] transition-all"
            >
              <CheckCircle size={14} />
              시공완료 · 정산하기
            </button>
          </div>
        )}
      </header>

      {/* Version History Panel */}
      {showVersions && quote.versions && quote.versions.length > 0 && (
        <div className="px-4 md:px-6 pt-4 print:hidden">
          <div className="bg-white rounded-2xl border border-toss-border p-4 max-w-[210mm] mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <History size={16} />
                수정 이력
              </h3>
              <button onClick={() => { setShowVersions(false); setViewingVersion(null); }} className="p-1 hover:bg-toss-bg rounded-lg transition-colors">
                <X size={16} className="text-toss-text-tertiary" />
              </button>
            </div>
            <div className="space-y-2">
              {[...quote.versions].reverse().map((ver) => (
                <button
                  key={ver.version}
                  onClick={() => setViewingVersion(viewingVersion?.version === ver.version ? null : ver)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${viewingVersion?.version === ver.version ? "border-toss-blue bg-toss-blue/5" : "border-toss-border hover:bg-toss-bg"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-toss-bg text-toss-text-secondary px-2 py-0.5 rounded-md">
                        v{ver.version}
                      </span>
                      <span className="text-xs text-toss-text-secondary">
                        {new Date(ver.savedAt).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <span className="text-sm font-bold tabular-nums">
                      {formatCurrency(ver.total)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-toss-text-tertiary">
                    <span>{ver.client.name}</span>
                    <span>항목 {ver.items.length}건</span>
                  </div>
                </button>
              ))}
              <div className="p-3 rounded-xl border border-toss-blue bg-toss-blue/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-toss-blue text-white px-2 py-0.5 rounded-md">
                      현재
                    </span>
                    <span className="text-xs text-toss-text-secondary">최신 버전</span>
                  </div>
                  <span className="text-sm font-bold tabular-nums">
                    {formatCurrency(quote.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Version Detail View */}
      {viewingVersion && (
        <div className="px-4 md:px-6 pt-4 print:hidden">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 max-w-[210mm] mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-md">
                  v{viewingVersion.version}
                </span>
                <span className="text-sm font-medium text-amber-800">
                  {new Date(viewingVersion.savedAt).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} 시점
                </span>
              </div>
              <button onClick={() => setViewingVersion(null)} className="text-xs text-amber-700 hover:text-amber-900 font-medium">
                닫기
              </button>
            </div>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-y border-amber-300 bg-amber-100/50">
                  <th className="py-1.5 px-1 text-center font-bold w-8">NO</th>
                  <th className="py-1.5 px-1 text-left font-bold">공정</th>
                  <th className="py-1.5 px-1 text-left font-bold">내용</th>
                  <th className="py-1.5 px-1 text-center font-bold">수량</th>
                  <th className="py-1.5 px-1 text-right font-bold">단가</th>
                  <th className="py-1.5 px-1 text-right font-bold">금액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-200">
                {viewingVersion.items.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="py-1.5 px-1 text-center text-amber-700">{idx + 1}</td>
                    <td className="py-1.5 px-1 font-medium">{item.category}</td>
                    <td className="py-1.5 px-1">{item.description}</td>
                    <td className="py-1.5 px-1 text-center tabular-nums">{item.quantity}</td>
                    <td className="py-1.5 px-1 text-right tabular-nums">{new Intl.NumberFormat("ko-KR").format(item.unitPrice)}</td>
                    <td className="py-1.5 px-1 text-right font-bold tabular-nums">{new Intl.NumberFormat("ko-KR").format(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-amber-300 bg-amber-100/50">
                  <td colSpan={5} className="py-1.5 px-1 text-right font-bold text-sm">합계</td>
                  <td className="py-1.5 px-1 text-right font-bold text-sm tabular-nums">{formatCurrency(viewingVersion.total)}</td>
                </tr>
              </tfoot>
            </table>
            {viewingVersion.notes && (
              <div className="mt-2 text-xs text-amber-700">
                <span className="font-medium">특이사항:</span> {viewingVersion.notes}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settlement Summary */}
      {quote.status === "시공완료" && quote.settlement && (
        <div className="px-4 md:px-6 pt-4 print:hidden">
          <div className="bg-white rounded-2xl p-4 md:p-5 max-w-[210mm] mx-auto border border-toss-green/30">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={18} className="text-toss-green" />
              <h3 className="text-[15px] font-bold text-toss-text">정산 완료</h3>
              <span className="text-[11px] font-bold bg-toss-green-light text-toss-green px-2 py-0.5 rounded-full">
                {new Date(quote.settlement.settledAt).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" })}
              </span>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <div className="bg-toss-bg rounded-xl p-3">
                <span className="text-[11px] text-toss-text-tertiary block mb-0.5">총 수금액</span>
                <span className="text-[14px] font-bold text-toss-text tabular-nums">{formatCurrency(quote.settlement.totalQuotedAmount)}</span>
              </div>
              <div className="bg-toss-bg rounded-xl p-3">
                <div className="flex items-center gap-1 mb-0.5">
                  <Package size={11} className="text-toss-text-tertiary" />
                  <span className="text-[11px] text-toss-text-tertiary">자재비</span>
                </div>
                <span className="text-[14px] font-bold text-toss-text tabular-nums">{formatCurrency(quote.settlement.totalMaterialCost)}</span>
              </div>
              <div className="bg-toss-bg rounded-xl p-3">
                <div className="flex items-center gap-1 mb-0.5">
                  <Users size={11} className="text-toss-text-tertiary" />
                  <span className="text-[11px] text-toss-text-tertiary">지급내역</span>
                </div>
                <span className="text-[14px] font-bold text-toss-text tabular-nums">{formatCurrency(quote.settlement.totalPayments)}</span>
              </div>
              <div className={`rounded-xl p-3 ${quote.settlement.finalMargin >= 0 ? "bg-toss-green-light" : "bg-toss-red-light"}`}>
                <span className="text-[11px] text-toss-text-tertiary block mb-0.5">최종 순수익</span>
                <span className={`text-[14px] font-bold tabular-nums ${quote.settlement.finalMargin >= 0 ? "text-toss-green" : "text-toss-red"}`}>
                  {formatCurrency(quote.settlement.finalMargin)}
                  <span className="text-[11px] ml-1">({quote.settlement.finalMarginPercent}%)</span>
                </span>
              </div>
            </div>

            {/* Detail Breakdown */}
            {quote.settlement.payments && quote.settlement.payments.length > 0 && (
              <div className="space-y-2 text-[12px]">
                <div className="flex items-start gap-2 text-toss-text-secondary">
                  <Users size={13} className="text-toss-text-tertiary mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-toss-text">지급내역: </span>
                    {quote.settlement.payments.map((p) => `${p.name} ${new Intl.NumberFormat("ko-KR").format(p.amount)}원`).join(", ")}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* A4 Document */}
      <div className="px-4 md:px-6 py-6 md:py-8 pb-28 md:pb-10 print:p-0 print:pb-0 print:m-0 print:max-w-none">
        <div className="overflow-x-auto print:overflow-visible">
          <div className="bg-white mx-auto print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:min-h-0 rounded-2xl md:rounded-none md:border md:border-toss-border"
            style={{ width: "210mm", minHeight: "297mm", padding: "15mm 18mm" }}>

            {/* Document Header */}
            <div className="text-center mb-4 border-b-2 border-toss-text pb-4">
              <h1 className="text-2xl font-bold tracking-widest mb-1">
                견 적 서
              </h1>
              <p className="text-toss-text-tertiary font-mono tracking-wider text-xs">ESTIMATE</p>
            </div>

            {/* Info Section */}
            <div className="flex flex-row justify-between mb-4 gap-4">
              <div className="flex-1">
                <div className="text-base font-bold mb-2 border-b border-toss-border pb-1">
                  <span className="text-lg">{quote.client.name}</span> 귀하
                </div>
                <table className="w-full text-xs">
                  <tbody>
                    <tr>
                      <td className="py-0.5 font-medium text-toss-text-secondary w-16">견적일자</td>
                      <td className="py-0.5">{formatDate(quote.date)}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 font-medium text-toss-text-secondary">현장주소</td>
                      <td className="py-0.5">{quote.client.address || "-"}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 font-medium text-toss-text-secondary">연락처</td>
                      <td className="py-0.5">{quote.client.contact || "-"}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 font-medium text-toss-text-secondary">공사예정일</td>
                      <td className="py-0.5">{quote.client.projectDate || "-"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex-1 bg-toss-bg p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-toss-text text-sm">공급자 정보</h3>
                  {!editingSupplier ? (
                    <button
                      onClick={() => setEditingSupplier(true)}
                      className="text-xs text-toss-text-tertiary hover:text-toss-text flex items-center gap-1 print:hidden"
                    >
                      <Edit2 size={11} />
                      수정
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveSupplier}
                      className="text-xs text-toss-blue hover:text-toss-blue-dark flex items-center gap-1 font-medium print:hidden"
                    >
                      <Check size={11} />
                      저장
                    </button>
                  )}
                </div>
                <table className="w-full text-xs">
                  <tbody>
                    <tr>
                      <td className="py-0.5 font-medium text-toss-text-secondary w-14">발급자</td>
                      <td className="py-0.5 font-bold">
                        {editingSupplier ? (
                          <input type="text" value={supplier.name} onChange={(e) => setSupplier({ ...supplier, name: e.target.value })} className="w-full px-2 py-0.5 border border-toss-border rounded text-xs print:hidden" />
                        ) : supplier.name}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-0.5 font-medium text-toss-text-secondary">대표자</td>
                      <td className="py-0.5">
                        {editingSupplier ? (
                          <input type="text" value={supplier.representative} onChange={(e) => setSupplier({ ...supplier, representative: e.target.value })} className="w-full px-2 py-0.5 border border-toss-border rounded text-xs print:hidden" />
                        ) : supplier.representative}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-0.5 font-medium text-toss-text-secondary">연락처</td>
                      <td className="py-0.5">
                        {editingSupplier ? (
                          <input type="text" value={supplier.contact} onChange={(e) => setSupplier({ ...supplier, contact: e.target.value })} className="w-full px-2 py-0.5 border border-toss-border rounded text-xs print:hidden" />
                        ) : supplier.contact}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-0.5 font-medium text-toss-text-secondary">주소</td>
                      <td className="py-0.5">
                        {editingSupplier ? (
                          <input type="text" value={supplier.address} onChange={(e) => setSupplier({ ...supplier, address: e.target.value })} className="w-full px-2 py-0.5 border border-toss-border rounded text-xs print:hidden" />
                        ) : supplier.address}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Amount Highlight */}
            <div className="bg-toss-text text-white p-3 mb-4 rounded-lg flex items-center justify-between">
              <div className="text-sm font-medium opacity-70">
                총 견적 금액 (VAT 별도)
              </div>
              <div className="text-xl font-bold tracking-tight tabular-nums">
                {formatCurrency(quote.total)}
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-xs mb-4 border-collapse">
              <thead>
                <tr className="border-y-2 border-toss-text bg-toss-bg">
                  <th className="py-1.5 px-1 text-center font-bold w-8">NO</th>
                  <th className="py-1.5 px-1 text-left font-bold w-[15%]">공정</th>
                  <th className="py-1.5 px-1 text-left font-bold w-[35%]">내용</th>
                  <th className="py-1.5 px-1 text-center font-bold w-[8%]">수량</th>
                  <th className="py-1.5 px-1 text-right font-bold w-[15%]">단가</th>
                  <th className="py-1.5 px-1 text-right font-bold w-[12%]">시공비</th>
                  <th className="py-1.5 px-1 text-right font-bold w-[15%]">금액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-toss-border">
                {quote.items.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <tr className={item.costItems.length > 0 ? "bg-white" : ""}>
                      <td className="py-1.5 px-1 text-center text-toss-text-secondary">{index + 1}</td>
                      <td className="py-1.5 px-1 font-medium text-toss-text">{item.category}</td>
                      <td className="py-1.5 px-1 font-bold text-toss-text">{item.description}</td>
                      <td className="py-1.5 px-1 text-center tabular-nums">{item.quantity}</td>
                      <td className="py-1.5 px-1 text-right tabular-nums">
                        {new Intl.NumberFormat("ko-KR").format(item.unitPrice)}
                      </td>
                      <td className="py-1.5 px-1 text-right tabular-nums">
                        {new Intl.NumberFormat("ko-KR").format(item.laborCost)}
                      </td>
                      <td className="py-1.5 px-1 text-right font-bold text-toss-text tabular-nums">
                        {new Intl.NumberFormat("ko-KR").format(item.amount)}
                      </td>
                    </tr>
                    {item.costItems.map((cItem) => {
                      const customerAmount = cItem.amount + (cItem.margin || 0);
                      const customerUnitPrice =
                        cItem.quantity > 0 ? customerAmount / cItem.quantity : 0;
                      return (
                        <tr key={cItem.id} className="bg-toss-bg/80 text-toss-text-secondary">
                          <td className="py-1 px-1"></td>
                          <td className="py-1 px-1"></td>
                          <td className="py-1 px-1 text-xs pl-2">
                            <span className="text-toss-text-tertiary mr-2">└</span>
                            {cItem.description}
                          </td>
                          <td className="py-1 px-1 text-center text-xs tabular-nums">{cItem.quantity}</td>
                          <td className="py-1 px-1 text-right text-xs tabular-nums">
                            {new Intl.NumberFormat("ko-KR").format(customerUnitPrice)}
                          </td>
                          <td className="py-1 px-1 text-right text-xs text-toss-text-tertiary">-</td>
                          <td className="py-1 px-1 text-right text-xs tabular-nums">
                            {new Intl.NumberFormat("ko-KR").format(customerAmount)}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-toss-text">
                  <td colSpan={6} className="py-1.5 px-1 text-right font-medium text-toss-text-secondary text-xs">
                    공급가액
                  </td>
                  <td className="py-1.5 px-1 text-right font-medium text-xs tabular-nums">
                    {formatCurrency(quote.subtotal)}
                  </td>
                </tr>
                <tr className="border-t-2 border-toss-text bg-toss-bg">
                  <td colSpan={6} className="py-2 px-1 text-right font-bold text-sm">
                    합계 금액 (VAT 별도)
                  </td>
                  <td className="py-2 px-1 text-right font-bold text-sm tabular-nums">
                    {formatCurrency(quote.total)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Notes */}
            {quote.notes && (
              <div className="border border-toss-border p-3 rounded-lg bg-toss-bg/50">
                <h4 className="font-bold mb-1 flex items-center gap-2 text-sm">
                  <FileText size={14} />
                  특이사항
                </h4>
                <div className="text-xs text-toss-text-secondary whitespace-pre-wrap leading-normal">
                  {quote.notes}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 text-center text-xs text-toss-text-tertiary">
              <p>위와 같이 견적서를 제출합니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
