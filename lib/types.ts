export type QuoteStatus = "견적" | "계약" | "시공완료";

export interface CostItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  margin: number;
  laborCost: number;
  amount: number;
}

export interface QuoteItem {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unitPrice: number;
  laborCost: number;
  amount: number;
  costItems: CostItem[];
  materialMargin: number;
  margin: number;
}

export interface ClientInfo {
  name: string;
  contact: string;
  address: string;
  projectDate: string;
}

export interface SettlementCostEntry {
  id: string;
  parentItemId: string;
  costItemId: string;
  category: string;
  description: string;
  quotedAmount: number;
  materialCost: number;
}

export interface LaborPayment {
  id: string;
  name: string;
  amount: number;
}

export interface PartnerPayment {
  id: string;
  name: string;
  amount: number;
}

export interface Settlement {
  costEntries: SettlementCostEntry[];
  laborPayments: LaborPayment[];
  partnerPayments: PartnerPayment[];
  totalQuotedAmount: number;
  totalMaterialCost: number;
  totalLaborCost: number;
  totalPartnerCost: number;
  finalMargin: number;
  finalMarginPercent: number;
  settledAt: string;
}

export interface Quote {
  id: string;
  date: string;
  client: ClientInfo;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  totalCost: number;
  totalMargin: number;
  notes: string;
  status: QuoteStatus;
  settlement?: Settlement;
}

export const CATEGORIES = [
  "가설/철거",
  "설비/방수",
  "목공",
  "전기/조명",
  "도장(페인트)",
  "필름/시트",
  "도배",
  "바닥재",
  "타일",
  "가구/싱크대",
  "창호/유리",
  "금속",
  "기타/잡비",
];
