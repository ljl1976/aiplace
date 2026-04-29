#!/usr/bin/env python3
"""
前置检查状态比对
输入：preflight_checks 表的当前状态
输出：是否需要通知用户（有状态变化时返回详情）
"""
import sqlite3
import json
import sys

DB_PATH = '/root/.openclaw/workspace/aiplace/projects/admin-dashboard/db/xueqiu_portfolio.db'

def compare_preflight_status(current_checks):
    """
    比对前置检查状态

    Args:
        current_checks: dict - {step1: 'pass'|'fail', step2: 'pass'|'fail', ...}

    Returns:
        changed: bool - 是否有状态变化
        details: dict - 变化的详情
    """
    db = sqlite3.connect(DB_PATH)
    c = db.cursor()

    # 读取上次状态（直接用 check_step 作为 key）
    c.execute("SELECT check_step, status FROM preflight_checks ORDER BY checked_at DESC LIMIT 4")
    rows = c.fetchall()
    prev = {row[0]: row[1] for row in rows if row[1] in ('PASS', 'FAIL')}
    db.close()

    # 找出变化的 step
    changed = []
    current = {
        'step1': current_checks.get('step1', ''),
        'step2': current_checks.get('step2', ''),
        'step3': current_checks.get('step3', ''),
        'step4': current_checks.get('step4', ''),
    }

    for step in ['step1', 'step2', 'step3', 'step4']:
        if prev.get(step) != current.get(step):
            changed.append({
                'step': step,
                'prev': prev.get(step),
                'current': current.get(step),
            })

    if changed:
        return True, changed
    return False, []

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--json':
        current = json.loads(sys.stdin.read())
        has_change, changes = compare_preflight_status(current)
        print(json.dumps({'has_change': has_change, 'changes': changes}, ensure_ascii=False))
    else:
        print(__doc__)
