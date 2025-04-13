// Utility functions for the program
pub mod validation {
    use anchor_lang::prelude::*;
    use crate::constants::MAX_REASON_LEN;

    pub fn validate_reason(reason: &str) -> Result<()> {
        require!(reason.len() <= MAX_REASON_LEN, crate::error::CustomError::ReasonTooLong);
        Ok(())
    }
} 