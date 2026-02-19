import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    status: 'deployed',
    latencyMs: Math.floor(1200 + Math.random() * 1800),
    source: 'mock-tunnel-endpoint',
  });
}
