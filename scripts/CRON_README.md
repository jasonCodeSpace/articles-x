# Cronjob 自动修复 Slug

这个目录包含了用于自动修复文章 slug 格式的 cronjob 配置和管理脚本。

## 文件说明

- `fix-all-broken-slugs.ts` - 主要的修复脚本
- `cron-fix-slugs.sh` - Cron 执行的 shell 脚本
- `crontab-fix-slugs` - Crontab 配置文件
- `manage-cron.sh` - Cronjob 管理脚本

## 使用方法

### 1. 安装 Cronjob

```bash
./scripts/manage-cron.sh install
```

这将安装一个每 5 分钟运行一次的 cronjob，自动检查和修复错误格式的文章 slug。

### 2. 查看状态

```bash
./scripts/manage-cron.sh status
```

### 3. 查看运行日志

```bash
./scripts/manage-cron.sh logs
```

### 4. 手动测试

```bash
./scripts/manage-cron.sh test
```

### 5. 卸载 Cronjob

```bash
./scripts/manage-cron.sh uninstall
```

## 日志文件

运行日志保存在 `/tmp/fix-slugs-cron.log`，包含每次运行的时间戳和结果。

## 注意事项

1. 确保项目的环境变量文件 `.env.local` 存在且配置正确
2. 确保有足够的数据库访问权限
3. Cronjob 会在后台静默运行，通过日志文件查看运行结果
4. 如果需要修改运行频率，编辑 `crontab-fix-slugs` 文件中的时间配置

## 时间配置说明

当前配置 `*/5 * * * *` 表示每 5 分钟运行一次。

格式: `分钟 小时 日 月 星期`

例如:
- `*/10 * * * *` - 每 10 分钟
- `0 * * * *` - 每小时
- `0 0 * * *` - 每天午夜