# 浏览器操作参考文档

本文档包含雪球组合监控所需的 JavaScript 代码片段、正则表达式和 DOM 查询方法。

---

## 约束条件

- ✅ **优先使用 `evaluate` 替代 `snapshot`**：减少 CDP 往返
- ✅ **所有浏览器操作**：使用 `node=Win10`、`target=node`
- ❌ **不要用 `browser open`**：容易超时，用 `navigate` 替代
- ⚠️ **JS 中避免使用模板字符串**（反引号）：Playwright 会报错，用字符串拼接替代

---

## Step 5：组合列表 + 登录态

### 操作流程
1. `navigate` → https://xueqiu.com/
2. `evaluate` → 一次拿齐组合代码和登录状态

### JavaScript 代码
```javascript
() => {
  var items = document.querySelectorAll('.stock-item .stock-name a, .portfolio-item a[href*="/P/"]');
  var result = [];
  for (var i = 0; i < items.length; i++) {
    var el = items[i];
    var href = el.getAttribute('href') || '';
    var name = el.innerText.trim();
    var match = href.match(/\/P\/(ZH\d+|SN\d+)/);
    if (match) result.push({name: name, code: match[1]});
  }
  // 兜底：从页面文本中正则匹配 ZH/SN 数字
  if (result.length === 0) {
    var text = document.body.innerText;
    var re = /(ZH\d+|SN\d+)/g;
    var m;
    var seen = {};
    while ((m = re.exec(text)) !== null) {
      if (!seen[m[0]]) { seen[m[0]] = true; result.push({name: '', code: m[0]}); }
    }
  }
  return JSON.stringify(result);
}
```

### 返回格式
```json
{
  "portfolios": [
    {"name": "组合名称", "code": "ZH1038353"},
    ...
  ],
  "nickname": "用户昵称"
}
```

---

## Step 6：组合详情页（仓位 + 最新调仓）

### 操作流程
1. `navigate` → https://xueqiu.com/P/{组合代码}
2. `evaluate` → 一次拿齐所有数据

### JavaScript 代码
```javascript
() => {
  var result = {};
  var text = document.body.innerText;

  // 净值 + 总收益
  var nvMatch = text.match(/净值[^\d]*([\d.]+)/);
  var trMatch = text.match(/总收益[^\d]*([+-][\d.]+%)/);
  result.net_value = nvMatch ? nvMatch[1] : '';
  result.total_return = trMatch ? trMatch[1] : '';

  // 日收益 + 月收益
  var dayMatch = text.match(/今日[^\d]*([+-][\d.]+%)/);
  var monMatch = text.match(/本月[^\d]*([+-][\d.]+%)/);
  result.day_return = dayMatch ? dayMatch[1] : '';
  result.month_return = monMatch ? monMatch[1] : '';

  // 现金比例
  var cashMatch = text.match(/现金[^\d]*([\d.]+%)/);
  result.cash_ratio = cashMatch ? cashMatch[1] : '';

  // 主理人
  var ownerMatch = text.match(/主理人[：:]\s*([^\n]+)/);
  result.owner = ownerMatch ? ownerMatch[1].trim() : '';

  // 创建时间
  var createdMatch = text.match(/创建于[\s\S]{0,20}(20\d{2}[.年]\d{1,2}[.月]\d{1,2})/);
  result.created_at = createdMatch ? createdMatch[1] : '';

  // 最新调仓
  var rebMatch = text.match(/最新调仓[\s\S]{0,50}((?:[\u4e00-\u9fa5]+\s*SH|SZ)\d+[^\n]*)/);
  result.latest_rebalance_text = rebMatch ? rebMatch[0] : '';

  // 详细持仓
  var holdingItems = [];
  var rows = document.querySelectorAll('.stock-item, tr[class*="holding"]');
  for (var i = 0; i < rows.length && holdingItems.length < 30; i++) {
    var row = rows[i];
    var nameEl = row.querySelector('.stock-name a, .name, [class*="name"]');
    var codeEl = row.querySelector('.stock-code, .code, [class*="code"]');
    var pctEl = row.querySelector('.percent, [class*="percent"], [class*="ratio"]');
    if (nameEl) {
      holdingItems.push({
        name: nameEl.innerText.trim(),
        code: codeEl ? codeEl.innerText.trim() : '',
        pct: pctEl ? pctEl.innerText.trim() : ''
      });
    }
  }
  result.holdings = holdingItems;

  // 近3月调仓次数 + 盈亏次数
  var count3mMatch = text.match(/(?:近3月|近三月|最近三个月)调仓[^\d]*(\d+)次/);
  var profitMatch = text.match(/盈(?:盈利)?\s*[\d]+\s*(?:次|次)?[^\d]*(\d+)/);
  result.rebalance_count_3m = count3mMatch ? count3mMatch[1] : '';
  result.profit_count = profitMatch ? profitMatch[1] : '';

  return JSON.stringify(result);
}
```

