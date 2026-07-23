/** @type {import('pm2').StartOptions[]} */
module.exports = {
  apps: [
    {
      name: 'propa3-api',
      cwd: './apps/api',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'propa3-web',
      cwd: './apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000 -H 127.0.0.1',
      instances: 1,
      autorestart: true,
      max_memory_restart: '450M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
