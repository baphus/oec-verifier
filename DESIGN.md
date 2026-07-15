---
colors:
  light:
    dmwBlue: "#093CA8"
    dmwCrimson: "#B30B22"
    dmwGold: "#B98500"
    ink: "#111827"
    paper: "#F5F7FB"
    card: "#FFFFFF"
    line: "#D8DFEB"
    mutedText: "#526174"
    background: "#F5F7FB"
    primary: "#093CA8"
    primaryForeground: "#FFFFFF"
    secondary: "#E9EEF9"
    secondaryForeground: "#093075"
    muted: "#EDF1F7"
    mutedForeground: "#526174"
    accent: "#FFF4B8"
    accentForeground: "#171300"
    destructive: "#B30B22"
    destructiveSoft: "#FCE8EB"
    border: "#D8DFEB"
    input: "#9AA9BC"
    ring: "#093CA8"
    success: "#146B3A"
    successSoft: "#E3F3EA"
    warning: "#765A00"
    warningSoft: "#FFF6D5"
    warningForeground: "#453B16"
    navy: "#071B38"
    navyForeground: "#F4F7FB"
    navyMuted: "#C1D0E0"
  dark:
    dmwBlue: "#78A8FF"
    dmwCrimson: "#FF7180"
    dmwGold: "#F4C84A"
    ink: "#F3F6FB"
    paper: "#11161F"
    card: "#18202B"
    line: "#354252"
    mutedText: "#B4C0CF"
    background: "#11161F"
    primary: "#78A8FF"
    primaryForeground: "#071B38"
    secondary: "#24344D"
    secondaryForeground: "#E4EDFF"
    muted: "#202A37"
    mutedForeground: "#B4C0CF"
    accent: "#463B19"
    accentForeground: "#FFF4C7"
    destructive: "#FF7180"
    destructiveSoft: "#42232B"
    border: "#354252"
    input: "#526175"
    ring: "#F4C84A"
    success: "#79D5A0"
    successSoft: "#1D3C2B"
    warning: "#F4C84A"
    warningSoft: "#403617"
    warningForeground: "#FFE9A4"
    navy: "#0A1220"
    navyForeground: "#F3F6FB"
    navyMuted: "#B4C0CF"
typography:
  body: "Geist, var(--font-geist-sans), system-ui, sans-serif"
  mono: "Geist Mono, var(--font-geist-mono), monospace"
  display: "Georgia, serif"
rounded:
  base: "0.25rem"
  sm: "0.15rem"
  md: "0.25rem"
  lg: "0.35rem"
  xl: "0.5rem"
spacing:
  publicContent: "min(1040px, calc(100% - 40px))"
  evaluatorContent: "min(1200px, 100%)"
  evaluatorPage: "clamp(1.25rem, 3vw, 2.75rem)"
  publicPage: "65px 0 90px"
  hero: "clamp(68px, 10vw, 124px) 0 100px"
  commonGaps: ["14px", "20px", "22px", "28px", "42px", "70px"]
components:
  - "Button: CVA variants default, outline, secondary, ghost, destructive, link; visible focus and disabled states"
  - "Input: h-8, rounded-lg, semantic border/focus/error/disabled states"
  - "Card: bg-card, text-card-foreground, rounded-sm, ring-1 ring-foreground/10, shared card spacing"
  - "Public navigation: sticky, mobile disclosure, labelled toggle, Escape close, route-change close"
  - "Evaluator navigation: 248px sticky desktop sidebar, mobile fixed drawer at max-width 760px"
  - "Theme control: light/dark class toggle persisted as oec-theme"
---

## Overview

**Civic Signal** is a precise and efficient government verification interface. Its **Government Navy** character uses calm surfaces, clear state communication, and restrained DMW blue, crimson, and gold accents. **Structural elevation** establishes hierarchy through borders and tonal layering; shadows stay quiet. The component philosophy is **Precise surfaces**: every surface should expose the current state, next action, and reason without ceremony.

The system serves applicants and authorized evaluators. It targets WCAG 2.2 AA, preserves visible keyboard focus, communicates status with text as well as color, supports reduced motion, and avoids playful startup styling, gamification, casual language, and trend-led decoration.

