"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { QuoteEditor } from "@/components/QuoteEditor";
import { QuoteViewer } from "@/components/QuoteViewer";
import {
  fetchQuotes,
  upsertQuote,
  deleteQuote as deleteQuoteFromDB,
  updateQuoteStatus,
  updateQuoteSettlement,
} from "@/lib/supabase-quotes";
import { SettlementModal } from "@/components/SettlementModal";
import type { Quote, QuoteStatus, Settlement } from "@/lib/types";

export default function Home() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<
    "dashboard" | "editor" | "viewer"
  >("dashboard");
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
  const [settlementQuote, setSettlementQuote] = useState<Quote | null>(null);

  const loadQuotes = useCallback(async () => {
    setLoading(true);
    const data = await fetchQuotes();
    setQuotes(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

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

  const handleDelete = async (id: string) => {
    if (confirm("정말로 이 견적서를 삭제하시겠습니까?")) {
      const success = await deleteQuoteFromDB(id);
      if (success) {
        setQuotes(quotes.filter((q) => q.id !== id));
        if (viewingQuote?.id === id) setCurrentView("dashboard");
      }
    }
  };

  const handleSaveQuote = async (quote: Quote) => {
    const success = await upsertQuote(quote);
    if (success) {
      if (editingQuote) {
        setQuotes(quotes.map((q) => (q.id === quote.id ? quote : q)));
      } else {
        setQuotes([quote, ...quotes]);
      }
      setViewingQuote(quote);
      setCurrentView("viewer");
    }
  };

  const handleUpdateStatus = async (id: string, status: QuoteStatus) => {
    if (status === "시공완료") {
      const quote = quotes.find((q) => q.id === id);
      if (quote) {
        setSettlementQuote(quote);
      }
      return;
    }
    const success = await updateQuoteStatus(id, status);
    if (success) {
      setQuotes(quotes.map((q) => (q.id === id ? { ...q, status } : q)));
    }
  };

  const handleSettlementConfirm = async (settlement: Settlement) => {
    if (!settlementQuote) return;
    const success = await updateQuoteSettlement(settlementQuote.id, settlement);
    if (success) {
      setQuotes(
        quotes.map((q) =>
          q.id === settlementQuote.id
            ? { ...q, status: "시공완료" as QuoteStatus, settlement }
            : q,
        ),
      );
    }
    setSettlementQuote(null);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row font-sans text-neutral-900 print:block print:bg-white print:min-h-0">
      <Sidebar
        currentView={currentView}
        editingQuote={editingQuote}
        onNavigate={setCurrentView}
        onCreateNew={handleCreateNew}
      />
      <main className="flex-1 overflow-y-auto print:overflow-visible print:block print:flex-none print:w-full">
        {currentView === "dashboard" && (
          <Dashboard
            quotes={quotes}
            loading={loading}
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
      {settlementQuote && (
        <SettlementModal
          quote={settlementQuote}
          onConfirm={handleSettlementConfirm}
          onCancel={() => setSettlementQuote(null)}
        />
      )}
    </div>
  );
}
