"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { QuoteEditor } from "@/components/QuoteEditor";
import { QuoteViewer } from "@/components/QuoteViewer";
import { initialQuotes } from "@/data/initial-quotes";
import type { Quote, QuoteStatus } from "@/lib/types";

export default function Home() {
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
      <Sidebar
        currentView={currentView}
        editingQuote={editingQuote}
        onNavigate={setCurrentView}
        onCreateNew={handleCreateNew}
      />
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
