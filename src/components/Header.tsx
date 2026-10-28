import React from 'react';
import { ShieldAlert, Terminal, Plus, FileDown } from 'lucide-react';

interface HeaderProps {
  activeView: 'catalog' | 'detail' | 'rust-specs';
  onNavigate: (view: 'catalog' | 'detail' | 'rust-specs') => void;
  onOpenNewIncident: () => void;
  onExportReport?: () => void;
  hasSelectedIncident: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onNavigate,
  onOpenNewIncident,
  onExportReport,
  hasSelectedIncident
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-[#0B0F17]/90 backdrop-blur-md border-b border-slate-800">
      {/* Zone 1: Single text element wordmark */}
      <button
        onClick={() => onNavigate('catalog')}
        className="flex items-center gap-2.5 text-left group focus:outline-none"
      >
        <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition-colors">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-white whitespace-nowrap font-sans">
            ALT-Onchain-Autopsy
          </span>
          <span className="text-[11px] text-slate-400 tracking-wide font-mono -mt-0.5">
            Rust WASM Forensic Repository
          </span>
        </div>
      </button>

      {/* Zone 2: 4 concise single-line navigation links */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
        <button
          onClick={() => onNavigate('catalog')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
            activeView === 'catalog' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Incident Catalog
        </button>

        {hasSelectedIncident && (
          <button
            onClick={() => onNavigate('detail')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeView === 'detail' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Active Autopsy Workbench
          </button>
        )}

        <button
          onClick={() => onNavigate('rust-specs')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 hover:text-white ${
            activeView === 'rust-specs' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-slate-400" />
          Rust Core Crate
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        {activeView === 'detail' && onExportReport ? (
          <button
            onClick={onExportReport}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            <FileDown className="w-3.5 h-3.5 text-cyan-400" />
            Export Markdown
          </button>
        ) : (
          <button
            onClick={onOpenNewIncident}
            className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:ring-2 focus-visible:ring-cyan-300 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            Submit Autopsy
          </button>
        )}
      </div>
    </header>
  );
};
