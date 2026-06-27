
alter table brands add column if not exists website text;

update brands set website = v.domain from (values
 ('stc','stc.com.sa'),
 ('aramco','aramco.com'),
 ('al-rajhi-bank','alrajhibank.com'),
 ('sabic','sabic.com'),
 ('almarai','almarai.com'),
 ('flynas','flynas.com'),
 ('saudia','saudia.com'),
 ('mobily','mobily.com.sa'),
 ('stc-pay','stcpay.com.sa'),
 ('jarir','jarir.com'),
 ('nahdi','nahdi.sa'),
 ('snb','alahli.com'),
 ('riyadh-air','riyadhair.com')
) as v(slug, domain)
where brands.slug = v.slug;
