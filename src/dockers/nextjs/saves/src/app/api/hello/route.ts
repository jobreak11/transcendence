import { NextResponse } from 'next/server'
import { BACKEND_URL } from '../../../lib/constants';

export async function GET() {
	try {
		const res = await fetch(`${BACKEND_URL}/`)

		const data = await res.text();
		return new NextResponse(data);
	} catch (error) {
		return NextResponse.json({error: 'Failed to fetch from NestJS' }, { status: 500});
	}
}
