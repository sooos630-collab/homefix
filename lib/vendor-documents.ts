import type { VendorDocumentType } from "./types";

const DB_NAME = "homefix_vendor_docs";
const STORE_NAME = "vendor_documents";
const DB_VERSION = 1;

export interface VendorStoredDocument {
  id: string;
  vendorId: string;
  type: VendorDocumentType;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
}

export interface VendorDocumentDraft {
  type: VendorDocumentType;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
}

function createDocumentId(vendorId: string, type: VendorDocumentType) {
  return `${vendorId}:${type}`;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not available"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error ?? new Error("Failed to open IndexedDB"));
    };

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("vendorId", "vendorId", { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

function readAll<T = VendorStoredDocument>(
  request: IDBRequest<T[]>,
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    request.onerror = () => {
      reject(request.error ?? new Error("IndexedDB read failed"));
    };
    request.onsuccess = () => {
      resolve(request.result ?? []);
    };
  });
}

function readOne<T = VendorStoredDocument | undefined>(
  request: IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onerror = () => {
      reject(request.error ?? new Error("IndexedDB read failed"));
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

function runWrite<T>(request: IDBRequest<T>): Promise<void> {
  return new Promise((resolve, reject) => {
    request.onerror = () => {
      reject(request.error ?? new Error("IndexedDB write failed"));
    };
    request.onsuccess = () => {
      resolve();
    };
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  });
}

export async function createDocumentDraft(
  type: VendorDocumentType,
  file: File,
): Promise<VendorDocumentDraft> {
  const dataUrl = await fileToDataUrl(file);

  return {
    type,
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    dataUrl,
    uploadedAt: new Date().toISOString(),
  };
}

export async function listVendorDocuments(
  vendorId: string,
): Promise<VendorStoredDocument[]> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("vendorId");
    const result = await readAll<VendorStoredDocument>(index.getAll(vendorId));
    db.close();
    return result;
  } catch {
    return [];
  }
}

export async function getVendorDocument(
  vendorId: string,
  type: VendorDocumentType,
): Promise<VendorStoredDocument | undefined> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const result = await readOne<VendorStoredDocument | undefined>(
      store.get(createDocumentId(vendorId, type)),
    );
    db.close();
    return result;
  } catch {
    return undefined;
  }
}

export async function saveVendorDocument(
  vendorId: string,
  document: VendorDocumentDraft,
): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  await runWrite(
    store.put({
      id: createDocumentId(vendorId, document.type),
      vendorId,
      ...document,
    } satisfies VendorStoredDocument),
  );

  db.close();
}

export async function deleteVendorDocument(
  vendorId: string,
  type: VendorDocumentType,
): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    await runWrite(store.delete(createDocumentId(vendorId, type)));
    db.close();
  } catch {
    // Ignore missing document storage errors in the client.
  }
}

export async function deleteVendorDocuments(vendorId: string): Promise<void> {
  const documents = await listVendorDocuments(vendorId);
  await Promise.all(
    documents.map((document) => deleteVendorDocument(vendorId, document.type)),
  );
}
