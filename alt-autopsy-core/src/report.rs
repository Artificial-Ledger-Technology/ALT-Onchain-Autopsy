use crate::types::IncidentTrace;

/// Generates an auditor-grade Markdown post-mortem document
pub fn generate_markdown_report(incident: &IncidentTrace) -> String {
    let mut doc = String::new();
    doc.push_str(&format!("# Security Incident Post-Mortem: {}\n\n", incident.title));
    doc.push_str(&format!("- **Protocol**: {}\n", incident.protocol));
    doc.push_str(&format!("- **Ecosystem**: {}\n", incident.chain));
    doc.push_str(&format!("- **Incident Date**: {}\n", incident.date));
    doc.push_str(&format!("- **Exploit Tx**: `{}`\n", incident.exploit_tx_hash));
    doc.push_str(&format!("- **Estimated Impact**: ${:,.2} USD\n\n", incident.loss_usd));

    doc.push_str("## 1. Executive Summary\n\n");
    doc.push_str(&format!("{}\n\n", incident.root_cause));

    doc.push_str("## 2. Invocation Trace Chronology\n\n");
    doc.push_str("| Step | Depth | Caller | Target | Method | Gas / CU | Invariant Status |\n");
    doc.push_str("| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n");

    for s in &incident.timeline {
        doc.push_str(&format!(
            "| {} | {} | `{}` | `{}` | `{}` | {} | {} |\n",
            s.step, s.depth, s.caller, s.target, s.method, s.gas_or_cu, s.invariant.name
        ));
    }

    doc.push_str("\n## 3. Invariant Remediation\n\n");
    doc.push_str("Every exploit vector in this incident violated a fundamental invariant. Remediating these code-paths ensures regression-proof security.\n");

    doc
}
