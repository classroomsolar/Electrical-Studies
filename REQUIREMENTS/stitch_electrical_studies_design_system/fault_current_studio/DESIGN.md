---
name: Fault Current Studio
colors:
  surface: '#031427'
  surface-dim: '#031427'
  surface-bright: '#2a3a4f'
  surface-container-lowest: '#000f21'
  surface-container-low: '#0b1c30'
  surface-container: '#141c28'
  surface-container-high: '#1b2b3f'
  surface-container-highest: '#26364a'
  on-surface: '#d3e4fe'
  on-surface-variant: '#bfc7d2'
  inverse-surface: '#d3e4fe'
  inverse-on-surface: '#213145'
  outline: '#89929b'
  outline-variant: '#3f4850'
  surface-tint: '#93ccff'
  primary: '#93ccff'
  on-primary: '#003351'
  primary-container: '#3198dc'
  on-primary-container: '#002c47'
  inverse-primary: '#006398'
  secondary: '#7bd0ff'
  on-secondary: '#00354a'
  secondary-container: '#00a6e0'
  on-secondary-container: '#00374d'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#ca8100'
  on-tertiary-container: '#3e2400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#cce5ff'
  primary-fixed-dim: '#93ccff'
  on-primary-fixed: '#001d31'
  on-primary-fixed-variant: '#004b73'
  secondary-fixed: '#c4e7ff'
  secondary-fixed-dim: '#7bd0ff'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004c69'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#031427'
  on-background: '#d3e4fe'
  surface-variant: '#26364a'
  surface-obsidian: '#090d13'
  surface-workspace: '#0d1117'
  surface-elevated: '#1c2635'
  surface-active: '#243144'
  stroke-structural: '#303e52'
  stroke-subtle: '#212c3b'
  text-primary: '#e6edf3'
  text-muted: '#8b949e'
  text-disabled: '#475569'
  duty-pass: '#10b981'
  duty-pass-container: '#022c22'
  duty-warn: '#f59e0b'
  duty-warn-container: '#422006'
  duty-fail: '#ef4444'
  duty-fail-container: '#4c0519'
  voltage-lv: '#10b981'
  voltage-mv: '#0284c7'
  voltage-hv: '#a855f7'
  arc-hazard: '#f97316'
  grid-line: '#1e293b'
  grid-axis: '#334155'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: '0'
  body-base:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: '0'
  body-bold:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: '0'
  data-mono-lg:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.02em
  data-mono-base:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: '0'
  data-mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: '0'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

### Vision & Identity
This design system establishes an industrial-grade engineering analytical studio and computational workbench constructed strictly for electrical power systems specialists, substation engineers, and protection coordination consultants. Inspired by physical instrumentation hardware (oscilloscopes, power analyzers, secondary injection relay test sets) and high-performance desktop CAE tools (ETAP, SKM Power*Tools, EasyPower), the visual posture eliminates frivolous ornamentation in favor of rigorous precision, deterministic mathematical clarity, and extreme data density.

### Design Movement: High-Contrast Technical Brutalism / Industrial Ergonomics
The styling draws from technical computing consoles and high-contrast instrumentation:
- **Foundational Grounds:** Deep obsidian and slate surfaces engineered to prevent ocular fatigue during prolonged study sessions.
- **Structural Precision:** Hairline 1px structural framing, crisp 2px to 4px component corners, and visible mechanical divisions evoking rack-mounted hardware.
- **Strict Functional Semiotics:** Hue is never decorative. Color carries absolute regulatory and engineering meaning across ANSI/IEEE and IEC standards (equipment duty pass/warn/fail boundaries, voltage classes, and single-line energized states).
- **Mathematical Legibility:** Strict pairing of structural sans-serif navigation with monospace tabular telemetry, guaranteeing decimal alignment across vast matrix comparisons.

## Colors

### Palette Philosophy
The palette operates with strict chromatic discipline on a dark base canvas:
- **Canvas Base (`#090D13` / `#0D1117`):** Non-emissive slate and obsidian backdrops that anchor complex single-line diagrams (SLD) and time-current characteristic (TCC) log-log grids without luminance bleed.
- **Electric Cyan Primary (`#0284C7`) & Interactive Secondary (`#38BDF8`):** Applied exclusively to calculation triggers, active selection reticles, energized nodes, and primary action controls.
- **Engineering Amber Tertiary (`#F59E0B`):** Reserved for calculation solver statuses, phase curves, transformer tap selectors, and moderate duty warnings (80%–100%).

