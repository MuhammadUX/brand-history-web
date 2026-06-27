-- COLORS
insert into public.brand_colors (brand_id, name, hex, role, sort_order)
select b.id, c.name, c.hex, c.role, c.sort_order from public.brands b
join (values
  ('saudia','Saudia Green','#00694E','primary',0),
  ('saudia','Sand','#C9A227','secondary',1),
  ('mobily','Mobily Purple','#6D2077','primary',0),
  ('mobily','Cyan','#00A9CE','secondary',1),
  ('stc-pay','Deep Purple','#4F008C','primary',0),
  ('jarir','Jarir Red','#E2231A','primary',0),
  ('nahdi','Nahdi Green','#00A859','primary',0),
  ('snb','SNB Green','#005430','primary',0),
  ('snb','Gold','#B7903B','secondary',1)
) as c(slug,name,hex,role,sort_order) on c.slug = b.slug;

-- ASSETS (one archived for stc-pay)
insert into public.brand_assets (brand_id, asset_type, name_en, name_ar, download_policy, formats, is_archived, era, sort_order)
select b.id, a.asset_type, a.name_en, a.name_ar, a.download_policy, a.formats, a.is_archived, a.era, a.sort_order from public.brands b
join (values
  ('saudia','logo_primary','Primary logo','الشعار الأساسي','host', array['svg','png'], false, null, 0),
  ('saudia','wordmark','Wordmark','الاسم المكتوب','host', array['svg'], false, null, 1),
  ('mobily','logo_primary','Primary logo','الشعار الأساسي','host', array['svg','png'], false, null, 0),
  ('mobily','icon','App icon','أيقونة التطبيق','link_out', array['png'], false, null, 1),
  ('stc-pay','logo_primary','Primary logo','الشعار الأساسي','host', array['svg','png'], false, null, 0),
  ('stc-pay','logo_primary','2018 launch logo','شعار الإطلاق 2018','host', array['png'], true, '2018', 1),
  ('jarir','logo_primary','Primary logo','الشعار الأساسي','host', array['svg','png'], false, null, 0),
  ('nahdi','logo_primary','Primary logo','الشعار الأساسي','host', array['svg','png'], false, null, 0),
  ('snb','logo_primary','Primary logo','الشعار الأساسي','host', array['svg','png'], false, null, 0),
  ('snb','monochrome','Monochrome','أحادي اللون','pro', array['svg'], false, null, 1)
) as a(slug,asset_type,name_en,name_ar,download_policy,formats,is_archived,era,sort_order) on a.slug = b.slug;

-- TIMELINE
insert into public.timeline_entries (brand_id, year, title_en, title_ar, description_en, description_ar, category, sort_order)
select b.id, t.year, t.title_en, t.title_ar, t.description_en, t.description_ar, t.category, t.sort_order from public.brands b
join (values
  ('saudia',1945,'Airline founded','تأسيس الناقل','Saudi Arabian Airlines begins operations with a single aircraft.','بدء العمليات بطائرة واحدة.','founding',0),
  ('saudia',1996,'Brand renamed Saudia','إعادة التسمية إلى السعودية','The carrier adopts the Saudia name and identity.','اعتماد اسم وهوية السعودية.','identity_update',1),
  ('saudia',2012,'Identity refresh','تحديث الهوية','A modernized livery and logo are introduced.','تقديم هوية وشعار محدّثين.','identity_update',2),
  ('mobily',2004,'Mobily launches','إطلاق موبايلي','Etihad Etisalat launches the Mobily brand.','إطلاق علامة موبايلي.','founding',0),
  ('mobily',2014,'Logo update','تحديث الشعار','Refined wordmark and color system.','تحسين الاسم ونظام الألوان.','identity_update',1),
  ('stc-pay',2018,'stc pay launches','إطلاق إس تي سي باي','One of the first licensed digital wallets in Saudi Arabia.','من أوائل المحافظ الرقمية المرخصة في السعودية.','founding',0),
  ('stc-pay',2021,'Becomes a bank','التحول إلى بنك','stc pay progresses toward a digital bank license.','التقدم نحو ترخيص بنك رقمي.','milestone',1),
  ('jarir',1979,'Bookstore opens','افتتاح المكتبة','Jarir opens its first bookstore in Riyadh.','افتتاح أول فرع في الرياض.','founding',0),
  ('jarir',2003,'IPO and expansion','الطرح والتوسع','Jarir lists publicly and expands nationwide.','الطرح العام والتوسع وطنياً.','milestone',1),
  ('nahdi',1986,'First pharmacy','أول صيدلية','Nahdi opens its first pharmacy.','افتتاح أول صيدلية.','founding',0),
  ('snb',1953,'National Commercial Bank','البنك الأهلي التجاري','Founded as the first Saudi bank.','تأسس كأول بنك سعودي.','founding',0),
  ('snb',2021,'Merger forms SNB','الاندماج وتكوين الأهلي','NCB and Samba merge to form the Saudi National Bank.','اندماج الأهلي وسامبا لتكوين البنك الأهلي السعودي.','milestone',1)
) as t(slug,year,title_en,title_ar,description_en,description_ar,category,sort_order) on t.slug = b.slug;