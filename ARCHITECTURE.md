# I HATE PDF — Architecture & Refactor Overview (2026-08)

> **Status:** Refactored 2026-08-27. Build passes (`tsc && vite build`), bundle ~133kB gzip ~33kB, zero type errors.

## 1. High-Level Diagram

```
[Browser UI] ── Global Dropzone / Paste ──► [Ingestion: fileReaderService]
                        │                              │
                        ▼                              ▼
            [ Workspace State (pages/files) ] ◄── [IndexedDB: storageService]
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
    [PageGrid / FileGroupView]  [SelectionBar / BottomActionBar]  [Modals]
          │                          │
          └────► [Shared Layout Engine] ──► [Export Router: pdfService + exportService]
                                    │                │
                                    ▼                ▼
                              WYSIWYG Canvas   PDF/Image/ZIP output (pdf-lib, fflate)
```

**Invariant:** Visual preview (`drawWysiwygPageToCanvas`) and final PDF export share the **identical** `calculatePageGeometry` math → WYSIWYG guarantee.

---

## 2. Directory Layout (Post-Refactor)

```
src/
├── App.tsx                     # 497 lines (was 1158) — composes hooks, delegates to services
├── types/index.ts              # FileType, PageItem, SourceFile, CompressionSettings, etc.
├── constants/
│   ├── app.ts                  # APP_NAME, ACCEPTED_FILE_TYPES, DEFAULT_LAYOUT, zoom bounds
│   ├── paper.ts                # STANDARD_PAPER_SIZES, PT_PER_MM, MARGIN_PRESETS
│   └── compression.ts          # COMPRESSION_PRESETS, estimateReductionFactor
├── utils/
│   ├── id.ts                   # generateId / generatePageId / generateDupId (crypto.randomUUID)
│   ├── bytes.ts                # formatBytes, estimateTotalBytes
│   ├── fileType.ts             # detectFileType, stripExtension, isSupportedFile
│   ├── geometry.ts             # reorderPages, reorderMultiple, normalizeRotation
│   └── rangeParser.ts          # parseRangeExpression("1-5, 8") → indices
├── services/
│   ├── fileReaderService.ts    # detectFileType + extractFilesFromDataTransfer + processSingleFile
│   ├── pdfRenderService.ts     # pdfjs-dist worker, docCache, renderPdfPageThumbnail/Canvas
│   ├── imageService.ts         # loadImageFromBlob, processImageFile, renderTextToThumbnail
│   ├── layoutEngine.ts         # calculatePageGeometry + drawWysiwygPageToCanvas (WYSIWYG core)
│   ├── pdfService.ts           # generateMergedPdf, generateSplitPdfs (pure PDF assembly)
│   ├── exportService.ts        # executeExport (router: pdf | jpg/png/webp | split | txt)
│   ├── storageService.ts       # IndexedDB via idb (save/load/clearWorkspaceSession)
│   ├── zipService.ts           # fflate zipSync + triggerFileDownload
│   └── soundService.ts         # WebAudio tick/snap/success (mute toggle)
├── hooks/
│   ├── useWorkspacePersistence.ts  # load on mount, debounced save, restore notice
│   ├── usePageSelection.ts         # selectedIds, lastIndex, shift/ctrl/range/marquee
│   ├── useFileIngestion.ts         # handleFilesAdded with progress + dataTransfer helper
│   ├── useGlobalDragDrop.ts        # window dragenter/leave/over/drop (counter guard)
│   ├── useClipboardPaste.ts        # window paste + navigator.clipboard.read helper
│   ├── useKeyboardShortcuts.ts     # Ctrl+A, Esc, Delete, Space, R, D
│   └── useWorkspaceActions.ts      # (legacy) bulk page mutations (kept for extensibility)
├── components/
│   ├── Header.tsx              # brand, zoom slider (GRID_ZOOM_* constants), mute, view toggle
│   ├── DropZone.tsx            # drag overlay + empty landing + hidden inputs (ACCEPTED_FILE_TYPES)
│   ├── PageCard.tsx            # memoized, WYSIWYG canvas, fixed thumbnail cache invalidation
│   ├── PageGrid.tsx            # DndContext + rectSortingStrategy, drag overlay badge
│   ├── FileGroupView.tsx       # grouped by SourceFile, memoized fileGroups
│   ├── SelectionBar.tsx        # sticky bulk toolbar (FIT/FILL/STRETCH, layout menu, rotate, etc.)
│   ├── BottomActionBar.tsx     # page/file count, compress badge, Export CTA
│   ├── MarqueeSelection.tsx    # drag rectangle → AABB overlap (fixed stale-closure bug via refs)
│   ├── PreviewModal.tsx        # high-res canvas, zoom, margin guides, nav, memoized geom
│   ├── CropModal.tsx           # 8-handle crop box, aspect presets
│   ├── ResizeModal.tsx         # paper/orientation/sizing/margins/custom dims
│   ├── CompressModal.tsx       # presets via COMPRESSION_PRESETS, shared formatBytes
│   ├── ExportModal.tsx         # scope + format grid + quality/split options
│   ├── RangeSelectorModal.tsx  # uses parseRangeExpression from utils
│   ├── MetadataModal.tsx       # title/author/subject/keywords
│   └── ProgressModal.tsx       # progress bar
└── styles/index.css            # monochrome, custom scrollbar, fadeIn

```

