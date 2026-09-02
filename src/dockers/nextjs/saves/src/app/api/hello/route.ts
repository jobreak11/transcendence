import { NextResponse } from 'next/server'

export async function GET() {
	try {
		const res = await fetch(`http://nestjs:${process.env.TRANSCENDENCE_NESTJS_EXPOSE_PORT}/`)

		const data = await res.text();
		return new NextResponse(data);
	} catch (error) {
		return NextResponse.json({error: 'Failed to fetch from NestJS' }, { status: 500});
	}
}
