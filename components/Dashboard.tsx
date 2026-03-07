"use client";

import { useState } from "react";
import {
  Plus,
  FileText,
  Search,
  Trash2,
  Calendar,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Quote, QuoteStatus } from "@/lib/types";

interface DashboardProps {
  quotes: Quote[];
  loading?: boolean;
  onCreateNew: () => void;
  onView: (q: Quote) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: QuoteStatus) => void;
}

export function Dashboard({
  quotes,
  loading,
  onCreateNew,
  onView,
  onDelete,
  onUpdateStatus,
}: DashboardProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i,
  );
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const filteredQuotes = quotes.filter((q) => {
    const d = new Date(q.date);
    return (
      d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth
    );
  });

  const totalQuoteAmount = filteredQuotes.reduce((sum, q) => sum + q.total, 0);
  const quoteCount = filteredQuotes.length;

  const contractedQuotes = filteredQuotes.filter(
    (q) => q.status === "계약" || q.status === "시공완료",
  );
  const contractCount = contractedQuotes.length;
  const contractedMargin = contractedQuotes.reduce(
    (sum, q) => sum + (q.totalMargin || 0),
    0,
  );
  const contractedTotal = contractedQuotes.reduce(
    (sum, q) => sum + q.subtotal,
    0,
  );
  const marginPercent =
    contractedTotal > 0
      ? Math.round((contractedMargin / contractedTotal) * 100)
      : 0;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">견적서 관리</h2>
          <p className="text-neutral-500 mt-1">
            월별 견적 및 수익 현황을 확인하세요.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-neutral-200 shadow-sm">
            <Calendar size={18} className="text-neutral-400 ml-2" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer pr-2"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
            <div className="w-px h-4 bg-neutral-200"></div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer pr-2"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}월
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={onCreateNew}
            className="bg-neutral-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-neutral-800 transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"
          >
            <Plus size={18} />새 견적서 작성
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm col-span-2 lg:col-span-1">
          <div className="text-neutral-500 text-xs font-medium mb-1">
            총 견적 금액
          </div>
          <div className="text-2xl font-bold tracking-tight">
            {formatCurrency(totalQuoteAmount)}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="text-neutral-500 text-xs font-medium mb-1">
            견적 발송 건수
          </div>
          <div className="text-2xl font-bold tracking-tight">
            {quoteCount}건
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="text-neutral-500 text-xs font-medium mb-1">
            계약 건수
          </div>
          <div className="text-2xl font-bold tracking-tight text-blue-600">
            {contractCount}건
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="text-neutral-500 text-xs font-medium mb-1">
            순수익 (계약기준)
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-600">
            {formatCurrency(contractedMargin)}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="text-neutral-500 text-xs font-medium mb-1">
            순수익률
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-600">
            {marginPercent}%
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
          <h3 className="font-semibold text-lg">견적서 목록</h3>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              size={16}
            />
            <input
              type="text"
              placeholder="고객명 또는 현장 검색..."
              className="pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all w-64"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-neutral-500">
            <p className="text-lg font-medium">불러오는 중...</p>
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 flex flex-col items-center">
            <FileText size={48} className="text-neutral-300 mb-4" />
            <p className="text-lg font-medium text-neutral-900 mb-1">
              해당 월에 작성된 견적서가 없습니다
            </p>
            <p className="mb-6">
              새로운 견적서를 작성하여 비즈니스를 시작해보세요.
            </p>
            <button
              onClick={onCreateNew}
              className="bg-neutral-100 text-neutral-900 px-5 py-2.5 rounded-xl font-medium hover:bg-neutral-200 transition-colors"
            >
              견적서 작성하기
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 text-sm text-neutral-500">
                  <th className="p-4 font-medium">작성일</th>
                  <th className="p-4 font-medium">고객명</th>
                  <th className="p-4 font-medium">현장 주소</th>
                  <th className="p-4 font-medium text-right">총 금액</th>
                  <th className="p-4 font-medium text-center">상태</th>
                  <th className="p-4 font-medium text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredQuotes.map((quote) => (
                  <tr
                    key={quote.id}
                    className="hover:bg-neutral-50 transition-colors group cursor-pointer"
                    onClick={() => onView(quote)}
                  >
                    <td className="p-4 text-sm text-neutral-600">
                      {quote.date}
                    </td>
                    <td className="p-4 font-medium">{quote.client.name}</td>
                    <td className="p-4 text-sm text-neutral-600 truncate max-w-[200px]">
                      {quote.client.address}
                    </td>
                    <td className="p-4 text-right font-medium">
                      {formatCurrency(quote.total)}
                    </td>
                    <td
                      className="p-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={quote.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as QuoteStatus;
                          if (newStatus === "시공완료") {
                            if (
                              window.confirm(
                                "시공이 완료되었습니까?\n확인을 누르시면 시공 완료 상태로 변경됩니다.",
                              )
                            ) {
                              onUpdateStatus(quote.id, newStatus);
                            }
                          } else {
                            onUpdateStatus(quote.id, newStatus);
                          }
                        }}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border focus:outline-none cursor-pointer transition-colors ${
                          quote.status === "시공완료"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : quote.status === "계약"
                              ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                              : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                        }`}
                      >
                        <option value="견적">견적 대기</option>
                        <option value="계약">계약 완료</option>
                        <option value="시공완료">시공 완료</option>
                      </select>
                    </td>
                    <td className="p-4 text-center">
                      <div
                        className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onView(quote)}
                          className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 rounded-md transition-colors"
                          title="보기"
                        >
                          <FileText size={16} />
                        </button>
                        <button
                          onClick={() => onDelete(quote.id)}
                          className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
