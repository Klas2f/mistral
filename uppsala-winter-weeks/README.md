# Uppsala cold seasons: weekly mean temperature (Oct-Mar)

Interactive SVG chart of cold-season (Oct-Mar) weekly mean temperatures in Uppsala, Sweden,
one line per season since the 2019/20 season. Built as a self-contained React component
(`App.tsx`), no charting libraries required.

## Features

- One line per season, drawn on a shared Oct 1 - Mar 31 timeline (26 weeks of 7 days).
- Sequential color ramp: light = oldest season, dark = most recent complete season;
  the in-progress season is dashed orange and stops at the latest available observation.
- **Box selection**: drag a rectangle on the chart to select a week range (x) and a
  temperature band (y). A panel shows the average of all plotted points inside the box,
  the point count, and a per-season breakdown. Click to clear.

## Data

SMHI open data (station Uppsala / Uppsala Aut, parameter "Lufttemperatur, medel per dygn"),
daily mean temperatures aggregated into weekly means. Values are embedded in `App.tsx`.
Seasons are labelled by ending year pair (e.g. 2026/27 = Oct 2026 - Mar 2027).
The 2026/27 season includes observations up to Nov 18, 2026.

Source: https://www.smhi.se/data/temperatur-och-vind/temperatur/ars--och-manadsstatistik

## Usage

React 17+ with JSX/TSX transpilation:

```tsx
import App from "./App";
// render <App /> anywhere
```