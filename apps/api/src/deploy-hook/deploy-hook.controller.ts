import { Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import { join } from 'path';

@Controller('deploy')
export class DeployHookController {
  constructor(private readonly config: ConfigService) {}

  @Post('hook')
  trigger(@Headers('x-deploy-secret') secret: string | undefined) {
    const expected = this.config.get<string>('DEPLOY_HOOK_SECRET');
    if (!expected || secret !== expected) {
      throw new UnauthorizedException('Invalid deploy secret');
    }

    const root = this.config.get<string>('APP_ROOT') ?? join(process.cwd(), '..', '..');
    const logPath = '/var/log/propa3-deploy.log';
    const script = [
      `cd "${root}"`,
      'git fetch origin main',
      'git reset --hard origin/main',
      'bash deploy/deploy.sh',
    ].join(' && ');

    const child = spawn('bash', ['-lc', `${script} >> "${logPath}" 2>&1`], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();

    return { status: 'deploy_started', log: logPath };
  }
}
