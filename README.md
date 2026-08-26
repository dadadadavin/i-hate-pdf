# I HATE PDF

<p align="center">
  <strong>A web-based, 100% local-processing PDF & document workspace with an ultra-clean black-and-white minimalist interface.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Privacy-100%25%20Local%20%26%20Private-black?style=for-the-badge&logo=shield" alt="100% Local" />
  <img src="https://img.shields.io/badge/React-18-black?style=for-the-badge&logo=react" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-black?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6-black?style=for-the-badge&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/License-MIT-black?style=for-the-badge" alt="License" />
</p>

---

## 🖤 The Philosophy

> **No accounts. No cloud uploads. No dashboard clutter. No unnecessary steps.**

Most online PDF tools require uploading sensitive personal documents to third-party remote servers, waiting for cloud queues, or paying subscriptions for basic page operations.

**I HATE PDF** runs **entirely inside your browser** on your local machine using WebAssembly, Web Workers, HTML5 Canvas, and modern Web APIs. Your files **never leave your device**.

```text
DROP FILES (or PASTE) ──> EDIT & PREVIEW (WYSIWYG) ──> COMPRESS / CONVERT ──> EXPORT
```

---

## ⚡ Key Features

### 1. 📄 True WYSIWYG PDF Page-Layout Engine
- **"If I click Export right now, is this exactly what this page will look like?"**
- Every card on the grid and in the full-screen preview accurately renders the **physical paper sheet** (A4, US Letter, US Legal, A3, A5, Original):
  - **`Fit` Mode**: Scales content proportionally inside the printable sheet — letterbox whitespace is visibly shown.
  - **`Fill` Mode**: Fills the entire paper sheet — overflow bleed is cleanly clipped at the boundary.
  - **`Stretch` Mode**: Stretches content to the exact paper dimensions.
  - **`Margins`**: Customizable whitespace margins (`0 mm`, `6 mm`, `12.7 mm`, `25.4 mm`) with optional guideline markers.
  - **`Orientation`**: Portrait, Landscape, or Auto (detects landscape orientation dynamically).
- The visual canvas preview and the `pdf-lib` document exporter share the exact same mathematical layout calculator ([`src/services/layoutEngine.ts`](src/services/layoutEngine.ts)).

### 2. 🖱️ Complete Multi-Select & Selection Engine
- **Single Click**: Select a single page.
- **Ctrl / Cmd + Click**: Toggle individual pages in/out of multi-selection.
- **Shift + Click**: Select a continuous range from the last selected page.
- **Ctrl / Cmd + A**: Select all pages in the workspace.
- **Click Workspace Background**: Instantly deselects all pages.
- **Range Expression Selector**: Type expressions like `1-5, 8, 10-14` or choose presets (`Odd`, `Even`, `All`, `Invert`).
- Selected pages are highlighted with high-contrast black borders and elevated drop shadows.

### 3. 🛠️ Bulk Actions & Transformations
- When multiple pages are selected, apply instant bulk changes:
  - **Page Layout**: Bulk switch Paper Format (A4, Letter, Legal), Orientation, and Margins.
  - **Sizing Mode**: 1-click toggle between `FIT`, `FILL`, and `STRETCH`.
  - **Rotation**: Bulk rotate `+90°`, `-90°`, or `180°`.
  - **Page Operations**: Duplicate, Delete, Reverse Order, or Extract.
  - **Visual Cropping**: Interactive visual canvas cropper with aspect ratio presets (`Free`, `1:1`, `4:3`, `16:9`, `A4`, `Letter`).

### 4. 📋 Continuous Clipboard Paste (`Cmd+V` / `Ctrl+V`)
- Paste screenshots, image buffers, or copied files directly from your clipboard.
- Paste once, paste again, and keep pasting — every new paste cleanly appends as new pages into the active workspace.
- Includes a dedicated `[ 📋 PASTE ]` button in the header and landing screen.

### 5. 📂 Bulk File Ingestion & Folder Drops
- Drop 50+ files at once or select multiple files using the file picker.
- Supports **recursive folder drops** (`webkitGetAsEntry`) to ingest entire directory trees.
- **Mixed Batches**: Ingest PDFs, JPGs, PNGs, WebPs, BMPs, SVGs, TXT, and CSV files in a single unified workspace.
- **Fault-Tolerant**: Corrupted files are skipped gracefully without halting the batch.

