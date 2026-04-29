# 雪球组合监控数据库设计说明

> **文件**：`xueqiu_portfolio.db`  
> **引擎**：SQLite 3  
> **创建时间**：2026-04-17

---

## ER 关系概览

```
portfolios (1) ──< portfolio_snapshots (N)
                       │
                       ├──< latest_rebalances (N)   ← 详情页"最新调仓"
                       └──< holdings (N)             ← 快照时间点持仓快照

portfolios (1) ──< rebalances (N)  ← 调仓历史（增量去重）

preflight_checks (N) ← 每次执行的前置检查状态（仅保留最新）
```

---

## 表结构

### 1. `portfolios` — 组合主表

存储雪球组合的基本信息，以组合代码为主键。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | TEXT | **PK** | 组合代码，如 `ZH1038353` |
| `name` | TEXT | | 组合名称 |
| `creator` | TEXT | | 主理人昵称 |
| `creator_url` | TEXT | | 主理人主页路径 |
| `create_date` | TEXT | | 组合创建日期 |
| `followers` | INTEGER | | 关注人数 |
| `description` | TEXT | | 组合描述/投资风格 |
| `updated_at` | TEXT | | 最后抓取时间（ISO 格式） |

---

### 2. `portfolio_snapshots` — 快照表

每次执行监控抓取时插入一条快照，用于净值曲线、收益率趋势分析。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | **PK AUTOINCREMENT** | 快照 ID |
| `portfolio_id` | TEXT | **FK → portfolios.id** | 所属组合 |
| `net_value` | REAL | | 单位净值 |
| `total_return` | REAL | | 总收益率（%） |
| `daily_return` | REAL | | 日收益率（%） |
| `monthly_return` | REAL | | 月收益率（%） |
| `rank_percent` | REAL | | 跑赢组合百分比（%） |
| `score` | INTEGER | | 业绩评分（0-100） |
| `cash_ratio` | REAL | | 现金比例（%） |
| `rebalance_count_3m` | INTEGER | | 近 3 月调仓次数 |
| `rebalance_profit_3m` | INTEGER | | 近 3 月盈利调仓次数 |
| `best_buy_3m` | TEXT | | 近 3 月最佳买入股票名称 |
| `snapshot_at` | TEXT | | 快照时间 |
| `latest_rebalance_time` | TEXT | | 最新调仓时间（冗余，便于查询） |
| `observations` | TEXT | | 自动生成的观察要点（操作风格/最近调仓/重仓变动/跨组合追踪） |

---

### 3. `latest_rebalances` — 最新调仓（快照级）

详情页顶部显示的最新一条调仓信息，挂载在快照下。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | **PK AUTOINCREMENT** | |
| `snapshot_id` | INTEGER | **FK → portfolio_snapshots.id** | 所属快照 |
| `stock_name` | TEXT | | 股票名称 |
| `stock_code` | TEXT | | 股票代码（如 `SH600989`） |
| `from_ratio` | REAL | | 调仓前仓位占比（%） |
| `to_ratio` | REAL | | 调仓后仓位占比（%） |
| `price` | REAL | | 参考成交价 |
| `rebalance_time` | TEXT | | 调仓时间 |

> 同一快照可能包含多只股票的同时调仓（同一次调仓操作）。

---

### 4. `holdings` — 持仓明细（快照级）

快照时间点的完整持仓结构，用于回溯任意时刻的仓位分布。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | **PK AUTOINCREMENT** | |
| `snapshot_id` | INTEGER | **FK → portfolio_snapshots.id** | 所属快照 |
| `portfolio_id` | TEXT | **FK → portfolios.id** | 所属组合（冗余，加速查询） |
| `sector` | TEXT | | 板块名称 |
| `sector_ratio` | REAL | | 板块总占比（%） |
| `stock_name` | TEXT | | 股票名称 |
| `stock_code` | TEXT | | 股票代码 |
| `price` | REAL | | 现价 |
| `daily_change` | REAL | | 日涨跌幅（%） |
| `position_ratio` | REAL | | 个股仓位占比（%） |

> 特殊持仓：`sector` 为 `现金` 时，其余字段为空。

---

### 5. `rebalances` — 调仓历史记录（增量）

所有历史调仓操作，按时间倒序排列。采用增量去重策略，同一调仓不重复写入。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | **PK AUTOINCREMENT** | |
| `portfolio_id` | TEXT | **FK → portfolios.id** | 所属组合 |
| `rebalance_time` | TEXT | | 调仓时间 |
| `stock_name` | TEXT | | 股票名称 |
| `stock_code` | TEXT | | 股票代码 |
| `from_ratio` | REAL | | 调仓前占比（%） |
| `to_ratio` | REAL | | 调仓后占比（%），0 = 清仓 |
| `price` | REAL | | 参考成交价 |
| `is_dividend` | INTEGER | DEFAULT 0 | 是否分红送配（1=是） |
| `is_cancelled` | INTEGER | DEFAULT 0 | 是否已取消（1=是） |
| `fetched_at` | TEXT | | 抓取时间 |

**唯一约束**：`UNIQUE(portfolio_id, rebalance_time, stock_code)`

---

### 6. `preflight_checks` — 前置检查状态（仅保留最新）

