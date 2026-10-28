import React from 'react';
import { ChevronRight, GitFork, AlertTriangle, Layers } from 'lucide-react';
import { Incident } from '../types/incident';

interface IncidentListProps {
  incidents: Incident[];
  selectedIncidentId: string | null;
  onSelectIncident: (id: string) => void;
}

export const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  selectedIncidentId,
  onSelectIncident
}) => {
  if (incidents.length === 0) {
    return (
      <div className="text-center py-16 px-4 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
        <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-300">No autopsies match your filters</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          Try expanding your search query or selecting a different blockchain ecosystem.
        </p>
      </div>
    );
  }

  const getChainBadge = (chain: Incident['chain']) => {
    switch (chain) {
      case 'solana':
        return 'Solana';
      case 'ethereum':
        return 'Ethereum';
      case 'cross-chain':
        return 'Cross-Chain';
      case 'move':
        return 'Move';
      default:
        return chain;
    }
  };

  const formatUsd = (amount: number) => {
    return `$${amount.toLocaleString()} USD`;
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {incidents.map((incident) => {
        const isSelected = incident.id === selectedIncidentId;

        return (
          <div
            key={incident.id}
            onClick={() => onSelectIncident(incident.id)}
            className={`group relative p-5 rounded-xl border transition-all cursor-pointer ${
              isSelected
                ? 'bg-slate-900 border-cyan-500/80 shadow-md ring-1 ring-cyan-500/20'
                : 'bg-slate-900/70 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left Column: Title & Root Cause */}
              <div className="flex-1 min-w-0 space-y-2">
                {/* Clean Unboxed Metadata with Typographic Separator */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                  <span className="text-cyan-400 font-semibold">{incident.protocol}</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="text-slate-300">{getChainBadge(incident.chain)}</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span>{incident.date}</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="text-slate-400 capitalize">{incident.vulnerabilityType.replace('-', ' ')}</span>
                </div>

                {/* Primary Title */}
                <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors tracking-tight font-sans">
                  {incident.title}
                </h3>

                {/* Root Cause Snip */}
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {incident.summary}
                </p>

                {/* Key Technical Trace Indicators */}
                <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    {incident.timeline.length} Trace Steps
                  </span>
                  <span aria-hidden="true" className="text-slate-700">·</span>
                  <span className="flex items-center gap-1">
                    <GitFork className="w-3.5 h-3.5 text-slate-400" />
                    {incident.codeDiff.language.toUpperCase()} Invariant Diff
                  </span>
                  <span aria-hidden="true" className="text-slate-700">·</span>
                  <span className="truncate max-w-[220px]" title={incident.exploitTxHash}>
                    Tx: {incident.exploitTxHash.slice(0, 10)}...
                  </span>
                </div>
              </div>

              {/* Right Column: Financial Loss & Action */}
              <div className="flex items-center justify-between lg:flex-col lg:items-end lg:justify-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800/80 shrink-0">
                <div className="text-left lg:text-right">
                  <div className="text-[11px] text-slate-500 font-mono uppercase tracking-wider">
                    Total Loss Drain
                  </div>
                  <div className="text-lg font-bold font-mono text-red-400 tabular-nums tracking-tight">
                    {formatUsd(incident.lossUsd)}
                  </div>
                  {incident.recoveredUsd > 0 && (
                    <div className="text-[11px] font-mono text-emerald-400 tabular-nums">
                      +${incident.recoveredUsd.toLocaleString()} recovered
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 rounded-lg transition-colors whitespace-nowrap"
                >
                  <span>Inspect Autopsy</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
