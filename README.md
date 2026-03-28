# 🏎️ F1 App

A live F1 race tracker built with React. Shows driver positions on the track in real time, lets you replay everyone's best lap side-by-side, and includes a satellite map view of each circuit.

Data comes from the free [OpenF1 API](https://openf1.org) — no account needed.

---

## What it looks like

- **Live view** — colored dots for each driver moving around the track in real time
- **Replay mode** — watch every driver's best lap overlaid on the same track, with a live timing tower
- **Map view** — satellite imagery of the actual circuit with the track outline drawn on top

---

## Getting started (brand new laptop)

Follow these steps in order. You only need to do the installs once.

### Step 1 — Install Node.js

Node.js is the engine that runs JavaScript on your computer. npm (the package manager) comes bundled with it.

1. Go to **[nodejs.org](https://nodejs.org)**
2. Click the big **"LTS"** download button (the recommended version)
3. Open the downloaded file and follow the installer — just keep clicking Next/Continue
4. When it's done, open **Terminal** (Mac) or **Command Prompt** (Windows) and type:

```
node --version
```

You should see something like `v22.0.0`. If you do, Node is installed. ✅

---

### Step 2 — Install Git

Git lets you download and track changes to code.

**Mac:** Git is usually already installed. Check by typing in Terminal:
```
git --version
```
If it's not found, go to **[git-scm.com](https://git-scm.com)** and download the installer.

**Windows:** Go to **[git-scm.com](https://git-scm.com)**, download, and install. During install, leave all the default options selected.

---

### Step 3 — Install a code editor (recommended)

Cursor is a code editor with built-in AI that can help you understand and write code — great for learning.

1. Go to **[cursor.com](https://cursor.com)**
2. Download and install it

---

### Step 4 — Download the project

Open Terminal (Mac) or Command Prompt (Windows) and run these commands one at a time:

```bash
git clone https://github.com/therealtonynguyen/f1app.git
cd f1app
npm install
```

- `git clone` downloads all the code to your computer
- `cd f1app` moves into the project folder
- `npm install` downloads all the libraries the app needs (this may take a minute)

---

### Step 5 — Run the app

```bash
npm run dev
```

You'll see output like:

```
  VITE v8.0.0  ready in 300ms

  ➜  Local:   http://localhost:5173/
```

Open your browser and go to **[http://localhost:5173](http://localhost:5173)**

The app is running! 🎉

To stop it, go back to Terminal and press **Ctrl + C**.

---

## Making changes

1. Open the `f1app` folder in Cursor: **File → Open Folder**
2. Edit any file inside `src/`
3. The browser will automatically update as you save — no need to restart

The main files to know about:

| File | What it does |
|------|-------------|
| `src/App.tsx` | The root of the app, wires everything together |
| `src/components/TrackMap.tsx` | Draws the track and driver dots |
| `src/components/DriverPanel.tsx` | The right-side driver list and telemetry |
| `src/components/MapView.tsx` | The satellite map view |
| `src/hooks/useF1Data.ts` | Fetches live session data from OpenF1 |
| `src/hooks/useLapReplay.ts` | Handles the best lap replay logic |
| `src/api/openf1.ts` | All the API calls to OpenF1 |

---

## Saving your changes back to GitHub

After making changes you want to keep:

```bash
git add .
git commit -m "describe what you changed"
git push
```

---

## Tech stack

- [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org) — UI framework
- [Vite](https://vitejs.dev) — fast development server and build tool
- [Tailwind CSS](https://tailwindcss.com) — styling
- [Leaflet](https://leafletjs.com) + [react-leaflet](https://react-leaflet.js.org) — satellite map
- [OpenF1 API](https://openf1.org) — free F1 telemetry and position data
- [Jolpica F1 API](https://jolpi.ca) — circuit metadata
- [bacinger/f1-circuits](https://github.com/bacinger/f1-circuits) — circuit GeoJSON outlines
