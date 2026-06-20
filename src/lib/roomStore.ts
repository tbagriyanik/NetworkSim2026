import { Redis } from '@upstash/redis';
import type { RoomData, StudentProgress } from './roomTypes';

const redisUrl = process.env.KV_REST_API_URL;
const redisToken = process.env.KV_REST_API_TOKEN;
if (!redisUrl || !redisToken) throw new Error('Missing KV_REST_API_URL or KV_REST_API_TOKEN env vars');
const redis = new Redis({ url: redisUrl, token: redisToken });

const ROOM_TTL = 60 * 60 * 4;

export async function createRoom(code: string): Promise<RoomData> {
  const key = `room:${code}`;
  const existing = await redis.get<RoomData>(key);
  if (existing) return existing;

  const room: RoomData = {
    code,
    createdAt: Date.now(),
    students: {},
  };
  await redis.set(key, room, { ex: ROOM_TTL });
  return room;
}

export async function updateStudent(
  roomCode: string,
  studentId: string,
  data: Partial<StudentProgress>,
): Promise<StudentProgress | null> {
  const key = `room:${roomCode}`;
  const room = await redis.get<RoomData>(key);
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
  await redis.set(key, room, { ex: ROOM_TTL });
  return room.students[studentId];
}

export async function getRoomStudents(roomCode: string): Promise<StudentProgress[]> {
  const key = `room:${roomCode}`;
  const room = await redis.get<RoomData>(key);
  if (!room) return [];
  return Object.values(room.students);
}
