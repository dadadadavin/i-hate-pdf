import { useEffect, useRef, useCallback } from 'react';

export function useClipboardPaste(
  onFilesPasted: (files: File[]) => void
) {
  const pasteCountRef = useRef(1);

  // Global paste listener (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (!e.clipboardData) return;

      const items = e.clipboardData.items;
      const extractedFiles: File[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            let fileName = file.name;
            if (!fileName || fileName === 'image.png' || fileName === 'blob') {
              fileName = `screenshot_${pasteCountRef.current++}.png`;
            }
            extractedFiles.push(new File([file], fileName, { type: file.type || 'image/png' }));
          }
        } else if (item.kind === 'string' && item.type === 'text/plain') {
          // For text/plain we need async callback; handle synchronously via queue
          // Defer to promise resolution - we collect via getAsString
          item.getAsString((text) => {
            if (text && text.trim().length > 0 && extractedFiles.length === 0) {
              const textFile = new File([text], `pasted_text_${pasteCountRef.current++}.txt`, { type: 'text/plain' });
              onFilesPasted([textFile]);
            }
          });
        }
      }

      if (extractedFiles.length > 0) {
        e.preventDefault();
        onFilesPasted(extractedFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onFilesPasted]);

  const handlePasteButtonClick = useCallback(async () => {
    try {
      // Prefer modern async clipboard API
      if (navigator.clipboard && 'read' in navigator.clipboard) {
        const clipboardItems = await (navigator.clipboard as unknown as { read(): Promise<ClipboardItem[]> }).read();
        const extractedFiles: File[] = [];

        for (const item of clipboardItems) {
          for (const type of item.types) {
            if (type.startsWith('image/')) {
              const blob = await item.getType(type);
              extractedFiles.push(new File([blob], `screenshot_${pasteCountRef.current++}.png`, { type }));
            }
          }
        }

        if (extractedFiles.length > 0) {
          onFilesPasted(extractedFiles);
          return;
        }
      }

      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim().length > 0) {
          const textFile = new File([text], `pasted_text_${pasteCountRef.current++}.txt`, { type: 'text/plain' });
          onFilesPasted([textFile]);
          return;
        }
      }

      alert('Clipboard is empty or does not contain image/text data. Press Cmd+V / Ctrl+V directly.');
    } catch {
      alert('Press Cmd+V (Mac) or Ctrl+V (Windows) anywhere on the page to paste.');
    }
  }, [onFilesPasted]);

  const resetCounter = useCallback(() => {
    pasteCountRef.current = 1;
  }, []);

  return { handlePasteButtonClick, resetCounter };
}
