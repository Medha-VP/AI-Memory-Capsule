# Design Brief

## Direction

AI Memory Capsule — a premium, dark, intelligence-forward concept/pitch site for an AI-powered personal document manager that turns scattered files into a searchable, secured memory.

## Tone

Refined dark "cerebral archive" — deep indigo-black surfaces with a vivid violet primary and teal intelligence accent, executed with the precision of Linear and Vercel.

## Differentiation

The "memory capsule" motif: an ambient indigo glow, a knowledge-graph constellation, and a mono-font AI readout that make documents feel like living, connected memories rather than static files.

## Color Palette

| Token      | OKLCH (dark)     | Role                              |
| ---------- | ---------------- | --------------------------------- |
| background | 0.145 0.025 265  | Deep indigo-black canvas          |
| foreground | 0.95 0.01 265    | Primary text                      |
| card       | 0.18 0.03 265    | Elevated surfaces                 |
| primary    | 0.62 0.24 285    | Vivid violet — CTAs, active states |
| accent     | 0.72 0.13 190    | Teal intelligence accent          |
| muted      | 0.22 0.03 265    | Secondary surfaces                |
| success    | 0.62 0.18 150    | Classified/verified states        |

Light mode inverts lightness, keeping the same indigo/violet + teal identity.

## Typography

- Display: Space Grotesk — hero, section headings, stat numerals
- Body: DM Sans — paragraphs, UI labels, dashboard text
- Mono: Geist Mono — AI readouts, badges, metadata
- Scale: hero `text-5xl md:text-7xl font-bold tracking-tight`, h2 `text-3xl md:text-5xl font-bold tracking-tight`, label `text-sm font-semibold tracking-widest uppercase`, body `text-base lg:text-lg`

## Elevation & Depth

Layered surfaces: `card` sits above `background` with a subtle hairline border, `shadow-elevated` lifts interactive cards and the dashboard, and an ambient violet blur orb + grid texture give the hero depth without full-page gradients.

## Structural Zones

| Zone    | Background        | Border    | Notes                                          |
| ------- | ----------------- | --------- | ---------------------------------------------- |
| Header  | card/80 blur      | border-b  | Sticky glass nav with logo + CTA               |
| Content | background        | —         | Alternates bg-muted/30 every other section     |
| Footer  | muted/40          | border-t  | Product info, nav, security reassurance        |
| Sidebar | sidebar           | border-r  | Dashboard nav, distinct from content           |

## Spacing & Rhythm

Spacious landing rhythm (`py-24 md:py-32` sections, `gap-6/8` grids) contrasting with denser dashboard (`gap-4`, compact cards) for information density.

## Component Patterns

- Buttons: rounded-lg, primary gradient on hover lift, focus ring; secondary ghost with border
- Cards: rounded-xl, card bg, subtle border, shadow-subtle, hover shadow-elevated
- Badges: rounded-full, mono font, tinted by category (accent/success/secondary)

## Password Protection Patterns

- Lock badge: `lock-badge` — teal-tinted mono pill (accent/10 bg, accent/30 border, accent text) with a lock glyph; marks protected documents in lists, headers, and detail views
- Prompt/unlock dialog: card/popover surface, lock icon in a violet ring, mono password input with `--input` border, primary violet submit; error state uses `destructive` text + `animate-shake` on wrong password
- Set/change/remove form: same card surface; primary submit for set/change, `destructive` ghost button for remove, focus ring on active field
- Protected masked row: list row keeps title + lock badge but replaces details (summary/metadata/date) with `masked-text` blur + mono `••••` placeholders at `muted-foreground`

## Motion

- Entrance: staggered `fade-up` on hero and section reveals (0.5–0.7s)
- Hover: `transition-smooth` color/lift on interactive elements (0.3s)
- Decorative: `float` on hero orb, `pulse-soft` on live AI indicator
- Error: `shake` (0.4s) on the password dialog when a wrong password is submitted

## Constraints

- Dark-first; light mode supported via token inversion
- AA+ contrast on all text; body ≥ 4.5:1
- Token-only styling — no raw hex/rgb in components
- Respect doNotBuild: no OTP/face login, QR/cert verification, expiry reminders, history, missing-doc connections, risk scoring, real OCR/AI, or NL Q&A

## Signature Detail

The knowledge-graph constellation — a three.js node network in the dashboard that visually links documents, categories, and entities, reinforcing the "connected memory" story.
