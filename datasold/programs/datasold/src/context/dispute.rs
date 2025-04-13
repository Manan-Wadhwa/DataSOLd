use anchor_lang::prelude::*;
use crate::state::{Dataset, Dispute, GlobalConfig};
use crate::constants::MAX_REASON_LEN;
use crate::error::CustomError;

#[derive(Accounts)]
#[instruction(reason: String)]
pub struct FileDispute<'info> {
    /// Dataset must exist and be inactive (i.e. purchased or delisted)
    #[account(
        has_one = owner,
        constraint = !dataset.is_active @ CustomError::ListingStillActive
    )]
    pub dataset: Account<'info, Dataset>,

    /// New Dispute PDA
    #[account(
        init,
        payer = challenger,
        seeds = [
            b"dispute",
            dataset.key().as_ref(),
            challenger.key().as_ref()
        ],
        bump,
        space = 8                                 // discriminator
             + 32                                // dataset
             + 32                                // challenger
             + 4 + MAX_REASON_LEN               // reason String
             + 8                                 // created_at
             + 1                                 // status
             + 1                                 // result
             + 32                                // resolver
             + 8                                 // resolved_at
             + 1                                 // bump
    )]
    pub dispute: Account<'info, Dispute>,

    /// Who is filing
    #[account(mut)]
    pub challenger: Signer<'info>,

    /// System program for account creation
    pub system_program: Program<'info, System>,

    /// Clock for timestamps
    pub clock: Sysvar<'info, Clock>,
}

pub fn file_dispute_handler(
    ctx: Context<FileDispute>,
    reason: String,
) -> Result<()> {
    // Enforce max length
    if reason.len() > MAX_REASON_LEN {
        return err!(CustomError::ReasonTooLong);
    }

    let dispute = &mut ctx.accounts.dispute;
    dispute.dataset = ctx.accounts.dataset.key();
    dispute.challenger = ctx.accounts.challenger.key();
    dispute.reason = reason;
    dispute.created_at = ctx.accounts.clock.unix_timestamp;
    dispute.status = 0;       // Pending
    dispute.result = false;
    dispute.resolver = Pubkey::default();
    dispute.resolved_at = 0;
    dispute.bump = *ctx.bumps.get("dispute").unwrap();
    Ok(())
}

#[derive(Accounts)]
#[instruction(verdict: bool)]
pub struct ResolveDispute<'info> {
    /// The dispute to resolve
    #[account(
        mut,
        has_one = dataset,
        constraint = dispute.status == 0 @ CustomError::DisputeAlreadyResolved
    )]
    pub dispute: Account<'info, Dispute>,

    /// The dataset under dispute
    #[account(mut)]
    pub dataset: Account<'info, Dataset>,

    /// The global config PDA (holds admin pubkey)
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, GlobalConfig>,

    /// Only the admin can resolve
    #[account(address = config.admin @ CustomError::UnauthorizedResolver)]
    pub resolver: Signer<'info>,

    /// System program (for potential fund movements, if any)
    pub system_program: Program<'info, System>,

    /// Clock for resolution timestamp
    pub clock: Sysvar<'info, Clock>,
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
