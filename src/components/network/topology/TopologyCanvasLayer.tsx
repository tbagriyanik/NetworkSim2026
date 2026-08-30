'use client';

import React from 'react';
import { CABLE_COLORS } from '../networkTopology.constants';
import { getConnectionStatusMessage, getPortPosition, getDeviceCenter, getDevicePairKey } from '../networkTopology.helpers';
import { ConnectionLine } from '../ConnectionLine';
import { ConnectionHandle } from '../ConnectionHandle';
import { NoteNode } from './NoteNode';
import { TempConnection } from './TempConnection';
import { EnvironmentBackgrounds } from './EnvironmentBackgrounds';
import { CanvasDefs } from './CanvasDefs';
import { SelectionBoxOverlay } from './SelectionBoxOverlay';
import { PingAnimationOverlay } from './PingAnimationOverlay';
import type { PingAnimationOverlayProps } from './PingAnimationOverlay';
import type { CanvasConnection, CanvasDevice, CanvasNote, ContextMenuState } from '../networkTopology.types';
import type { SwitchState, CableInfo } from '@/lib/network/types';

export interface TopologyCanvasLayerProps {
    canvasRef: React.RefObject<HTMLDivElement | null>;
    svgContentGroupRef: React.RefObject<SVGGElement | null>;
    isDark: boolean;
    isPanning: boolean;
    isSelecting: boolean;
    pingMode: boolean;
    pingSource: CanvasDevice | null;
    selectedDeviceIds: string[];
    selectedDeviceSet: Set<string>;
    selectedNoteIds: string[];
    connectionStart: { deviceId: string; portId: string; point: { x: number; y: number } } | null;
    mousePos: { x: number; y: number };
    isDrawingConnection: boolean;
    cableInfo: CableInfo;
    contextMenu: ContextMenuState | null;
    noteTextareaRefs: React.MutableRefObject<Record<string, HTMLTextAreaElement | null>>;
    isActuallyDragging: boolean;
    isTouchDragging: boolean;
    deviceMap: Map<string, CanvasDevice>;
    deviceStates?: Map<string, SwitchState>;
    devices: CanvasDevice[];
    connections: CanvasConnection[];
    notes: CanvasNote[];
    visibleConnections: CanvasConnection[];
    visibleNotes: CanvasNote[];
    devicesSortedForRender: CanvasDevice[];
    activeDeviceId?: string | null;
    mobileConnectionSource?: string | null;
    iotUpdateTrigger: number;
    graphicsQuality: 'high' | 'low';
    zoom: number;
    environment: { background?: 'none' | 'house' | 'twoStoryGarage' | 'greenhouse' } | null;
    t: Record<string, string>;
    language: 'tr' | 'en';
    selectionBox: { start: { x: number; y: number }; current: { x: number; y: number } } | null;
    hoveredConnectionId?: string | null;
    activeCaptureConnectionId?: string | null;
    handleCanvasMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
    handleTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
    handleTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
    handleTouchEnd: (e: React.TouchEvent<HTMLDivElement>) => void;
    handleContextMenu: (e: React.MouseEvent<HTMLDivElement>, deviceId?: string) => void;
    handleNoteHeaderMouseDown: (e: React.MouseEvent, noteId: string) => void;
    handleNoteHeaderTouchStart: (e: React.TouchEvent, noteId: string) => void;
    cycleNoteColor: (noteId: string) => void;
    cycleNoteFont: (noteId: string) => void;
    cycleNoteFontSize: (noteId: string) => void;
    cycleNoteOpacity: (noteId: string) => void;
    duplicateNote: (noteId: string) => void;
    deleteNote: (noteId: string) => void;
    updateNoteText: (noteId: string, text: string) => void;
    setNoteTextSelection: React.Dispatch<React.SetStateAction<{ noteId: string; start: number; end: number } | null>>;
    handleNoteResizeStart: (e: React.MouseEvent, noteId: string, direction?: string) => void;
    handleNoteResizeTouchStart: (e: React.TouchEvent, noteId: string, direction?: string) => void;
    bringNoteToFront: (noteId: string) => void;
    setSelectedNoteIds: React.Dispatch<React.SetStateAction<string[]>>;
    setSelectedDeviceIds: React.Dispatch<React.SetStateAction<string[]>>;
    setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState | null>>;
    setSelectAllMode: React.Dispatch<React.SetStateAction<boolean>>;
    cancelConnectionDrawing: () => void;
    setPingCursorPos: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>;
    setZoom: React.Dispatch<React.SetStateAction<number>>;
    setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
    resetView?: () => void;
    getCanvasDimensions: () => { width: number; height: number };
    renderDevice: (device: CanvasDevice, isDragging?: boolean) => React.ReactNode;
    handleConnectionMouseEnter: (e: React.MouseEvent<SVGPathElement>, connectionId: string, sourceName: string, sourcePort: string, targetName: string, targetPort: string, cableType: string, statusText: string) => void;
    handleConnectionMouseLeave: () => void;
    handleConnectionClick: (e: React.MouseEvent, connectionId: string) => void;
    onDeleteConnection: (connectionId: string) => void;
    onToggleConnectionActive: (connectionId: string) => void;
    pingAnimation: PingAnimationOverlayProps['pingAnimation'];
    handleEnvelopeClick: PingAnimationOverlayProps['handleEnvelopeClick'];
    isDarkForPing: boolean;
    tForPing: Record<string, string>;
}

