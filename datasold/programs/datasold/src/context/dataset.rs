use anchor_lang::prelude::*;
use crate::state::Dataset;
use crate::constants::MAX_IPFS_HASH_LEN;

#[derive(Accounts)]
#[instruction(ipfs_hash: String)]
pub struct CreateDataset<'info> {
    #[account(
        init,
        payer = owner,
        seeds = [
            b"dataset",
            owner.key().as_ref(),
            ipfs_hash.as_bytes()
        ],
        bump,
        space = 8  // discriminator
            + 32   // owner Pubkey
            + 8    // price
            + 4    // string prefix
            + MAX_IPFS_HASH_LEN
            + 1    // is_active
            + 1    // bump
    )]
    pub dataset: Account<'info, Dataset>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn create_dataset(ctx: Context<CreateDataset>, ipfs_hash: String, price: u64) -> Result<()> {
    let ds = &mut ctx.accounts.ds;
    ds.owner = *ctx.accounts.owner.key;
    ds.price = price;
    ds.ipfs_hash = ipfs_hash;
    ds.is_active = true;
    ds.bump = *ctx.bumps.get("dataset").unwrap();

    Ok(())
}