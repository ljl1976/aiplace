---
name: cu-xueqiu-monitor
description: |
  雪球组合监控技能。获取雪球自选组合列表、组合详情（仓位+最新调仓）、完整调仓历史记录。
  当用户提到「雪球组合」「组合监控」「自选组合」「调仓历史」「查看组合」「雪球仓位」「组合详情」「xueqiu portfolio」时触发。
  必须通过 Win10 节点 CDP 直连浏览器操作，不依赖雪球 API。
---

# 雪球组合监控

通过 Win10 节点 CDP 直连 Chrome 浏览器，获取雪球组合的完整数据。

## 核心设计理念

| # | 理念 | 说明 |
|---|------|------|
| 1 | 浏览器直连优先 | 必须通过 Win10 CDP 直连 Chrome，避免超时 |
| 2 | 原子写入 | 数据完整性校验通过后才写入数据库，避免脏数据 |
| 3 | 重试机制 | 最多重试3次（5秒、10秒、15秒退避） |
| 4 | 增量优于全量 | 仅记录变化，无新调仓时跳过历史抓取 |
| 5 | 状态变化驱动通知 | 前置检查结果只在新状态出现时推送 |

## AI 开发者使用 SOP

### 标准使用流程

**前置检查失败处理**：
- 任意 Step 1～4 失败 → 立即退出，不执行后续步骤，通知用户具体原因（若该失败为状态变化，则本次通知；若状态未变化则不重复通知）

**数据采集流程**：
- Step 5：`navigate` + `evaluate` 提取组合列表
- Step 6：`navigate` + `evaluate` 提取组合详情（包含最新调仓）
- **Step 6.5：立即调仓比对**（读取数据库 latest_rebalances，与 Step 6 获取的最新调仓比对）
- Step 7：**仅在有新调仓时**批量展开 + `evaluate` 提取调仓历史
- 所有操作使用 `node=Win10`、`target=node`

**调仓比对决策（Step 6.5）**：
- 读取 `latest_rebalances` 表，与当前最新调仓比对
- 完全一致 → 判定为无新调仓，**跳过 Step 7**，直接进入数据完整性校验
- 有差异或无记录 → 判定为有新调仓，执行 Step 7

**数据完整性校验**：
- **必须在写入数据库前执行**，防止脏数据
- 检查项包括：
  - `portfolios`、`snapshots`、`holdings` 不为空
  - `net_value`、`total_return`、`day_return` 不为空
  - 每个组合至少1个持仓
  - 非现金持仓数量 > 0
- **校验失败 → 重试（最多3次）**
- **校验通过 → 原子写入数据库**

**数据库写入策略**：
- 调用 `scripts/database_writer.py --json <data>`
- 传入完整 JSON 数据，包含 snapshot_id、组合列表、快照等

**观察要点生成**：
- 调用 `scripts/observations_generator.py --json <data>`
- 传入 portfolio_list、holdings_map、rebalances_map
- 返回结构化洞察（操作风格、调仓节奏、行业配置、风险评估等）

---

## 核心示例

### 示例 1：无新调仓场景（跳过 Step 7）

**场景**：Step 6 获取的最新调仓与数据库记录完全一致

**执行步骤**：
1. 调用 `scripts/check_workday.py` → 返回 WORKDAY
2. 调用 `scripts/preflight_checks.py --json <current_checks>` → 比对状态，无变化
3. Win10 浏览器操作：
   - Step 5：`navigate https://xueqiu.com/` + `evaluate` 提取组合列表
   - Step 6：`navigate https://xueqiu.com/P/ZH1038353` + `evaluate` 提取详情
4. **Step 6.5：调仓比对**
   ```bash
   echo '{"portfolio_id": "ZH1038353", "current_rebalance": {"stock_name": "兴业银锡", "rebalance_time": "2026-04-24 14:00:02", "to_ratio": 5.0}}' | \
   python3 /root/.openclaw/workspace/skills/cu_xueqiu_monitor/scripts/rebalance_comparator.py --json
   ```
   - 返回：`{"has_new_rebalance": false, "last_rebalance": {...}, "reason": "调仓完全一致"}`
5. **决策**：跳过 Step 7，直接进入数据完整性校验
6. 完整性校验通过 → 原子写入数据库
7. 调用 `scripts/observations_generator.py --json <data>` 生成观察要点

**预期输出**：
```
✅ 组合监控完成（无新调仓，跳过历史抓取）
📊 组合：主题投资组合（ZH1038353）
   最新净值：8.8951
   最新调仓：兴业银锡 0.93%→5.00%（与上次一致）

【观察要点】
操作风格：高频波段 · 近1月调仓 37 次
  调仓频繁，短线为主，换手率高

调仓节奏：时间分布：早盘1 午盘0 尾盘1 盘后0
  节奏：数据不足
  追涨型（倾向于加仓上涨股）
  估算换手率：平均每次 0.2%

行业配置：新能源:15.3%、有色金属:5.0%——主要持仓在新能源
  集中度：高度集中（HHI=0.63）

近期动作：
  • 加仓 兴业银锡 0.9% -> 5.0%
  • 加仓 宁德时代 12.0% -> 15.3%

风险评估：
  • 仓位与行业双集中（高度集中）
  • 持仓数量偏少 3 只
```

