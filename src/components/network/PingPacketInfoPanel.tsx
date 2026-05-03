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
    graphicsQuality?: 'high' | 'low';
    zIndex?: number;
    isMobile?: boolean;
    onFocus?: () => void;
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
        <tr className={`border-b last:border-0 ${isDark ? 'border-white/8' : 'border-black/6'}`}>
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

// Mobile compact: tabbed Layer 2 / 3 / 4 view
interface MobilePacketTablesProps {
    currentInfo: HopPacketInfo;
    prevInfo: HopPacketInfo | null;
    macChanged: boolean;
    ttlChanged: boolean;
    isDark: boolean;
    isGlass: boolean;
    t: typeof tr;
}

function MobilePacketTables({ currentInfo, prevInfo, macChanged, ttlChanged, isDark, isGlass, t }: MobilePacketTablesProps) {
    const [activeTab, setActiveTab] = React.useState<'l2' | 'l3' | 'l4'>('l2');

    const tabs = [
        { id: 'l2' as const, label: 'L2', color: 'emerald' },
        { id: 'l3' as const, label: 'L3', color: 'purple' },
        { id: 'l4' as const, label: 'L4', color: 'blue' },
    ];

    const tabColors = {
        blue: { active: isDark ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' : 'bg-blue-100 text-blue-700 border-blue-300', inactive: isDark ? 'text-slate-400' : 'text-slate-500' },
        emerald: { active: isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' : 'bg-emerald-100 text-emerald-700 border-emerald-300', inactive: isDark ? 'text-slate-400' : 'text-slate-500' },
        purple: { active: isDark ? 'bg-purple-500/20 text-purple-300 border-purple-400/30' : 'bg-purple-100 text-purple-700 border-purple-300', inactive: isDark ? 'text-slate-400' : 'text-slate-500' },
    };

    const containerCls = {
        blue: isGlass ? (isDark ? 'border-blue-400/20 bg-blue-500/10' : 'border-blue-400/30 bg-blue-500/8') : (isDark ? 'border-blue-900/60 bg-blue-950/50' : 'border-blue-200 bg-blue-50'),
        emerald: isGlass ? (isDark ? 'border-emerald-400/20 bg-emerald-500/10' : 'border-emerald-400/30 bg-emerald-500/8') : (isDark ? 'border-emerald-900/60 bg-emerald-950/50' : 'border-emerald-200 bg-emerald-50'),
        purple: isGlass ? (isDark ? 'border-purple-400/20 bg-purple-500/10' : 'border-purple-400/30 bg-purple-500/8') : (isDark ? 'border-purple-900/60 bg-purple-950/50' : 'border-purple-200 bg-purple-50'),
    };

    return (
        <div>
            {/* Tab bar */}
            <div className="flex gap-1 mb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onMouseDown={e => e.stopPropagation()}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-1 text-[11px] font-bold rounded-lg border transition-all ${activeTab === tab.id ? tabColors[tab.color as keyof typeof tabColors].active : (isDark ? 'border-transparent text-slate-500' : 'border-transparent text-slate-400')}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            {/* Active tab content */}
            {activeTab === 'l2' && (
                <div className={`rounded-xl overflow-hidden border ${containerCls.emerald}`}>
                    <table className="w-full"><tbody>
                        <FieldRow label={t.srcMac} value={currentInfo.srcMac} prevValue={prevInfo?.srcMac} highlight={macChanged ? 'changed' : 'none'} isDark={isDark} badge={macChanged ? t.changed : undefined} badgeColor="#d97706" />
                        <FieldRow label={t.dstMac} value={currentInfo.dstMac} prevValue={prevInfo?.dstMac} highlight={macChanged ? 'changed' : 'none'} isDark={isDark} />
                        <FieldRow label={t.etherType} value={currentInfo.etherType} isDark={isDark} />
                    </tbody></table>
                </div>
            )}
            {activeTab === 'l3' && (
                <div className={`rounded-xl overflow-hidden border ${containerCls.purple}`}>
                    <table className="w-full"><tbody>
                        <FieldRow label={t.srcIp} value={currentInfo.srcIp} highlight="same" isDark={isDark} />
                        <FieldRow label={t.dstIp} value={currentInfo.dstIp} highlight="same" isDark={isDark} />
                        <FieldRow label={t.ttl} value={String(currentInfo.ttl)} prevValue={prevInfo ? String(prevInfo.ttl) : undefined} highlight={ttlChanged ? 'changed' : 'none'} isDark={isDark} badge={ttlChanged ? t.ttlDec : undefined} badgeColor="#d97706" />
                        <FieldRow label={t.protocol} value={currentInfo.protocol} isDark={isDark} />
                    </tbody></table>
                </div>
            )}
            {activeTab === 'l4' && (
                <div className={`rounded-xl overflow-hidden border ${containerCls.blue}`}>
                    <table className="w-full"><tbody>
                        <FieldRow label={t.icmpType} value={currentInfo.icmpType} isDark={isDark} />
                        <FieldRow label={t.icmpCode} value={String(currentInfo.icmpCode)} isDark={isDark} />
                        <FieldRow label={t.icmpSeq} value={String(currentInfo.icmpSeq)} isDark={isDark} />
                    </tbody></table>
                </div>
            )}
        </div>
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
    graphicsQuality = 'high',
    zIndex,
    isMobile = false,
    onFocus,
    success,
    isReturn,
    errorMessage,
    sourceName,
    targetName,
    sourceIp,
    targetIp,
}: PingPacketInfoPanelProps) {
    const t = language === 'tr' ? tr : en;

    // Drag support — DOM-direct approach to avoid re-renders during drag
    const panelRef = React.useRef<HTMLDivElement>(null);
    const dragState = React.useRef({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 });
    const [pos, setPos] = React.useState<{ x: number; y: number } | null>(null);
    const rafRef = React.useRef<number>(0);
    const [isPlaying, setIsPlaying] = React.useState(!isPaused);

    const onHeaderMouseDown = React.useCallback((e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        e.preventDefault();
        onFocus?.();
        const panel = panelRef.current;
        if (!panel) return;
        const rect = panel.getBoundingClientRect();
        dragState.current = { dragging: true, startX: e.clientX, startY: e.clientY, originX: rect.left, originY: rect.top };
        panel.style.transition = 'none';
        panel.style.willChange = 'left, top';
    }, []);

    // When ping completes (success or failure), show cards again
    React.useEffect(() => {
        if (success !== null) {
            setIsPlaying(false);
        }
    }, [success]);

    React.useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!dragState.current.dragging) return;
            const panel = panelRef.current;
            if (!panel) return;

            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(() => {
                if (!dragState.current.dragging || !panelRef.current) return;
                const newX = Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, dragState.current.originX + e.clientX - dragState.current.startX));
                const newY = Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, dragState.current.originY + e.clientY - dragState.current.startY));
                // Direct DOM update — no React re-render during drag
                panel.style.left = `${newX}px`;
                panel.style.top = `${newY}px`;
                panel.style.bottom = 'auto';
                panel.style.transform = 'none';
            });
        };

        const onUp = (e: MouseEvent) => {
            if (!dragState.current.dragging) return;
            dragState.current.dragging = false;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);

            const panel = panelRef.current;
            if (panel) {
                const newX = Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, dragState.current.originX + e.clientX - dragState.current.startX));
                const newY = Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, dragState.current.originY + e.clientY - dragState.current.startY));
                panel.style.willChange = '';
                // Commit final position to React state once
                setPos({ x: newX, y: newY });
            }
        };

        window.addEventListener('mousemove', onMove, { passive: true });
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    if (!isVisible) return null;

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

    const posStyle: React.CSSProperties = isMobile
        ? { position: 'fixed', bottom: 0, left: 0, right: 0, transform: 'none' }
        : pos
            ? { position: 'fixed', left: pos.x, top: pos.y, bottom: 'auto', transform: 'none' }
            : { position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)' };

    const isGlass = graphicsQuality === 'high';
    const resolvedZIndex = zIndex ?? 9999;

    return (
        <div
            ref={panelRef}
            className={`rounded-2xl overflow-hidden select-none ${isMobile ? 'rounded-b-none' : ''} ${isGlass
                ? isDark
                    ? 'bg-slate-900/60 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)]'
                    : 'bg-white/60 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.9)]'
                : isDark
                    ? 'bg-slate-900 border border-slate-700 shadow-2xl'
                    : 'bg-white border border-slate-200 shadow-2xl'
                }`}
            style={{
                ...posStyle,
                width: isMobile ? '100%' : 780,
                zIndex: resolvedZIndex,
                ...(isGlass ? { backdropFilter: 'blur(24px) saturate(180%)' } : {}),
            }}
            onMouseDown={onFocus}
        >
            {/* Header — drag handle */}
            <div
                className={`flex items-center justify-between px-4 py-2.5 border-b ${isMobile ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'} ${isGlass
                    ? isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/8'
                    : isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                onMouseDown={isMobile ? undefined : onHeaderMouseDown}
            >
                {/* Left: icon + title + badges */}
                <div className="flex items-center gap-2.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        className={`flex-shrink-0 ${isSuccess ? 'text-emerald-500' : isFailure ? 'text-red-500' : isReturn ? 'text-amber-400' : 'text-cyan-500'}`}>
                        <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                        <path d="M2 7l10 7 10-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{t.title}</span>

                    {isReturn ? (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isDark ? 'bg-amber-900/50 text-amber-300 border border-amber-800/40' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                            ↩ {t.returnLabel}
                        </span>
                    ) : (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isDark ? 'bg-cyan-900/50 text-cyan-300 border border-cyan-800/40' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'}`}>
                            → {t.forwardLabel}
                        </span>
                    )}

                    {!isDone && totalHopCount > 0 && (
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalHopCount }).map((_, i) => (
                                <div key={i} className={`rounded-full transition-all duration-300 ${i === safeIdx ? 'w-4 h-2 bg-cyan-500' : i < safeIdx ? (isDark ? 'w-2 h-2 bg-slate-500' : 'w-2 h-2 bg-slate-400') : (isDark ? 'w-2 h-2 bg-slate-700' : 'w-2 h-2 bg-slate-200')}`} title={`${t.hop} ${i + 1}`} />
                            ))}
                        </div>
                    )}

                    {!isDone && totalHopCount > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-semibold ${isDark ? 'bg-slate-700/60 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                            {t.hop} {safeIdx + 1}/{totalHopCount}
                        </span>
                    )}

                    {isPaused && !isDone && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isDark ? 'bg-amber-900/50 text-amber-300 border border-amber-800/40' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                            ⏸ {t.paused}
                        </span>
                    )}
                </div>

                {/* Right: play/pause/next + always-visible close button */}
                <div className="flex items-center gap-2" onMouseDown={e => e.stopPropagation()}>
                    {!isDone && (<>
                        {isPaused ? (
                            <button onClick={() => { setIsPlaying(true); onPlay(); }} title={t.play}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isDark ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
                                {t.play}
                            </button>
                        ) : (
                            <button onClick={() => { setIsPlaying(false); onPause(); }} title={t.pause}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isDark ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                                </svg>
                                {t.pause}
                            </button>
                        )}
                        <button onClick={onNext} title={t.next} disabled={!isPaused}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isPaused ? (isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white') : (isDark ? 'bg-slate-700/40 text-slate-600 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed')}`}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5,3 14,12 5,21" /><rect x="16" y="3" width="3" height="18" />
                            </svg>
                            {t.next}
                        </button>
                        <div className={`w-px h-5 mx-0.5 ${isDark ? 'bg-white/15' : 'bg-black/15'}`} />
                    </>)}

                    {/* Close — always visible, rounded square, X always shown */}
                    <button
                        onClick={onClose}
                        title={t.close}
                        className={`flex items-center justify-center w-7 h-7 rounded-lg font-bold transition-all flex-shrink-0 ${isDark ? 'bg-white/10 hover:bg-red-500/80 text-slate-300 hover:text-white border border-white/15 hover:border-red-400/50' : 'bg-black/8 hover:bg-red-500 text-slate-500 hover:text-white border border-black/10 hover:border-red-400'}`}
                    >
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="2" y1="2" x2="12" y2="12" />
                            <line x1="12" y1="2" x2="2" y2="12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Result banner */}
            {isDone && (
                <div className={`px-5 py-3 flex items-start gap-3 border-b ${isSuccess
                    ? isGlass
                        ? (isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-500/10 border-emerald-500/20')
                        : (isDark ? 'bg-emerald-900/40 border-emerald-800/50' : 'bg-emerald-50 border-emerald-100')
                    : isGlass
                        ? (isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-500/10 border-red-500/20')
                        : (isDark ? 'bg-red-900/40 border-red-800/50' : 'bg-red-50 border-red-100')
                    }`}>
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
                                    {language === 'tr' ? `${targetIp || targetName}: bayt=32 TTL=${currentInfo?.ttl ?? 64}` : `Reply from ${targetIp || targetName}: bytes=32 TTL=${currentInfo?.ttl ?? 64}`}
                                </div>
                                <div className={`text-xs mt-0.5 ${isDark ? 'text-emerald-500/70' : 'text-emerald-600/70'}`}>{sourceName} → {targetName} → {sourceName}</div>
                            </>
                        ) : (
                            <>
                                <div className={`text-sm font-bold ${isDark ? 'text-red-300' : 'text-red-700'}`}>{t.failTitle}</div>
                                {errorMessage && <div className={`text-xs mt-0.5 ${isDark ? 'text-red-400/80' : 'text-red-600'}`}>{t.failReason}: {errorMessage}</div>}
                                {currentInfo && (
                                    <div className={`text-xs mt-0.5 font-mono ${isDark ? 'text-red-500/70' : 'text-red-500/70'}`}>
                                        {language === 'tr' ? `${currentInfo.fromDevice.name} → ${currentInfo.toDevice.name} adımında başarısız` : `Failed at ${currentInfo.fromDevice.name} → ${currentInfo.toDevice.name}`}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Body */}
            {currentInfo ? (
                <div className={isMobile ? 'px-3 py-2 space-y-2' : 'px-5 py-4 space-y-3'}>
                    {/* Route bar */}
                    <div className={`flex items-center gap-2 rounded-xl ${isMobile ? 'px-3 py-2' : 'px-4 py-2.5'} ${isGlass
                        ? isDark ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/8'
                        : isDark ? 'bg-slate-800/80 border border-slate-700' : 'bg-slate-100 border border-slate-200'
                        }`}>
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${currentInfo.fromDevice.type === 'router' ? 'bg-purple-500' : currentInfo.fromDevice.type.startsWith('switch') ? 'bg-teal-500' : 'bg-blue-500'}`} />
                            <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{currentInfo.fromDevice.name}</span>
                            {!isMobile && <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${isDark ? 'bg-white/10 text-slate-400' : 'bg-black/10 text-slate-500'}`}>{currentInfo.fromDevice.type}</span>}
                        </div>
                        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                            <svg width={isMobile ? 32 : 56} height="12" viewBox="0 0 56 12" fill="none">
                                <line x1="0" y1="6" x2="48" y2="6" stroke={getCableColor(currentInfo.cableType)} strokeWidth="2" strokeDasharray={currentInfo.cableType === 'wireless' ? '4,3' : 'none'} />
                                <polygon points="48,2 56,6 48,10" fill={getCableColor(currentInfo.cableType)} />
                            </svg>
                            {!isMobile && <span className="text-[10px] font-medium" style={{ color: getCableColor(currentInfo.cableType) }}>{getCableLabel(currentInfo.cableType, t)}</span>}
                        </div>
                        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                            {!isMobile && <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${isDark ? 'bg-white/10 text-slate-400' : 'bg-black/10 text-slate-500'}`}>{currentInfo.toDevice.type}</span>}
                            <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{currentInfo.toDevice.name}</span>
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${currentInfo.toDevice.type === 'router' ? 'bg-purple-500' : currentInfo.toDevice.type.startsWith('switch') ? 'bg-teal-500' : 'bg-blue-500'}`} />
                        </div>
                        {macChanged && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-500/15 text-amber-700 border border-amber-500/30'}`}>⚡ {isMobile ? '' : t.macChanged}</span>
                        )}
                        {ipSame && prevInfo && !isMobile && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'}`}>✓ {t.ipSame}</span>
                        )}
                    </div>

                    {/* Packet tables — 3 col desktop, 1 col mobile (tabs) */}
                    {!isPlaying && (isMobile ? (
                        <MobilePacketTables
                            currentInfo={currentInfo}
                            prevInfo={prevInfo}
                            macChanged={macChanged}
                            ttlChanged={ttlChanged}
                            isDark={isDark}
                            isGlass={isGlass}
                            t={t}
                        />
                    ) : (
                        <div className="grid grid-cols-3 gap-3">
                            <div className={`rounded-xl overflow-hidden border ${isGlass
                                ? isDark ? 'border-emerald-400/20 bg-emerald-500/10' : 'border-emerald-400/30 bg-emerald-500/8'
                                : isDark ? 'border-emerald-900/60 bg-emerald-950/50' : 'border-emerald-200 bg-emerald-50'}`}>
                                <div className={`px-3 py-1.5 text-[11px] font-bold tracking-wide border-b ${isGlass
                                    ? isDark ? 'bg-emerald-500/15 border-emerald-400/20 text-emerald-400' : 'bg-emerald-500/10 border-emerald-400/20 text-emerald-700'
                                    : isDark ? 'bg-emerald-950/60 border-emerald-900/60 text-emerald-400' : 'bg-emerald-100 border-emerald-200 text-emerald-700'}`}>{t.layer2}</div>
                                <table className="w-full"><tbody>
                                    <FieldRow label={t.srcMac} value={currentInfo.srcMac} prevValue={prevInfo?.srcMac} highlight={macChanged ? 'changed' : 'none'} isDark={isDark} badge={macChanged ? t.changed : undefined} badgeColor="#d97706" />
                                    <FieldRow label={t.dstMac} value={currentInfo.dstMac} prevValue={prevInfo?.dstMac} highlight={macChanged ? 'changed' : 'none'} isDark={isDark} />
                                    <FieldRow label={t.etherType} value={currentInfo.etherType} isDark={isDark} />
                                </tbody></table>
                            </div>
                            <div className={`rounded-xl overflow-hidden border ${isGlass
                                ? isDark ? 'border-purple-400/20 bg-purple-500/10' : 'border-purple-400/30 bg-purple-500/8'
                                : isDark ? 'border-purple-900/60 bg-purple-950/50' : 'border-purple-200 bg-purple-50'}`}>
                                <div className={`px-3 py-1.5 text-[11px] font-bold tracking-wide border-b ${isGlass
                                    ? isDark ? 'bg-purple-500/15 border-purple-400/20 text-purple-400' : 'bg-purple-500/10 border-purple-400/20 text-purple-700'
                                    : isDark ? 'bg-purple-950/60 border-purple-900/60 text-purple-400' : 'bg-purple-100 border-purple-200 text-purple-700'}`}>{t.layer3}</div>
                                <table className="w-full"><tbody>
                                    <FieldRow label={t.srcIp} value={currentInfo.srcIp} highlight="same" isDark={isDark} />
                                    <FieldRow label={t.dstIp} value={currentInfo.dstIp} highlight="same" isDark={isDark} />
                                    <FieldRow label={t.ttl} value={String(currentInfo.ttl)} prevValue={prevInfo ? String(prevInfo.ttl) : undefined} highlight={ttlChanged ? 'changed' : 'none'} isDark={isDark} badge={ttlChanged ? t.ttlDec : undefined} badgeColor="#d97706" />
                                    <FieldRow label={t.protocol} value={currentInfo.protocol} isDark={isDark} />
                                </tbody></table>
                            </div>
                            <div className={`rounded-xl overflow-hidden border ${isGlass
                                ? isDark ? 'border-blue-400/20 bg-blue-500/10' : 'border-blue-400/30 bg-blue-500/8'
                                : isDark ? 'border-blue-900/60 bg-blue-950/50' : 'border-blue-200 bg-blue-50'}`}>
                                <div className={`px-3 py-1.5 text-[11px] font-bold tracking-wide border-b ${isGlass
                                    ? isDark ? 'bg-blue-500/15 border-blue-400/20 text-blue-400' : 'bg-blue-500/10 border-blue-400/20 text-blue-700'
                                    : isDark ? 'bg-blue-950/60 border-blue-900/60 text-blue-400' : 'bg-blue-100 border-blue-200 text-blue-700'}`}>{t.layer4}</div>
                                <table className="w-full"><tbody>
                                    <FieldRow label={t.icmpType} value={currentInfo.icmpType} isDark={isDark} />
                                    <FieldRow label={t.icmpCode} value={String(currentInfo.icmpCode)} isDark={isDark} />
                                    <FieldRow label={t.icmpSeq} value={String(currentInfo.icmpSeq)} isDark={isDark} />
                                </tbody></table>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={`px-5 py-8 text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t.noHops}</div>
            )}
        </div >
    );
}

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

    // Check if two devices are connected via wireless
    const isWirelessConnection = (fromId: string, toId: string): boolean => {
        const fromDev = devices.find(d => d.id === fromId);
        const toDev = devices.find(d => d.id === toId);

        if (!fromDev || !toDev) return false;

        // Check if connection exists in connections array
        const conn = connections.find(c =>
            (c.sourceDeviceId === fromId && c.targetDeviceId === toId) ||
            (c.sourceDeviceId === toId && c.targetDeviceId === fromId)
        );

        // If there's an explicit connection, use its cableType
        if (conn) {
            return conn.cableType === 'wireless';
        }

        // If no connection in array, check if it could be wireless
        // Only PC/IoT can connect wirelessly to Router/Switch
        const isFromClient = fromDev.type === 'pc' || fromDev.type === 'iot';
        const isToAP = toDev.type === 'router' || toDev.type.startsWith('switch');
        const isToClient = toDev.type === 'pc' || toDev.type === 'iot';
        const isFromAP = fromDev.type === 'router' || fromDev.type.startsWith('switch');

        // Wireless: PC/IoT -> Router/Switch or Router/Switch -> PC/IoT
        if ((isFromClient && isToAP) || (isFromAP && isToClient)) {
            return true;
        }

        return false;
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

        const cableType = conn?.cableType || (isWirelessConnection(path[i], path[i + 1]) ? 'wireless' : 'straight');

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
