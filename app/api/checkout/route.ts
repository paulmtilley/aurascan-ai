import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { scanId } = await req.json();

    if (!scanId) {
      return NextResponse.json({ error: 'Missing report reference ID' }, { status: 400 });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe configuration missing' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20' as any,
    });

    const host = req.headers.get('host') || 'aurascan-ai-six.vercel.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'AuraScan AI: Personal Style & Photography Guide',
              description: 'Complete 8-part personal guide: 3 outfits, starter colour swatches, repeatable camera setup, and 7-day action protocol.',
            },
            unit_amount: 799, // £7.99 in pence
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: { scanId },
      success_url: `${baseUrl}/?session_id={CHECKOUT_SESSION_ID}&scan_id=${encodeURIComponent(scanId)}`,
      cancel_url: `${baseUrl}/?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('[Stripe Checkout Error]:', err);
    return NextResponse.json({ error: err.message || 'Payment initiation failed' }, { status: 500 });
  }
}