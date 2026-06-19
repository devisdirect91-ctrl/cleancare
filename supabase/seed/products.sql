-- Seed data for public.products
-- Fictional placeholder entries inspired by real brands. Replace affiliate_url
-- and image_url with real affiliate links/images before going live.

insert into public.products (name, brand, category, price_eur, for_skin_types, affiliate_url, image_url) values
('Nettoyant Doux Visage', 'La Roche-Posay', 'nettoyant doux', 12.90, array['sèche','sensible','normale'], null, null),
('Gel Moussant Purifiant', 'CeraVe', 'nettoyant doux', 11.50, array['grasse','mixte'], null, null),
('Eau Micellaire Sensibio', 'Bioderma', 'nettoyant doux', 14.90, array['sensible','sèche','normale','mixte','grasse'], null, null),
('Lait Démaquillant Crème', 'Avène', 'nettoyant doux', 13.50, array['sèche','sensible'], null, null),
('Nettoyant Visage Argile Verte', 'Typology', 'nettoyant doux', 15.00, array['grasse','mixte'], null, null),
('Baume Démaquillant Purifiant', 'Nuxe', 'nettoyant doux', 22.00, array['normale','sèche','mixte'], null, null),
('Squalane Cleanser', 'The Ordinary', 'nettoyant doux', 9.90, array['sèche','normale','sensible'], null, null),
('Gel Nettoyant Apaisant', 'Aime', 'nettoyant doux', 18.00, array['sensible','sèche'], null, null),

('Sérum Niacinamide 10% + Zinc 1%', 'The Ordinary', 'sérum hydratant', 7.50, array['grasse','mixte'], null, null),
('Sérum Acide Hyaluronique B5', 'The Ordinary', 'sérum hydratant', 8.90, array['sèche','normale','sensible'], null, null),
('Sérum Hydratant Bio', 'Typology', 'sérum hydratant', 24.00, array['sèche','normale','mixte'], null, null),
('Sérum Concentré Acide Hyaluronique', 'Nuxe', 'sérum hydratant', 28.00, array['sèche','normale'], null, null),
('Sérum Apaisant Centella', 'Aime', 'sérum hydratant', 32.00, array['sensible','sèche'], null, null),
('Sérum Vitamine C', 'La Roche-Posay', 'sérum hydratant', 29.90, array['normale','mixte','grasse'], null, null),
('Sérum Anti-Rougeurs', 'Avène', 'sérum hydratant', 26.50, array['sensible'], null, null),
('Sérum Hydratant Hyaluronic Acid 2%', 'CeraVe', 'sérum hydratant', 16.90, array['sèche','normale','mixte'], null, null),

('Crème Hydratante Légère', 'CeraVe', 'crème hydratante légère', 15.90, array['mixte','grasse','normale'], null, null),
('Aqua Fluide Hydratant', 'La Roche-Posay', 'crème hydratante légère', 19.90, array['grasse','mixte'], null, null),
('Crème Légère Hydratante Bio', 'Typology', 'crème hydratante légère', 21.00, array['mixte','normale'], null, null),
('Gel-Crème Hydratant Visage', 'Avène', 'crème hydratante légère', 18.50, array['mixte','grasse','sensible'], null, null),
('Crème Légère Aqua Bella', 'Nuxe', 'crème hydratante légère', 25.00, array['normale','mixte'], null, null),
('Crème Hydratation Quotidienne', 'Aime', 'crème hydratante légère', 26.00, array['normale','mixte','sensible'], null, null),
('Natural Moisturizing Factors + HA', 'The Ordinary', 'crème hydratante légère', 7.90, array['sèche','normale','mixte'], null, null),

('Crème Nourrissante Riche', 'CeraVe', 'crème nourrissante', 17.90, array['sèche'], null, null),
('Cicaplast Baume B5', 'La Roche-Posay', 'crème nourrissante', 11.90, array['sensible','sèche'], null, null),
('Crème Riche Nourrissante Bio', 'Typology', 'crème nourrissante', 23.00, array['sèche'], null, null),
('Crème Confort Visage', 'Avène', 'crème nourrissante', 19.90, array['sèche','sensible'], null, null),
('Crème Riche Nuxe', 'Nuxe', 'crème nourrissante', 27.00, array['sèche','normale'], null, null),
('Baume Nourrissant Nuit', 'Aime', 'crème nourrissante', 30.00, array['sèche','sensible'], null, null),

('Crème Solaire SPF 50', 'La Roche-Posay', 'protection solaire', 17.90, array['normale','mixte','grasse','sèche','sensible'], null, null),
('Hydratant Solaire Anti-UV SPF 50', 'Avène', 'protection solaire', 18.50, array['sensible','sèche'], null, null),
('Mineral Sunscreen SPF 30', 'CeraVe', 'protection solaire', 16.50, array['normale','mixte'], null, null),
('Fluide Solaire Invisible SPF 50', 'Nuxe', 'protection solaire', 22.00, array['normale','mixte','grasse'], null, null),
('Protection Solaire Quotidienne SPF 30', 'Typology', 'protection solaire', 19.00, array['normale','mixte','sèche'], null, null),

('Masque Argile Purifiant', 'Typology', 'masque purifiant', 19.00, array['grasse','mixte'], null, null),
('Masque Effinité Argile Verte', 'La Roche-Posay', 'masque purifiant', 14.90, array['grasse','mixte'], null, null),
('Masque Détox Charbon', 'Nuxe', 'masque purifiant', 16.50, array['mixte','grasse'], null, null),
('Masque Apaisant Centella', 'Aime', 'masque purifiant', 24.00, array['sensible','sèche'], null, null),

('Exfoliant Doux AHA 7%', 'The Ordinary', 'exfoliant doux', 8.50, array['normale','mixte','grasse'], null, null),
('Gommage Doux Visage', 'Avène', 'exfoliant doux', 13.90, array['sensible','sèche'], null, null),
('Lotion Exfoliante Douce', 'Typology', 'exfoliant doux', 17.00, array['normale','mixte'], null, null),
('Gommage Crème Hydratant', 'Nuxe', 'exfoliant doux', 18.50, array['sèche','normale'], null, null),

('Contour des Yeux Hydratant', 'CeraVe', 'soin contour des yeux', 14.90, array['sèche','normale','mixte'], null, null),
('Crème Contour Yeux Repulpante', 'Nuxe', 'soin contour des yeux', 24.00, array['normale','sèche'], null, null),
('Soin Yeux Anti-Cernes', 'Avène', 'soin contour des yeux', 17.90, array['sensible','sèche'], null, null),
('Caffeine Solution 5% + EGCG', 'The Ordinary', 'soin contour des yeux', 7.90, array['normale','mixte','grasse'], null, null),

('Brume Apaisante Eau Thermale', 'Avène', 'brume apaisante', 9.90, array['sensible','sèche','normale','mixte','grasse'], null, null),
('Eau Thermale Apaisante', 'La Roche-Posay', 'brume apaisante', 9.50, array['sensible','normale'], null, null),
('Brume Hydratante Bio', 'Typology', 'brume apaisante', 16.00, array['sèche','normale','mixte'], null, null),
('Spray Hydratant Multi-Usages', 'Nuxe', 'brume apaisante', 12.50, array['normale','mixte','sèche'], null, null);
