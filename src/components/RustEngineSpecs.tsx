import React, { useState } from 'react';
import { Terminal, Copy, Check, ShieldCheck, Box, ArrowRight } from 'lucide-react';
import { AltAutopsyWasmEngine } from '../engine/rustWasmSimulator';

export const RustEngineSpecs: React.FC = () => {
  const [activeFile, setActiveFile] = useState<'cargo' | 'lib' | 'cli'>('lib');
  const [copied, setCopied] = useState<boolean>(false);

  const cargoToml = `[package]
name = "alt-autopsy-core"
version = "0.4.2"
edition = "2021"
authors = ["ALT-Onchain-Autopsy Security Lab <research@onchain-autopsy.alt>"]
description = "Deterministic WebAssembly execution and invariant verification engine for multi-chain blockchain post-mortems"
license = "MIT OR Apache-2.0"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2.92"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
solana-program = "1.18"
alloy-primitives = { version = "0.7", default-features = false }
sha3 = "0.10"
bincode = "1.3"

[profile.release]
opt-level = "z"
lto = true
codegen-units = 1
panic = "abort"`;

  const libRs = AltAutopsyWasmEngine.getRustCoreCrateSource();

  const cliUsage = `# 1. Install the CLI binary via Cargo
cargo install alt-onchain-autopsy-cli

# 2. Replay and verify a recorded transaction trace against an Anchor patch
alt-autopsy replay \\
  --chain solana \\
  --tx 2zbeHzyQJbHw2w4Q...5jYw9hK8fD3n2P1x8kL0vB7 \\
  --patch-crate ./programs/wormhole-bridge \\
  --assert-invariants

# 3. Output results
# [ALT-AUTOPSY] Loaded trace (4 steps, 3 CPI frames)
# [ALT-AUTOPSY] Evaluating invariant 'Strict Native Instruction Sysvar Invariant'
# [ALT-AUTOPSY] Result: REVERTED_EARLY (ProgramError::InvalidAccountData)
# [ALT-AUTOPSY] Patch verified: 100% of exploit vectors prevented.`;

  const getContent = () => {
    switch (activeFile) {
      case 'cargo':
        return cargoToml;
      case 'lib':
        return libRs;
      case 'cli':
        return cliUsage;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <Terminal className="w-4 h-4" />
          <span>alt-autopsy-core v0.4.2</span>
          <span className="text-slate-600">·</span>
          <span>Target: wasm32-unknown-unknown</span>
        </div>

        <h2 className="text-2xl font-bold text-white tracking-tight font-sans">
          Rust WebAssembly Core Engine Architecture
        </h2>

        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
          The <span className="text-white font-mono">alt-autopsy-core</span> crate powers client-side trace execution, CPI call stack dissection, balance delta tracking, and deterministic invariant assertions directly inside the browser sandbox.
        </p>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-800">
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1">
            <span className="text-xs font-mono font-semibold text-cyan-300 flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5" />
              Zero-RPC Offline Sandbox
            </span>
            <p className="text-[11px] text-slate-400 font-sans">
              Traces evaluate with microsecond latency using WebAssembly memory buffers without external node rate limits.
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1">
            <span className="text-xs font-mono font-semibold text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Invariant Formalization
            </span>
            <p className="text-[11px] text-slate-400 font-sans">
              Translates mathematical post-conditions into compiler-checked assertions in Rust, Solidity, and Move.
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1">
            <span className="text-xs font-mono font-semibold text-purple-300 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              CLI & Crate Integration
            </span>
            <p className="text-[11px] text-slate-400 font-sans">
              Usable as both an in-browser WASM bundle and a native Rust CI regression testing CLI tool for auditor teams.
            </p>
          </div>
        </div>
      </div>

      {/* Code Browser */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          {/* File Selector Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveFile('lib')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeFile === 'lib' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              src/lib.rs (WASM Bridge)
            </button>
            <button
              onClick={() => setActiveFile('cargo')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeFile === 'cargo' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cargo.toml
            </button>
            <button
              onClick={() => setActiveFile('cli')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeFile === 'cli' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              CLI Terminal Usage
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Source Code'}</span>
          </button>
        </div>

        {/* Code Frame */}
        <pre className="p-4 bg-[#0B0F17] rounded-lg border border-slate-900 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
          {getContent()}
        </pre>
      </div>
    </div>
  );
};
