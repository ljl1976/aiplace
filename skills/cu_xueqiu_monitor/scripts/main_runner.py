#!/usr/bin/env python3
"""
雪球组合监控 - 统一执行入口
实现原子写入 + 重试机制（最多3次）
核心逻辑：
1. 所有数据抓取到内存（不保存数据库）
2. 完整性校验
3. 校验失败 → 重试（最多3次）
4. 校验通过 → 原子写入数据库
5. 3次都失败 → 不保存任何数据
"""
import json
import subprocess
import sys
import time
from datetime import datetime

DB_PATH = '/root/.openclaw/workspace/aiplace/projects/admin-dashboard/db/xueqiu_portfolio.db'

def validate_data_integrity(data):
    """
    校验数据完整性

    Args:
        data: dict - 包含 portfolios, snapshots, holdings, rebalances 等

    Returns:
        tuple - (is_valid: bool, errors: list)
    """
    errors = []

    # 1. 基础数据存在性检查
    if 'portfolios' not in data or not data['portfolios']:
        errors.append('portfolios 数据为空')
    if 'snapshots' not in data or not data['snapshots']:
        errors.append('snapshots 数据为空')
    if 'holdings' not in data or not data['holdings']:
        errors.append('holdings 数据为空（无法写入数据库）')

    # 2. 组合数量检查
    if 'portfolios' in data and data['portfolios']:
        if len(data['portfolios']) == 0:
            errors.append('portfolios 数量为0')

    # 3. 快照关键字段检查
    if 'snapshots' in data and data['snapshots']:
        for idx, s in enumerate(data['snapshots']):
            if s.get('net_value') is None or s.get('net_value') == '':
                errors.append(f'snapshots[{idx}] net_value 为空')
            if s.get('total_return') is None or s.get('total_return') == '':
                errors.append(f'snapshots[{idx}] total_return 为空')
            if s.get('day_return') is None or s.get('day_return') == '':
                errors.append(f'snapshots[{idx}] day_return 为空')
            if s.get('snapshot_at') is None or s.get('snapshot_at') == '':
                errors.append(f'snapshots[{idx}] snapshot_at 为空')

    # 4. 持仓数据检查
    if 'holdings' in data and data['holdings']:
        portfolio_holdings = {}
        for h in data['holdings']:
            pid = h.get('portfolio_id')
            if pid:
                portfolio_holdings[pid] = portfolio_holdings.get(pid, 0) + 1

        # 每个组合至少有1个持仓
        if 'portfolios' in data:
            for p in data['portfolios']:
                pid = p.get('id')
                if pid and portfolio_holdings.get(pid, 0) == 0:
                    errors.append(f'组合 {pid}（{p.get("name")}）无持仓数据')

        # 跳过现金持仓，至少有1个非现金持仓
        non_cash_holdings = [h for h in data['holdings'] if h.get('sector') != '现金']
        if len(non_cash_holdings) == 0:
            errors.append('所有持仓都是现金，无实际持仓')

    # 5. 调仓数据检查（如果有调仓记录）
    if 'rebalances' in data and data['rebalances']:
        for idx, r in enumerate(data['rebalances']):
            if r.get('stock_name') is None or r.get('stock_name') == '':
                errors.append(f'rebalances[{idx}] stock_name 为空')
            if r.get('rebalance_time') is None or r.get('rebalance_time') == '':
                errors.append(f'rebalances[{idx}] rebalance_time 为空')

    is_valid = len(errors) == 0
    return is_valid, errors

def run_data_collection():
    """
    执行数据采集流程（Step 1-8）
    注意：此函数只抓取数据到内存，不保存到数据库

    Returns:
        dict - {
            success: bool,
            data: dict,
            error: str,
            preflight_passed: bool
        }
    """
    result = {
        'success': False,
        'data': None,
        'error': '',
        'preflight_passed': False
    }

    try:
        # 调用 data_collector.py 执行所有浏览器操作
        proc = subprocess.run(
            ['python3', '/root/.openclaw/workspace/skills/cu_xueqiu_monitor/scripts/data_collector.py'],
            capture_output=True,
            text=True,
            timeout=600  # 10分钟超时
        )

        # 检查前置检查是否通过
        if proc.returncode != 0:
            result['error'] = f'数据采集失败: {proc.stderr}'
            return result

        # 直接解析完整 stdout 为 JSON
        # data_collector.py 在 __main__ 中输出完整的 JSON 对象到 stdout
        collected_data = json.loads(proc.stdout)

        # 检查前置检查是否全部通过
        preflight_passed = all(
            check[1] == 'PASS'
            for check in collected_data.get('preflight_checks', [])
        )
        result['preflight_passed'] = preflight_passed
        result['success'] = True
        result['data'] = collected_data

        return result

    except subprocess.TimeoutExpired:
        result['error'] = '数据采集超时'
        return result
    except json.JSONDecodeError as e:
        result['error'] = f'JSON 解析失败: {str(e)}'
        return result
    except Exception as e:
        result['error'] = f'数据采集异常: {str(e)}'
        import traceback
        traceback.print_exc()
        return result

