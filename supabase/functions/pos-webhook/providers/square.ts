import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";
import { calculateTransactionSplit } from '../utils/split-calculator.ts';

/**
 * Handle Square webhook events
 * Docs: https://developer.squareup.com/docs/webhooks/overview
 */
export async function handleSquareWebhook(
  payload: any,
  headers: any,
  supabase: any
): Promise<any> {
  console.log('🟦 Processing Square webhook');

  // Verify webhook signature
  const signature = headers['x-square-hmacsha256-signature'];
  const webhookSignatureKey = Deno.env.get('SQUARE_WEBHOOK_SIGNATURE_KEY');
  
  if (webhookSignatureKey && signature) {
    const isValid = verifySquareSignature(
      JSON.stringify(payload),
      signature,
      webhookSignatureKey,
      headers['x-square-hmacsha256-timestamp']
    );
    
    if (!isValid) {
      console.error('❌ Invalid Square signature');
      return { success: false, error: 'Invalid signature' };
    }
  }

  // Handle payment completed event
  if (payload.type === 'payment.created' || payload.type === 'payment.updated') {
    const payment = payload.data?.object?.payment;
    
    if (!payment) {
      return { success: false, error: 'No payment data in webhook' };
    }

    // Get merchant by location_id
    const { data: integration } = await supabase
      .from('pos_integrations')
      .select('user_id, config')
      .eq('provider', 'square')
      .eq('store_id', payment.location_id)
      .single();

    if (!integration) {
      console.error('❌ No integration found for location:', payment.location_id);
      return { success: false, error: 'Integration not found' };
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from('pos_transactions')
      .select('id')
      .eq('pos_provider', 'square')
      .eq('external_transaction_id', payment.id)
      .single();

    if (existing) {
      console.log('⚠️ Duplicate transaction, skipping');
      return { success: true, duplicate: true };
    }

    // Calculate barter split
    const totalAmount = payment.amount_money?.amount / 100; // Square uses cents
    const barterConfig = integration.config?.barterPercentage || 25;
    
    const split = calculateTransactionSplit(
      totalAmount,
      barterConfig,
      payment.tip_money?.amount / 100 || 0
    );

    // Insert transaction
    const { data: transaction, error } = await supabase
      .from('pos_transactions')
      .insert({
        merchant_id: integration.user_id,
        external_transaction_id: payment.id,
        pos_provider: 'square',
        total_amount: totalAmount,
        currency: payment.amount_money?.currency || 'USD',
        tax_amount: payment.tax_money?.amount / 100 || 0,
        tip_amount: payment.tip_money?.amount / 100 || 0,
        barter_amount: split.barterAmount,
        barter_percentage: split.barterPercentage,
        cash_amount: split.cashAmount,
        card_amount: split.cardAmount,
        location_id: payment.location_id,
        transaction_date: payment.created_at,
        webhook_signature: signature,
        raw_webhook_data: payload,
        status: 'completed'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error inserting transaction:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Square transaction processed:', transaction.id);
    return { success: true, transaction_id: transaction.id };
  }

  return { success: true, message: 'Event type not handled' };
}

/**
 * Verify Square webhook signature
 */
function verifySquareSignature(
  body: string,
  signature: string,
  signatureKey: string,
  timestamp: string
): boolean {
  const payload = timestamp + '.' + body;
  const hmac = createHmac('sha256', signatureKey);
  hmac.update(payload);
  const expectedSignature = hmac.digest('base64');
  
  return signature === expectedSignature;
}
