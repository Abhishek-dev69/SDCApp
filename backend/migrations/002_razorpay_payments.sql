CREATE TABLE IF NOT EXISTS razorpay_payments (
  id SERIAL PRIMARY KEY,
  student_sdc_id VARCHAR(50) NOT NULL,
  order_id VARCHAR(100) NOT NULL UNIQUE,
  payment_id VARCHAR(100),
  signature VARCHAR(200),
  amount INTEGER NOT NULL, -- in paise
  status VARCHAR(20) NOT NULL DEFAULT 'created', -- 'created', 'paid', 'failed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

