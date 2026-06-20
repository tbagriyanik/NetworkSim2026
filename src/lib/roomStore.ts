import { kv } from '@vercel/kv';
import type { RoomData, StudentProgress } from './roomTypes';

const ROOM_TTL = 60 * 60 * 4;

export async function createRoom(code: string): Promise<RoomData> {
  const key = `room:${code}`;
  const existing = await kv.get<RoomData>(key);
  if (existing) return existing;

  const room: RoomData = {
    code,
    createdAt: Date.now(),
    students: {},
  };
  await kv.set(key, room, { ex: ROOM_TTL });
  return room;
}

export async function updateStudent(
  roomCode: string,
  studentId: string,
  data: Partial<StudentProgress>,
): Promise<StudentProgress | null> {
  const key = `room:${roomCode}`;
  const room = await kv.get<RoomData>(key);
  if (!room) return null;

  const existing = room.students[studentId] ?? {
    studentId,
    displayName: '',
    currentTask: '',
    completedTasks: 0,
    totalTasks: 0,
    joinedAt: Date.now(),
    lastSeen: Date.now(),
  };

  if (!existing.joinedAt) existing.joinedAt = Date.now();

  room.students[studentId] = { ...existing, ...data, lastSeen: Date.now() };
  await kv.set(key, room, { ex: ROOM_TTL });
  return room.students[studentId];
}

export async function getRoomStudents(roomCode: string): Promise<StudentProgress[]> {
  const key = `room:${roomCode}`;
  const room = await kv.get<RoomData>(key);
  if (!room) return [];
  return Object.values(room.students);
}
