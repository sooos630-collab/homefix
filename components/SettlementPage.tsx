"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  CheckCircle,
  Package,
  Users,
} from "lucide-react";
import { generateId, formatCurrency } from "@/lib/utils";
import { loadVendors } from "@/lib/vendors";
import type {
  Quote,
  Settlement,
  SettlementCostEntry,
  PaymentEntry,
  Vendor,
} from "@/lib/types";

interface SettlementPageProps {
  quote: Quote;
  onConfirm: (settlement: Settlement) => void;
  onCancel: () => void;
}

interface ItemGroup {
  itemId: string;
  category: string;
  description: string;
  quotedTotal: number;
  costEntries: SettlementCostEntry[];
  payments: PaymentEntry[];
}

export function SettlementPage({ quote, onConfirm, onCancel }: SettlementPageProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    setVendors(loadVendors());
  }, []);

  const buildInitialGroups = (): ItemGroup[] => {
    return quote.items.map((item) => {
      const costEntries: SettlementCostEntry[] =
        item.costItems.length > 0
          ? item.costItems.map((cItem) => ({
              id: generateId(),
              parentItemId: item.id,
              costItemId: cItem.id,
              vendorId: "",
              category: item.category,
              description: cItem.description,
              quotedAmount: cItem.amount + (Number(cItem.margin) || 0) + (Number(cItem.laborCost) || 0),
              materialCost: 0,
            }))
          : [
              {
                id: generateId(),
                parentItemId: item.id,
                costItemId: "",
                vendorId: "",
                category: item.category,
                description: item.description,
                quotedAmount: item.amount,
                materialCost: 0,
              },
            ];

      return {
        itemId: item.id,
        category: item.category,
        description: item.description,
        quotedTotal: item.amount,
        costEntries,
        payments: [],
      };
    });
  };

  const [groups, setGroups] = useState<ItemGroup[]>(buildInitialGroups);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    () => new Set(quote.items.map((i) => i.id)),
  );

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleCostChange = (itemId: string, entryId: string, value: number) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.itemId === itemId
          ? {
              ...g,
              costEntries: g.costEntries.map((e) =>
                e.id === entryId ? { ...e, materialCost: value } : e,
              ),
            }
          : g,
      ),
    );
  };

  const handleCostVendorSelect = (
    itemId: string,
    entryId: string,
    vendorId: string,
  ) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.itemId === itemId
          ? {
              ...group,
              costEntries: group.costEntries.map((entry) =>
                entry.id === entryId ? { ...entry, vendorId } : entry,
              ),
            }
          : group,
      ),
    );
  };

  const addPayment = (itemId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.itemId === itemId
          ? {
              ...g,
              payments: [
                ...g.payments,
                {
                  id: generateId(),
                  parentItemId: itemId,
                  vendorId: "",
                  name: "",
                  amount: 0,
                },
              ],
            }
          : g,
      ),
    );
  };

  const removePayment = (itemId: string, paymentId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.itemId === itemId
          ? { ...g, payments: g.payments.filter((p) => p.id !== paymentId) }
          : g,
      ),
    );
  };

  const updatePayment = (
    itemId: string,
    paymentId: string,
    field: "name" | "amount" | "vendorId",
    value: string | number,
  ) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.itemId === itemId
          ? {
              ...g,
              payments: g.payments.map((p) =>
                p.id === paymentId ? { ...p, [field]: value } : p,
              ),
            }
          : g,
      ),
    );
  };

  const vendorOptions = useMemo(
    () =>
      vendors.map((vendor) => ({
        id: vendor.id,
        name: vendor.name,
        label: `${vendor.name} · ${
          vendor.vendorType === "partner" ? "시공/인건비" : "매입/구매"
        }`,
      })),
    [vendors],
  );
  const purchaseVendorOptions = useMemo(
    () => vendorOptions.filter((vendor) => vendors.find((item) => item.id === vendor.id)?.vendorType === "purchase"),
    [vendorOptions, vendors],
  );
  const partnerVendorOptions = useMemo(
    () => vendorOptions.filter((vendor) => vendors.find((item) => item.id === vendor.id)?.vendorType === "partner"),
    [vendorOptions, vendors],
  );

  const handleVendorSelect = (
    itemId: string,
    paymentId: string,
    vendorId: string,
  ) => {
    const selectedVendor = vendors.find((vendor) => vendor.id === vendorId);

    setGroups((prev) =>
      prev.map((group) =>
        group.itemId === itemId
          ? {
              ...group,
              payments: group.payments.map((payment) =>
                payment.id === paymentId
                  ? {
                      ...payment,
                      vendorId,
                      name: selectedVendor?.name || payment.name,
                    }
                  : payment,
              ),
            }
          : group,
      ),
    );
  };

  // Totals
  const allCostEntries = groups.flatMap((g) => g.costEntries);
  const allPayments = groups.flatMap((g) => g.payments);
  const totalQuotedAmount = quote.total;
  const totalMaterialCost = allCostEntries.reduce((sum, e) => sum + (Number(e.materialCost) || 0), 0);
  const totalPayments = allPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const finalMargin = totalQuotedAmount - totalMaterialCost - totalPayments;
  const finalMarginPercent = totalQuotedAmount > 0 ? Math.round((finalMargin / totalQuotedAmount) * 100) : 0;

  const isMaterialValid = allCostEntries.every((e) => Number(e.materialCost) > 0);
  const isAllValid = isMaterialValid;

  const handleConfirm = () => {
    if (!isAllValid) {
      alert("모든 항목의 실구매비용을 입력해주세요.");
      return;
    }
    const settlement: Settlement = {
      costEntries: allCostEntries,
      payments: allPayments.filter((p) => p.name.trim() && p.amount > 0),
      totalQuotedAmount,
      totalMaterialCost,
      totalPayments,
      finalMargin,
      finalMarginPercent,
      settledAt: new Date().toISOString(),
    };
    onConfirm(settlement);
  };

  const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

  return (
    <div className="min-h-screen bg-toss-bg">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 bg-white">
        <div className="px-4 md:px-6 h-12 md:h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="p-1.5 -ml-1.5 hover:bg-toss-divider rounded-full transition-colors"
            >
              <ChevronLeft size={22} className="text-toss-text" />
            </button>
            <div>
              <h2 className="text-[17px] md:text-[19px] font-bold text-toss-text tracking-tight">최종 정산</h2>
              <p className="text-[12px] text-toss-text-tertiary -mt-0.5">{quote.client.name} · {quote.client.address}</p>
            </div>
          </div>
          <button
            onClick={handleConfirm}
            disabled={!isAllValid}
            className={`hidden md:flex items-center gap-1.5 px-5 py-2.5 text-[14px] font-semibold rounded-2xl transition-all active:scale-[0.97] ${
              isAllValid
                ? "bg-toss-green text-white hover:bg-toss-green/80"
                : "bg-toss-divider text-toss-text-tertiary cursor-not-allowed"
            }`}
          >
            <CheckCircle size={16} />
            정산 확정
          </button>
        </div>
      </header>

      <div className="px-4 md:px-6 py-3 md:py-4 space-y-3 pb-28">
        {/* Item Groups */}
        {groups.map((group, groupIdx) => {
          const isExpanded = expandedItems.has(group.itemId);
          const groupMaterial = group.costEntries.reduce((s, e) => s + (Number(e.materialCost) || 0), 0);
          const groupPayments = group.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
          const groupQuoted = group.costEntries.reduce((s, e) => s + e.quotedAmount, 0);
          const groupDiff = groupQuoted - groupMaterial;
          const groupCostValid = group.costEntries.every((e) => Number(e.materialCost) > 0);

          return (
            <section key={group.itemId} className="bg-white rounded-2xl overflow-hidden">
              {/* Card Header - clickable */}
              <button
                onClick={() => toggleExpand(group.itemId)}
                className="w-full px-4 md:px-5 py-3 md:py-4 flex items-center gap-3 hover:bg-toss-bg/30 transition-colors"
              >
                <span className="text-[12px] font-bold text-toss-text-tertiary bg-toss-bg w-6 h-6 rounded-lg flex items-center justify-center shrink-0">
                  {groupIdx + 1}
                </span>
                <span className="text-[11px] font-bold text-toss-blue bg-toss-blue/10 px-2 py-0.5 rounded-md shrink-0">
                  {group.category}
                </span>
                <span className="text-[14px] font-semibold text-toss-text truncate text-left flex-1">
                  {group.description}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {groupCostValid ? (
                    <span className="text-[10px] font-bold bg-toss-green-light text-toss-green px-1.5 py-0.5 rounded-full hidden md:inline">완료</span>
                  ) : (
                    <span className="text-[10px] font-bold bg-toss-red-light text-toss-red px-1.5 py-0.5 rounded-full hidden md:inline">미입력</span>
                  )}
                  <span className="text-[13px] font-bold text-toss-text tabular-nums">{formatCurrency(group.quotedTotal)}</span>
                  {isExpanded ? <ChevronUp size={16} className="text-toss-text-tertiary" /> : <ChevronDown size={16} className="text-toss-text-tertiary" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 md:px-5 pb-4 md:pb-5 space-y-3">
                  {/* Cost Entries */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Package size={13} className="text-toss-text-tertiary" />
                      <span className="text-[12px] font-bold text-toss-text-secondary">실제원가</span>
                    </div>

                    {/* Desktop table */}
                    <div className="hidden md:block">
                      <div className="flex items-center gap-3 text-[11px] text-toss-text-tertiary font-medium px-1 pb-1.5">
                        <span className="flex-1">세부항목</span>
                        <span className="w-36">매입 거래처</span>
                        <span className="w-24 text-right">견적금액</span>
                        <span className="w-32 text-right">실구매비용</span>
                        <span className="w-20 text-right">차액</span>
                      </div>
                      {group.costEntries.map((entry) => {
                        const diff = entry.quotedAmount - (Number(entry.materialCost) || 0);
                        return (
                          <div key={entry.id} className="flex items-center gap-3 py-1">
                            <span className="flex-1 text-[13px] text-toss-text truncate">{entry.description}</span>
                            <select
                              value={entry.vendorId}
                              onChange={(e) =>
                                handleCostVendorSelect(group.itemId, entry.id, e.target.value)
                              }
                              className="w-36 px-3 py-1.5 bg-white border border-toss-border rounded-lg text-[12px] text-toss-text focus:outline-none focus:border-toss-blue transition-colors"
                            >
                              <option value="">거래처 연결</option>
                              {purchaseVendorOptions.map((vendor) => (
                                <option key={vendor.id} value={vendor.id}>
                                  {vendor.name}
                                </option>
                              ))}
                            </select>
                            <span className="w-24 text-right text-[12px] text-toss-text-tertiary tabular-nums">
                              {fmt(entry.quotedAmount)}
                            </span>
                            <div className="w-32">
                              <input
                                type="number"
                                min="0"
                                value={entry.materialCost || ""}
                                onChange={(e) => handleCostChange(group.itemId, entry.id, Number(e.target.value))}
                                placeholder="실비용"
                                className="w-full px-3 py-1.5 bg-toss-input rounded-lg text-[13px] text-right text-toss-text tabular-nums placeholder:text-toss-text-tertiary focus:outline-none focus:bg-toss-divider transition-colors"
                              />
                            </div>
                            <span
                              className={`w-20 text-right text-[12px] font-semibold tabular-nums ${
                                Number(entry.materialCost) > 0
                                  ? diff >= 0
                                    ? "text-toss-green"
                                    : "text-toss-red"
                                  : "text-toss-text-tertiary"
                              }`}
                            >
                              {Number(entry.materialCost) > 0 ? (diff >= 0 ? "+" : "") + fmt(diff) : "-"}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Mobile */}
                    <div className="md:hidden space-y-1.5">
                      {group.costEntries.map((entry) => (
                        <div key={entry.id} className="bg-toss-bg/50 rounded-xl p-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-medium text-toss-text">{entry.description}</span>
                            <span className="text-[11px] text-toss-text-tertiary tabular-nums">견적 {fmt(entry.quotedAmount)}</span>
                          </div>
                          <select
                            value={entry.vendorId}
                            onChange={(e) =>
                              handleCostVendorSelect(group.itemId, entry.id, e.target.value)
                            }
                            className="w-full px-3 py-2 bg-white border border-toss-border rounded-xl text-[12px] text-toss-text focus:outline-none focus:border-toss-blue transition-colors"
                          >
                            <option value="">매입 거래처 연결</option>
                            {purchaseVendorOptions.map((vendor) => (
                              <option key={vendor.id} value={vendor.id}>
                                {vendor.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min="0"
                            value={entry.materialCost || ""}
                            onChange={(e) => handleCostChange(group.itemId, entry.id, Number(e.target.value))}
                            placeholder="실구매 비용 입력"
                            className="w-full px-3 py-2 bg-toss-input rounded-xl text-[13px] text-right tabular-nums placeholder:text-toss-text-tertiary focus:outline-none focus:bg-toss-divider transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payments for this item */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Users size={13} className="text-toss-text-tertiary" />
                        <span className="text-[12px] font-bold text-toss-text-secondary">지급내역</span>
                        {group.payments.length > 0 && (
                          <span className="text-[11px] text-toss-text-tertiary tabular-nums">
                            ({fmt(groupPayments)}원)
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => addPayment(group.itemId)}
                        className="text-[12px] font-medium text-toss-blue hover:text-toss-blue-dark px-2 py-1 rounded-lg flex items-center gap-0.5 transition-colors"
                      >
                        <Plus size={13} /> 추가
                      </button>
                    </div>

                    {group.payments.length === 0 ? (
                      <button
                        onClick={() => addPayment(group.itemId)}
                        className="w-full py-3 border-2 border-dashed border-toss-border/50 rounded-xl text-[12px] text-toss-text-tertiary hover:border-toss-blue/30 hover:text-toss-blue transition-colors"
                      >
                        + 지급 대상 추가 (인건비/협력사)
                      </button>
                    ) : (
                      <div className="space-y-1.5">
                        {group.payments.map((payment, pIdx) => (
                          <div key={payment.id} className="flex items-center gap-2">
                            <span className="text-[11px] text-toss-text-tertiary w-4 text-center shrink-0 tabular-nums">
                              {pIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={payment.name}
                              onChange={(e) =>
                                setGroups((prev) =>
                                  prev.map((currentGroup) =>
                                    currentGroup.itemId === group.itemId
                                      ? {
                                          ...currentGroup,
                                          payments: currentGroup.payments.map((currentPayment) =>
                                            currentPayment.id === payment.id
                                              ? {
                                                  ...currentPayment,
                                                  vendorId: "",
                                                  name: e.target.value,
                                                }
                                              : currentPayment,
                                          ),
                                        }
                                      : currentGroup,
                                  ),
                                )
                              }
                              placeholder="지급 대상 (이름/업체명)"
                              className="flex-1 px-3 py-1.5 bg-toss-input rounded-lg text-[13px] placeholder:text-toss-text-tertiary focus:outline-none focus:bg-toss-divider transition-colors"
                            />
                            <select
                              value={payment.vendorId}
                              onChange={(e) =>
                                handleVendorSelect(group.itemId, payment.id, e.target.value)
                              }
                              className="w-36 md:w-44 px-3 py-1.5 bg-white border border-toss-border rounded-lg text-[12px] text-toss-text focus:outline-none focus:border-toss-blue transition-colors"
                            >
                              <option value="">거래처 연결</option>
                              {partnerVendorOptions.map((vendor) => (
                                <option key={vendor.id} value={vendor.id}>
                                  {vendor.label}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min="0"
                              value={payment.amount || ""}
                              onChange={(e) => updatePayment(group.itemId, payment.id, "amount", Number(e.target.value))}
                              placeholder="금액"
                              className="w-24 md:w-32 px-3 py-1.5 bg-toss-input rounded-lg text-[13px] text-right tabular-nums placeholder:text-toss-text-tertiary focus:outline-none focus:bg-toss-divider transition-colors"
                            />
                            <button
                              onClick={() => removePayment(group.itemId, payment.id)}
                              className="p-1 text-toss-text-tertiary hover:text-toss-red rounded-lg transition-colors shrink-0"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Item Subtotal */}
                  <div className="bg-toss-bg rounded-xl px-3 py-2.5 flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-toss-text-secondary">소계</span>
                    <div className="flex items-center gap-4 tabular-nums">
                      <span className="text-toss-text-tertiary">
                        실비 <span className="font-bold text-toss-text">{fmt(groupMaterial)}</span>
                      </span>
                      {groupPayments > 0 && (
                        <span className="text-toss-text-tertiary">
                          지급 <span className="font-bold text-toss-text">{fmt(groupPayments)}</span>
                        </span>
                      )}
                      <span className={`font-bold ${groupDiff >= 0 ? "text-toss-green" : "text-toss-red"}`}>
                        {groupDiff >= 0 ? "+" : ""}{fmt(groupDiff)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </section>
          );
        })}

        {/* Summary */}
        <section className="bg-toss-text rounded-2xl p-4 md:p-5 text-white">
          <h3 className="text-[14px] font-bold text-white/70 mb-3">정산 요약</h3>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between">
              <span className="text-white/60">총 견적금액 (수금액)</span>
              <span className="font-semibold tabular-nums">{formatCurrency(totalQuotedAmount)}</span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex justify-between">
              <span className="text-white/60">실제원가 합계</span>
              <span className="font-medium text-orange-300 tabular-nums">- {formatCurrency(totalMaterialCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">지급내역 합계</span>
              <span className="font-medium text-orange-300 tabular-nums">- {formatCurrency(totalPayments)}</span>
            </div>
            <div className="h-px bg-white/20 mt-2" />
            <div className="flex justify-between items-baseline pt-2">
              <span className="text-[15px] font-bold">최종 순수익</span>
              <div className="text-right">
                <span
                  className={`text-[24px] md:text-[28px] font-extrabold tracking-tight tabular-nums ${
                    finalMargin >= 0 ? "text-toss-green" : "text-toss-red"
                  }`}
                >
                  {formatCurrency(finalMargin)}
                </span>
                <span
                  className={`ml-1.5 text-[14px] font-bold ${
                    finalMargin >= 0 ? "text-toss-green" : "text-toss-red"
                  }`}
                >
                  ({finalMarginPercent}%)
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Validation */}
        {!isAllValid && (
          <div className="bg-toss-red-light p-3 rounded-2xl text-[12px] text-toss-red">
            <p className="font-bold mb-1">입력이 필요한 항목이 있습니다</p>
            <ul className="space-y-0.5">
              {groups
                .filter((g) => !g.costEntries.every((e) => Number(e.materialCost) > 0))
                .map((g) => (
                  <li key={g.itemId}>· [{g.category}] {g.description} — 실구매비용 미입력</li>
                ))}
            </ul>
          </div>
        )}
      </div>

      {/* Floating Bottom Bar (mobile) */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-2xl shadow-[0_-1px_12px_rgba(0,0,0,0.06)] md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="min-w-0 flex-1 mr-3">
            <span className="text-[11px] text-toss-text-tertiary block">최종 순수익</span>
            <span
              className={`text-[18px] font-extrabold tabular-nums ${
                finalMargin >= 0 ? "text-toss-green" : "text-toss-red"
              }`}
            >
              {formatCurrency(finalMargin)}
            </span>
          </div>
          <button
            onClick={handleConfirm}
            disabled={!isAllValid}
            className={`flex items-center gap-1.5 px-6 py-3 text-[14px] font-semibold rounded-2xl transition-all active:scale-[0.97] shrink-0 ${
              isAllValid
                ? "bg-toss-green text-white hover:bg-toss-green/80"
                : "bg-toss-divider text-toss-text-tertiary cursor-not-allowed"
            }`}
          >
            <CheckCircle size={16} />
            정산 확정
          </button>
        </div>
      </div>
    </div>
  );
}
