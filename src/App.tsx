import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { IncidentFilters } from './components/IncidentFilters';
import { IncidentList } from './components/IncidentList';
import { IncidentDetail } from './components/IncidentDetail';
import { RustEngineSpecs } from './components/RustEngineSpecs';
import { NewIncidentModal } from './components/NewIncidentModal';
import { INITIAL_INCIDENTS } from './data/incidents';
import { Incident, ChainType, VulnerabilityCategory } from './types/incident';
import { ShieldCheck, Database, DollarSign, Activity } from 'lucide-react';

export default function App() {
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(INITIAL_INCIDENTS[0].id);
  const [activeView, setActiveView] = useState<'catalog' | 'detail' | 'rust-specs'>('detail');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedChain, setSelectedChain] = useState<ChainType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<VulnerabilityCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'loss-desc' | 'date-desc'>('loss-desc');
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);

  // Filtered & Sorted Incidents
  const filteredIncidents = useMemo(() => {
    return incidents
      .filter((inc) => {
        if (selectedChain !== 'all' && inc.chain !== selectedChain) return false;
        if (selectedCategory !== 'all' && inc.vulnerabilityType !== selectedCategory) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = inc.title.toLowerCase().includes(q);
          const matchProtocol = inc.protocol.toLowerCase().includes(q);
          const matchSummary = inc.summary.toLowerCase().includes(q);
          const matchCause = inc.rootCause.toLowerCase().includes(q);
          const matchTx = inc.exploitTxHash.toLowerCase().includes(q);
          if (!matchTitle && !matchProtocol && !matchSummary && !matchCause && !matchTx) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'loss-desc') {
          return b.lossUsd - a.lossUsd;
        } else {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
      });
  }, [incidents, selectedChain, selectedCategory, searchQuery, sortBy]);

  const selectedIncident = useMemo(() => {
    return incidents.find((i) => i.id === selectedIncidentId) || incidents[0] || null;
  }, [incidents, selectedIncidentId]);

  const handleSelectIncident = (id: string) => {
    setSelectedIncidentId(id);
    setActiveView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateIncident = (newIncident: Incident) => {
    setIncidents([newIncident, ...incidents]);
    setSelectedIncidentId(newIncident.id);
    setActiveView('detail');
  };

  // Aggregated Metrics
  const totalLoss = useMemo(() => {
    return incidents.reduce((sum, item) => sum + item.lossUsd, 0);
  }, [incidents]);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 3-Zone Sticky Navigation Bar */}
      <Header
        activeView={activeView}
        onNavigate={setActiveView}
        onOpenNewIncident={() => setIsNewModalOpen(true)}
        hasSelectedIncident={!!selectedIncident}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* VIEW 1: CATALOG VIEW */}
        {activeView === 'catalog' && (
          <div className="space-y-6">
            {/* KPI Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
              <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-1">
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-red-400" />
                  Indexed Exploit Losses
                </span>
                <div className="text-lg sm:text-xl font-bold font-mono text-red-400 tabular-nums">
                  ${(totalLoss / 1000000).toFixed(1)}M USD
                </div>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-1">
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  Detailed Autopsies
                </span>
                <div className="text-lg sm:text-xl font-bold font-mono text-white tabular-nums">
                  {incidents.length} Records
                </div>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-1">
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Chains Covered
                </span>
                <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400">
                  Solana · EVM · Move
                </div>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-1">
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  Rust Invariant Engine
                </span>
                <div className="text-lg sm:text-xl font-bold font-mono text-cyan-400">
                  WASM v0.4.2
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <IncidentFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedChain={selectedChain}
              onChainChange={setSelectedChain}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              sortBy={sortBy}
              onSortChange={setSortBy}
              totalCount={incidents.length}
              filteredCount={filteredIncidents.length}
            />

            {/* Incident Cards */}
            <IncidentList
              incidents={filteredIncidents}
              selectedIncidentId={selectedIncidentId}
              onSelectIncident={handleSelectIncident}
            />
          </div>
        )}

        {/* VIEW 2: ACTIVE AUTOPSY WORKBENCH */}
        {activeView === 'detail' && selectedIncident && (
          <IncidentDetail
            incident={selectedIncident}
            onBack={() => setActiveView('catalog')}
          />
        )}

        {/* VIEW 3: RUST WASM CRATE SPECS */}
        {activeView === 'rust-specs' && <RustEngineSpecs />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-6 px-6 bg-[#0B0F17] text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-semibold font-sans">ALT-Onchain-Autopsy</span>
            <span>·</span>
            <span>Blockchain Incident Post-Mortem Repository & Rust WebAssembly Analyzer</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Deterministic Invariant Sandbox</span>
            <span>·</span>
            <span>Open Source Security Standard</span>
          </div>
        </div>
      </footer>

      {/* Create Autopsy Modal */}
      <NewIncidentModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSubmit={handleCreateIncident}
      />
    </div>
  );
}
