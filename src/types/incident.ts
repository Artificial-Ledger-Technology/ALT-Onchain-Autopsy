export type ChainType = 'solana' | 'ethereum' | 'arbitrum' | 'move' | 'cross-chain' | 'bsc';

export type VulnerabilityCategory =
  | 'oracle-manipulation'
  | 'signature-verification'
  | 'reentrancy'
  | 'access-control'
  | 'logic-flaw'
  | 'bridge-relayer';

export interface BalanceChange {
  account: string;
  label: string;
  token: string;
  symbol: string;
  delta: number;
  postBalance: number;
  isAttacker: boolean;
}

export interface InvariantAssertion {
  name: string;
  expression: string;
  description: string;
  vulnerableEvaluation: 'VIOLATED' | 'BYPASS_SUCCESS' | 'PASSED';
  patchedEvaluation: 'HELD_SECURE' | 'REVERTED_EARLY';
  revertReason: string;
}

export interface CallTraceStep {
  step: number;
  depth: number;
  caller: string;
  target: string;
  programOrContract: string;
  methodOrInstruction: string;
  callType: 'CPI' | 'CALL' | 'DELEGATECALL' | 'STATICCALL' | 'MOVE_CALL';
  gasOrComputeUnits: number;
  isExploitPoint: boolean;
  exploitDetail?: string;
  balanceChanges: BalanceChange[];
  rawCalldataOrInstruction: string;
  stateDiffDesc: string;
  invariantAssertion: InvariantAssertion;
}

export interface CodeDiff {
  language: 'rust' | 'solidity' | 'move';
  fileName: string;
  vulnerableCode: string;
  patchedCode: string;
  invariantExplanation: string;
}

export interface PocHarness {
  language: 'rust' | 'solidity';
  framework: 'Anchor / Solana-Program-Test' | 'Foundry Forge' | 'Aptos Move CLI';
  code: string;
  instructions: string;
}

export interface RustEngineSpec {
  moduleName: string;
  signature: string;
  rustCode: string;
}

export interface Incident {
  id: string;
  slug: string;
  title: string;
  protocol: string;
  chain: ChainType;
  date: string;
  lossUsd: number;
  recoveredUsd: number;
  vulnerabilityType: VulnerabilityCategory;
  severity: 'Critical' | 'High';
  summary: string;
  rootCause: string;
  attackerAddress: string;
  victimVaultAddress: string;
  exploitTxHash: string;
  blockNumberOrSlot: number;
  keyLessons: string[];
  timeline: CallTraceStep[];
  codeDiff: CodeDiff;
  pocHarness: PocHarness;
  rustEngineSpec: RustEngineSpec;
}
