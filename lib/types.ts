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
  vendorId: string;
  category: string;
  description: string;
  quotedAmount: number;
  materialCost: number;
}

export interface PaymentEntry {
  id: string;
  parentItemId: string;
  vendorId: string;
  name: string;
  amount: number;
}

/** @deprecated 기존 호환용 */
export type LaborPayment = PaymentEntry;
/** @deprecated 기존 호환용 */
export type PartnerPayment = PaymentEntry;

export interface Settlement {
  costEntries: SettlementCostEntry[];
  payments: PaymentEntry[];
  totalQuotedAmount: number;
  totalMaterialCost: number;
  totalPayments: number;
  finalMargin: number;
  finalMarginPercent: number;
  settledAt: string;
  /** @deprecated 기존 데이터 호환 */
  laborPayments?: PaymentEntry[];
  /** @deprecated 기존 데이터 호환 */
  partnerPayments?: PaymentEntry[];
  /** @deprecated */
  totalLaborCost?: number;
  /** @deprecated */
  totalPartnerCost?: number;
}

export interface QuoteVersion {
  version: number;
  savedAt: string;
  date: string;
  client: ClientInfo;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  totalCost: number;
  totalMargin: number;
  notes: string;
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
  versions?: QuoteVersion[];
}

export type VendorType = "purchase" | "partner";

export type VendorDocumentType = "businessRegistration" | "bankbookCopy";

export interface VendorDocumentSummary {
  name: string;
  uploadedAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  vendorType: VendorType;
  representative: string;
  contact: string;
  category: string;
  businessNumber: string;
  address: string;
  bankName: string;
  bankAccount: string;
  accountHolder: string;
  memo: string;
  createdAt: string;
  updatedAt: string;
  documents: Partial<Record<VendorDocumentType, VendorDocumentSummary>>;
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
