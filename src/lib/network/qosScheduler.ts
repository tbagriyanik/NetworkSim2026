export type QosDiscipline = 'wfq' | 'llq' | 'cbwfq';
export interface QosPacket { id: string; className?: string; flow?: string; bytes: number; }
export interface QosClass { name: string; bandwidthPercent?: number; weight?: number; priority?: boolean; queueLimit?: number; }
export interface QosScheduleResult { transmitted: QosPacket[]; dropped: QosPacket[]; byClass: Record<string, { transmitted: number; dropped: number; bytes: number }>; }

/** Discrete, deterministic QoS scheduler. capacity is the available bytes for one scheduling interval. */
export function scheduleQosPackets(discipline: QosDiscipline, packets: QosPacket[], capacity: number, classes: QosClass[] = []): QosScheduleResult {
  const byName = new Map(classes.map(c => [c.name, c]));
  const queues = new Map<string, QosPacket[]>();
  for (const p of packets) { const key = p.className || 'default'; queues.set(key, [...(queues.get(key) || []), p]); }
  const transmitted: QosPacket[] = [], dropped: QosPacket[] = []; let remaining = Math.max(0, capacity);
  const order = [...queues.keys()].sort((a, b) => {
    const ca = byName.get(a), cb = byName.get(b);
    if (discipline === 'llq') return Number(Boolean(cb?.priority)) - Number(Boolean(ca?.priority));
    return (cb?.weight ?? cb?.bandwidthPercent ?? 1) - (ca?.weight ?? ca?.bandwidthPercent ?? 1);
  });
  for (const name of order) {
    const queue = queues.get(name)!; const cls = byName.get(name);
    const quota = discipline === 'llq' && cls?.priority ? remaining : discipline === 'wfq' ? remaining : Math.floor(capacity * (cls?.bandwidthPercent ?? 100) / 100);
    let used = 0;
    while (queue.length && used + queue[0].bytes <= quota && queue[0].bytes <= remaining) { const p = queue.shift()!; transmitted.push(p); used += p.bytes; remaining -= p.bytes; }
    dropped.push(...queue.splice(0));
  }
  const stats: QosScheduleResult['byClass'] = {};
  for (const p of packets) { const n = p.className || 'default'; stats[n] ||= { transmitted: 0, dropped: 0, bytes: 0 }; if (transmitted.includes(p)) { stats[n].transmitted++; stats[n].bytes += p.bytes; } else stats[n].dropped++; }
  return { transmitted, dropped, byClass: stats };
}
