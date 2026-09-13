import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BrainCircuit,
  FileSearch,
  Fingerprint,
  KeyRound,
  Lock,
  Network,
  ScanText,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";
import { motion } from "motion/react";

const FEATURES = [
  {
    icon: ScanText,
    title: "OCR",
    description:
      "Turn scanned pages and photos into clean, searchable text with high-fidelity optical character recognition.",
  },
  {
    icon: BrainCircuit,
    title: "AI Classification",
    description:
      "Advanced AI automatically sorts, tags, and organizes every document into a structured, intelligent archive.",
  },
  {
    icon: FileSearch,
    title: "Natural Language Search",
    description:
      "Ask questions in plain language and instantly surface the exact document, clause, or detail you need.",
  },
  {
    icon: ShieldCheck,
    title: "Verification",
    description:
      "Cryptographic verification confirms document integrity and authenticity, so you can trust what you store.",
  },
  {
    icon: Network,
    title: "Knowledge Graph",
    description:
      "See how your documents connect — people, projects, and concepts mapped into a living constellation of knowledge.",
  },
  {
    icon: Timer,
    title: "Smart Reminders",
    description:
      "Intelligent alerts keep critical documents top of mind, so nothing important ever slips through the cracks.",
  },
];

const WORKFLOW = [
  {
    step: "01",
    title: "Register",
    description:
      "Create your secure vault and connect your identity in seconds.",
  },
  {
    step: "02",
    title: "Upload",
    description: "Drop in any document — scans, photos, PDFs, or notes.",
  },
  {
    step: "03",
    title: "OCR",
    description: "Every page is transcribed into clean, searchable text.",
  },
  {
    step: "04",
    title: "Classify",
    description: "AI organizes and tags your documents automatically.",
  },
  {
    step: "05",
    title: "Search",
    description: "Ask anything and retrieve the exact knowledge you need.",
  },
];

const SECURITY = [
  {
    icon: KeyRound,
    title: "One-Time Passwords",
    description:
      "Time-sensitive OTP codes add a second layer of proof at every critical action.",
  },
  {
    icon: Fingerprint,
    title: "Multi-Layer Authentication",
    description:
      "Layered identity checks protect your vault from unauthorized access.",
  },
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description:
      "Your documents are encrypted at rest and in transit, readable only by you.",
  },
  {
    icon: ShieldCheck,
    title: "Risk Scoring",
    description:
      "Continuous monitoring evaluates access patterns to flag unusual activity.",
  },
];

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Workflow", href: "#workflow" },
  { label: "Security", href: "#security" },
];

