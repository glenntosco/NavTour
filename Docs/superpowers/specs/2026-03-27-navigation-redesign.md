# Navigation Redesign — Design Spec

**Date:** 2026-03-27
**Status:** Approved
**Phase:** 2 of NavTour Rebuild

## Overview

Redesign the app navigation to support a collapsible sidebar (232px expanded → 60px icon-only) and move user account controls from the sidebar bottom to the top bar. Only existing pages are included in the nav — new pages will be added as they're built.

## Decisions

- Nav items: only 6 existing pages (Dashboard, Analytics, Leads, Forms, Team, Settings)
- Collapse: manual toggle button at sidebar bottom, no auto-collapse
- Top bar: breadcrumbs (left) + user avatar with dropdown (right). No search, notifications, or help icons yet.
- Collapsed state: icons only with native `title` tooltips, group labels hidden entirely
- Sidebar state persisted in localStorage

## Layout: Expanded (232px)

```
┌───────────────────┬──────────────────────────────┐
│ sidebar (232px)   │ top-bar (48px)               │
│                   │ Breadcrumb         [Avatar ▾] │
│ [Logo] NavTour    │──────────────────────────────│
│ ───────────────── │                              │
│ Product Demos     │                              │
│                   │         @Body                │
│ ANALYZE           │                              │
│ Analytics         │                              │
│                   │                              │
│ CAPTURE           │                              │
│ Leads             │                              │
│ Forms             │                              │
│                   │                              │
│ MANAGE            │                              │
│ Team              │                              │
│ Settings          │                              │
│                   │                              │
│ ───────────────── │                              │
│ v1.5.0            │                              │
│ [« Collapse]      │                              │
└───────────────────┴──────────────────────────────┘
```

## Layout: Collapsed (60px)

```
┌──────┬───────────────────────────────────────────┐
│(60px)│ top-bar (48px)                            │
│      │ Breadcrumb                     [Avatar ▾] │
│[Logo]│─────────────────────────────────────────  │
│ ──── │                                           │
│ [📦] │                                           │
│ ──── │              @Body                        │
│ [📊] │                                           │
│ ──── │                                           │
│ [👤] │                                           │
│ [📝] │                                           │
│ ──── │                                           │
│ [👥] │                                           │
│ [⚙]  │                                           │
│      │                                           │
│ [»]  │                                           │
└──────┴───────────────────────────────────────────┘
```

## Top Bar

**Left:** Breadcrumb text (existing logic, unchanged)
**Right:** User avatar circle (first letter of email, `--nt-accent` background, white text)

**Avatar dropdown menu** (click to toggle, click-outside or Escape to dismiss):
- User email (muted text, display only)
- Divider line
- "Settings" → navigates to `/settings`
- "Sign out" → clears `navtour_auth` cookie, redirects to `/login`

Dropdown: `position: absolute`, top-right aligned below avatar, white background, `--nt-shadow-lg`, `--nt-radius-md` border-radius, `--nt-border` border, z-index 200.

## Sidebar Collapse Behavior

**Toggle button:** At the bottom of the sidebar, a `«`/`»` chevron button.
- Expanded: shows `« Collapse` text + chevron
- Collapsed: shows `»` chevron icon only, centered

**CSS transition:** `width 200ms var(--nt-ease)` on `.sidebar`

**Collapsed state CSS:**
- `.sidebar.collapsed` → `width: 60px`
- `.sidebar.collapsed .sidebar-wordmark` → `display: none`
- `.sidebar.collapsed .nav-item span` → `display: none`
- `.sidebar.collapsed .nav-group` → `display: none` (group labels hidden)
- `.sidebar.collapsed .nav-item` → centered, `justify-content: center`, padding adjusted
- `.sidebar.collapsed .sidebar-ver` → `display: none`
- `.sidebar.collapsed .collapse-text` → `display: none`
- Nav icons get native `title` attribute for tooltip on hover

**Persistence:** `localStorage["navtour_sidebar_collapsed"]` — read on first render via JS interop, write on toggle.

## What Moves

| Element | From | To |
|---------|------|----|
| User avatar circle | Sidebar bottom | Top bar right |
| User email display | Sidebar bottom | Avatar dropdown |
| Sign out link | Sidebar bottom | Avatar dropdown |

## What's Removed

- Sidebar bottom user section (replaced by top bar avatar)
- Sign out nav item from sidebar

## What's Unchanged

- Nav items and their routes (Dashboard, Analytics, Leads, Forms, Team, Settings)
- Nav group labels (Analyze, Capture, Manage)
- Breadcrumb logic
- Active state highlighting
- Nav item SVG icons
- Version display (shown when expanded, hidden when collapsed)

## File Changes

| File | Change |
|------|--------|
| `src/NavTour.Client/Layout/MainLayout.razor` | Rewrite sidebar + top bar structure, add collapse state, add avatar dropdown |

No new files created.

## CSS Token Usage

All colors from the Phase 1 design token system (`--nt-*` variables). Key tokens:
- Sidebar background: `var(--nt-surface-secondary)`
- Borders: `var(--nt-border)`
- Text: `var(--nt-text-primary)`, `var(--nt-text-secondary)`, `var(--nt-text-muted)`
- Active nav: `var(--nt-accent-light)` bg, `var(--nt-accent)` text
- Avatar: `var(--nt-accent)` bg, white text
- Dropdown shadow: `var(--nt-shadow-lg)`
- Transitions: `var(--nt-duration-normal)`, `var(--nt-ease)`
