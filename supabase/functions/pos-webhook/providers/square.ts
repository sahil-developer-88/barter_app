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

  console.log('🔐 Signature verification - Key exists:', !!webhookSignatureKey);
  console.log('🔐 Signature exists:', !!signature);

  // if (webhookSignatureKey && signature) {
  //   const isValid =  (
  //     JSON.stringify(payload),
  //     signature,
  //     webhookSignatureKey,
  //     headers['x-square-hmacsha256-timestamp']
  //   );

  //   if (!isValid) {
  //     console.error('❌ Invalid Square signature');
  //     return { success: false, error: 'Invalid signature' };
  //   }
  //   console.log('✅ Signature verified successfully');
  // }

  // Handle payment completed event
  if (payload.type === 'payment.created' || payload.type === 'payment.updated') {
    console.log('📝 Event type:', payload.type);
    const payment = payload.data?.object?.payment;

    if (!payment) {
      console.error('❌ No payment data in webhook');
      return { success: false, error: 'No payment data in webhook' };
    }

    console.log('💳 Payment ID:', payment.id);
    console.log('📍 Location ID:', payment.location_id);
    console.log('💰 Amount:', payment.amount_money?.amount / 100);

    // Get merchant by location_id
    console.log('🔍 Looking for integration with store_id:', payment.location_id);
    const { data: integrations, error: integrationError } = await supabase
      .from('pos_integrations')
      .select('user_id, config')
      .eq('provider', 'square')
      .eq('store_id', payment.location_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    const integration = integrations?.[0];

    if (integrationError) {
      console.error('❌ Integration lookup error:', integrationError);
    }

    if (!integration) {
      console.error('❌ No integration found for location:', payment.location_id);
      return { success: false, error: 'Integration not found' };
    }

    console.log('✅ Integration found! User ID:', integration.user_id);

    // Check for duplicate
    console.log('🔍 Checking for duplicate transaction:', payment.id);
    const { data: existing, error: duplicateError } = await supabase
      .from('pos_transactions')
      .select('id')
      .eq('pos_provider', 'square')
      .eq('external_transaction_id', payment.id)
      .single();

    if (duplicateError && duplicateError.code !== 'PGRST116') {
      console.error('❌ Duplicate check error:', duplicateError);
    }

    if (existing) {
      console.log('⚠️ Duplicate transaction, skipping');
      return { success: true, duplicate: true };
    }

    console.log('✅ Not a duplicate, proceeding with insert');

    // Calculate barter split
    const totalAmount = payment.amount_money?.amount / 100; // Square uses cents
    const barterConfig = integration.config?.barterPercentage || 25;

    console.log('🧮 Calculating split - Total:', totalAmount, 'Barter %:', barterConfig);

    const split = calculateTransactionSplit(
      totalAmount,
      barterConfig,
      payment.tip_money?.amount / 100 || 0
    );

    console.log('🧮 Split result:', split);

    // Insert transaction
    console.log('💾 Attempting to insert transaction...');
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
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
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
