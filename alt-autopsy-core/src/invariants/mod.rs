pub mod solana;
pub mod evm;
pub mod move_lang;

pub trait InvariantChecker {
    fn name(&self) -> &'static str;
    fn check(&self, expression_context: &str) -> Result<(), &'static str>;
}

