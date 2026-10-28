// ==========================================
// ALT-Onchain-Autopsy Core Engine (Rust / WASM)
// Crate: alt-autopsy-core
// ==========================================

pub mod types;
pub mod engine;
pub mod invariants;
pub mod report;

use wasm_bindgen::prelude::*;
use crate::types::{EvaluationResult, IncidentTrace};
use crate::engine::TraceEngine;

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

    /// Evaluates raw incident trace calldata and returns structured evaluation result JSON
    #[wasm_bindgen]
    pub fn evaluate_trace(
        &self,
        incident_json: &str,
        target_step: Option<usize>,
    ) -> Result<String, JsValue> {
        let incident: IncidentTrace = serde_json::from_str(incident_json)
            .map_err(|e| JsValue::from_str(&format!("JSON deserialize error: {}", e)))?;

        let engine = TraceEngine::new(self.patch_enabled);
        let result = engine.evaluate(&incident, target_step);

        serde_json::to_string(&result)
            .map_err(|e| JsValue::from_str(&format!("JSON serialize error: {}", e)))
    }

    /// Generates Markdown post-mortem document for the given incident trace JSON
    #[wasm_bindgen]
    pub fn generate_report(&self, incident_json: &str) -> Result<String, JsValue> {
        let incident: IncidentTrace = serde_json::from_str(incident_json)
            .map_err(|e| JsValue::from_str(&format!("JSON deserialize error: {}", e)))?;
        Ok(report::generate_markdown_report(&incident))
    }

    /// Version string for telemetry and validation
    #[wasm_bindgen]
    pub fn version() -> String {
        "0.4.2".to_string()
    }
}

/// Standalone evaluation helper for non-WASM / native testing
pub fn evaluate_native(
    incident: &IncidentTrace,
    patch_enabled: bool,
    target_step: Option<usize>,
) -> EvaluationResult {
    let engine = TraceEngine::new(patch_enabled);
    engine.evaluate(incident, target_step)
}

