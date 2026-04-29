import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "db", "xueqiu_portfolio.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
  }
  return db;
}

export interface Portfolio {
  id: string;
  name: string;
  creator: string;
  creator_url: string;
  create_date: string;
  followers: number;
  description: string;
  updated_at: string;
}

export interface PortfolioSnapshot {
  id: number;
  portfolio_id: string;
  net_value: number;
  total_return: number;
  daily_return: number;
  monthly_return: number;
  rank_percent: number;
  score: number;
  cash_ratio: number;
  rebalance_count_3m: number;
  rebalance_profit_3m: number;
  best_buy_3m: string | null;
  snapshot_at: string;
  latest_rebalance_time: string | null;
  observations: string | null;
}

export interface Holding {
  id: number;
  snapshot_id: number;
  portfolio_id: string;
  sector: string;
  sector_ratio: number;
  stock_name: string;
  stock_code: string;
  price: number;
  daily_change: number;
  position_ratio: number;
}

export interface Rebalance {
  id: number;
  portfolio_id: string;
  rebalance_time: string;
  stock_name: string;
  stock_code: string;
  from_ratio: number;
  to_ratio: number;
  price: number;
  is_dividend: number;
  is_cancelled: number;
  fetched_at: string;
}

export interface LatestRebalance {
  id: number;
  snapshot_id: number;
  stock_name: string;
  stock_code: string;
  from_ratio: number;
  to_ratio: number;
  price: number;
  rebalance_time: string;
}

export function getAllPortfolios(): Portfolio[] {
  const db = getDb();
  return db.prepare("SELECT * FROM portfolios ORDER BY name").all() as Portfolio[];
}

export function getPortfolioById(id: string): Portfolio | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM portfolios WHERE id = ?").get(id) as Portfolio | undefined;
}

export function getLatestSnapshot(portfolioId: string): PortfolioSnapshot | undefined {
  const db = getDb();
  return db
    .prepare(
      `SELECT ps.* FROM portfolio_snapshots ps
       INNER JOIN (
         SELECT DISTINCT h.snapshot_id
         FROM holdings h
         INNER JOIN portfolio_snapshots ps2 ON h.snapshot_id = ps2.id
         WHERE ps2.portfolio_id = ?
       ) valid ON ps.id = valid.snapshot_id
       WHERE ps.portfolio_id = ?
       ORDER BY ps.snapshot_at DESC LIMIT 1`,
    )
    .get(portfolioId, portfolioId) as PortfolioSnapshot | undefined;
}

export function getSnapshotsInRange(portfolioId: string, days: number): PortfolioSnapshot[] {
  const db = getDb();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  return db
    .prepare(
      `SELECT * FROM portfolio_snapshots
       WHERE portfolio_id = ? AND snapshot_at >= ?
       ORDER BY snapshot_at ASC`,
    )
    .all(portfolioId, fromDate.toISOString()) as PortfolioSnapshot[];
}

export function getHoldingsBySnapshotId(snapshotId: number): Holding[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM holdings WHERE snapshot_id = ? ORDER BY sector, position_ratio DESC")
    .all(snapshotId) as Holding[];
}

export function getHoldingsByPortfolioId(portfolioId: string): Holding[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM holdings WHERE portfolio_id = ? ORDER BY snapshot_id DESC, sector, position_ratio DESC")
    .all(portfolioId) as Holding[];
}

export function getLatestRebalances(portfolioId: string, limit: number = 50): Rebalance[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM rebalances
       WHERE portfolio_id = ?
       ORDER BY id ASC
       LIMIT ?`,
    )
    .all(portfolioId, limit) as Rebalance[];
}

export function getLatestSnapshotHoldings(portfolioId: string): Holding[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT h.* FROM holdings h
       INNER JOIN (
         SELECT ps.id FROM portfolio_snapshots ps
         INNER JOIN (
           SELECT DISTINCT h.snapshot_id
           FROM holdings h
           INNER JOIN portfolio_snapshots ps2 ON h.snapshot_id = ps2.id
           WHERE ps2.portfolio_id = ?
         ) valid ON ps.id = valid.snapshot_id
         WHERE ps.portfolio_id = ?
         ORDER BY ps.snapshot_at DESC
         LIMIT 1
       ) latest ON h.snapshot_id = latest.id
       ORDER BY h.sector, h.position_ratio DESC`,
    )
    .all(portfolioId, portfolioId) as Holding[];
}

export function getLatestRebalanceByPortfolioId(portfolioId: string): LatestRebalance | undefined {
  const db = getDb();
  return db
    .prepare(
      `SELECT lr.* FROM latest_rebalances lr
       INNER JOIN portfolio_snapshots ps ON lr.snapshot_id = ps.id
       INNER JOIN holdings h ON h.snapshot_id = ps.id
       WHERE ps.portfolio_id = ?
       ORDER BY ps.snapshot_at DESC
       LIMIT 1`,
    )
    .get(portfolioId) as LatestRebalance | undefined;
}
