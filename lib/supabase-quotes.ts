import { supabase } from "./supabase";
import type { Quote, Settlement } from "./types";

// Supabase row <-> Quote 변환
interface QuoteRow {
  id: string;
  date: string;
  client: Quote["client"];
  items: Quote["items"];
  subtotal: number;
  tax: number;
  total: number;
  total_cost: number;
  total_margin: number;
  notes: string;
  status: string;
  settlement: Quote["settlement"] | null;
  versions: Quote["versions"] | null;
  created_at: string;
  updated_at: string;
}

function migrateSettlement(s: any): Settlement | undefined {
  if (!s) return undefined;
  // 기존 laborPayments+partnerPayments → payments 통합
  if (s.payments) return s as Settlement;
  const payments = [
    ...((s.laborPayments as any[]) || []),
    ...((s.partnerPayments as any[]) || []),
  ];
  const totalPayments = payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
  return {
    costEntries: s.costEntries || [],
    payments,
    totalQuotedAmount: s.totalQuotedAmount || 0,
    totalMaterialCost: s.totalMaterialCost || 0,
    totalPayments,
    finalMargin: s.finalMargin || 0,
    finalMarginPercent: s.finalMarginPercent || 0,
    settledAt: s.settledAt || "",
  };
}

function rowToQuote(row: QuoteRow): Quote {
  return {
    id: row.id,
    date: row.date,
    client: row.client,
    items: row.items,
    subtotal: row.subtotal,
    tax: row.tax,
    total: row.total,
    totalCost: row.total_cost,
    totalMargin: row.total_margin,
    notes: row.notes,
    status: row.status as Quote["status"],
    settlement: migrateSettlement(row.settlement),
    versions: row.versions || undefined,
  };
}

function quoteToRow(quote: Quote) {
  return {
    id: quote.id,
    date: quote.date,
    client: quote.client,
    items: quote.items,
    subtotal: quote.subtotal,
    tax: quote.tax,
    total: quote.total,
    total_cost: quote.totalCost,
    total_margin: quote.totalMargin,
    notes: quote.notes,
    status: quote.status,
    settlement: quote.settlement || null,
    versions: quote.versions || null,
  };
}

export async function fetchQuotes(): Promise<Quote[]> {
  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch quotes:", error);
    return [];
  }
  return (data as QuoteRow[]).map(rowToQuote);
}

export async function upsertQuote(quote: Quote): Promise<boolean> {
  const row = quoteToRow(quote);
  const { error } = await supabase
    .from("quotes")
    .upsert({ ...row, updated_at: new Date().toISOString() });

  if (error) {
    console.error("Failed to save quote:", error);
    return false;
  }
  return true;
}

export async function deleteQuote(id: string): Promise<boolean> {
  const { error } = await supabase.from("quotes").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete quote:", error);
    return false;
  }
  return true;
}

export async function updateQuoteSettlement(
  id: string,
  settlement: Quote["settlement"],
): Promise<boolean> {
  const { error } = await supabase
    .from("quotes")
    .update({
      status: "시공완료",
      settlement,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to save settlement:", error);
    return false;
  }
  return true;
}

export async function updateQuoteStatus(
  id: string,
  status: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("quotes")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Failed to update status:", error);
    return false;
  }
  return true;
}
