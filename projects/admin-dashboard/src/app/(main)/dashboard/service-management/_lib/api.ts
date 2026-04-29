import { executeCommand } from './utils';
import type { Service, Port, SystemResource, ServiceOverview, WebService } from './types';

export async function getSystemServices(): Promise<Service[]> {
  try {
    const result = await executeCommand('systemctl list-units --type=service --state=running --no-pager --no-legend');
    return parseServicesOutput(result);
  } catch (error) {
    console.error('Failed to get services:', error);
    return [];
  }
}

export async function getAllServices(): Promise<Service[]> {
  try {
    // 获取所有服务，包括停止的
    const result = await executeCommand('systemctl list-units --type=service --all --no-pager --no-legend');
    return parseServicesOutput(result);
  } catch (error) {
    console.error('Failed to get all services:', error);
    return [];
  }
}

export async function getServiceStatus(serviceName: string): Promise<string> {
  try {
    const result = await executeCommand(`systemctl is-active ${serviceName}`);
    return result.trim();
  } catch (error) {
    return 'unknown';
  }
}

export async function getServiceLogs(serviceName: string): Promise<{ logs: string; service: string }> {
  try {
    // 获取最近的日志，限制行数避免数据过大
    const result = await executeCommand(`journalctl -u ${serviceName}.service -n 100 --no-pager`);
    return {
      service: serviceName,
      logs: result
    };
  } catch (error: any) {
    return {
      service: serviceName,
      logs: `无法获取日志: ${error.message}`
    };
  }
}

export async function getServiceConfig(serviceName: string): Promise<{ config: string; service: string; path: string }> {
  try {
    // 尝试找到服务的配置文件
    const serviceFile = await executeCommand(`systemctl show ${serviceName} -p FragmentPath`);
    const configPath = serviceFile.replace('FragmentPath=', '').trim() || '';

    let config = '';
    if (configPath && configPath !== '') {
      try {
        config = await executeCommand(`cat ${configPath}`);
      } catch (err) {
        config = `无法读取配置文件: ${err}`;
      }
    } else {
      config = '该服务没有配置文件或配置文件路径未知';
    }

    return {
      service: serviceName,
      path: configPath,
      config
    };
  } catch (error: any) {
    return {
      service: serviceName,
      path: '',
      config: `无法获取配置文件: ${error.message}`
    };
  }
}

export async function restartService(serviceName: string): Promise<{ success: boolean; message: string }> {
  try {
    await executeCommand(`sudo systemctl restart ${serviceName}`);
    return { success: true, message: `服务 ${serviceName} 重启成功` };
  } catch (error) {
    return { success: false, message: `重启失败: ${error}` };
  }
}

export async function stopService(serviceName: string): Promise<{ success: boolean; message: string }> {
  try {
    await executeCommand(`sudo systemctl stop ${serviceName}`);
    return { success: true, message: `服务 ${serviceName} 已停止` };
  } catch (error) {
    return { success: false, message: `停止失败: ${error}` };
  }
}

export async function startService(serviceName: string): Promise<{ success: boolean; message: string }> {
  try {
    await executeCommand(`sudo systemctl start ${serviceName}`);
    return { success: true, message: `服务 ${serviceName} 已启动` };
  } catch (error) {
    return { success: false, message: `启动失败: ${error}` };
  }
}

export async function getListeningPorts(): Promise<Port[]> {
  try {
    const result = await executeCommand('ss -tlnp');
    return parsePortsOutput(result);
  } catch (error) {
    console.error('Failed to get ports:', error);
    return [];
  }
}

export async function getSystemResources(): Promise<SystemResource> {
  try {
    const [cpuResult, memResult, diskResult] = await Promise.all([
      executeCommand("cat /proc/loadavg && awk '/cpu /{print 100*($2+$4)/($2+$4+$5)}' /proc/stat"),
      executeCommand('free -m'),
      executeCommand("df -h / | awk 'NR==2{print $2,$3,$4,$5}'")
    ]);

    return parseResourcesOutput(cpuResult, memResult, diskResult);
  } catch (error) {
    console.error('Failed to get resources:', error);
    return getDefaultResources();
  }
}

