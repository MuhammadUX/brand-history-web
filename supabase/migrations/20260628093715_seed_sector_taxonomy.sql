-- Seed the full sector taxonomy (matches production's 8 sectors).
-- Staging previously only had retail + health, which is why brands in other
-- sectors (e.g. STC -> telecom) came back with a null sector. Upsert all 8 so
-- the AI builder's allowed-slug list and the operator dropdown are complete.
-- Idempotent: on conflict (slug) do nothing.

insert into sectors (slug, name_en, name_ar, sort_order) values
  ('telecom',        'Telecom',          'الاتصالات',          1),
  ('banking',        'Banking',          'البنوك',             2),
  ('energy',         'Energy',           'الطاقة',             3),
  ('food-beverage',  'Food & Beverage',  'الأغذية والمشروبات', 4),
  ('aviation',       'Aviation',         'الطيران',            5),
  ('technology',     'Technology',       'التقنية',            6),
  ('retail',         'Retail',           'التجزئة',            7),
  ('health',         'Health',           'الصحة',              8)
on conflict (slug) do nothing;