### 返回格式
```json
{
  "net_value": "净值",
  "total_return": "+23.45%",
  "day_return": "+1.23%",
  "month_return": "-5.67%",
  "cash_ratio": "15.50%",
  "owner": "主理人",
  "created_at": "2024.01.月15",
  "latest_rebalance_text": "最新调仓（ 2025-04-15 ）宝丰能源...",
  "rebalance_count_3m": "12",
  "profit_count": "8",
  "holdings": [
    {"name": "宝丰能源", "code": "SH600989", "pct": "6.00%"},
    ...
  ]
}
```

---

## Step 7：调仓历史记录（批量展开 + 提取）

### 操作流程
1. `evaluate` → 查找「调仓历史记录」链接
2. `evaluate` → 批量点击展开所有折叠条目
3. `evaluate` → 等待 1500ms 后一次性提取所有数据
4. `evaluate`（可选）→ 点击「查看更多」加载更多历史

### JavaScript 代码（批量展开 + 提取合并执行）
```javascript
() => {
  // 1. 批量展开所有折叠条目
  var items = document.querySelectorAll('.rebalance-time');
  for (var i = 0; i < items.length; i++) items[i].click();

  // 2. 等待展开（同步等待 1500ms）
  var start = Date.now();
  while (Date.now() - start < 1500) {}

  // 3. 提取所有调仓记录
  var rebItems = document.querySelectorAll('.rebalance-time');
  var records = [];
  for (var i = 0; i < rebItems.length; i++) {
    var el = rebItems[i];
    var next = el.nextElementSibling;
    var detail = next ? next.innerText.trim().replace(/\n/g, ' | ') : 'none';
    var time = el.innerText.trim().replace(/\n/g, ' ');
    var cancelled = time.indexOf('已取消') !== -1;
    records.push({t: time, d: detail, cancelled: cancelled});
  }

  // 4. 尝试点击「查看更多」加载更多历史
  var moreBtn = document.querySelector('.load-more a, a[href*="loadMore"], .rebalance-more a');
  if (moreBtn) { moreBtn.click(); }

  return JSON.stringify({count: records.length, records: records});
}
```

### 返回格式
```json
{
  "count": 45,
  "records": [
    {
      "t": "2025-04-15 14:30",
      "d": "宝丰能源 SH600989 4.55%→6%（28.42）",
      "cancelled": false
    },
    ...
  ]
}
```

### 调仓详情解析正则

从 `d` 字段中提取调仓详情：
```javascript
// 例：宝丰能源 SH600989 4.55%→6%（28.42）
var match = detail.match(/(\S+)(SH|SZ)\d+([\d.]+)%([\d.]+)%参考成交价\s*([\d.]+)/);
if (match) {
  return {
    stock_name: match[1],
    stock_code: match[1] + match[2],
    from_ratio: match[3],
    to_ratio: match[4],
    reference_price: match[5]
  };
}
```

### 分红送配检测
- `d` 中不含百分比变化 → 标记 `is_dividend=1`，`from_ratio=0, to_ratio=0`
- `t` 中包含「已取消」→ 标记 `is_cancelled=1`

