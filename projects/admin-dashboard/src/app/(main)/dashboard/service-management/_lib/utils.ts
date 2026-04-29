import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function executeCommand(command: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: 10000,
      maxBuffer: 1024 * 1024 // 1MB buffer
    });

    if (stderr && !stdout) {
      throw new Error(stderr);
    }

    return stdout.trim();
  } catch (error: any) {
    console.error(`Command execution failed: ${command}`, error);
    throw error;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}天 ${hours}小时`;
  } else if (hours > 0) {
    return `${hours}小时 ${minutes}分钟`;
  } else {
    return `${minutes}分钟`;
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'running':
      return 'text-green-600 bg-green-100';
    case 'stopped':
      return 'text-gray-600 bg-gray-100';
    case 'failed':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-yellow-600 bg-yellow-100';
  }
}

export function getStatusText(status: string): string {
  switch (status) {
    case 'running':
      return '运行中';
    case 'stopped':
      return '已停止';
    case 'failed':
      return '失败';
    default:
      return '未知';
  }
}
