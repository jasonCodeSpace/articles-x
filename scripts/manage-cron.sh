#!/bin/bash

# 管理 fix-all-broken-slugs.ts 的 cronjob

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CRONTAB_FILE="$SCRIPT_DIR/crontab-fix-slugs"
CRON_SCRIPT="$SCRIPT_DIR/cron-fix-slugs.sh"
LOG_FILE="/tmp/fix-slugs-cron.log"

case "$1" in
    "install")
        echo "安装 cronjob..."
        # 备份当前的 crontab
        crontab -l > /tmp/crontab.backup 2>/dev/null || true
        
        # 检查是否已经存在相同的任务
        if crontab -l 2>/dev/null | grep -q "fix-all-broken-slugs"; then
            echo "⚠️  cronjob 已经存在，跳过安装"
        else
            # 添加新的 cron 任务
            (crontab -l 2>/dev/null; cat "$CRONTAB_FILE") | crontab -
            echo "✅ cronjob 安装成功！每 5 分钟运行一次 fix-all-broken-slugs.ts"
            echo "📝 日志文件: $LOG_FILE"
        fi
        ;;
    "uninstall")
        echo "卸载 cronjob..."
        # 移除包含 fix-all-broken-slugs 的行
        crontab -l 2>/dev/null | grep -v "fix-all-broken-slugs" | crontab -
        echo "✅ cronjob 卸载成功"
        ;;
    "status")
        echo "当前 cronjob 状态:"
        if crontab -l 2>/dev/null | grep -q "fix-all-broken-slugs"; then
            echo "✅ cronjob 已安装并运行中"
            echo "当前 cron 任务:"
            crontab -l 2>/dev/null | grep "fix-all-broken-slugs"
        else
            echo "❌ cronjob 未安装"
        fi
        ;;
    "logs")
        echo "查看最近的日志:"
        if [ -f "$LOG_FILE" ]; then
            tail -50 "$LOG_FILE"
        else
            echo "日志文件不存在: $LOG_FILE"
        fi
        ;;
    "test")
        echo "测试运行脚本..."
        "$CRON_SCRIPT"
        ;;
    *)
        echo "用法: $0 {install|uninstall|status|logs|test}"
        echo ""
        echo "命令说明:"
        echo "  install   - 安装 cronjob（每 5 分钟运行一次）"
        echo "  uninstall - 卸载 cronjob"
        echo "  status    - 查看 cronjob 状态"
        echo "  logs      - 查看运行日志"
        echo "  test      - 手动测试运行脚本"
        exit 1
        ;;
esac