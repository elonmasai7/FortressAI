import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    threats: Math.floor(10 + Math.random() * 30),
    source: 'mock-scan-endpoint',
  });
}
