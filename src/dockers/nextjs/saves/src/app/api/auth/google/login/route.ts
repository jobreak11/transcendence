import { NextResponse } from "next/server";
import { BACKEND_URL } from "../../../../../lib/constants";

export async function GET() {
  const apiPath = '/auth/google/login';
  try {

    const res = await fetch(`${BACKEND_URL}${apiPath}`, 
      {
        redirect: 'manual',
      }
    );

    let targetURL = res.headers.get('location');

    if (!targetURL && res.url.includes('accounts.google.com')) {
      targetURL = res.url;
    }

    if (!targetURL) {
      throw new Error('No redirect URL found from backend');
    }

    return NextResponse.redirect(targetURL);

  } catch (error) {
    console.error('OAuth init error:', error);
    // this would mean internal error i think
    // just leave it as 500 first idk
    return NextResponse.json({
      message: `Failed to fetch from backend ${apiPath}`,
      error: error instanceof Error ? error.message : String(error),
    }, {status: 500});
  }
}