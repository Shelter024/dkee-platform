# Design System Overview

This document summarizes the new design tokens, palette choices, and usage guidelines for maintaining a modern, legible, and brand-aligned interface across DKee.

## 1. Goals
- High legibility (AA contrast minimum; AAA for body text where feasible)
- Subtle brand integration (Navy, Warm Orange, Red used sparingly)
- Reduced visual noise (fewer saturated gradients, intentional white space)
- Consistency via CSS variables and Tailwind tokens
- Ready for dark mode (variable overrides only)

## 2. Core Tokens (CSS Variables)
Light Mode Root:
```
--color-bg: #f8faff;
--color-surface: #ffffff;
--color-surface-alt: #f1f5f9;
--color-border: #e2e8f0;
--color-text: #1e293b;
--color-text-muted: #64748b;
--color-primary: #3949ab;
--color-accent: #ff9800;
--color-danger: #d32f2f;
--color-success: #4caf50;
--color-warning: #fb8c00;
--gradient-premium: linear-gradient(135deg,#3f51b5 0%,#d32f2f 55%,#ff9800 100%);
--radius-base: 0.75rem;
```
Dark Mode Overrides (.dark): replace bg/surface/text colors + shift primary/accent to more vibrant yet accessible alternatives.

## 3. Tailwind Mappings
Added color shortcuts in `tailwind.config.ts`:
- `background`, `surface`, `surfaceAlt`, `border`
- `textPrimary`, `textMuted`
- `primaryBase`, `accentBase`, `dangerBase`, `successBase`, `warningBase`
Use these for utility classes: `bg-surface`, `text-textMuted`, etc.

## 4. Component Guidelines
- Buttons: Use variants referencing CSS variables (`bg-[var(--color-primary)]`). Avoid raw hex values.
- Cards: Neutral surface backgrounds; hover elevation minimal (`shadow-sm` → `shadow-md`).
- Badges: 10% tint backgrounds; never pure saturated blocks.
- Feature Gate: Subtle surface card with radial brand glow overlay (low opacity). Gradient reserved for small banner/icon only.

## 5. Typography
- Heading weight: `font-semibold` or `font-bold` only for H1/H2.
- Body: Default system font stack; ensure line-height ~1.5.
- Limit gradient text to key marketing headings. Never apply to body copy.

## 6. Spacing & Radius
- Base radius: `var(--radius-base)` (12px). Larger radii use computed increments in Tailwind extension.
- Vertical rhythm: multiples of 4px; default component paddings already aligned.

## 7. Accessibility
- Primary (#3949ab on white) contrast ratio > 7:1.
- Accent (#ff9800 on white) contrast ratio ~ 4.1:1 (acceptable for large text/CTAs with bold weight). For small text on accent backgrounds, keep bold and consider darker shade (#fb8c00) if needed.
- Maintain minimum tap target height 40px (Button lg variant or `py-3`).
- Avoid gradient backgrounds behind paragraph text; use surfaces.

## 8. Dark Mode Strategy
- Activate by adding `class="dark"` to `html` or `body` (Next.js layout toggle possible).
- Variables swap automatically; components inherit without extra conditional logic.

## 9. Migration Checklist
1. Replace legacy classes (`premium-card`, heavy animated gradients) with token-based surfaces.
2. Use `bg-[var(--color-primary)]` instead of `bg-brand-navy-900` for new buttons.
3. Convert any remaining purple/pink multi-stop gradients to `--gradient-premium` if marketing-focused.
4. Remove excessive animation utilities on static informational cards.

## 10. Future Enhancements
- Introduce semantic elevation scale via `--shadow-sm/md/lg` tokens.
- Add motion-reduction handling for animated backgrounds.
- Provide a `useTheme()` hook for runtime palette swaps.

## 11. Quick Examples
```
<button class="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
  Primary Action
</button>

<div class="bg-surface border border-border text-textPrimary p-6 rounded-xl">
  <h2 class="text-xl font-semibold mb-2">Card Title</h2>
  <p class="text-textMuted">Supporting description with muted contrast.</p>
</div>

<span class="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-medium">Premium</span>
```

---
Maintain token usage discipline for consistency and ease of future theme changes.
