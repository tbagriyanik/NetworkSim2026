const portNormalizeCache = new Map<string, string | null>();

/** Canonicalizes interface names used by the simulator. */
export function normalizePortId(input: string): string | null {
  if (!input) return null;
  const cached = portNormalizeCache.get(input);
  if (cached !== undefined) return cached;

  const result = ((): string | null => {
    const lower = input.toLowerCase().trim().replace(/\s+/g, '');

    const threePart = lower.match(/^(?:gigabitethernet|gigabit|gig|gi|g|fastethernet|fast|fa|f)(\d+)\/(\d+)\/(\d+)$/);
    if (threePart) return `${lower.startsWith('f') ? 'fa' : 'gi'}${threePart[1]}/${threePart[2]}/${threePart[3]}`;

    const subinterface = lower.match(/^(?:fa|fastethernet|fast|f|gi|gig|gigabit|gigabitethernet|g)(\d+)\/(\d+)\.(\d+)$/);
    if (subinterface) return `${lower.startsWith('f') ? 'fa' : 'gi'}${subinterface[1]}/${subinterface[2]}.${subinterface[3]}`;

    const twoPart = lower.match(/^(?:fastethernet|fast|fa|f|gigabitethernet|gigabit|gig|gi|g)(\d+)\/(\d+)$/);
    if (twoPart) return `${lower.startsWith('f') ? 'fa' : 'gi'}${twoPart[1]}/${twoPart[2]}`;

    const serial = lower.match(/^(?:serial|se|s)(\d+)\/(\d+)\/(\d+)$/);
    if (serial) return `s${serial[1]}/${serial[2]}/${serial[3]}`;

    const serialTwoPart = lower.match(/^(?:serial|se|s)(\d+)\/(\d+)$/);
    if (serialTwoPart) return `s${serialTwoPart[1]}/${serialTwoPart[2]}/0`;

    const loopback = lower.match(/^(?:loopback|lo)\s*(\d+)$/);
    if (loopback) return `loopback${loopback[1]}`;

    const portChannel = lower.match(/^(?:port-channel|portchannel|po)\s*(\d+)$/);
    if (portChannel) return `po${portChannel[1]}`;

    if (lower === 'wlan0') return 'wlan0';
    return null;
  })();

  if (portNormalizeCache.size < 1000) {
    portNormalizeCache.set(input, result);
  }
  return result;
}
