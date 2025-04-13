use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct AdjustReputation<'info> {
    #[account(mut)]
    pub user: Account<'info, User>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub global_state: SystemAccount<'info>,
}

pub fn adjust_reputation_handler(ctx: Context<AdjustReputation>, delta: i32) -> Result<()> {
    let user = &mut ctx.accounts.user;
    
    // Add the delta to the user's reputation
    let new_reputation = user.reputation.saturating_add(delta);
    user.reputation = new_reputation;
    
    Ok(())
} 