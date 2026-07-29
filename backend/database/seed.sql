-- Optional sample data — run after schema.sql if you want something to look
-- at right away. Safe to skip.

INSERT INTO standards_entries (entry_date, sleep, workout, diet, reading, meditation, no_junk)
VALUES (CURRENT_DATE, 7, 8, 6, 5, 7, 8)
ON CONFLICT (entry_date) DO NOTHING;

INSERT INTO vision_goals (title, description, category, sort_order) VALUES
  ('Dream Home', 'A modern home built through discipline and consistency.', 'lifestyle', 1),
  ('Financial Freedom', 'Reach the ₹50 lakh milestone through steady saving and investing.', 'finance', 2),
  ('Peak Fitness', 'Reach and sustain goal weight with strength and energy.', 'health', 3)
ON CONFLICT DO NOTHING;
