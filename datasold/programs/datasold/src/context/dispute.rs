use anchor_lang::prelude::*;
use crate::state::{Dispute, Dataset, User};
use crate::context::init::GlobalState;
use crate::constants::MAX_REASON_LEN;
use crate::error::CustomError;
use anchor_lang::solana_program::clock::Clock;

#[derive(Accounts)]
#[instruction(reason: String)]
pub struct FileDispute<'info> {
    /// Dataset must exist and be inactive (i.e. purchased or delisted)
    #[account(
        constraint = !dataset.is_active @ CustomError::ListingStillActive
    )]
    pub dataset: Account<'info, Dataset>,

    /// New Dispute PDA
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 4 + reason.len() + 8 + 1 + 1 + 32 + 8 + 1,
        seeds = [b"dispute", dataset.key().as_ref(), challenger.key().as_ref()],
        bump
    )]
    pub dispute: Account<'info, Dispute>,

    /// Who is filing
    #[account(
        constraint = !challenger.is_banned @ CustomError::UnauthorizedResolver,
        constraint = challenger.authority == authority.key() @ CustomError::UnauthorizedResolver
    )]
    pub challenger: Account<'info, User>,

    /// Authority for the dispute
    #[account(mut)]
    pub authority: Signer<'info>,

    /// Global state PDA
    pub global_state: Account<'info, GlobalState>,

    /// System program for account creation
    pub system_program: Program<'info, System>,

    /// Clock for timestamps
    pub clock: Sysvar<'info, Clock>,
}

pub fn file_dispute_handler(
    ctx: Context<FileDispute>,
    reason: String,
) -> Result<()> {
    require!(
        reason.len() > 0 && reason.len() <= MAX_REASON_LEN,
        CustomError::ReasonTooLong
    );

    let dispute = &mut ctx.accounts.dispute;
    dispute.dataset = ctx.accounts.dataset.key();
    dispute.challenger = ctx.accounts.challenger.key();
    dispute.reason = reason;
    dispute.created_at = ctx.accounts.clock.unix_timestamp;
    dispute.status = 0;       // Pending
    dispute.result = false;
    dispute.resolver = Pubkey::default();
    dispute.resolved_at = 0;
    dispute.bump = ctx.bumps.dispute;
    Ok(())
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    /// The dispute to resolve
    #[account(
        mut,
        constraint = dispute.status == 0 @ CustomError::DisputeAlreadyResolved
    )]
    pub dispute: Account<'info, Dispute>,

    /// The dataset under dispute
    pub dataset: Account<'info, Dataset>,

    /// The global config PDA (holds admin pubkey)
    #[account(
        constraint = resolver.key() == global_state.authority @ CustomError::UnauthorizedResolver
    )]
    pub resolver: Signer<'info>,

    /// System program (for potential fund movements, if any)
    pub system_program: Program<'info, System>,

    /// Clock for resolution timestamp
    pub clock: Sysvar<'info, Clock>,

    /// Global state PDA
    pub global_state: Account<'info, GlobalState>,
}

pub fn resolve_dispute_handler(
    ctx: Context<ResolveDispute>,
    verdict: bool,
) -> Result<()> {
    let dispute = &mut ctx.accounts.dispute;
    dispute.status = 1;       // Resolved
    dispute.result = verdict;
    dispute.resolver = ctx.accounts.resolver.key();
    dispute.resolved_at = ctx.accounts.clock.unix_timestamp;

    // Mark dataset inactive on valid dispute
    if verdict {
        let ds = &mut ctx.accounts.dataset;
        ds.is_active = false;
    }

    Ok(())
}
