import React, { useState, useEffect } from "react";
import {
  Plus,
  FileText,
  LayoutDashboard,
  Settings,
  Search,
  Printer,
  ChevronLeft,
  Trash2,
  Edit2,
  Calculator,
  Calendar,
} from "lucide-react";
import {
  Quote,
  QuoteItem,
  CostItem,
  ClientInfo,
  CATEGORIES,
  QuoteStatus,
} from "./types";

// --- Utility Functions ---
const generateId = () => Math.random().toString(36).substr(2, 9);
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("ko-KR").format(amount) + "원";
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

// --- Mock Data ---
const initialQuotes: Quote[] = [
  {
    id: "q-1",
    date: new Date().toISOString().split("T")[0],
    client: {
      name: "김철수",
      contact: "010-1234-5678",
      address: "서울시 강남구 역삼동 123-45",
      projectDate: "2026-04-15",
    },
    items: [
      {
        id: "i-1",
        category: "가설/철거",
        description: "전체 철거 및 폐기물 처리",
        quantity: 1,
        unitPrice: 500000,
        laborCost: 1000000,
        amount: 1500000,
        costItems: [
          {
            id: "c-1",
            description: "폐기물 처리비",
            quantity: 1,
            unitPrice: 400000,
            margin: 100000,
            amount: 400000,
          },
        ],
        materialMargin: 100000,
        margin: 100000,
      },
      {
        id: "i-2",
        category: "목공",
        description: "천장 덴조 및 가벽 설치",
        quantity: 1,
        unitPrice: 1200000,
        laborCost: 2000000,
        amount: 3200000,
        costItems: [
          {
            id: "c-2",
            description: "석고보드",
            quantity: 50,
            unitPrice: 4000,
            margin: 400000,
            amount: 200000,
          },
          {
            id: "c-3",
            description: "각재",
            quantity: 30,
            unitPrice: 6000,
            margin: 420000,
            amount: 180000,
          },
        ],
        materialMargin: 820000,
        margin: 820000,
      },
    ],
    subtotal: 4700000,
    tax: 0,
    total: 4700000,
    totalCost: 3780000,
    totalMargin: 920000,
    notes:
      "1. 본 견적서는 발행일로부터 14일간 유효합니다.\n2. 부가세(VAT) 별도 금액입니다.",
    status: "견적",
  },
];

// --- Components ---

export default function App() {
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [currentView, setCurrentView] = useState<
    "dashboard" | "editor" | "viewer"
  >("dashboard");
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);

  const handleCreateNew = () => {
    setEditingQuote(null);
    setCurrentView("editor");
  };

  const handleEdit = (quote: Quote) => {
    setEditingQuote(quote);
    setCurrentView("editor");
  };

  const handleView = (quote: Quote) => {
    setViewingQuote(quote);
    setCurrentView("viewer");
  };

  const handleDelete = (id: string) => {
    if (confirm("정말로 이 견적서를 삭제하시겠습니까?")) {
      setQuotes(quotes.filter((q) => q.id !== id));
      if (viewingQuote?.id === id) setCurrentView("dashboard");
    }
  };

  const handleSaveQuote = (quote: Quote) => {
    if (editingQuote) {
      setQuotes(quotes.map((q) => (q.id === quote.id ? quote : q)));
    } else {
      setQuotes([quote, ...quotes]);
    }
    setViewingQuote(quote);
    setCurrentView("viewer");
  };

  const handleUpdateStatus = (id: string, status: QuoteStatus) => {
    setQuotes(quotes.map((q) => (q.id === id ? { ...q, status } : q)));
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row font-sans text-neutral-900 print:block print:bg-white">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-neutral-200 flex-shrink-0 flex flex-col print:hidden">
        <div className="p-6 border-b border-neutral-100">
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-neutral-900 text-white rounded-lg flex items-center justify-center">
              <FileText size={18} />
            </div>
            꼼꼼한 집수리
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setCurrentView("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${currentView === "dashboard" ? "bg-neutral-100 text-neutral-900" : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"}`}
          >
            <LayoutDashboard size={18} />
            대시보드
          </button>
          <button
            onClick={handleCreateNew}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${currentView === "editor" && !editingQuote ? "bg-neutral-100 text-neutral-900" : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"}`}
          >
            <Plus size={18} />새 견적서 작성
          </button>
        </nav>
        <div className="p-4 border-t border-neutral-100">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors">
            <Settings size={18} />
            설정
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto print:overflow-visible print:block">
        {currentView === "dashboard" && (
          <Dashboard
            quotes={quotes}
            onCreateNew={handleCreateNew}
            onView={handleView}
            onDelete={handleDelete}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
        {currentView === "editor" && (
          <QuoteEditor
            initialQuote={editingQuote}
            onSave={handleSaveQuote}
            onCancel={() =>
              setCurrentView(editingQuote ? "viewer" : "dashboard")
            }
          />
        )}
        {currentView === "viewer" && viewingQuote && (
          <QuoteViewer
            quote={viewingQuote}
            onBack={() => setCurrentView("dashboard")}
            onEdit={() => handleEdit(viewingQuote)}
            onDelete={() => handleDelete(viewingQuote.id)}
          />
        )}
      </main>
    </div>
  );
}

