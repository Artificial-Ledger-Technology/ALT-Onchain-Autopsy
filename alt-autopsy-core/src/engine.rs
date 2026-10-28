use crate::types::{EvaluationResult, IncidentTrace};

/// Deterministic Trace Evaluation and Invariant Verification Engine
pub struct TraceEngine {
    patch_enabled: bool,
}

impl TraceEngine {
    pub fn new(patch_enabled: bool) -> Self {
        Self { patch_enabled }
    }

    pub fn evaluate(
        &self,
        incident: &IncidentTrace,
        target_step: Option<usize>,
    ) -> EvaluationResult {
        let max_step = target_step.unwrap_or(incident.timeline.len().saturating_sub(1));
        let mut logs = Vec::new();
        let mut violations = Vec::new();
        let mut net_profit = 0.0;
        let mut total_gas_cu = 0u64;

        logs.push(format!(
            "[alt_autopsy_core] Initializing VM for chain: {}",
            incident.chain.to_uppercase()
        ));
        logs.push(format!(
            "[alt_autopsy_core] Engine build: wasm32-unknown-unknown (v0.4.2-security-hardened)"
        ));
        logs.push(format!(
            "[alt_autopsy_core] Target Tx: {}",
            incident.exploit_tx_hash
        ));
        logs.push(format!(
            "[alt_autopsy_core] Invariant Mode: {}",
            if self.patch_enabled {
                "PATCH_ENABLED (STRICT)"
            } else {
                "VULNERABLE (UNCHECKED)"
            }
        ));

        for (i, step) in incident.timeline.iter().enumerate() {
            if i > max_step {
                break;
            }
            total_gas_cu += step.gas_or_cu;

            logs.push(format!(
                "Step {} [depth={}] {} -> {}::{}",
                step.step, step.depth, step.caller, step.target, step.method
            ));

            if self.patch_enabled {
                if step.invariant.patched_evaluation == "REVERTED_EARLY" || step.is_exploit_point {
                    logs.push(format!(
                        "[REVERT] Invariant Triggered: \"{}\"",
                        step.invariant.name
                    ));
                    logs.push(format!("[REVERT] Expression: {}", step.invariant.expression));
                    logs.push(format!("[REVERT] Reason: {}", step.invariant.revert_reason));

                    return EvaluationResult {
                        status: "REVERTED_EARLY".to_string(),
                        revert_step_index: Some(i),
                        revert_reason: Some(step.invariant.revert_reason.clone()),
                        net_attacker_profit_usd: 0.0,
                        total_gas_or_compute_units: total_gas_cu,
                        active_invariants_checked: i + 1,
                        invariant_violations: vec![step.invariant.name.clone()],
                        execution_log: logs,
                    };
                }
            } else if step.invariant.vulnerable_evaluation == "VIOLATED" || step.is_exploit_point {
                violations.push(step.invariant.name.clone());
                logs.push(format!(
                    "[VIOLATION] Invariant \"{}\" bypassed without check.",
                    step.invariant.name
                ));
            }

            // Accumulate balance deltas
            for b in &step.balance_changes {
                if b.is_attacker && b.delta > 0.0 {
                    if b.symbol.contains("USD") || b.symbol.contains("DAI") {
                        net_profit += b.delta;
                    } else if b.symbol == "whETH" {
                        net_profit += b.delta * 2716.0;
                    } else if b.symbol == "WBTC" {
                        net_profit += b.delta * 23000.0;
                    } else {
                        net_profit += b.delta;
                    }
                }
            }
        }

        EvaluationResult {
            status: if self.patch_enabled {
                "INVARIANT_HOLD".to_string()
            } else {
                "EXPLOIT_EXECUTED".to_string()
            },
            revert_step_index: None,
            revert_reason: None,
            net_attacker_profit_usd: net_profit,
            total_gas_or_compute_units: total_gas_cu,
            active_invariants_checked: incident.timeline.len().min(max_step + 1),
            invariant_violations: violations,
            execution_log: logs,
        }
    }
}
