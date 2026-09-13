import { createActor } from "@/backend";
import type {
  GraphEdge,
  GraphNode,
  KnowledgeGraph as KnowledgeGraphData,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { Html, Line, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useQuery } from "@tanstack/react-query";
import { Boxes, FileText, Network, Tags } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";

/* ------------------------------------------------------------------ */
/* Backend query                                                       */
/* ------------------------------------------------------------------ */

function useKnowledgeGraph() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["knowledgeGraph"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getKnowledgeGraph();
    },
    enabled: !!actor && !isFetching,
  });
}

/* ------------------------------------------------------------------ */
/* Node styling by kind                                                */
/* ------------------------------------------------------------------ */

const KIND_STYLE: Record<
  string,
  { color: string; size: number; label: string }
> = {
  category: { color: "#a78bfa", size: 0.62, label: "Category" },
  document: { color: "#2dd4bf", size: 0.42, label: "Document" },
  entity: { color: "#34d399", size: 0.3, label: "Entity" },
};

const RELATION_COLOR: Record<string, string> = {
  classified_as: "#a78bfa",
  mentions: "#2dd4bf",
};

const DEFAULT_COLOR = "#a78bfa";

interface PositionedNode {
  id: string;
  kind: string;
  name: string;
  position: [number, number, number];
  color: string;
  size: number;
}

/* ------------------------------------------------------------------ */
/* Layout: radial rings grouped by node kind                           */
/* ------------------------------------------------------------------ */

function layoutGraph(graph: KnowledgeGraphData): PositionedNode[] {
  const byKind: Record<string, GraphNode[]> = {};
  for (const node of graph.nodes) {
    if (!byKind[node.kind]) byKind[node.kind] = [];
    byKind[node.kind].push(node);
  }

  const ringRadius: Record<string, number> = {
    category: 8.2,
    document: 5.2,
    entity: 2.6,
  };

  const positioned: PositionedNode[] = [];
  for (const [kind, nodes] of Object.entries(byKind)) {
    const radius = ringRadius[kind] ?? 4;
    const style = KIND_STYLE[kind] ?? {
      color: DEFAULT_COLOR,
      size: 0.35,
      label: kind,
    };
    const count = nodes.length;
    nodes.forEach((node, i) => {
      const angle = (i / Math.max(count, 1)) * Math.PI * 2;
      const jitter = 0.35;
      const r = radius + (Math.random() - 0.5) * jitter;
      positioned.push({
        id: node.id,
        kind: node.kind,
        name: node.name,
        position: [
          Math.cos(angle) * r,
          (Math.random() - 0.5) * 1.2,
          Math.sin(angle) * r,
        ],
        color: style.color,
        size: style.size,
      });
    });
  }
  return positioned;
}

/* ------------------------------------------------------------------ */
/* Three.js scene                                                      */
/* ------------------------------------------------------------------ */

