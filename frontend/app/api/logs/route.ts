import { NextResponse } from 'next/server';
import { complianceLogs } from '@/data/mockData';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    logs: complianceLogs,
  });
}
