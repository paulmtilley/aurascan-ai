import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!stripeSecretKey || !webhookSecret) {
    console.error('[Stripe Webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET.');
    return NextResponse.json({ error: 'Server payment configuration missing' }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20' as any,
  });

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error(`[Stripe Webhook Signature Error]: ${err.message}`);
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
  }

  // Handle successful payment completion
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const scanId = session.metadata?.scanId || 'Order';
    const customerEmail = session.customer_details?.email || session.customer_email;
    const customerName = session.customer_details?.name || 'Customer';

    console.log(`[Stripe Webhook] Payment confirmed for scan: ${scanId}, customer: ${customerEmail}`);

    if (customerEmail && resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);

        await resend.emails.send({
          from: 'AuraScan AI <onboarding@resend.dev>', // Once your domain is verified on Resend, use orders@aurascan.ai
          to: customerEmail,
          subject: `Your AuraScan AI Style & Photo Guide Receipt [Ref: ${scanId}]`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #18181b; line-height: 1.5;">
              <div style="border-bottom: 2px solid #f4f4f5; padding-bottom: 16px; margin-bottom: 24px;">
                <h1 style="font-size: 20px; font-weight: 800; color: #18181b; margin: 0;">AuraScan AI</h1>
                <p style="font-size: 13px; color: #71717a; margin: 4px 0 0 0;">Personal Style & Profile Photo Action Guide</p>
              </div>

              <p style="font-size: 14px; color: #27272a;">Hello ${customerName},</p>
              
              <p style="font-size: 14px; color: #27272a;">
                Thank you for your order. Your payment of <strong>£7.99</strong> has cleared, and your personal style and photography audit reference is confirmed:
              </p>

              <div style="background-color: #f4f4f5; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; font-size: 12px; color: #71717a; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Order Details</p>
                <p style="margin: 6px 0 0 0; font-size: 14px; font-weight: 600; color: #18181b;">Reference ID: ${scanId}</p>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #52525b;">Product: Complete 6-Part Style & Photo Guide</p>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #52525b;">Amount Paid: £7.99 (One-time)</p>
              </div>

              <div style="margin: 24px 0;">
                <h3 style="font-size: 14px; font-weight: 700; color: #18181b; margin-bottom: 8px;">Key Reminders from Your Guide:</h3>
                <ul style="font-size: 13px; color: #52525b; padding-left: 18px; margin: 0;">
                  <li style="margin-bottom: 6px;"><strong>Test with what you own first:</strong> Assemble outfits using existing clothes before purchasing replacement items.</li>
                  <li style="margin-bottom: 6px;"><strong>Camera Calibration:</strong> Retake profile photos facing indirect window daylight with your camera lens at eye height.</li>
                  <li style="margin-bottom: 6px;"><strong>Save / Print:</strong> Use the "Print / Save as PDF" button in your active browser window to retain an offline copy of your full report.</li>
                </ul>
              </div>

              <p style="font-size: 13px; color: #52525b;">
                If your browser closed before printing your PDF or if you need assistance, simply reply to this email or contact <a href="mailto:support@aurascan.ai" style="color: #7c3aed; text-decoration: none;">support@aurascan.ai</a> quoting reference <strong>${scanId}</strong>.
              </p>

              <div style="border-top: 1px solid #f4f4f5; padding-top: 16px; margin-top: 32px; font-size: 11px; color: #a1a1aa; text-align: center;">
                <p style="margin: 0;">AuraScan AI · Operated by PT Digital Consulting (UK)</p>
                <p style="margin: 4px 0 0 0;">14-day refund guarantee applies to all single-report purchases.</p>
              </div>
            </div>
          `,
        });

        console.log(`[Resend] Receipt email successfully dispatched to ${customerEmail}`);
      } catch (emailErr: any) {
        console.error('[Resend Error] Failed to send receipt email:', emailErr);
        // Do not return a 500 to Stripe; payment already succeeded
      }
    }
  }

  return NextResponse.json({ received: true });
}