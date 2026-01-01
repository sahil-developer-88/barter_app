import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";
import { calculateTransactionSplit } from '../utils/split-calculator.ts';

/**
 * Handle Shopify POS webhook events
 * Docs: https://shopify.dev/docs/api/admin-rest/2023-10/resources/webhook
 * Supports: orders/create, products/create, products/update, products/delete
 */
export async function handleShopifyWebhook(
  payload: any,
  headers: any,
  supabase: any
): Promise<any> {
  console.log('🟩 Processing Shopify webhook');

  // Verify webhook signature
  const signature = headers['x-shopify-hmac-sha256'];
  const webhookSecret = Deno.env.get('SHOPIFY_WEBHOOK_SECRET');

  if (webhookSecret && signature) {
    const isValid = verifyShopifySignature(
      JSON.stringify(payload),
      signature,
      webhookSecret
    );

    if (!isValid) {
      console.error('❌ Invalid Shopify signature');
      return { success: false, error: 'Invalid signature' };
    }
  }

  const topic = headers['x-shopify-topic'];
  console.log('📦 Webhook topic:', topic);

  // Handle product webhooks
  if (topic?.startsWith('products/')) {
    return await handleProductWebhook(topic, payload, headers, supabase);
  }

  // Handle order created/updated event
  if (payload.id && payload.total_price) {
    // Get merchant by shop domain
    const shopDomain = headers['x-shopify-shop-domain'];
    
    const { data: integration } = await supabase
      .from('pos_integrations')
      .select('user_id, config')
      .eq('provider', 'shopify')
      .eq('store_id', shopDomain)
      .single();

    if (!integration) {
      console.error('❌ No integration found for shop:', shopDomain);
      return { success: false, error: 'Integration not found' };
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from('pos_transactions')
      .select('id')
      .eq('pos_provider', 'shopify')
      .eq('external_transaction_id', payload.id.toString())
      .single();

    if (existing) {
      console.log('⚠️ Duplicate transaction, skipping');
      return { success: true, duplicate: true };
    }

    // Calculate barter split
    const totalAmount = parseFloat(payload.total_price);
    const barterConfig = integration.config?.barterPercentage || 25;
    
    const split = calculateTransactionSplit(
      totalAmount,
      barterConfig,
      parseFloat(payload.total_tip_received || 0)
    );

    // Parse line items
    const items = payload.line_items?.map((item: any) => ({
      name: item.title,
      quantity: item.quantity,
      price: parseFloat(item.price),
      sku: item.sku
    })) || [];

    // Insert transaction
    const { data: transaction, error } = await supabase
      .from('pos_transactions')
      .insert({
        merchant_id: integration.user_id,
        external_transaction_id: payload.id.toString(),
        pos_provider: 'shopify',
        total_amount: totalAmount,
        currency: payload.currency || 'USD',
        tax_amount: parseFloat(payload.total_tax || 0),
        tip_amount: parseFloat(payload.total_tip_received || 0),
        discount_amount: parseFloat(payload.total_discounts || 0),
        barter_amount: split.barterAmount,
        barter_percentage: split.barterPercentage,
        cash_amount: split.cashAmount,
        card_amount: split.cardAmount,
        items: items,
        customer_info: payload.customer ? {
          id: payload.customer.id,
          email: payload.customer.email,
          name: `${payload.customer.first_name} ${payload.customer.last_name}`
        } : null,
        location_id: payload.location_id?.toString(),
        transaction_date: payload.created_at,
        webhook_signature: signature,
        raw_webhook_data: payload,
        status: payload.financial_status === 'paid' ? 'completed' : 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error inserting transaction:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Shopify transaction processed:', transaction.id);
    return { success: true, transaction_id: transaction.id };
  }

  return { success: true, message: 'Event type not handled' };
}

/**
 * Handle product webhook events (create, update, delete)
 */
async function handleProductWebhook(
  topic: string,
  payload: any,
  headers: any,
  supabase: any
): Promise<any> {
  const shopDomain = headers['x-shopify-shop-domain'];

  // Get merchant integration
  const { data: integration } = await supabase
    .from('pos_integrations')
    .select('user_id, id, config')
    .eq('provider', 'shopify')
    .eq('store_id', shopDomain)
    .single();

  if (!integration) {
    console.error('❌ No integration found for shop:', shopDomain);
    return { success: false, error: 'Integration not found' };
  }

  // Get merchant's first business for product association
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', integration.user_id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (!business) {
    console.error('❌ No business found for merchant:', integration.user_id);
    return { success: false, error: 'Business not found' };
  }

  const externalProductId = payload.id.toString();

  // Handle product deletion
  if (topic === 'products/delete') {
    console.log('🗑️ Deleting product:', externalProductId);

    const { error } = await supabase
      .from('products')
      .update({
        is_active: false,
        is_archived: true,
        updated_at: new Date().toISOString()
      })
      .eq('external_product_id', externalProductId)
      .eq('pos_integration_id', integration.id);

    if (error) {
      console.error('❌ Error archiving product:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Product archived successfully');
    return { success: true, action: 'deleted' };
  }

  // Handle product create/update
  const variants = payload.variants || [];
  const mainVariant = variants[0] || {};

  // Get or create product category
  let categoryId = null;
  if (payload.product_type) {
    const { data: category } = await supabase
      .from('product_categories')
      .select('id')
      .eq('name', payload.product_type)
      .single();

    if (category) {
      categoryId = category.id;
    } else {
      // Create new category
      const { data: newCategory } = await supabase
        .from('product_categories')
        .insert({
          name: payload.product_type,
          barter_enabled: true,
          is_restricted: false
        })
        .select('id')
        .single();

      categoryId = newCategory?.id;
    }
  }

  // Check if product already exists
  const { data: existingProduct } = await supabase
    .from('products')
    .select('id')
    .eq('external_product_id', externalProductId)
    .eq('pos_integration_id', integration.id)
    .single();

  const productData = {
    merchant_id: integration.user_id,
    business_id: business.id,
    pos_integration_id: integration.id,
    external_product_id: externalProductId,
    external_variant_id: mainVariant.id?.toString(),
    name: payload.title,
    description: payload.body_html?.replace(/<[^>]*>/g, '') || null, // Strip HTML
    sku: mainVariant.sku,
    barcode: mainVariant.barcode,
    price: parseFloat(mainVariant.price || 0),
    cost: parseFloat(mainVariant.compare_at_price || 0),
    category_id: categoryId,
    stock_quantity: mainVariant.inventory_quantity || 0,
    image_url: payload.image?.src || null,
    is_active: payload.status === 'active',
    is_archived: false,
    barter_enabled: true,
    metadata: {
      vendor: payload.vendor,
      tags: payload.tags,
      variant_count: variants.length,
      shopify_handle: payload.handle
    }
  };

  if (existingProduct) {
    // Update existing product
    console.log('📝 Updating product:', externalProductId);

    const { error } = await supabase
      .from('products')
      .update({
        ...productData,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingProduct.id);

    if (error) {
      console.error('❌ Error updating product:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Product updated successfully');
    return { success: true, action: 'updated', product_id: existingProduct.id };
  } else {
    // Create new product
    console.log('➕ Creating product:', payload.title);

    const { data: newProduct, error } = await supabase
      .from('products')
      .insert(productData)
      .select('id')
      .single();

    if (error) {
      console.error('❌ Error creating product:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Product created successfully');
    return { success: true, action: 'created', product_id: newProduct.id };
  }
}

/**
 * Verify Shopify webhook signature
 */
function verifyShopifySignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const hmac = createHmac('sha256', secret);
  hmac.update(body);
  const expectedSignature = hmac.digest('base64');

  return signature === expectedSignature;
}