def main(max_retries=3):
    """
    主执行函数：带重试机制的原子写入

    Args:
        max_retries: 最大重试次数（默认3）
    """
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 雪球组合监控开始执行")
    print(f"重试策略：最多 {max_retries} 次，数据完整性校验通过后才写入数据库\n")

    for attempt in range(1, max_retries + 1):
        print(f"{'='*60}")
        print(f"第 {attempt} 次尝试...")
        print(f"{'='*60}")

        # 1. 数据采集
        collection_result = run_data_collection()

        if not collection_result['success']:
            print(f"❌ 数据采集失败：{collection_result['error']}\n")
            if attempt < max_retries:
                wait_time = attempt * 5  # 指数退避：5秒、10秒、15秒
                print(f"等待 {wait_time} 秒后重试...\n")
                time.sleep(wait_time)
            continue

        # 2. 完整性校验
        print("🔍 开始数据完整性校验...")
        is_valid, errors = validate_data_integrity(collection_result['data'])

        if not is_valid:
            print(f"❌ 数据完整性校验失败（共 {len(errors)} 个问题）：")
            for err in errors:
                print(f"   • {err}")
            print()

            if attempt < max_retries:
                wait_time = attempt * 5
                print(f"等待 {wait_time} 秒后重试...\n")
                time.sleep(wait_time)
            else:
                print(f"{'='*60}")
                print(f"❌ 第 {max_retries} 次尝试仍然失败，不保存任何数据到数据库")
                print(f"{'='*60}\n")
            continue

        # 3. 校验通过，原子写入数据库
        print("✅ 数据完整性校验通过！")
        print("💾 开始原子写入数据库...")

        # 调用 database_writer.py
        proc = subprocess.run(
            ['python3', '/root/.openclaw/workspace/skills/cu_xueqiu_monitor/scripts/database_writer.py', '--json'],
            input=json.dumps(collection_result['data']),
            capture_output=True,
            text=True,
            timeout=30
        )

        if proc.returncode != 0:
            print(f"❌ 数据库写入失败：{proc.stderr}")
            if attempt < max_retries:
                wait_time = attempt * 5
                print(f"等待 {wait_time} 秒后重试...\n")
                time.sleep(wait_time)
            continue

        write_result = json.loads(proc.stdout)
        snapshot_ids = write_result.get('snapshot_ids', [])
        snapshot_id = snapshot_ids[0] if snapshot_ids else None
        stats = write_result.get('stats', {})

        print(f"✅ 数据库写入成功！")
        print(f"   Snapshot ID: {snapshot_id}")
        print(f"   写入统计：{json.dumps(stats, ensure_ascii=False)}")
        print()

        # 4. 生成观察要点
        print("📊 生成观察要点...")
        proc = subprocess.run(
            ['python3', '/root/.openclaw/workspace/skills/cu_xueqiu_monitor/scripts/observations_generator.py', '--json'],
            input=json.dumps({
                'portfolio_list': collection_result['data'].get('portfolios', []),
                'holdings_map': {pid: [h for h in collection_result['data'].get('holdings', []) if h.get('portfolio_id') == pid]
                               for pid in [p['id'] for p in collection_result['data'].get('portfolios', [])]},
                'rebalances_map': {pid: [r for r in collection_result['data'].get('rebalances', []) if r.get('portfolio_id') == pid]
                                  for pid in [p['id'] for p in collection_result['data'].get('portfolios', [])]}
            }),
            capture_output=True,
            text=True,
            timeout=10
        )

        if proc.returncode == 0:
            observations = json.loads(proc.stdout)
            print("✅ 观察要点生成成功：")
            for pid, obs in observations.items():
                print(f"\n【组合 {pid}】")
                print(obs)
        else:
            print(f"⚠️  观察要点生成失败：{proc.stderr}")

        print(f"\n{'='*60}")
        print(f"✅ 第 {attempt} 次尝试成功完成！")
        print(f"{'='*60}\n")
        return True

    # 所有尝试都失败
    print(f"{'='*60}")
    print(f"❌ 所有 {max_retries} 次尝试均失败，本次不保存任何数据")
    print(f"{'='*60}\n")
    return False

if __name__ == '__main__':
    max_retries = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    success = main(max_retries)
    sys.exit(0 if success else 1)
