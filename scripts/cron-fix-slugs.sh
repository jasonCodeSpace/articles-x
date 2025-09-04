#!/bin/bash

# 设置工作目录
cd /Users/haochengwang/Desktop/claude/xarticle/articles-x

# 加载 Node.js 环境（如果使用 nvm）
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# 运行脚本
echo "$(date): 开始运行 fix-all-broken-slugs.ts" >> /tmp/fix-slugs-cron.log
npx tsx scripts/fix-all-broken-slugs.ts >> /tmp/fix-slugs-cron.log 2>&1
echo "$(date): 完成运行 fix-all-broken-slugs.ts" >> /tmp/fix-slugs-cron.log
echo "---" >> /tmp/fix-slugs-cron.log