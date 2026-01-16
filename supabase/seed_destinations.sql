-- DESTINATIONS SEED DATA
-- Run this in Supabase SQL Editor to populate your catalog

INSERT INTO public.destinations (name, location, description, categories, estimated_cost, duration, image_url, rating, reviews_count, is_featured, is_popular, popularity_badge)
VALUES 
-- Dashboard / General Catalog
('Santorini', 'Greece', 'Stunning sunsets and white-washed villages', ARRAY['Beach', 'Luxury', 'Couple', 'Relaxed', 'Hotel', 'Mild'], 4200, '6 days', 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff', 4.9, 1240, true, true, 'Trending'),
('Tokyo', 'Japan', 'Modern culture meets ancient traditions', ARRAY['City', 'Cultural', 'Moderate-Activity', 'Friends', 'Hotel', 'Mild'], 3800, '5 days', 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf', 4.8, 850, true, true, 'Hot'),
('Swiss Alps', 'Switzerland', 'Adventure and breathtaking mountain views', ARRAY['Mountain', 'Adventure', 'High-Activity', 'Cold', 'Luxury', 'Family'], 6000, '10 days', 'https://images.unsplash.com/photo-1531310197839-ccf54634509e', 4.9, 620, true, false, NULL),
('Bali', 'Indonesia', 'Tropical paradise with rich culture and beaches', ARRAY['Beach', 'Nature', 'Budget', 'Tropical', 'Relaxed', 'Hostel'], 2500, '7 days', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4', 4.7, 2100, false, true, 'Popular'),
('Maasai Mara', 'Kenya', 'World''s greatest wildlife safari experience', ARRAY['Nature', 'Adventure', 'Safari', 'High-Activity', 'Tropical', 'Family'], 3500, '5 days', 'https://images.unsplash.com/photo-1516426122078-c23e76319801', 4.9, 3400, true, true, 'Top Choice'),
('Paris', 'France', 'The city of light, art, and romance', ARRAY['City', 'Cultural', 'Luxury', 'Couple', 'Mild', 'Hotel'], 5500, '4 days', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34', 4.8, 5600, true, false, NULL),
('Reykjavik', 'Iceland', 'Land of fire and ice, auroras and waterfalls', ARRAY['Adventure', 'Nature', 'Cold', 'Solo', 'High-Activity'], 4800, '8 days', 'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3', 4.7, 980, false, false, NULL),
('Dubai', 'UAE', 'Luxury shopping and modern architecture', ARRAY['City', 'Luxury', 'Resort', 'Tropical', 'Moderate-Activity'], 5200, '5 days', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c', 4.8, 4300, true, true, 'Trending'),

-- Featured Destinations (Kenya focus)
('Amboseli National Park', 'Kajiado, Kenya', 'Spectacular views of Mount Kilimanjaro with elephant herds', ARRAY['Nature', 'Adventure', 'Safari'], 380, '3-5 days', 'https://images.unsplash.com/photo-1516426122078-c23e76319801', 4.9, 456, true, false, NULL),
('Lamu Island', 'Lamu, Kenya', 'UNESCO World Heritage Site with rich Swahili culture', ARRAY['Beach', 'Cultural', 'Relaxed'], 280, '4-6 days', 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff', 4.8, 387, true, false, NULL),
('Hell''s Gate', 'Naivasha, Kenya', 'Unique walking and cycling safari experience', ARRAY['Adventure', 'Nature', 'Activity'], 120, '1-2 days', 'https://images.unsplash.com/photo-1531310197839-ccf54634509e', 4.7, 298, true, false, NULL),
('Tsavo National Park', 'Coast/Eastern, Kenya', 'Kenya''s largest national park with red elephants', ARRAY['Nature', 'Adventure', 'Safari'], 420, '4-7 days', 'https://images.unsplash.com/photo-1516426122078-c23e76319801', 4.8, 523, true, false, NULL),

-- Popular Destinations (Kenya focus)
('Diani Beach', 'Mombasa, Kenya', 'Pristine white sand beaches and crystal clear waters', ARRAY['Beach', 'Luxury', 'Relaxed'], 150, '3-5 days', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4', 4.8, 324, false, true, NULL),
('Nairobi City', 'Nairobi, Kenya', 'Modern city life meets wildlife adventures', ARRAY['City', 'Cultural', 'Activity'], 80, '2-4 days', 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf', 4.6, 189, false, true, NULL),
('Mount Kenya', 'Central Kenya', 'Africa''s second highest peak adventure', ARRAY['Mountain', 'Adventure', 'High-Activity'], 350, '5-7 days', 'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3', 4.7, 245, false, true, NULL),
('Watamu Beach', 'Kilifi, Kenya', 'Tropical paradise with marine life', ARRAY['Beach', 'Nature', 'Relaxed'], 180, '3-6 days', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4', 4.8, 298, false, true, NULL),
('Lake Nakuru', 'Nakuru, Kenya', 'Flamingo sanctuary and rhino reserve', ARRAY['Nature', 'Adventure', 'Relaxed'], 220, '2-3 days', 'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3', 4.7, 412, false, true, NULL);
