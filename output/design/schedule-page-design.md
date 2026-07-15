# Interlink Schedule Page Design

## Design intent

The schedule page should feel like a natural continuation of the public landing page and the signed-in dashboard. It replaces the legacy dark utility-dashboard treatment with Interlink's warm, editorial, atmospheric visual language.

The experience should feel calm and human. Scheduling is framed as making room for connection, not as administering calendar data.

## Revised signature background

The page's signature artifact is an original mixed-media campus-route photogram, not a blurred stock-style campus photograph. It combines a tactile overhead campus path study, translucent vellum map fragments, long-exposure traces of intersecting routes, and a few crisp registration details into one continuous photographic-art surface. Directional amber light enters from the upper right and cool mineral blue settles into the lower left, echoing Interlink's availability colors without becoming a generic two-color gradient.

The background must read as a real authored composition with foreground paper fibers, a midground network of paths and overlapping route traces, and a deeper architectural silhouette. It must not use soft radial blobs, candy aurora gradients, a centered glow, a generic skyline, or empty cream haze. Grain belongs to the background substrate only and never muddies the interface text.

### Light solid-color direction

The final background removes all literal city, campus, map, and landscape imagery. Use a predominantly luminous white and oyster paper field with a few large, crisp-edged solid-color paper planes at the outer perimeter only. Accents are extremely pale mineral blue and muted parchment-gold, each flat and low contrast, with no gradient blending. Fine natural paper fiber and subtle print registration texture keep the surface tactile without making it photographic. The central workspace remains nearly white and quiet.

The perimeter color fields should not form rigid triangles. Give them broad, free-form contours like torn cotton paper or slow watercolor washes, then let their outer edges feather gradually into the white ground with cloudlike softness. The effect is atmospheric but abstract: no literal cloud illustration, hard diagonal wedge, or isolated radial blob.

## Source language

The design is derived from:

- The landing page's softly blurred campus imagery, centered editorial typography, warm paper tones, restrained black controls, and overlapping-circle motif.
- The signed-in dashboard's floating translucent navbar, oversized Fraunces headline, glass panels, amber and dusty-blue availability marks, fine rules, and generous spacing.
- The existing schedule page's core interaction model: a weekly time grid, draggable availability blocks, week navigation, saved-slot summary, autosave state, and clear-all action.

## Color system

| Token | Value | Use |
| --- | --- | --- |
| Ink | `#171817` | Primary text, outlines, active controls |
| Paper | `#F2EEE4` | Warm base, light text on ink controls |
| Soft paper | `#F8F4EB` | Glass-panel tint and control fill |
| Atmospheric gray | `#D8D9D6` | Neutral backdrop transition |
| Amber | `#E7AD4B` | Primary availability blocks, warm focus |
| Dusty blue | `#8EAFC8` | Secondary availability blocks, cool balance |
| Deep action | `#171B1F` | Primary button and high-contrast controls |
| Muted ink | `rgba(23, 24, 23, 0.58)` | Supporting copy and metadata |
| Hairline | `rgba(23, 24, 23, 0.14)` | Calendar grid and separators |
| Glass border | `rgba(255, 255, 255, 0.72)` | Navbar, panels, and fields |
| Glass fill | `rgba(248, 244, 235, 0.56)` | Calendar and summary surfaces |

The backdrop should blend warm cream, pale gold, clouded blue, and a small amount of mauve-gray. Grain is visible but subtle. Avoid saturated neon, pure white, and blue-black dashboard surfaces.

## Typography

- Display and editorial labels: Fraunces, Georgia fallback, weight 400 to 500, tight tracking around `-0.045em`.
- UI, controls, supporting copy: Geist, system sans fallback, weight 400 to 600.
- Page title: 92 to 116 px on a 1600 px desktop canvas, line-height near 0.92.
- Section title: 26 to 34 px Fraunces.
- Body copy: 15 to 17 px Geist, line-height 1.5 to 1.6.
- Metadata and status: 11 to 13 px Geist, uppercase only for short utility labels, with wide tracking.

## Navbar

Use the supplied navbar reference as the exact structural source.

- Positioned 24 px from the top and about 52 px from the sides, centered.
- Height about 86 px with a 17 px corner radius.
- Translucent warm-paper fill, white hairline border, inner highlight, and 22 px background blur.
- Left: `Interlink` wordmark in the established editorial serif at about 34 px.
- Right: `Schedule`, `Connections`, `Sign out`, then a 52 px circular outline profile button.
- `Schedule` is the active location through a modest weight and tonal shift only. Do not add a dot, underline, or pill.

