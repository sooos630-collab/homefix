import type { Quote, Vendor } from "./types";

export type VendorTransactionType = "purchase" | "payment";

export interface VendorTransactionHistoryItem {
  quoteId: string;
  quoteDate: string;
  settledAt: string;
  clientName: string;
  projectAddress: string;
  amount: number;
  itemName: string;
  category: string;
  type: VendorTransactionType;
}

export interface VendorTransactionSummary {
  totalAmount: number;
  purchaseAmount: number;
  paymentAmount: number;
  transactionCount: number;
  purchaseCount: number;
  paymentCount: number;
  projectCount: number;
  lastTradedAt: string;
  histories: VendorTransactionHistoryItem[];
}

function createEmptySummary(): VendorTransactionSummary {
  return {
    totalAmount: 0,
    purchaseAmount: 0,
    paymentAmount: 0,
    transactionCount: 0,
    purchaseCount: 0,
    paymentCount: 0,
    projectCount: 0,
    lastTradedAt: "",
    histories: [],
  };
}

function trackProject(
  seenProjects: Map<string, Set<string>>,
  vendorId: string,
  quoteId: string,
  summary: VendorTransactionSummary,
) {
  if (!seenProjects.has(vendorId)) {
    seenProjects.set(vendorId, new Set());
  }

  const ids = seenProjects.get(vendorId)!;
  if (!ids.has(quoteId)) {
    ids.add(quoteId);
    summary.projectCount += 1;
  }
}

function updateLastTradedAt(summary: VendorTransactionSummary, settledAt: string) {
  summary.lastTradedAt =
    !summary.lastTradedAt ||
    new Date(settledAt).getTime() > new Date(summary.lastTradedAt).getTime()
      ? settledAt
      : summary.lastTradedAt;
}

export function buildVendorPaymentHistoryMap(
  quotes: Quote[],
  vendors: Vendor[],
): Map<string, VendorTransactionSummary> {
  const byId = new Map<string, VendorTransactionSummary>();
  const vendorByName = new Map<string, Vendor>();

  for (const vendor of vendors) {
    byId.set(vendor.id, createEmptySummary());
    vendorByName.set(vendor.name.trim().toLowerCase(), vendor);
  }

  for (const quote of quotes) {
    if (!quote.settlement) continue;
    const seenProjects = new Map<string, Set<string>>();

    for (const entry of quote.settlement.costEntries) {
      const matchedVendor =
        vendors.find((vendor) => vendor.id === entry.vendorId) ??
        vendorByName.get(entry.description.trim().toLowerCase());

      if (!matchedVendor) continue;

      const summary = byId.get(matchedVendor.id) ?? createEmptySummary();
      const amount = Number(entry.materialCost) || 0;

      summary.totalAmount += amount;
      summary.purchaseAmount += amount;
      summary.transactionCount += 1;
      summary.purchaseCount += 1;
      updateLastTradedAt(summary, quote.settlement.settledAt);
      trackProject(seenProjects, matchedVendor.id, quote.id, summary);

      summary.histories.push({
        quoteId: quote.id,
        quoteDate: quote.date,
        settledAt: quote.settlement.settledAt,
        clientName: quote.client.name,
        projectAddress: quote.client.address,
        amount,
        itemName: entry.description,
        category: entry.category,
        type: "purchase",
      });

      byId.set(matchedVendor.id, summary);
    }

    for (const payment of quote.settlement.payments) {
      const matchedVendor =
        vendors.find((vendor) => vendor.id === payment.vendorId) ??
        vendorByName.get(payment.name.trim().toLowerCase());

      if (!matchedVendor) continue;

      const summary = byId.get(matchedVendor.id) ?? createEmptySummary();
      const amount = Number(payment.amount) || 0;

      summary.totalAmount += amount;
      summary.paymentAmount += amount;
      summary.transactionCount += 1;
      summary.paymentCount += 1;
      updateLastTradedAt(summary, quote.settlement.settledAt);
      trackProject(seenProjects, matchedVendor.id, quote.id, summary);

      summary.histories.push({
        quoteId: quote.id,
        quoteDate: quote.date,
        settledAt: quote.settlement.settledAt,
        clientName: quote.client.name,
        projectAddress: quote.client.address,
        amount,
        itemName: payment.name,
        category: "",
        type: "payment",
      });

      byId.set(matchedVendor.id, summary);
    }
  }

  for (const [, summary] of byId) {
    summary.histories.sort(
      (a, b) => new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime(),
    );
  }

  return byId;
}
