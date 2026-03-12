"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  Edit2,
  FileText,
  FileUp,
  Hammer,
  Landmark,
  Loader2,
  MapPin,
  Package,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";
import { formatCurrency, generateId } from "@/lib/utils";
import { buildVendorPaymentHistoryMap } from "@/lib/vendor-payment-history";
import {
  createDocumentDraft,
  deleteVendorDocument,
  deleteVendorDocuments,
  listVendorDocuments,
  saveVendorDocument,
  type VendorDocumentDraft,
} from "@/lib/vendor-documents";
import { addVendor, deleteVendor, loadVendors, updateVendor } from "@/lib/vendors";
import type { Quote, Vendor, VendorDocumentType, VendorType } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";

const VENDOR_CATEGORIES = ["전체", ...CATEGORIES, "기타"];
const DOCUMENT_TYPES: VendorDocumentType[] = [
  "businessRegistration",
  "bankbookCopy",
];

const VENDOR_TYPE_META: Record<
  VendorType,
  {
    label: string;
    shortLabel: string;
    description: string;
    icon: typeof Package;
    chipClassName: string;
    panelClassName: string;
  }
> = {
  purchase: {
    label: "매입/구매 거래처",
    shortLabel: "매입/구매",
    description: "자재, 물품, 장비 등을 매입하거나 구매하는 거래처",
    icon: Package,
    chipClassName: "bg-blue-50 text-blue-700",
    panelClassName: "border-blue-200 bg-blue-50/70",
  },
  partner: {
    label: "인건비/시공 협력사",
    shortLabel: "시공/인건비",
    description: "인건비 지급 또는 시공 협업이 필요한 거래처",
    icon: Hammer,
    chipClassName: "bg-amber-50 text-amber-700",
    panelClassName: "border-amber-200 bg-amber-50/70",
  },
};

const DOCUMENT_LABELS: Record<VendorDocumentType, string> = {
  businessRegistration: "사업자등록증",
  bankbookCopy: "통장사본",
};

interface VendorFormState {
  name: string;
  representative: string;
  contact: string;
  category: string;
  businessNumber: string;
  address: string;
  bankName: string;
  bankAccount: string;
  accountHolder: string;
  memo: string;
}

interface VendorListProps {
  vendorType: VendorType;
  quotes: Quote[];
  onViewQuote?: (quote: Quote) => void;
  onNavigateVendorType?: (vendorType: VendorType) => void;
}

const EMPTY_FORM: VendorFormState = {
  name: "",
  representative: "",
  contact: "",
  category: "",
  businessNumber: "",
  address: "",
  bankName: "",
  bankAccount: "",
  accountHolder: "",
  memo: "",
};

function buildFormState(vendor: Vendor): VendorFormState {
  return {
    name: vendor.name,
    representative: vendor.representative,
    contact: vendor.contact,
    category: vendor.category,
    businessNumber: vendor.businessNumber,
    address: vendor.address,
    bankName: vendor.bankName,
    bankAccount: vendor.bankAccount,
    accountHolder: vendor.accountHolder,
    memo: vendor.memo,
  };
}

function trimForm(form: VendorFormState): VendorFormState {
  return {
    name: form.name.trim(),
    representative: form.representative.trim(),
    contact: form.contact.trim(),
    category: form.category.trim(),
    businessNumber: form.businessNumber.trim(),
    address: form.address.trim(),
    bankName: form.bankName.trim(),
    bankAccount: form.bankAccount.trim(),
    accountHolder: form.accountHolder.trim(),
    memo: form.memo.trim(),
  };
}

