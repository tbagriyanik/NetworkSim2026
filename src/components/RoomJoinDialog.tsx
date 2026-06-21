'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRoom } from '@/contexts/RoomContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { StudentProgress } from '@/lib/roomTypes';

export function RoomJoinDialog() {
  const { showRoomJoinDialog, setShowRoomJoinDialog, joinRoom, studentRoomCode, leaveRoom } = useRoom();
  const { t } = useLanguage();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentProgress[]>([]);

  useEffect(() => {
    if (!showRoomJoinDialog) return;
    const handleMobileBack = () => setShowRoomJoinDialog(false);
    window.addEventListener('mobile-back-pressed', handleMobileBack);
    return () => window.removeEventListener('mobile-back-pressed', handleMobileBack);
  }, [showRoomJoinDialog, setShowRoomJoinDialog]);

  useEffect(() => {
    if (!studentRoomCode) return;
    let cancelled = false;
    const fetchStudents = async () => {
      try {
        const res = await fetch(`/api/room/${studentRoomCode}/students`);
        if (!cancelled && res.ok) {
          const json = await res.json();
          if (json.success) setStudents(json.data);
        }
      } catch { /* ignore */ }
    };
    fetchStudents();
    const intervalId = setInterval(fetchStudents, 5000);
    return () => { cancelled = true; clearInterval(intervalId); };
  }, [studentRoomCode]);

  const handleJoin = async () => {
    if (code.trim().length >= 4 && name.trim().length > 0) {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/room/${code.trim().toUpperCase()}`);
        const json = await res.json();
        if (json.success && json.data.exists) {
          joinRoom(code.trim(), name.trim());
        } else {
          setError(t.language === 'tr' ? 'Oda bulunamadı' : 'Room not found');
        }
      } catch {
        setError(t.language === 'tr' ? 'Bağlantı hatası' : 'Connection error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Dialog open={showRoomJoinDialog} onOpenChange={setShowRoomJoinDialog}>
      <DialogContent className="sm:max-w-sm" onEscapeKeyDown={() => {}} onPointerDownOutside={() => {}}>
        <DialogHeader>
          <DialogTitle>{studentRoomCode ? `${t.roomJoinTitle} — ${studentRoomCode}` : t.roomJoinTitle}</DialogTitle>
          <DialogDescription>
            {studentRoomCode ? t.roomJoinedListDesc : t.roomJoinDesc}
          </DialogDescription>
        </DialogHeader>

        {studentRoomCode ? (
          <div className="space-y-3">
            <div className="space-y-1 max-h-[50vh] overflow-y-auto">
              {students.map(s => (
                <div key={s.studentId} className="flex items-center gap-2 rounded-lg border bg-muted/30 px-2.5 py-1.5">
                  <span className="text-xs font-medium truncate min-w-0 flex-1">{s.displayName}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{s.completedTasks}/{s.totalTasks}</span>
                  <div className="h-1 w-12 overflow-hidden rounded-full bg-muted shrink-0">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${s.totalTasks > 0 ? (s.completedTasks / s.totalTasks) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
              {students.length === 0 && (
                <p className="py-4 text-center text-[11px] text-muted-foreground">{t.roomNoStudents}</p>
              )}
            </div>
            <Button variant="outline" className="w-full" onClick={leaveRoom}>
              {t.roomLeave}
            </Button>
          </div>
        ) : (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <Input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().slice(0, 10))}
              placeholder={t.roomCodePlaceholder}
              onKeyDown={e => { if (e.key === 'Enter') document.getElementById('room-name-input')?.focus(); }}
            />
            <Input
              id="room-name-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t.roomNamePlaceholder}
              maxLength={50}
              onKeyDown={e => { if (e.key === 'Enter') handleJoin(); }}
            />
            {error && <p className="text-[10px] font-bold text-red-500 px-1">{error}</p>}
            <Button
              className="w-full"
              onClick={handleJoin}
              disabled={code.trim().length < 4 || !name.trim() || isLoading}
            >
              {isLoading ? '...' : t.roomJoinBtn}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
