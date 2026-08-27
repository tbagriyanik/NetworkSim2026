import { useEffect, useState } from 'react';

export function usePageProjectStorage() {
  const [projectName, setProjectName] = useState('Untitled');
  const [loadedExampleId, setLoadedExampleId] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const savedName = localStorage.getItem('lastProjectName');
      if (savedName) timer = setTimeout(() => setProjectName(savedName), 0);
    } catch { /* storage unavailable */ }
    return () => { if (timer) clearTimeout(timer); };
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const savedExampleId = localStorage.getItem('lastLoadedExampleId');
      if (savedExampleId) timer = setTimeout(() => setLoadedExampleId(savedExampleId), 0);
    } catch { /* storage unavailable */ }
    return () => { if (timer) clearTimeout(timer); };
  }, []);

  useEffect(() => {
    try {
      if (loadedExampleId) localStorage.setItem('lastLoadedExampleId', loadedExampleId);
      else localStorage.removeItem('lastLoadedExampleId');
    } catch { /* storage unavailable */ }
  }, [loadedExampleId]);

  useEffect(() => {
    try { localStorage.setItem('lastProjectName', projectName); } catch { /* storage unavailable */ }
  }, [projectName]);

  return { projectName, setProjectName, loadedExampleId, setLoadedExampleId };
}