### 6. 🔍 High-Resolution Page Preview & Zoom Viewer
- Double-click any page card, press `Spacebar`, or click the **Eye icon** on hover.
- Interactive Zoom (`+`, `-`, `0` reset, Fit to Screen).
- Keyboard Arrow Navigation (`←` Previous Page, `→` Next Page).
- Live layout controls (Fit/Fill, Size, Margins, Rotate, Crop, Delete) with immediate visual feedback.

### 7. 🗜️ Smart Compression Engine
- **Presets**: Lossless, High Quality (85%), Balanced (70%), Smallest Size (50%).
- **Live Size Estimates**: Calculated before/after byte estimation with percentage reduction badge.
- **Advanced Controls**: Quality slider, DPI downsampling (72–300 DPI), metadata stripping, and stream optimization.

### 8. 📦 Multi-Format Export Router
- **PDF**: Single combined document with all applied rotations, crops, size overrides, compression, and custom metadata (Title, Author, Subject, Keywords, Creator).
- **Images (JPG / PNG / WebP)**: Export pages as individual images or a packaged `.zip` archive via `fflate` with resolution scaling (1x, 2x, 3x).
- **Split PDF**: Split by single page or file chunks packaged into a `.zip` archive.
- **Text / CSV**: Text extraction from pages.

### 9. 💾 Session Recovery (IndexedDB)
- Automatically saves workspace state and binary blobs to browser IndexedDB so refreshing or closing the tab restores all work seamlessly.
- Includes a **"New Workspace / Clear All"** button for starting fresh at any time.

---

## 🛠️ Architecture & Tech Stack

```text
┌─────────────────────────────────────────────────────────────┐
│                    "I HATE PDF" Browser UI                   │
│                                                             │
│  [ Global Dropzone / Paste ] ──> [ Mixed Batch Ingestion ]  │
│                                           │                 │
│                                           ▼                 │
│  [ Workspace / Page Grid ] <────> [ IndexedDB Cache ]       │
│  • Drag-and-drop reorder          (Session Recovery)        │
│  • Multi-select & Bulk Toolbar                              │
│  • WYSIWYG Sheet Renderer                                   │
│                                           │                 │
│                                           ▼                 │
│  [ Shared Layout Engine ] ──────> [ Export Router ]         │
│  • Paper Geometry Calculation     • PDF Document (pdf-lib)  │
│  • Fit / Fill / Margins / Crop    • Image ZIP (fflate)      │
│                                   • Split PDFs / Text       │
└─────────────────────────────────────────────────────────────┘
```

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | Type-safe UI components & state |
| **Bundler** | [Vite 6](https://vitejs.dev/) | Sub-second HMR & optimized chunk splitting |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Pure black-and-white minimalist design |
| **PDF Manipulation** | [pdf-lib](https://pdf-lib.js.org/) | Merging, splitting, metadata, page sizing |
| **PDF Rendering** | [pdfjs-dist](https://mozilla.github.io/pdf.js/) | Fast page rendering & thumbnail extraction |
| **ZIP Archiving** | [fflate](https://github.com/101arrowz/fflate) | High-speed, lightweight in-browser compression |
| **Drag & Drop** | [@dnd-kit](https://dndkit.com/) | Smooth grid & list page reordering |
| **Local Storage** | [idb](https://github.com/jakearchibald/idb) | IndexedDB session persistence & recovery |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean monochrome iconography |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/dadadadavin/i-hate-pdf.git

# Navigate to project directory
cd i-hate-pdf

# Install dependencies
npm install
```

### Running Locally

```bash
# Start local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

```bash
# Build optimized static bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🔒 Privacy Guarantee

- **No Remote Tracking**: No Google Analytics, telemetry, or tracking pixels.
- **No Remote File Storage**: Every single operation (PDF rendering, image compression, page cropping, ZIP creation) executes strictly inside your browser's JavaScript / Web Worker runtime.
- **Offline Capable**: Once loaded, the application operates completely without internet connectivity.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