export function TopologyCanvasLayer({
    canvasRef,
    svgContentGroupRef,
    isDark,
    isPanning,
    isSelecting,
    pingMode,
    pingSource: _pingSource,
    selectedDeviceIds,
    selectedDeviceSet: _selectedDeviceSet,
    selectedNoteIds,
    connectionStart,
    mousePos,
    isDrawingConnection,
    cableInfo,
    contextMenu,
    noteTextareaRefs,
    isActuallyDragging,
    isTouchDragging,
    deviceMap,
    deviceStates,
    devices,
    connections,
    notes,
    visibleConnections,
    visibleNotes,
    devicesSortedForRender,
    activeDeviceId: _activeDeviceId,
    mobileConnectionSource: _mobileConnectionSource,
    iotUpdateTrigger: _iotUpdateTrigger,
    graphicsQuality,
    zoom,
    environment,
    t,
    language,
    selectionBox,
    hoveredConnectionId,
    activeCaptureConnectionId,
    handleCanvasMouseDown,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleContextMenu,
    handleNoteHeaderMouseDown,
    handleNoteHeaderTouchStart,
    cycleNoteColor,
    cycleNoteFont,
    cycleNoteFontSize,
    cycleNoteOpacity,
    duplicateNote,
    deleteNote,
    updateNoteText,
    setNoteTextSelection,
    handleNoteResizeStart,
    handleNoteResizeTouchStart,
    bringNoteToFront,
    setSelectedNoteIds,
    setSelectedDeviceIds,
    setContextMenu,
    setSelectAllMode,
    cancelConnectionDrawing,
    setPingCursorPos,
    setZoom,
    setPan,
    resetView,
    getCanvasDimensions,
    renderDevice,
    handleConnectionMouseEnter,
    handleConnectionMouseLeave,
    handleConnectionClick,
    onDeleteConnection,
    onToggleConnectionActive,
    pingAnimation,
    handleEnvelopeClick,
    isDarkForPing,
    tForPing,
}: TopologyCanvasLayerProps) {
    const canvasSize = getCanvasDimensions();
    const connectionGroups = React.useMemo(() => {
        const groups = new Map<string, string[]>();
        connections.forEach((item) => {
            const pair = getDevicePairKey(item.sourceDeviceId, item.targetDeviceId);
            const ids = groups.get(pair);
            if (ids) ids.push(item.id);
            else groups.set(pair, [item.id]);
        });
        return groups;
    }, [connections]);

    return (
        <div
            ref={canvasRef}
            className={`w-full h-full flex-1 min-h-[500px] overflow-hidden relative touch-none select-none print:overflow-visible print:h-auto print:min-h-full topology-print-area ${pingMode || isSelecting ? 'cursor-crosshair' : isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
            role="application"
            aria-label={t.topologyAriaLabel}
            tabIndex={0}
            onMouseDown={handleCanvasMouseDown}
            onAuxClick={(e) => { if (e.button === 1) e.preventDefault(); }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseMove={(e) => {
                if (pingMode) setPingCursorPos({ x: e.clientX, y: e.clientY });
            }}
            onMouseLeave={() => setPingCursorPos(null)}
            onDoubleClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest('[data-device-id]') || target.closest('[data-note-id]')) {
                    return;
                }
                if (resetView) {
                    resetView();
                } else {
                    setZoom(1.0);
                    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
                    const topMargin = isMobile ? 110 : 55;
                    const sideMargin = isMobile ? 16 : 24;
                    if (devices.length === 0 && notes.length === 0) {
                        setPan({ x: sideMargin, y: topMargin });
                    } else {
                        const minDeviceX = devices.length ? Math.min(...devices.map(d => d.x)) : Infinity;
                        const minDeviceY = devices.length ? Math.min(...devices.map(d => d.y)) : Infinity;
                        const minNoteX = notes.length ? Math.min(...notes.map(n => n.x)) : Infinity;
                        const minNoteY = notes.length ? Math.min(...notes.map(n => n.y)) : Infinity;
                        const minX = Math.min(minDeviceX, minNoteX);
                        const minY = Math.min(minDeviceY, minNoteY);
                        setPan({
                            x: sideMargin - minX,
                            y: topMargin - minY
                        });
                    }
                }
            }}
            onClick={() => {
                canvasRef.current?.focus();
                setSelectedDeviceIds([]);
                setSelectedNoteIds([]);
                setSelectAllMode(false);
                cancelConnectionDrawing();
                setContextMenu(null);
            }}
            onContextMenu={(e) => {
                const target = e.target as HTMLElement;
                const noteElement = target.closest('[data-note-id]');
                const textareaElement = noteElement?.querySelector('textarea');
                const contentEditableElement = noteElement?.querySelector('[contenteditable]');
                const isEditingNote = Boolean(textareaElement?.matches(':focus') || contentEditableElement?.matches(':focus'));

                if (isEditingNote) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }

                const deviceId = target.closest('[data-device-id]')?.getAttribute('data-device-id') ?? undefined;
                handleContextMenu(e as unknown as React.MouseEvent<HTMLDivElement>, deviceId);
            }}
            onKeyDown={(e) => {
                if (e.key === 'Escape') {
                    cancelConnectionDrawing();
                }
            }}
        >
            <svg width="100%" height="100%" className="block select-none print:w-full print:h-auto print:block">
                <g ref={svgContentGroupRef} data-content-group="true" style={{ transformOrigin: '0 0', transition: 'none', willChange: 'transform' }}>
                    <CanvasDefs isDark={isDark} canvasWidth={canvasSize.width} canvasHeight={canvasSize.height} />

                    <g clipPath="url(#canvasClip)">
                        <rect x="0" y="0" width={canvasSize.width} height={canvasSize.height} fill="url(#canvasBgGradient)" />
                        <rect data-export-hide="true" x="0" y="0" width={canvasSize.width} height={canvasSize.height} fill="url(#canvasAmbientGlow)" />
                        <rect data-export-hide="true" x="0" y="0" width={canvasSize.width} height={canvasSize.height} fill="url(#canvasAmbientGlowSecondary)" />
                        <rect data-export-hide="true" x="0" y="0" width={canvasSize.width} height={canvasSize.height} fill="url(#majorGridPattern)" />
                        <rect data-export-hide="true" x="0" y="0" width={canvasSize.width} height={canvasSize.height} fill="url(#gridPattern)" />

                        <EnvironmentBackgrounds environment={environment} isDark={isDark} t={t} />

                        {/* Notes are intentionally below cables and devices in SVG paint order. */}
                        {visibleNotes.map((note) => (
                            <NoteNode
                                key={note.id}
                                note={note}
                                isDark={isDark}
                                selectedNoteIds={selectedNoteIds}
                                draggedNoteId={null}
                                contextMenu={contextMenu}
                                language={language}
                                t={t}
                                noteTextareaRefs={noteTextareaRefs}
                                devices={devices}
                                connections={connections}
                                notes={notes}
                                setSelectedNoteIds={setSelectedNoteIds}
                                setSelectedDeviceIds={setSelectedDeviceIds}
                                setContextMenu={setContextMenu}
                                handleNoteHeaderMouseDown={handleNoteHeaderMouseDown}
                                handleNoteHeaderTouchStart={handleNoteHeaderTouchStart}
                                cycleNoteColor={cycleNoteColor}
                                cycleNoteFont={cycleNoteFont}
                                cycleNoteFontSize={cycleNoteFontSize}
                                cycleNoteOpacity={cycleNoteOpacity}
                                duplicateNote={duplicateNote}
                                deleteNote={deleteNote}
                                updateNoteText={updateNoteText}
                                setNoteTextSelection={setNoteTextSelection}
                                onTopologyChange={undefined}
                                handleNoteResizeStart={handleNoteResizeStart}
                                handleNoteResizeTouchStart={handleNoteResizeTouchStart}
                                bringNoteToFront={bringNoteToFront}
                            />
                        ))}

                        {visibleConnections.map((conn) => {
                            const sourceDevice = deviceMap.get(conn.sourceDeviceId);
                            const targetDevice = deviceMap.get(conn.targetDeviceId);
                            if (!sourceDevice || !targetDevice) return null;

                            const ids = connectionGroups.get(getDevicePairKey(conn.sourceDeviceId, conn.targetDeviceId)) ?? [];
                            const rawIndex = ids.indexOf(conn.id);
                            const sameConnIndex = rawIndex >= 0 ? rawIndex : 0;
                            const totalSameConns = ids.length || 1;

                            return (
                                <React.Fragment key={`connection-group-${conn.id}`}>
                                    <ConnectionLine
                                        connection={conn}
                                        sourceDevice={sourceDevice}
                                        targetDevice={targetDevice}
                                        isDark={isDark}
                                        isDragging={isActuallyDragging || isTouchDragging}
                                        totalSameConns={totalSameConns}
                                        sameConnIndex={sameConnIndex}
                                        getPortPosition={getPortPosition}
                                        CABLE_COLORS={CABLE_COLORS}
                                        zoom={zoom}
                                        graphicsQuality={graphicsQuality}
                                        isHovered={hoveredConnectionId === conn.id || activeCaptureConnectionId === conn.id}
                                        onMouseEnter={(e: React.MouseEvent<SVGPathElement>) => handleConnectionMouseEnter(e, conn.id, sourceDevice.name, conn.sourcePort, targetDevice.name, conn.targetPort, conn.cableType, getConnectionStatusMessage(conn, devices, language))}
                                        onMouseLeave={handleConnectionMouseLeave}
                                        onClick={(e: React.MouseEvent) => handleConnectionClick(e, conn.id)}
                                        deviceStates={deviceStates}
                                    />
                                    <ConnectionHandle
                                        connection={conn}
                                        sourceDevice={sourceDevice}
                                        targetDevice={targetDevice}
                                        isDark={isDark}
                                        sameConnIndex={sameConnIndex}
                                        totalSameConns={totalSameConns}
                                        getPortPosition={getPortPosition}
                                        onDelete={onDeleteConnection}
                                        onToggleActive={onToggleConnectionActive}
                                    />
                                </React.Fragment>
                            );
                        })}

                        <TempConnection
                            isDrawingConnection={isDrawingConnection}
                            connectionStart={connectionStart}
                            mousePos={mousePos}
                            cableInfo={cableInfo}
                            CABLE_COLORS={CABLE_COLORS}
                        />

                        {devicesSortedForRender.map((device) => (
                            <React.Fragment key={device.id}>{renderDevice(device, false)}</React.Fragment>
                        ))}

                        <PingAnimationOverlay
                            pingAnimation={pingAnimation}
                            deviceMap={deviceMap}
                            connections={connections}
                            getPortPosition={getPortPosition}
                            getDeviceCenter={getDeviceCenter}
                            graphicsQuality={graphicsQuality}
                            isDark={isDarkForPing}
                            t={tForPing}
                            handleEnvelopeClick={handleEnvelopeClick}
                        />

                        {selectionBox && (
                            <SelectionBoxOverlay selectionBox={selectionBox} isDark={isDark} zoom={zoom} selectedDeviceCount={selectedDeviceIds.length} />
                        )}
                    </g>

                    <rect data-export-hide="true" x="0" y="0" width={canvasSize.width} height={canvasSize.height} fill="none" stroke={isDark ? 'var(--color-primary-600)' : 'var(--color-primary-700)'} strokeWidth={2 / zoom} strokeDasharray={`${6 / zoom},${4 / zoom}`} opacity={0.7} />
                    <text data-export-hide="true" x={canvasSize.width - 80} y={canvasSize.height - 10} style={{ fill: 'var(--color-secondary-500)' }} fontSize={12 / zoom} fontFamily="monospace">
                        {canvasSize.width} × {canvasSize.height}
                    </text>
                </g>
            </svg>
        </div>
    );
}

