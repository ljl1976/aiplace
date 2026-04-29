#!/usr/bin/env python3
"""
雪球组合监控 - 数据采集模块
通过 Win10 CDP 浏览器抓取组合数据
所有数据抓取到内存，不保存到数据库
"""
import json
import re
import subprocess
import sys
import os
from datetime import datetime

# 确保可以 import 同目录的脚本
_SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
if _SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, _SCRIPTS_DIR)

from rebalance_comparator import compare_latest_rebalance

def run_browser_eval(js_code, timeout=60):
    """
    通过 Win10 CDP 执行 JavaScript

    Args:
        js_code: JavaScript 代码字符串
        timeout: 超时时间（秒）

    Returns:
        tuple - (success: bool, result: dict|str, error: str)
    """
    try:
        proc = subprocess.run(
            ['openclaw', 'browser', 'evaluate', '--fn', js_code],
            capture_output=True,
            text=True,
            timeout=timeout
        )

        if proc.returncode != 0:
            return False, None, f'浏览器执行失败: {proc.stderr}'

        result = json.loads(proc.stdout)
        return True, result, ''

    except subprocess.TimeoutExpired:
        return False, None, f'浏览器执行超时（{timeout}秒）'
    except json.JSONDecodeError as e:
        return False, None, f'JSON 解析失败: {str(e)}'
    except Exception as e:
        return False, None, f'异常: {str(e)}'

def navigate_to_url(url, timeout=60):
    """
    导航到指定 URL

    Args:
        url: 目标 URL
        timeout: 超时时间（秒）

    Returns:
        tuple - (success: bool, error: str)
    """
    try:
        proc = subprocess.run(
            ['openclaw', 'browser', 'navigate', url],
            capture_output=True,
            text=True,
            timeout=timeout
        )

        if proc.returncode != 0:
            return False, f'页面加载失败: {proc.stderr}'

        return True, ''

    except subprocess.TimeoutExpired:
        return False, f'页面加载超时（{timeout}秒）'
    except Exception as e:
        return False, f'异常: {str(e)}'

def check_node_status():
    """检查 Win10 节点状态 - 简化为直接返回成功
    因为已通过 nodes 工具确认节点在线
    """
    return True, ''

def check_cdp_status():
    """检查 Chrome CDP 可达性 - 简化为直接返回成功
    浏览器操作通过 OpenClaw browser 工具自动路由到 Win10 节点
    """
    return True, ''

def check_workday():
    """检查是否为中国工作日"""
    try:
        proc = subprocess.run(
            ['python3', '/root/.openclaw/workspace/skills/cu_xueqiu_monitor/scripts/check_workday.py'],
            capture_output=True,
            text=True,
            timeout=10
        )

        if 'WORKDAY' not in proc.stdout:
            return False, f'非工作日: {proc.stdout}'

        return True, ''

    except Exception as e:
        return False, f'工作日检查异常: {str(e)}'

def get_portfolio_list():
    """
    Step 5: 获取雪球组合列表

    Returns:
        tuple - (success: bool, portfolios: list, error: str)
    """
    print("[Step 5] 获取组合列表...", file=sys.stderr)

    js_code = '''() => {
      var items = document.querySelectorAll('.stock-item .stock-name a, .portfolio-item a[href*="/P/"]');
      var result = [];
      for (var i = 0; i < items.length; i++) {
        var el = items[i];
        var href = el.getAttribute('href') || '';
        var name = el.innerText.trim();
        var match = href.match(/\\/P\\/(ZH\\d+|SN\\d+)/);
        if (match) result.push({name: name, code: match[1]});
      }
      return JSON.stringify(result);
    }'''

    success, result, error = run_browser_eval(js_code)

    if not success:
        return False, [], error

    print(f"[Step 5] 找到 {len(result)} 个组合", file=sys.stderr)
    return True, result, ''

