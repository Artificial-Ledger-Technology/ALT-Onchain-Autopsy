import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { ChainType, VulnerabilityCategory } from '../types/incident';

interface IncidentFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedChain: ChainType | 'all';
  onChainChange: (chain: ChainType | 'all') => void;
  selectedCategory: VulnerabilityCategory | 'all';
  onCategoryChange: (category: VulnerabilityCategory | 'all') => void;
  sortBy: 'loss-desc' | 'date-desc';
  onSortChange: (sort: 'loss-desc' | 'date-desc') => void;
  totalCount: number;
  filteredCount: number;
}

export const IncidentFilters: React.FC<IncidentFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedChain,
  onChainChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  totalCount,
  filteredCount
}) => {
  const chains: { id: ChainType | 'all'; label: string }[] = [
    { id: 'all', label: 'All Ecosystems' },
    { id: 'solana', label: 'Solana (Rust)' },
    { id: 'ethereum', label: 'Ethereum (EVM)' },
    { id: 'cross-chain', label: 'Cross-Chain Bridges' },
    { id: 'move', label: 'Move (Aptos/Sui)' }
  ];

  const categories: { id: VulnerabilityCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All Vectors' },
    { id: 'oracle-manipulation', label: 'Oracle & Price Manipulation' },
    { id: 'signature-verification', label: 'Signature / Sysvar Bypass' },
    { id: 'logic-flaw', label: 'Logic & Invariant Flaw' },
    { id: 'bridge-relayer', label: 'Bridge & Uninitialized Root' }
  ];

  return (
    <div className="space-y-4">
      {/* Top Search & Sort Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search protocol, root cause, token symbol, or transaction hash..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-900/90 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
          />
        </div>

        {/* Sort & Count */}
        <div className="flex items-center gap-3 justify-between sm:justify-end">
          <div className="text-xs text-slate-400 font-mono">
            Showing <span className="text-white font-semibold">{filteredCount}</span> of {totalCount} autopsies
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            <button
              onClick={() => onSortChange('loss-desc')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                sortBy === 'loss-desc'
                  ? 'bg-slate-800 text-cyan-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Highest Loss
            </button>
            <button
              onClick={() => onSortChange('date-desc')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                sortBy === 'date-desc'
                  ? 'bg-slate-800 text-cyan-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Most Recent
            </button>
          </div>
        </div>
      </div>

      {/* Filter Row: Chains & Vectors */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 border-t border-slate-900">
        {/* Chains Segmented Control */}
        <div className="flex flex-wrap items-center gap-1.5">
          {chains.map((chain) => (
            <button
              key={chain.id}
              onClick={() => onChainChange(chain.id)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap ${
                selectedChain === chain.id
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 font-semibold'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {chain.label}
            </button>
          ))}
        </div>

        {/* Categories Dropdown / Pill selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 whitespace-nowrap">Vector:</span>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value as VulnerabilityCategory | 'all')}
            className="text-xs bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
