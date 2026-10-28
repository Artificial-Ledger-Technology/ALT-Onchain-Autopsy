use super::InvariantChecker;

/// Ensures fee calculation does not round down to zero on micro-tranche borrows
pub struct NonZeroFlashFeeInvariant;

impl InvariantChecker for NonZeroFlashFeeInvariant {
    fn name(&self) -> &'static str {
        "Strict Non-Zero Flash Mint Fee Invariant"
    }

    fn check(&self, fee_val: &str) -> Result<(), &'static str> {
        if let Ok(fee) = fee_val.parse::<u64>() {
            if fee > 0 {
                return Ok(());
            }
        }
        Err("MoveAbort(EFEE_ROUNDED_TO_ZERO): Computed fee truncated to zero")
    }
}
