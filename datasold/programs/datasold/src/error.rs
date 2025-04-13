use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    #[msg("Listing is inactive; cannot buy.")]
    ListingInactive,

    #[msg("Listing is still active; cannot dispute until purchased.")]
    ListingStillActive,

    #[msg("Dispute has already been resolved.")]
    DisputeAlreadyResolved,

    #[msg("Only the admin can resolve disputes.")]
    UnauthorizedResolver,

    #[msg("Reason string too long.")]
    ReasonTooLong,
}
