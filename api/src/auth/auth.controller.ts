import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('google')
  async googleLogin(@Body('idToken') idToken: string) {
    return this.authService.validateGoogleUser(idToken);
  }

  @Post('github')
  async githubLogin(@Body('code') code: string) {
    return this.authService.validateGithubUser(code);
  }

  @Post('email')
  async emailLogin(@Body('email') email: string, @Body('name') name?: string) {
    return this.authService.validateDemoUser(email, name || '');
  }

  @Get('sandbox-users')
  async getSandboxUsers() {
    return this.authService.getSandboxUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    // req.user is set by JwtAuthGuard
    return this.authService.verifySession(req.user.sub);
  }
}
