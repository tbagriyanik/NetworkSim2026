import React, { useRef, useState, useCallback, useEffect } from 'react';
import { CanvasDevice, CanvasConnection } from './networkTopology.types';

export interface HopPacketInfo {
    hopIndex: number;
    fromDevice: { id: string; name: string; type: string; ip: string; mac: string };
    toDevice: { id: string; name: string; type: string; ip: string; mac: string };
    cableType: string;
    srcMac: string;
    dstMac: string;
    etherType: string;
    srcIp: string;
    dstIp: string;
    ttl: number;
    protocol: string;
    icmpType: string;
    icmpCode: number;
    icmpSeq: number;
    layer2: string;
    layer3: string;
    layer4: string;
}

interface PingPacketInfoPanelProps {
    isVisible: boolean;
    isPaused: boolean;
    hopPacketInfos: HopPacketInfo[];
    currentHopIndex: number;
    totalHops: number;
    onPlay: () => void;
    onPause: () => void;
    onNext: () => void;
    onClose: () => void;
    language: 'tr' | 'en';
    isDark: boolean;
    // Result props
    success?: boolean | null;
    isReturn?: boolean;
    errorMessage?: string;
    sourceName?: string;
    targetName?: string;
    sourceIp?: string;
    targetIp?: string;
}

const tr = {
    title: 'Paket Analizi',
    hop: 'Hop',
    of: '/',
    play: 'Oynat',
    pause: 'Duraklat',
    next: 'Sonraki Hop',
    close: 'Kapat',
    layer2: 'Katman 2 — Ethernet Çerçevesi',
    layer3: 'Katman 3 — IP Başlığı',
    layer4: 'Katman 4 — ICMP',
    srcMac: 'Kaynak MAC',
    dstMac: 'Hedef MAC',
    etherType: 'EtherType',
    srcIp: 'Kaynak IP',
    dstIp: 'Hedef IP',
    ttl: 'TTL',
    protocol: 'Protokol',
    icmpType: 'ICMP Tipi',
    icmpCode: 'ICMP Kodu',
    icmpSeq: 'Sıra No',
    noHops: 'Henüz hop yok',
    wireless: 'Kablosuz (WiFi)',
    wired: 'Kablolu (Ethernet)',
    fiber: 'Fiber Optik',
    console: 'Konsol',
    changed: 'Değişti',
    macChanged: 'MAC değişti — yönlendirme',
    ipSame: 'IP aynı kaldı — uçtan uca',
    ttlDec: 'TTL azaldı',
    segment: 'Segment',
    via: 'üzerinden',
    paused: 'Duraklatıldı',
    // Result strings
    successTitle: 'Ping Başarılı',
    successReply: 'Yanıt alındı',
    failTitle: 'Ping Başarısız',
    failReason: 'Hata nedeni',
    returnLabel: 'Echo Reply — Geri Dönüş',
    forwardLabel: 'Echo Request — İleri',
    replyFrom: 'Yanıt:',
    bytes: 'bayt',
    ttlLabel: 'TTL',
    timeLabel: 'süre',
    requestTimeout: 'İstek zaman aşımına uğradı',
};

const en = {
    title: 'Packet Analysis',
    hop: 'Hop',
    of: '/',
    play: 'Play',
    pause: 'Pause',
    next: 'Next Hop',
    close: 'Close',
    layer2: 'Layer 2 — Ethernet Frame',
    layer3: 'Layer 3 — IP Header',
    layer4: 'Layer 4 — ICMP',
    srcMac: 'Source MAC',
    dstMac: 'Dest MAC',
    etherType: 'EtherType',
    srcIp: 'Source IP',
    dstIp: 'Dest IP',
    ttl: 'TTL',
    protocol: 'Protocol',
    icmpType: 'ICMP Type',
    icmpCode: 'ICMP Code',
    icmpSeq: 'Seq No',
    noHops: 'No hops yet',
    wireless: 'Wireless (WiFi)',
    wired: 'Wired (Ethernet)',
    fiber: 'Fiber Optic',
    console: 'Console',
    changed: 'Changed',
    macChanged: 'MAC changed — routing',
    ipSame: 'IP unchanged — end-to-end',
    ttlDec: 'TTL decremented',
    segment: 'Segment',
    via: 'via',
    paused: 'Paused',
    // Result strings
    successTitle: 'Ping Successful',
    successReply: 'Reply received',
    failTitle: 'Ping Failed',
    failReason: 'Reason',
    returnLabel: 'Echo Reply — Return',
    forwardLabel: 'Echo Request — Forward',
    replyFrom: 'Reply from',
    bytes: 'bytes',
    ttlLabel: 'TTL',
    timeLabel: 'time',
    requestTimeout: 'Request timed out',
};

