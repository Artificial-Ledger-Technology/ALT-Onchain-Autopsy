use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub enum ChainType {
    Solana,
    Ethereum,
    CrossChain,
    Move,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub enum CallType {
    CALL,
    DELEGATECALL,
    STATICCALL,
    CPI,
    #[serde(rename = "MOVE_CALL")]
    MoveCall,
}

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

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct IncidentTrace {
    pub id: String,
    pub title: String,
    pub protocol: String,
    pub chain: String,
    pub date: String,
    pub exploit_tx_hash: String,
    pub attacker_address: String,
    pub victim_vault_address: String,
    pub loss_usd: f64,
    pub root_cause: String,
    pub timeline: Vec<TraceStep>,
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
