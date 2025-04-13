use anchor_lang::prelude::*;
use crate::state::{Dataset, User};
use crate::context::init::GlobalState;
use crate::constants::MAX_IPFS_HASH_LEN;
use crate::error::CustomError;

#[derive(Accounts)]
#[instruction(ipfs_hash: String, price: u64)]
pub struct CreateDataset<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8 + 4 + ipfs_hash.len() + 1 + 1,
        seeds = [b"dataset", authority.key().as_ref(), ipfs_hash.as_bytes()],
        bump
    )]
    pub dataset: Account<'info, Dataset>,
    
    #[account(
        constraint = !user.is_banned @ CustomError::UnauthorizedResolver,
        constraint = user.authority == authority.key() @ CustomError::UnauthorizedResolver
    )]
    pub user: Account<'info, User>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub global_state: Account<'info, GlobalState>,
    
    pub system_program: Program<'info, System>,
}

pub fn create_dataset_handler(
    ctx: Context<CreateDataset>,
    ipfs_hash: String,
    price: u64,
) -> Result<()> {
    // Validate inputs
    require!(
        ipfs_hash.len() > 0 && ipfs_hash.len() <= MAX_IPFS_HASH_LEN,
        CustomError::ReasonTooLong
    );
    
    // Set the dataset properties
    let dataset = &mut ctx.accounts.dataset;
    dataset.owner = ctx.accounts.authority.key();
    dataset.price = price;
    dataset.ipfs_hash = ipfs_hash;
    dataset.is_active = true;
    dataset.bump = ctx.bumps.dataset;
    
    Ok(())
}