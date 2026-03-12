"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ExecutiveDashboard } from "@/components/ExecutiveDashboard";
import { Dashboard } from "@/components/Dashboard";
import { QuoteEditor } from "@/components/QuoteEditor";
import { QuoteViewer } from "@/components/QuoteViewer";
import { SettlementPage } from "@/components/SettlementPage";
import { SettlementList } from "@/components/SettlementList";
import { VendorList } from "@/components/VendorList";
import {
  fetchQuotes,
  upsertQuote,
  deleteQuote as deleteQuoteFromDB,
  updateQuoteStatus,
  updateQuoteSettlement,
} from "@/lib/supabase-quotes";
import type { Quote, QuoteStatus, QuoteVersion, Settlement } from "@/lib/types";

export default function Home() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<
    | "overview"
    | "quotes"
    | "editor"
    | "viewer"
    | "settlement"
    | "settlements"
    | "vendors-purchase"
    | "vendors-partner"
  >("overview");
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
  const [settlementQuote, setSettlementQuote] = useState<Quote | null>(null);
  const [editModal, setEditModal] = useState(false);

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
    setEditModal(true);
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
        if (viewingQuote?.id === id) setCurrentView("quotes");
      }
    }
  };

  const handleSaveQuote = async (quote: Quote) => {
    let quoteWithVersions = { ...quote };

    // 기존 견적서 수정 시 이전 상태를 버전으로 저장
    if (editingQuote) {
      const prev = quotes.find((q) => q.id === quote.id);
      if (prev) {
        const existingVersions: QuoteVersion[] = prev.versions || [];
        const newVersion: QuoteVersion = {
          version: existingVersions.length + 1,
          savedAt: new Date().toISOString(),
          date: prev.date,
          client: prev.client,
          items: prev.items,
          subtotal: prev.subtotal,
          tax: prev.tax,
          total: prev.total,
          totalCost: prev.totalCost,
          totalMargin: prev.totalMargin,
          notes: prev.notes,
        };
        quoteWithVersions.versions = [...existingVersions, newVersion];
      }
    }

    const success = await upsertQuote(quoteWithVersions);
    if (success) {
      if (editingQuote) {
        setQuotes(quotes.map((q) => (q.id === quoteWithVersions.id ? quoteWithVersions : q)));
      } else {
        setQuotes([quoteWithVersions, ...quotes]);
      }
      setViewingQuote(quoteWithVersions);
      if (editModal) {
        setEditModal(false);
        setEditingQuote(null);
      } else {
        setCurrentView("viewer");
      }
    }
  };

  const handleUpdateStatus = async (id: string, status: QuoteStatus) => {
    if (status === "시공완료") {
      const quote = quotes.find((q) => q.id === id);
      if (quote) {
        setSettlementQuote(quote);
        setCurrentView("settlement");
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
      const updatedQuote = { ...settlementQuote, status: "시공완료" as QuoteStatus, settlement };
      setQuotes(
        quotes.map((q) =>
          q.id === settlementQuote.id ? updatedQuote : q,
        ),
      );
      // 정산 완료 후 견적서 뷰어로 이동하여 정산 결과 확인
      setViewingQuote(updatedQuote);
      setCurrentView("viewer");
    } else {
      setCurrentView("quotes");
    }
    setSettlementQuote(null);
  };

  return (
    <div className="min-h-screen bg-toss-bg flex flex-col md:flex-row text-toss-text print:block print:bg-white print:min-h-0">
      <Sidebar
        currentView={currentView}
        editingQuote={editingQuote}
        onNavigate={setCurrentView}
        onCreateNew={handleCreateNew}
      />
      <main className="flex-1 overflow-y-auto print:overflow-visible print:block print:flex-none print:w-full">
        {currentView === "overview" && (
          <ExecutiveDashboard
            quotes={quotes}
            onNavigate={(view) => setCurrentView(view)}
          />
        )}
        {currentView === "quotes" && (
          <Dashboard
            quotes={quotes}
            loading={loading}
            onCreateNew={handleCreateNew}
            onView={handleView}
            onDelete={handleDelete}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
        {currentView === "editor" && !editModal && (
          <QuoteEditor
            initialQuote={editingQuote}
            onSave={handleSaveQuote}
            onCancel={() =>
              setCurrentView(editingQuote ? "viewer" : "quotes")
            }
          />
        )}
        {currentView === "viewer" && viewingQuote && (
          <QuoteViewer
            quote={viewingQuote}
            onBack={() => setCurrentView("quotes")}
            onEdit={() => handleEdit(viewingQuote)}
            onDelete={() => handleDelete(viewingQuote.id)}
            onSettlement={() => {
              setSettlementQuote(viewingQuote);
              setCurrentView("settlement");
            }}
          />
        )}
        {currentView === "settlements" && (
          <SettlementList
            quotes={quotes}
            onView={(q) => {
              setViewingQuote(q);
              setCurrentView("viewer");
            }}
            onSettle={(q) => {
              setSettlementQuote(q);
              setCurrentView("settlement");
            }}
          />
        )}
        {currentView === "vendors-purchase" && (
          <VendorList
            vendorType="purchase"
            quotes={quotes}
            onViewQuote={handleView}
            onNavigateVendorType={(vendorType) =>
              setCurrentView(vendorType === "purchase" ? "vendors-purchase" : "vendors-partner")
            }
          />
        )}
        {currentView === "vendors-partner" && (
          <VendorList
            vendorType="partner"
            quotes={quotes}
            onViewQuote={handleView}
            onNavigateVendorType={(vendorType) =>
              setCurrentView(vendorType === "purchase" ? "vendors-purchase" : "vendors-partner")
            }
          />
        )}
        {currentView === "settlement" && settlementQuote && (
          <SettlementPage
            quote={settlementQuote}
            onConfirm={handleSettlementConfirm}
            onCancel={() => {
              setSettlementQuote(null);
              setCurrentView("quotes");
            }}
          />
        )}
      </main>

      {/* 견적서 수정 모달 */}
      {editModal && editingQuote && (
        <div className="fixed inset-0 z-[100] print:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              if (window.confirm("수정을 취소하시겠습니까?")) {
                setEditModal(false);
                setEditingQuote(null);
              }
            }}
          />
          <div className="absolute inset-2 md:inset-6 lg:inset-x-[10%] lg:inset-y-4 bg-toss-bg rounded-2xl overflow-hidden flex flex-col shadow-2xl">
            <QuoteEditor
              initialQuote={editingQuote}
              onSave={handleSaveQuote}
              onCancel={() => {
                setEditModal(false);
                setEditingQuote(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
