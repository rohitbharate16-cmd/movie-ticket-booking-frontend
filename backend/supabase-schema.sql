create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.movies (
  id text primary key,
  name text not null,
  image_url text not null,
  rating text,
  votes text,
  duration text,
  genre text,
  certificate text,
  release_date text,
  formats text,
  languages text,
  summary text,
  critic_rating text,
  highlights jsonb not null default '[]'::jsonb,
  trailer_url text,
  regular_price integer not null,
  silver_price integer not null,
  gold_price integer not null,
  is_custom boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.food_items (
  id text primary key,
  name text not null,
  category text not null,
  price integer not null,
  badge text,
  art_label text,
  image_url text,
  description text not null,
  is_custom boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.shows (
  id text primary key,
  movie_id text not null references public.movies (id) on delete cascade,
  hall_id integer not null,
  show_date date not null,
  show_time integer not null,
  format text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  movie_id text not null references public.movies (id) on delete cascade,
  show_id text references public.shows (id) on delete set null,
  seats jsonb not null default '[]'::jsonb,
  snacks jsonb not null default '[]'::jsonb,
  seat_total integer not null default 0,
  snacks_total integer not null default 0,
  total_amount integer not null default 0,
  stripe_session_id text,
  free_ticket_discount integer not null default 0,
  free_ticket_date date,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;
alter table public.movies enable row level security;
alter table public.food_items enable row level security;
alter table public.shows enable row level security;
alter table public.bookings enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

drop policy if exists "profiles select own row" on public.profiles;
create policy "profiles select own row"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles insert own row" on public.profiles;
create policy "profiles insert own row"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles update own row" on public.profiles;
create policy "profiles update own row"
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "movies public read" on public.movies;
create policy "movies public read"
on public.movies
for select
to anon, authenticated
using (is_active = true or public.is_admin());

drop policy if exists "movies admin write" on public.movies;
create policy "movies admin write"
on public.movies
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "food public read" on public.food_items;
create policy "food public read"
on public.food_items
for select
to anon, authenticated
using (is_active = true or public.is_admin());

drop policy if exists "food admin write" on public.food_items;
create policy "food admin write"
on public.food_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "shows public read" on public.shows;
create policy "shows public read"
on public.shows
for select
to anon, authenticated
using (true);

drop policy if exists "shows admin write" on public.shows;
create policy "shows admin write"
on public.shows
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "bookings own read" on public.bookings;
create policy "bookings own read"
on public.bookings
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "bookings authenticated insert" on public.bookings;
create policy "bookings authenticated insert"
on public.bookings
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "bookings admin delete" on public.bookings;
create policy "bookings admin delete"
on public.bookings
for delete
to authenticated
using (public.is_admin());

insert into public.movies (
  id, name, image_url, rating, votes, duration, genre, certificate, release_date,
  formats, languages, summary, critic_rating, highlights, trailer_url,
  regular_price, silver_price, gold_price, is_custom, is_active
)
values
  ('dragon', 'The Dragon', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/images/4.jpg', '8.8/10', '214K+ Votes', '2h 34m', 'Action, Drama', 'UA', '14 Feb, 2026', '2D (commercial mass entertainer)', 'Tamil', 'A high-energy action film centered around a powerful and fearless protagonist known as Dragon. The story showcases intense fight sequences, revenge-driven storytelling, and a larger-than-life hero persona. There is a strong emotional undertone tied to betrayal or injustice. Dramatic slow-motion visuals and heavy background music build the hype. It feels like a journey of rise, domination, and redemption.', '4.2/5', '["Big-screen fantasy action with heroic set pieces.","Strong emotional arc around loyalty and revenge.","Designed as a crowd-pleasing theatrical experience."]'::jsonb, 'https://youtu.be/IaSSm_BtQzk?si=SvV7jf9KVpHCGsFY', 220, 300, 370, false, true),
  ('pushpa', 'Pushpa', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/images/5.jpg', '9.1/10', '506K+ Votes', '3h 01m', 'Action, Crime, Drama', 'A', '12 Jan, 2026', '2D (cinematic theatrical release)', 'Telugu, Hindi, Tamil, Malayalam, Kannada', 'The story follows Pushpa''s rise in the red sandalwood smuggling world. It highlights power struggles, dominance, and survival in a brutal underworld. The protagonist''s attitude and swag stand out strongly. The visuals are gritty and grounded, reflecting rural crime dynamics. It hints at conflict with authorities and rival gangs, mixing action with raw emotion.', '4.4/5', '["Mass-action moments built for a loud theater crowd.","Stylized clashes between ambition, pride, and survival.","High-voltage lead performance and intense background score."]'::jsonb, 'https://youtu.be/pKctjlxbFDQ?si=ZkHIbk51VNvG1Dog', 250, 330, 400, false, true),
  ('master', 'Master', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/images/3.jpg', '8.7/10', '331K+ Votes', '2h 58m', 'Action, Drama, Thriller', 'UA', '29 Jan, 2026', '2D', 'Tamil, Telugu, Hindi', 'The story revolves around a professor with a troubled past who is sent to a juvenile school. There he faces a ruthless gangster controlling young inmates. The trailer blends intense action with emotional depth and social themes. It shows a clash between good and evil ideologies. Strong performances and powerful dialogues drive the narrative with both mass appeal and message.', '4.1/5', '["Tense hero-villain face-offs with strong payoff.","Balances swagger, drama, and social stakes.","Packed with memorable songs and punch moments."]'::jsonb, 'https://youtu.be/UTiXQcrLlv4?si=TMx2vxaxEB8pK7eG', 200, 280, 350, false, true),
  ('dhurandhar', 'Dhurandhar', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/images/6.jpg', '9.4/10', '278K+ Votes', '3h 49m', 'Action, Drama', 'A', '19 Mar, 2026', '2D', 'Hindi, Tamil, Telugu, Malayalam, Kannada', 'A high-voltage action entertainer featuring a fearless hero fighting against injustice. The trailer includes intense combat scenes, heroic dialogues, and dramatic confrontations. There is a focus on patriotism or righteousness. The narrative feels centered around one man standing against a corrupt system. It promises a mix of action, emotion, and strong mass-appeal moments.', '4.6/5', '["Dark revenge drama with a large-scale action tone.","Sharp tension, heavy emotion, and stylish visuals.","Built around a powerful central performance."]'::jsonb, 'https://youtu.be/NHk7scrb_9I?si=oXown3lRdf0YLhJn', 230, 310, 380, false, true),
  ('coolie', 'Coolie', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/images/8.jpg', '8.9/10', '192K+ Votes', '2h 42m', 'Action, Drama', 'UA', '01 May, 2026', '2D', 'Tamil, Telugu, Hindi, Malayalam', 'A mass entertainer centered around a rugged working-class hero. The trailer mixes action, drama, and emotional storytelling. It highlights themes of struggle, dignity, and rebellion. The protagonist appears to fight against powerful enemies while representing common people. Stylish visuals and punch dialogues promise a high-energy theatrical experience.', '4.3/5', '["Star-driven action with a big-screen commercial feel.","Emotion-led story with crowd-friendly elevation scenes.","Mixes social conflict with stylish mass entertainment."]'::jsonb, 'https://youtu.be/qeVfT2iLiu0?si=APfnWyQiMooG_z0j', 260, 340, 410, false, true),
  ('marco', 'Marco', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/images/7.jpg', '8.5/10', '167K+ Votes', '2h 29m', 'Action, Thriller, Crime', 'A', '17 Apr, 2026', '2D', 'Malayalam, Tamil, Hindi', 'This trailer presents a darker and more stylish action film with a mysterious lead character. It hints at crime, revenge, and psychological depth. The visuals feel sleek with a modern cinematic tone. There is a strong focus on character intensity and violent confrontations. The story seems layered with suspense and emotional conflict, giving it an international vibe.', '4.0/5', '["Gritty action tone with fast pacing.","Underground crime setting with personal stakes.","Sharp atmosphere and a darker edge than the others."]'::jsonb, 'https://youtu.be/AdwGOloQcAs?si=o5S1v_HUh3tH8zQP', 210, 290, 360, false, true),
  ('heartbeats', 'Heartbeats', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/images/Heartbeats.JPG', '8.6/10', '148K+ Votes', '2h 21m', 'Romance, Drama', 'UA', '09 May, 2026', '2D', 'Hindi, Tamil', 'A youth-centric film revolving around love, relationships, and emotional struggles. The trailer shows modern romance with conflicts and personal growth. It captures college or early-life experiences and emotional ups and downs. There is a mix of drama, heartbreak, and light moments. The storytelling appears relatable and character-driven.', '4.2/5', '["Modern relationship drama with a youthful tone.","Balances heartbreak, growth, and lighter moments.","Character-driven storytelling built around relatable emotions."]'::jsonb, 'https://youtu.be/YknK1G-g-qc?si=EpxuiG5q8x3W9UAn', 190, 270, 340, false, true),
  ('threeidiots', '3 Idiots', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/images/3%20idiots.JPG', '9.3/10', '512K+ Votes', '2h 50m', 'Comedy, Drama', 'U', '25 Dec, 2009', '2D', 'Hindi', 'A story about three engineering students navigating college life, pressure, and friendship. The trailer highlights the flaws in the education system and emphasizes learning over rote memorization. Rancho''s character challenges traditional thinking and inspires others. It mixes humor, emotional moments, and life lessons. Themes of passion, success, and self-discovery are strong. The film balances comedy with meaningful social commentary.', '4.8/5', '["Sharp social commentary wrapped in crowd-pleasing humor.","Celebrates friendship, curiosity, and self-discovery.","Blends comedy, emotion, and big life lessons smoothly."]'::jsonb, 'https://youtu.be/xvszmNXdM4w?si=cB19w-unxcKygcR0', 200, 280, 350, false, true),
  ('saiyaara', 'Saiyaara', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/images/Saiyaara.JPG', '8.4/10', '184K+ Votes', '5m 12s', 'Romantic, Musical', 'UA', '15 Jul, 2025', '2D (music video)', 'Hindi', 'A romantic music video showcasing deep love and emotional bonding between two people. The visuals focus on separation, longing, and intense feelings. The song carries a soulful melody with expressive lyrics. It highlights heartbreak and attachment beautifully. The overall tone is soft, emotional, and poetic.', '4.1/5', '["Soulful romantic mood built around longing and memory.","Strong musical and lyrical appeal with soft visuals.","Leans into heartbreak, intimacy, and emotional attachment."]'::jsonb, 'https://youtu.be/9r-tT5IN0vg?si=oqvMVw1qKvxl5P0n', 150, 230, 300, false, true),
  ('dhamaal', 'Dhamaal', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/images/Dhamaal.JPG', '8.5/10', '226K+ Votes', '2h 16m', 'Comedy, Adventure', 'UA', '07 Sep, 2007', '2D', 'Hindi', 'A comedy adventure about four friends chasing hidden treasure. The trailer is filled with chaotic humor, misunderstandings, and crazy situations. It focuses on slapstick comedy and fast-paced storytelling. Each character adds to the madness with unique personalities. The film promises nonstop laughter and fun.', '4.2/5', '["Treasure-hunt setup creates nonstop comic chaos.","Slapstick humor and misunderstandings keep the pace high.","Ensemble cast energy makes it an easy crowd-pleaser."]'::jsonb, 'https://youtu.be/D7felvV3JRc?si=GENDqxv1f5B9dGJK', 180, 260, 330, false, true),
  ('tamasha', 'Tamasha', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/images/Tamasha.JPG', '8.8/10', '241K+ Votes', '2h 19m', 'Romance, Drama', 'UA', '27 Nov, 2015', '2D', 'Hindi', 'A story about self-identity and breaking free from societal expectations. The trailer shows a man living a double life, one real and one forced by routine. It explores love, passion, and inner conflict. The narrative is emotional and philosophical. There is a strong focus on storytelling and personal transformation.', '4.4/5', '["Emotionally layered story about identity and freedom.","Blends romance with philosophical self-discovery.","Driven by inner conflict rather than formula."]'::jsonb, 'https://youtu.be/o-e5eWVCzx8?si=bvzgR3047lqTuBpi', 210, 290, 360, false, true),
  ('bhoolbhulaiyaa2', 'Bhool Bhulaiyaa 2', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/images/Bhool%20Bhulaiyaa%202.JPG', '8.3/10', '287K+ Votes', '2h 23m', 'Horror, Comedy', 'UA', '20 May, 2022', '2D', 'Hindi', 'A horror-comedy centered around a haunted mansion and a mysterious spirit. The trailer blends spooky elements with humor and entertainment. It features a quirky protagonist dealing with supernatural events. There are twists, suspense, and comic relief throughout. The film maintains a fun yet eerie vibe.', '4.0/5', '["Balances spooky suspense with mainstream comedy.","Haunted-house setup creates twists and crowd-friendly moments.","Keeps the tone eerie without losing its fun side."]'::jsonb, 'https://youtu.be/P2KRKxAb2ek?si=3iqvhUrCPsAfwin4', 220, 300, 375, false, true)
on conflict (id) do update
set
  name = excluded.name,
  image_url = excluded.image_url,
  rating = excluded.rating,
  votes = excluded.votes,
  duration = excluded.duration,
  genre = excluded.genre,
  certificate = excluded.certificate,
  release_date = excluded.release_date,
  formats = excluded.formats,
  languages = excluded.languages,
  summary = excluded.summary,
  critic_rating = excluded.critic_rating,
  highlights = excluded.highlights,
  trailer_url = excluded.trailer_url,
  regular_price = excluded.regular_price,
  silver_price = excluded.silver_price,
  gold_price = excluded.gold_price,
  is_active = excluded.is_active;

insert into public.food_items (
  id, name, category, price, badge, art_label, image_url, description, is_custom, is_active
)
values
  ('classic-popcorn', 'Classic Salted Popcorn', 'Popcorn', 180, 'Best Seller', 'POP', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/salted%20popcorn.jpg', 'Big tub with buttery cinema crunch.', false, true),
  ('cheese-popcorn', 'Cheese Burst Popcorn', 'Popcorn', 220, 'Hot Pick', 'CHE', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/cheese%20popcorn.jpg', 'Loaded with creamy cheddar flavor.', false, true),
  ('caramel-popcorn', 'Caramel Popcorn', 'Popcorn', 210, 'Sweet', 'CAR', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/carmel%20popcorn.jpg', 'Golden caramel glaze with crisp bites.', false, true),
  ('peri-peri-popcorn', 'Peri Peri Popcorn', 'Popcorn', 230, 'Spicy', 'PER', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/periperi%20popcorn.jpg', 'Masala-spiced popcorn for bold movie snacks.', false, true),
  ('classic-fries', 'Classic Fries', 'Fries', 160, 'Crispy', 'FRY', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/salted%20fries.jpg', 'Lightly salted fries with dip.', false, true),
  ('peri-peri-fries', 'Peri Peri Fries', 'Fries', 190, 'Trending', 'HOT', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/periperi%20fries.jpg', 'Spiced fries with tangy seasoning.', false, true),
  ('cheese-fries', 'Cheese Loaded Fries', 'Fries', 210, 'Cheesy', 'CHS', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/cheese%20loaded%20fries.jpg', 'Fries topped with warm cheese sauce.', false, true),
  ('masala-fries', 'Masala Fries', 'Fries', 185, 'Desi', 'MAS', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/masala%20fries.jpg', 'Indian-style masala seasoning on crisp fries.', false, true),
  ('samosa', 'Crispy Samosa', 'Snacks', 90, 'Fresh', 'SAM', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/samosa.jpg', 'Golden samosa with mint chutney.', false, true),
  ('vadapav', 'Vada Pav', 'Snacks', 95, 'Mumbai', 'VAD', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/vadapav.jpg', 'Soft pav with spicy vada and chutney.', false, true),
  ('kachori', 'Khasta Kachori', 'Snacks', 100, 'Crunchy', 'KAC', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/kachori.jpg', 'Flaky kachori with masala filling.', false, true),
  ('kachi-dabeli', 'Kacchi Dabeli', 'Snacks', 120, 'Street Style', 'DAB', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/kachi%20dabeli.jpg', 'Sweet-spicy dabeli with peanuts and masala.', false, true),
  ('veg-burger', 'Classic Veg Burger', 'Burger', 170, 'Veg', 'VEG', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/veg%20burger.jpg', 'Veg patty with lettuce and sauce.', false, true),
  ('paneer-burger', 'Paneer Tikka Burger', 'Burger', 210, 'Popular', 'PAN', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/paneer%20burger.jpg', 'Paneer tikka patty with smoky mayo.', false, true),
  ('chicken-burger', 'Crispy Chicken Burger', 'Burger', 240, 'Juicy', 'CHK', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/crispy%20chicken%20burger.jpg', 'Crunchy chicken fillet burger.', false, true),
  ('veg-sandwich', 'Classic Veg Sandwich', 'Sandwich', 150, 'Light Bite', 'VEG', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/veg%20sandwich.jpg', 'Fresh veggie sandwich with mayo spread.', false, true),
  ('grilled-cheese-sandwich', 'Grilled Cheese Sandwich', 'Sandwich', 175, 'Cheesy', 'CHS', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/grilled%20cheese%20sandwich.jpg', 'Toasted bread packed with melted cheese.', false, true),
  ('paneer-sandwich', 'Paneer Tikka Sandwich', 'Sandwich', 195, 'Popular', 'PAN', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/paneer%20ticka%20sandwich.jpg', 'Paneer tikka filling in a grilled sandwich.', false, true),
  ('corn-sandwich', 'Sweet Corn Sandwich', 'Sandwich', 165, 'Cafe', 'CRN', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/sweet%20corn%20sandwich.jpg', 'Creamy corn filling with herbs and crunch.', false, true),
  ('cola', 'Coca Cola', 'Cold Drink', 110, 'Chilled', 'COL', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/coca%20cola.jpg', 'Ice-cold cola for the show.', false, true),
  ('pepsi', 'Pepsi', 'Cold Drink', 110, 'Classic', 'PEP', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/pepsi.jpg', 'Refreshing fizzy soft drink.', false, true),
  ('sprite', 'Sprite', 'Cold Drink', 105, 'Lime', 'SPR', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/sprite.jpg', 'Crisp lemon-lime sparkle.', false, true),
  ('fanta', 'Fanta Orange', 'Cold Drink', 105, 'Orange', 'FAN', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/fanta.jpg', 'Sweet orange soda served cold.', false, true),
  ('iced-tea', 'Iced Tea', 'Cold Drink', 125, 'Cool', 'ICE', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/iced%20tea.jpg', 'Fresh brewed tea over ice.', false, true),
  ('masala-tea', 'Masala Tea', 'Tea & Coffee', 80, 'Warm', 'TEA', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/masala%20tea.jpg', 'Hot masala chai for evening shows.', false, true),
  ('green-tea', 'Green Tea', 'Tea & Coffee', 90, 'Healthy', 'GRN', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/green%20tea.jpg', 'Light and soothing hot green tea.', false, true),
  ('normal-coffee', 'Normal Coffee', 'Tea & Coffee', 110, 'Classic', 'COF', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/Coffee.jpg', 'Simple hot coffee for a quick refresh.', false, true),
  ('cappuccino', 'Cappuccino', 'Tea & Coffee', 140, 'Cafe', 'CAP', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/cappuccino.jpg', 'Foamy cappuccino with rich aroma.', false, true),
  ('cold-coffee', 'Cold Coffee', 'Tea & Coffee', 155, 'Smooth', 'COF', 'https://nhtsybfppoyrpopjmjbc.supabase.co/storage/v1/object/public/movie-posters/Food/cold%20coffee.jpg', 'Chilled coffee shake for long movies.', false, true)
on conflict (id) do update
set
  name = excluded.name,
  category = excluded.category,
  price = excluded.price,
  badge = excluded.badge,
  art_label = excluded.art_label,
  image_url = excluded.image_url,
  description = excluded.description,
  is_active = excluded.is_active;
