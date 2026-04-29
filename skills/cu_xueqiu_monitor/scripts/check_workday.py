#!/usr/bin/env python3
"""
中国工作日判断
输出：WORKDAY 或 NOT_WORKDAY
"""
import sys
import datetime

try:
    import chinese_calendar
    on_holiday, holiday_name = chinese_calendar.is_holiday(datetime.date.today())
    is_workday = not on_holiday
except ImportError:
    # 无库时按周一~周五判断
    is_workday = datetime.date.today().weekday() < 5

if not is_workday:
    print('NOT_WORKDAY')
    sys.exit(0)
print('WORKDAY')