### Regulatory Functional Semiotics
Color application adheres to physical equipment duty and power engineering conventions:
- **Red / Crimson (`#EF4444` / Container `#4C0519`):** Breaker duty exceedances (>100% interrupting capacity), fault points, component violations, and trip curves. Never used for aesthetic accents.
- **Amber / Gold (`#F59E0B` / Container `#422006`):** Marginal equipment rating warnings (80%–100%), DC decrement deratings, and coordination overlaps.
- **Emerald / Green (`#10B981` / Container `#022C22`):** Adequate equipment ratings (<80%), stable solver convergence, and ground-fault coordination validity.
- **Voltage Classes (SLD):** Low Voltage (<1 kV, 480V/208V) rendered in `#10B981`; Medium Voltage (1 kV–35 kV, 4.16kV/13.8kV) in `#0284C7`; High Voltage (>35 kV, 69kV/115kV/230kV) in `#A855F7`.

## Typography

### Dual Font Strategy
- **Primary Interface (Inter):** Handles application routing, tree navigation, dialog titles, standards documentation, and procedural parameter labels. Clean, low-distortion grotesk characteristics maintain legibility across dense dashboard configurations.
- **Technical Monospace (JetBrains Mono):** Drives all computational metrics, numerical readouts, matrix coordinates, equipment tags (e.g., `52-SWG-01`), impedance equations ($R + jX$), and uppercase status chips.

### Numerical Tabular Alignment & Unit Syntax
- All numerical data presentations must enforce `font-variant-numeric: tabular-nums` to guarantee vertical decimal point alignment across high-order electrical tables.
- Units of measure (`kA`, `MVA`, `kV`, `pu`, `Ω`, `cycles`) must never be detached from scalar values: render with a non-breaking space followed by the unit in `#8B949E` (Secondary Metric Slate).
- Line heights remain constrained (1.2 to 1.4) to maximize vertical information density on typical workstation displays without content clipping.

## Layout & Spacing

### Engineering Workbench Architecture
The layout uses a multi-pane docked CAD architecture calibrated for multi-monitor and high-resolution displays:
- **Master Header Toolbar (44px fixed height):** Houses global system status, active study selection (e.g., 3-Phase Bolted, L-G, Arc Flash), standard toggles (IEEE C37 / ANSI vs. IEC 60909), and export actions.
- **Left Navigation & Network Tree Dock (260px fixed width):** Tree view of project substations, buses, feeders, synchronous machines, and utility sources.
- **Central Canvas Workspace (Fluid flex-1):** Houses either the vector-based Single-Line Diagram (SLD) canvas or the tabular impedance calculation matrix.
- **Right Property & Duty Inspector (320px fixed width):** Parameter inputs and instantaneous duty evaluation readouts for the selected element.
- **Bottom Telemetry & Log Drawer (collapsible, 200px default):** Solver convergence iterations, symmetrical component matrices ($I_0, I_1, I_2$), and system trace logs.

### Density and Rhythmic Scaling
- **Grid Increment:** Strict 4px base step (`0.25rem`). Element internal padding relies on `space-xs` (4px) and `space-sm` (8px).
- **Separation Technique:** Dividers rely on 1px hairline structural strokes (`#303E52`) rather than large negative whitespace areas, preserving data packing efficiency.
- **Responsive Adaptations:**
  - *Desktop (≥1440px):* Full 3-pane workbench dock active simultaneously.
  - *Tablet / Small Desktop (1024px–1439px):* Left and right docks collapse into 44px vertical icon strips, expandable via overlay or hotkey (`Ctrl+B`, `Ctrl+I`).
  - *Mobile (<1024px):* Single active pane with horizontal bottom-tab navigation switching between SLD schematic, Bus Table, and Inspector views.

## Elevation & Depth

### Tonal Stratification & Hairlines
The visual hierarchy avoids soft drop shadows, which introduce perceptual blurring in dense technical drawings. Instead, depth is established via strict tonal layer steps and structural strokes:
- **Layer 0 (Canvas Base `#090D13`):** Underlying viewport ground, CAD grid workspace, and dark schematic canvas.
- **Layer 1 (Sub-surface `#0D1117`):** Master workbench frame, toolbar backgrounds, dock panels, and table striping.
- **Layer 2 (Containers `#141C28`):** Calculation result cards, modal dialogues, parameter blocks, and floating inspector heads.
- **Layer 3 (Elevated Instrument `#1C2635`):** Active row highlights, button resting states, card headers, and input suffixes.
- **Layer 4 (Interactive Focus `#243144`):** Drag targets, hovered components, and active dropdown options.