export async function getServiceOverview(): Promise<ServiceOverview> {
  try {
    const [services, ports, resources, webServices] = await Promise.all([
      getAllServices(),
      getListeningPorts(),
      getSystemResources(),
      getWebServices()
    ]);

    const running = services.filter(s => s.state === 'running').length;
    const stopped = services.filter(s => s.state === 'stopped').length;
    const failed = services.filter(s => s.state === 'failed').length;

    return {
      totalServices: services.length,
      runningServices: running,
      stoppedServices: stopped,
      failedServices: failed,
      listeningPorts: ports.length,
      systemLoad: resources.cpu.load1m,
      webServices: webServices.length
    };
  } catch (error) {
    console.error('Failed to get overview:', error);
    return getDefaultOverview();
  }
}

export async function getWebServices(): Promise<WebService[]> {
  try {
    // 获取包含next、node、python等Web服务相关的进程
    const result = await executeCommand('ps aux | grep -E "(next|node.*dev|python.*http|uvicorn|gunicorn)" | grep -v grep');
    return parseWebServicesOutput(result);
  } catch (error) {
    console.error('Failed to get web services:', error);
    return [];
  }
}

function parseWebServicesOutput(output: string): WebService[] {
  const webServices: WebService[] = [];
  const lines = output.trim().split('\n');

  for (const line of lines) {
    // ps aux格式：USER PID %CPU %MEM VSZ RSS TTY STAT START TIME COMMAND
    const parts = line.trim().split(/\s+/);
    if (parts.length < 11) continue;

    const pid = parseInt(parts[1]);
    const cpu = parseFloat(parts[2]);
    const memory = parseFloat(parts[3]);
    const command = parts.slice(10).join(' ');

    // 检测服务类型
    let type: 'nextjs' | 'node' | 'python' | 'other' = 'other';
    let name = 'Unknown Service';
    let port = '';

    if (command.includes('next-server') || command.includes('next dev')) {
      type = 'nextjs';
      name = 'Next.js Dev Server';
      // 尝试获取端口号（通常是3000）
      port = '3000';
    } else if (command.includes('node') && command.includes('dev')) {
      type = 'node';
      name = 'Node.js Dev Server';
    } else if (command.includes('uvicorn') || command.includes('gunicorn')) {
      type = 'python';
      name = 'Python Web Server';
    } else if (command.includes('node')) {
      type = 'node';
      name = 'Node.js Application';
    }

    // 计算运行时间（简化版）
    const uptime = calculateUptime(parts[8]);

    webServices.push({
      pid,
      name,
      command: command.substring(0, 100), // 限制命令长度
      cpu,
      memory,
      port,
      uptime,
      type
    });
  }

  return webServices;
}

function calculateUptime(startTime: string): string {
  // 简化的运行时间计算
  try {
    const now = Date.now();
    // ps输出的时间格式比较复杂，这里简化处理
    return '运行中';
  } catch {
    return '未知';
  }
}

function parseServicesOutput(output: string): Service[] {
  const services: Service[] = [];
  const lines = output.trim().split('\n');

  for (const line of lines) {
    // 移除行首尾空格，然后分割
    const trimmedLine = line.trim();
    const parts = trimmedLine.split(/\s+/);
    if (parts.length < 4) continue;

    const name = parts[0].replace('.service', '');
    // 修正：parts[3]在trim后是running状态，但需要检查实际字段位置
    // 原始格式：name.service loaded active running description
    const state = parts[3] === 'running' ? 'running' : parts[3] === 'failed' ? 'failed' : 'stopped';
    const description = parts.slice(4).join(' ') || '无描述';

    // 过滤掉系统服务，只显示应用服务
    if (isSystemService(name)) continue;

    services.push({
      name,
      state,
      description,
      type: 'app'
    });
  }

  return services;
}