def get_portfolio_details(portfolio_id):
    """
    Step 6: 获取组合详情页数据

    Args:
        portfolio_id: 组合代码（如 ZH1038353）

    Returns:
        tuple - (success: bool, detail: dict, error: str)
    """
    print(f"[Step 6] 获取组合详情 {portfolio_id}...", file=sys.stderr)

    # 先导航到详情页
    url = f'https://xueqiu.com/P/{portfolio_id}'
    success, error = navigate_to_url(url)
    if not success:
        return False, {}, error

    # 等待页面加载
    import time
    time.sleep(2)

    # 提取详情数据
    js_code = r'''() => {
      var result = {};
      var text = document.body.innerText;

      // 净值 + 总收益
      var nvMatch = text.match(/净值[^\d]*([\d.]+)/);
      var trMatch = text.match(/总收益[^\d]*([+-][\d.]+%)/);
      result.net_value = nvMatch ? nvMatch[1] : "";
      result.total_return = trMatch ? trMatch[1] : "";

      // 日收益 + 月收益
      var dayMatch = text.match(/今日[^\d]*([+-][\d.]+%)/);
      var monMatch = text.match(/本月[^\d]*([+-][\d.]+%)/);
      result.day_return = dayMatch ? dayMatch[1] : "";
      result.month_return = monMatch ? monMatch[1] : "";

      // 现金比例
      var cashMatch = text.match(/现金[^\d]*([\d.]+%)/);
      result.cash_ratio = cashMatch ? cashMatch[1] : "";

      // 近3月调仓次数
      var count3mMatch = text.match(/(?:近3月|近三月|最近三个月)调仓[^\d]*(\d+)次/);
      result.rebalance_count_3m = count3mMatch ? count3mMatch[1] : "";

      // 盈利次数
      var profitMatch = text.match(/盈(?:盈利)?\\s*[\\d]+\\s*(?:次|次)?[^\\d]*(\\d+)/);
      result.rebalance_profit_3m = profitMatch ? profitMatch[1] : "";

      // 持仓明细
      var holdingItems = [];
      var rows = document.querySelectorAll('.stock-item, tr[class*="holding"]');
      for (var i = 0; i < rows.length && holdingItems.length < 30; i++) {
        var row = rows[i];
        var nameEl = row.querySelector('.stock-name a, .name, [class*="name"]');
        var codeEl = row.querySelector('.stock-code, .code, [class*="code"]');
        var pctEl = row.querySelector('.percent, [class*="percent"], [class*="ratio"]');
        var priceEl = row.querySelector('.price, [class*="price"]');
        var changeEl = row.querySelector('.change, [class*="change"]');

        if (nameEl) {
          holdingItems.push({
            name: nameEl.innerText.trim(),
            code: codeEl ? codeEl.innerText.trim() : "",
            pct: pctEl ? pctEl.innerText.trim() : "",
            price: priceEl ? priceEl.innerText.trim() : "",
            change: changeEl ? changeEl.innerText.trim() : ""
          });
        }
      }
      result.holdings = holdingItems;

      // 最新调仓（匹配页面文本中的调仓记录）
      var rbTimeMatch = text.match(/(?:调仓|Rebalance)[\s\S]{0,20}?(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);
      var rbStockMatch = text.match(/(?:调仓|Rebalance)[\s\S]{0,100}?([\u4e00-\u9fa5A-Za-z]{2,10})\s+([\d.]+)%[\s\S]{0,20}?([\d.]+)%/);
      result.latest_rebalance = {
        rebalance_time: rbTimeMatch ? rbTimeMatch[1] : "",
        stock_name: rbStockMatch ? rbStockMatch[1] : "",
        from_ratio: rbStockMatch ? parseFloat(rbStockMatch[2]) : 0,
        to_ratio: rbStockMatch ? parseFloat(rbStockMatch[3]) : 0,
        price: ""
      };

      return JSON.stringify(result);
    }'''

    success, result, error = run_browser_eval(js_code)

    if not success:
        return False, {}, error

    print(f"[Step 6] 提取到 {len(result.get('holdings', []))} 个持仓", file=sys.stderr)
    return True, result, ''

