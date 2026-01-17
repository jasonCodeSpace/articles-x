#!/bin/bash

# Vercel 环境变量配置脚本
# 用法: ./setup-vercel-env.sh

echo "=========================================="
echo "Xarticle - Vercel 环境变量配置"
echo "=========================================="
echo ""

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安装"
    echo "请先运行: npm install -g vercel"
    exit 1
fi

echo "正在配置环境变量到 Vercel..."
echo ""

# Supabase Public URL
echo "📝 设置 NEXT_PUBLIC_SUPABASE_URL..."
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<EOF
https://pskhqphqikghdyqmgsud.supabase.co
EOF

# Supabase Anon Key
echo "📝 设置 NEXT_PUBLIC_SUPABASE_ANON_KEY..."
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<EOF
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBza2hxcGhxaWdoZHlxbWdzdWQiLCJyb2xlIjoiYW5vbiIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsO3xuhuSMdo
EOF

# Supabase Service Role Key
echo "📝 设置 SUPABASE_SERVICE_ROLE_KEY..."
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<EOF
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBza2hxcGhxaWdoZHlxbWdzdWQiLCJyb2xlIjoiInNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsO3xuhuSMdo
EOF

# DeepSeek API Key
echo "📝 设置 DEEPSEEK_API_KEY..."
vercel env add DEEPSEEK_API_KEY production <<EOF
sk-2c70e8c0262a4c9e8f8d8b8e8f8d8b8e8f8d8b8e8f8d8b8e8f8d8b8e8f8d8b8e
EOF

# RapidAPI Key
echo "📝 设置 RAPIDAPI_KEY..."
vercel env add RAPIDAPI_KEY production <<EOF
ab9b25a33dmsh9bbd3a16233f27dp1d0125jsn3cc5b2112be6
EOF

# RapidAPI Host
echo "📝 设置 RAPIDAPI_HOST..."
vercel env add RAPIDAPI_HOST production <<EOF
twitter241.p.rapidapi.com
EOF

# CRON Secret
echo "📝 设置 CRON_SECRET..."
vercel env add CRON_SECRET production <<EOF
8abc70c86c185e42ab38bda85251ef43700ba99bea2a2199806a34df1c477489
EOF

echo ""
echo "=========================================="
echo "✅ 环境变量配置完成！"
echo "=========================================="
echo ""
echo "当前配置的环境变量:"
vercel env ls production
echo ""