export default function Landing() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      {/* Persistent header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <a
            href="#top"
            className="flex items-center gap-2.5"
            data-ocid="landing.brand_link"
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-primary shadow-subtle">
              <Sparkles className="size-4 text-primary-foreground" />
            </div>
            <span className="font-display text-sm font-bold tracking-tight">
              AI Memory Capsule
            </span>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                data-ocid={`landing.nav_${item.label.toLowerCase()}`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <Button
            asChild
            size="sm"
            className="rounded-full"
            data-ocid="landing.header_cta"
          >
            <Link to="/dashboard">
              Open dashboard
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_75%)]" />
          <div className="pointer-events-none absolute -top-40 right-0 h-[34rem] w-[34rem] rounded-full bg-primary/25 blur-[120px]" />
          <div className="pointer-events-none absolute -left-32 top-40 h-[26rem] w-[26rem] rounded-full bg-accent/15 blur-[120px]" />

          <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-6 pb-20 pt-24 text-center md:pt-32">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-accent"
            >
              <span className="size-1.5 animate-pulse-soft rounded-full bg-accent" />
              AI intelligence online
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="max-w-4xl font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Your documents, transformed into{" "}
              <span className="text-gradient">living memory</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl"
            >
              AI Memory Capsule turns your scattered files into a searchable,
              intelligent archive — so every document becomes knowledge you can
              actually use.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
            >
              <Button
                asChild
                size="lg"
                className="group rounded-full bg-gradient-primary px-8 text-base shadow-subtle hover:opacity-95"
                data-ocid="landing.hero_cta"
              >
                <Link to="/dashboard">
                  Open your dashboard
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <a
                href="#features"
                className="inline-flex h-10 items-center rounded-full border border-border bg-card/60 px-6 text-sm font-medium text-foreground transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                data-ocid="landing.hero_secondary"
              >
                Explore features
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="relative mt-16 w-full max-w-4xl"
            >
              <div className="absolute -inset-1 rounded-3xl bg-gradient-primary opacity-20 blur-2xl" />
              <img
                src="/assets/generated/hero-memory-capsule.dim_1600x900.png"
                alt="AI Memory Capsule dashboard showing an intelligent document archive with analytics and a knowledge graph"
                className="relative w-full rounded-3xl border border-border/60 shadow-2xl"
                loading="eager"
              />
            </motion.div>
          </div>
        </section>

        {/* Feature grid */}
        <section
          id="features"
          className="relative border-t border-border/60 bg-card/40 py-24"
        >
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <span className="font-mono text-xs uppercase tracking-widest text-accent">
                Capabilities
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                Everything your documents need
              </h2>
              <p className="mt-4 text-muted-foreground">
                A complete intelligence layer that reads, understands, and
                connects every file you store.
              </p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-subtle"
                  data-ocid={`landing.feature_${feature.title.toLowerCase().replace(/\s+/g, "_")}`}
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-primary shadow-subtle transition-transform duration-300 group-hover:scale-105">
                    <feature.icon className="size-5 text-primary-foreground" />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section
          id="workflow"
          className="relative border-t border-border/60 py-24"
        >
          <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)] opacity-60" />
          <div className="relative mx-auto w-full max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <span className="font-mono text-xs uppercase tracking-widest text-accent">
                How it works
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                From file to knowledge in five steps
              </h2>
              <p className="mt-4 text-muted-foreground">
                A simple journey that turns raw documents into an intelligent,
                searchable memory.
              </p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {WORKFLOW.map((item, index) => (
                <div
                  key={item.step}
                  className="relative rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-subtle"
                  data-ocid={`landing.workflow_${index + 1}`}
                >
                  <span className="font-mono text-sm text-accent">
                    {item.step}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-semibold tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                  {index < WORKFLOW.length - 1 && (
                    <ArrowRight className="absolute -right-4 top-1/2 hidden size-4 -translate-y-1/2 text-muted-foreground/40 lg:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security */}
        <section
          id="security"
          className="relative border-t border-border/60 bg-card/40 py-24"
        >
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <span className="font-mono text-xs uppercase tracking-widest text-accent">
                Security
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                Your memory, protected by layers
              </h2>
              <p className="mt-4 text-muted-foreground">
                Defense-in-depth security keeps your most sensitive documents
                safe from every angle.
              </p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {SECURITY.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-subtle"
                  data-ocid={`landing.security_${item.title.toLowerCase().replace(/\s+/g, "_")}`}
                >
                  <div className="flex size-11 items-center justify-center rounded-xl border border-accent/30 bg-accent/10">
                    <item.icon className="size-5 text-accent" />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden border-t border-border/60 py-24">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[24rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[120px]" />
          <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-6 text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Ready to turn your documents into{" "}
              <span className="text-gradient">living memory</span>?
            </h2>
            <p className="mt-4 max-w-xl text-muted-foreground">
              Open your dashboard and start building an intelligent archive of
              everything that matters.
            </p>
            <Button
              asChild
              size="lg"
              className="group mt-8 rounded-full bg-gradient-primary px-8 text-base shadow-subtle hover:opacity-95"
              data-ocid="landing.final_cta"
            >
              <Link to="/dashboard">
                Open your dashboard
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 px-6 py-10 md:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-primary">
              <Sparkles className="size-3.5 text-primary-foreground" />
            </div>
            <span className="font-display text-sm font-bold tracking-tight">
              AI Memory Capsule
            </span>
          </div>

          <nav className="flex items-center gap-6">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                data-ocid={`landing.footer_${item.label.toLowerCase()}`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline-offset-4 transition-colors hover:text-accent hover:underline"
              data-ocid="landing.footer_caffeine"
            >
              caffeine.ai
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