记录每次执行的 Step 0～3 前置检查结果，采用 `INSERT OR REPLACE` 保证只有最新状态。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | **PK AUTOINCREMENT** | |
| `snapshot_id` | INTEGER | **FK → portfolio_snapshots.id**，可为空 | 关联快照（检查失败时可为空） |
| `check_step` | TEXT | **PK** | 检查步骤标识（`step0`～`step3`） |
| `status` | TEXT | | 检查结果（`pass` / `fail` / `skip`） |
| `message` | TEXT | | 详细信息（失败原因或 `OK`） |
| `checked_at` | TEXT | | 检查时间（ISO 格式） |

**唯一约束**：`UNIQUE(check_step)`（配合 INSERT OR REPLACE 实现覆盖）

---

### 7. `cron_run_log` — Cron 执行日志（定时任务记录）

记录每次定时任务执行的 Step 2 比对结果，用于通知派发判断。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | **PK AUTOINCREMENT** | |
| `run_at` | TEXT | **PK** | 本次运行时间（ISO 格式） |
| `portfolio_id` | TEXT | **PK** | 组合代码 |
| `has_new_rebalance` | INTEGER | DEFAULT 0 | 0=无变化，1=有新调仓 |
| `new_stock` | TEXT | | 新调仓股票名称（无变化时为空） |
| `new_from` | REAL | | 调仓前仓位（无变化时为空） |
| `new_to` | REAL | | 调仓后仓位（无变化时为空） |
| `rebalance_time` | TEXT | | 调仓时间（无变化时为空） |
| `snapshot_id` | INTEGER | | 本次写入的快照 ID（可直接 JOIN portfolio_snapshots 查 observations） |
| `notified` | INTEGER | DEFAULT 0 | 0=未通知，1=已通知 |

**唯一约束**：`UNIQUE(run_at, portfolio_id)`

**FK**：`snapshot_id → portfolio_snapshots.id`（用于 JOIN 查询 observations）

---

## 约束与索引

| 类型 | 对象 | 说明 |
|------|------|------|
| **PK** | `portfolios.id` | 组合代码 |
| **PK** | `portfolio_snapshots.id` | 自增 |
| **PK** | `latest_rebalances.id` | 自增 |
| **PK** | `holdings.id` | 自增 |
| **PK** | `rebalances.id` | 自增 |
| **UNIQUE** | `rebalances(portfolio_id, rebalance_time, stock_code)` | 增量去重 |
| **FK** | `portfolio_snapshots.portfolio_id → portfolios.id` | |
| **FK** | `latest_rebalances.snapshot_id → portfolio_snapshots.id` | |
| **PK** | `preflight_checks.id` | 自增 |
| **FK** | `holdings.snapshot_id → portfolio_snapshots.id` | |
| **PK** | `cron_run_log.id` | 自增 |
| **UNIQUE** | `cron_run_log(run_at, portfolio_id)` | 执行批次去重 |
| **FK** | `cron_run_log.snapshot_id → portfolio_snapshots.id` | JOIN observations |

---

## 常用查询示例

```sql
-- 查询某组合最新快照
SELECT * FROM portfolio_snapshots
WHERE portfolio_id = 'ZH1038353'
ORDER BY snapshot_at DESC LIMIT 1;

-- 查询某快照的持仓分布
SELECT sector, SUM(position_ratio) as total
FROM holdings
WHERE snapshot_id = 1
GROUP BY sector;

-- 查询某组合近 30 天调仓频率
SELECT COUNT(DISTINCT rebalance_time) as days
FROM rebalances
WHERE portfolio_id = 'ZH1038355'
  AND rebalance_time >= '2026-03-18';

-- 查询某只股票的所有调仓记录（排除分红）
SELECT rebalance_time, from_ratio, to_ratio, price
FROM rebalances
WHERE stock_code = 'SH600989'
  AND is_dividend = 0
ORDER BY rebalance_time DESC;

-- 净值趋势（用于图表）
SELECT snapshot_at, net_value
FROM portfolio_snapshots
WHERE portfolio_id = 'ZH1038353'
ORDER BY snapshot_at;
```

---

## 数据写入策略

| 操作 | 策略 |
|------|------|
| 组合信息 | `INSERT OR REPLACE`，每次覆盖更新 |
| 快照 | 每次 `INSERT`，不做去重（保留历史曲线） |
| 最新调仓 | 随快照插入，同 snapshot_id |
| 持仓 | 随快照插入，同 snapshot_id |
| 调仓历史 | `INSERT OR IGNORE`，依赖 UNIQUE 约束去重 |
| 前置检查 | `INSERT OR REPLACE`，每次覆盖更新当前状态（仅保留最新） |
| Cron 执行日志 | `INSERT OR IGNORE`，按 `(run_at, portfolio_id)` 去重，不重复记录 |

---

## 初始数据统计

| 表 | 行数 | 说明 |
|---|---|---|
| `portfolios` | 2 | 价值投资长线组合 + 主题投资组合 |
| `portfolio_snapshots` | 2 | 首次快照（2026-04-17 17:04） |
| `latest_rebalances` | 2 | 每组合各 1 条 |
| `holdings` | 27 | 组合一 13 只 + 组合二 14 只 |
| `rebalances` | 99 | 组合一 49 条 + 组合二 50 条 |
| `preflight_checks` | 0 | 初始化为空，运行时写入 |
| `cron_run_log` | 0 | 运行时写入，首次执行为空 |