## Colors

Use the light and dark semantic roles in frontmatter rather than raw colors in application UI. `background` and `paper` establish the page field; `card` and `popover` establish surfaces; `ink`/`foreground` carry primary text; `mutedText`/`mutedForeground` carry supporting text; `line`, `border`, and `input` define boundaries. `primary` and `primaryForeground` define the main action. `secondary`, `muted`, and `accent` are supporting surfaces. `destructive`, `success`, and `warning` must always be paired with readable status text. `ring` is the visible keyboard focus color.

The footer uses the navy family. DMW blue is the primary signal, crimson is reserved for destructive or urgent decisions, and gold is a restrained accent and focus signal. Do not introduce gradients or distribute accent colors evenly across the interface.

## Typography

Geist is the body voice, Geist Mono is reserved for machine-readable identifiers, and Georgia provides the display and editorial contrast. Global `h1` uses a light Georgia treatment with `clamp(2.7rem, 8vw, 5.5rem)`, `.99` line-height, and no tighter than `-.04em` letter-spacing. Page headings use `clamp(2.8rem, 7vw, 4.8rem)`.

Small labels range from `.7rem` to `.84rem`; common labels use `700–800` weight. Eyebrows use `.7rem`, `800` weight, and `.15em` tracking. Keep language direct and operational.

## Elevation

Elevation is structural: borders and tonal layering establish structure; shadows stay quiet. Public forms and receipts use `0 12px 28px #102a350d`. Evaluator cards use `0 8px 24px color-mix(in srgb, var(--foreground) 7%, transparent)`. The mobile evaluator drawer uses `12px 0 28px rgb(0 0 0 / 15%)`. Shadcn cards use a `ring-1 ring-foreground/10` treatment.

Do not add floating decorative cards, dramatic shadows, or colored side borders as a universal pattern.

## Components

Buttons use semantic primary, secondary, destructive, outline, ghost, and link variants, with visible focus rings, disabled states, and compact sizes from `xs` through `lg` plus icon sizes. Inputs use an `h-8` control, `rounded-lg`, semantic border and ring states, placeholder contrast, `aria-invalid` error treatment, and disabled treatment.

Cards use `bg-card`, `text-card-foreground`, `rounded-sm`, a quiet foreground ring, and shared internal spacing of `--spacing(4)` or `--spacing(3)` for small cards. Card headers, content, descriptions, actions, and footers preserve consistent structure.

Public navigation is sticky and collapses into a labelled mobile disclosure. It closes on Escape and route selection. Evaluator navigation is a `248px` sticky desktop sidebar and becomes a fixed drawer below `760px`, with a scrim, active page indication, and keyboard-operable controls. The theme control toggles `.dark`, persists `oec-theme`, exposes `aria-pressed`, and appears in both public and evaluator navigation.

Motion is limited to functional transitions: button transitions, input color transitions, and a `.18s ease` evaluator drawer. Under `prefers-reduced-motion: reduce`, transitions and animations are effectively disabled and smooth scrolling is removed.

Responsive structure uses `520px` for narrow public content and receipt details, `700px` for public two-column layouts, `760px` for evaluator navigation, and the existing Tailwind `md` breakpoint at `768px` for input typography.

## Do's and Don'ts

- **Do** use semantic tokens for every surface, text color, border, focus ring, and status.
- **Do** make status legible in words; never rely on color alone.
- **Do** preserve visible, high-contrast `:focus-visible` treatment.
- **Do** keep controls familiar, compact, keyboard-operable, and explicit about loading or disabled state.
- **Do** preserve the current next step and the reason for a decision.
- **Do** test both `.dark` and light modes at narrow widths.
- **Do** respect reduced-motion preferences.
- **Don't** add gradients, gradient text, huge radii, decorative cards, or universal colored borders.
- **Don't** use casual, playful, gamified, or trend-led language or decoration.
- **Don't** introduce raw hard-coded public surface colors where semantic tokens exist.
- **Don't** hide navigation or status information behind hover-only behavior.
- **Don't** add analytics, metrics, route changes, or altered form semantics as visual enhancements.
