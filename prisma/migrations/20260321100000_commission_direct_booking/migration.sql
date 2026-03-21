-- Add commission fields to agency profiles
ALTER TABLE agency_profiles ADD COLUMN commission_rate DECIMAL(5,2) DEFAULT 20.00;

-- Add direct booking table
CREATE TABLE direct_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  pay_amount INT, -- cents
  pay_currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'PENDING', -- PENDING, ACCEPTED, DECLINED, CONFIRMED, COMPLETED, CANCELLED
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_direct_bookings_brand ON direct_bookings(brand_id);
CREATE INDEX idx_direct_bookings_model ON direct_bookings(model_id);

-- Add social links to profiles table
ALTER TABLE profiles ADD COLUMN social_links JSONB DEFAULT '{}';

-- Add budget field to castings
ALTER TABLE castings ADD COLUMN budget INT; -- total budget in cents