function parsePortsOutput(output: string): Port[] {
  const ports: Port[] = [];
  const lines = output.trim().split('\n').slice(1); // 跳过标题行

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    const parts = trimmedLine.split(/\s+/);
    if (parts.length < 5) continue;

    // ss输出格式：State Recv-Q Send-Q Local Address:Port Peer Address:Port Process
    // 例如：LISTEN 0      511          0.0.0.0:18789      0.0.0.0:*    users:(("nginx",pid=242445,fd=5))
    const state = parts[0];
    const localAddress = parts[3]; // Local Address:Port
    const processInfo = parts.slice(5).join(' ') || ''; // 剩余部分是进程信息

    // 确定协议类型（基于state推断）
    const protocol = state.toLowerCase().includes('tcp') ? 'tcp' : 'udp';

    // 解析端口号
    let port = '';
    if (localAddress.includes(':')) {
      const addressParts = localAddress.split(':');
      port = addressParts[addressParts.length - 1];

      // 如果是*，表示监听所有端口，需要提取实际端口号
      if (port === '*') {
        // 从Peer Address:Port部分可能包含实际端口信息
        const peerAddress = parts[4] || '';
        if (peerAddress.includes(':')) {
          const peerParts = peerAddress.split(':');
          if (peerParts[peerParts.length - 1] !== '*') {
            port = peerParts[peerParts.length - 1];
          }
        }
      }
    }

    // 解析进程信息
    const pidMatch = processInfo.match(/pid=(\d+)/);
    const pid = pidMatch ? parseInt(pidMatch[1]) : 0;

    // 提取进程名称（在引号中的部分）
    const nameMatch = processInfo.match(/"([^"]+)"/);
    const process = nameMatch ? nameMatch[1] : 'unknown';

    // 只有当有有效端口号时才添加
    if (port && port !== '*' && port !== '') {
      ports.push({
        port,
        protocol,
        address: localAddress,
        process,
        pid,
        state: state === 'LISTEN' ? 'listening' : 'established'
      });
    }
  }

  return ports;
}

function parseResourcesOutput(cpuResult: string, memResult: string, diskResult: string): SystemResource {
  // 解析CPU和负载
  const cpuLines = cpuResult.split('\n');
  const loadavgParts = cpuLines[0].split(/\s+/);
  const load1m = parseFloat(loadavgParts[0]);
  const load5m = parseFloat(loadavgParts[1]);
  const load15m = parseFloat(loadavgParts[2]);
  const cpuUsage = parseFloat(cpuLines[1] || '0');

  // 解析内存
  const memLines = memResult.split('\n');
  const memParts = memLines[1].split(/\s+/);
  const totalMem = parseInt(memParts[1]);
  const usedMem = parseInt(memParts[2]);
  const freeMem = parseInt(memParts[3]);
  const memUsage = (usedMem / totalMem) * 100;

  // 解析磁盘
  const diskParts = diskResult.split(/\s+/);
  const totalDisk = parseSize(diskParts[0]);
  const usedDisk = parseSize(diskParts[1]);
  const freeDisk = parseSize(diskParts[2]);
  const diskUsage = parseFloat(diskParts[3].replace('%', ''));

  return {
    cpu: {
      usage: cpuUsage,
      cores: 0, // 需要从/proc/cpuinfo获取
      load1m,
      load5m,
      load15m
    },
    memory: {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      usage: memUsage
    },
    disk: {
      total: totalDisk,
      used: usedDisk,
      free: freeDisk,
      usage: diskUsage
    }
  };
}

function parseSize(sizeStr: string): number {
  const units: { [key: string]: number } = {
    'G': 1024,
    'M': 1,
    'K': 1 / 1024
  };
  const match = sizeStr.match(/^(\d+(?:\.\d+)?)([GMK])?$/);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2] || 'M';
  return value * (units[unit] || 1);
}

function isSystemService(serviceName: string): boolean {
  const systemPrefixes = [
    'systemd-', 'dbus-', 'network-', 'ssh-', 'cron-',
    'rsyslog', 'syslog', 'getty@', 'console-'
  ];
  return systemPrefixes.some(prefix => serviceName.startsWith(prefix));
}

function getDefaultResources(): SystemResource {
  return {
    cpu: { usage: 0, cores: 0, load1m: 0, load5m: 0, load15m: 0 },
    memory: { total: 0, used: 0, free: 0, usage: 0 },
    disk: { total: 0, used: 0, free: 0, usage: 0 }
  };
}

function getDefaultOverview(): ServiceOverview {
  return {
    totalServices: 0,
    runningServices: 0,
    stoppedServices: 0,
    failedServices: 0,
    listeningPorts: 0,
    systemLoad: 0,
    webServices: 0
  };
}
