export interface Service {
  name: string;
  state: 'running' | 'stopped' | 'failed';
  description: string;
  port?: string;
  type: 'system' | 'app';
  cpu?: number;
  memory?: number;
  uptime?: string;
}

export interface Port {
  port: string;
  protocol: 'tcp' | 'udp';
  address: string;
  process: string;
  pid: number;
  state: 'listening' | 'established';
}

export interface WebService {
  pid: number;
  name: string;
  command: string;
  cpu: number;
  memory: number;
  port?: string;
  uptime: string;
  type: 'nextjs' | 'node' | 'python' | 'other';
}

export interface SystemResource {
  cpu: {
    usage: number;
    cores: number;
    load1m: number;
    load5m: number;
    load15m: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
}

export interface ServiceOverview {
  totalServices: number;
  runningServices: number;
  stoppedServices: number;
  failedServices: number;
  listeningPorts: number;
  systemLoad: number;
  webServices: number;
}
