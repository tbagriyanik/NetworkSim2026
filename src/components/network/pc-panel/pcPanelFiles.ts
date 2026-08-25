import { loadFs, getNodeDetails, listDir } from './pcFileSystem';

export function getPCConfigDefaults(id: string) {
  const num = id.split('-')[1] || '1';
  return {
    ip: `192.168.1.${10 + parseInt(num)}`,
    mac: `00-40-96-99-88-7${num}`,
  };
}

export function getDefaultPcFiles(deviceId: string): Array<{ name: string; size: number; modifiedAt: string }> {
  const fs = loadFs(deviceId);
  const entries = listDir(fs, 'C:\\');
  const files: Array<{ name: string; size: number; modifiedAt: string }> = [];

  for (const entryName of entries) {
    const details = getNodeDetails(fs, `C:\\${entryName}`);
    if (details && details.type === 'file') {
      files.push({
        name: entryName,
        size: details.size,
        modifiedAt: details.modifiedAt,
      });
    }
  }

  return files;
}

