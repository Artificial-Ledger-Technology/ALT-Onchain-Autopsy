use super::InvariantChecker;

/// Validates that passed sysvar account strictly equals native `solana_program::sysvar::instructions::ID`
pub struct SysvarInstructionsInvariant;

impl InvariantChecker for SysvarInstructionsInvariant {
    fn name(&self) -> &'static str {
        "Strict Native Instruction Sysvar Invariant"
    }

    fn check(&self, account_key: &str) -> Result<(), &'static str> {
        // Solana native SysvarInstructions11111111111111111
        const NATIVE_SYSVAR_ID: &str = "SysvarInstructions11111111111111111";
        if account_key == NATIVE_SYSVAR_ID {
            Ok(())
        } else {
            Err("ProgramError::InvalidAccountData: Expected native sysvar::instructions::id()")
        }
    }
}

/// Asserts that borrow value does not exceed hair-cut collateralization threshold
pub struct CollateralHealthInvariant;

impl InvariantChecker for CollateralHealthInvariant {
    fn name(&self) -> &'static str {
        "Collateral Health Factor Invariant"
    }

    fn check(&self, health_factor: &str) -> Result<(), &'static str> {
        if let Ok(val) = health_factor.parse::<f64>() {
            if val >= 1.0 {
                return Ok(());
            }
        }
        Err("MangoError::InsufficientCollateral: Health factor under minimum threshold")
    }
}

