use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;
use crate::state::{Dataset, GlobalConfig};
use crate::error::CustomError;

#[derive(Accounts)]
pub struct BuyDataset<'info> {
    /// The on‐chain listing. Must be active and owned by `seller`.
    #[account(
        mut,
        has_one = owner,
        constraint = dataset.is_active @ CustomError::ListingInactive
    )]
    pub dataset: Account<'info, Dataset>,

    /// The buyer paying for the data.
    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: The seller receives the proceeds.
    /// Enforced by `address = dataset.owner`
    #[account(mut, address = dataset.owner)]
    pub seller: UncheckedAccount<'info>,

    /// Global config (holds fee % and acts as treasury).
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, GlobalConfig>,

    /// Native SOL transfers
    pub system_program: Program<'info, System>,
}

pub fn buy_dataset_handler(ctx: Context<BuyDataset>) -> Result<()> {
    let dataset = &mut ctx.accounts.dataset;
    let price = dataset.price;

    // Calculate platform fee = price * fee_bps / 10_000
    let fee = price
        .checked_mul(ctx.accounts.config.fee_basis_points as u64)
        .unwrap()
        .checked_div(10_000)
        .unwrap();

    // Seller gets the remainder
    let seller_amount = price.checked_sub(fee).unwrap();

    // 1) Transfer seller_amount from buyer → seller
    anchor_lang::solana_program::program::invoke(
        &system_instruction::transfer(
            &ctx.accounts.buyer.key(),
            &ctx.accounts.seller.key(),
            seller_amount,
        ),
        &[
            ctx.accounts.buyer.to_account_info(),
            ctx.accounts.seller.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    // 2) Transfer fee from buyer → config (treasury)
    anchor_lang::solana_program::program::invoke(
        &system_instruction::transfer(
            &ctx.accounts.buyer.key(),
            &ctx.accounts.config.key(),
            fee,
        ),
        &[
            ctx.accounts.buyer.to_account_info(),
            ctx.accounts.config.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    // 3) Mark listing inactive so it can’t be bought twice
    dataset.is_active = false;

    Ok(())
}
