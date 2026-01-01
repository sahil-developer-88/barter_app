/**
 * Webhook Signature Verification Utility
 * Validates HMAC signatures for all POS providers to prevent fake webhooks
 */

import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

/**
 * Verify Square webhook signature
 * Uses HMAC SHA256 with timestamp
 */
export function verifySquareSignature(
  body: string,
  signature: string | undefined,
  timestamp: string | undefined
): boolean {
  const signatureKey = Deno.env.get('SQUARE_WEBHOOK_SIGNATURE_KEY');

  if (!signatureKey) {
    console.warn('⚠️ SQUARE_WEBHOOK_SIGNATURE_KEY not configured - signature verification disabled');
    return true; // Allow in development, but log warning
  }

  if (!signature || !timestamp) {
    console.error('❌ Square webhook missing signature or timestamp headers');
    return false;
  }

  try {
    // Square signature format: timestamp.body
    const payload = `${timestamp}.${body}`;
    const hmac = createHmac('sha256', signatureKey);
    hmac.update(payload);
    const expectedSignature = hmac.digest('base64');

    const isValid = signature === expectedSignature;

    if (!isValid) {
      console.error('❌ Square signature verification failed');
      console.error(`   Expected: ${expectedSignature.substring(0, 20)}...`);
      console.error(`   Received: ${signature.substring(0, 20)}...`);
    }

    return isValid;
  } catch (error) {
    console.error('❌ Error verifying Square signature:', error);
    return false;
  }
}

/**
 * Verify Shopify webhook signature
 * Uses HMAC SHA256
 */
export function verifyShopifySignature(
  body: string,
  signature: string | undefined
): boolean {
  const secret = Deno.env.get('SHOPIFY_WEBHOOK_SECRET');

  if (!secret) {
    console.warn('⚠️ SHOPIFY_WEBHOOK_SECRET not configured - signature verification disabled');
    return true;
  }

  if (!signature) {
    console.error('❌ Shopify webhook missing signature header');
    return false;
  }

  try {
    const hmac = createHmac('sha256', secret);
    hmac.update(body);
    const expectedSignature = hmac.digest('base64');

    const isValid = signature === expectedSignature;

    if (!isValid) {
      console.error('❌ Shopify signature verification failed');
    }

    return isValid;
  } catch (error) {
    console.error('❌ Error verifying Shopify signature:', error);
    return false;
  }
}

/**
 * Verify Clover webhook token
 * Uses simple token comparison (not HMAC)
 */
export function verifyCloverToken(
  receivedToken: string | undefined
): boolean {
  const expectedToken = Deno.env.get('CLOVER_WEBHOOK_VERIFICATION_TOKEN');

  if (!expectedToken) {
    console.warn('⚠️ CLOVER_WEBHOOK_VERIFICATION_TOKEN not configured - verification disabled');
    return true;
  }

  if (!receivedToken) {
    console.error('❌ Clover webhook missing verification token');
    return false;
  }

  const isValid = receivedToken === expectedToken;

  if (!isValid) {
    console.error('❌ Clover token verification failed');
  }

  return isValid;
}

/**
 * Verify Toast webhook signature
 * Uses HMAC SHA256
 */
export function verifyToastSignature(
  body: string,
  signature: string | undefined
): boolean {
  const secret = Deno.env.get('TOAST_WEBHOOK_SECRET');

  if (!secret) {
    console.warn('⚠️ TOAST_WEBHOOK_SECRET not configured - signature verification disabled');
    return true;
  }

  if (!signature) {
    console.error('❌ Toast webhook missing signature header');
    return false;
  }

  try {
    const hmac = createHmac('sha256', secret);
    hmac.update(body);
    const expectedSignature = hmac.digest('base64');

    const isValid = signature === expectedSignature;

    if (!isValid) {
      console.error('❌ Toast signature verification failed');
    }

    return isValid;
  } catch (error) {
    console.error('❌ Error verifying Toast signature:', error);
    return false;
  }
}

/**
 * Verify Lightspeed webhook signature
 * Uses HMAC SHA256
 */
export function verifyLightspeedSignature(
  body: string,
  signature: string | undefined
): boolean {
  const secret = Deno.env.get('LIGHTSPEED_WEBHOOK_SECRET');

  if (!secret) {
    console.warn('⚠️ LIGHTSPEED_WEBHOOK_SECRET not configured - signature verification disabled');
    return true;
  }

  if (!signature) {
    console.error('❌ Lightspeed webhook missing signature header');
    return false;
  }

  try {
    const hmac = createHmac('sha256', secret);
    hmac.update(body);
    const expectedSignature = hmac.digest('hex'); // Lightspeed uses hex encoding

    const isValid = signature === expectedSignature;

    if (!isValid) {
      console.error('❌ Lightspeed signature verification failed');
    }

    return isValid;
  } catch (error) {
    console.error('❌ Error verifying Lightspeed signature:', error);
    return false;
  }
}

/**
 * Verify webhook signature for any provider
 * Returns true if valid, false if invalid
 */
export function verifyWebhookSignature(
  provider: string,
  body: string,
  headers: Record<string, string>
): boolean {
  console.log(`🔐 Verifying ${provider} webhook signature...`);

  switch (provider.toLowerCase()) {
    case 'square': {
      const signature = headers['x-square-hmacsha256-signature'];
      const timestamp = headers['x-square-hmacsha256-timestamp'];
      return verifySquareSignature(body, signature, timestamp);
    }

    case 'shopify': {
      const signature = headers['x-shopify-hmac-sha256'];
      return verifyShopifySignature(body, signature);
    }

    case 'clover': {
      const token = headers['x-clover-verification-token'];
      return verifyCloverToken(token);
    }

    case 'toast': {
      const signature = headers['toast-signature'];
      return verifyToastSignature(body, signature);
    }

    case 'lightspeed': {
      const signature = headers['x-lightspeed-signature'];
      return verifyLightspeedSignature(body, signature);
    }

    case 'adyen': {
      // Adyen has its own verification in the provider handler
      // Uses HMAC SHA256 but with more complex logic
      console.log('ℹ️  Adyen signature verified in provider handler');
      return true;
    }

    default:
      console.warn(`⚠️ No signature verification implemented for provider: ${provider}`);
      return true; // Allow unknown providers for now
  }
}
