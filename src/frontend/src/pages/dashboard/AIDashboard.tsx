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
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DOCUMENT_CATEGORIES, type DocumentCategory } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  BrainCircuit,
  FileText,
  Lightbulb,
  Lock,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  education: "Education",
  identity: "Identity",
  finance: "Finance",
  insurance: "Insurance",
  projects: "Projects",
  achievements: "Achievements",
};

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-1)",
];

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

function useGetUploadTrends() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["uploadTrends"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUploadTrends();
    },
    enabled: !!actor && !isFetching,
  });
}

function useSearchDocuments(query: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["searchDocuments", query],
    queryFn: async () => {
      if (!actor) return [];
      return actor.searchDocuments(query);
    },
    enabled: !!actor && !isFetching && query.trim().length > 0,
  });
}

export default function AIDashboard() {
  const overview = useGetAnalyticsOverview();
  const trends = useGetUploadTrends();

  const [searchText, setSearchText] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    DocumentCategory | "all"
  >("all");

  const search = useSearchDocuments(submittedQuery);

  const total = overview.data?.totalDocuments ?? 0n;
  const byCategory = overview.data?.byCategory ?? [];

  const countMap = useMemo(() => {
    const map = new Map<DocumentCategory, bigint>();
    for (const entry of byCategory) {
      map.set(entry.category, entry.count);
    }
    return map;
  }, [byCategory]);

  const distributionData = useMemo(
    () =>
      DOCUMENT_CATEGORIES.map((category, index) => ({
        name: CATEGORY_LABELS[category],
        value: Number(countMap.get(category) ?? 0n),
        fill: CHART_COLORS[index % CHART_COLORS.length],
      })),
    [countMap],
  );

  const trendData = useMemo(
    () =>
      (trends.data ?? []).map((point) => {
        const epoch = Number(point.period);
        const date = new Date(epoch * 86400000);
        const label = Number.isNaN(date.getTime())
          ? String(point.period)
          : date.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            });
        return {
          period: label,
          count: Number(point.count),
        };
      }),
    [trends.data],
  );

  const filteredResults = useMemo(() => {
    const results = search.data ?? [];
    if (categoryFilter === "all") return results;
    return results.filter((doc) => doc.category === categoryFilter);
  }, [search.data, categoryFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(searchText);
  };

  const insights = useMemo(() => {
    const list: { title: string; detail: string; tone: "accent" | "teal" }[] =
      [];

    if (total > 0n) {
      const top = byCategory.reduce(
        (best, c) => (c.count > best.count ? c : best),
        byCategory[0],
      );
      if (top && top.count > 0n) {
        list.push({
          title: `${CATEGORY_LABELS[top.category]} leads your vault`,
          detail: `${top.count.toString()} document${
            top.count === 1n ? "" : "s"
          } — your most populated category so far.`,
          tone: "accent",
        });
      }

      const empty = DOCUMENT_CATEGORIES.filter(
        (c) => (countMap.get(c) ?? 0n) === 0n,
      );
      if (empty.length > 0) {
        list.push({
          title: "Gaps worth filling",
          detail: `${empty.map((c) => CATEGORY_LABELS[c]).join(", ")} ${
            empty.length === 1 ? "has" : "have"
          } no documents yet. Adding these rounds out your memory capsule.`,
          tone: "teal",
        });
      }
    }

    if (trendData.length >= 2) {
      const last = trendData[trendData.length - 1].count;
      const prev = trendData[trendData.length - 2].count;
      if (last > prev) {
        list.push({
          title: "Uploads are trending up",
          detail: `You added ${last} document${
            last === 1 ? "" : "s"
          } in the latest period, up from ${prev} before.`,
          tone: "accent",
        });
      } else if (last < prev) {
        list.push({
          title: "Uploads slowed recently",
          detail: `Latest period saw ${last} upload${
            last === 1 ? "" : "s"
          }, down from ${prev}. A quick archive session could help.`,
          tone: "teal",
        });
      }
    }

    if (list.length === 0) {
      list.push({
        title: "Your vault is ready",
        detail:
          "Upload documents to unlock analytics, trends, and tailored recommendations.",
        tone: "teal",
      });
    }

    return list;
  }, [byCategory, countMap, total, trendData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          AI Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Analytics and insights from your documents.
        </p>
      </div>

      {/* Search */}
      <Card className="border-accent/20 bg-gradient-to-br from-card to-accent/5">
        <CardContent className="py-5">
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                data-ocid="ai_dashboard.search_input"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search your documents by text or keyword…"
                className="pl-9"
                aria-label="Search documents"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                data-ocid="ai_dashboard.category_select"
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value as DocumentCategory | "all")
                }
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                aria-label="Filter by category"
              >
                <option value="all">All categories</option>
                {DOCUMENT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
              <Button
                type="submit"
                data-ocid="ai_dashboard.search_button"
                className="gap-2"
              >
                <Sparkles className="size-4" />
                Search
              </Button>
            </div>
          </form>

          {submittedQuery.trim().length > 0 && (
            <div className="mt-4 space-y-2">
              {search.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : filteredResults.length === 0 ? (
                <div
                  data-ocid="ai_dashboard.search_empty_state"
                  className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground"
                >
                  No documents match your search. Try different keywords or
                  another category.
                </div>
              ) : (
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {filteredResults.map((doc, index) => (
                    <li
                      key={doc.id.toString()}
                      data-ocid={`ai_dashboard.search_result.${index + 1}`}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                        {doc.locked ? (
                          <Lock className="size-4 text-accent" />
                        ) : (
                          <FileText className="size-4 text-secondary-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-medium ${
                            doc.locked ? "masked-text" : ""
                          }`}
                        >
                          {doc.name ?? "Protected document"}
                        </p>
                        <p
                          className={`truncate font-mono text-xs text-muted-foreground ${
                            doc.locked ? "masked-text" : ""
                          }`}
                        >
                          {doc.fileType ?? "Hidden"}
                        </p>
                      </div>
                      {doc.locked ? (
                        <span className="lock-badge">
                          <Lock className="size-3" />
                          Protected
                        </span>
                      ) : (
                        doc.category && (
                          <Badge variant="secondary">
                            {CATEGORY_LABELS[doc.category]}
                          </Badge>
                        )
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Distribution donut */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <BrainCircuit className="size-4 text-accent" />
              Document distribution
            </CardTitle>
            <CardDescription>Share of your vault by category</CardDescription>
          </CardHeader>
          <CardContent>
            {overview.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : total === 0n ? (
              <div
                data-ocid="ai_dashboard.distribution_empty_state"
                className="flex h-64 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground"
              >
                <BrainCircuit className="size-8 text-muted-foreground" />
                Upload documents to see your distribution.
              </div>
            ) : (
              <ChartContainer
                config={{}}
                className="mx-auto aspect-square max-h-72"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={distributionData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    strokeWidth={2}
                  >
                    {distributionData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend
                    content={<ChartLegendContent nameKey="name" />}
                    className="flex-wrap"
                  />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Upload trends bar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <TrendingUp className="size-4 text-accent" />
              Upload trends
            </CardTitle>
            <CardDescription>Documents added over time</CardDescription>
          </CardHeader>
          <CardContent>
            {trends.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : trendData.length === 0 ? (
              <div
                data-ocid="ai_dashboard.trends_empty_state"
                className="flex h-64 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground"
              >
                <TrendingUp className="size-8 text-muted-foreground" />
                Upload documents to see your trend over time.
              </div>
            ) : (
              <ChartContainer config={{}} className="h-64">
                <BarChart data={trendData}>
                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                    domain={[0, (dataMax: number) => Math.max(4, dataMax + 1)]}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar
                    dataKey="count"
                    radius={[6, 6, 0, 0]}
                    fill="var(--chart-2)"
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card className="border-accent/20 bg-gradient-to-br from-card to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Lightbulb className="size-4 text-accent" />
            Insights &amp; recommendations
          </CardTitle>
          <CardDescription>Derived from your document data</CardDescription>
        </CardHeader>
        <CardContent>
          {overview.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {insights.map((insight, index) => (
                <li
                  key={insight.title}
                  data-ocid={`ai_dashboard.insight.${index + 1}`}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card/60 p-4"
                >
                  <div
                    className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${
                      insight.tone === "accent"
                        ? "bg-primary/15 text-primary"
                        : "bg-accent/15 text-accent"
                    }`}
                  >
                    <ArrowUpRight className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-sm font-semibold">
                      {insight.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {insight.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
