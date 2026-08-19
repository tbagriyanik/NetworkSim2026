/** Canonicalizes IOS-style interface names used by the simulator. */
export function normalizePortId(input: string): string | null {
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
  if (lower === 'wlan0') return 'wlan0';
  return null;
}