**性能提升**：跳过 Step 7，节省 3-5 分钟浏览器操作时间

---

### 示例 2：有新调仓场景（执行完整流程）

**场景**：Step 6 获取的最新调仓与数据库记录有差异

**执行步骤**：
1-3. 同示例 1
4. **Step 6.5：调仓比对** → 返回：`{"has_new_rebalance": true, "reason": "调仓有变化"}`
5. **决策**：执行 Step 7（展开历史抓取）
6. Step 7：批量展开 + `evaluate` 提取调仓历史
7. Step 8：完整调仓比对（与数据库 rebalances 表比对）
8. 完整性校验 → 原子写入数据库
9. 调用 `scripts/observations_generator.py --json <data>` 生成观察要点

**预期输出**：
```
✅ 组合监控完成（发现新调仓）
📊 组合：主题投资组合（ZH1038353）
   最新净值：8.8951
   最新调仓：兴业银锡 0.93%→5.00%（新增）

【观察要点】
操作风格：高频波段 · 近1月调仓 37 次
  调仓频繁，短线为主，换手率高
...

近期动作：
  • 建仓 兴业银锡 0.93% -> 5.00%
```

---

### 示例 3：前置检查失败场景

**用户请求**："查看雪球组合"

**前置检查结果**：Step 2 失败（Win10 节点离线）

**预期输出**：
```
❌ Win10 节点不在线，请检查节点是否正常运行

前置检查详情：
- Step 1（工作日）：✅ PASS
- Step 2（节点在线）：❌ FAIL - 节点连接超时
- Step 3（CDP 可达）：N/A（已失败退出）
- Step 4（登录态）：N/A（已失败退出）
```

---

### 示例 4：数据完整性校验失败场景

**场景**：网页加载不完整，holdings 数据为空

**执行步骤**：
1. Step 1-6 正常执行
2. 数据完整性校验：holdings 数据为空
3. **第1次尝试**：校验失败 → 等待5秒 → 重试
4. **第2次尝试**：校验失败 → 等待10秒 → 重试
5. **第3次尝试**：校验失败 → **不保存任何数据** → 退出

**预期输出**：
```
============================================================
第 1 次尝试...
============================================================
🔍 开始数据完整性校验...
❌ 数据完整性校验失败（共 1 个问题）：
   • holdings 数据为空（无法写入数据库）

等待 5 秒后重试...

============================================================
第 2 次尝试...
============================================================
🔍 开始数据完整性校验...
❌ 数据完整性校验失败（共 1 个问题）：
   • holdings 数据为空（无法写入数据库）

等待 10 秒后重试...

============================================================
第 3 次尝试...
============================================================
🔍 开始数据完整性校验...
❌ 数据完整性校验失败（共 1 个问题）：
   • holdings 数据为空（无法写入数据库）

============================================================
❌ 第 3 次尝试仍然失败，不保存任何数据到数据库
============================================================
```

---

## 执行流程

### 1. 前置检查
调用 `scripts/preflight_checks.py`，执行以下检查：
- Step 1：中国工作日判断（调用 `scripts/check_workday.py`）
- Step 2：Win10 节点在线（调用 `nodes status`）
- Step 3：Chrome CDP 可达（调用 `exec curl ...`）
- Step 4：雪球登录态有效（调用 `navigate` + `snapshot`）

**失败处理**：任意步骤失败 → 立即退出，通知用户具体原因

---

### 2. 数据采集（通过 data_collector.py）

通过 Win10 节点浏览器操作（`node=Win10`, `target=node`）：

- **Step 5：获取自选组合列表**
  - `navigate` → https://xueqiu.com/
  - `evaluate` → 提取组合名称和代码（参考 `references/browser_ops.md`）

- **Step 6：获取组合详情页**
  - `navigate` → https://xueqiu.com/P/{组合代码}
  - `evaluate` → 提取净值、总收益、最新调仓、持仓明细

- **Step 7：获取调仓历史记录**（仅在有新调仓时）
  - `evaluate` → 批量展开 + 一次性提取所有数据
  - 可选：点击「查看更多」加载更多历史

---

### 3. 调仓比对（Step 6.5 - 提前决策）

- **时机**：Step 6 获取最新调仓后立即比对，**在浏览器会话中完成**
- **比对逻辑**：读取 `latest_rebalances` 表，对比最新调仓时间和内容
- **判断标准**：
  - 完全一致：最新调仓的时间（YYYY-MM-DD HH:MM:SS）+ 股票名称 + 目标仓位与数据库记录完全相同
  - 有差异：存在差异或数据库无记录
- **数据来源**：数据库中的 `latest_rebalances` 表（由上一次执行写入）
- **决策结果**：
  - 完全一致 → 判定为无新调仓，**跳过 Step 7**，标记 `has_new_rebalance=0`，直接进入数据完整性校验
  - 有差异或无记录 → 判定为有新调仓，标记 `has_new_rebalance=1`，继续执行 Step 7