function getCableLabel(cableType: string, t: typeof tr) {
    if (cableType === 'wireless') return t.wireless;
    if (cableType === 'fiber') return t.fiber;
    if (cableType === 'console') return t.console;
    return t.wired;
}

function getCableColor(cableType: string) {
    if (cableType === 'wireless') return '#8b5cf6';
    if (cableType === 'fiber') return '#f59e0b';
    if (cableType === 'console') return '#6b7280';
    return '#06b6d4';
}

interface FieldRowProps {
    label: string;
    value: string;
    highlight?: 'changed' | 'same' | 'none';
    isDark: boolean;
    badge?: string;
    badgeColor?: string;
    prevValue?: string;
}

function FieldRow({ label, value, highlight = 'none', isDark, badge, badgeColor, prevValue }: FieldRowProps) {
    const highlightClass =
        highlight === 'changed'
            ? isDark ? 'text-amber-300' : 'text-amber-600'
            : highlight === 'same'
                ? isDark ? 'text-emerald-300' : 'text-emerald-600'
                : isDark ? 'text-slate-100' : 'text-slate-800';

    return (
        <tr className={`border-b last:border-0 ${isDark ? 'border-slate-700/40' : 'border-slate-100'}`}>
            <td className={`py-1 pr-3 text-xs font-medium whitespace-nowrap w-28 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {label}
            </td>
            <td className={`py-1 text-xs font-mono ${highlightClass}`}>
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span>{value}</span>
                    {prevValue && prevValue !== value && (
                        <span className={`text-[10px] font-mono line-through opacity-50 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {prevValue}
                        </span>
                    )}
                    {badge && (
                        <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold"
                            style={{ background: badgeColor || '#6b7280', color: 'white' }}
                        >
                            {badge}
                        </span>
                    )}
                </div>
            </td>
        </tr>
    );
}

