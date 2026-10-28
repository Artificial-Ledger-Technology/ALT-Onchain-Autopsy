use std::env;
use std::fs;
use std::process;

use alt_autopsy_core::evaluate_native;
use alt_autopsy_core::types::IncidentTrace;

fn print_usage() {
    println!(
        r#"ALT-Onchain-Autopsy CLI (v0.4.2)
Deterministic Transaction Replay and Invariant Verification Engine

USAGE:
    alt-autopsy <SUBCOMMAND> [OPTIONS]

SUBCOMMANDS:
    replay      Replay a recorded incident trace against invariant checks
    report      Generate an auditor-grade Markdown post-mortem
    version     Display version and VM specifications

OPTIONS:
    --trace <PATH>       Path to incident JSON trace file
    --patch              Enable security invariant remediation patch
    --help               Print help information
"#
    );
}

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        print_usage();
        return;
    }

    match args[1].as_str() {
        "version" | "--version" | "-v" => {
            println!("alt-autopsy-cli v0.4.2 (engine: alt-autopsy-core v0.4.2)");
            println!("VM Support: Solana Sealevel (SVM), Ethereum EVM, Move VM");
        }
        "replay" => {
            let mut trace_path: Option<String> = None;
            let mut patch_enabled = false;

            let mut i = 2;
            while i < args.len() {
                match args[i].as_str() {
                    "--trace" => {
                        if i + 1 < args.len() {
                            trace_path = Some(args[i + 1].clone());
                            i += 1;
                        }
                    }
                    "--patch" | "--assert-invariants" => {
                        patch_enabled = true;
                    }
                    _ => {}
                }
                i += 1;
            }

            let trace_file = match trace_path {
                Some(p) => p,
                None => {
                    eprintln!("Error: Missing required argument '--trace <PATH>'");
                    process::exit(1);
                }
            };

            let data = match fs::read_to_string(&trace_file) {
                Ok(content) => content,
                Err(err) => {
                    eprintln!("Error reading trace file '{}': {}", trace_file, err);
                    process::exit(1);
                }
            };

            let incident: IncidentTrace = match serde_json::from_str(&data) {
                Ok(inc) => inc,
                Err(err) => {
                    eprintln!("Error parsing JSON trace: {}", err);
                    process::exit(1);
                }
            };

            println!(
                "[ALT-AUTOPSY] Loaded trace for {} ({} steps)",
                incident.title,
                incident.timeline.len()
            );

            let outcome = evaluate_native(&incident, patch_enabled, None);

            for log in &outcome.execution_log {
                println!("{}", log);
            }

            println!("\n---------------- EVALUATION SUMMARY ----------------");
            println!("Status: {}", outcome.status);
            println!("Net Attacker Profit: ${:,.2} USD", outcome.net_attacker_profit_usd);
            println!("Compute/Gas Consumed: {}", outcome.total_gas_or_compute_units);
            println!("Active Invariants Checked: {}", outcome.active_invariants_checked);

            if let Some(reason) = outcome.revert_reason {
                println!("Revert Reason: {}", reason);
            }
        }
        "report" => {
            if args.len() < 3 {
                eprintln!("Error: Missing trace file path");
                process::exit(1);
            }
            let trace_file = &args[2];
            let data = match fs::read_to_string(trace_file) {
                Ok(content) => content,
                Err(err) => {
                    eprintln!("Error reading trace file '{}': {}", trace_file, err);
                    process::exit(1);
                }
            };

            let incident: IncidentTrace = match serde_json::from_str(&data) {
                Ok(inc) => inc,
                Err(err) => {
                    eprintln!("Error parsing JSON trace: {}", err);
                    process::exit(1);
                }
            };

            let report_md = alt_autopsy_core::report::generate_markdown_report(&incident);
            println!("{}", report_md);
        }
        "--help" | "-h" | "help" => {
            print_usage();
        }
        other => {
            eprintln!("Unknown subcommand '{}'", other);
            print_usage();
            process::exit(1);
        }
    }
}

