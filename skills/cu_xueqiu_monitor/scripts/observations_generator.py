#!/usr/bin/env python3
"""
观察要点生成
输入：组合列表、持仓映射、调仓历史映射
输出：各组合的结构化观察要点（写入 observations 字段）
"""
import re
from collections import defaultdict
from datetime import datetime

def generate_observations(portfolio_list, holdings_map, rebalances_map):
    """
    生成结构化观察要点

    Args:
        portfolio_list: [{'id', 'name', 'count_1m'}, ...]
        holdings_map: {portfolio_id: [{stock_name, position_ratio, sector}, ...]}
        rebalances_map: {portfolio_id: [{rebalance_time, stock_name, from_ratio, to_ratio}, ...]}

    Returns:
        dict - {portfolio_id: observations_string}
    """
    results = {}

    # ── 1. 辅助函数 ──────────────────────────────────────
    def style_label(count):
        if count > 15:
            return '高频波段'
        if count > 8:
            return '短线活跃'
        if count < 3:
            return '长线持有'
        return '均衡配置'

    def style_desc(count, rebs):
        if not rebs:
            return '近期无调仓记录'
        stock_freq = defaultdict(int)
        for r in rebs:
            stock_freq[r['stock_name']] = stock_freq[r['stock_name']] + 1
        max_freq = max(stock_freq.values()) if stock_freq else 0
        if max_freq >= 4:
            return f'单股反复操作（{max_freq}次），纯波段交易模式'
        if count > 10:
            return '调仓频繁，短线为主，换手率高'
        if count < 3:
            return '操作较少，坚定持有，趋势跟随'
        return '节奏适中，兼顾短中线'

    def timing_analysis(rebs):
        """分析调仓时间分布"""
        if not rebs:
            return '时间分布：无数据'
        morning, midday, afternoon, off_hours = 0, 0, 0, 0
        for r in rebs:
            try:
                dt = datetime.strptime(r['rebalance_time'], '%Y-%m-%d %H:%M:%S')
                hour = dt.hour
                if 9 <= hour < 11:
                    morning += 1
                elif 11 <= hour < 13:
                    midday += 1
                elif 13 <= hour < 15:
                    afternoon += 1
                else:
                    off_hours += 1
            except:
                continue
        total = morning + midday + afternoon + off_hours
        if total == 0:
            return '时间分布：无数据'
        # 找出主要时段
        max_seg = max([('早盘', morning), ('午盘', midday), ('尾盘', afternoon), ('盘后', off_hours)],
                      key=lambda x: x[1])
        if max_seg[1] / total > 0.5:
            return f'时间分布：主要在{max_seg[0]}操作（{max_seg[1]}/{total}）'
        return f'时间分布：早盘{morning} 午盘{midday} 尾盘{afternoon} 盘后{off_hours}'

    def sector_concentration(holdings):
        """计算行业集中度（HHI）"""
        sector_totals = defaultdict(float)
        total = 0.0
        for h in holdings:
            sec = h.get('sector', '')
            if sec and sec != '现金':
                ratio = float(h.get('position_ratio', 0))
                sector_totals[sec] = sector_totals[sec] + ratio
                total = total + ratio
        if total == 0:
            return 0, '未知'
        # 计算平方和（HHI）
        hhi = sum((r / total) ** 2 for r in sector_totals.values())
        if hhi > 0.6:
            return hhi, '高度集中'
        if hhi > 0.4:
            return hhi, '中度集中'
        return hhi, '分散配置'

    def turnover_estimate(rebs, count):
        """估算换手率"""
        if not rebs:
            return 0
        total_delta = 0.0
        for r in rebs:
            total_delta += abs(float(r.get('to_ratio', 0)) - float(r.get('from_ratio', 0)))
        # 粗略估算：每次调仓的平均仓位变化 × 次数
        if count == 0:
            return 0
        return round(total_delta / count, 1)

    def profit_style(rebs):
        """推断盈利风格"""
        if not rebs:
            return '未知'
        # 统计加仓/建仓 vs 减仓/清仓
        add_count, reduce_count = 0, 0
        for r in rebs:
            f, t = float(r.get('from_ratio', 0)), float(r.get('to_ratio', 0))
            delta = t - f
            if delta > 0:
                add_count += 1
            elif delta < 0:
                reduce_count += 1
        total = add_count + reduce_count
        if total == 0:
            return '未知'
        add_ratio = add_count / total
        if add_ratio > 0.7:
            return '追涨型（倾向于加仓上涨股）'
        if add_ratio < 0.3:
            return '止盈型（倾向于减仓获利）'
        return '均衡型（加仓减仓平衡）'

    def market_rhythm(rebs):
        """判断市场节奏"""
        if not rebs or len(rebs) < 3:
            return '节奏：数据不足'
        # 分析最近 3 次操作的仓位变化趋势
        recent = sorted(rebs, key=lambda x: x['rebalance_time'], reverse=True)[:3]
        deltas = []
        for r in recent:
            f, t = float(r.get('from_ratio', 0)), float(r.get('to_ratio', 0))
            deltas.append(t - f)
        if all(d > 0 for d in deltas):
            return '节奏：积极进攻，连续加仓'
        if all(d < 0 for d in deltas):
            return '节奏：保守收缩，连续减仓'
        return '节奏：灵活调整，进退有度'

    def build_label(from_r, to_r, stock):
        f, t = float(from_r or 0), float(to_r or 0)
        if f == 0 and t > 0:
            return f'建仓 {stock} {t:.1f}%'
        if t == 0 and f > 0:
            return f'清仓 {stock} {f:.1f}%'
        delta = t - f
        if delta > 3:
            return f'加仓 {stock} {f:.1f}% -> {t:.1f}%'
        if delta < -3:
            return f'减仓 {stock} {f:.1f}% -> {t:.1f}%'
        return None

    def risk_signals(holdings, cash_ratio, hhi, concentration):
        signals = []
        if holdings:
            max_pos = max((float(h.get('position_ratio', 0)) for h in holdings), default=0.0)
            if max_pos > 25:
                signals.append(f'单股仓位过重（{max_pos:.1f}%）')
            if max_pos > 15 and hhi > 0.5:
                signals.append(f'仓位与行业双集中（{concentration}）')
            if len(holdings) < 4:
                signals.append(f'持仓数量偏少（{len(holdings)}只）')
        cash = float(cash_ratio or 0)
        if cash < 3:
            signals.append('几乎全仓运行，市场敏感度高')
        if cash > 50:
            signals.append('现金比例偏高，进攻性偏弱')
        return signals if signals else ['无明显风险']

    def sector_analysis(holdings):
        sector_totals = defaultdict(float)
        for h in holdings:
            sec = h.get('sector', '')
            if sec and sec != '现金':
                sector_totals[sec] = sector_totals[sec] + float(h.get('position_ratio', 0))
        if not sector_totals:
            return '暂无数据'
        sorted_secs = sorted(sector_totals.items(), key=lambda x: x[1], reverse=True)
        top3 = sorted_secs[:3]
        lines = [f"{s}:{r:.1f}%" for s, r in top3]
        top_industry = top3[0][0] if top3 else '未知'
        return f"{'、'.join(lines)}——主要持仓在{top_industry}"

    def cross_sector_signal(common_stocks, holdings_map, all_ids):
        if not common_stocks or len(all_ids) < 2:
            return None
        all_sectors = defaultdict(int)
        for pid in all_ids:
            for h in holdings_map.get(pid, []):
                if h['stock_name'] in common_stocks:
                    sec = h.get('sector', '未知')
                    all_sectors[sec] = all_sectors[sec] + 1
        if not all_sectors:
            return None
        top_cross_sec = max(all_sectors, key=all_sectors.get)
        if all_sectors[top_cross_sec] >= 2:
            return f"共同持股集中于{top_cross_sec}，两组合均看好该主题"
        return None

    # ── 2. 共同重仓 ──────────────────────────────────────
    all_ids = list(holdings_map.keys())
    common_stocks = []
    if len(all_ids) > 1:
        sets = []
        for pid in all_ids:
            stock_set = set()
            for h in holdings_map.get(pid, []):
                if float(h.get('position_ratio', 0)) > 5 and h.get('stock_name'):
                    stock_set.add(h['stock_name'])
            sets.append(stock_set)
        if sets:
            common_stocks = sorted(list(sets[0].intersection(*sets[1:]))) if len(sets) > 1 else []

    # 跨组合行业信号
    cross_sec_signal = cross_sector_signal(common_stocks, holdings_map, all_ids)

    # ── 3. 逐组合生成要点 ────────────────────────────────────
    key_actions = []

    for p in portfolio_list:
        pid = p['id']
        rebs = rebalances_map.get(pid, [])
        holds = holdings_map.get(pid, [])
        cash_r = next((h.get('position_ratio', 0) for h in holds if h.get('sector') == '现金'), 0)

        count = p.get('count_1m', 0)
        style = style_label(count)
        style_d = style_desc(count, rebs)

        # 新增分析维度
        timing = timing_analysis(rebs)
        hhi, concentration = sector_concentration(holds)
        turnover = turnover_estimate(rebs, count) if count > 0 else 0
        profit = profit_style(rebs)
        rhythm = market_rhythm(rebs)

        # 行为标签（取最新4条，去重同股票）
        labels = []
        seen = set()
        for r in sorted(rebs, key=lambda x: x['rebalance_time'], reverse=True)[:20]:
            lbl = build_label(r.get('from_ratio'), r.get('to_ratio'), r['stock_name'])
            if lbl and r['stock_name'] not in seen:
                labels.append(lbl)
                seen.add(r['stock_name'])
                if len(labels) >= 4:
                    break

        risks = risk_signals(holds, cash_r, hhi, concentration)
        sector_d = sector_analysis(holds)

        lines = [f"操作风格：{style} · 近1月调仓 {count} 次", f"  {style_d}", "", f"调仓节奏：{timing}", f"  {rhythm}", f"  {profit}", f"  估算换手率：平均每次 {turnover:.1f}%", "", f"行业配置：{sector_d}", f"  集中度：{concentration}（HHI={hhi:.2f}）", "", f"近期动作："]
        
        # 添加近期动作
        if labels:
            lines.extend(f"  • {lbl}" for lbl in labels[:4])
        else:
            lines.append("  • 近期无显著调仓")
        
        lines.append("")
        lines.append("风险评估：")
        lines.extend(f"  • {r}" for r in risks)
        results[pid] = '\n'.join(lines)

        # 收集最大动作（用于【近期重点动作】）
        if rebs:
            biggest = max(rebs, key=lambda r: abs(float(r.get('to_ratio', 0)) - float(r.get('from_ratio', 0))))
            key_actions.append((abs(float(biggest.get('to_ratio', 0)) - float(biggest.get('from_ratio', 0))), biggest, p['name']))

    # ── 4. 跨组合对比 ───────────────────────────────────────────
    cross_lines = []
    if common_stocks:
        cross_lines.append(f"共同重仓：{'、'.join(common_stocks)}（两组合持仓>5%的共同持股）")
    if cross_sec_signal:
        cross_lines.append(cross_sec_signal)
    if len(all_ids) > 1:
        diff_notes = []
        for stock in (common_stocks or []):
            vals = []
            for pid in all_ids:
                v = next((float(h.get('position_ratio', 0)) for h in holdings_map.get(pid, []) if h['stock_name'] == stock), None)
                if v is not None:
                    vals.append(v)
            if len(vals) > 1 and max(vals) - min(vals) > 5:
                diff_notes.append(f"{stock}（{'/'.join(str(round(v, 1)) for v in vals)}%）")
        if diff_notes:
            cross_lines.append(f"仓位差异：{'；'.join(diff_notes)}")
        else:
            cross_lines.append("仓位结构高度一致")

    # ── 5. 近期重点动作 ─────────────────────────────────────────
    if key_actions:
        _, best, pname = max(key_actions, key=lambda x: x[0])
        delta = float(best.get('to_ratio', 0)) - float(best.get('from_ratio', 0))
        if delta > 0:
            cross_lines.append(f"重点动作：{pname} 大幅建仓 {best['stock_name']} {abs(delta):.1f}%")
        else:
            cross_lines.append(f"重点动作：{pname} 大幅减仓 {best['stock_name']} {abs(delta):.1f}%")

    # 将跨组合部分添加到各组合观察中
    for pid, obs in results.items():
        if cross_lines:
            results[pid] = obs + '\n\n跨组合对比：\n' + '\n'.join(f"  • {line}" for line in cross_lines)

    return results

if __name__ == '__main__':
    import json
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == '--help':
        print(__doc__)
    elif len(sys.argv) > 1 and sys.argv[1] == '--json':
        data = json.loads(sys.stdin.read())
        obs = generate_observations(
            data['portfolio_list'],
            data['holdings_map'],
            data['rebalances_map'],
        )
        print(json.dumps(obs, ensure_ascii=False))
    else:
        print(__doc__)
