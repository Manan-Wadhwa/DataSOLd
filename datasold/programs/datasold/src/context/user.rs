use anchor_lang::prelude::*;
use crate::state::User;
use crate::context::init::GlobalState;
use crate::constants::MAX_USERNAME_LEN;

#[derive(Accounts)]
#[instruction(username: String)]
pub struct CreateUser<'info> {
    #[account(
        init, 
        payer = authority, 
        space = 8 + 32 + 1 + 4 + username.len() + 4 + 1 + 1,
        seeds = [b"user", authority.key().as_ref()],
        bump
    )]
    pub user: Account<'info, User>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub global_state: Account<'info, GlobalState>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BanUser<'info> {
    #[account(mut)]
    pub user: Account<'info, User>,
    
    #[account(
        constraint = authority.key() == global_state.authority @ crate::error::CustomError::UnauthorizedResolver
    )]
    pub authority: Signer<'info>,
    
    pub global_state: Account<'info, GlobalState>,
}

#[derive(Accounts)]
pub struct UnbanUser<'info> {
    #[account(mut)]
    pub user: Account<'info, User>,
    
    #[account(
        constraint = authority.key() == global_state.authority @ crate::error::CustomError::UnauthorizedResolver
    )]
    pub authority: Signer<'info>,
    
    pub global_state: Account<'info, GlobalState>,
}

pub fn create_user_handler(ctx: Context<CreateUser>, username: String) -> Result<()> {
    require!(
        username.len() > 0 && username.len() <= MAX_USERNAME_LEN,
        crate::error::CustomError::ReasonTooLong
    );
    
    let user = &mut ctx.accounts.user;
    user.authority = ctx.accounts.authority.key();
    user.username = username;
    user.reputation = 0;
    user.is_banned = false;
    user.bump = ctx.bumps.user;
    
    Ok(())
}

pub fn ban_user_handler(ctx: Context<BanUser>) -> Result<()> {
    let user = &mut ctx.accounts.user;
    user.is_banned = true;
    
    Ok(())
}

pub fn unban_user_handler(ctx: Context<UnbanUser>) -> Result<()> {
    let user = &mut ctx.accounts.user;
    user.is_banned = false;
    
    Ok(())
}

