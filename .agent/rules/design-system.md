# 🎨 dvkTrack — Design System & Component Guidelines

## Overview

**dvkTrack** (`track.dvkpowered.org`) is the AI-augmented nutrition and calorie tracking application within the **DVK Powered** ecosystem. It utilizes a **Fresh Herb Green** brand palette paired with warm earth-toned surfaces, strict mathematical dark-mode inversion, and the unified DVK token contract.

---

## 1. Dimensional Hierarchy & Border Radiuses

Border radiuses are strictly bound to element height across all inputs, cards, dialogs, and controls:

| Element Height | Border Radius | Token Variable | Tailwind Arbitrary Class | Examples |
| :--- | :--- | :--- | :--- | :--- |
| **> 40px** (taller than 40px) | **16px** | `--radius-lg` | `rounded-[16px]` | 48px Input, Food Diary Cards, Modals, Add Food Dialog, 44px Tab Wrapper |
| **40px** | **14px** | `--radius-default` / `--radius` | `rounded-[14px]` | Default Buttons (`size="default"`), Search Bar, Primary CTAs |
| **36px** | **12px** | `--radius-md` | `rounded-[12px]` | Medium Buttons (`size="md"`), Meal Category Tabs, Secondary Controls |
| **32px** | **10px** | `--radius-sm` | `rounded-[10px]` | Small Buttons (`size="sm"`), Nutrient Badges, Filter Chips |

---

## 2. Button Specifications

All interactive buttons in `src/components/ui/button.tsx` strictly observe these three standardized size variants:

```tsx
interface ButtonProps {
  size?: "default" | "md" | "sm"; // default: 40px, md: 36px, sm: 32px
}
```

- **`default` (40px)**:
  - Height: `h-[40px]`
  - Radius: `rounded-[14px]` (`var(--radius-default)`)
  - Typography: `text-sm font-semibold`
  - Horizontal Padding: `px-4`
- **`md` (36px)**:
  - Height: `h-[36px]`
  - Radius: `rounded-[12px]` (`var(--radius-md)`)
  - Typography: `text-xs font-semibold`
  - Horizontal Padding: `px-3`
- **`sm` (32px)**:
  - Height: `h-[32px]`
  - Radius: `rounded-[10px]` (`var(--radius-sm)`)
  - Typography: `text-xs font-medium`
  - Horizontal Padding: `px-2.5`

---

## 3. dvkTrack Color Palette (Fresh Herb Green & HSL Architecture)

All components must strictly utilize CSS variable tokens. Never hardcode arbitrary hex values or generic Tailwind colors (`bg-zinc-900`, `text-gray-500`).

### 3.1. Light Mode Tokens (`:root`)

```css
:root {
  /* Surfaces & Backgrounds */
  --bg-light: hsl(38, 22%, 96%);          /* Primary page background */
  --bg-light-active: hsl(38, 22%, 92%);   /* Pressed/active page background */
  --bg-dark: hsl(38, 18%, 91%);           /* Elevated surface / card background */
  --bg-dark-active: hsl(38, 18%, 86%);    /* Hovered surface element */

  /* Borders */
  --border: hsl(38, 15%, 84%);            /* Resting border */
  --border-active: hsl(38, 15%, 72%);     /* Hover/focus border */

  /* Inks (Typography) */
  --ink-primary: hsl(35, 15%, 12%);       /* Headings, main text (~12% Lightness) */
  --ink-secondary: hsl(35, 15%, 38%);     /* Subtitles, labels, metadata (~38% Lightness) */
  --ink-tertiary: hsl(35, 15%, 62%);      /* Placeholders, disabled text (~62% Lightness) */

  /* Brand Accent: Fresh Herb Green (4 gradations) */
  --accent-base: hsl(85, 49%, 48%);
  --accent-active: hsl(85, 52%, 40%);
  --accent-container: hsl(85, 45%, 94%);
  --accent-container-active: hsl(85, 45%, 88%);
  --accent: var(--accent-base);

  /* Destructive / Error (4 gradations) */
  --destructive-base: hsl(4, 78%, 54%);
  --destructive-active: hsl(4, 78%, 46%);
  --destructive-container: hsl(4, 78%, 94%);
  --destructive-container-active: hsl(4, 78%, 88%);
  --destructive: var(--destructive-base);

  /* Warning (4 gradations) */
  --warning-base: hsl(42, 95%, 48%);
  --warning-active: hsl(42, 95%, 40%);
  --warning-container: hsl(42, 95%, 92%);
  --warning-container-active: hsl(42, 95%, 85%);
  --warning: var(--warning-base);

  /* Success (4 gradations) */
  --success-base: hsl(145, 65%, 40%);
  --success-active: hsl(145, 65%, 33%);
  --success-container: hsl(145, 65%, 93%);
  --success-container-active: hsl(145, 65%, 87%);
  --success: var(--success-base);
}
```

### 3.2. Dark Mode Mathematical Rule (`.dark`, `[data-theme="dark"]`)

Dark theme follows the strict inversion formula:
- **Hue ($H$)**: Unchanged
- **Saturation ($S$)**: Unchanged
- **Lightness ($L$)**: $L_{\text{dark}} = 100 - L_{\text{light}}$

