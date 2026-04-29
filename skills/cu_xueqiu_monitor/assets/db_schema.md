# 雪球组合数据库表结构

本文档定义雪球组合监控技能使用的数据表结构、字段定义、约束和索引。

## 数据库路径
```
/root/.openclaw/workspace/aiplace/projects/admin-dashboard/db/xueqiu_portfolio.db
```

---

## 表：portfolios（组合基本信息）

### 字段定义
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|--------|------|
| id | TEXT | PRIMARY KEY | 组合代码（如 ZH1038353） |
| name | TEXT | NOT NULL | 组合名称 |
| updated_at | TEXT | NOT NULL | 最后更新时间（YYYY-MM-DD HH:MM） |

### 索引
- PRIMARY KEY: `id`

### 写入策略
- `INSERT OR REPLACE`：每次覆盖更新

---

## 表：portfolio_snapshots（组合快照）

### 字段定义
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|--------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 快照自增 ID |
| portfolio_id | TEXT | NOT NULL | 组合代码（外键） |
| net_value | TEXT | | 净值 |
| total_return | TEXT | | 总收益（如 +23.45%） |
| day_return | TEXT | | 今日收益（如 +1.23%） |
| month_return | TEXT | | 本月收益（如 -5.67%） |
| cash_ratio | TEXT | | 现金比例（如 15.50%） |
| owner | TEXT | | 主理人 |
| created_at | TEXT | NOT NULL | 组合创建时间 |
| rebalance_count_3m | INTEGER | | 近3月调仓次数 |
| profit_count | INTEGER | | 盈亏次数 |
| observations | TEXT | | 结构化观察要点（JSON 字符串） |
| updated_at | TEXT | NOT NULL | 更新时间 |

### 索引
- PRIMARY KEY: `id`
- INDEX: `idx_portfolio_updated` ON `(portfolio_id, updated_at DESC)`

### 写入策略
- `INSERT`：保留历史快照

---

## 表：holdings（持仓明细）

### 字段定义
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|--------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 自增 ID |
| snapshot_id | INTEGER | NOT NULL | 关联快照 ID |
| portfolio_id | TEXT | NOT NULL | 组合代码 |
| sector | TEXT | | 板块/行业（如"能源"、"现金"） |
| stock_name | TEXT | NOT NULL | 股票名称 |
| stock_code | TEXT | | 股票代码（如 SH600989） |
| position_ratio | TEXT | | 仓位占比（如 6.50%） |
| updated_at | TEXT | NOT NULL | 更新时间 |

### 索引
- PRIMARY KEY: `id`
- INDEX: `idx_snapshot` ON `(snapshot_id)`
- INDEX: `idx_portfolio` ON `(portfolio_id)`

### 写入策略
- `INSERT`：随快照插入

---

## 表：latest_rebalances（最新调仓记录）

### 字段定义
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|--------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 自增 ID |
| portfolio_id | TEXT | NOT NULL | 组合代码 |
| snapshot_id | INTEGER | NOT NULL | 关联快照 ID |
| rebalance_time | TEXT | NOT NULL | 调仓时间 |
| stock_name | TEXT | NOT NULL | 股票名称 |
| stock_code | TEXT | | 股票代码 |
| from_ratio | TEXT | | 调仓前比例 |
| to_ratio | TEXT | | 调仓后比例 |
| reference_price | TEXT | | 参考成交价 |
| is_dividend | INTEGER | DEFAULT 0 | 是否分红送配（1=是，0=否） |
| is_cancelled | INTEGER | DEFAULT 0 | 是否已取消（1=是，0=否） |

### 索引
- PRIMARY KEY: `id`
- INDEX: `idx_portfolio_snapshot` ON `(portfolio_id, snapshot_id)`

### 写入策略
- `INSERT`：随快照插入

---

## 表：rebalances（完整调仓历史）

### 字段定义
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|--------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 自增 ID |
| portfolio_id | TEXT | NOT NULL | 组合代码 |
| rebalance_time | TEXT | NOT NULL | 调仓时间 |
| stock_name | TEXT | NOT NULL | 股票名称 |
| stock_code | TEXT | | 股票代码 |
| from_ratio | TEXT | | 调仓前比例 |
| to_ratio | TEXT | | 调仓后比例 |
| reference_price | TEXT | | 参考成交价 |
| is_dividend | INTEGER | DEFAULT 0 | 是否分红送配 |
| is_cancelled | INTEGER | DEFAULT 0 | 是否已取消 |

### 约束
- UNIQUE: `(portfolio_id, rebalance_time, stock_name)` - 防止重复

### 索引
- PRIMARY KEY: `id`
- INDEX: `idx_portfolio_time` ON `(portfolio_id, rebalance_time DESC)`

### 写入策略
- `INSERT OR IGNORE`：基于 UNIQUE 约束增量去重

---

## 表：preflight_checks（前置检查状态）

### 字段定义
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|--------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 自增 ID |
| check_step | TEXT | NOT NULL | 检查步骤（step1/step2/step3/step4） |
| status | TEXT | NOT NULL | 状态（pass/fail） |
| message | TEXT | | 失败原因或 OK |
| checked_at | TEXT | NOT NULL | 检查时间 |
| snapshot_id | INTEGER | | 关联快照 ID（失败时为空） |

### 约束
- UNIQUE: `check_step` - 每个步骤只保留最新记录

### 索引
- PRIMARY KEY: `id`
- INDEX: `idx_step_time` ON `(check_step DESC, checked_at DESC)`

### 写入策略
- `INSERT OR REPLACE`：每次覆盖更新，只保留最新

---

## 表：cron_run_log（执行日志）

### 字段定义
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|--------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 自增 ID |
| snapshot_id | INTEGER | | 关联快照 ID |
| status | TEXT | NOT NULL | 执行状态 |
| message | TEXT | | 执行消息 |
| created_at | TEXT | NOT NULL | 创建时间 |

### 索引
- PRIMARY KEY: `id`

### 写入策略
- `INSERT`：记录每次执行

---

## ER 图概览

```
portfolios (1) ──┬─> portfolio_snapshots (*)
                 │   ├─> holdings (*)
                 │   └─> latest_rebalances (*)
                 └─> rebalances (*)

preflight_checks (*)    (独立表，无外键)
cron_run_log (*)         (独立表，记录执行日志)
```

---

## 关键约束说明

1. **快照去重（可选）**：
   - 在写入 `portfolio_snapshots` 前，按组合比对净值和总收益
   - 若最新快照的 `net_value` 和 `total_return` 完全一致，则跳过写快照
   - 这可减少数据库写入量

2. **调仓比对逻辑**：
   - 对比数据库 `latest_rebalances` 表与当前抓取的最新调仓
   - 完全一致（时间 + 股票 + 目标仓位）→ 判定为无新调仓
   - 有差异或无记录 → 继续执行调仓历史抓取

3. **observations 字段更新**：
   - 拿到 `snapshot_id` 后，**立即执行 UPDATE**，不依赖时间戳
   - SQL：`UPDATE portfolio_snapshots SET observations = ? WHERE id = ?`

4. **INSERT OR REPLACE vs INSERT OR IGNORE**：
   - `portfolios` 和 `preflight_checks`：使用 `INSERT OR REPLACE`（覆盖）
   - `rebalances`：使用 `INSERT OR IGNORE`（依赖 UNIQUE 约束）
