#!/usr/bin/env python3
"""
飞书通知脚本
查询雪球组合监控数据库，找出有新调仓的组合并发送飞书消息
用法：python3 feishu_notifier.py
"""

import sqlite3
import subprocess
import sys
from datetime import datetime, timezone, timedelta

DB_PATH = '/root/.openclaw/workspace/aiplace/projects/admin-dashboard/db/xueqiu_portfolio.db'
SHANGHAI_TZ = timezone(timedelta(hours=8))

def get_portfolios_with_new_rebalance():
    """
    查询 cron_run_log 表，找出 notified=0 且 has_new_rebalance=1 的所有记录
    对每条记录，查询 portfolios 和 portfolio_snapshots 表
    """
    try:
        db = sqlite3.connect(DB_PATH)
        cursor = db.cursor()
        
        # 查询有新调仓的记录
        cursor.execute("""
            SELECT id, portfolio, has_new_rebalance
            FROM cron_run_log
            WHERE notified = 0 AND has_new_rebalance = 1
            ORDER BY id DESC
        """)
        
        records = cursor.fetchall()
        db.close()
        
        return records
        
    except Exception as e:
        print(f"[数据库查询失败] {e}", file=sys.stderr)
        return []

def get_portfolio_info(portfolio_name):
    """
    查询组合的基本信息和最新快照
    """
    try:
        db = sqlite3.connect(DB_PATH)
        cursor = db.cursor()
        
        # 查询组合信息
        cursor.execute("SELECT id, name FROM portfolios WHERE name = ?", (portfolio_name,))
        portfolio = cursor.fetchone()
        
        # 查询快照信息
        snapshot = None
        if portfolio:
            cursor.execute("""
                SELECT id, net_value, total_return, observations
                FROM portfolio_snapshots
                WHERE portfolio_id = ?
                ORDER BY id DESC
                LIMIT 1
            """, (portfolio[0],))
            snapshot = cursor.fetchone()
        
        db.close()
        
        return {
            'portfolio': portfolio,
            'snapshot': snapshot
        }
        
    except Exception as e:
        print(f"[查询组合信息失败] {e}", file=sys.stderr)
        return None

def get_new_rebalance_detail(portfolio_name):
    """
    查询最新的调仓记录详情
    """
    try:
        db = sqlite3.connect(DB_PATH)
        cursor = db.cursor()
        
        # 查询最新的调仓记录
        cursor.execute("""
            SELECT stock_name, from_ratio, to_ratio, price, rebalance_time
            FROM latest_rebalances
            WHERE portfolio_id = ?
            ORDER BY id DESC
            LIMIT 1
        """, (portfolio_name,))
        
        rebalance = cursor.fetchone()
        db.close()
        
        if rebalance:
            return {
                'stock_name': rebalance[0],
                'from_ratio': rebalance[1],
                'to_ratio': rebalance[2],
                'price': rebalance[3],
                'rebalance_time': rebalance[4]
            }
        return None
        
    except Exception as e:
        print(f"[查询调仓详情失败] {e}", file=sys.stderr)
        return None

def send_feishu_message(message):
    """
    通过 feishu_im_user_message 工具发送飞书消息
    """
    try:
        cmd = ['feishu_im_user_message', 'send', '--channel', 'feishu', '--message', message]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            return True
        else:
            error_output = result.stderr if result.stderr else result.stdout
            print(f"[发送消息失败] {error_output}", file=sys.stderr)
            return False
        
    except Exception as e:
        print(f"[发送消息异常] {e}", file=sys.stderr)
        return False

def update_notified(record_id):
    """
    更新 cron_run_log 表，将 notified 设置为 1
    """
    try:
        db = sqlite3.connect(DB_PATH)
        cursor = db.cursor()
        
        cursor.execute(
            "UPDATE cron_run_log SET notified = 1 WHERE id = ?",
            (record_id,)
        )
        
        db.commit()
        db.close()
        
    except Exception as e:
        print(f"[更新数据库失败] {e}", file=sys.stderr)

def main():
    """主函数：查询并发送通知"""
    print("[启动] 雪球组合监控通知派发")
    
    # 1. 查询有新调仓的记录
    records = get_portfolios_with_new_rebalance()
    
    if not records:
        print("[完成] 没有需要通知的记录")
        return
    
    print(f"[查询] 找到 {len(records)} 条需要通知的记录")
    
    # 2. 逐条处理并发送通知
    for record in records:
        record_id = record[0]
        portfolio_name = record[1] if len(record) > 1 else None
        
        # 获取组合信息和快照
        info = get_portfolio_info(portfolio_name)
        
        if not info or not info['portfolio']:
            print(f"[跳过] 无法获取组合信息 (portfolio={portfolio_name})")
            continue
        
        portfolio = info['portfolio']
        portfolio_name = portfolio[1] if portfolio else "未知"
        
        # 获取最新调仓详情
        rebalance_detail = get_new_rebalance_detail(portfolio_name)
        
        if not rebalance_detail:
            print(f"[跳过] 无法获取调仓详情 (portfolio={portfolio_name})")
            continue
        
        # 生成通知消息
        stock_name = rebalance_detail['stock_name']
        from_ratio = rebalance_detail['from_ratio']
        to_ratio = rebalance_detail['to_ratio']
        price = rebalance_detail['price']
        rebalance_time = rebalance_detail['rebalance_time']
        
        message = f"""📊 雪球组合调仓通知

【组合】：{portfolio_name}】
   调仓股票：{stock_name}
   调仓幅度：{from_ratio}% → {to_ratio}%
   参考价格：{price}
   调仓时间：{rebalance_time}
"""
        
        # 发送消息
        print(f"[发送] 组合 {portfolio_name} 的调仓通知")
        success = send_feishu_message(message)
        
        if success:
            # 更新数据库中的 notified 记录
            update_notified(record_id)
            print(f"[成功] 已发送通知并更新数据库")
        else:
            print(f"[失败] 消息发送失败，数据库未更新")
    
    print("[完成] 通知派发流程结束")

if __name__ == '__main__':
    main()
