-- New sectors
insert into public.sectors (slug, name_en, name_ar, sort_order) values
  ('retail', 'Retail', 'التجزئة', 7),
  ('health', 'Health', 'الصحة', 8)
on conflict (slug) do nothing;

-- New brands
insert into public.brands (slug, name_en, name_ar, sector_id, region, founded_year, summary_en, summary_ar, primary_color, initials, is_verified, publication_state, download_count, last_updated_at)
values
  ('saudia', 'Saudia', 'السعودية', (select id from public.sectors where slug='aviation'), 'KSA', 1945,
   'Saudia is the national flag carrier of Saudi Arabia, one of the largest airlines in the Middle East.',
   'السعودية هي الناقل الوطني للمملكة العربية السعودية وإحدى أكبر شركات الطيران في الشرق الأوسط.',
   '#00694E', 'SV', true, 'published', 1450, now() - interval '3 days'),
  ('mobily', 'Mobily', 'موبايلي', (select id from public.sectors where slug='telecom'), 'KSA', 2004,
   'Mobily is a Saudi telecommunications company providing mobile and data services across the Kingdom.',
   'موبايلي شركة اتصالات سعودية تقدم خدمات الجوال والبيانات في جميع أنحاء المملكة.',
   '#6D2077', 'MO', true, 'published', 880, now() - interval '12 days'),
  ('stc-pay', 'stc pay', 'إس تي سي باي', (select id from public.sectors where slug='technology'), 'KSA', 2018,
   'stc pay is a digital wallet and fintech service, one of the first licensed in Saudi Arabia.',
   'إس تي سي باي محفظة رقمية وخدمة تقنية مالية من أوائل المرخصة في السعودية.',
   '#4F008C', 'SP', true, 'published', 1290, now() - interval '1 day'),
  ('jarir', 'Jarir Bookstore', 'مكتبة جرير', (select id from public.sectors where slug='retail'), 'KSA', 1979,
   'Jarir Bookstore is a leading Saudi retailer of books, electronics, and office supplies.',
   'مكتبة جرير هي إحدى أبرز شركات التجزئة السعودية للكتب والإلكترونيات والقرطاسية.',
   '#E2231A', 'JR', false, 'published', 640, now() - interval '20 days'),
  ('nahdi', 'Nahdi', 'النهدي', (select id from public.sectors where slug='health'), 'KSA', 1986,
   'Nahdi Medical is one of the largest retail pharmacy chains in the Middle East and North Africa.',
   'النهدي الطبية من أكبر سلاسل صيدليات التجزئة في الشرق الأوسط وشمال إفريقيا.',
   '#00A859', 'NA', false, 'published', 520, now() - interval '8 days'),
  ('snb', 'Saudi National Bank', 'البنك الأهلي السعودي', (select id from public.sectors where slug='banking'), 'KSA', 1953,
   'The Saudi National Bank (SNB) is the largest commercial bank in Saudi Arabia by assets.',
   'البنك الأهلي السعودي هو أكبر بنك تجاري في السعودية من حيث الأصول.',
   '#005430', 'SNB', true, 'published', 1110, now() - interval '5 days')
on conflict (slug) do nothing;