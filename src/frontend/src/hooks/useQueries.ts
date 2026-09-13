import { createActor } from "@/backend";
import type { DocumentView } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useGetCallerUserRole() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["callerUserRole"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useListDocuments() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      if (!actor) return [] as DocumentView[];
      return actor.listDocuments();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetDocument(id: bigint, password?: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["document", id.toString(), password ?? ""],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDocument(id, password ?? null);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetDocumentPassword() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, password }: { id: bigint; password: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setDocumentPassword(id, password);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useChangeDocumentPassword() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, password }: { id: bigint; password: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.changeDocumentPassword(id, password);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useRemoveDocumentPassword() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.removeDocumentPassword(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useVerifyDocumentPassword() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async ({ id, password }: { id: bigint; password: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.verifyDocumentPassword(id, password);
    },
  });
}