---

## 3. What Was Refactored (1158 → 497 lines in App.tsx)

### 3.1 App.tsx Decomposition
| Before | After |
|---|---|
| Monolithic 1158-line component mixing ingestion, drag, paste, keyboard, selection, bulk actions, export, persistence | **App.tsx 497 lines** composes 6 hooks; page ops are 5-10 line `useCallback` wrappers around `utils/geometry` + `constants/paper` |
| Duplicate paste handling (clipboardData + navigator.clipboard.read) in App | **`useClipboardPaste` hook** centralizes both paths, exposes `handlePasteButtonClick` + `resetCounter` |
| Global drag listeners inline with counter ref | **`useGlobalDragDrop` hook** with stable callbacks, counter guard |
| Keyboard shortcuts inline, stale closure on `pages`/`selectedIds` | **`useKeyboardShortcuts` hook** with `isEditingTarget` guard |
| Session restore + auto-save mixed with UI | **`useWorkspacePersistence` hook** (load once, debounced save, `restoreNotice`) |
| Export execution 200+ lines inline, duplicated canvas logic | **`exportService.executeExport`** router + `pdfService` pure functions; `resolveDpiScale`/`resolveJpegQuality` extracted |
| Selection state + 8 handlers inline | **`usePageSelection` hook** (selectAll/odd/even/invert, shift-range, ctrl-toggle, marquee, range) |

### 3.2 Services Hardening
- **`fileReaderService`**: removed local `generateId`/`detectFileType` duplicates → imports `utils/id` + `utils/fileType` + `DEFAULT_PAGE_LAYOUT`; typed `traverseFileTree` (was `any`); uses `generatePageId`/`generateFileId`.
- **`pdfRenderService`**: typed `TextContent` extraction (was `any`), fallback worker URL collapsed.
- **`pdfService`**: extracted `resolveDpiScale`/`resolveJpegQuality`/`createSourceCanvas`, removed `docSafe(any)` hack → typed `PDFDocumentProxy`; uses `stripExtension` from `utils/fileType`.
- **`layoutEngine`**: now re-exports `STANDARD_PAPER_SIZES` from `constants/paper` (single source of truth); kept `calculatePageGeometry`/`drawWysiwygPageToCanvas` unchanged mathematically.
- **`exportService` (new)**: single entry `executeExport(options, pages, files, selectedIds, setProgress)` routes to `generateMergedPdf` | `exportAsImages` | `generateSplitPdfs` | text; shared `makeProgressCallback`.
- **`imageService`/`storageService`/`zipService`/`soundService`**: unchanged logic, but imports now use `type` imports where applicable.

### 3.3 Constants & Utils Extraction
- `constants/app` → `APP_NAME`, `ACCEPTED_FILE_TYPES`, `DEFAULT_COMPRESSION`, `DEFAULT_PAGE_LAYOUT`, `GRID_ZOOM_*`, canvas base sizes.
- `constants/paper` → `STANDARD_PAPER_SIZES` (now with `mmW/mmH`), `PT_PER_MM`, `MARGIN_PRESETS`.
- `constants/compression` → `COMPRESSION_PRESETS`, `estimateReductionFactor` (replaces inline switch).
- `utils/id` → `generateId` prefers `crypto.randomUUID` when available.
- `utils/bytes` → `formatBytes` + `estimateTotalBytes` (single implementation, was duplicated in 2 modals).
- `utils/fileType` → `detectFileType`, `stripExtension`, `getFileExtension`.
- `utils/geometry` → `reorderPages`, `reorderMultiple`, `normalizeRotation`.
- `utils/rangeParser` → `parseRangeExpression` / `rangesToText` (was inline in RangeSelectorModal).

### 3.4 Component Fixes
- **`MarqueeSelection`**: fixed stale `isSelecting`/`selectionBox` closure bug (was in `useEffect` deps causing listener re-registration every mousemove). Now uses `*Ref` pattern, deps only `[containerRef, onSelectPages]`.
- **`PageCard`**: fixed thumbnail cache leak (was `imageCacheRef.current` never invalidated when `thumbnailUrl` changed). Now `{url, img}` tuple + check `url === thumbnailUrl`; added `type` import, safe `zoomScale` default.
- **`CompressModal` / `FileGroupView`**: replaced local `formatBytes` with `utils/bytes`; `CompressModal` now uses `COMPRESSION_PRESETS` + `estimateReductionFactor`.
- **`RangeSelectorModal`**: now delegates to `utils/rangeParser`.
- **`Header`**: zoom slider now uses `GRID_ZOOM_MIN/MAX/STEP` from `constants/app`.
- **`DropZone`**: `accept={ACCEPTED_FILE_TYPES}` from `constants/app`, fixed `@ts-ignore` → `@ts-expect-error`.
- **`PreviewModal`**: deduplicated double `loadHighResPreview` effect; memoized `geom` via `useMemo`; extracted `goToPrev/Next/handleZoom*` as `useCallback`; fixed stale closure in key handler (now deps `[onClose, goToPrev, goToNext, handleZoomIn, handleZoomOut]`); early return `!geom` guard.
- **`FileGroupView`**: memoized `fileGroups` with `useMemo`.
- **`PageGrid`**: unchanged logic but now imports `type PageItem` for `isolatedModules`.