### Outlines and Laser Focus Borders
All cards, inputs, and docks feature a 1px solid hairline border using `#303E52` (Structural Stroke) or `#212C3B` (Subtle Stroke). Focused elements and active selections replace the neutral stroke with a 1px solid Electric Cyan highlight (`#38BDF8`) with an optional low-radius glow (`box-shadow: 0 0 8px rgba(2, 132, 199, 0.35)`).

## Shapes

### Mechanical Precision Geometry
The shape language uses minimal corner radii (roundedness `1`, base 2px to 4px) reflecting precision physical testing equipment, chassis enclosures, and calibrated meters:
- **Base Components (Inputs, Buttons, Cards):** `4px` (`0.25rem`) corner radius.
- **Micro Badges and Table Indicators:** `2px` corner radius.
- **Status Pills (Pass/Marginal/Fail):** Either `2px` or full pill (`9999px`) strictly for standard compliance chips.
- **Single-Line Diagram Nodes & Breakers:** Razor-sharp (`0px`) ANSI/IEEE electrical symbol drafting standards.

## Components

### Buttons
- **Primary Solve Action:** 32px height, background `#0284C7`, text `#FFFFFF`, font Inter 13px Semi-Bold, radius 4px, padding 0 14px. Hover: `#0369A1` with subtle glow `0 0 10px rgba(2, 132, 199, 0.4)`. Active: `#075985`.
- **Secondary Engineering Tool:** 32px height, background `#1C2635`, border 1px solid `#303E52`, text `#E6EDF3`. Hover: background `#243144`, border `#38BDF8`.
- **Danger / Clear Fault Action:** 32px height, background `#4C0519`, border 1px solid `#EF4444`, text `#FECDD3`. Hover: background `#EF4444`, text `#FFFFFF`.
- **Ghost Utility Button:** Borderless, background transparent, text `#8B949E`. Hover: background `#1C2635`, text `#E6EDF3`.

### Calculation Result Cards
- Constructed with `#141C28` background, 1px `#303E52` border, and 4px radius.
- Includes a 36px header in `#0F1620` with a 1px bottom border in `#212C3B`, featuring the component title on the left and the equipment duty status badge on the right.
- Content zone organizes results into tabular 3-column metric grids featuring large hero readouts (`data-mono-lg`, 18px `#E6EDF3`) paired with uppercase category caps (`label-caps`, 10px `#8B949E`).

### Equipment Duty Badges (Chips)
- Compact status indicator (height 20px, padding 2px 6px, font `JetBrains Mono` 10px Bold, uppercase, tracking `0.08em`):
  - **Pass / Adequate (<80%):** Background `#022C22`, border 1px solid `#10B981`, text `#A7F3D0` (e.g., `DUTY: 64.2% PASS`).
  - **Warn / Marginal (80%–100%):** Background `#422006`, border 1px solid `#F59E0B`, text `#FEF08A` (e.g., `DUTY: 91.8% WARN`).
  - **Fail / Overstressed (>100%):** Background `#4C0519`, border 1px solid `#EF4444`, text `#FECDD3` (e.g., `DUTY: 114.3% FAIL`).

### Input Fields & Parameter Forms
- **Field Styling:** Height 30px, background `#090D13`, border 1px solid `#303E52`, text `#E6EDF3`, font `JetBrains Mono` 12px Medium, padding 4px 8px, radius 4px.
- **Integrated Unit Suffix:** Fixed right-side badge container in `#1C2635` displaying the metric symbol (`kA`, `MVA`, `kV`, `%Z`, `X/R`) in `#8B949E`.
- **Validation State:** Red hairline border (`#EF4444`) with immediate inline warning readout below the input.

### Checkboxes & Radio Buttons
- 16x16px square (checkbox) or circular (radio), background `#090D13`, border 1px solid `#303E52`, radius 2px.
- Checked state: background `#0284C7`, border `#0284C7`, white glyph.

### Data Tables & Calculation Matrices
- Dense matrix layout with 28px header height (`#0F1620`, uppercase 10px monospace text in `#8B949E`).
- Row height: 28px, alternating striping with `#0D1117` and `#111722`. Hairline dividers in 1px `#212C3B`.
- Sticky column 0 for Bus/Node ID. Monospace values right-aligned with fixed tabular spacing.

### Single-Line Diagram (SLD) Graphic Elements
- **Orthogonal Grid:** Background `#06090E` with 16px grid pitch dots in `#1E293B`.
- **Bus Bars:** Solid 4px wide geometric vectors color-coded by voltage class (LV: `#10B981`, MV: `#0284C7`, HV: `#A855F7`).
- **Fault Nodes:** Pulsing crimson target glyph (`#EF4444`) with coordinates rendered in `data-mono-sm`.