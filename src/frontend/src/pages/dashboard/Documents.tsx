import { createActor } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useChangeDocumentPassword,
  useGetDocument,
  useRemoveDocumentPassword,
  useSetDocumentPassword,
  useVerifyDocumentPassword,
} from "@/hooks/useQueries";
import { useUploadDocument } from "@/hooks/useUpload";
import {
  type DocumentCategory,
  type DocumentView,
  isImageFile,
  timestampToDate,
} from "@/types";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  FileUp,
  KeyRound,
  Loader2,
  Lock,
  LockOpen,
  Search,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

const CATEGORY_META: Record<
  DocumentCategory,
  { label: string; className: string }
> = {
  education: {
    label: "Education",
    className: "border-primary/40 bg-primary/15 text-primary",
  },
  identity: {
    label: "Identity",
    className: "border-accent/40 bg-accent/15 text-accent",
  },
  finance: {
    label: "Finance",
    className: "border-chart-3/40 bg-chart-3/15 text-chart-3",
  },
  insurance: {
    label: "Insurance",
    className: "border-chart-4/40 bg-chart-4/15 text-chart-4",
  },
  projects: {
    label: "Projects",
    className: "border-chart-5/40 bg-chart-5/15 text-chart-5",
  },
  achievements: {
    label: "Achievements",
    className: "border-chart-2/40 bg-chart-2/15 text-chart-2",
  },
};

function formatDate(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "Unknown date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function fileExtension(fileType?: string): string {
  if (!fileType) return "FILE";
  const match = fileType.match(/\/(\w+)$/);
  return match ? match[1].toUpperCase() : "FILE";
}

