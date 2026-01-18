/**
 * PM2 Ecosystem Configuration for Racknerd Server
 *
 * Usage:
 * - pm2 start ecosystem.config.js --cron restart
 * - pm2 save
 * - pm2 startup
 */
module.exports = {
  apps: [
    {
      name: 'article-pipeline',
      script: './scripts/run-article-pipeline.ts',
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
      error_file: './logs/pipeline-error.log',
      out_file: './logs/pipeline-out.log',
      time: true,
    },
  ],
}
