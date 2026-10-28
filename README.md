# ALT-Onchain-Autopsy

> **Blockchain Incident Post-Mortem Repository & WebAssembly Forensic Analysis Platform**  
> Dissecting multi-chain smart contract exploits through deterministic Rust/WASM execution, interactive transaction call traces, live balance deltas, and compiler-verified invariant patches.

[![Ecosystem](https://img.shields.io/badge/Ecosystem-Solana%20%7C%20EVM%20%7C%20Move-00F2FE?style=flat-square)](https://github.com/Artificial-Ledger-Technology/ALT-Onchain-Autopsy)
[![Engine](https://img.shields.io/badge/Rust_WASM-alt--autopsy--core%20v0.4.2-059669?style=flat-square)](https://github.com/Artificial-Ledger-Technology/ALT-Onchain-Autopsy)
[![License](https://img.shields.io/badge/License-MIT%20%7C%20Apache--2.0-blue?style=flat-square)](LICENSE)
[![Build Status](https://img.shields.io/badge/Build-Passing-emerald?style=flat-square)](https://github.com/Artificial-Ledger-Technology/ALT-Onchain-Autopsy)
[![Indexed Losses](https://img.shields.io/badge/Indexed_Losses-$839.4M_USD-DC2626?style=flat-square)](https://github.com/Artificial-Ledger-Technology/ALT-Onchain-Autopsy)

---

## Table of Contents

- [1. Overview & Vision](#1-overview--vision)
- [2. Platform Architecture & Visual Showcase](#2-platform-architecture--visual-showcase)
  - [Interactive Call Trace Timeline & Playback](#interactive-call-trace-timeline--playback)
  - [Rust Invariant & Remediation Sandbox](#rust-invariant--remediation-sandbox)
  - [Side-by-Side Source Code Invariant Diff](#side-by-side-source-code-invariant-diff)
  - [Forensic Threat Repository & Incident Catalog](#forensic-threat-repository--incident-catalog)
  - [Reproducible Proof of Concept (PoC) Test Harness](#reproducible-proof-of-concept-poc-test-harness)
  - [Executive Post-Mortem Report & Markdown Exporter](#executive-post-mortem-report--markdown-exporter)
  - [Rust WebAssembly Core Engine Specifications](#rust-webassembly-core-engine-specifications)
  - [Community Autopsy Authoring & Submission](#community-autopsy-authoring--submission)
- [3. Supported Blockchain Ecosystems](#3-supported-blockchain-ecosystems)
- [4. Featured Incident Autopsies](#4-featured-incident-autopsies)
  - [Solana: Wormhole Guardian Signature Verification Bypass ($326M)](#solana-wormhole-guardian-signature-verification-bypass-326m)
  - [Ethereum: Euler Finance Donation & Self-Liquidation ($197M)](#ethereum-euler-finance-donation--self-liquidation-197m)
  - [Cross-Chain: Nomad Bridge Replica Zero-Root Bypass ($190M)](#cross-chain-nomad-bridge-replica-zero-root-bypass-190m)
  - [Solana: Mango Markets Perpetual Oracle & Collateral Manipulation ($114M)](#solana-mango-markets-perpetual-oracle--collateral-manipulation-114m)
  - [Move: Precision Rounding & Flash-Mint Fee Truncation ($12.4M)](#move-precision-rounding--flash-mint-fee-truncation-124m)
- [5. Native Rust Workspace Architecture (`alt-autopsy-core` & `alt-autopsy-cli`)](#5-native-rust-workspace-architecture-alt-autopsy-core--alt-autopsy-cli)
  - [Cargo Workspace Structure](#cargo-workspace-structure)
  - [Crate Specifications (`Cargo.toml`)](#crate-specifications-cargotoml)
  - [Core Data Structures & Invariant Pipeline](#core-data-structures--invariant-pipeline)
  - [WebAssembly Interface (`wasm-bindgen`)](#webassembly-interface-wasm-bindgen)
  - [Command-Line Interface (`alt-autopsy-cli`)](#command-line-interface-alt-autopsy-cli)
- [6. Breakthrough Installation & Run Guide](#6-breakthrough-installation--run-guide)
  - [System Prerequisites](#system-prerequisites)
  - [Step 1: Clone the Repository](#step-1-clone-the-repository)
  - [Step 2: Install Web Dependencies](#step-2-install-web-dependencies)
  - [Step 3: Run the Development Server](#step-3-run-the-development-server)
  - [Step 4: Build for Production & Preview](#step-4-build-for-production--preview)
  - [Step 5: Run Static Type Checking & Linting](#step-5-run-static-type-checking--linting)
  - [Step 6: Build & Test Native Rust Crates](#step-6-build--test-native-rust-crates)
  - [Step 7: Automated Visual Test & Screenshot Suite](#step-7-automated-visual-test--screenshot-suite)
  - [Troubleshooting & Common Pitfalls](#troubleshooting--common-pitfalls)
- [7. Forensic Invariant Methodology](#7-forensic-invariant-methodology)
- [8. Contributing a New Autopsy](#8-contributing-a-new-autopsy)
- [9. Security Policy & Invariant Verification Standards](#9-security-policy--invariant-verification-standards)
- [10. License & Research Credits](#10-license--research-credits)

---

## 1. Overview & Vision

Security post-mortems in Web3 are traditionally published as scattered blog posts, fragmented tweets, or Discord announcements. Protocol developers, whitehats, and auditors frequently spend hours cross-referencing raw block explorer logs, decompiled bytecode, and disparate forum notes to decipher what transpired during an exploit transaction.

**ALT-Onchain-Autopsy** transforms post-mortems into **interactive, reproducible on-chain autopsies**:
1. **Deterministic Rust Execution**: A native client-side WebAssembly engine (`alt-autopsy-core`) compiled from Rust parses transaction call stacks, traces internal invocations, and computes multi-asset balance deltas with sub-millisecond execution.
2. **Step-by-Step Transaction Playback**: A visual timeline scrubber that walks researchers through each invocation level—from the initial attacker transaction to deep Cross-Program Invocations (CPIs) in Solana or internal `DELEGATECALL` routines in EVM contracts.
3. **Formal Invariant Validation**: Rather than just explaining the flaw, the platform formalizes the broken invariant in code and lets researchers toggle the remediation patch to verify whether the exploit reverts under hardened conditions.
4. **Reproducible Proof of Concepts (PoCs)**: Every incident includes production-ready test cases in Anchor, `solana-program-test`, Foundry Forge, or Aptos Move CLI.

---

## 2. Platform Architecture & Visual Showcase

### Interactive Call Trace Timeline & Playback

The **Active Autopsy Workbench** provides granular inspection into every instruction, internal call, and CPI frame of the exploit transaction.

![Interactive Call Trace Timeline & Playback](docs/screenshots/01-autopsy-workbench-timeline.png)

- **Playback Controls**: Step through transactions sequentially using Play, Pause, Next Step, Previous Step, and Reset buttons, or scrub directly across execution milestone nodes.
- **Vulnerability Inflection Point Highlighting**: Visual indicators prominently mark the exact instruction where unauthorized minting, state desynchronization, or vault drainage occurred.
- **Hierarchical Invocation Tree**: Detailed invocation cards display the instruction name, depth level, caller account, target contract/program, and gas or Compute Unit (CU) consumption.
- **Real-Time Live Balance Delta**: Dynamically recalculates multi-asset token inflows and outflows for the current execution frame, distinguishing `Attacker Side` profits from `Victim Vault` drains.
- **Inline Invariant Status**: Real-time evaluation display indicating whether the protocol invariant is held or violated at the selected frame.

---

### Rust Invariant & Remediation Sandbox

The **Rust Invariant Sandbox** empowers security researchers to test remediation patches directly against real-world transaction traces without requiring a full live testnet deployment.

![Rust WebAssembly Invariant Simulator](docs/screenshots/02-invariant-remediation-sandbox.png)

- **Hardened Invariant Toggle**: Switch seamlessly between **Vulnerable State** and **Hardened Invariant Patch**.
- **Deterministic WASM Simulation**: Powered by the `alt_autopsy_core` WebAssembly engine (`wasm32-unknown-unknown`), simulating VM state transitions with zero external RPC roundtrips.
- **Immediate Outcome Verdicts**:
  - `REVERTED_EARLY`: Exploit vector caught by the invariant check before malicious state modifications occur ($0 USD net drain).
  - `EXPLOIT_EXECUTED`: Invariant missing or broken, leading to vault drain.
- **WASM Terminal Execution Log**: Microsecond timestamped terminal output detailing step evaluation, invariant expressions, and exact program revert codes (e.g., `ProgramError::InvalidAccountData`).

---

### Side-by-Side Source Code Invariant Diff

Direct visual comparison between the vulnerable production smart contract code and the hardened remediation patch.

![Source Code Invariant Diff](docs/screenshots/02b-source-code-invariant-diff.png)

- **Pre-Exploit Vulnerable Code**: Highlights omitted checks, unsafe arithmetic, uninitialized variables, or missing authority validations.
- **Remediated Hardened Code**: Presents the production-grade fix (e.g., `require_keys_eq!` checks, liquidity assertions, strict zero-value guards).
- **Invariant Defense Mechanism**: Concise architectural summary explaining why the remediated invariant prevents exploit reproduction.

---

### Forensic Threat Repository & Incident Catalog

A unified database indexing verified multi-chain exploits, categorized by ecosystem, root cause, and financial impact.

![Threat Repository & Incident Catalog](docs/screenshots/03-incident-catalog-threat-repo.png)

- **Key Metrics KPI Strip**: Real-time aggregated financial impact ($839.4M+ USD indexed exploit losses), record count, and active WASM engine build version.
- **Multi-Ecosystem Filtering**: Filter instantly across **Solana (Rust/SVM)**, **Ethereum (EVM)**, **Cross-Chain Bridges**, and **Move (Aptos/Sui)**.
- **Taxonomy Classification**: Filter by vulnerability category (Signature Verification, Logic Flaws, Bridge Relayers, Oracle Manipulation, Flash Loans).
- **Live Search**: Instant keyword filtering across protocol names, transaction hashes, root cause descriptions, and asset symbols.
- **Sorting Modes**: Toggle between Highest Financial Loss and Most Recent Incident.

---

### Reproducible Proof of Concept (PoC) Test Harness

Auditor-grade, executable test cases ready to plug into protocol regression suites.

![Reproducible PoC Test Harness](docs/screenshots/04-poc-test-harness.png)

- **Native Toolchain Support**:
  - Solana: `anchor test` and `solana-program-test` with local BPF loaders.
  - EVM: Foundry Forge (`forge test -vvvv --fork-url <RPC>`).
  - Move: Aptos Move CLI / Sui Move CLI test runners.
- **Step-by-Step Test Setup**: Complete setup instructions detailing required test validator flags, account mocking, malicious calldata preparation, and assertion checks.
- **One-Click Code Copy**: Fast clipboard integration for protocol CI/CD incorporation.

---

### Executive Post-Mortem Report & Markdown Exporter

Generates standardized, auditor-quality security disclosures formatted for protocol treasuries, whitehat disclosures, and community publications.

![Executive Forensic Post-Mortem Report](docs/screenshots/05-executive-autopsy-report.png)

- **Comprehensive Structure**:
  1. Incident Overview & Executive Summary
  2. Technical Root Cause Breakdown
  3. Attack Chronology & Invocation Trace Matrix
  4. Balance Impact & Asset Drain Assessment
  5. Remediated Invariant Definition
  6. Actionable Lessons & Defensive Recommendations
- **Export Options**: Copy Markdown directly to clipboard or download formatted `.md` files (`[protocol]-post-mortem.md`) with a single click.

---

### Rust WebAssembly Core Engine Specifications

Technical blueprint of the zero-RPC client-side execution sandbox powering ALT-Onchain-Autopsy.

![Rust WebAssembly Architecture Specs](docs/screenshots/06-rust-wasm-specs.png)

- **Multi-Chain Memory Model**: Abstract state machine tracking Solana accounts, EVM storage slots, and Move resources.
- **Tabbed Spec Explorer**: Browse Rust WASM bridge bindings (`src/lib.rs`), `Cargo.toml` dependencies, and CLI integration docs.

---

### Community Autopsy Authoring & Submission

Built-in authoring flow for security researchers, whitehats, and auditing firms to submit verified exploit dossiers.

![Submit Incident Autopsy Modal](docs/screenshots/07-submit-autopsy-modal.png)

- **Structured Form Inputs**: Protocol name, ecosystem target, financial loss (USD), vulnerability class, executive summary, and root cause.
- **Transaction & Address Binding**: Validated input fields for exploit transaction hash, attacker wallet address, and victim vault account.

---

## 3. Supported Blockchain Ecosystems

| Ecosystem | Runtime Model | Primary Language | Handled Invocation Types | Key Vulnerability Classes |
| :--- | :--- | :--- | :--- | :--- |
| **Solana** | Sealevel / SVM | Rust / Anchor | Instruction sysvars, Cross-Program Invocations (CPIs), Account writable/signer state | Sysvar spoofing, missing signer checks, account reinitialization, owner validation |
| **Ethereum** | EVM | Solidity / Vyper | `CALL`, `DELEGATECALL`, `STATICCALL`, Flash-loan callbacks, ERC20/ERC4626 vault transfers | Reentrancy, invariant omission, flash-loan price manipulation, storage collisions |
| **Cross-Chain Bridges** | Relayer / Multi-State | Multi-Language | Merkle proof verification, Optimistic fraud windows, Multi-validator VAA attestations | Null-root initialization bypass, message relay forgery, signature replay |
| **Move** | Move VM (Aptos/Sui) | Move / Rust | Resource safety, Coin split/merge, Flash-minting arithmetic precision | Integer division truncation, resource capability leakage, flash-mint fee bypass |

---

## 4. Featured Incident Autopsies

### Solana: Wormhole Guardian Signature Verification Bypass ($326M)
- **Date**: February 2, 2022
- **Vulnerability Category**: Signature Verification / Sysvar Spoofing
- **Root Cause**: The Wormhole Solana program relied on a deprecated signature verification function that accepted an arbitrary Sysvar account passed in the instruction keys without asserting `*instruction_sysvar.key == sysvar::instructions::ID`. The attacker passed a custom forged account containing valid-looking secp256k1 signature data, tricking the bridge into minting 120,000 Wrapped ETH on Solana without backing collateral.
- **Invariant Remedy**: `require_keys_eq!(*instruction_sysvar.key, solana_program::sysvar::instructions::ID, ErrorCode::InvalidInstructionSysvar)`.

### Ethereum: Euler Finance Donation & Self-Liquidation ($197M)
- **Date**: March 13, 2023
- **Vulnerability Category**: Logic Flaw / Invariant Omission
- **Root Cause**: The `donateToReserves()` function in `EToken.sol` burned the caller's collateral eTokens to increase reserve equity, but omitted calling `checkLiquidity()` at the end of the invocation. An attacker took an outsized flash-loan, minted 10x leveraged debt, donated collateral into an insolvent state without reverting, and then liquidated their own underwater account using a second sub-account to harvest bad-debt liquidation bonuses.
- **Invariant Remedy**: Mandatory `checkLiquidity(msgSenderSubAccountId)` assertion after burning collateral.

### Cross-Chain: Nomad Bridge Replica Zero-Root Bypass ($190M)
- **Date**: August 1, 2022
- **Vulnerability Category**: Bridge Relayer / Storage Sentinel Collision
- **Root Cause**: During a deployment upgrade of the `Replica` contract, `confirmAt[bytes32(0)]` was initialized to `1`. As unproven or default messages have an uninitialized null root of `0x00...00`, the validation check `acceptableRoot(0x0)` returned `true`, treating raw malicious withdrawal requests as pre-approved without signatures or fraud-proof waiting periods.
- **Invariant Remedy**: Explicit guard `if (_root == bytes32(0)) return false;`.

### Solana: Mango Markets Perpetual Oracle & Collateral Manipulation ($114M)
- **Date**: October 11, 2022
- **Vulnerability Category**: Oracle & Collateral Manipulation
- **Root Cause**: Two funded accounts took opposing massive long and short positions on the illiquid MNGO-PERP market. The attacker manipulated the orderbook price upward by +2300%. The protocol immediately recognized 100% of the unrealized paper gains as borrowing collateral without applying liquidity-weighted hair-cuts or checking external TWAP oracles, allowing the attacker to borrow and withdraw all liquid pool assets (USDC, SOL, BTC, USDT).
- **Invariant Remedy**: Pyth TWAP price divergence bounds + 0% borrow credit weight on unrealized paper PnL of low-liquidity governance tokens.

### Move: Precision Rounding & Flash-Mint Fee Truncation ($12.4M)
- **Date**: April 18, 2024
- **Vulnerability Category**: Logic Flaw / Arithmetic Truncation
- **Root Cause**: Flash-mint fee calculations used standard integer division `(amount * fee_bps) / 10000`. By breaking borrows into micro-tranches where the numerator was less than 10,000, fees rounded down to zero, allowing risk-free, fee-free flash mint cycling to siphon curve liquidity.
- **Invariant Remedy**: Ceiling division `(amount * fee_bps + 9999) / 10000` with assertion `assert!(fee >= 1, EFEE_ROUNDED_TO_ZERO)`.

---

## 5. Native Rust Workspace Architecture (`alt-autopsy-core` & `alt-autopsy-cli`)

The repository includes a production-grade native Rust workspace powering both in-browser WebAssembly evaluation and standalone offline terminal regression testing.

### Cargo Workspace Structure

```
ALT-Onchain-Autopsy/
├── Cargo.toml                       # Root workspace manifest
│
├── alt-autopsy-core/                # WebAssembly core library (cdylib, rlib)
│   ├── Cargo.toml                   # wasm-bindgen, serde, serde_json
│   └── src/
│       ├── lib.rs                   # WASM entry points & exported JS bindings
│       ├── types.rs                 # Multi-chain trace step & invariant types
│       ├── engine.rs                # Deterministic state transition engine
│       ├── report.rs                # Auditor Markdown post-mortem generator
│       └── invariants/              # Formal invariant rules
│           ├── mod.rs               # InvariantChecker trait
│           ├── solana.rs            # Sysvar spoofing & collateral checks
│           ├── evm.rs               # Liquidity post-checks & replica zero-root guards
│           └── move_lang.rs         # Arithmetic fee truncation guards
│
└── alt-autopsy-cli/                 # Native terminal replay tool
    ├── Cargo.toml
    └── src/
        └── main.rs                  # CLI subcommand parser (replay, report, version)
```

### Crate Specifications (`Cargo.toml`)

The root [`Cargo.toml`](Cargo.toml) links the crates into a single unified workspace:

```toml
[workspace]
members = [
    "alt-autopsy-core",
    "alt-autopsy-cli",
]
resolver = "2"
```

The core engine [`alt-autopsy-core/Cargo.toml`](alt-autopsy-core/Cargo.toml) targets both WebAssembly and native compilation:

```toml
[package]
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

[profile.release]
opt-level = "z"
lto = true
codegen-units = 1
panic = "abort"
```

### Core Data Structures & Invariant Pipeline

Defined in [`alt-autopsy-core/src/types.rs`](alt-autopsy-core/src/types.rs):

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct BalanceChange {
    pub account: String,
    pub token: String,
    pub symbol: String,
    pub delta: f64,
    pub is_attacker: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct InvariantAssertion {
    pub name: String,
    pub expression: String,
    pub description: String,
    pub vulnerable_evaluation: String,
    pub patched_evaluation: String,
    pub revert_reason: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TraceStep {
    pub step: u32,
    pub depth: u32,
    pub caller: String,
    pub target: String,
    pub method: String,
    pub call_type: String,
    pub gas_or_cu: u64,
    pub is_exploit_point: bool,
    pub exploit_detail: Option<String>,
    pub balance_changes: Vec<BalanceChange>,
    pub invariant: InvariantAssertion,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct EvaluationResult {
    pub status: String,
    pub revert_step_index: Option<usize>,
    pub revert_reason: Option<String>,
    pub net_attacker_profit_usd: f64,
    pub total_gas_or_compute_units: u64,
    pub active_invariants_checked: usize,
    pub invariant_violations: Vec<String>,
    pub execution_log: Vec<String>,
}
```

### WebAssembly Interface (`wasm-bindgen`)

Exported from [`alt-autopsy-core/src/lib.rs`](alt-autopsy-core/src/lib.rs):

```rust
#[wasm_bindgen]
pub struct AutopsyEngine {
    patch_enabled: bool,
}

#[wasm_bindgen]
impl AutopsyEngine {
    #[wasm_bindgen(constructor)]
    pub fn new(patch_enabled: bool) -> Self {
        Self { patch_enabled }
    }

    #[wasm_bindgen]
    pub fn evaluate_trace(&self, incident_json: &str, target_step: Option<usize>) -> Result<String, JsValue> {
        let incident: IncidentTrace = serde_json::from_str(incident_json)
            .map_err(|e| JsValue::from_str(&format!("JSON deserialize error: {}", e)))?;
        let engine = TraceEngine::new(self.patch_enabled);
        let result = engine.evaluate(&incident, target_step);
        serde_json::to_string(&result)
            .map_err(|e| JsValue::from_str(&format!("JSON serialize error: {}", e)))
    }
}
```

### Command-Line Interface (`alt-autopsy-cli`)

The native CLI tool ([`alt-autopsy-cli/src/main.rs`](alt-autopsy-cli/src/main.rs)) enables automated protocol regression tests in CI/CD pipelines:

```bash
# Replay an exploit trace with hardened invariants enabled
cargo run --bin alt-autopsy-cli -- replay --trace ./trace.json --patch
```

---

## 6. Breakthrough Installation & Run Guide

Follow this walkthrough to set up, build, and run both the web dashboard and the native Rust engine.

### System Prerequisites

| Dependency | Minimum Version | Recommended | Notes |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>= 18.0.0` | `20.x` or `24.x` | Runtime for Vite web application |
| **npm** | `>= 9.0.0` | `10.x` or `11.x` | Node package manager |
| **Rust / Cargo** | `>= 1.75.0` | Latest Stable | Optional: required only for native Rust CLI or rebuilding WASM |
| **Google Chrome** | Current | Current | Optional: used by `scripts/capture.js` for automated screenshots |

---

### Step 1: Clone the Repository

Clone the repository from GitHub and navigate to the project directory:

```bash
git clone https://github.com/Artificial-Ledger-Technology/ALT-Onchain-Autopsy.git
cd ALT-Onchain-Autopsy
```

---

### Step 2: Install Web Dependencies

Install npm dependencies using the `--legacy-peer-deps` flag:

```bash
npm install --legacy-peer-deps
```

> [!NOTE]
> **Why `--legacy-peer-deps`?**  
> Vite v8 introduces updated peer resolution requirements for optional compiler bindings. Passing `--legacy-peer-deps` prevents npm version resolver halts while maintaining complete dependency security and integrity.

Verify the installation succeeded:
```bash
npm ls --depth=0
```

---

### Step 3: Run the Development Server

Start the local Vite development server:

```bash
npm run dev
```

You will see output similar to:
```text
  VITE v8.3.5  ready in 280 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://172.24.12.168:3000/
```

Open your browser and navigate to **`http://localhost:3000`**.  
The dashboard is now live with hot module replacement (HMR) enabled.

---

### Step 4: Build for Production & Preview

To generate an optimized, minified production build:

```bash
npm run build
```

This executes `tsc` (TypeScript typechecking) followed by `vite build`. Output assets are compiled into [`dist/`](dist/):
```text
dist/index.html                   1.49 kB │ gzip:  0.64 kB
dist/assets/index-CbBB8Nbe.css   38.06 kB │ gzip:  7.08 kB
dist/assets/index-Dt5IRjWE.js   332.22 kB │ gzip: 97.18 kB
✓ built in 240ms
```

To test the production build locally:
```bash
npm run preview
```

---

### Step 5: Run Static Type Checking & Linting

Run TypeScript type verification without emitting build artifacts:

```bash
npm run lint
```

A clean exit code (`0`) confirms full type correctness across all components, engine models, and data types.

---

### Step 6: Build & Test Native Rust Crates

If you have the Rust toolchain installed (`cargo` & `rustc`), build and test the workspace:

```bash
# 1. Build all workspace crates (alt-autopsy-core & alt-autopsy-cli)
cargo build --workspace

# 2. Check the CLI tool version
cargo run --bin alt-autopsy-cli -- --version

# 3. View CLI usage options
cargo run --bin alt-autopsy-cli -- --help
```

To compile `alt-autopsy-core` to a WebAssembly module for direct browser import using `wasm-pack`:
```bash
wasm-pack build alt-autopsy-core --target web --release
```

---

### Step 7: Automated Visual Test & Screenshot Suite

The repository includes a headless automated screenshot suite in [`scripts/capture.js`](scripts/capture.js). Powered by `puppeteer-core` and Google Chrome, it drives the application across views, toggles the invariant patch switch, and captures $2\times$ retina images:

```bash
# 1. In Terminal 1: Ensure dev server is active
npm run dev

# 2. In Terminal 2: Run the capture script
node scripts/capture.js
```

All 8 screenshots are rendered directly to [`docs/screenshots/`](docs/screenshots/).

---

### Troubleshooting & Common Pitfalls

#### 1. Peer Dependency Resolution Error
- **Symptom**: `npm error ERESOLVE could not resolve peer dependency`
- **Solution**: Run `npm install --legacy-peer-deps`.

#### 2. Port 3000 Already In Use
- **Symptom**: `Port 3000 is in use, trying another one...`
- **Solution**: Stop any conflicting process on port 3000, or let Vite automatically select the next available port (e.g., `http://localhost:3001`).

#### 3. Chrome Not Found for Screenshot Capture
- **Symptom**: `Error: Failed to launch browser process` when running `node scripts/capture.js`.
- **Solution**: Ensure Google Chrome or Chromium is installed. By default, `scripts/capture.js` looks for Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe` on Windows. For macOS/Linux, adjust the path in `scripts/capture.js` to `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` or `/usr/bin/google-chrome`.

---

## 7. Forensic Invariant Methodology

ALT-Onchain-Autopsy models exploits as mathematical invariant failures across 4 phases:

```
[Attacker Calldata] ──> [Invocation Dispatch] ──> [Invariant Evaluation Gate] ──> [State Mutation]
                                                               │
                                         ┌─────────────────────┴─────────────────────┐
                                         ▼                                           ▼
                               [Patch Mode: OFF]                           [Patch Mode: ON]
                                       │                                           │
                                       ▼                                           ▼
                          Invariant Check Skipped                     Invariant Trigger Asserted
                                       │                                           │
                                       ▼                                           ▼
                            State Compromised / Drain                   Early Revert / $0 Drain
```

1. **Deconstruction**: The transaction trace is broken into hierarchical frames with calldata, caller, target, gas/CU, and token deltas.
2. **Invariant Extraction**: The underlying assumption violated by the contract is formalized as a boolean proposition $I(\text{state})$.
3. **Hardened Assertions**: Remediated smart contract code is synthesized incorporating compiler-enforced invariant guards.
4. **Counterfactual Simulation**: The exploit trace is replayed through the patched contract inside the Rust/WASM sandbox to prove that execution reverts before unauthorized state modification.

---

## 8. Contributing a New Autopsy

We invite security researchers, whitehats, protocol engineering teams, and auditor firms to contribute verified autopsies.

### Method A: Via the Web Dashboard
1. Launch the app (`npm run dev`).
2. Click **"+ Submit Autopsy"** in the top navigation bar.
3. Fill in the protocol name, ecosystem, vulnerability class, loss amount, technical root cause, and initial trace steps.
4. Click **"Publish to Autopsy Repository"**.

### Method B: Via Pull Request
1. Fork and clone the repository.
2. Add a new autopsy record in [`src/data/incidents.ts`](src/data/incidents.ts) adhering to the `Incident` interface in [`src/types/incident.ts`](src/types/incident.ts).
3. Provide:
   - Complete multi-step invocation trace with accurate CU/gas and balance deltas.
   - Pre-exploit vulnerable source code and remediated patch diff.
   - Executable PoC test case for Anchor, Foundry Forge, or Move CLI.
4. Verify tests pass:
   ```bash
   npm run lint
   npm run build
   ```
5. Submit a Pull Request titled `autopsy: [Protocol Name] - [Vulnerability Type]`.

---

## 9. Security Policy & Invariant Verification Standards

Every post-mortem hosted in ALT-Onchain-Autopsy must adhere to rigorous cryptographic and forensic criteria:

- **Slot & Hash Determinism**: Every autopsy must include valid, publicly verifiable block numbers/slots and original transaction hashes.
- **Formal Invariant Definition**: Submissions must describe the broken invariant in terms of state post-conditions (e.g., $k$-factor liquidity formulas, sysvar key equalities, health factors, or zero-byte sentinel guards).
- **Dual-State PoC Requirement**: PoC code must reproduce the exploit against vulnerable bytecode and confirm early revert when the remediation patch is compiled.

---

## 10. License & Research Credits

- **Software License**: Dual-licensed under the **MIT License** or **Apache License 2.0** at your option. See [LICENSE](LICENSE) for details.
- **Research References**: Developed with reference to on-chain transaction logs and security disclosures published by OpenZeppelin, Neodyme, Trail of Bits, OtterSec, Jump Crypto, Euler Labs, and independent community whitehats.