function formatDateLabel(iso: string) {
  if (!iso) return "";

  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatFileSize(size: number) {
  if (!size) return "";
  if (size < 1024 * 1024) return `${Math.round(size / 1024)}KB`;
  return `${(size / (1024 * 1024)).toFixed(1)}MB`;
}

function buildDocumentSummary(vendor: Vendor, type: VendorDocumentType) {
  return vendor.documents[type];
}

function getTransactionTypeMeta(type: "purchase" | "payment") {
  if (type === "purchase") {
    return {
      label: "매입",
      className: "bg-blue-50 text-blue-700",
    };
  }

  return {
    label: "지급",
    className: "bg-amber-50 text-amber-700",
  };
}

export function VendorList({
  vendorType,
  quotes,
  onViewQuote,
  onNavigateVendorType,
}: VendorListProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("전체");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VendorFormState>(EMPTY_FORM);
  const [draftDocuments, setDraftDocuments] = useState<
    Partial<Record<VendorDocumentType, VendorDocumentDraft>>
  >({});
  const [removedDocumentTypes, setRemovedDocumentTypes] = useState<
    VendorDocumentType[]
  >([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setVendors(loadVendors());
  }, []);

  const editingVendor = useMemo(
    () => vendors.find((vendor) => vendor.id === editingId) ?? null,
    [vendors, editingId],
  );

  const filtered = useMemo(() => {
    return vendors.filter((vendor) => {
      if (vendor.vendorType !== vendorType) return false;
      if (filterCat !== "전체" && vendor.category !== filterCat) return false;

      if (!search) return true;
      const query = search.toLowerCase();
      return (
        vendor.name.toLowerCase().includes(query) ||
        vendor.representative.toLowerCase().includes(query) ||
        vendor.contact.includes(query) ||
        vendor.category.toLowerCase().includes(query) ||
        vendor.businessNumber.includes(query) ||
        vendor.bankAccount.includes(query) ||
        vendor.accountHolder.toLowerCase().includes(query) ||
        vendor.address.toLowerCase().includes(query)
      );
    });
  }, [vendors, search, filterCat, vendorType]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const vendor of vendors) {
      if (vendor.vendorType !== vendorType) continue;
      counts.set(vendor.category, (counts.get(vendor.category) || 0) + 1);
    }
    return counts;
  }, [vendors, vendorType]);

  const transactionHistoryMap = useMemo(
    () => buildVendorPaymentHistoryMap(quotes, vendors),
    [quotes, vendors],
  );

  const quoteMap = useMemo(
    () => new Map(quotes.map((quote) => [quote.id, quote])),
    [quotes],
  );

  const activeTypeMeta = VENDOR_TYPE_META[vendorType];
  const activeTypeVendors = useMemo(
    () => vendors.filter((vendor) => vendor.vendorType === vendorType),
    [vendors, vendorType],
  );

  const inputStyle =
    "w-full px-3 py-2.5 bg-toss-input rounded-xl text-[13px] text-toss-text placeholder:text-toss-text-tertiary focus:outline-none focus:bg-toss-divider transition-colors";
  const textAreaStyle = `${inputStyle} resize-none`;

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setDraftDocuments({});
    setRemovedDocumentTypes([]);
    setLoadingDocuments(false);
    setSaving(false);
    setShowForm(false);
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setDraftDocuments({});
    setRemovedDocumentTypes([]);
    setLoadingDocuments(false);
    setSaving(false);
    setShowForm(true);
  };

  const openEdit = async (vendor: Vendor) => {
    setForm(buildFormState(vendor));
    setEditingId(vendor.id);
    setDraftDocuments({});
    setRemovedDocumentTypes([]);
    setLoadingDocuments(true);
    setSaving(false);
    setShowForm(true);

    const documents = await listVendorDocuments(vendor.id);
    const nextDrafts: Partial<Record<VendorDocumentType, VendorDocumentDraft>> = {};

    for (const document of documents) {
      nextDrafts[document.type] = {
        type: document.type,
        name: document.name,
        mimeType: document.mimeType,
        size: document.size,
        dataUrl: document.dataUrl,
        uploadedAt: document.uploadedAt,
      };
    }

    setDraftDocuments(nextDrafts);
    setLoadingDocuments(false);
  };

  const updateFormField = <K extends keyof VendorFormState>(
    field: K,
    value: VendorFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("이 거래처를 삭제하시겠습니까?")) {
      await deleteVendorDocuments(id);
      setVendors(deleteVendor(id));
    }
  };

  const handleDocumentChange = async (
    type: VendorDocumentType,
    file: File | null,
  ) => {
    if (!file) return;

    const documentDraft = await createDocumentDraft(type, file);

    setDraftDocuments((prev) => ({
      ...prev,
      [type]: documentDraft,
    }));
    setRemovedDocumentTypes((prev) => prev.filter((entry) => entry !== type));
  };

  const handleDocumentRemove = (type: VendorDocumentType) => {
    setDraftDocuments((prev) => {
      const next = { ...prev };
      delete next[type];
      return next;
    });

    if (editingVendor?.documents[type]) {
      setRemovedDocumentTypes((prev) =>
        prev.includes(type) ? prev : [...prev, type],
      );
    }
  };

  const getCurrentDocument = (type: VendorDocumentType) => {
    const draft = draftDocuments[type];
    if (draft) return draft;

    if (removedDocumentTypes.includes(type)) return undefined;

    const summary = editingVendor?.documents[type];
    if (!summary) return undefined;

    return {
      type,
      name: summary.name,
      mimeType: "",
      size: 0,
      dataUrl: "",
      uploadedAt: summary.uploadedAt,
    } satisfies VendorDocumentDraft;
  };

  const handleSave = async () => {
    const normalizedForm = trimForm(form);
    if (!normalizedForm.name) return;

    setSaving(true);
    const now = new Date().toISOString();
    const vendorId = editingId || generateId();
    const createdAt = editingVendor?.createdAt || now;

    const documents = DOCUMENT_TYPES.reduce<Vendor["documents"]>((acc, type) => {
      const draft = draftDocuments[type];
      if (draft) {
        acc[type] = {
          name: draft.name,
          uploadedAt: draft.uploadedAt,
        };
        return acc;
      }

      if (!removedDocumentTypes.includes(type) && editingVendor?.documents[type]) {
        acc[type] = editingVendor.documents[type];
      }

      return acc;
    }, {});

    const payload: Vendor = {
      id: vendorId,
      ...normalizedForm,
      vendorType,
      createdAt,
      updatedAt: now,
      documents,
    };

    if (editingId) {
      setVendors(updateVendor(payload));
    } else {
      setVendors(addVendor(payload));
    }

    await Promise.all(
      DOCUMENT_TYPES.map(async (type) => {
        const draft = draftDocuments[type];
        if (draft) {
          await saveVendorDocument(vendorId, draft);
          return;
        }

        if (removedDocumentTypes.includes(type)) {
          await deleteVendorDocument(vendorId, type);
        }
      }),
    );

    resetForm();
  };

  return (
    <div className="min-h-screen bg-toss-bg">
      <header className="sticky top-0 z-20 bg-white">
        <div className="px-4 md:px-6">
          <div className="flex items-center justify-between h-12 md:h-14">
            <div>
              <h2 className="text-[18px] md:text-[20px] font-bold text-toss-text tracking-tight">
                {activeTypeMeta.label}
              </h2>
              <p className="hidden md:block text-[12px] text-toss-text-tertiary">
                {activeTypeMeta.description}
              </p>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-toss-blue text-white text-[13px] font-semibold rounded-xl hover:bg-toss-blue-dark active:scale-[0.97] transition-all"
            >
              <Plus size={15} />
              거래처 등록
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-6 py-3 md:py-4 pb-24 md:pb-8 space-y-3">
        <section className="md:hidden bg-white rounded-2xl p-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.entries(VENDOR_TYPE_META) as Array<
              [VendorType, (typeof VENDOR_TYPE_META)[VendorType]]
            >).map(([type, meta]) => (
              <button
                key={type}
                type="button"
                onClick={() => onNavigateVendorType?.(type)}
                className={`rounded-xl px-3 py-2.5 text-[12px] font-semibold transition-colors ${
                  vendorType === type
                    ? "bg-toss-text text-white"
                    : "bg-transparent text-toss-text-secondary"
                }`}
              >
                {meta.shortLabel}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl p-4 md:p-5">
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-bold px-2 py-1 rounded-full ${activeTypeMeta.chipClassName}`}
            >
              {activeTypeMeta.shortLabel}
            </span>
            <span className="text-[15px] font-bold text-toss-text">
              {activeTypeMeta.label}
            </span>
          </div>
          <p className="text-[12px] text-toss-text-tertiary mt-2">
            거래처별로 몇 번 거래했는지, 어떤 건으로 거래했는지, 최근 거래 이력을 바로 확인합니다.
          </p>
        </section>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-toss-text-tertiary"
              size={16}
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`${activeTypeMeta.shortLabel} 거래처 검색`}
              className="w-full pl-10 pr-3 py-2.5 bg-white rounded-xl text-[14px] text-toss-text placeholder:text-toss-text-tertiary focus:outline-none focus:ring-2 focus:ring-toss-blue/20 transition-all"
            />
          </div>
          <span className="text-[13px] text-toss-text-tertiary font-medium">
            {filtered.length}건
          </span>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          {VENDOR_CATEGORIES.filter(
            (category) =>
              category === "전체" || categoryCounts.has(category) || category === "기타",
          ).map((category) => (
            <button
              key={category}
              onClick={() => setFilterCat(category)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all shrink-0 ${
                filterCat === category
                  ? "bg-toss-text text-white"
                  : "bg-white text-toss-text-secondary hover:text-toss-text"
              }`}
            >
              {category}
              {category !== "전체" && categoryCounts.get(category) ? (
                <span className="ml-1 opacity-70">{categoryCounts.get(category)}</span>
              ) : category === "전체" ? (
                <span className="ml-1 opacity-70">{activeTypeVendors.length}</span>
              ) : null}
            </button>
          ))}
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-2 md:p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={resetForm}
            />
            <div className="relative bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[calc(100vh-16px)] md:max-h-[90vh] flex flex-col">
              <div className="px-5 py-4 flex items-center justify-between border-b border-toss-divider">
                <div>
                  <h3 className="text-[16px] font-bold text-toss-text">
                    {editingId ? "거래처 수정" : "거래처 등록"}
                  </h3>
                  <p className="text-[12px] text-toss-text-tertiary mt-0.5">
                    {activeTypeMeta.label}의 사업자 정보, 계좌 정보, 첨부 서류를 관리합니다
                  </p>
                </div>
                <button
                  onClick={resetForm}
                  className="p-1 hover:bg-toss-divider rounded-lg transition-colors"
                >
                  <X size={18} className="text-toss-text-tertiary" />
                </button>
              </div>

              <div className="px-5 py-4 space-y-5 overflow-y-auto">
                <section className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-toss-text-tertiary" />
                      <h4 className="text-[13px] font-bold text-toss-text">기본 정보</h4>
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-toss-text-secondary block mb-1">
                        업체명 <span className="text-toss-red">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(event) =>
                          updateFormField("name", event.target.value)
                        }
                        placeholder="업체명 입력"
                        className={inputStyle}
                        autoFocus
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[12px] font-semibold text-toss-text-secondary block mb-1">
                          대표자/담당자
                        </label>
                        <input
                          type="text"
                          value={form.representative}
                          onChange={(event) =>
                            updateFormField("representative", event.target.value)
                          }
                          placeholder="이름"
                          className={inputStyle}
                        />
                      </div>
                      <div>
                        <label className="text-[12px] font-semibold text-toss-text-secondary block mb-1">
                          연락처
                        </label>
                        <input
                          type="tel"
                          value={form.contact}
                          onChange={(event) =>
                            updateFormField("contact", event.target.value)
                          }
                          placeholder="010-0000-0000"
                          className={inputStyle}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[12px] font-semibold text-toss-text-secondary block mb-1">
                          사업자등록번호
                        </label>
                        <input
                          type="text"
                          value={form.businessNumber}
                          onChange={(event) =>
                            updateFormField("businessNumber", event.target.value)
                          }
                          placeholder="123-45-67890"
                          className={inputStyle}
                        />
                      </div>
                      <div>
                        <label className="text-[12px] font-semibold text-toss-text-secondary block mb-1">
                          업종/공종
                        </label>
                        <select
                          value={form.category}
                          onChange={(event) =>
                            updateFormField("category", event.target.value)
                          }
                          className={`${inputStyle} cursor-pointer`}
                        >
                          <option value="">선택</option>
                          {CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                          <option value="기타">기타</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-toss-text-secondary block mb-1">
                        주소
                      </label>
                      <input
                        type="text"
                        value={form.address}
                        onChange={(event) =>
                          updateFormField("address", event.target.value)
                        }
                        placeholder="사업장 주소"
                        className={inputStyle}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Landmark size={14} className="text-toss-text-tertiary" />
                      <h4 className="text-[13px] font-bold text-toss-text">계좌 정보</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[12px] font-semibold text-toss-text-secondary block mb-1">
                          은행명
                        </label>
                        <input
                          type="text"
                          value={form.bankName}
                          onChange={(event) =>
                            updateFormField("bankName", event.target.value)
                          }
                          placeholder="은행명"
                          className={inputStyle}
                        />
                      </div>
                      <div>
                        <label className="text-[12px] font-semibold text-toss-text-secondary block mb-1">
                          예금주
                        </label>
                        <input
                          type="text"
                          value={form.accountHolder}
                          onChange={(event) =>
                            updateFormField("accountHolder", event.target.value)
                          }
                          placeholder="예금주"
                          className={inputStyle}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-toss-text-secondary block mb-1">
                        계좌번호
                      </label>
                      <input
                        type="text"
                        value={form.bankAccount}
                        onChange={(event) =>
                          updateFormField("bankAccount", event.target.value)
                        }
                        placeholder="계좌번호"
                        className={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-toss-text-secondary block mb-1">
                        메모
                      </label>
                      <textarea
                        value={form.memo}
                        onChange={(event) =>
                          updateFormField("memo", event.target.value)
                        }
                        placeholder="지급 조건, 담당자 메모, 유의사항"
                        rows={4}
                        className={textAreaStyle}
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={14} className="text-toss-text-tertiary" />
                    <h4 className="text-[13px] font-bold text-toss-text">첨부 서류</h4>
                    <span className="text-[11px] text-toss-text-tertiary">
                      PDF, JPG, PNG
                    </span>
                  </div>
                  {loadingDocuments ? (
                    <div className="bg-toss-bg rounded-2xl p-5 flex items-center gap-2 text-[13px] text-toss-text-secondary">
                      <Loader2 size={16} className="animate-spin" />
                      첨부 서류를 불러오는 중입니다
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-3">
                      {DOCUMENT_TYPES.map((type) => {
                        const document = getCurrentDocument(type);
                        const label = DOCUMENT_LABELS[type];
                        return (
                          <div
                            key={type}
                            className="border border-toss-border rounded-2xl p-4 bg-toss-bg/40"
                          >
                            <div className="flex items-center justify-between gap-3 mb-3">
                              <div>
                                <p className="text-[13px] font-bold text-toss-text">
                                  {label}
                                </p>
                                <p className="text-[11px] text-toss-text-tertiary">
                                  사업자 확인과 지급 계좌 확인용 서류
                                </p>
                              </div>
                              {document ? (
                                <span className="text-[10px] font-bold bg-toss-green-light text-toss-green px-2 py-1 rounded-full">
                                  업로드됨
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold bg-toss-divider text-toss-text-tertiary px-2 py-1 rounded-full">
                                  미등록
                                </span>
                              )}
                            </div>

                            {document ? (
                              <div className="bg-white rounded-xl border border-toss-border p-3 space-y-2">
                                <div className="flex items-center gap-2">
                                  <FileText size={16} className="text-toss-blue shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-[13px] font-medium text-toss-text truncate">
                                      {document.name}
                                    </p>
                                    <p className="text-[11px] text-toss-text-tertiary">
                                      {formatDateLabel(document.uploadedAt)}
                                      {document.size > 0 ? ` · ${formatFileSize(document.size)}` : ""}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {document.dataUrl ? (
                                    <a
                                      href={document.dataUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-toss-blue-light text-toss-blue text-[12px] font-semibold"
                                    >
                                      <FileText size={13} />
                                      보기
                                    </a>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-toss-divider text-toss-text-tertiary text-[12px] font-semibold">
                                      저장됨
                                    </span>
                                  )}
                                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-toss-border text-[12px] font-semibold text-toss-text-secondary cursor-pointer">
                                    <FileUp size={13} />
                                    교체
                                    <input
                                      type="file"
                                      accept="image/*,application/pdf"
                                      className="hidden"
                                      onChange={(event) =>
                                        handleDocumentChange(
                                          type,
                                          event.target.files?.[0] ?? null,
                                        )
                                      }
                                    />
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleDocumentRemove(type)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-toss-border text-[12px] font-semibold text-toss-red"
                                  >
                                    <Trash2 size={13} />
                                    삭제
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <label className="block border-2 border-dashed border-toss-border rounded-xl p-4 text-center bg-white cursor-pointer hover:border-toss-blue/30 transition-colors">
                                <div className="w-10 h-10 rounded-2xl bg-toss-blue-light text-toss-blue flex items-center justify-center mx-auto mb-2">
                                  <FileUp size={18} />
                                </div>
                                <p className="text-[13px] font-semibold text-toss-text">
                                  {label} 업로드
                                </p>
                                <p className="text-[11px] text-toss-text-tertiary mt-1">
                                  파일을 선택해 첨부합니다
                                </p>
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  className="hidden"
                                  onChange={(event) =>
                                    handleDocumentChange(
                                      type,
                                      event.target.files?.[0] ?? null,
                                    )
                                  }
                                />
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>

              <div className="px-5 py-4 border-t border-toss-divider flex gap-2">
                <button
                  onClick={resetForm}
                  className="flex-1 py-2.5 text-[14px] font-semibold text-toss-text-secondary bg-toss-bg rounded-xl hover:bg-toss-divider transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.name.trim() || saving || loadingDocuments}
                  className={`flex-1 py-2.5 text-[14px] font-semibold rounded-xl transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 ${
                    form.name.trim() && !saving && !loadingDocuments
                      ? "bg-toss-blue text-white hover:bg-toss-blue-dark"
                      : "bg-toss-divider text-toss-text-tertiary cursor-not-allowed"
                  }`}
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  {editingId ? "수정" : "등록"}
                </button>
              </div>
            </div>
          </div>
        )}

        {vendors.length === 0 && !search && (
          <div className="py-16 text-center bg-white rounded-2xl">
            <div className="w-16 h-16 bg-toss-divider rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Building2 size={28} className="text-toss-text-tertiary" />
            </div>
            <p className="text-[16px] font-bold text-toss-text mb-1">
              등록된 거래처가 없어요
            </p>
            <p className="text-[14px] text-toss-text-secondary mb-4">
              먼저 {activeTypeMeta.label}부터 등록해보세요
            </p>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-toss-blue text-white text-[14px] font-semibold rounded-xl hover:bg-toss-blue-dark active:scale-[0.97] transition-all"
            >
              <Plus size={16} />
              첫 거래처 등록
            </button>
          </div>
        )}

        {vendors.length > 0 &&
          activeTypeVendors.length === 0 &&
          !search &&
          filterCat === "전체" && (
          <div className="py-16 text-center bg-white rounded-2xl">
            <div className="w-16 h-16 bg-toss-divider rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Building2 size={28} className="text-toss-text-tertiary" />
            </div>
            <p className="text-[16px] font-bold text-toss-text mb-1">
              {activeTypeMeta.label}가 아직 없어요
            </p>
            <p className="text-[14px] text-toss-text-secondary mb-4">
              이 탭에 해당하는 거래처부터 등록해두면 정산 연결이 훨씬 편해집니다
            </p>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-toss-blue text-white text-[14px] font-semibold rounded-xl hover:bg-toss-blue-dark active:scale-[0.97] transition-all"
            >
              <Plus size={16} />
              {activeTypeMeta.shortLabel} 등록
            </button>
          </div>
        )}

        {filtered.length === 0 &&
          (search || filterCat !== "전체") &&
          activeTypeVendors.length > 0 && (
          <div className="py-16 text-center bg-white rounded-2xl">
            <p className="text-[14px] text-toss-text-tertiary">
              {activeTypeMeta.label}에서 조건에 맞는 거래처가 없습니다
            </p>
          </div>
        )}

        {filtered.length > 0 && (
          <>
            <section className="bg-white rounded-2xl overflow-hidden hidden md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[12px] text-toss-text-tertiary font-semibold border-b border-toss-divider">
                    <th className="px-5 py-3 font-semibold">구분 / 업체명</th>
                    <th className="px-4 py-3 font-semibold">업종</th>
                    <th className="px-4 py-3 font-semibold">대표자/연락처</th>
                    <th className="px-4 py-3 font-semibold">계좌 정보</th>
                    <th className="px-4 py-3 font-semibold">서류</th>
                    <th className="px-4 py-3 font-semibold">거래 이력</th>
                    <th className="px-4 py-3 font-semibold w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((vendor) => {
                    const typeMeta = VENDOR_TYPE_META[vendor.vendorType];
                    const Icon = typeMeta.icon;
                    const completedDocs = DOCUMENT_TYPES.filter(
                      (type) => buildDocumentSummary(vendor, type),
                    ).length;
                    const transactionSummary = transactionHistoryMap.get(vendor.id);

                    return (
                      <tr
                        key={vendor.id}
                        className="border-b border-toss-divider last:border-0 hover:bg-toss-divider/50 transition-colors group"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-toss-bg flex items-center justify-center shrink-0">
                              <Icon size={17} className="text-toss-text-secondary" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${typeMeta.chipClassName}`}
                                >
                                  {typeMeta.shortLabel}
                                </span>
                                <span className="text-[14px] font-semibold text-toss-text truncate">
                                  {vendor.name}
                                </span>
                              </div>
                              <div className="text-[12px] text-toss-text-tertiary">
                                {vendor.businessNumber || "사업자번호 미입력"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {vendor.category ? (
                            <span className="text-[11px] font-bold bg-toss-blue/10 text-toss-blue px-2 py-0.5 rounded-md">
                              {vendor.category}
                            </span>
                          ) : (
                            <span className="text-[12px] text-toss-text-tertiary">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-[13px] text-toss-text-secondary">
                            {vendor.representative || "-"}
                          </div>
                          <div className="text-[12px] text-toss-text-tertiary tabular-nums mt-1">
                            {vendor.contact || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {vendor.bankAccount ? (
                            <div>
                              <div className="text-[13px] text-toss-text">
                                {vendor.bankName || "은행 미입력"}
                              </div>
                              <div className="text-[12px] text-toss-text-tertiary tabular-nums mt-1">
                                {vendor.bankAccount}
                                {vendor.accountHolder ? ` · ${vendor.accountHolder}` : ""}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[12px] text-toss-text-tertiary">
                              계좌 정보 미입력
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-[13px] font-semibold text-toss-text">
                            {completedDocs}/2
                          </div>
                          <div className="text-[11px] text-toss-text-tertiary mt-1">
                            {DOCUMENT_TYPES.map((type) => DOCUMENT_LABELS[type])
                              .filter((_, index) =>
                                Boolean(buildDocumentSummary(vendor, DOCUMENT_TYPES[index])),
                              )
                              .join(", ") || "첨부 서류 없음"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {transactionSummary &&
                          transactionSummary.transactionCount > 0 ? (
                            <div className="space-y-1.5">
                              <div className="text-[13px] font-semibold text-toss-text tabular-nums">
                                {formatCurrency(transactionSummary.totalAmount)}
                              </div>
                              <div className="text-[11px] text-toss-text-tertiary">
                                {transactionSummary.projectCount}개 현장 ·{" "}
                                {transactionSummary.transactionCount}건 거래
                              </div>
                              <div className="text-[11px] text-toss-text-tertiary">
                                매입 {transactionSummary.purchaseCount}건 · 지급{" "}
                                {transactionSummary.paymentCount}건
                              </div>
                              <div className="space-y-1">
                                {transactionSummary.histories
                                  .slice(0, 2)
                                  .map((history) => {
                                  const targetQuote = quoteMap.get(history.quoteId);
                                  const historyTypeMeta = getTransactionTypeMeta(
                                    history.type,
                                  );
                                  return (
                                    <button
                                      key={`${history.quoteId}-${history.type}-${history.settledAt}-${history.amount}`}
                                      type="button"
                                      onClick={() => targetQuote && onViewQuote?.(targetQuote)}
                                      className="block w-full rounded-xl bg-toss-bg px-3 py-2 text-left hover:bg-toss-divider/80 transition-colors"
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-1.5">
                                            <span
                                              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${historyTypeMeta.className}`}
                                            >
                                              {historyTypeMeta.label}
                                            </span>
                                            <span className="truncate text-[11px] font-medium text-toss-text">
                                              {history.clientName}
                                            </span>
                                          </div>
                                          <div className="mt-1 text-[10px] text-toss-text-tertiary">
                                            {history.itemName || "거래 항목 미입력"}
                                            {history.category ? ` · ${history.category}` : ""}
                                          </div>
                                        </div>
                                        <span className="shrink-0 text-[11px] font-semibold text-toss-text tabular-nums">
                                          {formatCurrency(history.amount)}
                                        </span>
                                      </div>
                                      <div className="mt-1 text-[10px] text-toss-text-tertiary">
                                        {formatDateLabel(history.settledAt)}
                                        {history.projectAddress
                                          ? ` · ${history.projectAddress}`
                                          : ""}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[12px] text-toss-text-tertiary">
                              거래 이력 없음
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEdit(vendor)}
                              className="p-1.5 text-toss-text-tertiary hover:text-toss-blue rounded-lg transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(vendor.id)}
                              className="p-1.5 text-toss-text-tertiary hover:text-toss-red rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>

            <div className="md:hidden space-y-2">
              {filtered.map((vendor) => {
                const typeMeta = VENDOR_TYPE_META[vendor.vendorType];
                const Icon = typeMeta.icon;
                const completedDocs = DOCUMENT_TYPES.filter((type) =>
                  buildDocumentSummary(vendor, type),
                ).length;
                const transactionSummary = transactionHistoryMap.get(vendor.id);

                return (
                  <div
                    key={vendor.id}
                    className="bg-white rounded-2xl p-4 border border-toss-border/50"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-toss-bg flex items-center justify-center shrink-0">
                          <Icon size={18} className="text-toss-text-secondary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${typeMeta.chipClassName}`}
                            >
                              {typeMeta.shortLabel}
                            </span>
                            <span className="text-[15px] font-bold text-toss-text">
                              {vendor.name}
                            </span>
                          </div>
                          {vendor.businessNumber && (
                            <div className="text-[11px] text-toss-text-tertiary">
                              {vendor.businessNumber}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEdit(vendor)}
                          className="p-1.5 text-toss-text-tertiary hover:text-toss-blue rounded-lg transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(vendor.id)}
                          className="p-1.5 text-toss-text-tertiary hover:text-toss-red rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-[12px] text-toss-text-secondary">
                      {vendor.category && (
                        <div className="flex items-center gap-2">
                          <Package size={12} className="text-toss-text-tertiary" />
                          <span>{vendor.category}</span>
                        </div>
                      )}
                      {vendor.representative && (
                        <div className="flex items-center gap-2">
                          <User size={12} className="text-toss-text-tertiary" />
                          <span>{vendor.representative}</span>
                        </div>
                      )}
                      {vendor.contact && (
                        <a
                          href={`tel:${vendor.contact}`}
                          className="flex items-center gap-2 text-toss-blue"
                        >
                          <Phone size={12} />
                          <span>{vendor.contact}</span>
                        </a>
                      )}
                      {vendor.address && (
                        <div className="flex items-start gap-2">
                          <MapPin size={12} className="text-toss-text-tertiary mt-0.5" />
                          <span>{vendor.address}</span>
                        </div>
                      )}
                      {(vendor.bankName || vendor.bankAccount) && (
                        <div className="flex items-start gap-2">
                          <Landmark size={12} className="text-toss-text-tertiary mt-0.5" />
                          <span>
                            {[vendor.bankName, vendor.bankAccount, vendor.accountHolder]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-toss-divider/60 flex items-center justify-between">
                      <div className="text-[12px] text-toss-text-tertiary">
                        첨부 서류 {completedDocs}/2
                      </div>
                      <div className="flex items-center gap-1.5">
                        {DOCUMENT_TYPES.map((type) => (
                          <span
                            key={type}
                            className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                              buildDocumentSummary(vendor, type)
                                ? "bg-toss-green-light text-toss-green"
                                : "bg-toss-divider text-toss-text-tertiary"
                            }`}
                          >
                            {DOCUMENT_LABELS[type]}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-toss-divider/60">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[12px] font-semibold text-toss-text-secondary">
                          거래 이력
                        </span>
                        <span className="text-[12px] font-bold text-toss-text tabular-nums">
                          {transactionSummary?.totalAmount
                            ? formatCurrency(transactionSummary.totalAmount)
                            : "없음"}
                        </span>
                      </div>
                      {transactionSummary &&
                      transactionSummary.transactionCount > 0 ? (
                        <div className="space-y-1.5">
                          <div className="text-[11px] text-toss-text-tertiary">
                            {transactionSummary.projectCount}개 현장 ·{" "}
                            {transactionSummary.transactionCount}건 거래
                          </div>
                          <div className="text-[11px] text-toss-text-tertiary">
                            매입 {transactionSummary.purchaseCount}건 · 지급{" "}
                            {transactionSummary.paymentCount}건
                          </div>
                          {transactionSummary.histories.slice(0, 3).map((history) => {
                            const targetQuote = quoteMap.get(history.quoteId);
                            const historyTypeMeta = getTransactionTypeMeta(history.type);
                            return (
                              <button
                                key={`${history.quoteId}-${history.type}-${history.settledAt}-${history.amount}`}
                                type="button"
                                onClick={() => targetQuote && onViewQuote?.(targetQuote)}
                                className="w-full text-left rounded-xl bg-toss-bg px-3 py-2"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${historyTypeMeta.className}`}
                                      >
                                        {historyTypeMeta.label}
                                      </span>
                                      <span className="truncate text-[12px] font-medium text-toss-text">
                                        {history.clientName}
                                      </span>
                                    </div>
                                    <div className="mt-1 text-[11px] text-toss-text-tertiary">
                                      {history.itemName || "거래 항목 미입력"}
                                      {history.category ? ` · ${history.category}` : ""}
                                    </div>
                                  </div>
                                  <span className="text-[12px] font-bold text-toss-text tabular-nums">
                                    {formatCurrency(history.amount)}
                                  </span>
                                </div>
                                <div className="text-[11px] text-toss-text-tertiary mt-1">
                                  {formatDateLabel(history.settledAt)}
                                  {history.projectAddress ? ` · ${history.projectAddress}` : ""}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[11px] text-toss-text-tertiary">
                          연결된 거래 이력이 없습니다
                        </p>
                      )}
                    </div>

                    {vendor.memo && (
                      <p className="text-[11px] text-toss-text-tertiary mt-2 line-clamp-2">
                        {vendor.memo}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
