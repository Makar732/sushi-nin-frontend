import { NextResponse } from 'next/server';

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const { password } = await req.json();

    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, message: 'Неверный пароль' },
        { status: 401 }
      );
    }

    const secret = process.env.ADMIN_JWT_SECRET || 'fallback_secret';
    const response = NextResponse.json({ success: true });

    response.cookies.set('admin_token', secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

export async function DELETE(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('admin_token');
  return response;
}