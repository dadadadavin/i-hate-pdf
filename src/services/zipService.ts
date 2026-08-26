import { zipSync, Zippable } from 'fflate';

/**
 * Trigger immediate browser download of a Blob or Uint8Array
 */
export function triggerFileDownload(data: Blob | Uint8Array, fileName: string) {
  const blob = data instanceof Blob ? data : new Blob([data as any]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Package multiple files into a single ZIP archive and download it
 */
export function downloadAsZip(
  files: { name: string; data: Uint8Array }[],
  zipFileName: string
) {
  const zippableObj: Zippable = {};

  // Deduplicate file names if any collision
  const nameCounts = new Map<string, number>();

  for (const file of files) {
    let finalName = file.name;
    if (nameCounts.has(finalName)) {
      const count = nameCounts.get(finalName)! + 1;
      nameCounts.set(finalName, count);
      const extIndex = finalName.lastIndexOf('.');
      if (extIndex !== -1) {
        finalName = `${finalName.substring(0, extIndex)}_${count}${finalName.substring(extIndex)}`;
      } else {
        finalName = `${finalName}_${count}`;
      }
    } else {
      nameCounts.set(finalName, 1);
    }

    zippableObj[finalName] = file.data;
  }

  const zippedBytes = zipSync(zippableObj, { level: 6 });
  triggerFileDownload(zippedBytes, zipFileName);
}
