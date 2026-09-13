import type { ExternalBlob } from "@caffeineai/object-storage";
import type { Principal } from "@icp-sdk/core/principal";

export type DocumentCategory =
  | "education"
  | "identity"
  | "finance"
  | "insurance"
  | "projects"
  | "achievements";

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  "education",
  "identity",
  "finance",
  "insurance",
  "projects",
  "achievements",
];

/**
 * A document as returned by the backend. When a document is password-protected
 * and the caller has not yet verified the password, the backend redacts the
 * optional detail fields (name, fileType, category, summary, blob) and sets
 * `locked` to true. `hasPassword` is always present so the UI can show a lock
 * badge even when the details are hidden.
 */
export interface DocumentView {
  id: bigint;
  owner: Principal;
  name?: string;
  fileType?: string;
  uploadedAt: bigint;
  category?: DocumentCategory;
  metadata: string[];
  summary?: string;
  blob?: ExternalBlob;
  locked: boolean;
  hasPassword: boolean;
}

/** True when the document is password-protected and its details are redacted. */
export function isLockedDocument(doc: Pick<DocumentView, "locked">): boolean {
  return doc.locked;
}

export interface Document {
  id: string;
  name: string;
  mimeType: string;
  category: DocumentCategory;
  uploadedAt: bigint;
  size: number;
  blob: ExternalBlob;
}

export interface DocumentSummary {
  id: string;
  name: string;
  mimeType: string;
  category: DocumentCategory;
  uploadedAt: bigint;
  size: number;
}

export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isImageFile(filename: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(filename);
}
