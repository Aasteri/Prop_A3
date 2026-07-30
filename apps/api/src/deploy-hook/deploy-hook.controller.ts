import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execFile } from 'child_process';
import { join } from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

type DeployHookBody = {
  smtpPass?: string;
  /** `deploy` (default) = async full deploy; `seed` = sync DB seed only */
  mode?: 'deploy' | 'seed';
};

@Controller('deploy')
export class DeployHookController {
  constructor(private readonly config: ConfigService) {}

  private assertSecret(secret: string | undefined) {
    const expected = this.config.get<string>('DEPLOY_HOOK_SECRET');
    if (!expected || secret !== expected) {
      throw new UnauthorizedException('Invalid deploy secret');
    }
  }

  private appRoot(): string {
    return this.config.get<string>('APP_ROOT') ?? join(process.cwd(), '..', '..');
  }

  private hookEnv(body: DeployHookBody): NodeJS.ProcessEnv {
    const env = { ...process.env };
    if (body.smtpPass) {
      env.DEPLOY_SMTP_PASS = body.smtpPass;
    }
    return env;
  }

  @Post('hook')
  async trigger(
    @Headers('x-deploy-secret') secret: string | undefined,
    @Body() body: DeployHookBody = {},
  ) {
    this.assertSecret(secret);

    if (body.mode === 'seed') {
      const root = this.appRoot();
      const script = [
        `cd "${root}"`,
        'bash deploy/patch-smtp-env.sh',
        'npx --yes tsx prisma/seed.ts',
      ].join(' && ');

      try {
        const { stdout, stderr } = await execFileAsync(
          'bash',
          ['-lc', script],
          { env: this.hookEnv(body), maxBuffer: 1024 * 1024, timeout: 120_000 },
        );
        return {
          status: 'seed_complete',
          smtpConfigured: !!body.smtpPass,
          stdout: stdout.slice(-4000),
          stderr: stderr.slice(-2000),
        };
      } catch (err: unknown) {
        const e = err as { stdout?: string; stderr?: string; message?: string };
        return {
          status: 'seed_failed',
          smtpConfigured: !!body.smtpPass,
          stdout: e.stdout?.slice(-4000) ?? '',
          stderr: e.stderr?.slice(-2000) ?? '',
          error: e.message ?? 'seed failed',
        };
      }
    }

    const root = this.appRoot();
    const logPath = '/var/log/propa3-deploy.log';
    const script = [
      `cd "${root}"`,
      'bash deploy/patch-smtp-env.sh',
      'git fetch origin main',
      'git reset --hard origin/main',
      'bash deploy/deploy.sh',
    ].join(' && ');

    const { spawn } = await import('child_process');
    const child = spawn('bash', ['-lc', `${script} >> "${logPath}" 2>&1`], {
      detached: true,
      stdio: 'ignore',
      env: this.hookEnv(body),
    });
    child.unref();

    return { status: 'deploy_started', log: logPath, smtpConfigured: !!body.smtpPass };
  }
}
