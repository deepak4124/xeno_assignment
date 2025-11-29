import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the backend .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SECRET = process.env.SHOPIFY_API_SECRET;
const SHOP_DOMAIN = process.env.SHOP_DOMAIN || 'deepak-test-dev.myshopify.com';
const API_URL = 'http://localhost:3000/api/webhooks';

if (!SECRET) {
  console.error('❌ Error: SHOPIFY_API_SECRET not found in .env');
  process.exit(1);
}

const payload = {
  id: 820982911946154508,
  email: "test.webhook@example.com",
  closed_at: null,
  created_at: "2025-11-29T11:00:00-05:00",
  updated_at: "2025-11-29T11:00:00-05:00",
  number: 234,
  note: null,
  token: "1234567890abcdef",
  gateway: "bogus",
  test: true,
  total_price: "199.00",
  subtotal_price: "190.00",
  total_weight: 0,
  total_tax: "9.00",
  taxes_included: false,
  currency: "USD",
  financial_status: "paid",
  confirmed: true,
  total_discounts: "0.00",
  total_line_items_price: "190.00",
  cart_token: "abcdef1234567890",
  buyer_accepts_marketing: false,
  name: "#1234",
  referring_site: null,
  landing_site: null,
  cancelled_at: null,
  cancel_reason: null,
  total_price_usd: "199.00",
  checkout_token: "abcdef1234567890",
  reference: null,
  user_id: null,
  location_id: null,
  source_identifier: null,
  source_url: null,
  processed_at: "2025-11-29T11:00:00-05:00",
  device_id: null,
  phone: null,
  customer_locale: "en",
  app_id: null,
  browser_ip: null,
  landing_site_ref: null,
  order_number: 1234,
  discount_applications: [],
  discount_codes: [],
  note_attributes: [],
  payment_gateway_names: ["bogus"],
  processing_method: "direct",
  checkout_id: null,
  source_name: "web",
  fulfillment_status: null,
  tax_lines: [],
  tags: "",
  contact_email: "test.webhook@example.com",
  order_status_url: "https://checkout.shopify.com/123456/orders/abcdef1234567890/status",
  presentment_currency: "USD",
  total_line_items_price_set: {
    shop_money: { amount: "190.00", currency_code: "USD" },
    presentment_money: { amount: "190.00", currency_code: "USD" }
  },
  total_discounts_set: {
    shop_money: { amount: "0.00", currency_code: "USD" },
    presentment_money: { amount: "0.00", currency_code: "USD" }
  },
  total_shipping_price_set: {
    shop_money: { amount: "0.00", currency_code: "USD" },
    presentment_money: { amount: "0.00", currency_code: "USD" }
  },
  subtotal_price_set: {
    shop_money: { amount: "190.00", currency_code: "USD" },
    presentment_money: { amount: "190.00", currency_code: "USD" }
  },
  total_price_set: {
    shop_money: { amount: "199.00", currency_code: "USD" },
    presentment_money: { amount: "199.00", currency_code: "USD" }
  },
  total_tax_set: {
    shop_money: { amount: "9.00", currency_code: "USD" },
    presentment_money: { amount: "9.00", currency_code: "USD" }
  },
  line_items: [],
  shipping_lines: [],
  billing_address: {},
  shipping_address: {},
  customer: {
    id: 1234567890,
    email: "test.webhook@example.com",
    accepts_marketing: false,
    created_at: "2025-11-29T11:00:00-05:00",
    updated_at: "2025-11-29T11:00:00-05:00",
    first_name: "Test",
    last_name: "User",
    orders_count: 0,
    state: "disabled",
    total_spent: "0.00",
    last_order_id: null,
    note: null,
    verified_email: true,
    multipass_identifier: null,
    tax_exempt: false,
    phone: null,
    tags: "",
    last_order_name: null,
    currency: "USD",
    accepts_marketing_updated_at: "2025-11-29T11:00:00-05:00",
    marketing_opt_in_level: null,
    tax_exemptions: [],
    admin_graphql_api_id: "gid://shopify/Customer/1234567890",
    default_address: {}
  }
};

// 1. Stringify the payload exactly as it will be sent
const rawBody = JSON.stringify(payload);

// 2. Calculate HMAC SHA256
const hmac = crypto
  .createHmac('sha256', SECRET)
  .update(rawBody, 'utf8')
  .digest('base64');

console.log(`🔐 Generated HMAC: ${hmac}`);
console.log(`🏪 Shop Domain: ${SHOP_DOMAIN}`);
console.log(`📡 Sending webhook to ${API_URL}...`);

// 3. Send the request
axios.post(API_URL, payload, {
  headers: {
    'X-Shopify-Topic': 'orders/create',
    'X-Shopify-Shop-Domain': SHOP_DOMAIN,
    'X-Shopify-Hmac-Sha256': hmac,
    'Content-Type': 'application/json'
  }
})
.then(res => {
  console.log(`✅ Success! Status: ${res.status}`);
  console.log(`Response: ${res.data}`);
})
.catch(err => {
  console.error('❌ Failed to send webhook');
  if (err.response) {
    console.error(`Status: ${err.response.status}`);
    console.error(`Data: ${err.response.data}`);
  } else {
    console.error(err.message);
  }
});
