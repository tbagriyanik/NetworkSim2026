import React, { useState, useMemo } from 'react';
import { Map, ChevronDown, ChevronUp } from 'lucide-react';
import type { CanvasDevice, CanvasConnection } from '../networkTopology.types';

interface MinimapNavigatorProps {
  devices: CanvasDevice[];
  connections: CanvasConnection[];
  zoom: number;
  pan: { x: number; y: number };
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  isDark: boolean;
  language: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function MinimapNavigator({
  devices,
  connections,
  zoom,
  pan,
  setPan,
  canvasRef,
  isDark,
  language,
  isOpen: externalIsOpen,
  onToggle,
}: MinimapNavigatorProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const toggleOpen = onToggle || (() => setInternalIsOpen(!internalIsOpen));

  // Compute bounding box of all topology elements
  const bounds = useMemo(() => {
    if (devices.length === 0) {
      return { minX: 0, maxX: 1000, minY: 0, maxY: 800, width: 1000, height: 800 };
    }
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    devices.forEach((d) => {
      minX = Math.min(minX, d.x);
      maxX = Math.max(maxX, d.x + 80);
      minY = Math.min(minY, d.y);
      maxY = Math.max(maxY, d.y + 60);
    });

    const padding = 100;
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;

    return {
      minX,
      maxX,
      minY,
      maxY,
      width: Math.max(400, maxX - minX),
      height: Math.max(300, maxY - minY),
    };
  }, [devices]);

  // Viewport rect calculation in minimap scale
  const MAP_WIDTH = 180;
  const MAP_HEIGHT = 120;

  const scaleX = MAP_WIDTH / bounds.width;
  const scaleY = MAP_HEIGHT / bounds.height;
  const scale = Math.min(scaleX, scaleY);

  const viewWidth = canvasRef.current ? canvasRef.current.clientWidth : 800;
  const viewHeight = canvasRef.current ? canvasRef.current.clientHeight : 600;

  // Transform canvas view coordinates to minimap coordinates
  // Canvas coordinate (0,0) mapped to minimap:
  const mapX = (x: number) => (x - bounds.minX) * scale;
  const mapY = (y: number) => (y - bounds.minY) * scale;

  // Visible viewport bounding box on topology:
  const visibleWorldMinX = -pan.x / zoom;
  const visibleWorldMinY = -pan.y / zoom;
  const visibleWorldWidth = viewWidth / zoom;
  const visibleWorldHeight = viewHeight / zoom;

  const viewportRect = {
    x: mapX(visibleWorldMinX),
    y: mapY(visibleWorldMinY),
    width: visibleWorldWidth * scale,
    height: visibleWorldHeight * scale,
  };

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert minimap click position to world coordinates
    const targetWorldX = bounds.minX + clickX / scale;
    const targetWorldY = bounds.minY + clickY / scale;

    // Center viewport on target world coordinates
    setPan({
      x: viewWidth / 2 - targetWorldX * zoom,
      y: viewHeight / 2 - targetWorldY * zoom,
    });
  };

  return (
    <div
      className={`fixed bottom-[110px] right-[10px] z-40 transition-all duration-200 select-none ${
        isDark ? 'text-white' : 'text-slate-900'
      }`}
    >
      {/* Minimap Card Header / Toggle Button */}
      <div
        onClick={toggleOpen}
        className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-t-xl cursor-pointer border shadow-md backdrop-blur-md transition-colors ${
          isOpen ? 'rounded-b-none' : 'rounded-b-xl'
        } ${
          isDark
            ? 'bg-secondary-800/90 border-secondary-700/60 hover:bg-secondary-700/90'
            : 'bg-white/95 border-secondary-200/80 hover:bg-secondary-100/90'
        }`}
        title={language === 'tr' ? 'Mini Haritayı Aç/Kapat' : 'Toggle Mini-map Navigator'}
      >
        <div className="flex items-center gap-1.5">
          <Map className="w-3.5 h-3.5 text-primary-500" />
          <span className="text-[11px] font-bold">
            {language === 'tr' ? 'Mini Harita' : 'Mini-map'}
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 opacity-60" />
        )}
      </div>

      {/* Minimap Body */}
      {isOpen && (
        <div
          onClick={handleMinimapClick}
          style={{ width: MAP_WIDTH, height: MAP_HEIGHT }}
          className={`relative border border-t-0 rounded-b-xl overflow-hidden cursor-crosshair shadow-xl backdrop-blur-md ${
            isDark ? 'bg-secondary-950/80 border-secondary-700/60' : 'bg-slate-900/90 border-secondary-200/80'
          }`}
        >
          {/* Render Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {connections.map((conn) => {
              const srcDev = devices.find((d) => d.id === conn.sourceDeviceId);
              const tgtDev = devices.find((d) => d.id === conn.targetDeviceId);
              if (!srcDev || !tgtDev) return null;
              return (
                <line
                  key={conn.id}
                  x1={mapX(srcDev.x + 30)}
                  y1={mapY(srcDev.y + 20)}
                  x2={mapX(tgtDev.x + 30)}
                  y2={mapY(tgtDev.y + 20)}
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1.5"
                />
              );
            })}
          </svg>

          {/* Render Device Nodes */}
          {devices.map((d) => (
            <div
              key={d.id}
              style={{
                left: `${mapX(d.x)}px`,
                top: `${mapY(d.y)}px`,
              }}
              className={`absolute w-2 h-2 -ml-1 -mt-1 rounded-full shadow-sm ${
                d.type === 'router'
                  ? 'bg-purple-400'
                  : d.type.startsWith('switch')
                  ? 'bg-emerald-400'
                  : 'bg-sky-400'
              }`}
              title={d.name}
            />
          ))}

          {/* Render Active Viewport Rect */}
          <div
            style={{
              left: `${Math.max(0, Math.min(MAP_WIDTH - 20, viewportRect.x))}px`,
              top: `${Math.max(0, Math.min(MAP_HEIGHT - 20, viewportRect.y))}px`,
              width: `${Math.min(MAP_WIDTH, Math.max(16, viewportRect.width))}px`,
              height: `${Math.min(MAP_HEIGHT, Math.max(16, viewportRect.height))}px`,
            }}
            className="absolute border-2 border-amber-400 bg-amber-400/20 rounded pointer-events-none transition-all duration-75 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
          />
        </div>
      )}
    </div>
  );
}
