-- EVENTS SEED DATA
-- Run this in Supabase SQL Editor to populate your events catalog

INSERT INTO public.events (name, location, description, categories, event_date, price, image_url, is_featured, is_trending, is_seasonal, engagement_score)
VALUES 
-- Music & Cultural
('Sauti Sol Farewell Tour', 'Nairobi, Kenya', 'Final performance of the iconic Kenyan boy band.', ARRAY['Music', 'Cultural'], '2026-06-15 19:00:00+03', 150.00, 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4', true, true, false, 950),
('Lamun Cultural Festival', 'Lamu, Kenya', 'A celebration of Swahili culture on the historic island.', ARRAY['Cultural', 'Relaxed'], '2026-11-20 09:00:00+03', 50.00, 'https://images.unsplash.com/photo-1523731407965-2430cd12f5e4', false, false, true, 420),
('Jazz in the Park', 'Nairobi, Kenya', 'Smooth jazz evening under the stars.', ARRAY['Music', 'Relaxed'], '2026-03-10 18:30:00+03', 40.00, 'https://images.unsplash.com/photo-1511192336575-5a79af67a629', false, true, false, 310),

-- Adventure & Sports
('Lewa Safari Marathon', 'Lewa Conservancy, Kenya', 'Run through the wild in support of conservation.', ARRAY['Adventure', 'Sports', 'High-Activity'], '2026-06-27 06:00:00+03', 250.00, 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3', true, false, true, 580),
('Mount Kenya Climbing Week', 'Nanyuki, Kenya', 'Guided ascent to Point Lenana.', ARRAY['Adventure', 'High-Activity', 'Mountain'], '2026-08-15 05:00:00+03', 450.00, 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b', false, true, true, 290),
('Diani Kite Boarding Cup', 'Diani Beach, Kenya', 'The ultimate water sports competition on the coast.', ARRAY['Sports', 'Beach', 'Adventure'], '2026-02-14 10:00:00+03', 120.00, 'https://images.unsplash.com/photo-1505118380757-91f5f45d8de4', false, true, false, 480),

-- Seasonal/Holidays
('Great Migration Viewing', 'Maasai Mara, Kenya', 'Peak season for the eighth wonder of the world.', ARRAY['Nature', 'Safari', 'Adventure'], '2026-07-20 00:00:00+03', 350.00, 'https://images.unsplash.com/photo-1516426122078-c23e76319801', true, true, true, 1200),
('Mombasa New Years Eve Party', 'Mombasa, Kenya', 'The biggest beach party to welcome the new year.', ARRAY['Music', 'Beach', 'Festival'], '2026-12-31 20:00:00+03', 80.00, 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9', false, false, true, 800),

-- Solo & Friends
('Nairobi Tech Week', 'Nairobi, Kenya', 'Gathering of minds in the Silicon Savannah.', ARRAY['Cultural', 'Friends'], '2026-05-05 08:30:00+03', 30.00, 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf', false, false, false, 250),
('Lake Magadi Photo Expedition', 'Lake Magadi, Kenya', 'Weekend photography retreat in the pink saline lake.', ARRAY['Nature', 'Solo', 'Relaxed'], '2026-04-12 07:00:00+03', 200.00, 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', false, false, false, 150);