export default function Documents() {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { progress, isUploading, upload } = useUploadDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<DocumentView | null>(null);
  const [selectedPassword, setSelectedPassword] = useState<string | undefined>(
    undefined,
  );
  const [dragActive, setDragActive] = useState(false);

  // Upload dialog state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPassword, setUploadPassword] = useState("");

  // Unlock dialog state
  const [pendingOpen, setPendingOpen] = useState<DocumentView | null>(null);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState(false);

  // Password management dialog state
  const [manageDoc, setManageDoc] = useState<DocumentView | null>(null);
  const [managePassword, setManagePassword] = useState("");

  const currentPrincipal = identity?.getPrincipal().toString() ?? "";

  const documentsQuery = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      if (!actor) return [] as DocumentView[];
      return actor.listDocuments();
    },
    enabled: !!actor && !isFetching,
  });

  const fullDocQuery = useGetDocument(selected?.id ?? 0n, selectedPassword);
  const viewDoc = fullDocQuery.data ?? selected;

  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      password,
    }: {
      file: File;
      password: string | null;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return upload(file, password);
    },
    onSuccess: () => {
      toast.success("Document uploaded and classified");
      setUploadFile(null);
      setUploadPassword("");
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Upload failed");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteDocument(id);
    },
    onSuccess: (deleted) => {
      if (deleted) {
        toast.success("Document deleted");
        setSelected(null);
        void queryClient.invalidateQueries({ queryKey: ["documents"] });
      } else {
        toast.error("Document could not be deleted");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Delete failed");
    },
  });

  const verifyMutation = useVerifyDocumentPassword();
  const setPasswordMutation = useSetDocumentPassword();
  const changePasswordMutation = useChangeDocumentPassword();
  const removePasswordMutation = useRemoveDocumentPassword();

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadFile(files[0]);
    setUploadPassword("");
  }, []);

  const handleUnlock = () => {
    if (!pendingOpen) return;
    setUnlockError(false);
    verifyMutation.mutate(
      { id: pendingOpen.id, password: unlockPassword },
      {
        onSuccess: (ok) => {
          if (ok) {
            setSelected(pendingOpen);
            setSelectedPassword(unlockPassword);
            setPendingOpen(null);
            setUnlockPassword("");
          } else {
            setUnlockError(true);
          }
        },
        onError: () => {
          setUnlockError(true);
        },
      },
    );
  };

  const handleSetPassword = () => {
    if (!manageDoc) return;
    setPasswordMutation.mutate(
      { id: manageDoc.id, password: managePassword },
      {
        onSuccess: (result) => {
          if (result.__kind__ === "ok") {
            toast.success("Password set");
            setManageDoc(null);
            setManagePassword("");
          } else {
            toast.error("Could not set password");
          }
        },
        onError: (error: Error) => {
          toast.error(error.message || "Could not set password");
        },
      },
    );
  };

  const handleChangePassword = () => {
    if (!manageDoc) return;
    changePasswordMutation.mutate(
      { id: manageDoc.id, password: managePassword },
      {
        onSuccess: (result) => {
          if (result.__kind__ === "ok") {
            toast.success("Password updated");
            setManageDoc(null);
            setManagePassword("");
          } else {
            toast.error("Could not update password");
          }
        },
        onError: (error: Error) => {
          toast.error(error.message || "Could not update password");
        },
      },
    );
  };

  const handleRemovePassword = () => {
    if (!manageDoc) return;
    removePasswordMutation.mutate(manageDoc.id, {
      onSuccess: (result) => {
        if (result.__kind__ === "ok") {
          toast.success("Password removed");
          setManageDoc(null);
        } else {
          toast.error("Could not remove password");
        }
      },
      onError: (error: Error) => {
        toast.error(error.message || "Could not remove password");
      },
    });
  };

  const filtered = (documentsQuery.data ?? []).filter((doc) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (doc.name?.toLowerCase().includes(q) ?? false) ||
      (doc.category?.toLowerCase().includes(q) ?? false)
    );
  });

  const isLoading = documentsQuery.isLoading || isFetching;

  const openDocument = (doc: DocumentView) => {
    if (doc.locked) {
      setPendingOpen(doc);
      setUnlockPassword("");
      setUnlockError(false);
    } else {
      setSelected(doc);
      setSelectedPassword(undefined);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Documents
          </h1>
          <p className="text-sm text-muted-foreground">
            Upload, classify, and manage your memory capsule documents.
          </p>
        </div>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          data-ocid="documents.upload_button"
        >
          {isUploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileUp className="size-4" />
          )}
          {isUploading ? "Uploading…" : "Upload document"}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
        data-ocid="documents.file_input"
      />

      {isUploading && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="flex items-center gap-4 py-4">
            <UploadCloud className="size-5 shrink-0 text-accent" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">Uploading and classifying…</p>
              <Progress value={progress} className="h-1.5" />
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </CardContent>
        </Card>
      )}

      <Card
        className="relative overflow-hidden"
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>All documents</CardTitle>
            <CardDescription>
              {documentsQuery.data
                ? `${documentsQuery.data.length} stored in your capsule`
                : "Loading your capsule…"}
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or category…"
              className="pl-9"
              data-ocid="documents.search_input"
            />
          </div>
        </CardHeader>
        <CardContent>
          {dragActive && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center border-2 border-dashed border-accent bg-background/80 backdrop-blur-sm">
              <p className="font-display text-lg font-semibold text-accent">
                Drop to upload
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3" data-ocid="documents.loading_state">
              {["a", "b", "c", "d"].map((key) => (
                <Skeleton key={key} className="h-14 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-3 py-16 text-center"
              data-ocid="documents.empty_state"
            >
              <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary">
                <FileText className="size-7 text-muted-foreground" />
              </div>
              <div>
                <p className="font-display font-semibold">
                  {search ? "No matching documents" : "No documents yet"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {search
                    ? "Try a different search term."
                    : "Upload your first PDF or image to begin building your capsule."}
                </p>
              </div>
              {!search && (
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  data-ocid="documents.empty_upload_button"
                >
                  <FileUp className="size-4" />
                  Upload a document
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-ocid="documents.list">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Classification</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((doc, index) => {
                    const meta = doc.category
                      ? CATEGORY_META[doc.category]
                      : null;
                    const isLocked = doc.locked;
                    return (
                      <TableRow
                        key={doc.id.toString()}
                        className="cursor-pointer"
                        onClick={() => openDocument(doc)}
                        data-ocid={`documents.row.${index + 1}`}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                              {isLocked ? (
                                <Lock className="size-4 text-accent" />
                              ) : (
                                <FileText className="size-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span
                                className={`block max-w-[200px] truncate ${
                                  isLocked ? "masked-text" : ""
                                }`}
                              >
                                {doc.name ?? "Protected document"}
                              </span>
                              {doc.hasPassword && (
                                <span
                                  className="lock-badge mt-0.5"
                                  data-ocid={`documents.lock_badge.${index + 1}`}
                                >
                                  <Lock className="size-3" />
                                  Protected
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-mono text-xs text-muted-foreground ${
                              isLocked ? "masked-text" : ""
                            }`}
                          >
                            {fileExtension(doc.fileType)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {meta ? (
                            <Badge
                              variant="outline"
                              className={meta.className}
                              data-ocid={`documents.category_badge.${index + 1}`}
                            >
                              {meta.label}
                            </Badge>
                          ) : (
                            <span className="lock-badge">
                              <Lock className="size-3" />
                              Hidden
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(doc.uploadedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${doc.name ?? "document"}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMutation.mutate(doc.id);
                            }}
                            disabled={deleteMutation.isPending}
                            data-ocid={`documents.delete_button.${index + 1}`}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload dialog with optional password */}
      <Dialog
        open={uploadFile !== null}
        onOpenChange={(open) => {
          if (!open) setUploadFile(null);
        }}
      >
        <DialogContent className="max-w-md" data-ocid="documents.upload_dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="size-5 text-accent" />
              Upload document
            </DialogTitle>
            <DialogDescription>
              {uploadFile?.name} — optionally protect it with a password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="upload-password">Password (optional)</Label>
              <Input
                id="upload-password"
                type="password"
                value={uploadPassword}
                onChange={(e) => setUploadPassword(e.target.value)}
                placeholder="Leave blank for no password"
                data-ocid="documents.upload_password_input"
              />
              <p className="text-xs text-muted-foreground">
                A password hides this document's details from others until they
                enter it.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploadFile(null)}
              data-ocid="documents.upload_cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                uploadMutation.mutate({
                  file: uploadFile!,
                  password: uploadPassword.trim() ? uploadPassword : null,
                })
              }
              disabled={uploadMutation.isPending}
              data-ocid="documents.upload_confirm_button"
            >
              {uploadMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UploadCloud className="size-4" />
              )}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unlock password prompt */}
      <Dialog
        open={pendingOpen !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingOpen(null);
            setUnlockError(false);
          }
        }}
      >
        <DialogContent className="max-w-md" data-ocid="documents.unlock_dialog">
          {pendingOpen && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/15">
                    <Lock className="size-5 text-accent" />
                  </div>
                  Unlock Document
                </DialogTitle>
                <DialogDescription>
                  This document is password protected. Enter the password to
                  view its contents.
                </DialogDescription>
              </DialogHeader>
              <div
                className={`space-y-3 ${unlockError ? "animate-shake" : ""}`}
              >
                <div className="space-y-2">
                  <Label htmlFor="unlock-password">Password</Label>
                  <Input
                    id="unlock-password"
                    type="password"
                    value={unlockPassword}
                    onChange={(e) => {
                      setUnlockPassword(e.target.value);
                      if (unlockError) setUnlockError(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUnlock();
                    }}
                    placeholder="Enter document password"
                    className="font-mono focus-visible:ring-accent/60"
                    autoFocus
                    data-ocid="documents.unlock_password_input"
                  />
                </div>
                {unlockError && (
                  <p
                    className="text-sm font-medium text-destructive"
                    data-ocid="documents.unlock_error"
                  >
                    Incorrect password. Please try again.
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPendingOpen(null);
                    setUnlockError(false);
                  }}
                  data-ocid="documents.unlock_cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUnlock}
                  disabled={verifyMutation.isPending || !unlockPassword}
                  className="bg-gradient-primary"
                  data-ocid="documents.unlock_button"
                >
                  {verifyMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <LockOpen className="size-4" />
                  )}
                  Unlock
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setSelectedPassword(undefined);
          }
        }}
      >
        <DialogContent
          className="max-w-2xl"
          data-ocid="documents.detail_dialog"
        >
          {viewDoc && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 pr-8">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-primary">
                    <FileText className="size-5 text-primary-foreground" />
                  </div>
                  <span className="truncate">
                    {viewDoc.name ?? "Protected document"}
                  </span>
                </DialogTitle>
                <DialogDescription>
                  Extracted metadata and AI classification
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1 rounded-xl border bg-secondary/40 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Classification
                  </p>
                  {viewDoc.category ? (
                    <Badge
                      variant="outline"
                      className={CATEGORY_META[viewDoc.category].className}
                      data-ocid="documents.detail_category_badge"
                    >
                      {CATEGORY_META[viewDoc.category].label}
                    </Badge>
                  ) : (
                    <p className="text-sm text-muted-foreground">Hidden</p>
                  )}
                </div>
                <div className="space-y-1 rounded-xl border bg-secondary/40 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    File type
                  </p>
                  <p className="font-mono text-sm">
                    {viewDoc.fileType ?? "Hidden"}
                  </p>
                </div>
                <div className="space-y-1 rounded-xl border bg-secondary/40 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Uploaded
                  </p>
                  <p className="text-sm">{formatDate(viewDoc.uploadedAt)}</p>
                </div>
                {viewDoc.hasPassword && (
                  <div className="space-y-1 rounded-xl border border-accent/30 bg-accent/10 p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Protection
                    </p>
                    <span className="lock-badge">
                      <ShieldCheck className="size-3" />
                      Password protected
                    </span>
                  </div>
                )}
              </div>

              {viewDoc.summary && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Summary
                  </p>
                  <p className="rounded-xl border bg-secondary/40 p-4 text-sm leading-relaxed">
                    {viewDoc.summary}
                  </p>
                </div>
              )}

              {viewDoc.metadata.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Extracted metadata
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {viewDoc.metadata.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border bg-secondary/40 px-3 py-1 font-mono text-xs"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {viewDoc.name && isImageFile(viewDoc.name) && viewDoc.blob && (
                <div className="overflow-hidden rounded-xl border">
                  <img
                    src={viewDoc.blob.getDirectURL()}
                    alt={viewDoc.name}
                    className="max-h-72 w-full object-contain bg-secondary/20"
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  {viewDoc.owner.toString() === currentPrincipal && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setManageDoc(viewDoc);
                        setManagePassword("");
                      }}
                      data-ocid="documents.manage_password_button"
                    >
                      <KeyRound className="size-4" />
                      {viewDoc.hasPassword ? "Change password" : "Set password"}
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(viewDoc.id)}
                    disabled={deleteMutation.isPending}
                    data-ocid="documents.detail_delete_button"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                    Delete
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelected(null)}
                  data-ocid="documents.detail_close_button"
                >
                  <X className="size-4" />
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Password management dialog */}
      <Dialog
        open={manageDoc !== null}
        onOpenChange={(open) => {
          if (!open) setManageDoc(null);
        }}
      >
        <DialogContent
          className="max-w-md"
          data-ocid="documents.manage_password_dialog"
        >
          {manageDoc && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <KeyRound className="size-5 text-accent" />
                  {manageDoc.hasPassword ? "Change password" : "Set password"}
                </DialogTitle>
                <DialogDescription>
                  {manageDoc.hasPassword
                    ? "Update the password protecting this document."
                    : "Add a password to protect this document's details."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="manage-password">
                  {manageDoc.hasPassword ? "New password" : "Password"}
                </Label>
                <Input
                  id="manage-password"
                  type="password"
                  value={managePassword}
                  onChange={(e) => setManagePassword(e.target.value)}
                  placeholder="Enter a password"
                  className="font-mono"
                  data-ocid="documents.manage_password_input"
                />
              </div>
              <DialogFooter className="flex-wrap gap-2">
                {manageDoc.hasPassword && (
                  <Button
                    variant="destructive"
                    onClick={handleRemovePassword}
                    disabled={removePasswordMutation.isPending}
                    className="mr-auto"
                    data-ocid="documents.remove_password_button"
                  >
                    {removePasswordMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <LockOpen className="size-4" />
                    )}
                    Remove password
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setManageDoc(null)}
                  data-ocid="documents.manage_password_cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  onClick={
                    manageDoc.hasPassword
                      ? handleChangePassword
                      : handleSetPassword
                  }
                  disabled={
                    !managePassword ||
                    setPasswordMutation.isPending ||
                    changePasswordMutation.isPending
                  }
                  data-ocid="documents.manage_password_save_button"
                >
                  {(setPasswordMutation.isPending ||
                    changePasswordMutation.isPending) && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  Save
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
