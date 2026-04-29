import { getLatestSnapshot } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const snapshot = getLatestSnapshot(id);

  if (!snapshot) {
    return NextResponse.json(
      { error: "未找到快照数据" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    daily_return: snapshot.daily_return,
    monthly_return: snapshot.monthly_return,
    total_return: snapshot.total_return,
    rank_percent: snapshot.rank_percent,
    cash_ratio: snapshot.cash_ratio,
    score: snapshot.score,
    observations: snapshot.observations,
  });
}
