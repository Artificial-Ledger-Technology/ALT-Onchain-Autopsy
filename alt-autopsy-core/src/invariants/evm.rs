use super::InvariantChecker;

/// Validates post-donation account liquidity on lending pools
pub struct LiquidityCheckInvariant;

impl InvariantChecker for LiquidityCheckInvariant {
    fn name(&self) -> &'static str {
        "Mandatory Liquidity Post-Condition Invariant"
    }

    fn check(&self, is_solvent: &str) -> Result<(), &'static str> {
        if is_solvent == "true" {
            Ok(())
        } else {
            Err("EulerError::LiquidityCheckFailed: Account is underwater following collateral donation")
        }
    }
}

/// Asserts that Merkle roots accepted by bridge replicas are non-zero
pub struct NonZeroRootInvariant;

impl InvariantChecker for NonZeroRootInvariant {
    fn name(&self) -> &'static str {
        "Replica Non-Zero Merkle Root Invariant"
    }

    fn check(&self, root_hex: &str) -> Result<(), &'static str> {
        const ZERO_ROOT: &str = "0x0000000000000000000000000000000000000000000000000000000000000000";
        if root_hex != ZERO_ROOT && !root_hex.is_empty() {
            Ok(())
        } else {
            Err("ReplicaError::InvalidRoot: Cannot accept uninitialized 0x00 root as valid proof")
        }
    }
}