export function PingPacketInfoPanel({
    isVisible,
    isPaused,
    hopPacketInfos,
    currentHopIndex,
    totalHops,
    onPlay,
    onPause,
    onNext,
    onClose,
    language,
    isDark,
    success,
    isReturn,
    errorMessage,
    sourceName,
    targetName,
    sourceIp,
    targetIp,
}: PingPacketInfoPanelProps) {
    const t = language === 'tr' ? tr : en;

    // Drag support
    const panelRef = React.useRef<HTMLDivElement>(null);
    const dragState = React.useRef({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 });
    const [pos, setPos] = React.useState<{ x: number; y: number } | null>(null);

    const onHeaderMouseDown = React.useCallback((e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        e.preventDefault();
        const panel = panelRef.current;
        if (!panel) return;
        const rect = panel.getBoundingClientRect();
        dragState.current = { dragging: true, startX: e.clientX, startY: e.clientY, originX: rect.left, originY: rect.top };
    }, []);

    React.useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!dragState.current.dragging) return;
            const panel = panelRef.current;
            if (!panel) return;
            const newX = Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, dragState.current.originX + e.clientX - dragState.current.startX));
            const newY = Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, dragState.current.originY + e.clientY - dragState.current.startY));
            setPos({ x: newX, y: newY });
        };
        const onUp = () => { dragState.current.dragging = false; };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    }, []);

    if (!isVisible) return null;

    // Ground-truth hop count from actual data
    const totalHopCount = hopPacketInfos.length;
    const safeIdx = Math.min(Math.max(0, currentHopIndex), Math.max(0, totalHopCount - 1));
    const currentInfo = totalHopCount > 0 ? hopPacketInfos[safeIdx] : null;
    const prevInfo = safeIdx > 0 ? hopPacketInfos[safeIdx - 1] : null;

    const macChanged = prevInfo ? (currentInfo?.srcMac !== prevInfo.srcMac || currentInfo?.dstMac !== prevInfo.dstMac) : false;
    const ipSame = prevInfo ? (currentInfo?.srcIp === prevInfo.srcIp && currentInfo?.dstIp === prevInfo.dstIp) : true;
    const ttlChanged = prevInfo ? currentInfo?.ttl !== prevInfo.ttl : false;

    const isDone = success === true || success === false;
    const isSuccess = success === true;
    const isFailure = success === false;

    const posStyle: React.CSSProperties = pos
        ? { position: 'fixed', left: pos.x, top: pos.y, bottom: 'auto', transform: 'none' }
        : { position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)' };

    return (
        <div
            ref={panelRef}
            className={`z-[9999] rounded-2xl shadow-2xl border overflow-hidden select-none
                ${isDark ? 'bg-slate-900/97 border-slate-700/80' : 'bg-white/98 border-slate-200'}
            `}
            style={{ ...posStyle, width: 780, backdropFilter: 'blur(16px)' }}
        >
            {/* Header — drag handle */}
            <div
                className={`flex items-center justify-between px-4 py-2.5 border-b cursor-grab active:cursor-grabbing
                    ${isDark ? 'bg-slate-800/70 border-slate-700/60' : 'bg-slate-50 border-slate-200'}
                `}
                onMouseDown={onHeaderMouseDown}
            >
                {/* Left side */}
                <div className="flex items-center gap-2.5">
                    {/* macOS close button */}
                    <button
                        onClick={onClose}
                        title={t.close}
                        className="group w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center flex-shrink-0 transition-colors"
                    >
                        <svg width="6" height="6" viewBox="0 0 10 10" className="opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="white" strokeWidth="2.5">
                            <line x1="2" y1="2" x2="8" y2="8" /><line x1="8" y1="2" x2="2" y2="8" />
                        </svg>
                    </button>

                    {/* Envelope icon */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        className={`flex-shrink-0 ${isSuccess ? 'text-emerald-500' : isFailure ? 'text-red-500' : isReturn ? 'text-amber-400' : 'text-cyan-500'}`}>
                        <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                        <path d="M2 7l10 7 10-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>

                    <span className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                        {t.title}
                    </span>

                    {/* Direction badge */}
                    {isReturn ? (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold
                            ${isDark ? 'bg-amber-900/50 text-amber-300 border border-amber-800/40' : 'bg-amber-50 text-amber-700 border border-amber-200'}
                        `}>↩ {t.returnLabel}</span>
                    ) : (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold
                            ${isDark ? 'bg-cyan-900/50 text-cyan-300 border border-cyan-800/40' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'}
                        `}>→ {t.forwardLabel}</span>
                    )}

                    {/* Hop dots — only while animating */}
                    {!isDone && totalHopCount > 0 && (
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalHopCount }).map((_, i) => (
                                <div key={i} className={`rounded-full transition-all duration-300 ${
                                    i === safeIdx ? 'w-4 h-2 bg-cyan-500'
                                    : i < safeIdx ? (isDark ? 'w-2 h-2 bg-slate-500' : 'w-2 h-2 bg-slate-400')
                                    : (isDark ? 'w-2 h-2 bg-slate-700' : 'w-2 h-2 bg-slate-200')
                                }`} title={`${t.hop} ${i + 1}`} />
                            ))}
                        </div>
                    )}

                    {/* Hop counter */}
                    {!isDone && totalHopCount > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-semibold
                            ${isDark ? 'bg-slate-700/60 text-slate-300' : 'bg-slate-100 text-slate-600'}
                        `}>{t.hop} {safeIdx + 1}/{totalHopCount}</span>
                    )}

                    {/* Paused badge */}
                    {isPaused && !isDone && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold
                            ${isDark ? 'bg-amber-900/50 text-amber-300 border border-amber-800/40' : 'bg-amber-50 text-amber-700 border border-amber-200'}
                        `}>⏸ {t.paused}</span>
                    )}
                </div>

                {/* Right: controls — hidden when done */}
                {!isDone && (
                    <div className="flex items-center gap-2" onMouseDown={e => e.stopPropagation()}>
                        {isPaused ? (
                            <button onClick={onPlay} title={t.play}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                                    ${isDark ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}
                                `}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
                                {t.play}
                            </button>
                        ) : (
                            <button onClick={onPause} title={t.pause}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                                    ${isDark ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}
                                `}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                                </svg>
                                {t.pause}
                            </button>
                        )}
                        <button onClick={onNext} title={t.next} disabled={!isPaused}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                                ${isPaused
                                    ? (isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white')
                                    : (isDark ? 'bg-slate-700/40 text-slate-600 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed')
                                }
                            `}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5,3 14,12 5,21" /><rect x="16" y="3" width="3" height="18" />
                            </svg>
                            {t.next}
                        </button>
                    </div>
                )}
            </div>

            {/* Result banner */}
            {isDone && (
                <div className={`px-5 py-3 flex items-start gap-3 border-b
                    ${isSuccess
                        ? (isDark ? 'bg-emerald-900/30 border-emerald-800/40' : 'bg-emerald-50 border-emerald-100')
                        : (isDark ? 'bg-red-900/30 border-red-800/40' : 'bg-red-50 border-red-100')
                    }
                `}>
                    {isSuccess ? (
                        <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                    <div className="flex-1 min-w-0">
                        {isSuccess ? (
                            <>
                                <div className={`text-sm font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{t.successTitle}</div>
                                <div className={`text-xs mt-0.5 font-mono ${isDark ? 'text-emerald-400/80' : 'text-emerald-600'}`}>
                                    {language === 'tr'
                                        ? `${targetIp || targetName}: bayt=32 TTL=${currentInfo?.ttl ?? 64}`
                                        : `Reply from ${targetIp || targetName}: bytes=32 TTL=${currentInfo?.ttl ?? 64}`}
                                </div>
                                <div className={`text-xs mt-0.5 ${isDark ? 'text-emerald-500/70' : 'text-emerald-600/70'}`}>
                                    {sourceName} → {targetName} → {sourceName}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className={`text-sm font-bold ${isDark ? 'text-red-300' : 'text-red-700'}`}>{t.failTitle}</div>
                                {errorMessage && (
                                    <div className={`text-xs mt-0.5 ${isDark ? 'text-red-400/80' : 'text-red-600'}`}>
                                        {t.failReason}: {errorMessage}
                                    </div>
                                )}
                                {currentInfo && (
                                    <div className={`text-xs mt-0.5 font-mono ${isDark ? 'text-red-500/70' : 'text-red-500/70'}`}>
                                        {language === 'tr'
                                            ? `${currentInfo.fromDevice.name} → ${currentInfo.toDevice.name} adımında başarısız`
                                            : `Failed at ${currentInfo.fromDevice.name} → ${currentInfo.toDevice.name}`}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Body */}
            {currentInfo ? (
                <div className="px-5 py-4 space-y-3">
                    {/* Route bar */}
                    <div className={`flex items-center gap-3 rounded-xl px-4 py-2.5
                        ${isDark ? 'bg-slate-800/50 border border-slate-700/40' : 'bg-slate-50 border border-slate-200'}
                    `}>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                currentInfo.fromDevice.type === 'router' ? 'bg-purple-500' :
                                currentInfo.fromDevice.type.startsWith('switch') ? 'bg-teal-500' : 'bg-blue-500'
                            }`} />
                            <span className={`text-sm font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{currentInfo.fromDevice.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>
                                {currentInfo.fromDevice.type}
                            </span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                            <svg width="56" height="12" viewBox="0 0 56 12" fill="none">
                                <line x1="0" y1="6" x2="48" y2="6" stroke={getCableColor(currentInfo.cableType)} strokeWidth="2"
                                    strokeDasharray={currentInfo.cableType === 'wireless' ? '4,3' : 'none'} />
                                <polygon points="48,2 56,6 48,10" fill={getCableColor(currentInfo.cableType)} />
                            </svg>
                            <span className="text-[10px] font-medium" style={{ color: getCableColor(currentInfo.cableType) }}>
                                {getCableLabel(currentInfo.cableType, t)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>
                                {currentInfo.toDevice.type}
                            </span>
                            <span className={`text-sm font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{currentInfo.toDevice.name}</span>
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                currentInfo.toDevice.type === 'router' ? 'bg-purple-500' :
                                currentInfo.toDevice.type.startsWith('switch') ? 'bg-teal-500' : 'bg-blue-500'
                            }`} />
                        </div>
                        {macChanged && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0
                                ${isDark ? 'bg-amber-900/60 text-amber-300 border border-amber-800/40' : 'bg-amber-100 text-amber-700 border border-amber-200'}
                            `}>⚡ {t.macChanged}</span>
                        )}
                        {ipSame && prevInfo && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0
                                ${isDark ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-800/40' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}
                            `}>✓ {t.ipSame}</span>
                        )}
                    </div>

                    {/* 3-column packet tables */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className={`rounded-xl overflow-hidden border ${isDark ? 'border-blue-900/50 bg-blue-950/30' : 'border-blue-100 bg-blue-50/60'}`}>
                            <div className={`px-3 py-1.5 text-[11px] font-bold tracking-wide border-b
                                ${isDark ? 'bg-blue-900/30 border-blue-900/40 text-blue-400' : 'bg-blue-100/80 border-blue-100 text-blue-700'}
                            `}>{t.layer2}</div>
                            <table className="w-full"><tbody>
                                <FieldRow label={t.srcMac} value={currentInfo.srcMac} prevValue={prevInfo?.srcMac}
                                    highlight={macChanged ? 'changed' : 'none'} isDark={isDark}
                                    badge={macChanged ? t.changed : undefined} badgeColor="#d97706" />
                                <FieldRow label={t.dstMac} value={currentInfo.dstMac} prevValue={prevInfo?.dstMac}
                                    highlight={macChanged ? 'changed' : 'none'} isDark={isDark} />
                                <FieldRow label={t.etherType} value={currentInfo.etherType} isDark={isDark} />
                            </tbody></table>
                        </div>
                        <div className={`rounded-xl overflow-hidden border ${isDark ? 'border-emerald-900/50 bg-emerald-950/30' : 'border-emerald-100 bg-emerald-50/60'}`}>
                            <div className={`px-3 py-1.5 text-[11px] font-bold tracking-wide border-b
                                ${isDark ? 'bg-emerald-900/30 border-emerald-900/40 text-emerald-400' : 'bg-emerald-100/80 border-emerald-100 text-emerald-700'}
                            `}>{t.layer3}</div>
                            <table className="w-full"><tbody>
                                <FieldRow label={t.srcIp} value={currentInfo.srcIp} highlight="same" isDark={isDark} />
                                <FieldRow label={t.dstIp} value={currentInfo.dstIp} highlight="same" isDark={isDark} />
                                <FieldRow label={t.ttl} value={String(currentInfo.ttl)} prevValue={prevInfo ? String(prevInfo.ttl) : undefined}
                                    highlight={ttlChanged ? 'changed' : 'none'} isDark={isDark}
                                    badge={ttlChanged ? t.ttlDec : undefined} badgeColor="#d97706" />
                                <FieldRow label={t.protocol} value={currentInfo.protocol} isDark={isDark} />
                            </tbody></table>
                        </div>
                        <div className={`rounded-xl overflow-hidden border ${isDark ? 'border-purple-900/50 bg-purple-950/30' : 'border-purple-100 bg-purple-50/60'}`}>
                            <div className={`px-3 py-1.5 text-[11px] font-bold tracking-wide border-b
                                ${isDark ? 'bg-purple-900/30 border-purple-900/40 text-purple-400' : 'bg-purple-100/80 border-purple-100 text-purple-700'}
                            `}>{t.layer4}</div>
                            <table className="w-full"><tbody>
                                <FieldRow label={t.icmpType} value={currentInfo.icmpType} isDark={isDark} />
                                <FieldRow label={t.icmpCode} value={String(currentInfo.icmpCode)} isDark={isDark} />
                                <FieldRow label={t.icmpSeq} value={String(currentInfo.icmpSeq)} isDark={isDark} />
                            </tbody></table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={`px-5 py-8 text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {t.noHops}
                </div>
            )}
        </div>
    );
}


/**
 * Build packet info for each hop in the path.
 * Simulates how Ethernet frames change at each hop (MAC rewrite at routers)
 * while IP addresses stay the same end-to-end.
 */
export function buildHopPacketInfos(
    path: string[],
    devices: CanvasDevice[],
    connections: CanvasConnection[],
    initialTTL = 64
): HopPacketInfo[] {
    if (!path || path.length < 2) return [];

    const sourceDevice = devices.find(d => d.id === path[0]);
    const targetDevice = devices.find(d => d.id === path[path.length - 1]);

    const srcIp = sourceDevice?.ip || '0.0.0.0';
    const dstIp = targetDevice?.ip || '0.0.0.0';

    const getMac = (device: CanvasDevice | undefined, fallback: string): string => {
        if (!device) return fallback;
        if (device.macAddress) return device.macAddress;
        const hash = device.id.replace(/[^a-f0-9]/gi, '').padEnd(12, '0').slice(0, 12);
        return `${hash.slice(0, 2)}:${hash.slice(2, 4)}:${hash.slice(4, 6)}:${hash.slice(6, 8)}:${hash.slice(8, 10)}:${hash.slice(10, 12)}`.toUpperCase();
    };

    const infos: HopPacketInfo[] = [];
    let ttl = initialTTL;
    let icmpSeq = 1;

    for (let i = 0; i < path.length - 1; i++) {
        const fromDev = devices.find(d => d.id === path[i]);
        const toDev = devices.find(d => d.id === path[i + 1]);

        const conn = connections.find(c =>
            (c.sourceDeviceId === path[i] && c.targetDeviceId === path[i + 1]) ||
            (c.sourceDeviceId === path[i + 1] && c.targetDeviceId === path[i])
        );

        const isRouterHop = fromDev?.type === 'router' || toDev?.type === 'router';
        const srcMac = getMac(fromDev, 'AA:BB:CC:DD:EE:FF');
        const dstMac = getMac(toDev, 'FF:EE:DD:CC:BB:AA');

        if (i > 0 && isRouterHop) {
            ttl = Math.max(1, ttl - 1);
        }

        const cableType = conn?.cableType || 'straight';

        infos.push({
            hopIndex: i,
            fromDevice: {
                id: fromDev?.id || path[i],
                name: fromDev?.name || path[i],
                type: fromDev?.type || 'unknown',
                ip: fromDev?.ip || '0.0.0.0',
                mac: srcMac,
            },
            toDevice: {
                id: toDev?.id || path[i + 1],
                name: toDev?.name || path[i + 1],
                type: toDev?.type || 'unknown',
                ip: toDev?.ip || '0.0.0.0',
                mac: dstMac,
            },
            cableType,
            srcMac,
            dstMac,
            etherType: '0x0800 (IPv4)',
            srcIp,
            dstIp,
            ttl,
            protocol: 'ICMP (1)',
            icmpType: 'Echo Request (8)',
            icmpCode: 0,
            icmpSeq: icmpSeq++,
            layer2: 'Ethernet II',
            layer3: 'IPv4',
            layer4: 'ICMP',
        });
    }

    return infos;
}
