
export async function GET() {
		const res = await fetch(`http://nestjs:${process.env.TRANSCENDENCE_NESTJS_EXPOSE_PORT}/`)
}