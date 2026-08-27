import { useCallback, useRef, useState } from 'react';
import type { PageItem, SourceFile, ProgressState } from '../types';
import { processSingleFile, extractFilesFromDataTransfer } from '../services/fileReaderService';
import { playSuccessSound } from '../services/soundService';

interface UseFileIngestionReturn {
  progress: ProgressState;
  isProcessing: boolean;
  handleFilesAdded: (newFiles: File[]) => Promise<void>;
  extractAndAddFromDataTransfer: (dataTransfer: DataTransfer) => Promise<void>;
  setProgress: React.Dispatch<React.SetStateAction<ProgressState>>;
}

export function useFileIngestion(
  onPagesAdded: (pages: PageItem[], files: SourceFile[]) => void,
  externalProgress?: ProgressState,
  externalSetProgress?: React.Dispatch<React.SetStateAction<ProgressState>>
): UseFileIngestionReturn {
  const [internalProgress, setInternalProgress] = useState<ProgressState>({
    isOpen: false,
    title: '',
    current: 0,
    total: 0,
    statusText: '',
    canCancel: false,
  });

  const progress = externalProgress ?? internalProgress;
  const setProgress = externalSetProgress ?? setInternalProgress;

  const isProcessingRef = useRef(false);

  const handleFilesAdded = useCallback(async (newFiles: File[]) => {
    if (newFiles.length === 0 || isProcessingRef.current) return;
    isProcessingRef.current = true;

    setProgress({
      isOpen: true,
      title: 'IMPORTING FILES',
      current: 0,
      total: newFiles.length,
      statusText: 'Reading files locally...',
      canCancel: false,
    });

    const addedPages: PageItem[] = [];
    const addedFiles: SourceFile[] = [];

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      setProgress((prev) => ({
        ...prev,
        current: i + 1,
        statusText: `Processing ${file.name} (${i + 1} of ${newFiles.length})...`,
      }));

      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      try {
        const result = await processSingleFile(file);
        if (result) {
          addedFiles.push(result.file);
          addedPages.push(...result.pages);
        }
      } catch (err) {
        console.error(`Error processing file ${file.name}:`, err);
      }
    }

    if (addedPages.length > 0 || addedFiles.length > 0) {
      onPagesAdded(addedPages, addedFiles);
      playSuccessSound();
    }

    setProgress({
      isOpen: false,
      title: '',
      current: 0,
      total: 0,
      statusText: '',
    });
    isProcessingRef.current = false;
  }, [onPagesAdded, setProgress]);

  const extractAndAddFromDataTransfer = useCallback(async (dataTransfer: DataTransfer) => {
    const extracted = await extractFilesFromDataTransfer(dataTransfer);
    if (extracted.length > 0) {
      await handleFilesAdded(extracted);
    }
  }, [handleFilesAdded]);

  return {
    progress,
    isProcessing: progress.isOpen,
    handleFilesAdded,
    extractAndAddFromDataTransfer,
    setProgress,
  };
}
