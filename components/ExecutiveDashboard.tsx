"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, CheckCircle2, FileText, TrendingUp } from "lucide-react";
import { buildVendorPaymentHistoryMap } from "@/lib/vendor-payment-history";
import { formatCurrency } from "@/lib/utils";
import { loadVendors } from "@/lib/vendors";
import type { Quote, Vendor } from "@/lib/types";

interface ExecutiveDashboardProps {
  quotes: Quote[];
  onNavigate: (
    view: "quotes" | "settlements" | "vendors-purchase" | "vendors-partner",
  ) => void;
}

function buildSummaryMessage(params: {
  quoteProjects: number;
  contractProjects: number;
  settledProjects: number;
  pendingSettlementAmount: number;
  settledRevenue: number;
  settledMargin: number;
  realizedMarginPercent: number;
  vendorDocMissingCount: number;
}) {
  const {
    quoteProjects,
    contractProjects,
    settledProjects,
    pendingSettlementAmount,
    settledRevenue,
    settledMargin,
    realizedMarginPercent,
    vendorDocMissingCount,
  } = params;

  if (quoteProjects === 0 && contractProjects === 0 && settledProjects === 0) {
    return "아직 쌓인 데이터가 많지 않아요. 견적이 몇 건만 더 쌓이면 흐름이 훨씬 선명하게 보일 거예요.";
  }

  const parts = [
    `지금은 계약이 ${contractProjects}건, 정산 완료가 ${settledProjects}건이에요.`,
    `정산 완료 매출은 ${formatCurrency(settledRevenue)}이고 순수익은 ${formatCurrency(settledMargin)}예요.`,
  ];

  if (pendingSettlementAmount > 0) {
    parts.push(
      `아직 ${formatCurrency(pendingSettlementAmount)}가 정산 대기라, 이 구간만 마무리되면 실현 수익이 더 또렷해질 흐름이에요.`,
    );
  } else if (settledRevenue > 0) {
    parts.push(
      `지금까지 확정된 마진율은 ${realizedMarginPercent}%라서 수익 흐름은 꽤 잘 보이고 있어요.`,
    );
  }

  if (vendorDocMissingCount > 0) {
    parts.push(
      `거래처 ${vendorDocMissingCount}곳은 서류가 비어 있어서 지급 전에 한 번만 더 챙기면 좋아요.`,
    );
  }

  return parts.join(" ");
}