// --- Dashboard Component ---
function Dashboard({
  quotes,
  onCreateNew,
  onView,
  onDelete,
  onUpdateStatus,
}: {
  quotes: Quote[];
  onCreateNew: () => void;
  onView: (q: Quote) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: QuoteStatus) => void;
}) {
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

        {filteredQuotes.length === 0 ? (
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

// --- Quote Editor Component ---
function QuoteEditor({
  initialQuote,
  onSave,
  onCancel,
}: {
  initialQuote: Quote | null;
  onSave: (q: Quote) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(
    initialQuote?.date || new Date().toISOString().split("T")[0],
  );
  const [client, setClient] = useState<ClientInfo>(
    initialQuote?.client || {
      name: "",
      contact: "",
      address: "",
      projectDate: "",
    },
  );
  const [items, setItems] = useState<QuoteItem[]>(
    initialQuote?.items || [
      {
        id: generateId(),
        category: "가설/철거",
        description: "",
        quantity: 1,
        unitPrice: 0,
        laborCost: 0,
        amount: 0,
        costItems: [],
        materialMargin: 0,
        margin: 0,
      },
    ],
  );
  const [notes, setNotes] = useState(
    initialQuote?.notes ||
      "1. 본 견적서는 발행일로부터 14일간 유효합니다.\n2. 부가세(VAT) 별도 금액입니다.",
  );
  const [showMargin, setShowMargin] = useState(false);

  const handleItemChange = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          const totalMaterialCost = updatedItem.costItems.reduce((sum, c) => sum + c.amount, 0);

          if (field === "unitPrice") {
            updatedItem.materialMargin = (Number(updatedItem.unitPrice) * Number(updatedItem.quantity)) - totalMaterialCost;
          } else if (field === "materialMargin") {
            updatedItem.unitPrice = Number(updatedItem.quantity) > 0 ? (totalMaterialCost + Number(updatedItem.materialMargin)) / Number(updatedItem.quantity) : 0;
          } else if (field === "quantity") {
            updatedItem.materialMargin = (Number(updatedItem.unitPrice) * Number(updatedItem.quantity)) - totalMaterialCost;
          }

          updatedItem.margin = Number(updatedItem.materialMargin);
          updatedItem.amount = (Number(updatedItem.quantity) * Number(updatedItem.unitPrice)) + Number(updatedItem.laborCost);

          return updatedItem;
        }
        return item;
      }),
    );
  };

  const handleCostItemChange = (
    quoteItemId: string,
    costItemId: string,
    field: keyof CostItem,
    value: any,
  ) => {
    setItems(
      items.map((item) => {
        if (item.id === quoteItemId) {
          const updatedCostItems = item.costItems.map((cItem) => {
            if (cItem.id === costItemId) {
              const updatedCItem = { ...cItem, [field]: value };
              if (field === "quantity" || field === "unitPrice") {
                updatedCItem.amount =
                  (Number(updatedCItem.quantity) || 0) *
                  (Number(updatedCItem.unitPrice) || 0);
              }
              return updatedCItem;
            }
            return cItem;
          });

          const totalMaterialCost = updatedCostItems.reduce((sum, c) => sum + c.amount, 0);
          const totalMaterialMargin = updatedCostItems.reduce((sum, c) => sum + (Number(c.margin) || 0), 0);
          const unitPrice = Number(item.quantity) > 0 ? (totalMaterialCost + totalMaterialMargin) / Number(item.quantity) : 0;
          const margin = totalMaterialMargin;
          const amount = (Number(item.quantity) * unitPrice) + Number(item.laborCost);

          return { ...item, costItems: updatedCostItems, materialMargin: totalMaterialMargin, unitPrice, margin, amount };
        }
        return item;
      }),
    );
  };

  const addCostItem = (quoteItemId: string) => {
    setItems(
      items.map((item) => {
        if (item.id === quoteItemId) {
          return {
            ...item,
            costItems: [
              ...item.costItems,
              {
                id: generateId(),
                description: "",
                quantity: 1,
                unitPrice: 0,
                margin: 0,
                amount: 0,
              },
            ],
          };
        }
        return item;
      }),
    );
  };

  const removeCostItem = (quoteItemId: string, costItemId: string) => {
    setItems(
      items.map((item) => {
        if (item.id === quoteItemId) {
          const updatedCostItems = item.costItems.filter(
            (c) => c.id !== costItemId,
          );
          const totalMaterialCost = updatedCostItems.reduce((sum, c) => sum + c.amount, 0);
          const unitPrice = Number(item.quantity) > 0 ? (totalMaterialCost + Number(item.materialMargin)) / Number(item.quantity) : 0;
          const margin = Number(item.materialMargin);
          const amount = (Number(item.quantity) * unitPrice) + Number(item.laborCost);
          return { ...item, costItems: updatedCostItems, unitPrice, margin, amount };
        }
        return item;
      }),
    );
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: generateId(),
        category: "기타/잡비",
        description: "",
        quantity: 1,
        unitPrice: 0,
        laborCost: 0,
        amount: 0,
        costItems: [],
        materialMargin: 0,
        margin: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const tax = 0;
  const total = subtotal;
  const totalCost = items.reduce(
    (sum, item) => sum + item.costItems.reduce((cSum, c) => cSum + c.amount, 0) + (Number(item.laborCost) || 0),
    0,
  );
  const totalMargin = items.reduce((sum, item) => sum + item.margin, 0);

  const handleSave = () => {
    if (!client.name) {
      alert("고객명을 입력해주세요.");
      return;
    }

    const quote: Quote = {
      id: initialQuote?.id || generateId(),
      date,
      client,
      items,
      subtotal,
      tax,
      total,
      totalCost,
      totalMargin,
      notes,
      status: initialQuote?.status || "견적",
    };
    onSave(quote);
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto pb-32">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold">
            {initialQuote ? "견적서 수정" : "새 견적서 작성"}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl font-medium text-neutral-600 hover:bg-neutral-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="bg-neutral-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-neutral-800 transition-colors shadow-sm"
          >
            저장하기
          </button>
        </div>
      </header>

      <div className="space-y-8">
        {/* Basic Info */}
        <section className="bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-sm">
              1
            </span>
            기본 정보
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                견적일자
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                고객명 / 상호명 *
              </label>
              <input
                type="text"
                value={client.name}
                onChange={(e) => setClient({ ...client, name: e.target.value })}
                placeholder="홍길동 또는 (주)회사명"
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                연락처
              </label>
              <input
                type="text"
                value={client.contact}
                onChange={(e) =>
                  setClient({ ...client, contact: e.target.value })
                }
                placeholder="010-0000-0000"
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                공사 예정일
              </label>
              <input
                type="text"
                value={client.projectDate}
                onChange={(e) =>
                  setClient({ ...client, projectDate: e.target.value })
                }
                placeholder="2026년 4월 중순"
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                현장 주소
              </label>
              <input
                type="text"
                value={client.address}
                onChange={(e) =>
                  setClient({ ...client, address: e.target.value })
                }
                placeholder="서울시 강남구 테헤란로..."
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
              />
            </div>
          </div>
        </section>

        {/* Items */}
        <section className="bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-sm">
                2
              </span>
              상세 내역
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMargin(!showMargin)}
                className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${showMargin ? "bg-blue-100 text-blue-700" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}
              >
                <Calculator size={16} />
                {showMargin ? "원가/마진 숨기기" : "원가/마진 입력하기"}
              </button>
              <button
                onClick={addItem}
                className="text-sm font-medium text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Plus size={16} />
                항목 추가
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-neutral-200 text-sm text-neutral-500">
                  <th className="pb-3 font-medium w-[15%]">공정</th>
                  <th className="pb-3 font-medium w-[25%]">내용</th>
                  <th className="pb-3 font-medium w-[8%] text-center">수량</th>
                  <th className="pb-3 font-medium w-[15%] text-right">단가</th>
                  <th className="pb-3 font-medium w-[15%] text-right">
                    시공비
                  </th>
                  {showMargin && (
                    <th className="pb-3 font-medium w-[10%] text-right text-blue-600">
                      마진
                    </th>
                  )}
                  <th className="pb-3 font-medium w-[12%] text-right">금액</th>
                  <th className="pb-3 font-medium w-[5%]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {items.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <tr className="group">
                      <td className="py-3 pr-2 align-top">
                        <select
                          value={item.category}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "category",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-2 align-top">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "description",
                              e.target.value,
                            )
                          }
                          placeholder="상세 내용을 입력하세요"
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900"
                        />
                      </td>
                      <td className="py-3 px-2 align-top">
                        <input
                          type="number"
                          min="0"
                          value={item.quantity || ""}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "quantity",
                              Number(e.target.value),
                            )
                          }
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 text-center"
                        />
                      </td>
                      <td className="py-3 px-2 align-top">
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice || ""}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "unitPrice",
                              Number(e.target.value),
                            )
                          }
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 text-right"
                          placeholder="청구 단가"
                        />
                      </td>
                      <td className="py-3 px-2 align-top">
                        <input
                          type="number"
                          min="0"
                          value={item.laborCost || ""}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "laborCost",
                              Number(e.target.value),
                            )
                          }
                          className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 text-right"
                          placeholder="청구 시공비"
                        />
                      </td>
                      {showMargin && (
                        <td className="py-3 px-2 text-right font-medium text-blue-600 align-top pt-5">
                          {new Intl.NumberFormat("ko-KR").format(item.margin)}
                        </td>
                      )}
                      <td className="py-3 px-2 text-right font-medium text-neutral-900 align-top pt-5">
                        {new Intl.NumberFormat("ko-KR").format(item.amount)}
                      </td>
                      <td className="py-3 pl-2 text-right align-top pt-4">
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-neutral-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                    {showMargin && (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-0 border-b border-neutral-100 pb-4"
                        >
                          <div className="bg-blue-50/30 p-4 pl-12 border-l-2 border-blue-400 ml-2 rounded-r-lg">
                            {/* 자재/기타 원가 및 마진 */}
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="text-sm font-semibold text-blue-800 flex items-center gap-1.5">
                                  <Calculator size={14} />
                                  자재/기타 원가 및 마진 (단가 산정)
                                </h5>
                                <button
                                  onClick={() => addCostItem(item.id)}
                                  className="text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1"
                                >
                                  <Plus size={12} />
                                  원가 추가
                                </button>
                              </div>

                              {item.costItems.length > 0 ? (
                                <div className="space-y-2">
                                  {item.costItems.map((cItem, cIndex) => (
                                    <div
                                      key={cItem.id}
                                      className="flex items-center gap-2"
                                    >
                                      <span className="text-xs text-blue-400 w-4 text-center">
                                        {cIndex + 1}
                                      </span>
                                      <input
                                        type="text"
                                        value={cItem.description}
                                        onChange={(e) =>
                                          handleCostItemChange(
                                            item.id,
                                            cItem.id,
                                            "description",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="원가 내용 (예: 석고보드)"
                                        className="flex-1 px-3 py-1.5 bg-white border border-blue-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                      />
                                      <input
                                        type="number"
                                        min="0"
                                        value={cItem.quantity || ""}
                                        onChange={(e) =>
                                          handleCostItemChange(
                                            item.id,
                                            cItem.id,
                                            "quantity",
                                            Number(e.target.value),
                                          )
                                        }
                                        placeholder="수량"
                                        className="w-16 px-3 py-1.5 bg-white border border-blue-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-center"
                                      />
                                      <input
                                        type="number"
                                        min="0"
                                        value={cItem.unitPrice || ""}
                                        onChange={(e) =>
                                          handleCostItemChange(
                                            item.id,
                                            cItem.id,
                                            "unitPrice",
                                            Number(e.target.value),
                                          )
                                        }
                                        placeholder="단가"
                                        className="w-24 px-3 py-1.5 bg-white border border-blue-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-right"
                                      />
                                      <input
                                        type="number"
                                        value={cItem.margin || ""}
                                        onChange={(e) =>
                                          handleCostItemChange(
                                            item.id,
                                            cItem.id,
                                            "margin",
                                            Number(e.target.value),
                                          )
                                        }
                                        placeholder="마진"
                                        className="w-24 px-3 py-1.5 bg-white border border-blue-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-right"
                                      />
                                      <div className="w-24 text-right text-sm font-medium text-blue-900 px-2">
                                        {new Intl.NumberFormat("ko-KR").format(
                                          cItem.amount,
                                        )}
                                        원
                                      </div>
                                      <button
                                        onClick={() =>
                                          removeCostItem(item.id, cItem.id)
                                        }
                                        className="p-1.5 text-blue-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-blue-500 py-3 text-center bg-white/50 rounded-md border border-blue-100 border-dashed mb-2">
                                  등록된 원가 내역이 없습니다.
                                </div>
                              )}

                              <div className="mt-3 bg-white/60 p-3 rounded-md border border-blue-100 space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-blue-700">원가 합계</span>
                                  <span className="font-medium text-blue-900">
                                    {new Intl.NumberFormat("ko-KR").format(
                                      item.costItems.reduce(
                                        (sum, c) => sum + c.amount,
                                        0,
                                      ),
                                    )}
                                    원
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-blue-700">+ 자재 마진 합계</span>
                                  <span className="font-medium text-blue-900">
                                    {new Intl.NumberFormat("ko-KR").format(
                                      item.materialMargin,
                                    )}
                                    원
                                  </span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-blue-200/50">
                                  <span className="text-sm font-bold text-blue-900">
                                    = 청구 단가
                                  </span>
                                  <span className="font-bold text-blue-900">
                                    {new Intl.NumberFormat("ko-KR").format(
                                      item.unitPrice,
                                    )}
                                    원
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-8 flex flex-col md:flex-row justify-end border-t border-neutral-200 pt-6 gap-6">
            {showMargin && (
              <div className="w-full md:w-1/3 space-y-3 bg-blue-50 p-5 rounded-xl border border-blue-100">
                <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <Calculator size={16} />
                  마진 분석
                </h4>
                <div className="flex justify-between text-blue-800">
                  <span>총 원가</span>
                  <span>{formatCurrency(totalCost)}</span>
                </div>
                <div className="flex justify-between text-blue-800 font-bold">
                  <span>예상 총 마진</span>
                  <span>{formatCurrency(totalMargin)}</span>
                </div>
                <div className="flex justify-between text-blue-800 text-sm pt-2 border-t border-blue-200/50">
                  <span>마진율 (공급가액 기준)</span>
                  <span className="font-bold">
                    {subtotal > 0
                      ? Math.round((totalMargin / subtotal) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            )}

            <div className="w-full md:w-1/3 space-y-3">
              <div className="flex justify-between text-neutral-600">
                <span>공급가액</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-3 border-t border-neutral-200">
                <span>총 견적 금액 (VAT 별도)</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Notes */}
        <section className="bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-sm">
              3
            </span>
            특기사항 및 안내
          </h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all resize-y"
            placeholder="고객에게 전달할 특기사항, 결제 조건, 공사 유의사항 등을 입력하세요."
          />
        </section>
      </div>
    </div>
  );
}

// --- Quote Viewer Component ---
function QuoteViewer({
  quote,
  onBack,
  onEdit,
  onDelete,
}: {
  quote: Quote;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto pb-32 print:p-0 print:pb-0 print:max-w-none">
      {/* Action Bar (Hidden when printing) */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors font-medium"
        >
          <ChevronLeft size={20} />
          목록으로
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-xl font-medium text-neutral-700 hover:bg-neutral-50 transition-colors shadow-sm"
          >
            <Edit2 size={16} />
            수정
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors shadow-sm"
          >
            <Printer size={16} />
            인쇄 / PDF 저장
          </button>
          <div className="w-px h-6 bg-neutral-200 mx-1"></div>
          <button
            onClick={onDelete}
            className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Printable Document */}
      <div className="bg-white p-10 md:p-16 rounded-none md:rounded-2xl border border-neutral-200 shadow-sm print:shadow-none print:border-none print:p-0 max-w-[210mm] mx-auto min-h-[297mm]">
        {/* Document Header */}
        <div className="text-center mb-12 border-b-2 border-neutral-900 pb-8">
          <h1 className="text-4xl font-bold tracking-widest mb-2">견 적 서</h1>
          <p className="text-neutral-500 font-mono tracking-wider">ESTIMATE</p>
        </div>

        {/* Info Section */}
        <div className="flex flex-col md:flex-row justify-between mb-12 gap-8">
          <div className="flex-1">
            <div className="text-xl font-bold mb-4 border-b border-neutral-200 pb-2">
              <span className="text-2xl">{quote.client.name}</span> 귀하
            </div>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1.5 font-medium text-neutral-500 w-24">
                    견적일자
                  </td>
                  <td className="py-1.5">{formatDate(quote.date)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-medium text-neutral-500">
                    현장주소
                  </td>
                  <td className="py-1.5">{quote.client.address || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-medium text-neutral-500">
                    연락처
                  </td>
                  <td className="py-1.5">{quote.client.contact || "-"}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-medium text-neutral-500">
                    공사예정일
                  </td>
                  <td className="py-1.5">{quote.client.projectDate || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex-1 bg-neutral-50 p-6 rounded-xl border border-neutral-200">
            <h3 className="font-bold text-neutral-900 mb-4">공급자 정보</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1.5 font-medium text-neutral-500 w-20">
                    상호
                  </td>
                  <td className="py-1.5 font-bold">꼼꼼한 집수리</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-medium text-neutral-500">
                    대표자
                  </td>
                  <td className="py-1.5">홍길동</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-medium text-neutral-500">
                    연락처
                  </td>
                  <td className="py-1.5">02-1234-5678</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-medium text-neutral-500">주소</td>
                  <td className="py-1.5">서울시 서초구 서초대로 123</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Total Amount Highlight */}
        <div className="bg-neutral-900 text-white p-6 rounded-xl mb-12 flex items-center justify-between">
          <div className="text-lg font-medium opacity-80">
            총 견적 금액 (VAT 포함)
          </div>
          <div className="text-3xl font-bold tracking-tight">
            {formatCurrency(quote.total)}
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-sm mb-12 border-collapse">
          <thead>
            <tr className="border-y-2 border-neutral-900 bg-neutral-50">
              <th className="py-3 px-2 text-center font-bold w-12">NO</th>
              <th className="py-3 px-2 text-left font-bold w-[15%]">공정</th>
              <th className="py-3 px-2 text-left font-bold w-[35%]">내용</th>
              <th className="py-3 px-2 text-center font-bold w-[8%]">수량</th>
              <th className="py-3 px-2 text-right font-bold w-[15%]">단가</th>
              <th className="py-3 px-2 text-right font-bold w-[15%]">시공비</th>
              <th className="py-3 px-2 text-right font-bold w-[15%]">금액</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {quote.items.map((item, index) => (
              <React.Fragment key={item.id}>
                <tr className={item.costItems.length > 0 ? "bg-white" : ""}>
                  <td className="py-3 px-2 text-center text-neutral-500">
                    {index + 1}
                  </td>
                  <td className="py-3 px-2 font-medium text-neutral-900">{item.category}</td>
                  <td className="py-3 px-2 font-bold text-neutral-900">{item.description}</td>
                  <td className="py-3 px-2 text-center">{item.quantity}</td>
                  <td className="py-3 px-2 text-right">
                    {new Intl.NumberFormat("ko-KR").format(item.unitPrice)}
                  </td>
                  <td className="py-3 px-2 text-right">
                    {new Intl.NumberFormat("ko-KR").format(item.laborCost)}
                  </td>
                  <td className="py-3 px-2 text-right font-bold text-neutral-900">
                    {new Intl.NumberFormat("ko-KR").format(item.amount)}
                  </td>
                </tr>
                {item.costItems.map((cItem) => {
                  const customerAmount = cItem.amount + (cItem.margin || 0);
                  const customerUnitPrice = cItem.quantity > 0 ? customerAmount / cItem.quantity : 0;
                  return (
                    <tr key={cItem.id} className="bg-neutral-50/80 text-neutral-600">
                      <td className="py-2 px-2"></td>
                      <td className="py-2 px-2 text-sm text-neutral-400 text-right">자재/기타</td>
                      <td className="py-2 px-2 text-sm pl-4">
                        <span className="text-neutral-400 mr-2">└</span>
                        {cItem.description}
                      </td>
                      <td className="py-2 px-2 text-center text-sm">{cItem.quantity}</td>
                      <td className="py-2 px-2 text-right text-sm">
                        {new Intl.NumberFormat("ko-KR").format(customerUnitPrice)}
                      </td>
                      <td className="py-2 px-2 text-right text-sm text-neutral-400">-</td>
                      <td className="py-2 px-2 text-right text-sm">
                        {new Intl.NumberFormat("ko-KR").format(customerAmount)}
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-neutral-900">
              <td
                colSpan={6}
                className="py-3 px-2 text-right font-medium text-neutral-600"
              >
                공급가액
              </td>
              <td className="py-3 px-2 text-right font-medium">
                {formatCurrency(quote.subtotal)}
              </td>
            </tr>
            <tr className="border-t-2 border-neutral-900 bg-neutral-50">
              <td
                colSpan={6}
                className="py-4 px-2 text-right font-bold text-lg"
              >
                합계 금액 (VAT 별도)
              </td>
              <td className="py-4 px-2 text-right font-bold text-lg">
                {formatCurrency(quote.total)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Notes */}
        {quote.notes && (
          <div className="border border-neutral-200 rounded-xl p-6 bg-neutral-50/50">
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <FileText size={16} />
              특기사항
            </h4>
            <div className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
              {quote.notes}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-neutral-500">
          <p>위와 같이 견적서를 제출합니다.</p>
          <p className="mt-4 font-bold text-neutral-900">꼼꼼한 집수리 (인)</p>
        </div>
      </div>
    </div>
  );
}
