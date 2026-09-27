import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' as any })
  : null;

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'STRIPE_SECRET_KEY is not configured in environment variables.' },
        { status: 500 }
      );
    }

    const { scanId } = await req.json().catch(() => ({ scanId: null }));
    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'AuraScan AI - Full Appearance & Aesthetic Audit',
              description: 'Unlocks complete facial harmony analysis, posture breakdown, wardrobe palette, and 30-day glow-up protocol.',
            },
            unit_amount: 999,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        scanId: scanId || 'unknown_scan',
      },
      success_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}&paid=true`,
      cancel_url: `${origin}/`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to initiate Stripe checkout.' },
      { status: 500 }
    );
  }
}