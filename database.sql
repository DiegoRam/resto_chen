-- Supabase SQL Setup for Resto Chen

-- Create waiter_calls table
CREATE TABLE IF NOT EXISTS waiter_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total DECIMAL(10, 2) NOT NULL,
  items JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE waiter_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies for waiter_calls
CREATE POLICY "Allow anonymous read access to waiter_calls"
  ON waiter_calls
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert access to waiter_calls"
  ON waiter_calls
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policies for orders
CREATE POLICY "Allow anonymous read access to orders"
  ON orders
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert access to orders"
  ON orders
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update access to orders"
  ON orders
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- INSERT sample data (optional, for testing)
INSERT INTO orders (table_id, status, total, items)
VALUES
  ('1', 'pending', 42.50, '[{"id":"1", "name":"Chicken Curry", "quantity":2, "price":12.50}, {"id":"2", "name":"Steamed Rice", "quantity":2, "price":3.75}, {"id":"3", "name":"Thai Iced Tea", "quantity":2, "price":5.00}]'),
  ('3', 'preparing', 78.20, '[{"id":"1", "name":"Pad Thai", "quantity":3, "price":14.50}, {"id":"4", "name":"Spring Rolls", "quantity":2, "price":8.00}, {"id":"5", "name":"Coconut Soup", "quantity":1, "price":12.20}]'),
  ('7', 'completed', 54.00, '[{"id":"6", "name":"Green Curry", "quantity":2, "price":15.00}, {"id":"7", "name":"Mango Sticky Rice", "quantity":2, "price":8.00}, {"id":"3", "name":"Thai Iced Tea", "quantity":2, "price":5.00}]'); 