## Page composition

Desktop canvas: 1600 by 1000, showing the complete primary scheduling experience above the fold.

1. Atmospheric full-bleed background derived from the dashboard, with soft-focus campus light and visible paper-like grain.
2. Floating dashboard navbar.
3. Intro area beginning around 180 px from the top:
   - Headline: `Make room for each other.`
4. Main scheduling workspace in a 12-column layout:
   - Weekly calendar occupies roughly 9.5 columns.
   - Saved-times summary occupies roughly 2.5 columns.
   - Both surfaces share one calm visual family without a card nested inside another card.
5. Bottom utility row contains autosave status and a single primary action: `Done with this week`.

## Calendar component

- One large translucent panel with a 20 to 22 px radius.
- Header row contains `Your week`, the date range `Jul 13 - Jul 19`, and a short drag instruction. Week-navigation buttons are intentionally omitted.
- Seven day columns labeled `MON 13` through `SUN 19`.
- Visible range: 8 AM to 8 PM. Use fine horizontal rules and even vertical separators.
- Availability blocks are rounded capsules with light internal texture, small time labels, and no heavy shadow.
- Use amber for selected or primary slots and dusty blue for alternate slots.
- Show realistic sample blocks on several days so the interaction is immediately understandable.
- Do not render a current-time indicator. It reads as an unexplained stray line inside availability blocks.
- Include a small instruction near the header: `Drag across the grid to add time`.

## Saved-times summary

- Sits beside the calendar as a separate translucent surface, aligned to the calendar top.
- Title: `Saved times`.
- Supporting count: `6 windows - 12 open hours`.
- A simple vertical list of saved slots, grouped by day. Each row has day, time, color dot, and a quiet close icon.
- Use thin dividers instead of boxed mini-cards.
- `Clear all` appears as a small underlined utility action in the header.
- Keep the panel free of decorative overlap or Venn symbols so the saved-time list can use the full height.

## Calendar prototype directions

### Prototype A: Week ledger

A broad, populated time ledger with seven equal day columns and restrained horizontal rules. The week title and range share one baseline, the drag instruction sits at the far right, and availability appears as compact amber and dusty-blue blocks. Saved times form a narrow adjacent index. This direction is closest to the working implementation and prioritizes immediate comprehension.

### Prototype B: Day folios

A quieter editorial interpretation where each day reads as a tall paper folio within one continuous calendar surface. Hours remain aligned across the full week, but vertical day bands use alternating near-white tones rather than explicit boxed columns. Availability windows span within the folios as flat color fields with a small time range and no shadow. The saved-time index is integrated as a narrow marginal column, like annotations beside a printed planner.

## Controls and states

- Primary action: deep ink button, warm-paper text, 16 px radius, minimum height 64 px.
- Secondary controls: paper-glass fill, 1 px ink or white hairline, 10 to 12 px radius.
- Hover: subtle 2 px lift or opacity change.
- Focus: 2 px ink outline with 4 px offset.
- Autosave state: `ALL CHANGES SAVED` in small tracked Geist text with a minimal check mark.
- Empty state should explain the gesture in one sentence and keep the calendar visible.

## Spacing and shape language

- Maximum content width: about 1310 px.
- Page side padding: 48 to 72 px desktop.
- Large vertical gaps: 40 to 64 px.
- Panel padding: 24 to 32 px.
- Primary radii: 16 to 22 px.
- Circular shapes are reserved for profile and overlap motifs.
- Avoid dense card stacks, gradients inside controls, excessive badges, and decorative icon clutter.

## Responsive behavior

- Tablet: calendar remains primary; summary moves below it in two columns where possible.
- Mobile: navbar collapses to wordmark and profile control. Calendar becomes horizontally scrollable with a clear affordance. Saved times become a full-width list below.
- Preserve the editorial headline scale but keep the full first line readable without awkward wrapping.

## Mockup acceptance criteria

- Clearly belongs to the same product as the landing page and signed-in dashboard.
- Navbar matches the signed-in dashboard structure and material treatment.
- Weekly scheduling interaction is understandable at a glance.
- Text is sparse, legible, and spelled exactly as specified.
- Warm editorial atmosphere remains dominant over generic SaaS-dashboard styling.
- No legacy dark grid background, blue neon glow, nested-card clutter, or fake browser chrome.
