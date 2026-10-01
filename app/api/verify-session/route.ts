import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ verified: false, error: 'Missing session ID' }, { status: 400 });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json({ verified: false, error: 'Payment gateway configuration missing' }, { status: 500 });
  }

  try {
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20' as any,
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      return NextResponse.json({
        verified: true,
        scanId: session.metadata?.scanId || null,
      });
    }

    return NextResponse.json({ verified: false, error: 'Payment incomplete or pending' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ verified: false, error: 'Invalid or expired session ID' }, { status: 400 });
  }
}