# Design Specifications — FleetTracker

**Stitch Project:** [FleetTracker on Stitch](https://stitch.withgoogle.com/projects/7801393584195462950)
**Design System:** Fleet Intelligence System
**Created:** 2026-05-02

---

## 🎨 Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#6366f1` | Buttons, links, active states |
| Primary Container | `#8083ff` | Primary surfaces |
| Primary Light | `#c0c1ff` | Primary text on dark |
| Secondary | `#0ea5e9` / `#89ceff` | Info, secondary actions |
| Tertiary / Success | `#10b981` / `#4edea3` | Available, completed, positive |
| Warning | `#f59e0b` | Maintenance, caution |
| Danger / Error | `#ef4444` / `#ffb4ab` | Alerts, violations, delete |
| Background | `#051424` | Main background |
| Surface | `#122131` | Cards, panels |
| Surface High | `#1c2b3c` | Elevated cards |
| Surface Highest | `#273647` | Hover states |
| Text Primary | `#d4e4fa` | Main text |
| Text Muted | `#c7c4d7` | Secondary text |
| Outline | `#908fa0` | Borders |
| Outline Variant | `#464554` | Subtle borders |

## 📝 Typography

| Element | Font | Size | Weight | Line Height | Letter Spacing |
|---------|------|------|--------|-------------|----------------|
| H1 | Inter | 30px | 700 | 38px | -0.02em |
| H2 | Inter | 24px | 600 | 32px | -0.01em |
| H3 | Inter | 20px | 600 | 28px | -0.01em |
| Body Large | Inter | 16px | 400 | 24px | 0 |
| Body Medium | Inter | 14px | 400 | 20px | 0 |
| Label Small | Inter | 12px | 500 | 16px | 0.02em |
| Mono Data | Inter | 14px | 600 | 20px | 0.05em |

## 📐 Spacing System

| Name | Value | Usage |
|------|-------|-------|
| xs | 4px | Icon gaps, micro spacing |
| sm | 8px | Tight spacing, nav items |
| md | 16px | Default padding |
| lg | 24px | Card padding, section gaps |
| xl | 32px | Large sections |
| Container Margin | 24px | Page margins |
| Gutter | 20px | Grid gutters |

## 🔲 Border Radius

| Name | Value | Usage |
|------|-------|-------|
| sm | 4px (0.25rem) | Small elements |
| default | 8px (0.5rem) | Buttons, inputs |
| md | 12px (0.75rem) | Cards |
| lg | 16px (1rem) | Large cards, panels |
| xl | 24px (1.5rem) | Modals |
| full | 9999px | Pills, badges, avatars |

## 🌫️ Elevation & Depth

| Level | Background | Usage |
|-------|-----------|-------|
| Level 0 | `#051424` | Page background |
| Level 1 | `#122131` | Cards, sidebar |
| Level 2 | `#1c2b3c` | Elevated cards, hover |
| Level 3 (Glass) | `backdrop-blur(20px) + 70% opacity` | Modals, dropdowns, overlays |

Borders: `1px solid rgba(255, 255, 255, 0.08)`

## 📱 Layout

| Element | Value |
|---------|-------|
| Grid | 12-column fluid |
| Sidebar Width | 260px |
| Header Height | 72px |
| Content Max Width | Fluid |
| Mobile Breakpoint | 768px |

## ✨ Animations

| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| fast | 150ms | ease-out | Hover, focus |
| normal | 200ms | ease-in-out | Transitions |
| slow | 300ms | ease-in-out | Panel slide, modal |
| GPS marker | 1000ms | linear | Smooth GPS position updates |

## 🎯 Status Colors

| Status | Color | Badge Style |
|--------|-------|-------------|
| Available | `#4edea3` (tertiary) | Green pill |
| Delivering / In Progress | `#8083ff` (primary container) | Indigo pill |
| Maintenance | `#f59e0b` (amber) | Amber pill |
| Off Duty | `#908fa0` (outline) | Gray pill |
| Alert: Speed | `#ef4444` (red) | Red left-border |
| Alert: Route | `#f59e0b` (amber) | Amber left-border |
| Alert: Stop | `#f97316` (orange) | Orange left-border |
| Alert: Incident | `#ef4444` (red) | Red left-border, critical |

---

## 🖼️ Screen Inventory

| # | Screen | Type | Device | Stitch ID |
|---|--------|------|--------|-----------|
| 1 | Fleet Dashboard Overview | Dashboard | Desktop | `ae7f2b28f2dd4556a4b333acdb213062` |
| 2 | Live Tracking & Geofencing | Map | Desktop | *(generated)* |
| 3 | Vehicle Management | CRUD Table | Desktop | *(generated)* |
| 4 | Dispatch & Assignment | 3-Column | Desktop | *(generated)* |
| 5 | Driver KPI & Performance | Detail | Desktop | *(generated)* |
| 6 | Driver App — Trip List | List | Mobile | *(generated)* |
| 7 | Driver App — Active Trip | Navigation | Mobile | *(generated)* |

---

## 🧩 Component Reference

### Sidebar Navigation
- Width: 260px, background: surface
- Active: indigo left-border (3px) + `rgba(99,102,241,0.1)` bg
- Icons: 20px, consistent stroke weight
- Items: 44px height, sm padding

### Stat Cards
- Background: surface with subtle gradient
- Border: 1px `outline-variant`
- Large number: H1 weight
- Trend indicator: small sparkline or % change
- Icon: 40px circle with 10% opacity color bg

### Data Tables
- Header: uppercase labels, `label-sm` style
- Rows: 56px height, 1px bottom border
- Hover: `surface-container-high` background
- Actions: icon buttons (edit, delete)

### Alert Items
- Left border: 3px, color by severity
- Background: surface
- Icon + type + vehicle + time layout
- Unresolved: slightly brighter bg

### Map Components
- Style: Dark (Mapbox dark-v11 or similar)
- Vehicle markers: truck icon, color by status
- Route: 3px dashed line, primary color
- Geofence: transparent circle, 20% primary fill
- Popup: glassmorphism card

### Mobile Bottom Sheet
- Glassmorphism background
- Handle bar: 40px wide, centered
- Action button: full-width, 56px height, primary color
- Timeline: horizontal dots with labels

---

*Generated by AWF — Visualize Phase | Stitch Design System*
