#!/usr/bin/env python3
"""
数据库写入逻辑 - 优化版
支持两种模式：
1. --insert-only: 仅插入快照和基础数据，返回 snapshot_id
2. --update-observations: 更新指定 snapshot_id 的 observations 字段
输入：包含 snapshot_id、组合数据、调仓历史等的完整 JSON
输出：各表写入行数统计
"""
import sqlite3
import json
import sys
import datetime

DB_PATH = '/root/.openclaw/workspace/aiplace/projects/admin-dashboard/db/xueqiu_portfolio.db'

def write_all_data(data):
    """
    写入所有数据到数据库（完整模式，包含 observations）

    Args:
        data: dict - {
            portfolios: [...],
            snapshots: [...],
            latest_rebalances: [...],
            holdings: [...],
            rebalances: [...],
            preflight_checks: [...],
            observations: {portfolio_id: str, ...}
        }

    Returns:
        dict - {snapshot_id: int, stats: {...}}
    """
    db = sqlite3.connect(DB_PATH)
    c = db.cursor()
    now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')

    stats = {}

    # 数据完整性检查：确保 holdings 数据不为空
    if 'holdings' not in data or not data['holdings']:
        db.close()
        return {'snapshot_id': None, 'stats': {}, 'error': 'No holdings data provided, skipping insert to maintain data integrity'}

    # 1. 写入/更新 portfolios 表（INSERT OR REPLACE）
    if 'portfolios' in data and data['portfolios']:
        portfolios_data = []
        for p in data['portfolios']:
            portfolios_data.append((
                p.get('id'),
                p.get('name'),
                now,
            ))
        c.executemany(
            "INSERT OR REPLACE INTO portfolios (id, name, updated_at) VALUES (?, ?, ?)",
            portfolios_data
        )
        stats['portfolios'] = len(portfolios_data)

    # 2. 插入 portfolio_snapshots（不包含 observations，先插入获取 snapshot_id）
    # 修正：对每个组合单独执行 INSERT + 获取 snapshot_id，避免多行插入后只能获取最后一个 ID
    snapshot_id_map = {}  # 记录每个 portfolio_id 对应的 snapshot_id
    snapshot_ids = []  # 记录所有 snapshot_id
    if 'snapshots' in data and data['snapshots']:
        for s in data['snapshots']:
            c.execute(
                "INSERT INTO portfolio_snapshots (portfolio_id, net_value, total_return, daily_return, monthly_return, cash_ratio, rebalance_count_3m, rebalance_profit_3m, best_buy_3m, snapshot_at, latest_rebalance_time, observations) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    s.get('portfolio_id'),
                    s.get('net_value'),
                    s.get('total_return'),
                    s.get('day_return'),  # 使用 day_return 作为 daily_return
                    s.get('month_return'),  # 使用 month_return 作为 monthly_return
                    s.get('cash_ratio'),
                    s.get('rebalance_count_3m'),
                    s.get('rebalance_profit_3m'),  # 使用 rebalance_profit_3m 替代 profit_count
                    s.get('best_buy_3m'),
                    s.get('snapshot_at'),  # 使用 snapshot_at 替代 created_at
                    s.get('latest_rebalance_time'),
                    '',  # observations 字段先为空
                )
            )
            # 立即用 last_insert_rowid() 获取 snapshot_id（重点：必须在 INSERT 后立即获取）
            c.execute("SELECT last_insert_rowid()")
            current_snapshot_id = c.fetchone()[0]
            snapshot_id_map[s.get('portfolio_id')] = current_snapshot_id
            snapshot_ids.append(current_snapshot_id)
        stats['snapshots'] = len(data['snapshots'])

    # 3. 立即更新 observations 字段（重点：拿到 snapshot_id 后立即 UPDATE，使用 WHERE id = ?）
    # 修正：使用 snapshot_id_map 确保每个快照都更新到对应的 observations
    if snapshot_ids and 'snapshots' in data and data['snapshots'] and 'observations' in data:
        observations_map = data.get('observations', {})
        updated_count = 0
        for s in data['snapshots']:
            pid = s.get('portfolio_id')
            obs = observations_map.get(pid, '')
            current_snapshot_id = snapshot_id_map.get(pid)
            if current_snapshot_id is not None:
                # 找到刚插入的记录并更新，使用 WHERE id = ?（不依赖时间戳）
                c.execute(
                    "UPDATE portfolio_snapshots SET observations = ? WHERE id = ?",
                    (obs, current_snapshot_id)
                )
                updated_count += 1
        stats['observations_updated'] = updated_count

    # 5. 用 snapshot_id 批量插入 latest_rebalances, holdings
    # 修正：使用 snapshot_id_map 确保每个组合的快照 ID 正确
    if snapshot_ids:
        if 'latest_rebalances' in data and data['latest_rebalances']:
            latest_reb_rows = []
            for r in data['latest_rebalances']:
                pid = r.get('portfolio_id')
                current_snapshot_id = snapshot_id_map.get(pid, snapshot_ids[0])  # 默认使用第一个快照 ID
                latest_reb_rows.append((
                    current_snapshot_id,
                    r.get('stock_name'),
                    r.get('stock_code', ''),        # data_collector 无此字段时为空字符串
                    r.get('from_ratio'),
                    r.get('to_ratio'),
                    r.get('reference_price') or r.get('price'),  # 兼容两种字段名
                    r.get('rebalance_time'),
                ))
            c.executemany(
                "INSERT INTO latest_rebalances (snapshot_id, stock_name, stock_code, from_ratio, to_ratio, price, rebalance_time) VALUES (?, ?, ?, ?, ?, ?, ?)",
                latest_reb_rows
            )
            stats['latest_rebalances'] = len(latest_reb_rows)

        if 'holdings' in data and data['holdings']:
            holding_rows = []
            for h in data['holdings']:
                pid = h.get('portfolio_id')
                current_snapshot_id = snapshot_id_map.get(pid, snapshot_ids[0])  # 默认使用第一个快照 ID
                holding_rows.append((
                    h.get('portfolio_id'),
                    current_snapshot_id,
                    h.get('sector'),
                    h.get('sector_ratio'),  # 新增 sector_ratio
                    h.get('stock_name'),
                    h.get('stock_code'),
                    h.get('price'),  # 新增 price
                    h.get('daily_change'),  # 新增 daily_change
                    h.get('position_ratio'),
                ))
            c.executemany(
                "INSERT INTO holdings (portfolio_id, snapshot_id, sector, sector_ratio, stock_name, stock_code, price, daily_change, position_ratio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                holding_rows
            )
            stats['holdings'] = len(holding_rows)

    # 6. 批量插入 rebalances（INSERT OR IGNORE）
    if 'rebalances' in data and data['rebalances']:
        rebalance_rows = []
        for r in data['rebalances']:
            rebalance_rows.append((
                r.get('portfolio_id'),
                r.get('rebalance_time'),
                r.get('stock_name'),
                r.get('stock_code'),
                r.get('from_ratio'),
                r.get('to_ratio'),
                r.get('price'),  # 使用 price 替代 reference_price
                r.get('is_dividend', 0),
                r.get('is_cancelled', 0),
            ))
        c.executemany(
            "INSERT OR IGNORE INTO rebalances (portfolio_id, rebalance_time, stock_name, stock_code, from_ratio, to_ratio, price, is_dividend, is_cancelled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            rebalance_rows
        )
        stats['rebalances'] = len(rebalance_rows)

    # 7. 写入 cron_run_log（记录每次执行结果）
    # 修正：使用 snapshot_id_map 确保每个组合的 snapshot_id 正确
    if 'cron_run_log' in data and data['cron_run_log'] and snapshot_ids:
        cron_log_data = []
        for log_item in data['cron_run_log']:
            pid = log_item.get('portfolio_id')
            current_snapshot_id = snapshot_id_map.get(pid, snapshot_ids[0])  # 默认使用第一个快照 ID
            cron_log_data.append((
                now,
                pid,
                log_item.get('has_new_rebalance', 0),
                log_item.get('new_stock'),
                log_item.get('new_from'),
                log_item.get('new_to'),
                log_item.get('rebalance_time'),
                current_snapshot_id,  # 使用正确的 snapshot_id
                log_item.get('notified', 0),
            ))
        c.executemany(
            "INSERT OR IGNORE INTO cron_run_log (run_at, portfolio_id, has_new_rebalance, new_stock, new_from, new_to, rebalance_time, snapshot_id, notified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            cron_log_data
        )
        stats['cron_run_log'] = len(cron_log_data)

    # 8. 写入 preflight_checks（INSERT OR REPLACE）
    # 修正：使用第一个 snapshot_id 或 None
    if 'preflight_checks' in data and data['preflight_checks']:
        preflight_rows = []
        first_snapshot_id = snapshot_ids[0] if snapshot_ids else None  # 使用第一个 snapshot_id
        for item in data['preflight_checks']:
            # 支持 3 元组和 4 元组格式：[step, status, msg, timestamp] 或 [step, status, msg, timestamp, snapshot_id]
            step = item[0] if len(item) > 0 else ''
            status = item[1] if len(item) > 1 else ''
            msg = item[2] if len(item) > 2 else ''
            timestamp = item[3] if len(item) > 3 else now
            # snapshot_id 使用第一个快照 ID
            preflight_rows.append((
                step,
                status,
                msg,
                timestamp,
                first_snapshot_id,
            ))
        c.executemany(
            "INSERT OR REPLACE INTO preflight_checks (check_step, status, message, checked_at, snapshot_id) VALUES (?, ?, ?, ?, ?)",
            preflight_rows
        )
        stats['preflight_checks'] = len(preflight_rows)

    db.commit()
    db.close()

    return {'snapshot_ids': snapshot_ids, 'snapshot_id_map': snapshot_id_map, 'stats': stats}

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--help':
        print(__doc__)
    elif len(sys.argv) > 1 and sys.argv[1] == '--json':
        if len(sys.argv) > 2 and sys.argv[2] == '--file':
            with open(sys.argv[3], 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            data = json.loads(sys.stdin.read())
        result = write_all_data(data)
        print(json.dumps(result, ensure_ascii=False))
    else:
        print(__doc__)
