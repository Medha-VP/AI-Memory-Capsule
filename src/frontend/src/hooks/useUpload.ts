import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { ExternalBlob } from "@caffeineai/object-storage";
import { useState } from "react";

/**
 * Shared object-storage upload helper. Prepares a browser File as an
 * ExternalBlob (with upload progress) and passes it to the backend
 * `uploadDocument` method, forwarding an optional per-document password.
 * Returns the new document id on success.
 */
export function useUploadDocument() {
  const { actor } = useActor(createActor);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const upload = async (
    file: File,
    password: string | null,
  ): Promise<bigint> => {
    if (!actor) throw new Error("Backend is not ready");
    setIsUploading(true);
    setProgress(0);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const blob = ExternalBlob.fromBytes(
      bytes,
      file.type,
      file.name,
    ).withUploadProgress((pct) => {
      setProgress(pct);
    });
    try {
      return await actor.uploadDocument(file.name, file.type, blob, password);
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return { progress, isUploading, upload };
}
