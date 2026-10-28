import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  ShieldCheck,
  AlertOctagon,
  Copy,
  Check,
  Cpu,
  Layers,
  FileText,
  Code2,
  Terminal,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { Incident } from '../types/incident';
import { AltAutopsyWasmEngine, EvaluationResult } from '../engine/rustWasmSimulator';

interface IncidentDetailProps {
  incident: Incident;
  onBack: () => void;
}

export const IncidentDetail: React.FC<IncidentDetailProps> = ({ incident, onBack }) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'sandbox' | 'report' | 'poc'>('timeline');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [patchEnabled, setPatchEnabled] = useState<boolean>(false);
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  const [copiedTx, setCopiedTx] = useState<boolean>(false);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [copiedPoc, setCopiedPoc] = useState<boolean>(false);

  // Auto-play timeline stepper
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= incident.timeline.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2200);
    }
    return () => clearInterval(interval);
  }, [isPlaying, incident.timeline.length]);

  // Re-run evaluation whenever patch state or incident changes
  useEffect(() => {
    const res = AltAutopsyWasmEngine.evaluateTrace(incident, patchEnabled, currentStepIndex);
    setEvalResult(res);
  }, [incident, patchEnabled, currentStepIndex]);

  const currentStep = incident.timeline[currentStepIndex] || incident.timeline[0];
  const accumulatedBalances = AltAutopsyWasmEngine.getAccumulatedBalances(
    incident.timeline,
    currentStepIndex
  );

  const handleCopy = (text: string, type: 'tx' | 'report' | 'poc') => {
    navigator.clipboard.writeText(text);
    if (type === 'tx') {
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    } else if (type === 'report') {
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    } else {
      setCopiedPoc(true);
      setTimeout(() => setCopiedPoc(false), 2000);
    }
  };

  const handleDownloadReport = () => {
    const markdown = AltAutopsyWasmEngine.generateMarkdownReport(incident);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${incident.slug}-post-mortem.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors w-fit focus:outline-none"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incident Catalog</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="text-slate-500">Chain:</span>
          <span className="text-white uppercase">{incident.chain}</span>
          <span className="text-slate-700">·</span>
          <span className="text-slate-500">Block / Slot:</span>
          <span className="text-cyan-400">{incident.blockNumberOrSlot.toLocaleString()}</span>
        </div>
      </div>

      {/* Incident Header Dossier */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
              <span className="text-cyan-400 font-bold">{incident.protocol}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>{incident.date}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="capitalize">{incident.vulnerabilityType.replace('-', ' ')}</span>
            </div>

            <h1 className="text-2xl font-bold text-white tracking-tight font-sans">
              {incident.title}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
              {incident.summary}
            </p>
          </div>

          {/* Impact Gauge */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between p-4 bg-slate-950/70 border border-slate-800 rounded-lg shrink-0 min-w-[220px]">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
              Exploited Liquidity
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-red-400 tabular-nums">
              ${incident.lossUsd.toLocaleString()}
            </div>
            {incident.recoveredUsd > 0 && (
              <span className="text-xs font-mono text-emerald-400">
                ${incident.recoveredUsd.toLocaleString()} Recovered
              </span>
            )}
          </div>
        </div>

        {/* Technical Key-Value Reference Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 text-xs font-mono">
          <div className="flex items-center justify-between p-2.5 bg-slate-950/50 rounded border border-slate-800/60">
            <span className="text-slate-500">Tx Hash:</span>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="truncate max-w-[120px]">{incident.exploitTxHash}</span>
              <button
                onClick={() => handleCopy(incident.exploitTxHash, 'tx')}
                className="text-slate-500 hover:text-cyan-400 transition-colors"
                title="Copy Transaction Hash"
              >
                {copiedTx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-950/50 rounded border border-slate-800/60">
            <span className="text-slate-500">Attacker:</span>
            <span className="text-slate-300 truncate max-w-[140px]" title={incident.attackerAddress}>
              {incident.attackerAddress}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-950/50 rounded border border-slate-800/60">
            <span className="text-slate-500">Target Vault:</span>
            <span className="text-slate-300 truncate max-w-[140px]" title={incident.victimVaultAddress}>
              {incident.victimVaultAddress}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'timeline'
              ? 'bg-slate-800 text-cyan-400 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Call Trace Timeline ({incident.timeline.length} Steps)</span>
        </button>

        <button
          onClick={() => setActiveTab('sandbox')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'sandbox'
              ? 'bg-slate-800 text-cyan-400 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Rust Invariant Sandbox & Code Diff</span>
        </button>

        <button
          onClick={() => setActiveTab('report')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'report'
              ? 'bg-slate-800 text-cyan-400 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Executive Autopsy Report</span>
        </button>

        <button
          onClick={() => setActiveTab('poc')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'poc'
              ? 'bg-slate-800 text-cyan-400 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>PoC Test Harness ({incident.pocHarness.framework})</span>
        </button>
      </div>

      {/* TAB 1: VISUAL TIMELINE & CALL TRACE */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {/* Timeline Playback Controller */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentStepIndex(0)}
                    disabled={currentStepIndex === 0}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                    title="Reset to Step 1"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentStepIndex === 0}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                    title="Previous Step"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span>{isPlaying ? 'Pause' : 'Play Trace'}</span>
                  </button>

                  <button
                    onClick={() => setCurrentStepIndex((prev) => Math.min(incident.timeline.length - 1, prev + 1))}
                    disabled={currentStepIndex === incident.timeline.length - 1}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                    title="Next Step"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs font-mono text-slate-300">
                  Step <span className="text-cyan-400 font-bold">{currentStep.step}</span> of {incident.timeline.length}:{' '}
                  <span className="text-white font-semibold">{currentStep.methodOrInstruction}</span>
                </div>
              </div>

              {/* Exploit Vector Badge */}
              <div className="flex items-center gap-2">
                {currentStep.isExploitPoint ? (
                  <span className="flex items-center gap-1.5 text-xs font-mono text-red-400 bg-red-950/60 px-2.5 py-1 rounded border border-red-800">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    Vulnerability Inflection Point
                  </span>
                ) : (
                  <span className="text-xs font-mono text-slate-400">
                    Execution Status: Nominal Call
                  </span>
                )}
              </div>
            </div>

            {/* Interactive Timeline Track / Scrubber */}
            <div className="relative pt-2">
              <div className="h-1.5 bg-slate-800 rounded-full w-full relative">
                <div
                  className="h-1.5 bg-cyan-400 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentStepIndex + 1) / incident.timeline.length) * 100}%`
                  }}
                />
              </div>

              {/* Step Markers */}
              <div className="flex justify-between items-center mt-2">
                {incident.timeline.map((st, idx) => {
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <button
                      key={st.step}
                      onClick={() => {
                        setIsPlaying(false);
                        setCurrentStepIndex(idx);
                      }}
                      className="group flex flex-col items-center focus:outline-none"
                    >
                      <div
                        className={`w-3 h-3 rounded-full transition-all ${
                          isCurrent
                            ? 'ring-4 ring-cyan-500/30 bg-cyan-400 scale-125'
                            : st.isExploitPoint
                            ? 'bg-red-500 ring-2 ring-red-500/20'
                            : idx < currentStepIndex
                            ? 'bg-cyan-700'
                            : 'bg-slate-700 group-hover:bg-slate-500'
                        }`}
                      />
                      <span
                        className={`text-[10px] font-mono mt-1 ${
                          isCurrent ? 'text-cyan-400 font-bold' : 'text-slate-500'
                        }`}
                      >
                        S{st.step}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dual-Column Work Area: Call Tree on Left, Balance Delta on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Recursive Call Trace Tree */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Invocation Call Stack & Instructions
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  Select any frame to inspect state
                </span>
              </div>

              <div className="space-y-2">
                {incident.timeline.map((step, idx) => {
                  const isCurrent = idx === currentStepIndex;
                  const indentPx = step.depth * 24;

                  return (
                    <div
                      key={step.step}
                      onClick={() => {
                        setIsPlaying(false);
                        setCurrentStepIndex(idx);
                      }}
                      style={{ marginLeft: `${indentPx}px` }}
                      className={`p-3.5 rounded-lg border transition-all cursor-pointer font-mono text-xs ${
                        isCurrent
                          ? 'bg-slate-800/90 border-cyan-400/80 shadow-md ring-1 ring-cyan-400/20'
                          : step.isExploitPoint
                          ? 'bg-red-950/20 border-red-900/60 hover:border-red-700'
                          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] ${
                              isCurrent
                                ? 'bg-cyan-500 text-slate-900'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {step.step}
                          </span>

                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-950 border border-slate-800 text-cyan-300">
                            {step.callType}
                          </span>

                          <span className="text-white font-semibold truncate">
                            {step.programOrContract}::{step.methodOrInstruction}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {step.isExploitPoint && (
                            <span className="text-[10px] text-red-400 font-semibold uppercase tracking-wider">
                              Vulnerable
                            </span>
                          )}
                          <span className="text-slate-500 text-[11px] tabular-nums">
                            {step.gasOrComputeUnits.toLocaleString()} {incident.chain === 'solana' ? 'CU' : 'Gas'}
                          </span>
                        </div>
                      </div>

                      {/* Caller and Target Line */}
                      <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
                        <span className="text-slate-500">From:</span>
                        <span className="text-slate-300 truncate max-w-[120px]">{step.caller}</span>
                        <span className="text-slate-600">→</span>
                        <span className="text-slate-500">To:</span>
                        <span className="text-slate-300 truncate max-w-[120px]">{step.target}</span>
                      </div>

                      {/* Exploit details note if present */}
                      {step.exploitDetail && isCurrent && (
                        <div className="mt-2.5 p-2 bg-red-950/50 border border-red-900/70 rounded text-[11px] text-red-200 font-sans leading-relaxed">
                          <strong>Exploit Root Note:</strong> {step.exploitDetail}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Raw Instruction Calldata Inspector */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    Decoded Payload (Step {currentStep.step})
                  </span>
                  <span>Format: Serialized ABI / Bincode</span>
                </div>
                <pre className="p-2.5 bg-[#0B0F17] rounded border border-slate-900 text-xs font-mono text-cyan-300/90 overflow-x-auto whitespace-pre-wrap break-all">
                  {currentStep.rawCalldataOrInstruction}
                </pre>
                <p className="text-xs text-slate-400 font-sans pt-1">
                  <strong>State Transition:</strong> {currentStep.stateDiffDesc}
                </p>
              </div>
            </div>

            {/* Right 5 Cols: Real-Time Balance Delta Monitor */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  Live Balance Delta (Step {currentStep.step})
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  Cumulative to step
                </span>
              </div>

              {/* Balance Delta Table */}
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3 font-mono text-xs">
                <div className="space-y-2.5">
                  {Object.keys(accumulatedBalances).length === 0 ? (
                    <div className="text-center py-6 text-slate-500">
                      No token transfer balance delta recorded up to Step {currentStep.step}.
                    </div>
                  ) : (
                    Object.entries(accumulatedBalances).map(([key, data]) => {
                      const isDrain = data.totalDelta < 0;
                      const isGain = data.totalDelta > 0;

                      return (
                        <div
                          key={key}
                          className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200">{data.label}</span>
                            <span
                              className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                                data.isAttacker
                                  ? 'bg-red-950/80 text-red-300 border border-red-800'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {data.isAttacker ? 'Attacker Side' : 'Victim Vault'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-slate-400">{data.token}:</span>
                            <div
                              className={`font-bold tabular-nums text-sm flex items-center gap-1 ${
                                isGain ? 'text-emerald-400' : isDrain ? 'text-red-400' : 'text-slate-400'
                              }`}
                            >
                              {isGain && <TrendingUp className="w-3.5 h-3.5 inline" />}
                              {isDrain && <TrendingDown className="w-3.5 h-3.5 inline" />}
                              {isGain ? '+' : ''}
                              {data.totalDelta.toLocaleString()} {data.symbol}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Invariant Rule Assertion Card for Active Step */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    Invariant Evaluation
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                      currentStep.invariantAssertion.vulnerableEvaluation === 'VIOLATED'
                        ? 'bg-red-950 text-red-300 border border-red-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    Original: {currentStep.invariantAssertion.vulnerableEvaluation}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-950 rounded border border-slate-800 font-mono text-xs text-amber-300">
                  {currentStep.invariantAssertion.expression}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  {currentStep.invariantAssertion.description}
                </p>

                {currentStep.invariantAssertion.revertReason && (
                  <div className="p-2 bg-emerald-950/40 border border-emerald-900/60 rounded text-[11px] font-mono text-emerald-300">
                    <span className="font-bold">Patched Invariant Action:</span> Will revert with{' '}
                    <span className="underline">{currentStep.invariantAssertion.revertReason}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RUST INVARIANT SANDBOX & CODE DIFF */}
      {activeTab === 'sandbox' && (
        <div className="space-y-6">
          {/* Sandbox Control Bar */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                Rust WebAssembly Invariant Simulator (`alt_autopsy_core`)
              </h3>
              <p className="text-xs text-slate-400">
                Test whether the smart contract security patch defends against the attacker's transaction trace.
              </p>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center gap-3 p-1.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className={`text-xs font-mono ${!patchEnabled ? 'text-red-400 font-semibold' : 'text-slate-500'}`}>
                Vulnerable State
              </span>
              <button
                onClick={() => setPatchEnabled(!patchEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  patchEnabled ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    patchEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-xs font-mono ${patchEnabled ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                Hardened Invariant Patch
              </span>
            </div>
          </div>

          {/* Engine Execution Status Terminal */}
          {evalResult && (
            <div className="p-4 bg-[#0B0F17] border border-slate-800 rounded-xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-300 font-bold">WASM Execution Log</span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      evalResult.status === 'REVERTED_EARLY'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : evalResult.status === 'INVARIANT_HOLD'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        : 'bg-red-950 text-red-300 border border-red-800'
                    }`}
                  >
                    Outcome: {evalResult.status}
                  </span>
                  <span className="text-slate-400 tabular-nums">
                    Net Drain: ${evalResult.netAttackerProfitUsd.toLocaleString()} USD
                  </span>
                </div>
              </div>

              {/* Terminal Logs */}
              <div className="space-y-1 text-slate-400 max-h-48 overflow-y-auto">
                {evalResult.executionLog.map((log, i) => (
                  <div
                    key={i}
                    className={`${
                      log.includes('[REVERT]')
                        ? 'text-emerald-400 font-semibold'
                        : log.includes('[VIOLATION]')
                        ? 'text-red-400 font-semibold'
                        : log.includes('[alt_autopsy_core]')
                        ? 'text-cyan-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vulnerable vs Patched Source Code Comparison */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                Source Code Invariant Diff: {incident.codeDiff.fileName}
              </h4>
              <span className="text-xs font-mono text-slate-400 uppercase">
                Language: {incident.codeDiff.language}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left: Vulnerable */}
              <div className="p-4 bg-slate-900/90 border border-red-900/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-red-400 font-semibold">
                  <span>Pre-Exploit Vulnerable Code</span>
                  <span className="text-[10px] bg-red-950 px-1.5 py-0.5 rounded border border-red-800">
                    Omitted Invariant Check
                  </span>
                </div>
                <pre className="p-3 bg-[#0B0F17] rounded border border-slate-900 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
                  {incident.codeDiff.vulnerableCode}
                </pre>
              </div>

              {/* Right: Patched */}
              <div className="p-4 bg-slate-900/90 border border-emerald-900/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-emerald-400 font-semibold">
                  <span>Remediated Hardened Code</span>
                  <span className="text-[10px] bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                    Active Assertion
                  </span>
                </div>
                <pre className="p-3 bg-[#0B0F17] rounded border border-slate-900 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
                  {incident.codeDiff.patchedCode}
                </pre>
              </div>
            </div>

            {/* Explanation card */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                Invariant Defense Mechanism
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {incident.codeDiff.invariantExplanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EXECUTIVE POST-MORTEM REPORT */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <div>
              <h3 className="text-sm font-bold text-white font-sans">
                Standardized Forensic Post-Mortem Report
              </h3>
              <p className="text-xs text-slate-400">
                Auditor-grade Markdown dossier suitable for incident response registries and GitHub repositories.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(AltAutopsyWasmEngine.generateMarkdownReport(incident), 'report')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              >
                {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedReport ? 'Copied' : 'Copy Markdown'}</span>
              </button>

              <button
                onClick={handleDownloadReport}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
              >
                <span>Download .md</span>
              </button>
            </div>
          </div>

          <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl space-y-6 text-sm text-slate-300 leading-relaxed font-sans">
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">
                1. Incident Overview
              </h2>
              <p>{incident.summary}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">
                2. Root Cause Breakdown
              </h2>
              <p>{incident.rootCause}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">
                3. Attack Chronology & Invocation Trace
              </h2>
              <div className="border border-slate-800 rounded-lg overflow-hidden font-mono text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Step</th>
                      <th className="p-3">Depth</th>
                      <th className="p-3">Caller</th>
                      <th className="p-3">Target Invocation</th>
                      <th className="p-3">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {incident.timeline.map((step) => (
                      <tr key={step.step} className="hover:bg-slate-800/50">
                        <td className="p-3 font-bold text-cyan-400">Step {step.step}</td>
                        <td className="p-3 text-slate-400">{step.depth}</td>
                        <td className="p-3 text-slate-300">{step.caller}</td>
                        <td className="p-3 text-white font-medium">
                          {step.programOrContract}::{step.methodOrInstruction}
                        </td>
                        <td className="p-3">
                          {step.isExploitPoint ? (
                            <span className="text-red-400 font-bold">EXPLOIT VECTOR</span>
                          ) : (
                            <span className="text-emerald-400">Nominal</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">
                4. Key Lessons & Remediation Guidelines
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                {incident.keyLessons.map((lesson, idx) => (
                  <li key={idx}>{lesson}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}

      {/* TAB 4: POC TEST HARNESS */}
      {activeTab === 'poc' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <div>
              <h3 className="text-sm font-bold text-white font-sans">
                Proof of Concept (PoC) Test Case
              </h3>
              <p className="text-xs text-slate-400">
                Framework: <span className="text-cyan-400 font-semibold">{incident.pocHarness.framework}</span> · Language: {incident.pocHarness.language.toUpperCase()}
              </p>
            </div>
            <button
              onClick={() => handleCopy(incident.pocHarness.code, 'poc')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              {copiedPoc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPoc ? 'Copied PoC' : 'Copy Code'}</span>
            </button>
          </div>

          <div className="p-4 bg-[#0B0F17] border border-slate-800 rounded-xl space-y-2 font-mono text-xs">
            <div className="text-[11px] text-slate-500 pb-1">
              Instructions: {incident.pocHarness.instructions}
            </div>
            <pre className="p-3 bg-slate-950 rounded border border-slate-900 text-slate-300 overflow-x-auto leading-relaxed">
              {incident.pocHarness.code}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