```css
.dark,
[data-theme="dark"] {
  --bg-light: hsl(38, 22%, 4%);
  --bg-light-active: hsl(38, 22%, 8%);
  --bg-dark: hsl(38, 18%, 9%);
  --bg-dark-active: hsl(38, 18%, 14%);

  --border: hsl(38, 15%, 16%);
  --border-active: hsl(38, 15%, 28%);

  --ink-primary: hsl(35, 15%, 88%);
  --ink-secondary: hsl(35, 15%, 62%);
  --ink-tertiary: hsl(35, 15%, 38%);

  /* Accent: Obsidian Cyber Lime for high legibility against pitch backgrounds */
  --accent-base: hsl(83, 78%, 55%);
  --accent-active: hsl(83, 80%, 63%);
  --accent-container: hsl(85, 45%, 8%);
  --accent-container-active: hsl(85, 45%, 14%);
  --accent: var(--accent-base);

  --destructive-base: hsl(4, 78%, 46%);
  --destructive-active: hsl(4, 78%, 54%);
  --destructive-container: hsl(4, 78%, 6%);
  --destructive-container-active: hsl(4, 78%, 12%);

  --warning-base: hsl(42, 95%, 52%);
  --warning-active: hsl(42, 95%, 60%);
  --warning-container: hsl(42, 95%, 8%);
  --warning-container-active: hsl(42, 95%, 15%);

  --success-base: hsl(145, 65%, 60%);
  --success-active: hsl(145, 65%, 67%);
  --success-container: hsl(145, 65%, 7%);
  --success-container-active: hsl(145, 65%, 13%);
}
```

---

## 4. Domain-Specific Semantic Nutrition Tokens

dvkTrack maps dietary nutrients to consistent semantic tokens to maintain chart readability and visual consistency across graphs, food logs, and macro rings:

| Nutrient | CSS Variable | Token Value | Purpose |
| :--- | :--- | :--- | :--- |
| **Calories** | `--color-calories` | `var(--accent-base)` | Daily calorie ring, summary badges, energy gauges |
| **Protein** | `--color-protein` | `var(--ink-primary)` | Protein bar graphs, grams tracking |
| **Carbohydrates** | `--color-carbs` | `var(--ink-secondary)` | Carbohydrate bars, macro split ratio |
| **Fats** | `--color-fat` | `var(--ink-tertiary)` | Lipids/fat bars, macro split ratio |
| **Fiber** | `--color-fiber` | `var(--border-active)` | Daily dietary fiber tracker |

### Calorie Balance Status States
- **Deficit**: `var(--color-status-deficit)` $\rightarrow$ `var(--accent-base)` (Optimal for fat loss)
- **Maintenance**: `var(--color-status-maintenance)` $\rightarrow$ `var(--warning-base)` (Neutral energy equilibrium)
- **Surplus**: `var(--color-status-surplus)` $\rightarrow$ `var(--destructive-base)` (Over daily intake target)

---

## 5. Unified Shadows & Elevation

Only two standardized shadows are permitted across the application:

- **Subtle Surface Shadow (`--shadow-sm`)**:
  ```css
  --shadow-sm: 0 4px 6px -2px rgba(45, 35, 20, 0.08); /* Light */
  --shadow-sm: 0 4px 6px -2px rgba(0, 0, 0, 0.5);      /* Dark */
  ```
  *Used for*: Buttons, food item cards, dropdown lists, table rows.

- **Omnidirectional Elevated Shadow (`--shadow-lg`)**:
  ```css
  --shadow-lg: 0 0 16px 2px rgba(45, 35, 20, 0.08), 0 8px 24px -2px rgba(45, 35, 20, 0.12); /* Light */
  --shadow-lg: 0 0 20px 3px rgba(0, 0, 0, 0.55), 0 10px 30px -2px rgba(0, 0, 0, 0.75);      /* Dark */
  ```
  *Used for*: AI Assistant floating panel, modals, ingredient selection dialogs, date pickers.

---

## 6. DVK Brand Identity Integration

dvkTrack uses the central vector logo components from `src/components/ui/dvk-logo.tsx`:

```tsx
import { DvkLogo, DvkIcon } from "@/components/ui/dvk-logo";

// Full Logo with wordmark in Header:
<DvkLogo color="var(--accent-base)" className="h-8 w-auto" />

// Mascot Icon in Mobile Bar or Favicon/PWA:
<DvkIcon color="var(--accent-base)" className="h-6 w-6" />
```

---

## 7. Spacing Scale

Adhere strictly to the unified spacing tokens:
- `--space-1` (`0.25rem` / `4px`): Micro gaps, badges.
- `--space-2` (`0.5rem` / `8px`): Compact component padding, icon spacing.
- `--space-4` (`1rem` / `16px`): Standard form and card padding.
- `--space-6` (`1.5rem` / `24px`): Section gaps, food diary meal dividers.
- `--space-12` (`3rem` / `48px`): Macro layout row margins.
- `--space-16` (`4rem` / `64px`): Top-level dashboard container gutters.
