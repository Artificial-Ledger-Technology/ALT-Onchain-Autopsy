import React, { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { Incident, ChainType, VulnerabilityCategory } from '../types/incident';

interface NewIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (incident: Incident) => void;
}

export const NewIncidentModal: React.FC<NewIncidentModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [title, setTitle] = useState('');
  const [protocol, setProtocol] = useState('');
  const [chain, setChain] = useState<ChainType>('solana');
  const [lossUsd, setLossUsd] = useState('');
  const [vulnerabilityType, setVulnerabilityType] = useState<VulnerabilityCategory>('oracle-manipulation');
  const [summary, setSummary] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [attackerAddress, setAttackerAddress] = useState('');
  const [txHash, setTxHash] = useState('');
  const [vulnerableCode, setVulnerableCode] = useState('');
  const [patchedCode, setPatchedCode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !protocol.trim() || !lossUsd || !summary.trim() || !rootCause.trim()) {
      setError('Please fill in all required fields (Title, Protocol, Loss, Summary, and Root Cause).');
      return;
    }

    const lossNum = parseFloat(lossUsd.replace(/[^0-9.]/g, ''));
    if (isNaN(lossNum) || lossNum <= 0) {
      setError('Please provide a valid financial loss amount.');
      return;
    }

    const newIncident: Incident = {
      id: `custom-${Date.now()}`,
      slug: protocol.toLowerCase().replace(/\s+/g, '-') + '-autopsy',
      title,
      protocol,
      chain,
      date: new Date().toISOString().split('T')[0],
      lossUsd: lossNum,
      recoveredUsd: 0,
      vulnerabilityType,
      severity: 'Critical',
      summary,
      rootCause,
      attackerAddress: attackerAddress.trim() || '0xAttacker...e8f1',
      victimVaultAddress: '0xProtocolVault...90a2',
      exploitTxHash: txHash.trim() || '0x498a...23ef890c',
      blockNumberOrSlot: Math.floor(Math.random() * 50000000) + 10000000,
      keyLessons: [
        'Perform static analysis and formal invariant checking before deployment.',
        'Never trust unverified runtime account addresses or unconstrained sysvars.',
        'Implement circuit-breaker thresholds on rapid value outflows.'
      ],
      timeline: [
        {
          step: 1,
          depth: 0,
          caller: attackerAddress.trim() || 'Attacker',
          target: `${protocol}Proxy`,
          programOrContract: `${protocol} Core`,
          methodOrInstruction: 'execute_exploit_vector',
          callType: chain === 'solana' ? 'CPI' : 'CALL',
          gasOrComputeUnits: 154000,
          isExploitPoint: true,
          exploitDetail: rootCause,
          balanceChanges: [
            {
              account: attackerAddress.trim() || 'Attacker Wallet',
              label: 'Attacker Account',
              token: 'USDC / Native',
              symbol: 'USD',
              delta: lossNum,
              postBalance: lossNum,
              isAttacker: true
            },
            {
              account: 'Vault',
              label: `${protocol} Liquidity Vault`,
              token: 'USDC / Native',
              symbol: 'USD',
              delta: -lossNum,
              postBalance: 0,
              isAttacker: false
            }
          ],
          rawCalldataOrInstruction: `Instruction::Invoke { protocol: "${protocol}", loss: ${lossNum} }`,
          stateDiffDesc: 'Exploit transaction executed. Attacker drained protocol vault.',
          invariantAssertion: {
            name: 'Vault Solvency & Invariant Gate',
            expression: 'post_balance >= pre_balance - max_allowable_outflow',
            description: 'Ensure balance outflows satisfy invariant constraints.',
            vulnerableEvaluation: 'VIOLATED',
            patchedEvaluation: 'REVERTED_EARLY',
            revertReason: `${protocol}: InvariantViolation`
          }
        }
      ],
      codeDiff: {
        language: chain === 'solana' ? 'rust' : chain === 'move' ? 'move' : 'solidity',
        fileName: `${protocol.toLowerCase()}/src/vault.rs`,
        vulnerableCode:
          vulnerableCode.trim() ||
          `// Vulnerable snippet
pub fn process_withdrawal(amount: u64) -> Result<()> {
    // Missing strict invariant balance assertion!
    transfer_funds(amount);
    Ok(())
}`,
        patchedCode:
          patchedCode.trim() ||
          `// Hardened patch
pub fn process_withdrawal(amount: u64) -> Result<()> {
    require!(amount <= MAX_OUTFLOW, ErrorCode::ExceededLimit);
    transfer_funds(amount);
    Ok(())
}`,
        invariantExplanation: 'Enforces invariant checks to prevent unauthorized state transitions and drains.'
      },
      pocHarness: {
        language: chain === 'solana' ? 'rust' : 'solidity',
        framework: chain === 'solana' ? 'Anchor / Solana-Program-Test' : 'Foundry Forge',
        code: `// Test case replicating ${protocol} vulnerability
#[test]
fn test_${protocol.toLowerCase().replace(/[^a-z0-9]/g, '_')}_exploit() {
    // Verified by ALT-Onchain-Autopsy WASM engine
}`,
        instructions: 'Run reproduction test suite in local sandbox environment.'
      },
      rustEngineSpec: {
        moduleName: `alt_autopsy_core::${chain}::${protocol.toLowerCase()}`,
        signature: 'pub fn evaluate_trace(steps: &[TraceStep], patch: bool) -> AutopsyResult',
        rustCode: '// Rust evaluation routine'
      }
    };

    onSubmit(newIncident);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white font-sans">
              Submit Incident Autopsy
            </h3>
            <p className="text-xs text-slate-400">
              Contribute a multi-chain on-chain exploit post-mortem to the autopsy repository.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Protocol Name *
              </label>
              <input
                type="text"
                required
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
                placeholder="e.g. Orbit Bridge"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Target Ecosystem *
              </label>
              <select
                value={chain}
                onChange={(e) => setChain(e.target.value as ChainType)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="solana">Solana (Rust / Anchor)</option>
                <option value="ethereum">Ethereum (EVM / Solidity)</option>
                <option value="cross-chain">Cross-Chain Bridge</option>
                <option value="move">Move (Aptos / Sui)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              Autopsy Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Orbit Bridge Multisig Validator Key Compromise & Cross-Drain"
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Financial Loss ($ USD) *
              </label>
              <input
                type="text"
                required
                value={lossUsd}
                onChange={(e) => setLossUsd(e.target.value)}
                placeholder="e.g. 81500000"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Vulnerability Class *
              </label>
              <select
                value={vulnerabilityType}
                onChange={(e) => setVulnerabilityType(e.target.value as VulnerabilityCategory)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="oracle-manipulation">Oracle Manipulation</option>
                <option value="signature-verification">Signature / Sysvar Bypass</option>
                <option value="logic-flaw">Logic & State Invariant Error</option>
                <option value="bridge-relayer">Bridge Relayer Flaw</option>
                <option value="access-control">Access Control</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              Executive Summary *
            </label>
            <textarea
              required
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief summary of what happened and how the attacker executed the drain..."
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              Technical Root Cause *
            </label>
            <textarea
              required
              rows={2}
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="Underlying code flaw (e.g. missing authority assertion, unchecked rounding)..."
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Attacker Address
              </label>
              <input
                type="text"
                value={attackerAddress}
                onChange={(e) => setAttackerAddress(e.target.value)}
                placeholder="0x... or Base58 pubkey"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Exploit Tx Hash
              </label>
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="Transaction Hash"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Publish to Autopsy Repository</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
