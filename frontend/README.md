# Frontend Overview

This document summarizes the architecture, configuration, and development workflow of the IP lookup frontend.

## Tech Stack

- **React 18** with functional components and hooks powered by Vite's fast dev server and build tooling (`vite`, `@vitejs/plugin-react`).
- **Tailwind CSS 3** for utility-first styling with PostCSS and Autoprefixer.
- **lucide-react** icon library for consistent UI iconography.

Key dependencies and scripts are declared in `package.json`.

## Project Structure

```
frontend/
├── index.html               # Vite entry HTML template
├── package.json             # Dependencies and NPM scripts
├── postcss.config.js        # PostCSS plugin setup
├── tailwind.config.js       # Tailwind theme configuration
└── src/
    ├── App.jsx              # Main application component
    ├── main.jsx             # React/Vite bootstrap
    └── styles.css           # Global Tailwind layers and theming hooks
```

## NPM Scripts

| Script        | Purpose |
|---------------|---------|
| `npm run dev` | Start the Vite development server with hot module replacement. |
| `npm run demo` | Launch dev server with `VITE_LOOKUP_PATH=/lookup/sample` to serve fixture data. |
| `npm run build` | Generate an optimized production build. |
| `npm run preview` | Preview the production build locally. |

## Configuration & Environment

The frontend reads the `VITE_LOOKUP_PATH` environment variable at build time to determine which backend lookup endpoint to call. The value is normalized to ensure it always produces a leading slash before being prefixed with `/api` for local proxying.@frontend/src/App.jsx#57-99

If no value is provided, the application defaults to `/lookup`, enabling the backend proxy to use its own configuration.

## Data Flow

1. On mount, the custom `useIpDetails` hook triggers an asynchronous fetch to `/api${LOOKUP_PATH}` and manages loading, success, and error states.@frontend/src/App.jsx#62-103
2. Successful responses are normalized through `parseIpstack`, which extracts IP, ISP, ASN, geo, and timezone data, providing graceful fallbacks when fields are missing.@frontend/src/App.jsx#104-123
3. Errors reset the view to default placeholder content and surface a user-friendly error banner while logging technical details to the console.@frontend/src/App.jsx#83-418

> **Plan requirement:** The app depends on ipstack's **Connection** and **Time Zone** modules—features included beginning with the Starter plan.

The primary application component consumes this hook to render live connection data, additional UI state (copy/share feedback), and theming toggles.@frontend/src/App.jsx#148-383

## UI Composition

- **Header** – Displays the product identity, refresh control, and theme toggle with visual styles that adapt to the current color mode.@frontend/src/App.jsx#285-339
- **Summary Card** – Highlights the public IP, version, and caveat about location precision while exposing quick copy/share actions.@frontend/src/App.jsx#342-383
- **Connection Details** – Organizes ISP, ASN, country, and timezone metadata into two columns, using the `DetailRow` helper for consistent layout.@frontend/src/App.jsx#387-477
- **Map Panel** – Embeds an OpenStreetMap view when coordinates are available and shows graceful fallbacks or loading overlays otherwise.@frontend/src/App.jsx#422-449
- **Footer** – Presents lightweight legal links and attribution.@frontend/src/App.jsx#453-463

## Theming & Styling

Tailwind's base styles are extended in `styles.css`, enabling smooth transitions between light and dark modes.@frontend/src/styles.css#1-13 The application persists the user's color preference in `localStorage`, syncs with the system theme, and applies the `dark` class to `<html>` to drive Tailwind's dark variants.@frontend/src/App.jsx#43-170

Most interactive elements use memoized class name helpers that switch between light and dark palettes, ensuring consistent visual balance in both themes.

## Mapping Utilities

OpenStreetMap helper functions generate both embeddable iframes and external navigation links for the current coordinates, allowing users to inspect their approximate location with minimal coupling to any single map provider.@frontend/src/App.jsx#131-142

## Extensibility Tips

- Add new detail rows by extending `parseIpstack` and passing additional props to `DetailRow`.
- Introduce alternative data providers by swapping the fetch implementation inside `useIpDetails` while keeping the normalized detail shape intact.
- Reuse theming helpers when adding new components to ensure they honor light/dark mode parity.

## Development Checklist

1. Install dependencies with `npm install` inside the `frontend` directory.
2. Start the app using `npm run dev` and visit the served URL (default `http://localhost:5173`).
3. Ensure the backend proxy is running so `/api${LOOKUP_PATH}` resolves successfully. Use `npm run demo` for a fixture-based workflow when the backend is unavailable.
4. Run `npm run build` before deployment and `npm run preview` to smoke-test the production bundle locally.