---

## Step 6.5：调仓比对（提前决策）

### 操作流程
1. **在 Step 6 后立即执行**：使用浏览器会话中的最新调仓数据
2. **读取数据库**：通过 Python 脚本读取 `latest_rebalances` 表
3. **比对决策**：返回 `has_new_rebalance` 标志，决定是否执行 Step 7

### Python 比对代码
```python
import sqlite3
import json

def compare_latest_rebalance(portfolio_id, current_rebalance):
    """
    比对最新调仓

    Args:
        portfolio_id: 组合代码（如 ZH1038355）
        current_rebalance: dict - 当前最新调仓
            {
                'stock_name': '兴业银锡',
                'rebalance_time': '2026-04-24 14:00:02',
                'to_ratio': 5.0
            }

    Returns:
        dict - {has_new_rebalance: bool, last_rebalance: dict|null}
    """
    DB_PATH = '/root/.openclaw/workspace/aiplace/projects/admin-dashboard/db/xueqiu_portfolio.db'
    db = sqlite3.connect(DB_PATH)
    c = db.cursor()

    # 读取最新的调仓记录（同一组合，按时间倒序取第一条）
    c.execute(
        "SELECT stock_name, rebalance_time, to_ratio FROM latest_rebalances "
        "WHERE portfolio_id = ? ORDER BY rebalance_time DESC LIMIT 1",
        (portfolio_id,)
    )
    row = c.fetchone()
    db.close()

    if row is None:
        # 数据库无记录，判定为新调仓
        return {'has_new_rebalance': True, 'last_rebalance': None}

    last_rebalance = {
        'stock_name': row[0],
        'rebalance_time': row[1],
        'to_ratio': row[2]
    }

    # 比对：时间 + 股票名称 + 目标仓位完全一致才判定为无新调仓
    is_same = (
        last_rebalance['rebalance_time'] == current_rebalance.get('rebalance_time') and
        last_rebalance['stock_name'] == current_rebalance.get('stock_name') and
        last_rebalance['to_ratio'] == current_rebalance.get('to_ratio')
    )

    return {
        'has_new_rebalance': not is_same,
        'last_rebalance': last_rebalance
    }
```

### 调用方式
```bash
# 在 Step 6 获取最新调仓后，立即调用比对
python3 -c "
import sys
sys.path.insert(0, '/root/.openclaw/workspace/skills/cu_xueqiu_monitor/scripts')
from rebalance_comparator import compare_latest_rebalance

result = compare_latest_rebalance('ZH1038355', {
    'stock_name': '兴业银锡',
    'rebalance_time': '2026-04-24 14:00:02',
    'to_ratio': 5.0
})
print(json.dumps(result))
"
```

### 返回格式
```json
{
    "has_new_rebalance": false,
    "last_rebalance": {
        "stock_name": "兴业银锡",
        "rebalance_time": "2026-04-24 14:00:02",
        "to_ratio": 5.0
    }
}
```

### 决策逻辑
- `has_new_rebalance=true` → 执行 Step 7（展开调仓历史）
- `has_new_rebalance=false` → 跳过 Step 7，直接进入 Step 9

---

## 常见问题排查

### navigate 后被重定向到首页
**原因**：Chrome 登录态过期
**解决**：在 Win10 Chrome 上重新登录雪球

### 调仓历史面板不显示
**原因**：未点击「调仓历史记录」链接
**解决**：确认已点击链接，等待面板加载

### 点击时间条目后无详情
**原因**：等待时间不足，或 DOM 结构变化
**解决**：等待 2-3 秒后重试，或检查 slided class

### evaluate 报 Unexpected end of input
**原因**：JS 中使用反引号模板字符串
**解决**：改用字符串拼接，如 `result.text = "..." + variable`

### snapshot 返回不完整数据
**原因**：页面未完全加载
**解决**：先 `evaluate` 检查关键元素是否存在，再 snapshot
