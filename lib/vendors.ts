import type { Vendor, VendorDocumentType, VendorDocumentSummary, VendorType } from "./types";

const STORAGE_KEY = "homefix_vendors";

function normalizeDocuments(
  raw: unknown,
): Partial<Record<VendorDocumentType, VendorDocumentSummary>> {
  if (!raw || typeof raw !== "object") return {};

  const documents = raw as Record<string, unknown>;
  const normalized: Partial<Record<VendorDocumentType, VendorDocumentSummary>> = {};

  for (const key of ["businessRegistration", "bankbookCopy"] as VendorDocumentType[]) {
    const value = documents[key];
    if (!value || typeof value !== "object") continue;
    const summary = value as Record<string, unknown>;
    const name = typeof summary.name === "string" ? summary.name : "";
    const uploadedAt =
      typeof summary.uploadedAt === "string" ? summary.uploadedAt : "";

    if (name) {
      normalized[key] = {
        name,
        uploadedAt,
      };
    }
  }

  return normalized;
}

function normalizeVendor(raw: unknown): Vendor | null {
  if (!raw || typeof raw !== "object") return null;

  const vendor = raw as Record<string, unknown>;
  const createdAt =
    typeof vendor.createdAt === "string"
      ? vendor.createdAt
      : new Date().toISOString();
  const updatedAt =
    typeof vendor.updatedAt === "string" ? vendor.updatedAt : createdAt;
  const vendorType: VendorType =
    vendor.vendorType === "partner" ? "partner" : "purchase";

  return {
    id: typeof vendor.id === "string" ? vendor.id : "",
    name: typeof vendor.name === "string" ? vendor.name : "",
    vendorType,
    representative:
      typeof vendor.representative === "string" ? vendor.representative : "",
    contact: typeof vendor.contact === "string" ? vendor.contact : "",
    category: typeof vendor.category === "string" ? vendor.category : "",
    businessNumber:
      typeof vendor.businessNumber === "string" ? vendor.businessNumber : "",
    address: typeof vendor.address === "string" ? vendor.address : "",
    bankName: typeof vendor.bankName === "string" ? vendor.bankName : "",
    bankAccount:
      typeof vendor.bankAccount === "string" ? vendor.bankAccount : "",
    accountHolder:
      typeof vendor.accountHolder === "string" ? vendor.accountHolder : "",
    memo: typeof vendor.memo === "string" ? vendor.memo : "",
    createdAt,
    updatedAt,
    documents: normalizeDocuments(vendor.documents),
  };
}

export function loadVendors(): Vendor[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeVendor)
      .filter((vendor): vendor is Vendor => Boolean(vendor?.id && vendor.name));
  } catch {
    return [];
  }
}

export function saveVendors(vendors: Vendor[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vendors));
}

export function addVendor(vendor: Vendor): Vendor[] {
  const vendors = loadVendors();
  vendors.unshift(vendor);
  saveVendors(vendors);
  return vendors;
}

export function updateVendor(updated: Vendor): Vendor[] {
  const vendors = loadVendors().map((v) =>
    v.id === updated.id ? updated : v,
  );
  saveVendors(vendors);
  return vendors;
}

export function deleteVendor(id: string): Vendor[] {
  const vendors = loadVendors().filter((v) => v.id !== id);
  saveVendors(vendors);
  return vendors;
}
