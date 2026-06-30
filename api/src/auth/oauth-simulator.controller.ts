import { Controller, Get, Post, Body, Query, Res, BadRequestException } from '@nestjs/common';
import * as express from 'express';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Controller('oauth')
export class OAuthSimulatorController {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  // 1. Google OAuth Simulator Consent Screen
  @Get('google')
  googleConsentScreen(
    @Query('redirect_uri') redirectUri: string,
    @Query('nonce') nonce: string,
    @Res() res: express.Response,
  ) {
    if (!redirectUri) {
      throw new BadRequestException('redirect_uri query parameter is required');
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sign in - Google Accounts</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Roboto', sans-serif; }
        </style>
      </head>
      <body class="bg-[#0b0f19] text-slate-200 min-h-screen flex items-center justify-center px-4">
        <!-- Background Radial Blur -->
        <div class="absolute w-72 h-72 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative">
          <!-- Google Logo -->
          <div class="flex flex-col items-center mb-8">
            <svg class="w-10 h-10 mb-3" viewBox="0 0 24 24" width="100%" height="100%">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <h1 class="text-2xl font-semibold text-white">Sign in with Google</h1>
            <p class="text-slate-400 text-sm mt-1">to continue to <span class="text-blue-500 font-semibold">WeatherGuard</span></p>
            <span class="text-[9px] bg-blue-900/30 text-blue-400 border border-blue-800/40 rounded px-1.5 py-0.5 mt-2 font-bold uppercase tracking-wider">Local Sandbox Simulator</span>
          </div>

          <form action="/api/oauth/google/submit" method="POST" class="space-y-6">
            <input type="hidden" name="redirect_uri" value="${redirectUri}">
            <input type="hidden" name="nonce" value="${nonce}">
            
            <div class="space-y-1">
              <label class="text-xs text-slate-400 font-medium">Google Account Email</label>
              <input 
                type="email" 
                name="email" 
                required 
                placeholder="name@gmail.com" 
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 h-[44px] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              >
            </div>

            <div class="flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/50 pt-4">
              <span>Secure local redirect sequence</span>
              <button 
                type="submit" 
                class="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 h-[40px] rounded-lg transition-all active:scale-95 text-xs"
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      </body>
      </html>
    `;
    res.send(html);
  }

  // 2. Google OAuth Simulator Form Submit Handler
  @Post('google/submit')
  async googleSubmit(
    @Body('email') email: string,
    @Body('redirect_uri') redirectUri: string,
    @Body('nonce') nonce: string,
    @Res() res: express.Response,
  ) {
    if (!email || !redirectUri) {
      throw new BadRequestException('email and redirect_uri are required');
    }

    const cleanEmail = email.trim().toLowerCase();
    const name = cleanEmail.split('@')[0];

    // Find or create sandbox user in DB
    let user = await this.usersService.findByEmail(cleanEmail);
    if (!user) {
      user = await this.usersService.create({
        email: cleanEmail,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        provider: 'google',
        providerId: `google_sim_${cleanEmail}`,
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${cleanEmail}`,
        role: 'ADMIN',
        status: 'APPROVED', // auto-approve for seamless testing
      });
    } else {
      // Auto upgrade permissions for sandbox logins
      user.role = 'ADMIN';
      user.status = 'APPROVED';
      await user.save();
    }

    // Sign OIDC id_token containing user profile payload
    const payload = {
      sub: user._id,
      email: user.email,
      name: user.name,
      picture: user.avatarUrl,
      role: user.role,
      nonce: nonce || 'weatherguard_nonce',
    };
    const idToken = this.jwtService.sign(payload);

    // Redirect browser back to React client callback hash
    res.redirect(`${redirectUri}#id_token=${idToken}`);
  }

  // 3. GitHub OAuth Simulator Consent Screen
  @Get('github')
  githubConsentScreen(
    @Query('redirect_uri') redirectUri: string,
    @Res() res: express.Response,
  ) {
    if (!redirectUri) {
      throw new BadRequestException('redirect_uri query parameter is required');
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Authorize WeatherGuard - GitHub</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; }
        </style>
      </head>
      <body class="bg-[#0d1117] text-[#c9d1d9] min-h-screen flex items-center justify-center px-4">
        <div class="max-w-md w-full bg-[#161b22] border border-[#30363d] rounded-xl p-8 shadow-2xl relative">
          <!-- GitHub Logo -->
          <div class="flex flex-col items-center mb-8">
            <svg class="w-12 h-12 mb-3 text-white fill-current" viewBox="0 0 16 16">
              <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.35 3.06.9.01.64.01 1.08.01 1.2 0 .21-.15.46-.55.38A8.013 8.013 0 0 1 0 8c0-4.42 3.58-8 8-8z"/>
            </svg>
            <h1 class="text-xl font-bold text-white">Authorize WeatherGuard</h1>
            <p class="text-slate-400 text-xs mt-1">Requesting access to your public GitHub profile</p>
            <span class="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800/40 rounded px-1.5 py-0.5 mt-2 font-bold uppercase tracking-wider">Local Sandbox Simulator</span>
          </div>

          <form action="/api/oauth/github/submit" method="POST" class="space-y-6">
            <input type="hidden" name="redirect_uri" value="${redirectUri}">
            
            <div class="space-y-1">
              <label class="text-xs text-[#8b949e] font-medium">GitHub Account Username</label>
              <input 
                type="text" 
                name="username" 
                required 
                placeholder="e.g. coder_fresher" 
                class="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 h-[44px] text-sm text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] transition-colors"
              >
            </div>

            <div class="flex items-center justify-between border-t border-[#30363d] pt-5">
              <button 
                type="button" 
                onclick="window.history.back()"
                class="text-xs text-[#58a6ff] hover:underline"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                class="bg-[#238636] hover:bg-[#2ea44f] text-white font-bold px-6 h-[40px] rounded-lg transition-all active:scale-95 text-xs"
              >
                Authorize WeatherGuard
              </button>
            </div>
          </form>
        </div>
      </body>
      </html>
    `;
    res.send(html);
  }

  // 4. GitHub OAuth Simulator Form Submit Handler
  @Post('github/submit')
  githubSubmit(
    @Body('username') username: string,
    @Body('redirect_uri') redirectUri: string,
    @Res() res: express.Response,
  ) {
    if (!username || !redirectUri) {
      throw new BadRequestException('username and redirect_uri are required');
    }

    const cleanUsername = username.trim().replace(/\s+/g, '_').toLowerCase();
    
    // Generate simulated authorization code
    const code = `sandbox_code_for_${cleanUsername}`;
    
    // Redirect browser back to React client callback query
    res.redirect(`${redirectUri}?code=${code}`);
  }
}