function GraphNodeMesh({
  node,
  selected,
  onSelect,
}: {
  node: PositionedNode;
  selected: boolean;
  onSelect: (node: PositionedNode | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (meshRef.current) {
      const target = hovered || selected ? 1.35 : 1;
      meshRef.current.scale.lerp(
        new THREE.Vector3(target, target, target),
        Math.min(delta * 6, 1),
      );
    }
  });

  const showLabel = node.kind === "category" || hovered || selected;

  return (
    <group position={node.position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[node.size, 24, 24]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={hovered || selected ? 0.9 : 0.45}
          roughness={0.25}
          metalness={0.1}
        />
      </mesh>
      {/* soft glow halo */}
      <mesh>
        <sphereGeometry args={[node.size * 1.9, 16, 16]} />
        <meshBasicMaterial
          color={node.color}
          transparent
          opacity={0.08}
          depthWrite={false}
        />
      </mesh>
      {/* interactive hit area (DOM button so keyboard access works) */}
      <Html
        center
        distanceFactor={9}
        zIndexRange={[10, 0]}
        style={{ pointerEvents: "none" }}
      >
        <button
          type="button"
          aria-label={`Select ${node.name}`}
          className="cursor-pointer rounded-full"
          style={{
            width: node.size * 46,
            height: node.size * 46,
            background: "transparent",
            border: "none",
            pointerEvents: "auto",
          }}
          onClick={() => onSelect(selected ? null : node)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(selected ? null : node);
            }
          }}
          onPointerEnter={() => {
            setHovered(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerLeave={() => {
            setHovered(false);
            document.body.style.cursor = "auto";
          }}
        />
      </Html>
      {showLabel && (
        <Html
          center
          distanceFactor={9}
          style={{ pointerEvents: "none" }}
          zIndexRange={[10, 0]}
        >
          <div
            className="whitespace-nowrap rounded-md border border-border/60 bg-card/90 px-2 py-0.5 font-mono text-[10px] text-foreground shadow-subtle backdrop-blur"
            style={{
              maxWidth: 160,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {node.name}
          </div>
        </Html>
      )}
    </group>
  );
}

function GraphEdgeLine({
  edge,
  nodesById,
}: {
  edge: GraphEdge;
  nodesById: Map<string, PositionedNode>;
}) {
  const source = nodesById.get(edge.source);
  const target = nodesById.get(edge.target);
  if (!source || !target) return null;

  const color = RELATION_COLOR[edge.relation] ?? "#64748b";
  const points: [number, number, number][] = [source.position, target.position];

  return (
    <Line
      points={points}
      color={color}
      lineWidth={1}
      transparent
      opacity={0.5}
    />
  );
}

function GraphScene({
  graph,
  selectedId,
  onSelect,
}: {
  graph: KnowledgeGraphData;
  selectedId: string | null;
  onSelect: (node: PositionedNode | null) => void;
}) {
  const positioned = useMemo(() => layoutGraph(graph), [graph]);
  const nodesById = useMemo(
    () => new Map(positioned.map((n) => [n.id, n])),
    [positioned],
  );

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 12, 10]} intensity={60} color="#a78bfa" />
      <pointLight position={[-10, -8, -10]} intensity={40} color="#2dd4bf" />
      {positioned.map((node) => (
        <GraphNodeMesh
          key={node.id}
          node={node}
          selected={selectedId === node.id}
          onSelect={onSelect}
        />
      ))}
      {graph.edges.map((edge) => (
        <GraphEdgeLine
          key={`${edge.source}-${edge.relation}-${edge.target}`}
          edge={edge}
          nodesById={nodesById}
        />
      ))}
      <OrbitControls
        enablePan
        enableZoom
        autoRotate
        autoRotateSpeed={0.6}
        minDistance={4}
        maxDistance={26}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function KnowledgeGraph() {
  const { data, isLoading, isError } = useKnowledgeGraph();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const graph = data ?? null;
  const positioned = useMemo(() => (graph ? layoutGraph(graph) : []), [graph]);
  const selectedNode = positioned.find((n) => n.id === selectedId) ?? null;

  const counts = useMemo(() => {
    if (!graph) return { category: 0, document: 0, entity: 0, edge: 0 };
    const c = { category: 0, document: 0, entity: 0 };
    for (const n of graph.nodes) {
      if (n.kind === "category") c.category += 1;
      else if (n.kind === "document") c.document += 1;
      else c.entity += 1;
    }
    return { ...c, edge: graph.edges.length };
  }, [graph]);

  const handleSelect = (node: PositionedNode | null) => {
    setSelectedId(node ? node.id : null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Knowledge Graph
          </h1>
          <p className="text-sm text-muted-foreground">
            A living constellation of your documents, categories, and the
            entities they reference.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-xs text-accent">
          <span className="size-1.5 animate-pulse-soft rounded-full bg-accent" />
          Interactive · drag to orbit
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Documents"
          value={counts.document}
          color="text-teal-300"
        />
        <StatCard
          icon={Tags}
          label="Categories"
          value={counts.category}
          color="text-violet-300"
        />
        <StatCard
          icon={Boxes}
          label="Entities"
          value={counts.entity}
          color="text-emerald-300"
        />
        <StatCard
          icon={Network}
          label="Connections"
          value={counts.edge}
          color="text-accent"
        />
      </div>

      {/* Graph + legend */}
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="relative overflow-hidden rounded-xl border border-border bg-card/60 backdrop-blur">
          <div className="absolute inset-0 bg-grid opacity-40" />
          <div className="relative h-[520px]">
            {isLoading && <GraphSkeleton />}
            {isError && <GraphError />}
            {!isLoading && !isError && graph && graph.nodes.length === 0 && (
              <GraphEmpty />
            )}
            {!isLoading && !isError && graph && graph.nodes.length > 0 && (
              <Canvas
                camera={{ position: [0, 6, 16], fov: 50 }}
                dpr={[1, 2]}
                onPointerMissed={() => handleSelect(null)}
              >
                <GraphScene
                  graph={graph}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                />
              </Canvas>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <LegendCard />
          <DetailCard node={selectedNode} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Supporting UI                                                       */
/* ------------------------------------------------------------------ */

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof FileText;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className={`mt-2 font-display text-3xl font-bold ${color}`}>
        {value}
      </div>
    </div>
  );
}

function LegendCard() {
  const items = [
    { color: "#a78bfa", label: "Category", desc: "Document type" },
    { color: "#2dd4bf", label: "Document", desc: "Stored file" },
    { color: "#34d399", label: "Entity", desc: "Referenced concept" },
  ];
  return (
    <div className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur">
      <h2 className="font-display text-sm font-semibold tracking-tight">
        Legend
      </h2>
      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-3">
            <span
              className="size-3 shrink-0 rounded-full"
              style={{
                backgroundColor: item.color,
                boxShadow: `0 0 10px ${item.color}`,
              }}
            />
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground">
                {item.label}
              </div>
              <div className="text-xs text-muted-foreground">{item.desc}</div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t border-border pt-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-mono text-violet-300">classified_as</span> links
          a document to its category, while{" "}
          <span className="font-mono text-teal-300">mentions</span> links a
          document to the entities it references.
        </p>
      </div>
    </div>
  );
}

function DetailCard({ node }: { node: PositionedNode | null }) {
  if (!node) {
    return (
      <div className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur">
        <h2 className="font-display text-sm font-semibold tracking-tight">
          Node details
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Click any node in the constellation to inspect it.
        </p>
      </div>
    );
  }
  const style = KIND_STYLE[node.kind] ?? {
    color: DEFAULT_COLOR,
    label: node.kind,
  };
  return (
    <div className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur">
      <div className="flex items-center gap-2">
        <span
          className="size-3 rounded-full"
          style={{
            backgroundColor: style.color,
            boxShadow: `0 0 10px ${style.color}`,
          }}
        />
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {style.label}
        </span>
      </div>
      <h2 className="mt-2 break-words font-display text-base font-semibold tracking-tight">
        {node.name}
      </h2>
      <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">
        {node.id}
      </p>
    </div>
  );
}

function GraphSkeleton() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="size-8 animate-spin rounded-full border-2 border-border border-t-accent" />
        <span className="font-mono text-xs">Mapping constellation…</span>
      </div>
    </div>
  );
}

function GraphError() {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
      data-ocid="knowledge_graph.error_state"
    >
      <Network className="size-8 text-destructive" />
      <p className="text-sm text-muted-foreground">
        We couldn't load the knowledge graph. Please try again.
      </p>
    </div>
  );
}

function GraphEmpty() {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
      data-ocid="knowledge_graph.empty_state"
    >
      <Network className="size-10 text-muted-foreground" />
      <h3 className="font-display text-lg font-semibold tracking-tight">
        No connections yet
      </h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        Upload documents to your vault and the knowledge graph will map them to
        their categories and referenced entities.
      </p>
    </div>
  );
}