### 3.5 Types & Build
- Added `type` imports (`import type`) for `isolatedModules` compliance.
- Removed all `any` in `fileReaderService`, `pdfRenderService`.
- `tsconfig.json` already `strict: true, noUnusedLocals/Parameters` — now passes with zero errors.
- `vite.config.ts` unchanged (manualChunks already optimal); build time 1.6–1.7s, 2043 modules.

---

## 4. Data Flow Details

### 4.1 Ingestion
```
File (drop/pick/paste) → detectFileType → processSingleFile
  ├─ pdf → getPdfDocument(cache) → renderPdfPageThumbnail per page → PageItem[]
  ├─ image → loadImageFromBlob → processImageFile → PageItem
  └─ text → renderTextToThumbnail → PageItem
→ onPagesAdded → setPages/setFiles → IndexedDB auto-save (debounced 1s)
```

### 4.2 Selection
- Single click: replace set
- Ctrl/Cmd+click: toggle
- Shift+click: range from `lastSelectedIndex`
- Marquee: AABB overlap, additive if Shift/Ctrl held
- Range modal: `parseRangeExpression`
- Presets: Odd/Even/All/Invert via `usePageSelection`

### 4.3 WYSIWYG Layout
```
PageItem { width, height, rotation, crop, layout } → calculatePageGeometry
→ { paperWidth/paperHeight, printable*, draw* , scale, isClipped }
→ drawWysiwygPageToCanvas(srcCanvas, page, targetCanvas, {scaleMultiplier, showMarginGuides})
   1) fill paper background
   2) optional margin guides
   3) crop to intermediate canvas
   4) clip to printable rect
   5) translate/rotate/draw
```
Same `geom` used in `pdfService` to create `PDFDocument.addPage([geom.paperWidth, geom.paperHeight])` → exact visual match.

### 4.4 Export
```
executeExport(options, pages, files, selectedIds, setProgress)
 ├─ pdf: generateMergedPdf → for each PageItem: createSourceCanvas → drawWysiwygPageToCanvas → embedJpg → addPage
 ├─ jpg/png/webp: same loop → canvasToBlob → downloadAsZip or triggerFileDownload
 ├─ split-pdf: generateSplitPdfs (single-page | by-file | every-n-pages) → zip
 └─ txt/csv: concatenate textContent
```

---

## 5. Key Invariants & Guarantees

- **Local-only**: no network after initial load; `storageService` uses IndexedDB only.
- **WYSIWYG**: `layoutEngine` is single source of truth for preview & export geometry.
- **Fault-tolerant ingestion**: `processSingleFile` skips unsupported types, catches per-file errors, never aborts batch.
- **Session recovery**: `loadWorkspaceSession` upgrades old pages missing `layout` with `DEFAULT_PAGE_LAYOUT`.
- **Cache hygiene**: `pdfRenderService.docCache` cleared on `removeFile` / `resetWorkspace`; `PageCard` image cache invalidated on URL change; `clearPdfCache()` on reset.

---

## 6. How to Extend

- **Add paper size**: edit `constants/paper.ts` `STANDARD_PAPER_SIZES` (width/height in points). `layoutEngine` auto-picks it.
- **Add export format**: add branch in `services/exportService.ts` + button in `components/ExportModal.tsx`.
- **New bulk action**: add handler in `App.tsx` following `bulkSet*` pattern (map over `selectedIds.has(p.id)`), expose via `SelectionBar` props.
- **New hook**: place under `src/hooks/`, export from `src/hooks/index.ts`, compose in `App.tsx`.

---

## 7. Verification

```bash
npm run build   # tsc --noEmit + vite build — must pass
npm run dev     # vite dev server on http://localhost:5173
```

Current build (2026-08-27):
```
dist/assets/index-*.js               133.73 kB │ gzip 33.20 kB
dist/assets/dnd-kit-*.js             192.10 kB │ gzip 61.99 kB
dist/assets/pdf-lib-*.js             430.78 kB │ gzip 178.28 kB
dist/assets/pdfjs-dist-*.js          364.07 kB │ gzip 107.16 kB
```

---

## 8. Future Suggested (Not Yet Done)

- Add `vitest` + `react-testing-library` for `utils/rangeParser`, `utils/geometry`, `layoutEngine`.
- Move `MarqueeSelection` to use `PointerEvent` for touch support.
- Add `ErrorBoundary` around `PageGrid` to isolate corrupt PDF render failures.
- Consider `zustand` or `jotai` if `App.tsx` grows again beyond ~500 lines.
- Add `eslint` + `prettier` (currently relies on `tsc` strict).

