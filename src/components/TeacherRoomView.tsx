'use client';

import { useState } from 'react';
import { useRoomStudents } from '@/hooks/useRoomStudents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TeacherRoomViewProps {
  defaultRoomCode?: string;
}

export function TeacherRoomView({ defaultRoomCode }: TeacherRoomViewProps) {
  const [roomCode, setRoomCode] = useState(defaultRoomCode ?? '');
  const [activeCode, setActiveCode] = useState(defaultRoomCode ?? '');
  const { students, error } = useRoomStudents(activeCode);

  const handleJoin = () => {
    const trimmed = roomCode.trim();
    if (trimmed.length >= 4) setActiveCode(trimmed.toUpperCase());
  };

  if (!activeCode) {
    return (
      <div className="flex items-center gap-2 p-4">
        <Input
          value={roomCode}
          onChange={e => setRoomCode(e.target.value)}
          placeholder="Oda kodu girin"
          className="max-w-48"
          onKeyDown={e => { if (e.key === 'Enter') handleJoin(); }}
        />
        <Button onClick={handleJoin}>Odaya Katıl</Button>
      </div>
    );
  }

  const totalStudents = students.length;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Oda: {activeCode}</h2>
          <Badge variant="default">{totalStudents} öğrenci</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setActiveCode('')}>
          Çıkış
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">Bağlantı hatası</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {students.map(s => {
          const progress = s.totalTasks > 0 ? (s.completedTasks / s.totalTasks) * 100 : 0;
          return (
            <Card key={s.studentId}>
              <CardHeader>
                <CardTitle className="text-sm">{s.displayName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground truncate">{s.currentTask || 'Bekliyor...'}</p>
                <div className="flex items-center justify-between text-xs">
                  <span>{s.completedTasks} / {s.totalTasks}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}

        {totalStudents === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
            Henüz öğrenci bağlanmadı.
          </p>
        )}
      </div>
    </div>
  );
}
