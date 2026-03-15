-- Livestock Connect: Cloudinary integration for listings
-- Ensures image_url stores only URLs (e.g. Cloudinary secure_url), not inline data.

-- Clear any non-URL data (e.g. base64) so constraint can apply
update public.listings
set image_url = null
where image_url is not null
  and image_url not like 'http://%'
  and image_url not like 'https://%';

-- Allow only null or URL-shaped values (Cloudinary returns https://res.cloudinary.com/...)
alter table public.listings
  drop constraint if exists listings_image_url_https;

alter table public.listings
  add constraint listings_image_url_https
  check (image_url is null or (image_url like 'https://%' or image_url like 'http://%'));

comment on column public.listings.image_url is 'Cloudinary secure_url after upload. Frontend: upload to Cloudinary → store returned URL here.';
