# Space Tarot

A space-themed tarot web app built with React, TypeScript, and Vite, with random card draws, configurable GLM AI readings, and scripts for generating card assets.

[简体中文](README.zh-CN.md)

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. For AI readings, enter your GLM API key in the app's AI settings. The key is stored in the current browser's `localStorage`; no key is required in the repository's `.env.example`.

## Production build

```bash
npm run build
```

Set `NODE_ENV=production` when starting the built server:

```bash
# macOS / Linux
NODE_ENV=production npm run start
```

```powershell
# Windows PowerShell
$env:NODE_ENV = "production"
npm run start
```

Open `http://localhost:3000`. Without the production environment variable, `server.ts` takes its Vite development path.

## Card assets and text

| Source | Generated runtime assets |
| --- | --- |
| `images/tarots/*.png` | `src/generated/tarots/*.webp` |
| `images/card_back/*.png` | `src/generated/card_backs/*.webp` |

`npm run dev` and `npm run build` run `generate:assets` first. To regenerate individual groups:

```bash
npm run generate:tarots
npm run generate:card-backs
```

The tarot generator scales images to 900 px wide and clears old generated WebP files before writing the new set. Original PNGs remain the editable sources. Filenames such as `The_Fool.webp` map to display names with spaces.

Edit card descriptions and optional upright/reversed keywords in [`src/data/cardDescriptions.ts`](src/data/cardDescriptions.ts). See the [Chinese guide](README.zh-CN.md) for an example.

## Random draws

Draws use browser Web Crypto randomness, Fisher–Yates shuffling, and unbiased integer selection. Cards are removed from the remaining deck within a spread, and upright/reversed orientation is randomized independently.

## Development checks

```bash
npm run lint
npm test
```
