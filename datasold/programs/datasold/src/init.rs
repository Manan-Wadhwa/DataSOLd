use anchor_lang::prelude::*;
//Global config account
#[account]
pub struct GlobalCofig{
    pub admin: Pubkey,
    pub bump u8;

    pub fee_percentage: u8,
    pub max_auction_duration: u64,
    pub system_activated: bool,

}
//Initialize the global config account

#[derive(Accounts)]
pub struct Initialize<'info>{
    #[account(
        init,
        payer = payer,
        seeds = [b"config"],
        bump,
        space = 8 + std::mem::size_of::<GlobalCofig>(),
    )]
    pub config: Account<'info, GlobalCofig>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

//Initialize the global config account
pub fn initialize(ctx: Context<Initialize>, fee_percentage: u8, max_auction_duration: u64) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.admin = ctx.accounts.payer.key();
    config.fee_percentage = fee_percentage;
    config.max_auction_duration = 60 * 60 * 24 * 3;
    config.system_activated = true;

    Ok(())
}
//code explanation:
//1. Initialize the config account
//2. Set the admin to the payer
//3. Set the fee percentage
//4. Set the max auction duration
//5. Set the system activated to true

