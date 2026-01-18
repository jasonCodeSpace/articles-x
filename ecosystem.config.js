/**
 * PM2 Ecosystem Configuration for Racknerd Server
 *
 * For cron jobs, use: pm2 start ecosystem.config.js --cron restart
 *
 * Usage:
 * - pm2 start ecosystem.config.js --cron restart
 * - pm2 save
 * - pm2 startup
 */
module.exports = {
  apps: [
    {
      name: 'fetch-list-articles',
      script: './scripts/fetch-list-articles.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx',
      cwd: '/root/xarticle',
      instances: 1,
      autorestart: false,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/fetch-articles-error.log',
      out_file: './logs/fetch-articles-out.log',
      time: true,
    },
    {
      name: 'daily-report',
      script: './scripts/run-daily-report.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx',
      cwd: '/root/xarticle',
      instances: 1,
      autorestart: false,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/daily-report-error.log',
      out_file: './logs/daily-report-out.log',
      time: true,
    },
  ],
}
