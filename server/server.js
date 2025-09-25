const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'https://sirens-fortune-xr3h.bolt.host',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true
}));

// Raw body parser for webhook signature verification
app.use('/api/helio/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Verify Helio webhook signature
function verifyHelioSignature(payload, signature, secret) {
  if (!signature || !secret) {
    console.log('Missing signature or secret');
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    const providedSignature = signature.replace('sha256=', '');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Helio webhook endpoint
app.post('/api/helio/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-helio-signature'] || req.headers['x-signature'];
    const webhookSecret = process.env.HELIO_WEBHOOK_SECRET;
    
    console.log('Received webhook:', {
      headers: req.headers,
      hasSignature: !!signature,
      hasSecret: !!webhookSecret,
      bodyLength: req.body.length
    });

    // Verify signature if secret is provided
    if (webhookSecret && !verifyHelioSignature(req.body, signature, webhookSecret)) {
      console.log('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse the webhook payload
    const payload = JSON.parse(req.body.toString());
    console.log('Webhook payload:', payload);

    // Process the webhook event
    await processWebhookEvent(payload);

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Process different webhook events
async function processWebhookEvent(payload) {
  const { event, data } = payload;

  console.log(`Processing ${event} for transaction ${data.id}`);

  switch (event) {
    case 'payment.completed':
      await handlePaymentCompleted(data);
      break;
    
    case 'payment.failed':
      await handlePaymentFailed(data);
      break;
    
    case 'withdrawal.completed':
      await handleWithdrawalCompleted(data);
      break;
    
    case 'withdrawal.failed':
      await handleWithdrawalFailed(data);
      break;
    
    default:
      console.warn('Unknown webhook event:', event);
  }
}

async function handlePaymentCompleted(data) {
  console.log('✅ Payment completed:', {
    id: data.id,
    amount: data.amount,
    currency: data.currency,
    customerEmail: data.customerEmail,
    customerName: data.customerName
  });
  
  // TODO: Implement your business logic here:
  // 1. Update player balance in your database
  // 2. Apply 50% signup bonus for first-time deposits
  // 3. Send confirmation email to player
  // 4. Log transaction for accounting
  
  // Example: Apply 50% signup bonus for first deposits
  if (data.metadata?.isFirstDeposit) {
    const bonusAmount = data.amount * 0.5;
    console.log(`🎁 Applying 50% signup bonus: $${bonusAmount}`);
    // Credit bonus to player account in your database
  }
}

async function handlePaymentFailed(data) {
  console.log('❌ Payment failed:', {
    id: data.id,
    amount: data.amount,
    customerEmail: data.customerEmail,
    error: data.error
  });
  
  // TODO: Implement failure handling:
  // 1. Log the failure
  // 2. Notify the player via email
  // 3. Update transaction status in database
}

async function handleWithdrawalCompleted(data) {
  console.log('💰 Withdrawal completed:', {
    id: data.id,
    amount: data.amount,
    customerEmail: data.customerEmail
  });
  
  // TODO: Implement withdrawal completion:
  // 1. Update player balance
  // 2. Send confirmation email
  // 3. Log successful withdrawal
}

async function handleWithdrawalFailed(data) {
  console.log('⚠️ Withdrawal failed:', {
    id: data.id,
    amount: data.amount,
    customerEmail: data.customerEmail,
    error: data.error
  });
  
  // TODO: Implement withdrawal failure handling:
  // 1. Refund player balance
  // 2. Notify player of failure
  // 3. Log the issue for investigation
}

// Test endpoint for Helio integration
app.post('/api/helio/test', async (req, res) => {
  try {
    console.log('Test payment request:', req.body);
    
    // Simulate successful payment response
    const response = {
      id: `test_${Date.now()}`,
      status: 'completed',
      amount: req.body.amount,
      currency: req.body.currency || 'USD',
      customerEmail: req.body.customerEmail,
      customerName: req.body.customerName,
      transactionId: `txn_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: 'Test failed' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Sirens Fortune Backend running on port ${PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/api/helio/webhook`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});