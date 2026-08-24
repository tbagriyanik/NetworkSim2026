// pcFileSystem.ts
// Simple in‑memory file system persisted in localStorage per PC device.

export type FSNode =
  | { type: 'dir'; children: Record<string, FSNode> }
  | { type: 'file'; content: string };

/** Load the file system for a given deviceId. */
export function loadFs(deviceId: string): FSNode {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(`pc_fs_${deviceId}`);
      if (raw) {
        return JSON.parse(raw) as FSNode;
      }
    } catch {
      // ignore corrupted data or storage restrictions
    }
  }
  // Initialise empty root directory
  return { type: 'dir', children: {} };
}

/** Persist the file system for a given deviceId. */
export function saveFs(deviceId: string, fs: FSNode): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(`pc_fs_${deviceId}`, JSON.stringify(fs));
    } catch {
      // ignore storage errors
    }
  }
}



/** Resolve a possibly relative path against a current working directory. */
export function resolvePath(cwd: string, input: string): string {
  if (!input) return cwd;
  const isAbs = /^[a-zA-Z]:[\\/]/.test(input) || input.startsWith('\\');
  const base = isAbs ? '' : cwd.endsWith('\\') ? cwd : cwd + '\\';
  const combined = base + input;

  const driveMatch = /^[a-zA-Z]:/.exec(combined);
  const drive = driveMatch ? driveMatch[0] : 'C:';
  const pathWithoutDrive = combined.replace(/^[a-zA-Z]:/, '');

  const parts = pathWithoutDrive.split(/[\\/]+/).filter(Boolean);
  const stack: string[] = [];
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      if (stack.length > 0) stack.pop();
    } else {
      stack.push(part);
    }
  }
  return drive + '\\' + stack.join('\\');
}

/** Helper to traverse the FS tree and return the node at a given absolute path. */
function getNode(fs: FSNode, path: string): FSNode | null {
  if (fs.type !== 'dir') return null;
  const pathWithoutDrive = path.replace(/^[a-zA-Z]:/, '');
  const parts = pathWithoutDrive.split(/[\\/]+/).filter(Boolean);
  let node: FSNode = fs;
  for (const part of parts) {
    if (node.type !== 'dir') return null;
    const child: FSNode | undefined = node.children[part];
    if (!child) return null;
    node = child;
  }
  return node;
}

/** Helper to split path into segments ignoring drive letter prefix. */
function getPathParts(p: string): string[] {
  const pathWithoutDrive = p.replace(/^[a-zA-Z]:/, '');
  return pathWithoutDrive.split(/[\\/]+/).filter(Boolean);
}

/** Check if a given path exists and is a directory. */
export function isDir(fs: FSNode, path: string): boolean {
  const norm = path.replace(/^[a-zA-Z]:/, '');
  if (norm === '' || norm === '\\' || norm === '/') return true;
  const node = getNode(fs, path);
  return node !== null && node.type === 'dir';
}

/** List directory entries (both files and folders) at the given absolute path. */
export function listDir(fs: FSNode, path: string): string[] {
  const node = getNode(fs, path);
  if (!node || node.type !== 'dir') return [];
  return Object.keys(node.children);
}

/** Create a directory at the given absolute path. */
export function makeDir(fs: FSNode, path: string): boolean {
  const parts = getPathParts(path);
  let cur: FSNode = fs;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (cur.type !== 'dir') return false;
    if (!cur.children[part]) {
      cur.children[part] = { type: 'dir', children: {} };
    } else if (cur.children[part].type !== 'dir') {
      return false; // exists as file
    }
    cur = cur.children[part];
  }
  return true;
}

/** Remove an empty directory at the given absolute path. */
export function removeDir(fs: FSNode, path: string): boolean {
  const parts = getPathParts(path);
  if (parts.length === 0) return false;
  const name = parts.pop()!;
  const parentPath = parts.join('\\');
  const parent = getNode(fs, parentPath);
  if (!parent || parent.type !== 'dir') return false;
  const target = parent.children[name];
  if (!target || target.type !== 'dir' || Object.keys(target.children).length > 0) return false;
  delete parent.children[name];
  return true;
}

/** Read file content at the given absolute path. */
export function readFile(fs: FSNode, path: string): string | null {
  const node = getNode(fs, path);
  return node && node.type === 'file' ? node.content : null;
}

/** Write (create or overwrite) a file at the given absolute path. */
export function writeFile(fs: FSNode, path: string, content: string): boolean {
  const parts = getPathParts(path);
  const name = parts.pop()!;
  const parentPath = parts.join('\\');
  const parent = getNode(fs, parentPath);
  if (!parent || parent.type !== 'dir') return false;
  parent.children[name] = { type: 'file', content };
  return true;
}

/** Delete a file at the given absolute path. */
export function deleteFile(fs: FSNode, path: string): boolean {
  const parts = getPathParts(path);
  const name = parts.pop()!;
  const parentPath = parts.join('\\');
  const parent = getNode(fs, parentPath);
  if (!parent || parent.type !== 'dir') return false;
  const node = parent.children[name];
  if (!node || node.type !== 'file') return false;
  delete parent.children[name];
  return true;
}
