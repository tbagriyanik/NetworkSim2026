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

export function RoomJoinDialog() {
  const { showRoomJoinDialog, setShowRoomJoinDialog, joinRoom, studentRoomCode, leaveRoom } = useRoom();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (!showRoomJoinDialog) return;
    const handleMobileBack = () => setShowRoomJoinDialog(false);
    window.addEventListener('mobile-back-pressed', handleMobileBack);
    return () => window.removeEventListener('mobile-back-pressed', handleMobileBack);
  }, [showRoomJoinDialog, setShowRoomJoinDialog]);

  const handleJoin = () => {
    if (code.trim().length >= 4 && name.trim().length > 0) {
      joinRoom(code.trim(), name.trim());
    }
  };

  return (
    <Dialog open={showRoomJoinDialog} onOpenChange={setShowRoomJoinDialog}>
      <DialogContent className="sm:max-w-sm" onEscapeKeyDown={() => {}}>
        <DialogHeader>
          <DialogTitle>Odaya Katıl</DialogTitle>
          <DialogDescription>
            Öğretmeninizin verdiği oda kodunu girerek sınıf takibine katılın.
          </DialogDescription>
        </DialogHeader>

        {studentRoomCode ? (
          <div className="space-y-3 rounded-lg border border-slate-200/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm p-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{studentRoomCode}</span> odasına{' '}
              <span className="font-semibold text-foreground">{name || 'anonim'}</span> olarak katıldınız.
            </p>
            <Button variant="outline" className="w-full" onClick={leaveRoom}>
              Odadan Ayrıl
            </Button>
          </div>
        ) : (
          <div className="space-y-3 rounded-lg border border-slate-200/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm p-4">
            <Input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().slice(0, 10))}
              placeholder="Oda kodu (ör: AG7X2)"
              onKeyDown={e => { if (e.key === 'Enter') document.getElementById('room-name-input')?.focus(); }}
            />
            <Input
              id="room-name-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Adınız"
              maxLength={50}
              onKeyDown={e => { if (e.key === 'Enter') handleJoin(); }}
            />
            <Button
              className="w-full"
              onClick={handleJoin}
              disabled={code.trim().length < 4 || !name.trim()}
            >
              Katıl
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
