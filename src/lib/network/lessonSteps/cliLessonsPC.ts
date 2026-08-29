import type { GuidedStep } from '../guidedMode.types';

export const cliLessonsPC: GuidedStep[] = [
  // ===== PC İŞLEMİ (53) =====
  {
    id: 'cli-lesson-1-2',
    order: 53,
    sectionTitle: { tr: 'PC İşlemi', en: 'PC Operation' },
    title: { tr: 'Ping Komutu', en: 'Ping Command' },
    description: { tr: 'Ping komutu ile ağ bağlantısını test edin', en: 'Test network connectivity with ping command' },
    hint: { tr: 'pc-1: ping 192.168.1.2 yazın', en: 'pc-1: Type ping 192.168.1.2' },
    checkType: 'command',
    checkParams: { commandPattern: 'ping' },
    completed: false,
    points: 15
  }
];