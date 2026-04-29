# 常见问题与使用示例

本文档包含雪球组合监控技能的常见问题排查、典型使用场景和操作示例。

---

## 前置检查问题排查

### 问题：今日非工作日，技能仍然执行
**症状**：收到通知「今日（日期）非中国工作日，技能暂停执行」，但用户期望执行
**排查步骤**：
1. 检查 `chinese_calendar` 库是否已安装：`pip3 list | grep chinese_calendar`
2. 手动判断：`python3 -c "import datetime; print(datetime.date.today().weekday())"`（0=周一，4=周五）
3. 查看 `preflight_checks` 表中 step1 的历史状态

**解决方案**：
- 如果不需要工作日限制，可在 SKILL.md 中移除 Step 1
- 安装缺失库：`pip3 install chinese-calendar`

---

### 问题：Win10 节点离线，技能一直失败
**症状**：收到通知「Win10 节点不在线，请检查节点是否正常运行」
**排查步骤**：
1. 检查 SSH 隧道是否连通：`ssh -o ConnectTimeout=5 win10-cdp "echo test"`
2. 检查 Chrome 进程是否运行：`ps aux | grep chrome`
3. 检查 CDP 端口是否监听：`curl -s http://127.0.0.1:18800/json/version`

**解决方案**：
- 重新启动 Win10 上的 Chrome：`chrome.exe --remote-debugging-port=18800`
- 检查防火墙规则，确保 18800 端口开放

---

### 问题：雪球登录态失效
**症状**：收到通知「雪球登录态已失效，请在 Win10 Chrome 上重新登录雪球」
**排查步骤**：
1. 在 Win10 Chrome 中打开 https://xueqiu.com/
2. 检查页面是否显示用户昵称（登录态）
3. 手动登录并刷新页面

**解决方案**：
- 在 Win10 Chrome 上手动登录一次即可，技能复用浏览器登录态
- 考虑延长登录态有效期（勾选「自动登录」）

---

## 数据采集问题

### 问题：组合列表为空
**症状**：Step 5 返回空数组 `{"portfolios": []}`
**排查步骤**：
1. 检查页面是否加载完成：`navigate` 后 `snapshot` 检查关键元素
2. 检查 DOM 选择器是否变化（雪球可能更新页面结构）
3. 检查是否需要滚动加载

**解决方案**：
- 参考 `references/browser_ops.md` 更新 DOM 选择器
- 使用兜底正则匹配 ZH/SN 开头的组合代码

---

### 问题：调仓历史记录不完整
**症状**：Step 7 返回的记录数少于预期
**排查步骤**：
1. 检查是否所有折叠条目都已展开（日志中输出展开数量）
2. 检查是否需要点击「查看更多」加载更多历史
3. 检查正则表达式是否正确解析调仓详情

**解决方案**：
- 增加 `evaluate` 中的等待时间到 2000ms
- 检查并点击「查看更多」按钮
- 参考 `references/browser_ops.md` 调整正则

---

### 问题：数据库写入失败
**症状**：Step 9 报错或数据未持久化
**排查步骤**：
1. 检查数据库文件权限：`ls -l /root/.openclaw/workspace/aiplace/projects/admin-dashboard/db/`
2. 检查数据库表是否存在：`sqlite3 xueqiu_portfolio.db ".tables"`
3. 检查 INSERT 语句字段数量是否匹配表结构

**解决方案**：
- 确保数据库目录存在：`mkdir -p db`
- 参考 `references/db_schema.md` 验证表结构
- 使用 `INSERT OR IGNORE` 避免重复数据冲突

---

## 典型使用场景

### 场景 1：首次执行完整流程
```bash
# 1. 前置检查
node status
python3 -c "
import chinese_calendar, datetime
on_holiday, _ = chinese_calendar.is_holiday(datetime.date.today())
print('NOT_WORKDAY' if on_holiday else 'WORKDAY')
"

# 2. 浏览器采集（通过 CDP）
curl -s http://127.0.0.1:18800/json/version
# ... navigate + evaluate 操作

# 3. 调仓比对
# 读取 latest_rebalances 表，与当前抓取的最新调仓比对

# 4. 数据写入
python3 scripts/database_writer.py --json < data.json
```

### 场景 2：仅查看组合详情（不写入数据库）
```bash
# 1. 直接导航到组合详情页
navigate http://127.0.0.1:18800 -> https://xueqiu.com/P/ZH1038353

# 2. 提取数据
evaluate --javascript "..." > portfolio_detail.json
```

### 场景 3：前置检查失败后退出
```bash
# Step 2 失败：Win10 节点离线
# → 立即退出，不执行后续步骤
# → 记录到 preflight_checks（status='fail'）
# → 与上次比对，若状态未变化则不通知
```

---

## 调试技巧

### 查看浏览器操作日志
```bash
# 浏览器操作会输出到日志
tail -f /root/.openclaw/logs/browser.log
```

### 手动测试 JavaScript 代码
```javascript
// 在 Chrome DevTools Console 中测试
// 直接粘贴 evaluate 中的 JS 代码，检查返回值
```

### 查询数据库验证写入
```bash
sqlite3 /root/.openclaw/workspace/aiplace/projects/admin-dashboard/db/xueqiu_portfolio.db \
  "SELECT * FROM portfolio_snapshots ORDER BY id DESC LIMIT 5"
```

---

## 执行状态通知模板

### 前置检查失败通知
```
❌ 今日（2025-04-20）非中国工作日，技能暂停执行
❌ Win10 节点不在线，请检查节点是否正常运行
❌ Chrome CDP 连接失败（端口 18800），请检查 SSH 隧道或 Chrome 进程
❌ 雪球登录态已失效，请在 Win10 Chrome 上重新登录雪球
```

### 正常执行完成通知
```
✅ 组合监控完成
📊 组合一：名称
   最新净值：2.34 元
   最新调仓：宝丰能源 4.55%→6%（28.42）
📊 组合二：名称
   最新净值：1.89 元
   最新调仓：无
【跨组合】共同重仓：宝丰能源、中国神华
【近期重点动作】组合一大幅建仓宝丰能源（1.45%）
```
