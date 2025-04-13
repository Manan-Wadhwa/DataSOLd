use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init, 
        payer = authority, 
        space = 8 + 32 + 1, 
        seeds = [b"global_state"], 
        bump
    )]
    pub global_state: Account<'info, GlobalState>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
pub struct GlobalState {
    pub authority: Pubkey,
    pub bump: u8,
}

pub fn initialize_handler(ctx: Context<Initialize>) -> Result<()> {
    let global_state = &mut ctx.accounts.global_state;
    global_state.authority = ctx.accounts.authority.key();
    global_state.bump = ctx.bumps.global_state;
    
    Ok(())
} 