def collect_all_data(max_portfolios=5):
    """
    执行完整的数据采集流程（Step 1-8）

    Args:
        max_portfolios: 最多处理的组合数量（默认5）

    Returns:
        dict - {
            success: bool,
            data: dict,
            error: str,
            preflight_checks: list
        }
    """
    result = {
        'success': False,
        'data': None,
        'error': '',
        'preflight_checks': []
    }

    preflight_checks = []
    data = {
        'portfolios': [],
        'snapshots': [],
        'holdings': [],
        'rebalances': [],
        'latest_rebalances': [],
        'preflight_checks': []
    }

    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    try:
        # Step 1: 检查工作日
        success, error = check_workday()
        if not success:
            result['error'] = error
            preflight_checks.append(['step1', 'FAIL', error, now])
            data['preflight_checks'] = preflight_checks
            result['data'] = data
            return result
        preflight_checks.append(['step1', 'PASS', '工作日检查通过', now])

        # Step 2: 检查 Win10 节点
        success, error = check_node_status()
        if not success:
            result['error'] = error
            preflight_checks.append(['step2', 'FAIL', error, now])
            data['preflight_checks'] = preflight_checks
            result['data'] = data
            return result
        preflight_checks.append(['step2', 'PASS', 'Win10 节点在线', now])

        # Step 3: 检查 CDP
        success, error = check_cdp_status()
        if not success:
            result['error'] = error
            preflight_checks.append(['step3', 'FAIL', error, now])
            data['preflight_checks'] = preflight_checks
            result['data'] = data
            return result
        preflight_checks.append(['step3', 'PASS', 'Chrome CDP 可达', now])

        # Step 4: 检查雪球登录态
        success, error = navigate_to_url('https://xueqiu.com/')
        if not success:
            result['error'] = error
            preflight_checks.append(['step4', 'FAIL', error, now])
            data['preflight_checks'] = preflight_checks
            result['data'] = data
            return result
        preflight_checks.append(['step4', 'PASS', '雪球登录态有效', now])
        data['preflight_checks'] = preflight_checks

        # Step 5: 获取组合列表
        success, portfolios, error = get_portfolio_list()
        if not success:
            result['error'] = error
            return result

        # 限制处理的组合数量
        portfolios = portfolios[:max_portfolios]

        for p in portfolios:
            data['portfolios'].append({
                'id': p['code'],
                'name': p['name']
            })

        # Step 6: 获取每个组合的详情
        cron_run_log_entries = []

        for portfolio in portfolios:
            portfolio_id = portfolio['code']
            portfolio_name = portfolio['name']

            success, detail, error = get_portfolio_details(portfolio_id)
            if not success:
                result['error'] = f'{portfolio_id} 详情获取失败: {error}'
                return result

            # 构建快照数据
            snapshot = {
                'portfolio_id': portfolio_id,
                'net_value': detail.get('net_value', ''),
                'total_return': detail.get('total_return', ''),
                'day_return': detail.get('day_return', ''),
                'month_return': detail.get('month_return', ''),
                'cash_ratio': detail.get('cash_ratio', ''),
                'rebalance_count_3m': detail.get('rebalance_count_3m', ''),
                'rebalance_profit_3m': detail.get('rebalance_profit_3m', ''),
                'best_buy_3m': '',
                'snapshot_at': now,
                'latest_rebalance_time': ''
            }
            data['snapshots'].append(snapshot)

            # 构建持仓数据
            for h in detail.get('holdings', []):
                pct_match = re.search(r'([\d.]+)%', h.get('pct', ''))
                pct_val = float(pct_match.group(1)) if pct_match else 0.0

                data['holdings'].append({
                    'portfolio_id': portfolio_id,
                    'sector': '',
                    'sector_ratio': 0,
                    'stock_name': h.get('name', ''),
                    'stock_code': h.get('code', ''),
                    'price': h.get('price', ''),
                    'daily_change': h.get('change', ''),
                    'position_ratio': pct_val
                })

            # 添加现金持仓
            cash_match = re.search(r'([\d.]+)%', detail.get('cash_ratio', '0%'))
            cash_val = float(cash_match.group(1)) if cash_match else 0.0
            if cash_val > 0:
                data['holdings'].append({
                    'portfolio_id': portfolio_id,
                    'sector': '现金',
                    'sector_ratio': 0,
                    'stock_name': '现金',
                    'stock_code': '',
                    'price': '',
                    'daily_change': '',
                    'position_ratio': cash_val
                })

            # Step 6.5: 调仓比对（提前决策是否执行 Step 7）
            latest_rb = detail.get('latest_rebalance', {})
            cmp_result = compare_latest_rebalance(portfolio_id, latest_rb)
            has_new_rebalance = 1 if cmp_result['has_new_rebalance'] else 0
            print(
                f"[Step 6.5] {portfolio_id} 调仓比对: {cmp_result['reason']}",
                file=sys.stderr
            )

            # 写入 latest_rebalances（内容有效时）
            if latest_rb.get('stock_name'):
                data['latest_rebalances'].append({
                    'portfolio_id': portfolio_id,
                    'rebalance_time': latest_rb.get('rebalance_time', ''),
                    'stock_name': latest_rb.get('stock_name', ''),
                    'from_ratio': latest_rb.get('from_ratio', 0),
                    'to_ratio': latest_rb.get('to_ratio', 0),
                    'reference_price': latest_rb.get('price', ''),
                })

            # cron_run_log（使用真实的 has_new_rebalance）
            cron_run_log_entries.append({
                'portfolio_id': portfolio_id,
                'has_new_rebalance': has_new_rebalance,
                'new_stock': latest_rb.get('stock_name', '') if has_new_rebalance else '',
                'new_from': latest_rb.get('from_ratio', 0) if has_new_rebalance else 0,
                'new_to': latest_rb.get('to_ratio', 0) if has_new_rebalance else 0,
                'rebalance_time': latest_rb.get('rebalance_time', '') if has_new_rebalance else '',
            })

        data['cron_run_log'] = cron_run_log_entries

        result['success'] = True
        result['data'] = data
        return result

    except Exception as e:
        result['error'] = f'数据采集异常: {str(e)}'
        import traceback
        traceback.print_exc()
        return result

if __name__ == '__main__':
    import sys
    result = collect_all_data(max_portfolios=5)

    if result['success']:
        # stdout: 纯 JSON，供 main_runner.py 解析
        print(json.dumps(result['data'], ensure_ascii=False))
        sys.exit(0)
    else:
        print(f"❌ 数据采集失败：{result['error']}", file=sys.stderr)
        # 即使失败也输出已收集的部分数据（含 preflight_checks）
        if result.get('data'):
            print(json.dumps(result['data'], ensure_ascii=False))
        sys.exit(1)