**性能优化**：
- 无新调仓时，跳过 Step 7（调仓历史展开），可节省 3-5 分钟浏览器操作时间
- 比对逻辑在浏览器会话中完成，避免额外的数据库连接开销

---

### 4. 数据完整性校验

**必须在写入数据库前执行**，防止脏数据残留。

**校验清单**：
- ✅ `portfolios` 不为空
- ✅ `snapshots` 不为空
- ✅ `holdings` 不为空（**关键！**）
- ✅ `net_value` 不为空
- ✅ `total_return` 不为空
- ✅ `day_return` 不为空
- ✅ 每个组合至少1个持仓
- ✅ 非现金持仓数量 > 0

**校验结果处理**：
- 校验通过 → 原子写入数据库
- 校验失败 → 重试（最多3次，5秒、10秒、15秒退避）
- 3次都失败 → 不保存任何数据 → 退出

---

### 5. 数据写入

调用方式：通过 `exec` 执行 Python 脚本，使用 heredoc 传入 JSON 数据

- **数据格式**：
  ```json
  {
    "snapshot_id": int|null,
    "portfolios": [{"id", "name"}],
    "snapshots": [{"portfolio_id", "net_value", "total_return", ...}],
    "latest_rebalances": [{"portfolio_id", "rebalance_time", "stock_name", ...}],
    "holdings": [{"portfolio_id", "snapshot_id", "sector", "stock_name", ...}],
    "rebalances": [{"portfolio_id", "rebalance_time", ...}],
    "preflight_checks": [["step1", "pass", "message", timestamp, snapshot_id]],
    "cron_run_log": [{
      "portfolio_id": "ZH1038353",
      "has_new_rebalance": 1,
      "new_stock": "兴业银锡",
      "new_from": 0.93,
      "new_to": 5.0,
      "rebalance_time": "2026-04-24 14:00:02"
    }]
  }
  ```

**写入表说明**：
- `portfolios`（组合基本信息）
- `portfolio_snapshots`（组合快照）
- `latest_rebalances`（最新调仓）
- `holdings`（持仓明细）
- `rebalances`（完整调仓历史）
- `preflight_checks`（前置检查状态）
- `cron_run_log`（执行记录，包含 has_new_rebalance 标志）

---

### 6. 观察要点

调用 `scripts/observations_generator.py --json <data>`，传入 portfolio_list、holdings_map、rebalances_map

**输出内容（6大模块）**：
- **调仓节奏**：时间分布、市场节奏、盈利风格、换手率
- **行业配置**：行业分布、集中度（HHI）
- **近期动作**：最新4次调仓明细
- **风险评估**：单股仓位、行业集中度、持仓数量、现金比例
- **跨组合对比**：共同重仓、行业信号、仓位差异
- **重点动作**：最大幅度调仓

---

## 核心约束

- ❌ **不要用 `browser open`**：用 `navigate` 替代
- ✅ **优先 `evaluate` 替代 `snapshot`**：减少 CDP 往返
- ✅ **调仓历史展开 + 提取合并执行**：在同一次 `evaluate` 里完成
- ✅ **所有浏览器操作**：使用 `node=Win10`、`target=node`
- ✅ **原子写入**：完整性校验通过后才写入数据库
- ✅ **重试机制**：最多重试3次（5秒、10秒、15秒退避）

---

## 切入点

| 需求场景 | 操作要点 |
|---------|---------|
| 排查前置检查问题 | 查阅 `references/browser_ops.md` → 前置条件章节 |
| 修改数据库表结构 | 查阅 `references/db_schema.md` → 更新表定义 + 同步修改脚本 |
| 调整观察要点生成逻辑 | 编辑 `scripts/observations_generator.py`，直接调用测试 |
| 调整浏览器操作 JS | 编辑 `references/browser_ops.md`，同步更新 SKILL.md 中的调用示例 |
| 数据完整性校验问题 | 查阅 `ATOMIC_WRITE_SOLUTION.md` → 完整方案文档 |
| 常见问题排查 | 查阅 `references/examples.md` → 常见问题章节 |

---

## 统一执行入口

**推荐调用方式**：
```bash
# 调用统一执行入口（带重试机制）
python3 /root/.openclaw/workspace/skills/cu_xueqiu_monitor/scripts/main_runner.py

# 自定义重试次数
python3 /root/.openclaw/workspace/skills/cu_xueqiu_monitor/scripts/main_runner.py 5
```

**执行流程**：
1. 前置检查（Step 1-4）
2. 数据采集（Step 5-8）→ 内存（不保存数据库）
3. 完整性校验
4. 校验失败 → 重试（最多3次）
5. 校验通过 → 原子写入数据库
6. 生成观察要点

**优势**：
- 原子写入（全有或全无）
- 数据完整性校验（防止脏数据）
- 重试机制（最多3次，指数退避）
- 统一日志（便于排查）
