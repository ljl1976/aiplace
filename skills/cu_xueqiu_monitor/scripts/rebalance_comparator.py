#!/usr/bin/env python3
"""
调仓比对逻辑（Step 6.5 - 提前决策）
读取数据库 latest_rebalances 表，与当前最新调仓比对
返回 has_new_rebalance 标志，决定是否执行 Step 7
"""
import sqlite3
import json
import sys

DB_PATH = '/root/.openclaw/workspace/aiplace/projects/admin-dashboard/db/xueqiu_portfolio.db'

def compare_latest_rebalance(portfolio_id, current_rebalance):
    """
    比对最新调仓

    Args:
        portfolio_id: 组合代码（如 ZH1038355）
        current_rebalance: dict - 当前最新调仓
            {
                'stock_name': '兴业银锡',
                'rebalance_time': '2026-04-24 14:00:02',
                'to_ratio': 5.0,
                'from_ratio': 0.93,
                'price': 40.52
            }

    Returns:
        dict - {
            has_new_rebalance: bool,
            last_rebalance: dict|null,
            reason: str  # 比对原因说明
        }
    """
    db = sqlite3.connect(DB_PATH)
    c = db.cursor()

    # 读取最新的调仓记录（通过关联 portfolio_snapshots 表获取）
    # Step 1: 查询该组合最新的 snapshot_id
    c.execute(
        "SELECT id FROM portfolio_snapshots "
        "WHERE portfolio_id = ? ORDER BY id DESC LIMIT 1",
        (portfolio_id,)
    )
    snapshot_row = c.fetchone()

    if snapshot_row is None:
        # 组合无快照记录，判定为新调仓
        db.close()
        return {
            'has_new_rebalance': True,
            'last_rebalance': None,
            'reason': '组合无快照记录，首次监控'
        }

    latest_snapshot_id = snapshot_row[0]

    # Step 2: 查询该 snapshot 下的调仓记录
    c.execute(
        "SELECT stock_name, rebalance_time, from_ratio, to_ratio, price "
        "FROM latest_rebalances "
        "WHERE snapshot_id = ?",
        (latest_snapshot_id,)
    )
    row = c.fetchone()
    db.close()

    if row is None:
        # 数据库无记录，判定为新调仓
        return {
            'has_new_rebalance': True,
            'last_rebalance': None,
            'reason': '数据库无记录，首次调仓'
        }

    last_rebalance = {
        'stock_name': row[0],
        'rebalance_time': row[1],
        'from_ratio': row[2],
        'to_ratio': row[3],
        'price': row[4]
    }

    # 比对：时间 + 股票名称 + 目标仓位完全一致才判定为无新调仓
    is_same = (
        last_rebalance['rebalance_time'] == current_rebalance.get('rebalance_time') and
        last_rebalance['stock_name'] == current_rebalance.get('stock_name') and
        last_rebalance['to_ratio'] == current_rebalance.get('to_ratio')
    )

    if is_same:
        return {
            'has_new_rebalance': False,
            'last_rebalance': last_rebalance,
            'reason': '调仓完全一致（时间+股票+仓位）'
        }
    else:
        return {
            'has_new_rebalance': True,
            'last_rebalance': last_rebalance,
            'reason': '调仓有变化（时间/股票/仓位不一致）'
        }

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--help':
        print(__doc__)
    elif len(sys.argv) > 1 and sys.argv[1] == '--json':
        # 从 stdin 读取 JSON 数据
        if len(sys.argv) > 2 and sys.argv[2] == '--file':
            with open(sys.argv[3], 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            data = json.loads(sys.stdin.read())
        result = compare_latest_rebalance(
            data['portfolio_id'],
            data['current_rebalance']
        )
        print(json.dumps(result, ensure_ascii=False))
    else:
        print(__doc__)
