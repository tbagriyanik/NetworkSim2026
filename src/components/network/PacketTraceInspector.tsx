import React, { useState } from 'react';
import { PipelineResult, PacketTrace, HopResult } from '@/lib/network/forwarding/packetPipeline';
import { getDropReasonDetail } from '@/lib/network/forwarding/dropReasons';

interface PacketTraceInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  pipelineResult: PipelineResult | null;
  onSelectHop?: (deviceId: string) => void;
}

export const PacketTraceInspector: React.FC<PacketTraceInspectorProps> = ({
  isOpen,
  onClose,
  pipelineResult,
  onSelectHop,
}) => {
  const [activeHopIndex, setActiveHopIndex] = useState<number>(0);
  const [activeStageIndex, setActiveStageIndex] = useState<number | null>(null);

  if (!isOpen || !pipelineResult) return null;

  const { hopResults, success, dropReason } = pipelineResult;
  const activeHop: HopResult | undefined = hopResults[activeHopIndex];
  const hopTraces = activeHop?.traces || [];

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'pass':
      case 'forward':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'drop':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'flood':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'trap':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case 'skip':
      default:
        return 'bg-slate-700/40 text-slate-400 border-slate-600/40';
    }
  };

  const activeTrace: PacketTrace | undefined =
    activeStageIndex !== null ? hopTraces[activeStageIndex] : hopTraces[hopTraces.length - 1];

  const parsedDrop = dropReason ? getDropReasonDetail(dropReason) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${success ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 animate-pulse'}`} />
            <div>
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                Canlı Paket İzleme & Forwarding Teşhisi (Packet Trace)
              </h2>
              <p className="text-xs text-slate-400">
                {success
                  ? 'Paket hedef düğüme başarıyla ulaştı'
                  : `Paket akışı kesintiye uğradı: ${dropReason || 'Drop detected'}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition"
          >
            Kapat (ESC)
          </button>
        </div>

        {/* Drop Highlight Banner if failed */}
        {!success && parsedDrop && (
          <div className="bg-rose-950/60 border-b border-rose-800/60 px-6 py-3 flex items-start gap-3 text-rose-200 text-xs">
            <span className="px-2 py-0.5 rounded bg-rose-900/80 border border-rose-700 font-mono font-bold text-[10px]">
              {parsedDrop.category} DROP
            </span>
            <div>
              <div className="font-semibold text-rose-100">{parsedDrop.title}</div>
              <div>{parsedDrop.description}</div>
              {parsedDrop.suggestedFix && (
                <div className="mt-1 text-rose-300/80 italic">💡 Öneri: {parsedDrop.suggestedFix}</div>
              )}
            </div>
          </div>
        )}

        {/* Main Content Layout */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {/* Hop Stepper Navigation (Left Panel) */}
          <div className="md:col-span-4 p-4 bg-slate-900/50 overflow-y-auto space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Sekans & Düğüm Sekansı (Hops)
            </div>
            {hopResults.map((hop, idx) => {
              const hasDrop = hop.traces.some(t => t.action === 'drop');
              const isSelected = idx === activeHopIndex;
              return (
                <button
                  key={`${hop.deviceId}-${idx}`}
                  onClick={() => {
                    setActiveHopIndex(idx);
                    setActiveStageIndex(null);
                    if (onSelectHop) onSelectHop(hop.deviceId);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-sky-950/60 border-sky-500/80 text-sky-100 shadow-md'
                      : hasDrop
                      ? 'bg-rose-950/30 border-rose-800/50 text-rose-200 hover:bg-rose-900/40'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-300">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-sm font-medium">{hop.deviceId}</div>
                      <div className="text-[11px] opacity-70">
                        {hop.egressPorts.length > 0
                          ? `Çıkış: ${hop.egressPorts.join(', ')}`
                          : hasDrop
                          ? 'Düşürüldü'
                          : 'Hedef alındı'}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border uppercase font-mono ${
                      hasDrop
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {hasDrop ? 'DROP' : 'PASS'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Pipeline Stage Inspector (Right Panel) */}
          <div className="md:col-span-8 p-6 overflow-y-auto flex flex-col gap-6">
            {activeHop ? (
              <>
                {/* Hop Stage Timeline */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    {activeHop.deviceId} — Pipeline Aşama Kararları
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {hopTraces.map((trace, sIdx) => {
                      const isStageSelected = activeStageIndex === sIdx;
                      return (
                        <button
                          key={`${trace.stage}-${sIdx}`}
                          onClick={() => setActiveStageIndex(sIdx)}
                          className={`p-2.5 rounded-lg border text-left transition ${
                            isStageSelected
                              ? 'border-sky-400 bg-sky-950/40 ring-1 ring-sky-400/50'
                              : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                            <span className="text-slate-300 font-semibold">{trace.stage}</span>
                            <span className={`px-1.5 py-0.2 rounded border uppercase font-mono text-[9px] ${getActionBadgeClass(trace.action)}`}>
                              {trace.action}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{trace.reason}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Stage Detail & Frame Header Inspector */}
                {activeTrace && (
                  <div className="space-y-4 pt-2 border-t border-slate-800">
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-sky-400 uppercase font-mono tracking-wide">
                          Aşama Detayı: {activeTrace.stage}
                        </span>
                        <span className={`px-2 py-0.5 rounded border text-xs font-mono uppercase ${getActionBadgeClass(activeTrace.action)}`}>
                          Eylem: {activeTrace.action}
                        </span>
                      </div>
                      <p className="text-sm text-slate-200 font-medium bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        {activeTrace.reason}
                      </p>
                    </div>

                    {/* Frame Snapshot Header */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                      <div className="text-xs font-semibold text-slate-400 uppercase font-mono mb-3">
                        Paket Başlık Bilgisi (Frame Header Snapshot)
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                          <span className="text-slate-500 block text-[10px] uppercase">Kaynak MAC</span>
                          <span className="font-mono text-slate-200 font-semibold">{activeTrace.frameSnapshot.srcMac || '—'}</span>
                        </div>
                        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                          <span className="text-slate-500 block text-[10px] uppercase">Hedef MAC</span>
                          <span className="font-mono text-slate-200 font-semibold">{activeTrace.frameSnapshot.dstMac || '—'}</span>
                        </div>
                        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                          <span className="text-slate-500 block text-[10px] uppercase">Kaynak IP</span>
                          <span className="font-mono text-sky-300 font-semibold">{activeTrace.frameSnapshot.srcIp || '—'}</span>
                        </div>
                        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                          <span className="text-slate-500 block text-[10px] uppercase">Hedef IP</span>
                          <span className="font-mono text-sky-300 font-semibold">{activeTrace.frameSnapshot.dstIp || '—'}</span>
                        </div>
                        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                          <span className="text-slate-500 block text-[10px] uppercase">Protokol</span>
                          <span className="font-mono text-amber-300 font-semibold">{activeTrace.frameSnapshot.protocol}</span>
                        </div>
                        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                          <span className="text-slate-500 block text-[10px] uppercase">TTL</span>
                          <span className="font-mono text-emerald-300 font-semibold">{activeTrace.frameSnapshot.ttl ?? 64}</span>
                        </div>
                        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                          <span className="text-slate-500 block text-[10px] uppercase">VLAN ID</span>
                          <span className="font-mono text-purple-300 font-semibold">{activeTrace.frameSnapshot.vlanId || 1}</span>
                        </div>
                        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                          <span className="text-slate-500 block text-[10px] uppercase">Giriş Portu</span>
                          <span className="font-mono text-slate-300 font-semibold">{activeTrace.portId || 'Local'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-slate-500 text-sm">Hop seçilmedi</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