export function ExecutiveDashboard({
  quotes,
  onNavigate,
}: ExecutiveDashboardProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    setVendors(loadVendors());
  }, []);

  const quoteProjects = quotes.filter((quote) => quote.status === "견적");
  const contractProjects = quotes.filter((quote) => quote.status === "계약");
  const settledProjects = quotes.filter(
    (quote) => quote.status === "시공완료" && quote.settlement,
  );

  const quoteTotal = quoteProjects.reduce((sum, quote) => sum + quote.total, 0);
  const contractTotal = quotes
    .filter((quote) => quote.status === "계약" || quote.status === "시공완료")
    .reduce((sum, quote) => sum + quote.total, 0);
  const settledRevenue = settledProjects.reduce(
    (sum, quote) => sum + (quote.settlement?.totalQuotedAmount || 0),
    0,
  );
  const settledMargin = settledProjects.reduce(
    (sum, quote) => sum + (quote.settlement?.finalMargin || 0),
    0,
  );
  const totalMaterialCost = settledProjects.reduce(
    (sum, quote) => sum + (quote.settlement?.totalMaterialCost || 0),
    0,
  );
  const totalPayments = settledProjects.reduce(
    (sum, quote) => sum + (quote.settlement?.totalPayments || 0),
    0,
  );
  const pendingSettlementAmount = contractProjects.reduce(
    (sum, quote) => sum + quote.total,
    0,
  );

  const paymentHistoryMap = useMemo(
    () => buildVendorPaymentHistoryMap(quotes, vendors),
    [quotes, vendors],
  );

  const totalVendorPayments = Array.from(paymentHistoryMap.values()).reduce(
    (sum, summary) => sum + summary.totalAmount,
    0,
  );
  const vendorDocMissingCount = vendors.filter(
    (vendor) =>
      !vendor.documents.businessRegistration || !vendor.documents.bankbookCopy,
  ).length;
  const realizedMarginPercent =
    settledRevenue > 0 ? Math.round((settledMargin / settledRevenue) * 100) : 0;
  const averageQuoteAmount =
    quotes.length > 0 ? Math.round(quotes.reduce((sum, quote) => sum + quote.total, 0) / quotes.length) : 0;
  const topVendors = useMemo(
    () =>
      vendors
        .map((vendor) => ({
          vendor,
          summary: paymentHistoryMap.get(vendor.id),
        }))
        .filter((item) => item.summary && item.summary.totalAmount > 0)
        .sort((a, b) => (b.summary?.totalAmount || 0) - (a.summary?.totalAmount || 0))
        .slice(0, 5),
    [paymentHistoryMap, vendors],
  );

  const summaryMessage = buildSummaryMessage({
    quoteProjects: quoteProjects.length,
    contractProjects: contractProjects.length,
    settledProjects: settledProjects.length,
    pendingSettlementAmount,
    settledRevenue,
    settledMargin,
    realizedMarginPercent,
    vendorDocMissingCount,
  });

  return (
    <div className="min-h-screen bg-toss-bg">
      <header className="sticky top-0 z-20 bg-white">
        <div className="px-4 md:px-6">
          <div className="flex items-center justify-between h-12 md:h-14">
            <div>
              <h2 className="text-[18px] md:text-[20px] font-bold text-toss-text tracking-tight">
                경영 대시보드
              </h2>
              <p className="hidden md:block text-[12px] text-toss-text-tertiary">
                숫자로만 현재 사업 흐름을 확인합니다
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-6 py-3 md:py-4 pb-24 md:pb-8 space-y-3">
        <section className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div className="bg-white rounded-2xl p-3 md:p-4">
            <span className="text-[11px] font-semibold text-toss-text-tertiary block mb-0.5">
              진행 견적
            </span>
            <span className="text-[18px] md:text-[20px] font-bold text-toss-text tabular-nums">
              {formatCurrency(quoteTotal)}
            </span>
            <div className="text-[11px] text-toss-text-tertiary mt-1">
              {quoteProjects.length}건
            </div>
          </div>
          <div className="bg-white rounded-2xl p-3 md:p-4">
            <span className="text-[11px] font-semibold text-toss-text-tertiary block mb-0.5">
              계약 파이프라인
            </span>
            <span className="text-[18px] md:text-[20px] font-bold text-toss-blue tabular-nums">
              {formatCurrency(contractTotal)}
            </span>
            <div className="text-[11px] text-toss-text-tertiary mt-1">
              {contractProjects.length}건
            </div>
          </div>
          <div className="bg-white rounded-2xl p-3 md:p-4">
            <span className="text-[11px] font-semibold text-toss-text-tertiary block mb-0.5">
              정산 완료 매출
            </span>
            <span className="text-[18px] md:text-[20px] font-bold text-toss-text tabular-nums">
              {formatCurrency(settledRevenue)}
            </span>
            <div className="text-[11px] text-toss-text-tertiary mt-1">
              {settledProjects.length}건
            </div>
          </div>
          <div className="bg-white rounded-2xl p-3 md:p-4">
            <span className="text-[11px] font-semibold text-toss-text-tertiary block mb-0.5">
              실현 순수익
            </span>
            <span
              className={`text-[18px] md:text-[20px] font-bold tabular-nums ${
                settledMargin >= 0 ? "text-toss-green" : "text-toss-red"
              }`}
            >
              {formatCurrency(settledMargin)}
            </span>
            <div className="text-[11px] text-toss-text-tertiary mt-1">
              마진율 {realizedMarginPercent}%
            </div>
          </div>
          <div className="bg-white rounded-2xl p-3 md:p-4">
            <span className="text-[11px] font-semibold text-toss-text-tertiary block mb-0.5">
              거래처 지급 누계
            </span>
            <span className="text-[18px] md:text-[20px] font-bold text-toss-text tabular-nums">
              {formatCurrency(totalVendorPayments)}
            </span>
            <div className="text-[11px] text-toss-text-tertiary mt-1">
              거래처 {vendors.length}곳
            </div>
          </div>
        </section>

        <section className="bg-toss-text rounded-2xl p-4 md:p-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-white/80" />
            <h3 className="text-[15px] font-bold">AI 현황 요약</h3>
          </div>
          <p className="text-[13px] leading-6 text-white/90">{summaryMessage}</p>
        </section>

        <section className="grid md:grid-cols-4 gap-2">
          {[
            {
              title: "정산 대기 금액",
              value: formatCurrency(pendingSettlementAmount),
              sub: `${contractProjects.length}건`,
            },
            {
              title: "실제 자재비 누계",
              value: formatCurrency(totalMaterialCost),
              sub: `${settledProjects.length}건 기준`,
            },
            {
              title: "실제 지급 누계",
              value: formatCurrency(totalPayments),
              sub: `${settledProjects.length}건 기준`,
            },
            {
              title: "평균 견적 금액",
              value: formatCurrency(averageQuoteAmount),
              sub: `${quotes.length}건 평균`,
            },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-2xl p-4">
              <div className="text-[11px] font-semibold text-toss-text-tertiary">
                {item.title}
              </div>
              <div className="text-[18px] font-bold text-toss-text tabular-nums mt-1">
                {item.value}
              </div>
              <div className="text-[11px] text-toss-text-tertiary mt-1">{item.sub}</div>
            </div>
          ))}
        </section>

        <section className="grid md:grid-cols-[1.15fr_0.85fr] gap-3">
          <div className="bg-white rounded-2xl p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-[15px] font-bold text-toss-text">흐름 수치</h3>
                <p className="text-[12px] text-toss-text-tertiary mt-0.5">
                  단계별 건수와 금액만 모아서 봅니다
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-4 gap-2">
              {[
                {
                  title: "견적",
                  count: quoteProjects.length,
                  amount: quoteTotal,
                  icon: FileText,
                  action: () => onNavigate("quotes"),
                },
                {
                  title: "계약",
                  count: contractProjects.length,
                  amount: pendingSettlementAmount,
                  icon: Building2,
                  action: () => onNavigate("settlements"),
                },
                {
                  title: "정산완료",
                  count: settledProjects.length,
                  amount: settledRevenue,
                  icon: CheckCircle2,
                  action: () => onNavigate("settlements"),
                },
                {
                  title: "거래처",
                  count: vendors.length,
                  amount: totalVendorPayments,
                  icon: Building2,
                  action: () => onNavigate("vendors-purchase"),
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={item.action}
                    className="rounded-2xl border border-toss-border bg-toss-bg/50 p-4 text-left hover:border-toss-blue/30 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center mb-3">
                      <Icon size={18} className="text-toss-text" />
                    </div>
                    <div className="text-[13px] font-bold text-toss-text">{item.title}</div>
                    <div className="text-[18px] font-bold text-toss-text tabular-nums mt-1">
                      {item.count}건
                    </div>
                    <div className="text-[12px] text-toss-text-tertiary tabular-nums mt-1">
                      {formatCurrency(item.amount)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-[15px] font-bold text-toss-text">거래처 지급 상위</h3>
                <p className="text-[12px] text-toss-text-tertiary mt-0.5">
                  지급 금액 상위 거래처 순위
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("vendors-purchase")}
                className="text-[12px] font-semibold text-toss-blue inline-flex items-center gap-1"
              >
                거래처관리 <ArrowRight size={13} />
              </button>
            </div>
            {topVendors.length === 0 ? (
              <div className="py-16 text-center bg-toss-bg rounded-2xl">
                <p className="text-[14px] text-toss-text-tertiary">
                  거래처와 연결된 지급 이력이 없습니다
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {topVendors.map(({ vendor, summary }, index) => (
                  <button
                    key={vendor.id}
                    type="button"
                    onClick={() => onNavigate("vendors-purchase")}
                    className="w-full rounded-2xl border border-toss-border p-3 text-left hover:border-toss-blue/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-bold text-toss-blue">
                            #{index + 1}
                          </span>
                          <span className="text-[13px] font-bold text-toss-text truncate">
                            {vendor.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-toss-text-tertiary mt-1">
                          {summary?.projectCount || 0}개 현장 · {summary?.transactionCount || 0}건 거래
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[13px] font-bold text-toss-text tabular-nums">
                          {formatCurrency(summary?.totalAmount || 0)}
                        </div>
                        <div className="text-[11px] text-toss-text-tertiary mt-1">
                          비중{" "}
                          {totalVendorPayments > 0
                            ? Math.round(((summary?.totalAmount || 0) / totalVendorPayments) * 100)
                            : 0}
                          %
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
