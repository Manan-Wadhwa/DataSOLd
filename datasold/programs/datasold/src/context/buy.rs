use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;
use crate::state::{Dataset, User};
use crate::context::init::GlobalState;

#[derive(Accounts)]
pub struct BuyDataset<'info> {
    /// The on‐chain listing. Must be active
    #[account(
        mut,
        constraint = dataset.is_active @ crate::error::CustomError::ListingInactive
    )]
    pub dataset: Account<'info, Dataset>,

    /// Buyer account
    #[account(
        constraint = !buyer.is_banned @ crate::error::CustomError::UnauthorizedResolver
    )]
    pub buyer: Account<'info, User>,
    
    /// Seller account
    pub seller: Account<'info, User>,

    /// The buyer's wallet paying for the data
    #[account(mut)]
    pub buyer_authority: Signer<'info>,

    /// The seller's wallet receiving the payment
    /// CHECK: We verify this through the dataset owner
    #[account(mut, address = dataset.owner)]
    pub seller_authority: UncheckedAccount<'info>,
    
    /// The global program state
    pub global_state: Account<'info, GlobalState>,

    /// Native SOL transfers
    pub system_program: Program<'info, System>,
}

pub fn buy_dataset_handler(ctx: Context<BuyDataset>) -> Result<()> {
    let dataset = &mut ctx.accounts.dataset;
    
    // Get payment amount
    let amount = dataset.price;

    // Transfer from buyer to seller
    anchor_lang::solana_program::program::invoke(
        &system_instruction::transfer(
            &ctx.accounts.buyer_authority.key(),
            &ctx.accounts.seller_authority.key(),
            amount,
        ),
        &[
            ctx.accounts.buyer_authority.to_account_info(),
            ctx.accounts.seller_authority.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    // Mark dataset as no longer active (sold)
    dataset.is_active = false;

    Ok(())
}
