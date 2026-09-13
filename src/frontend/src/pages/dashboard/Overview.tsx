import { createActor } from "@/backend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DOCUMENT_CATEGORIES, type DocumentCategory } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  FolderOpen,
  GraduationCap,
  HeartPulse,
  IdCard,
  Layers,
  Rocket,
  Trophy,
} from "lucide-react";

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  education: "Education",
  identity: "Identity",
  finance: "Finance",
  insurance: "Insurance",
  projects: "Projects",
  achievements: "Achievements",
};

const CATEGORY_ICONS: Record<DocumentCategory, typeof FileText> = {
  education: GraduationCap,
  identity: IdCard,
  finance: Layers,
  insurance: HeartPulse,
  projects: Rocket,
  achievements: Trophy,
};

function useGetAnalyticsOverview() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["analyticsOverview"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAnalyticsOverview();
    },
    enabled: !!actor && !isFetching,
  });
}

export default function Overview() {
  const { data, isLoading } = useGetAnalyticsOverview();

  const total = data?.totalDocuments ?? 0n;
  const byCategory = data?.byCategory ?? [];

  const countFor = (category: DocumentCategory): bigint => {
    const entry = byCategory.find((c) => c.category === category);
    return entry?.count ?? 0n;
  };

  const maxCount = byCategory.reduce(
    (max, c) => (c.count > max ? c.count : max),
    0n,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Overview
        </h1>
        <p className="text-sm text-muted-foreground">
          Your document vault at a glance.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="relative overflow-hidden border-accent/20 bg-gradient-to-br from-card to-accent/5">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-primary">
              <FileText className="size-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total documents
              </p>
              {isLoading ? (
                <Skeleton className="mt-2 h-8 w-16" />
              ) : (
                <p className="font-display text-3xl font-bold tabular-nums">
                  {total.toString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {DOCUMENT_CATEGORIES.slice(0, 3).map((category) => {
          const Icon = CATEGORY_ICONS[category];
          return (
            <Card key={category}>
              <CardContent className="flex items-center gap-4 py-5">
                <div className="flex size-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <Icon className="size-6" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {CATEGORY_LABELS[category]}
                  </p>
                  {isLoading ? (
                    <Skeleton className="mt-2 h-8 w-12" />
                  ) : (
                    <p className="font-display text-3xl font-bold tabular-nums">
                      {countFor(category).toString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Category breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <FolderOpen className="size-4 text-accent" />
            Documents by category
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {DOCUMENT_CATEGORIES.map((category) => (
                <Skeleton key={category} className="h-9 w-full" />
              ))}
            </div>
          ) : total === 0n ? (
            <div
              data-ocid="overview.empty_state"
              className="flex flex-col items-center justify-center gap-3 py-10 text-center"
            >
              <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary">
                <FolderOpen className="size-7 text-muted-foreground" />
              </div>
              <p className="font-display text-lg font-semibold">
                No documents yet
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Upload your first document to start building your memory
                capsule. Your vault will appear here once populated.
              </p>
            </div>
          ) : (
            <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {DOCUMENT_CATEGORIES.map((category) => {
                const count = countFor(category);
                const Icon = CATEGORY_ICONS[category];
                const pct =
                  maxCount > 0n ? Number((count * 100n) / maxCount) : 0;
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <Icon className="size-4 text-muted-foreground" />
                        {CATEGORY_LABELS[category]}
                      </span>
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        {count.toString()}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-gradient-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
