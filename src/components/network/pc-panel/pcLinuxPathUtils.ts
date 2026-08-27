export function formatLinuxPath(winPath: string): string {
  if (!winPath || winPath === 'C:\\') return '~';
  const clean = winPath.replace(/^C:\\?/i, '').replace(/\\/g, '/');
  return clean ? `~/${clean}` : '~';
}

export function formatWinToUnixPath(winPath: string): string {
  if (!winPath || winPath === 'C:\\') return '/home/user';
  const clean = winPath.replace(/^C:\\?/i, '').replace(/\\/g, '/');
  return `/home/user/${clean}`;
}
