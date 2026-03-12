'use client';

import { useState, useRef, useEffect, useCallback, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { Network, Plus, Laptop, Monitor, Pencil, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ConnectionLine } from './ConnectionLine';
import { DeviceNode } from './DeviceNode';
import { NetworkTopologyContextMenu } from './NetworkTopologyContextMenu';
import { NetworkTopologyPortSelectorModal } from './NetworkTopologyPortSelectorModal';
import {
  CABLE_COLORS,
  NOTE_COLORS,
  NOTE_FONT_SIZES,
  NOTE_OPACITY,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_ZOOM,
  NOTE_DEFAULT_WIDTH,
  NOTE_DEFAULT_HEIGHT,
  NOTE_HEADER_HEIGHT,
} from './networkTopology.constants';
import { generateSwitchPorts, generateRouterPorts, generatePCPorts, getDeviceMacPrefix, getPortPosition, getDeviceCenter } from './networkTopology.helpers';
import { CanvasDevice, CanvasConnection, CanvasNote, NetworkTopologyProps, CableType } from './networkTopology.types';
import { NetworkTopologyView } from './NetworkTopologyView';

export default function NetworkTopology({
  cableInfo,
  onCableChange,
  selectedDevice: selectedDeviceProp,
  onDeviceSelect,
  onDeviceDoubleClick: onDeviceDoubleClickProp,
  onTopologyChange,
  onDeviceDelete,
  initialDevices,
  initialConnections,
  initialNotes,
  isActive,
  activeDeviceId: activeDeviceIdProp,
  deviceStates,
  isFullscreen: isFullscreenProp,
  onFullscreenChange,
  zoom: zoomProp,
  onZoomChange,
  pan: panProp,
  onPanChange,
}: NetworkTopologyProps) {
  // Use a unique key to force remount when starting new project
  const [topologyKey, setTopologyKey] = useState(Date.now());

  // Default devices for a new project
  const defaultDevices: CanvasDevice[] = [
    {
      id: 'pc-1',
      type: 'pc',
      name: 'PC-1',
      x: 50,
      y: 50,
      ip: '192.168.1.10',
      macAddress: '00e0.f701.a1b1',
      status: 'online',
      ports: generatePCPorts(),
    },
    {
      id: 'switch-1',
      type: 'switch',
      name: 'SWITCH-1',
      macAddress: '0011.2233.4401',
      ip: '',
      x: 300,
      y: 150,
      status: 'online',
      ports: generateSwitchPorts(),
    },
  ];

  // Canvas state
  const [devices, setDevices] = useState<CanvasDevice[]>(initialDevices || defaultDevices);
  const [connections, setConnections] = useState<CanvasConnection[]>(initialConnections || []);
  const [notes, setNotes] = useState<CanvasNote[]>(initialNotes || []);

  const [zoom, setZoom] = useState(zoomProp || DEFAULT_ZOOM);
  const [pan, setPan] = useState(panProp || { x: 0, y: 0 });

  // Sync internal state with props (e.g. from undo/redo or tab switching)
  useEffect(() => {
    if (initialDevices) setDevices(initialDevices);
  }, [initialDevices]);

  useEffect(() => {
    if (initialConnections) setConnections(initialConnections);
  }, [initialConnections]);

  useEffect(() => {
    if (initialNotes) {
      setNotes(initialNotes.map(n => ({
        ...n,
        width: n.width || NOTE_DEFAULT_WIDTH,
        height: n.height || NOTE_DEFAULT_HEIGHT,
        color: n.color || NOTE_COLORS[0],
        font: n.font || 'Inter',
        fontSize: n.fontSize || 12,
        opacity: n.opacity || 1
      })));
    }
  }, [initialNotes]);

  useEffect(() => {
    if (zoomProp !== undefined) setZoom(zoomProp);
  }, [zoomProp]);

  useEffect(() => {
    if (panProp !== undefined) setPan(panProp);
  }, [panProp]);

  // Wrapper for setZoom to notify parent
  const updateZoom = useCallback((newZoom: number | ((prev: number) => number)) => {
    setZoom(prev => {
      const next = typeof newZoom === 'function' ? newZoom(prev) : newZoom;
      if (onZoomChange) onZoomChange(next);
      return next;
    });
  }, [onZoomChange]);

  // Wrapper for setPan to notify parent
  const updatePan = useCallback((newPan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => {
    setPan(prev => {
      const next = typeof newPan === 'function' ? newPan(prev) : newPan;
      if (onPanChange) onPanChange(next);
      return next;
    });
  }, [onPanChange]);

  // View state
  const [isFullscreen, setIsFullscreen] = useState(isFullscreenProp || false);
  useEffect(() => {
    if (isFullscreenProp !== undefined) setIsFullscreen(isFullscreenProp);
  }, [isFullscreenProp]);

  const toggleFullscreen = useCallback(() => {
    const next = !isFullscreen;
    setIsFullscreen(next);
    if (onFullscreenChange) onFullscreenChange(next);
  }, [isFullscreen, onFullscreenChange]);

  // Interaction state
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(activeDeviceIdProp || null);
  const [draggedDevice, setDraggedDevice] = useState<string | null>(null);
  const [isActuallyDragging, setIsActuallyDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isDrawingConnection, setIsDrawingConnection] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{ deviceId: string; portId: string } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; deviceId: string | null; noteId: string | null; mode: 'device' | 'canvas' | 'note-style' | 'note-edit' } | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [showPortSelector, setShowPortSelector] = useState(false);
  const [portSelectorStep, setPortSelectorStep] = useState<'source' | 'target'>('source');
  const [selectedSourcePort, setSelectedSourcePort] = useState<{ deviceId: string; portId: string } | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // History state for undo/redo
  const [history, setHistory] = useState<{ devices: CanvasDevice[]; connections: CanvasConnection[]; notes: CanvasNote[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Clipboard state
  const [clipboard, setClipboard] = useState<CanvasDevice[]>([]);
  const [noteClipboard, setNoteClipboard] = useState<CanvasNote[]>([]);

  // Device Config Modal State
  const [configuringDevice, setConfiguringDevice] = useState<string | null>(null);
  const [tempNameValue, setTempNameValue] = useState('');
  const [ipValue, setIpValue] = useState('');
  const [subnetValue, setSubnetValue] = useState('');
  const [gatewayValue, setGatewayValue] = useState('');
  const [dnsValue, setDnsValue] = useState('');

  // Port/Device Tooltip state
  const [portTooltip, setPortTooltip] = useState<{ x: number; y: number; deviceId: string; portId: string; visible: boolean } | null>(null);
  const portTooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [deviceTooltip, setDeviceTooltip] = useState<{ x: number; y: number; deviceId: string; visible: boolean } | null>(null);
  const deviceTooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showPortTooltip = useCallback((e: ReactMouseEvent | MouseEvent, deviceId: string, portId: string) => {
    // Tooltip functionality currently disabled by user request
    return;
  }, []);

  const hidePortTooltip = useCallback(() => {
    if (portTooltipTimerRef.current) {
      clearTimeout(portTooltipTimerRef.current);
    }
    setPortTooltip(prev => prev ? { ...prev, visible: false } : null);
  }, []);

  const showDeviceTooltip = useCallback((e: ReactMouseEvent | MouseEvent, deviceId: string) => {
    // Tooltip functionality currently disabled by user request
    return;
  }, []);

  const hideDeviceTooltip = useCallback(() => {
    if (deviceTooltipTimerRef.current) {
      clearTimeout(deviceTooltipTimerRef.current);
    }
    setDeviceTooltip(prev => prev ? { ...prev, visible: false } : null);
  }, []);

  const handlePortHover = useCallback((e: ReactMouseEvent, deviceId: string, portId: string) => {
    showPortTooltip(e, deviceId, portId);
  }, [showPortTooltip]);

  const handlePortMouseLeave = useCallback(() => {
    hidePortTooltip();
  }, [hidePortTooltip]);

  // Note related state
  const [resizingNoteId, setResizingNoteId] = useState<string | null>(null);
  const [noteResizeStartPos, setNoteResizeStartPos] = useState({ x: 0, y: 0 });
  const [noteResizeStartSize, setNoteResizeStartSize] = useState({ width: 0, height: 0 });
  const [isTouchDraggingNote, setIsTouchDraggingNote] = useState(false);
  const [noteFonts] = useState(['Inter', 'JetBrains Mono', 'Comic Sans MS', 'Georgia', 'Playfair Display']);
  const noteTextareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  // Mobile state
  const [isMobile, setIsMobile] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [touchDraggedDevice, setTouchDraggedDevice] = useState<string | null>(null);
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [lastTouchCenter, setLastTouchCenter] = useState<{ x: number; y: number } | null>(null);

  // Keyboard shortcut state
  const [selectAllMode, setSelectAllMode] = useState(false);

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const configInputRef = useRef<HTMLInputElement>(null);

  // Sync activeDeviceId from prop
  useEffect(() => {
    if (activeDeviceIdProp !== undefined) setActiveDeviceId(activeDeviceIdProp);
  }, [activeDeviceIdProp]);

  // Multi-language support (defaulting to current session or user preference)
  const [language, setLanguage] = useState<'tr' | 'en'>('tr');
  useEffect(() => {
    // Simplified: check if there's a language context or just use TR
    const stored = typeof window !== 'undefined' ? localStorage.getItem('language') : 'tr';
    if (stored === 'tr' || stored === 'en') setLanguage(stored as 'tr' | 'en');
  }, []);

  const isDark = typeof window !== 'undefined' ? document.documentElement.classList.contains('dark') : true;

  // Constants
  const GRID_SIZE = 20;

  // History management
  const saveToHistory = useCallback(() => {
    const currentState = { devices, connections, notes };
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, JSON.parse(JSON.stringify(currentState))];
    });
    setHistoryIndex(prev => prev + 1);
  }, [devices, connections, notes, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setDevices(prevState.devices);
      setConnections(prevState.connections);
      setNotes(prevState.notes);
      setHistoryIndex(prev => prev - 1);
      if (onTopologyChange) {
        onTopologyChange(prevState.devices, prevState.connections, prevState.notes);
      }
    }
  }, [history, historyIndex, onTopologyChange]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setDevices(nextState.devices);
      setConnections(nextState.connections);
      setNotes(nextState.notes);
      setHistoryIndex(prev => prev + 1);
      if (onTopologyChange) {
        onTopologyChange(nextState.devices, nextState.connections, nextState.notes);
      }
    }
  }, [history, historyIndex, onTopologyChange]);

  // Save initial state to history once
  useEffect(() => {
    if (history.length === 0) {
      setHistory([{ devices, connections, notes }]);
      setHistoryIndex(0);
    }
  }, []);

  // Helpers for canvas coordinates
  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom
    };
  }, [pan, zoom]);

  // Topology actions
  const addDevice = useCallback((type: 'pc' | 'switch' | 'router') => {
    saveToHistory();
    const id = `${type}-${Date.now()}`;
    const newDevice: CanvasDevice = {
      id,
      type,
      name: `${type.toUpperCase()}-${devices.filter(d => d.type === type).length + 1}`,
      x: (400 - pan.x) / zoom,
      y: (200 - pan.y) / zoom,
      ip: type === 'pc' ? '192.168.1.' + (devices.filter(d => d.type === 'pc').length + 10) : '',
      status: 'online',
      macAddress: getDeviceMacPrefix(type) + Math.floor(Math.random() * 0xFFFF).toString(16).padStart(4, '0'),
      ports: type === 'pc' ? generatePCPorts() : type === 'switch' ? generateSwitchPorts() : generateRouterPorts(),
    };

    const updatedDevices = [...devices, newDevice];
    setDevices(updatedDevices);
    if (onTopologyChange) {
      onTopologyChange(updatedDevices, connections, notes);
    }
    setSelectedDeviceIds([id]);
  }, [devices, connections, notes, pan, zoom, onTopologyChange, saveToHistory]);

  const deleteDevice = useCallback((deviceId: string) => {
    saveToHistory();
    const updatedDevices = devices.filter(d => d.id !== deviceId);
    const updatedConnections = connections.filter(c => c.sourceDeviceId !== deviceId && c.targetDeviceId !== deviceId);
    setDevices(updatedDevices);
    setConnections(updatedConnections);
    if (onTopologyChange) {
      onTopologyChange(updatedDevices, updatedConnections, notes);
    }
    if (onDeviceDelete) onDeviceDelete(deviceId);
    if (activeDeviceId === deviceId) setActiveDeviceId(null);
  }, [devices, connections, notes, onTopologyChange, onDeviceDelete, activeDeviceId, saveToHistory]);

  const updateDevicePosition = useCallback((deviceId: string, x: number, y: number) => {
    setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, x, y } : d));
  }, []);

  const updateMultipleDevicesPosition = useCallback((deviceIds: string[], dx: number, dy: number) => {
    setDevices(prev => prev.map(d => deviceIds.includes(d.id) ? { ...d, x: d.x + dx, y: d.y + dy } : d));
  }, []);

  const selectAllDevices = useCallback(() => {
    setSelectedDeviceIds(devices.map(d => d.id));
    setSelectedNoteIds(notes.map(n => n.id));
    setSelectAllMode(true);
  }, [devices, notes]);

  // Device Copy/Paste
  const copyDevice = useCallback((deviceIds: string[]) => {
    const selectedDevices = devices.filter(d => deviceIds.includes(d.id));
    if (selectedDevices.length > 0) {
      setClipboard(JSON.parse(JSON.stringify(selectedDevices)));
    }
  }, [devices]);

  const cutDevice = useCallback((deviceIds: string[]) => {
    copyDevice(deviceIds);
    deviceIds.forEach(id => deleteDevice(id));
  }, [copyDevice, deleteDevice]);

  const pasteDevice = useCallback(() => {
    if (clipboard.length === 0) return;
    saveToHistory();

    const newDevices: CanvasDevice[] = clipboard.map(d => ({
      ...d,
      id: `${d.type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      x: d.x + 40,
      y: d.y + 40,
      name: `${d.name}-copy`
    }));

    const updatedDevices = [...devices, ...newDevices];
    setDevices(updatedDevices);
    if (onTopologyChange) {
      onTopologyChange(updatedDevices, connections, notes);
    }
    setSelectedDeviceIds(newDevices.map(d => d.id));
  }, [clipboard, devices, connections, notes, onTopologyChange, saveToHistory]);

  // Ping related state
  const [pingSource, setPingSource] = useState<string | null>(null);
  const [pingAnimation, setPingAnimation] = useState<{
    path: string[];
    currentHopIndex: number;
    progress: number;
    success: boolean | null;
  } | null>(null);

  const startPingAnimation = useCallback((path: string[]) => {
    setPingAnimation({
      path,
      currentHopIndex: 0,
      progress: 0,
      success: null
    });
  }, []);

  // Handle Note actions
  const addNote = useCallback(() => {
    saveToHistory();
    const id = `note-${Date.now()}`;
    const newNote: CanvasNote = {
      id,
      text: '',
      x: (400 - pan.x) / zoom,
      y: (200 - pan.y) / zoom,
      width: NOTE_DEFAULT_WIDTH,
      height: NOTE_DEFAULT_HEIGHT,
      color: NOTE_COLORS[0],
      font: noteFonts[0],
      fontSize: 12,
      opacity: 1
    };

    const updatedNotes = [...notes, newNote];
    setNotes(updatedNotes);
    if (onTopologyChange) {
      onTopologyChange(devices, connections, updatedNotes);
    }
    setSelectedNoteIds([id]);
    setTimeout(() => {
      noteTextareaRefs.current[id]?.focus();
    }, 50);
  }, [notes, devices, connections, pan, zoom, onTopologyChange, saveToHistory, noteFonts]);

  const deleteNote = useCallback((noteId: string) => {
    saveToHistory();
    const updatedNotes = notes.filter(n => n.id !== noteId);
    setNotes(updatedNotes);
    if (onTopologyChange) {
      onTopologyChange(devices, connections, updatedNotes);
    }
    setSelectedNoteIds(prev => prev.filter(id => id !== noteId));
  }, [notes, devices, connections, onTopologyChange, saveToHistory]);

  const updateNoteStyle = useCallback((noteId: string, patch: Partial<Pick<CanvasNote, 'color' | 'font' | 'fontSize' | 'opacity'>>) => {
    saveToHistory();
    const updatedNotes = notes.map(n => n.id === noteId ? { ...n, ...patch } : n);
    setNotes(updatedNotes);
    if (onTopologyChange) {
      onTopologyChange(devices, connections, updatedNotes);
    }
  }, [notes, devices, connections, onTopologyChange, saveToHistory]);

  const updateNoteText = useCallback((noteId: string, text: string) => {
    setNotes(prev => prev.map(n => (n.id === noteId ? { ...n, text } : n)));
  }, []);

  const getNoteTextarea = useCallback((noteId: string) => {
    return noteTextareaRefs.current[noteId] || null;
  }, []);

  const handleNoteTextSelectAll = useCallback((noteId: string) => {
    const el = getNoteTextarea(noteId);
    if (!el) return;
    el.focus();
    el.setSelectionRange(0, el.value.length);
  }, [getNoteTextarea]);

  const handleNoteTextCopy = useCallback(async (noteId: string) => {
    const el = getNoteTextarea(noteId);
    if (!el) return;
    el.focus();
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const text = start !== end ? el.value.slice(start, end) : el.value;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      document.execCommand('copy');
    }
  }, [getNoteTextarea]);

  const handleNoteTextCut = useCallback(async (noteId: string) => {
    const el = getNoteTextarea(noteId);
    if (!el) return;
    el.focus();
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const text = start !== end ? el.value.slice(start, end) : el.value;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      document.execCommand('copy');
    }
    const newValue = el.value.slice(0, start) + el.value.slice(end);
    updateNoteText(noteId, newValue);
  }, [getNoteTextarea, updateNoteText]);

  const handleNoteTextPaste = useCallback(async (noteId: string) => {
    const el = getNoteTextarea(noteId);
    if (!el) return;
    el.focus();
    try {
      const text = await navigator.clipboard.readText();
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;
      const newValue = el.value.slice(0, start) + text + el.value.slice(end);
      updateNoteText(noteId, newValue);
    } catch {
      // Fallback
    }
  }, [getNoteTextarea, updateNoteText]);

  const handleNoteTextDelete = useCallback((noteId: string) => {
    const el = getNoteTextarea(noteId);
    if (!el) return;
    el.focus();
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const newValue = start !== end
      ? el.value.slice(0, start) + el.value.slice(end)
      : '';
    updateNoteText(noteId, newValue);
  }, [getNoteTextarea, updateNoteText]);

  const pasteNotes = useCallback((x?: number, y?: number) => {
    if (noteClipboard.length === 0) return;
    saveToHistory();

    const canvasPos = x !== undefined && y !== undefined
      ? getCanvasCoords(x, y)
      : { x: (400 - pan.x) / zoom, y: (200 - pan.y) / zoom };

    const firstNote = noteClipboard[0];
    const dx = canvasPos.x - firstNote.x;
    const dy = canvasPos.y - firstNote.y;

    const newNotes: CanvasNote[] = noteClipboard.map(n => ({
      ...n,
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      x: n.x + dx,
      y: n.y + dy
    }));

    const updatedNotes = [...notes, ...newNotes];
    setNotes(updatedNotes);
    if (onTopologyChange) {
      onTopologyChange(devices, connections, updatedNotes);
    }
    setSelectedNoteIds(newNotes.map(n => n.id));
  }, [noteClipboard, notes, devices, connections, pan, zoom, getCanvasCoords, onTopologyChange, saveToHistory]);

  const duplicateNote = useCallback((noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    saveToHistory();
    const newNote: CanvasNote = {
      ...note,
      id: `note-${Date.now()}`,
      x: note.x + 20,
      y: note.y + 20,
    };

    const updatedNotes = [...notes, newNote];
    setNotes(updatedNotes);
    if (onTopologyChange) {
      onTopologyChange(devices, connections, updatedNotes);
    }
  }, [notes, devices, connections, onTopologyChange, saveToHistory]);

  // Handle port click for connection
  const handlePortClick = useCallback((e: ReactMouseEvent, deviceId: string, portId: string) => {
    e.stopPropagation();
    const device = devices.find((d) => d.id === deviceId);
    if (!device) return;

    const port = device.ports.find((p) => p.id === portId);
    if (!port) return;

    // Check if port is already connected
    if (port.status === 'connected') {
      // Port is already in use - cannot connect
      if (isDrawingConnection) {
        setConnectionError(language === 'tr' ? 'Bu port zaten kullanımda!' : 'This port is already in use!');
        setTimeout(() => setConnectionError(null), 3000);
        setIsDrawingConnection(false);
        setConnectionStart(null);
      }
      return;
    }

    if (isDrawingConnection && connectionStart) {
      // Check if trying to connect to itself (same device, different port)
      if (connectionStart.deviceId === deviceId) {
        // Show error message - cannot connect device to itself
        const errorMsg = language === 'tr'
          ? 'Bir cihaz kendisine bağlanamaz!'
          : 'A device cannot connect to itself!';
        setConnectionError(errorMsg);
        setTimeout(() => setConnectionError(null), 3000);
        setIsDrawingConnection(false);
        setConnectionStart(null);
        return;
      }

      // Check if connection already exists between these devices (multiple connections)
      // For now, we allow multiple connections between devices if they are on different ports.

      saveToHistory();
      const newConnection: CanvasConnection = {
        id: `conn-${Date.now()}`,
        sourceDeviceId: connectionStart.deviceId,
        sourcePort: connectionStart.portId,
        targetDeviceId: deviceId,
        targetPort: portId,
        cableType: cableInfo.cableType,
        active: true,
      };

      const updatedConnections = [...connections, newConnection];
      setConnections(updatedConnections);

      // Update port status on both devices
      const updatedDevices = devices.map((d) => {
        if (d.id === connectionStart.deviceId || d.id === deviceId) {
          return {
            ...d,
            ports: d.ports.map((p) => {
              if (
                (d.id === connectionStart.deviceId && p.id === connectionStart.portId) ||
                (d.id === deviceId && p.id === portId)
              ) {
                return { ...p, status: 'connected' as const };
              }
              return p;
            }),
          };
        }
        return d;
      });
      setDevices(updatedDevices);

      if (onTopologyChange) {
        onTopologyChange(updatedDevices, updatedConnections, notes);
      }

      setIsDrawingConnection(false);
      setConnectionStart(null);
    } else {
      setIsDrawingConnection(true);
      setConnectionStart({ deviceId, portId });
    }
  }, [isDrawingConnection, connectionStart, devices, connections, notes, cableInfo, onTopologyChange, saveToHistory, language]);

  // Port selector modal actions
  const closePortSelector = useCallback(() => {
    setShowPortSelector(false);
    setPortSelectorStep('source');
    setSelectedSourcePort(null);
  }, []);

  const handlePortSelectorSelectPort = useCallback((deviceId: string, portId: string) => {
    if (portSelectorStep === 'source') {
      setSelectedSourcePort({ deviceId, portId });
      setPortSelectorStep('target');
    } else if (selectedSourcePort) {
      // Target port selected, create connection
      const sourceDevice = devices.find(d => d.id === selectedSourcePort.deviceId);
      const targetDevice = devices.find(d => d.id === deviceId);

      if (sourceDevice && targetDevice) {
        // Check if connecting to itself
        if (sourceDevice.id === targetDevice.id) {
          setConnectionError(language === 'tr' ? 'Bir cihaz kendisine bağlanamaz!' : 'A device cannot connect to itself!');
          setTimeout(() => setConnectionError(null), 3000);
          closePortSelector();
          return;
        }

        saveToHistory();
        const newConnection: CanvasConnection = {
          id: `conn-${Date.now()}`,
          sourceDeviceId: selectedSourcePort.deviceId,
          sourcePort: selectedSourcePort.portId,
          targetDeviceId: deviceId,
          targetPort: portId,
          cableType: cableInfo.cableType,
          active: true,
        };

        const updatedConnections = [...connections, newConnection];
        setConnections(updatedConnections);

        const updatedDevices = devices.map(d => {
          if (d.id === selectedSourcePort.deviceId || d.id === deviceId) {
            return {
              ...d,
              ports: d.ports.map(p => {
                if (
                  (d.id === selectedSourcePort.deviceId && p.id === selectedSourcePort.portId) ||
                  (d.id === deviceId && p.id === portId)
                ) {
                  return { ...p, status: 'connected' as const };
                }
                return p;
              })
            };
          }
          return d;
        });
        setDevices(updatedDevices);

        if (onTopologyChange) {
          onTopologyChange(updatedDevices, updatedConnections, notes);
        }
      }
      closePortSelector();
    }
  }, [portSelectorStep, selectedSourcePort, devices, connections, notes, cableInfo, language, closePortSelector, onTopologyChange, saveToHistory]);

  // Mouse event handlers for canvas
  const handleCanvasMouseDown = useCallback((e: ReactMouseEvent) => {
    if (e.button !== 0) return; // Only left click

    const target = e.target as HTMLElement;
    if (target.closest('[data-note-id]')) return; // handled by note mouseDown

    setContextMenu(null);
    setSelectAllMode(false);

    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      // Potential multi-select start or pan start
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else {
      // Clear selection unless clicking on a device/note
      const deviceTarget = target.closest('[data-device-id]');
      const noteTarget = target.closest('[data-note-id]');

      if (!deviceTarget && !noteTarget) {
        setSelectedDeviceIds([]);
        setSelectedNoteIds([]);
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    }
  }, [pan]);

  const handleDeviceMouseDown = useCallback((e: ReactMouseEvent, deviceId: string) => {
    if (e.button !== 0) return; // Only left click
    e.stopPropagation();

    if (isDrawingConnection) return;

    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      setSelectedDeviceIds(prev =>
        prev.includes(deviceId) ? prev.filter(id => id !== deviceId) : [...prev, deviceId]
      );
    } else {
      if (!selectedDeviceIds.includes(deviceId)) {
        setSelectedDeviceIds([deviceId]);
        setSelectedNoteIds([]);
      }
    }

    setDraggedDevice(deviceId);
    setIsActuallyDragging(false);
    setDragStartPos({ x: e.clientX, y: e.clientY });
  }, [isDrawingConnection, selectedDeviceIds]);

  const handleDeviceClick = useCallback((e: ReactMouseEvent, device: CanvasDevice) => {
    e.stopPropagation();
    if (onDeviceSelect) onDeviceSelect(device.type, device.id);
  }, [onDeviceSelect]);

  const handleDeviceDoubleClick = useCallback((device: CanvasDevice) => {
    if (onDeviceDoubleClickProp) {
      onDeviceDoubleClickProp(device.type, device.id);
    }
    setActiveDeviceId(device.id);
  }, [onDeviceDoubleClickProp]);

  const handleNoteMouseDown = useCallback((e: ReactMouseEvent, noteId: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    const target = e.target as HTMLElement;
    if (target.hasAttribute('data-note-textarea')) return;

    if (e.shiftKey) {
      setSelectedNoteIds(prev => prev.includes(noteId) ? prev.filter(id => id !== noteId) : [...prev, noteId]);
    } else {
      if (!selectedNoteIds.includes(noteId)) {
        setSelectedNoteIds([noteId]);
        setSelectedDeviceIds([]);
      }
    }

    setDraggedDevice(noteId);
    setIsActuallyDragging(false);
    setDragStartPos({ x: e.clientX, y: e.clientY });
  }, [selectedNoteIds]);

  const handleNoteResizeStart = useCallback((e: ReactMouseEvent, noteId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingNoteId(noteId);
    setNoteResizeStartPos({ x: e.clientX, y: e.clientY });
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setNoteResizeStartSize({ width: note.width, height: note.height });
    }
  }, [notes]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });

    if (isPanning) {
      updatePan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    } else if (resizingNoteId) {
      const dx = (e.clientX - noteResizeStartPos.x) / zoom;
      const dy = (e.clientY - noteResizeStartPos.y) / zoom;
      setNotes(prev => prev.map(n => n.id === resizingNoteId ? {
        ...n,
        width: Math.max(100, noteResizeStartSize.width + dx),
        height: Math.max(80, noteResizeStartSize.height + dy)
      } : n));
    } else if (draggedDevice) {
      const dx = (e.clientX - dragStartPos.x) / zoom;
      const dy = (e.clientY - dragStartPos.y) / zoom;

      if (!isActuallyDragging && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
        setIsActuallyDragging(true);
      }

      if (isActuallyDragging) {
        if (selectedNoteIds.includes(draggedDevice)) {
          // Dragging notes
          setNotes(prev => prev.map(n => selectedNoteIds.includes(n.id) ? { ...n, x: n.x + dx, y: n.y + dy } : n));
        } else {
          // Dragging devices
          updateMultipleDevicesPosition(selectedDeviceIds, dx, dy);
        }
        setDragStartPos({ x: e.clientX, y: e.clientY });
      }
    }
  }, [isPanning, panStart, resizingNoteId, noteResizeStartPos, noteResizeStartSize, zoom, draggedDevice, dragStartPos, isActuallyDragging, selectedDeviceIds, selectedNoteIds, updateMultipleDevicesPosition, updatePan]);

  const handleMouseUp = useCallback(() => {
    if (isActuallyDragging) {
      saveToHistory();
      if (onTopologyChange) {
        onTopologyChange(devices, connections, notes);
      }
    }
    if (resizingNoteId) {
      saveToHistory();
      if (onTopologyChange) {
        onTopologyChange(devices, connections, notes);
      }
    }

    setIsPanning(false);
    setDraggedDevice(null);
    setIsActuallyDragging(false);
    setResizingNoteId(null);
  }, [isActuallyDragging, resizingNoteId, devices, connections, notes, onTopologyChange, saveToHistory]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Context Menu
  const handleContextMenu = useCallback((e: ReactMouseEvent, deviceId: string | null = null) => {
    e.preventDefault();
    e.stopPropagation();
    const mode = deviceId ? 'device' : 'canvas';
    setContextMenu({ x: e.clientX, y: e.clientY, deviceId, noteId: null, mode });
  }, []);

  const handleNoteContextMenu = useCallback((e: ReactMouseEvent, noteId: string, mode: 'note-style' | 'note-edit' = 'note-edit') => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, deviceId: null, noteId, mode });
  }, []);

  // Device config modal actions
  const startDeviceConfig = useCallback((deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (device) {
      setConfiguringDevice(deviceId);
      setTempNameValue(device.name);
      setIpValue(device.ip || '');
      setSubnetValue(device.subnet || '255.255.255.0');
      setGatewayValue(device.gateway || '');
      setDnsValue(device.dns || '8.8.8.8');
      setTimeout(() => configInputRef.current?.focus(), 100);
    }
  }, [devices]);

  const confirmDeviceConfig = useCallback(() => {
    if (!configuringDevice) return;
    saveToHistory();

    const updatedDevices = devices.map(d => d.id === configuringDevice ? {
      ...d,
      name: tempNameValue || d.name,
      ip: ipValue,
      subnet: subnetValue,
      gateway: gatewayValue,
      dns: dnsValue
    } : d);

    setDevices(updatedDevices);
    if (onTopologyChange) {
      onTopologyChange(updatedDevices, connections, notes);
    }
    setConfiguringDevice(null);
  }, [configuringDevice, devices, connections, notes, tempNameValue, ipValue, subnetValue, gatewayValue, dnsValue, onTopologyChange, saveToHistory]);

  const cancelDeviceConfig = useCallback(() => {
    setConfiguringDevice(null);
  }, []);

  const toggleDevicePower = useCallback(() => {
    if (!configuringDevice) return;
    saveToHistory();
    const updatedDevices = devices.map(d => d.id === configuringDevice ? {
      ...d,
      status: d.status === 'offline' ? 'online' : 'offline' as any
    } : d);
    setDevices(updatedDevices);
    if (onTopologyChange) {
      onTopologyChange(updatedDevices, connections, notes);
    }
  }, [configuringDevice, devices, connections, notes, onTopologyChange, saveToHistory]);

  // Alignment
  const handleAlign = useCallback((type: 'left' | 'top') => {
    if (selectedDeviceIds.length < 2) return;
    saveToHistory();

    const selectedDevices = devices.filter(d => selectedDeviceIds.includes(d.id));
    if (type === 'left') {
      const minX = Math.min(...selectedDevices.map(d => d.x));
      setDevices(prev => prev.map(d => selectedDeviceIds.includes(d.id) ? { ...d, x: minX } : d));
    } else {
      const minY = Math.min(...selectedDevices.map(d => d.y));
      setDevices(prev => prev.map(d => selectedDeviceIds.includes(d.id) ? { ...d, y: minY } : d));
    }
  }, [selectedDeviceIds, devices, saveToHistory]);

  // Mobile handlers
  const handleTouchStart = useCallback((e: ReactTouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const target = e.target as HTMLElement;
      if (target.closest('[data-note-id]')) return;

      setContextMenu(null);
      setSelectAllMode(false);

      const deviceTarget = target.closest('[data-device-id]');
      const noteTarget = target.closest('[data-note-id]');

      if (!deviceTarget && !noteTarget) {
        setSelectedDeviceIds([]);
        setSelectedNoteIds([]);
        setIsPanning(true);
        setPanStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
      }
    } else if (e.touches.length === 2) {
      setIsPanning(false);
      setDraggedDevice(null);
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      setLastTouchDistance(dist);
      setLastTouchCenter({ x: (touch1.clientX + touch2.clientX) / 2, y: (touch1.clientY + touch2.clientY) / 2 });
    }
  }, [pan]);

  const handleTouchMove = useCallback((e: ReactTouchEvent) => {
    if (e.touches.length === 1 && isPanning) {
      const touch = e.touches[0];
      updatePan({ x: touch.clientX - panStart.x, y: touch.clientY - panStart.y });
    } else if (e.touches.length === 2 && lastTouchDistance && lastTouchCenter) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const center = { x: (touch1.clientX + touch2.clientX) / 2, y: (touch1.clientY + touch2.clientY) / 2 };

      const zoomFactor = dist / lastTouchDistance;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * zoomFactor));

      if (newZoom !== zoom) {
        updateZoom(newZoom);
        updatePan(prevPan => ({
          x: center.x - (center.x - prevPan.x) * zoomFactor,
          y: center.y - (center.y - prevPan.y) * zoomFactor
        }));
      }

      setLastTouchDistance(dist);
      setLastTouchCenter(center);
    }
  }, [isPanning, panStart, lastTouchDistance, lastTouchCenter, zoom, updatePan, updateZoom]);

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    setLastTouchDistance(null);
    setLastTouchCenter(null);
  }, []);

  const handleDeviceTouchStart = useCallback((e: ReactTouchEvent, deviceId: string) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      e.stopPropagation();

      if (isDrawingConnection) return;

      setLongPressTimer(setTimeout(() => {
        const device = devices.find(d => d.id === deviceId);
        if (device) handleContextMenu({ clientX: touch.clientX, clientY: touch.clientY } as any, deviceId);
      }, 600));

      if (!selectedDeviceIds.includes(deviceId)) {
        setSelectedDeviceIds([deviceId]);
        setSelectedNoteIds([]);
      }

      setTouchDraggedDevice(deviceId);
      setIsTouchDragging(false);
      setDragStartPos({ x: touch.clientX, y: touch.clientY });
    }
  }, [isDrawingConnection, selectedDeviceIds, devices, handleContextMenu]);

  const handleDeviceTouchMove = useCallback((e: ReactTouchEvent) => {
    if (e.touches.length === 1 && touchDraggedDevice) {
      if (longPressTimer) clearTimeout(longPressTimer);

      const touch = e.touches[0];
      const dx = (touch.clientX - dragStartPos.x) / zoom;
      const dy = (touch.clientY - dragStartPos.y) / zoom;

      if (!isTouchDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        setIsTouchDragging(true);
      }

      if (isTouchDragging) {
        updateMultipleDevicesPosition(selectedDeviceIds, dx, dy);
        setDragStartPos({ x: touch.clientX, y: touch.clientY });
      }
    }
  }, [touchDraggedDevice, longPressTimer, dragStartPos, zoom, isTouchDragging, selectedDeviceIds, updateMultipleDevicesPosition]);

  const handleDeviceTouchEnd = useCallback(() => {
    if (longPressTimer) clearTimeout(longPressTimer);
    if (isTouchDragging) {
      saveToHistory();
      if (onTopologyChange) {
        onTopologyChange(devices, connections, notes);
      }
    }
    setTouchDraggedDevice(null);
    setIsTouchDragging(false);
  }, [longPressTimer, isTouchDragging, devices, connections, notes, onTopologyChange, saveToHistory]);

  const handleNoteTouchStart = useCallback((e: ReactTouchEvent, noteId: string) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      e.stopPropagation();

      setLongPressTimer(setTimeout(() => {
        handleNoteContextMenu({ clientX: touch.clientX, clientY: touch.clientY } as any, noteId);
      }, 600));

      if (!selectedNoteIds.includes(noteId)) {
        setSelectedNoteIds([noteId]);
        setSelectedDeviceIds([]);
      }

      setTouchDraggedDevice(noteId);
      setIsTouchDraggingNote(true);
      setDragStartPos({ x: touch.clientX, y: touch.clientY });
    }
  }, [selectedNoteIds, handleNoteContextMenu]);

  // Reset view to center and 100% zoom
  const resetView = useCallback(() => {
    updateZoom(1.0);
    updatePan({ x: 0, y: 0 });
  }, [updateZoom, updatePan]);

  const getCanvasDimensions = useCallback(() => {
    // Return base dimensions used for grid and boundary
    return { width: 2000, height: 1500 };
  }, []);

  const renderDevice = useCallback((device: CanvasDevice) => {
    return null; // The logic for rendering device SVG is in DeviceNode
  }, []);

  const renderTempConnection = useCallback(() => {
    if (!isDrawingConnection || !connectionStart) return null;

    const sourceDevice = devices.find(d => d.id === connectionStart.deviceId);
    if (!sourceDevice) return null;

    const startPos = getPortPosition(sourceDevice, connectionStart.portId);
    const canvasMousePos = getCanvasCoords(mousePos.x, mousePos.y);

    return (
      <line
        x1={startPos.x}
        y1={startPos.y}
        x2={canvasMousePos.x}
        y2={canvasMousePos.y}
        stroke={CABLE_COLORS[cableInfo.cableType].stroke}
        strokeWidth={3}
        strokeDasharray={cableInfo.cableType === 'crossover' ? "5,5" : cableInfo.cableType === 'console' ? "0" : "0"}
        opacity={0.6}
        pointerEvents="none"
      />
    );
  }, [isDrawingConnection, connectionStart, devices, mousePos, getCanvasCoords, getPortPosition, cableInfo.cableType]);

  const renderConnectionHandle = useCallback((conn: CanvasConnection) => {
    const sourceDevice = devices.find(d => d.id === conn.sourceDeviceId);
    const targetDevice = devices.find(d => d.id === conn.targetDeviceId);
    if (!sourceDevice || !targetDevice) return null;

    const startPos = getPortPosition(sourceDevice, conn.sourcePort);
    const endPos = getPortPosition(targetDevice, conn.targetPort);

    const midX = (startPos.x + endPos.x) / 2;
    const midY = (startPos.y + endPos.y) / 2;

    return (
      <g
        className="cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          saveToHistory();
          const updatedConnections = connections.filter(c => c.id !== conn.id);
          setConnections(updatedConnections);

          // Update port status on both devices
          const updatedDevices = devices.map(d => {
            if (d.id === conn.sourceDeviceId || d.id === conn.targetDeviceId) {
              return {
                ...d,
                ports: d.ports.map(p => {
                  if (
                    (d.id === conn.sourceDeviceId && p.id === conn.sourcePort) ||
                    (d.id === conn.targetDeviceId && p.id === conn.targetPort)
                  ) {
                    return { ...p, status: 'disconnected' as const };
                  }
                  return p;
                })
              };
            }
            return d;
          });
          setDevices(updatedDevices);

          if (onTopologyChange) {
            onTopologyChange(updatedDevices, updatedConnections, notes);
          }
        }}
      >
        <circle cx={midX} cy={midY} r={12} fill="rgba(239, 68, 68, 0.2)" />
        <Trash2 x={midX - 6} y={midY - 6} width={12} height={12} className="text-red-500" />
      </g>
    );
  }, [devices, connections, notes, getPortPosition, onTopologyChange, saveToHistory]);

  const renderMobilePalette = useCallback(() => null, []);
  const renderMobileBottomBar = useCallback(() => null, []);

  return (
    <NetworkTopologyView
      isDark={isDark}
      language={language}
      isMobile={isMobile}
      cableInfo={cableInfo}
      devices={devices}
      connections={connections}
      notes={notes}
      selectedDeviceIds={selectedDeviceIds}
      selectedNoteIds={selectedNoteIds}
      activeDeviceId={activeDeviceId}
      isDrawingConnection={isDrawingConnection}
      isActuallyDragging={isActuallyDragging}
      isTouchDragging={isTouchDragging}
      draggedDevice={draggedDevice}
      touchDraggedDevice={touchDraggedDevice}
      selectAllMode={selectAllMode}
      pan={pan}
      zoom={zoom}
      canvasRef={canvasRef}
      handleCanvasMouseDown={handleCanvasMouseDown}
      handleTouchStart={handleTouchStart}
      handleTouchMove={handleTouchMove}
      handleTouchEnd={handleTouchEnd}
      setIsDrawingConnection={setIsDrawingConnection}
      setConnectionStart={setConnectionStart}
      setSelectAllMode={setSelectAllMode}
      handleDeviceMouseDown={handleDeviceMouseDown}
      handleDeviceClick={handleDeviceClick}
      handleDeviceDoubleClick={handleDeviceDoubleClick}
      handleContextMenu={handleContextMenu}
      handleDeviceTouchStart={handleDeviceTouchStart}
      handleDeviceTouchMove={handleDeviceTouchMove}
      handleDeviceTouchEnd={handleDeviceTouchEnd}
      renderDevice={renderDevice}
      renderTempConnection={renderTempConnection}
      renderConnectionHandle={renderConnectionHandle}
      handleNoteTouchStart={handleNoteTouchStart}
      handleNoteContextMenu={handleNoteContextMenu}
      handleNoteMouseDown={handleNoteMouseDown}
      handleNoteResizeStart={handleNoteResizeStart}
      noteTextareaRefs={noteTextareaRefs}
      updateNoteText={updateNoteText}
      saveToHistory={saveToHistory}
      onTopologyChange={onTopologyChange}
      addNote={addNote}
      setIsPaletteOpen={setIsPaletteOpen}
      setShowPortSelector={setShowPortSelector}
      setPortSelectorStep={setPortSelectorStep}
      setSelectedSourcePort={setSelectedSourcePort}
      resetView={resetView}
      toggleFullscreen={toggleFullscreen}
      getCanvasDimensions={getCanvasDimensions}
      getPortPosition={getPortPosition}
      handlePortHover={handlePortHover}
      handlePortMouseLeave={handlePortMouseLeave}
      showPortSelector={showPortSelector}
      portSelectorStep={portSelectorStep}
      selectedSourcePort={selectedSourcePort}
      closePortSelector={closePortSelector}
      handlePortSelectorSelectPort={handlePortSelectorSelectPort}
      portTooltip={portTooltip}
      deviceTooltip={deviceTooltip}
      contextMenu={contextMenu}
      contextMenuRef={contextMenuRef}
      noteFonts={noteFonts}
      noteClipboard={noteClipboard}
      clipboard={clipboard}
      historyIndex={historyIndex}
      history={history}
      handleUndo={handleUndo}
      handleRedo={handleRedo}
      selectAllDevices={selectAllDevices}
      cutDevice={cutDevice}
      copyDevice={copyDevice}
      pasteDevice={pasteDevice}
      deleteDevice={deleteDevice}
      startDeviceConfig={startDeviceConfig}
      setPingSource={setPingSource}
      deleteNote={deleteNote}
      handleNoteTextCut={handleNoteTextCut}
      handleNoteTextCopy={handleNoteTextCopy}
      handleNoteTextPaste={handleNoteTextPaste}
      handleNoteTextDelete={handleNoteTextDelete}
      handleNoteTextSelectAll={handleNoteTextSelectAll}
      onDuplicateNote={duplicateNote}
      pasteNotes={pasteNotes}
      updateNoteStyle={updateNoteStyle}
      connectionError={connectionError}
      renderMobilePalette={renderMobilePalette}
      renderMobileBottomBar={renderMobileBottomBar}
      pingSource={pingSource}
      startPingAnimation={startPingAnimation}
      pingAnimation={pingAnimation}
      onCableChange={onCableChange}
      NOTE_HEADER_HEIGHT={NOTE_HEADER_HEIGHT}
      getDeviceCenter={getDeviceCenter}
      setSelectedNoteIds={setSelectedNoteIds}
      setSelectedDeviceIds={setSelectedDeviceIds}
      setContextMenu={setContextMenu}
      isFullscreen={isFullscreen}
      setZoom={setZoom}
      setPan={setPan}
      Trash2={Trash2}
    />
  );
}
