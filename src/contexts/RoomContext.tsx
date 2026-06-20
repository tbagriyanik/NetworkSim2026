'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface RoomContextValue {
  studentRoomCode: string | null;
  studentDisplayName: string;
  showRoomJoinDialog: boolean;
  setShowRoomJoinDialog: (v: boolean) => void;
  showTeacherPanel: boolean;
  setShowTeacherPanel: (v: boolean) => void;
  joinRoom: (code: string, name: string) => void;
  leaveRoom: () => void;
}

const RoomContext = createContext<RoomContextValue | null>(null);

export function RoomProvider({ children }: { children: ReactNode }) {
  const [studentRoomCode, setStudentRoomCode] = useState<string | null>(null);
  const [studentDisplayName, setStudentDisplayName] = useState('');
  const [showRoomJoinDialog, setShowRoomJoinDialog] = useState(false);
  const [showTeacherPanel, setShowTeacherPanel] = useState(false);

  const joinRoom = useCallback((code: string, name: string) => {
    setStudentRoomCode(code.toUpperCase());
    setStudentDisplayName(name);
    setShowRoomJoinDialog(false);
    localStorage.setItem('room-joined-code', code.toUpperCase());
    localStorage.setItem('room-student-name', name);
  }, []);

  const leaveRoom = useCallback(() => {
    setStudentRoomCode(null);
    setStudentDisplayName('');
    localStorage.removeItem('room-joined-code');
    localStorage.removeItem('room-student-name');
  }, []);

  return (
    <RoomContext.Provider
      value={{
        studentRoomCode,
        studentDisplayName,
        showRoomJoinDialog,
        setShowRoomJoinDialog,
        showTeacherPanel,
        setShowTeacherPanel,
        joinRoom,
        leaveRoom,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('useRoom must be used within RoomProvider');
  return ctx;
}
