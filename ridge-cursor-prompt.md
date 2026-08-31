# Cursor Prompt — Add Damage/Impact Prediction + Brighter Heatmap

Paste into Cursor in the same RIDGE project. Incremental update — reuse existing components, mock data structure, and styling.

---

## Task 1: Brighten the Heatmap Colors

The current heatmap gradient is too muted/dark to read clearly at a glance. Increase saturation and brightness across the board:

- Bump the color stops to more vivid, higher-saturation values:
  - Low: `#4ADE80` (bright green)
  - Moderate: `#FDE047` (bright yellow)
  - High: `#FB923C` (bright orange)
  - Very High: `#F87171` → punch up to `#FF3B3B` (vivid red)
  - Critical: `#FF0044` or `#FF1155` (hot magenta-red) with a stronger animated glow/pulse — increase the blur radius and opacity of the glow so Critical zones visually "burn" against the dark map background
- Increase the heat layer's overall intensity/opacity settings (if using `leaflet.heat`, raise `max` and `radius` params; if using the SVG gradient-blob fallback, increase blob opacity and reduce blur slightly so colors read as more saturated rather than washed out)
- Make sure the legend gradient bar is updated to match the new brighter stops
- Keep the dark map basemap/background as-is — only the heat intensity colors get brighter, for contrast

## Task 2: Add Predicted Damage / Impact Assessment

For each zone (on the Zone Detail page, and as a summary chip on hover/click from the map), add a new **Predicted Impact** section that estimates what a landslide at that zone's current/forecasted risk level would actually affect — not just the risk score itself, but the real-world consequences.

**New section on Zone Detail page — "Predicted Impact & Exposure":**

- **Estimated severity tier**: a simple label like "Localized" / "Moderate" / "Severe" / "Catastrophic", derived from a combination of the zone's risk score and its exposure data (see below) — doesn't need real modeling, just a mock lookup/scoring function that maps risk level + exposure count to a severity tier
- **What's in the path** — a list of exposed elements near/downslope of the zone, each mock-generated per zone:
  - Roads/highways (e.g. "NH-6 — 2.3 km stretch")
  - Settlements/villages (e.g. "Sohra village — approx. 1,200 residents")
  - Critical infrastructure (e.g. "110kV transmission line", "footbridge", "primary health centre")
  - Agricultural land (approx. hectares)
- **Estimated exposure numbers**: mock but plausible figures — population within predicted impact radius, number of structures, length of road network at risk
- **Contributing causative factors** ("Why this zone is at risk") — a short ranked list explaining the drivers behind the score, e.g.:
  1. Cumulative antecedent rainfall (72h) — highest contributing factor
  2. Slope angle exceeds stability threshold
  3. Recent deforestation/land-use change nearby
  4. Soil saturation trend rising
  5. Proximity to seismic fault line
  Each factor shown as a small horizontal bar indicating its relative contribution weight (mock percentages summing to 100%), so it visually reads like a feature-importance chart.
- Visually: use a card layout consistent with the existing Contributing Factors panel, but distinct enough to read as a separate concept — e.g. a warning-toned left border and an icon (use a `Users`, `Home`, or `AlertTriangle` icon from lucide-react per exposure item).

**Update `mockData.ts`:**
- Add an `exposure` object per zone containing: roads (name + length), settlements (name + population), infrastructure (list of named items), agriculturalLandHectares, estimatedPopulationInRadius, estimatedStructuresAtRisk
- Add a `causativeFactors` array per zone: `{ factor: string, contributionPercent: number }[]`, summing to 100
- Add a simple `getSeverityTier(riskLevel, exposure)` helper function that returns one of the four severity labels — a basic if/else or lookup table is fine, no real modeling needed

**Map integration:**
- When hovering/clicking a zone on the heatmap, the existing tooltip/popup should now also show the severity tier and a one-line summary of top exposure (e.g. "Severe — NH-6, ~1,200 residents, 2 infrastructure sites")

## General Notes

- All numbers are illustrative/mock — no real GIS proximity calculations needed, just plausible hardcoded data per zone that tells a coherent story for the demo
- Match existing dark theme and card styling
- No new backend/API calls — everything stays client-side mock data
