-- ============================================================================
-- إغلاق ثغرات الصلاحيات + سجل تدقيق للحجوزات
-- ============================================================================
-- الخلفية: مفتاح anon (publishable) بيتشحن جوه الـ bundle في المتصفح، يعني أي
-- صلاحية بتتدي لـ anon هي عملياً صلاحية عامة لأي حد. قبل المايجريشن ده كانت
-- سياسات UPDATE و DELETE مكتوبة USING (true) WITH CHECK (true)، يعني أي حد
-- يقدر يضيف أو يعدّل أو يمسح أي حجز -- بما في ذلك كتابة created_at بإيده
-- (وده اللي بيحدد ترتيب الأقدمية) و status.
--
-- بعد المايجريشن ده، anon يقدر يعمل الآتي بس:
--   * INSERT حجز جديد، مع فرض created_at / updated_at / status من السيرفر
--   * INSERT في قائمة الانتظار، و SELECT على app_settings
--   * ينادي 3 دوال SECURITY DEFINER محدودة برقم تليفون واحد
-- أي حاجة تانية محتاجة مستخدم مسجّل دخوله *و* مضاف في جدول public.admins.
--
-- وكمان: طالما الموقع في وضع الانتظار (homepage_mode = 'waiting') مفيش أي حجز
-- جديد بيتقبل من أي حد -- الأدمن و service_role مشمولين. تفاصيل في القسم 2b.
--
-- بعد ما تشغّل الملف ده لازم تضيف نفسك كأدمن -- بص على آخر الملف.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 0. مساعدات
-- ---------------------------------------------------------------------------

-- قائمة الأدمنز الصريحة.
-- مهم: مجرد إن حد عامل حساب (authenticated) ده *مش* كفاية -- لازم يكون مضاف
-- هنا. من غير الجدول ده أي حد يعمل sign-up كان هياخد صلاحيات اللوحة كاملة.
create table if not exists public.admins (
  user_id    uuid primary key,
  email      text,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;
-- مفيش أي سياسة على الجدول ده عن قصد: بيتقري من جوه الدوال بس (SECURITY DEFINER)،
-- ومن لوحة Supabase.

-- هل صاحب الطلب أدمن معتمد؟
create or replace function public.is_dashboard_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$fn$;

revoke all on function public.is_dashboard_admin() from public;
grant execute on function public.is_dashboard_admin() to anon, authenticated;

-- يستخدمها الـ trigger: أدمن معتمد، أو دور إداري على السيرفر (نسخ احتياطي/سكربتات)
create or replace function public.is_admin()
returns boolean
language sql
stable
as $fn$
  select current_user in ('service_role', 'postgres', 'supabase_admin')
      or public.is_dashboard_admin();
$fn$;

-- الدور الحقيقي لصاحب الطلب، بيفضل شغال حتى جوه دوال SECURITY DEFINER
create or replace function public.request_role()
returns text
language sql
stable
as $fn$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    current_user::text
  );
$fn$;

-- ---------------------------------------------------------------------------
-- 1. سجل التدقيق -- أي تغيير على bookings بيتسجل هنا
-- ---------------------------------------------------------------------------
create table if not exists public.bookings_audit (
  id            bigserial primary key,
  booking_id    uuid,
  order_number  text,
  action        text        not null,
  acted_by      text        not null,   -- anon / authenticated / service_role
  acted_by_uid  text,                   -- معرّف المستخدم لو كان مسجّل دخول
  client_ip     text,
  acted_at      timestamptz not null default now(),
  old_row       jsonb,
  new_row       jsonb
);

create index if not exists bookings_audit_booking_id_idx on public.bookings_audit (booking_id);
create index if not exists bookings_audit_acted_at_idx   on public.bookings_audit (acted_at desc);

alter table public.bookings_audit enable row level security;
revoke all on public.bookings_audit from anon, authenticated;
revoke all on sequence public.bookings_audit_id_seq from anon, authenticated;
grant select on public.bookings_audit to authenticated;

drop policy if exists "admins can read the audit log" on public.bookings_audit;
create policy "admins can read the audit log"
  on public.bookings_audit for select to authenticated
  using (public.is_dashboard_admin());

-- SECURITY DEFINER عشان يقدر يكتب في السجل حتى لو الكاتب anon
create or replace function public.bookings_audit_fn()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid text := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub';
  v_ip  text := nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-forwarded-for';
  v_who text := public.request_role();
begin
  -- OLD مش متعرّف في INSERT و NEW مش متعرّف في DELETE، فكل حالة لوحدها
  if tg_op = 'INSERT' then
    insert into public.bookings_audit
      (booking_id, order_number, action, acted_by, acted_by_uid, client_ip, old_row, new_row)
    values (new.id, new.order_number, tg_op, v_who, v_uid, v_ip, null, to_jsonb(new));
    return new;

  elsif tg_op = 'UPDATE' then
    insert into public.bookings_audit
      (booking_id, order_number, action, acted_by, acted_by_uid, client_ip, old_row, new_row)
    values (new.id, new.order_number, tg_op, v_who, v_uid, v_ip, to_jsonb(old), to_jsonb(new));
    return new;

  else
    insert into public.bookings_audit
      (booking_id, order_number, action, acted_by, acted_by_uid, client_ip, old_row, new_row)
    values (old.id, old.order_number, tg_op, v_who, v_uid, v_ip, to_jsonb(old), null);
    return old;
  end if;
end;
$fn$;

drop trigger if exists bookings_audit_trg on public.bookings;
create trigger bookings_audit_trg
  after insert or update or delete on public.bookings
  for each row execute function public.bookings_audit_fn();

-- ---------------------------------------------------------------------------
-- 2. حارس القيم -- يمنع الكلاينت من تزوير التاريخ أو الحالة
-- ---------------------------------------------------------------------------
create or replace function public.bookings_guard()
returns trigger
language plpgsql
as $fn$
begin
  if tg_op = 'INSERT' then
    if not public.is_admin() then
      new.created_at := now();      -- التاريخ من السيرفر دايماً
      new.updated_at := now();
      new.status     := 'pending';  -- الموافقة من اللوحة بس
    end if;
    return new;
  end if;

  new.updated_at := now();

  if not public.is_admin() then
    new.id           := old.id;
    new.order_number := old.order_number;
    new.created_at   := old.created_at;
    new.status       := old.status;
    new.total_price  := old.total_price;
  end if;

  return new;
end;
$fn$;

drop trigger if exists bookings_guard_trg on public.bookings;
create trigger bookings_guard_trg
  before insert or update on public.bookings
  for each row execute function public.bookings_guard();

-- ---------------------------------------------------------------------------
-- 2b. قفل الحجز وقت وضع الانتظار -- من غير أي استثناء
-- ---------------------------------------------------------------------------
-- طالما homepage_mode = 'waiting' مفيش حجز جديد بيتقبل خالص: لا من الفورم،
-- ولا من اللوحة، ولا من الأدمن، ولا من service_role، ولا من نداء مباشر على
-- الـ API. مفيش is_admin() هنا عن قصد.
--
-- التعديل على الحجوزات الموجودة (موافقة/رفض/حذف) بيفضل شغال عادي -- القفل
-- على الإضافة بس.
--
-- عشان تفتح الحجز تاني: غيّر الوضع من زرار لوحة التحكم، أو
--   update public.app_settings set homepage_mode = 'booking' where id = 'main';
create or replace function public.bookings_window_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_mode text;
begin
  select homepage_mode into v_mode
    from public.app_settings
   where id = 'main';

  if coalesce(v_mode, 'booking') = 'waiting' then
    raise exception using
      errcode = 'check_violation',
      message = 'الحجز مقفول حالياً -- الموقع في وضع قائمة الانتظار',
      hint    = 'افتح الحجز من لوحة التحكم قبل إضافة أي حجز جديد';
  end if;

  return new;
end;
$fn$;

-- الاسم مختار عشان يترتب قبل bookings_guard_trg أبجدياً، فبيتنفذ الأول
drop trigger if exists bookings_a_window_guard_trg on public.bookings;
create trigger bookings_a_window_guard_trg
  before insert on public.bookings
  for each row execute function public.bookings_window_guard();

-- ---------------------------------------------------------------------------
-- 3. bookings -- صلاحيات وسياسات
-- ---------------------------------------------------------------------------
alter table public.bookings enable row level security;

-- شيل كل السياسات القديمة (أسماءها بتختلف حسب البيئة)
do $blk$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'bookings'
  loop
    execute format('drop policy %I on public.bookings', pol.policyname);
  end loop;
end;
$blk$;

revoke all on public.bookings from anon, authenticated;

-- anon يقدر يضيف حجز، بس مش يقدر يلمس created_at / status / id / updated_at:
-- أي عمود مش مذكور هنا لو اتبعت في الـ payload الطلب بيترفض من الأساس.
grant insert (
  order_number, selected_package, student_tickets, companion_tickets,
  companions_details, customer_name, customer_phone, customer_national_id,
  customer_year, payment_method, transaction_number, sender_phone, sender_name,
  payment_screenshot_url, total_price, booking_type, batch
) on public.bookings to anon;

grant select, insert, update, delete on public.bookings to authenticated;

create policy "anon can submit a booking"
  on public.bookings for insert to anon
  with check (true);

create policy "admins have full access to bookings"
  on public.bookings for all to authenticated
  using (public.is_dashboard_admin()) with check (public.is_dashboard_admin());

-- ---------------------------------------------------------------------------
-- 4. waiting_list
-- ---------------------------------------------------------------------------
alter table public.waiting_list enable row level security;

do $blk$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'waiting_list'
  loop
    execute format('drop policy %I on public.waiting_list', pol.policyname);
  end loop;
end;
$blk$;

revoke all on public.waiting_list from anon, authenticated;
grant insert (name, phone, selected_package, batch) on public.waiting_list to anon;
grant select, insert, update, delete on public.waiting_list to authenticated;

create policy "anon can join the waiting list"
  on public.waiting_list for insert to anon
  with check (true);

create policy "admins have full access to waiting_list"
  on public.waiting_list for all to authenticated
  using (public.is_dashboard_admin()) with check (public.is_dashboard_admin());

-- ---------------------------------------------------------------------------
-- 5. app_settings -- القراءة للكل، التعديل للأدمن بس
-- ---------------------------------------------------------------------------
alter table public.app_settings enable row level security;

do $blk$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'app_settings'
  loop
    execute format('drop policy %I on public.app_settings', pol.policyname);
  end loop;
end;
$blk$;

revoke all on public.app_settings from anon, authenticated;
grant select on public.app_settings to anon;
grant select, update on public.app_settings to authenticated;

create policy "anyone can read settings"
  on public.app_settings for select to anon, authenticated
  using (true);

create policy "admins can change settings"
  on public.app_settings for update to authenticated
  using (public.is_dashboard_admin()) with check (public.is_dashboard_admin());

-- ---------------------------------------------------------------------------
-- 6. الدوال اللي الطالب بيستخدمها -- محدودة برقم تليفونه هو بس
--    (بدل ما anon يقدر يقرأ الجدول كله)
-- ---------------------------------------------------------------------------

create or replace function public.find_bookings_by_phone(p_phone text)
returns setof public.bookings
language sql
stable
security definer
set search_path = public
as $fn$
  select *
  from public.bookings
  where p_phone is not null
    and length(btrim(p_phone)) >= 8
    and (customer_phone = btrim(p_phone) or sender_phone = btrim(p_phone))
  order by created_at desc;
$fn$;

revoke all on function public.find_bookings_by_phone(text) from public, anon, authenticated;
grant execute on function public.find_bookings_by_phone(text) to anon, authenticated;

create or replace function public.find_waiting_by_phone(p_phone text)
returns setof public.waiting_list
language sql
stable
security definer
set search_path = public
as $fn$
  select *
  from public.waiting_list
  where p_phone is not null
    and length(btrim(p_phone)) >= 8
    and phone = btrim(p_phone)
  order by created_at desc
  limit 1;
$fn$;

revoke all on function public.find_waiting_by_phone(text) from public, anon, authenticated;
grant execute on function public.find_waiting_by_phone(text) to anon, authenticated;

-- حفظ / مسح رابط مجلد Google Drive -- الطالب مش محتاج صلاحية UPDATE خالص
create or replace function public.set_booking_drive_link(
  p_phone      text,
  p_booking_id uuid default null,
  p_link       text default null
)
returns public.bookings
language plpgsql
volatile
security definer
set search_path = public
as $fn$
declare
  target   public.bookings;
  details  jsonb;
  filtered jsonb;
begin
  if p_phone is null or length(btrim(p_phone)) < 8 then
    raise exception 'رقم تليفون غير صالح';
  end if;

  if p_link is not null and btrim(p_link) <> '' and btrim(p_link) not like 'https://%' then
    raise exception 'الرابط لازم يبدأ بـ https://';
  end if;

  select *
    into target
    from public.bookings
   where (customer_phone = btrim(p_phone) or sender_phone = btrim(p_phone))
     and (p_booking_id is null or id = p_booking_id)
   order by created_at desc
   limit 1;

  if not found then
    raise exception 'لم يتم العثور على الحجز';
  end if;

  details := coalesce(target.companions_details, '[]'::jsonb);

  select coalesce(jsonb_agg(e), '[]'::jsonb)
    into filtered
    from jsonb_array_elements(details) e
   where e ->> 'type' is distinct from 'drive_link';

  if p_link is not null and btrim(p_link) <> '' then
    filtered := filtered || jsonb_build_object('type', 'drive_link', 'value', btrim(p_link));
  end if;

  update public.bookings
     set companions_details = filtered
   where id = target.id
  returning * into target;

  return target;
end;
$fn$;

revoke all on function public.set_booking_drive_link(text, uuid, text) from public, anon, authenticated;
grant execute on function public.set_booking_drive_link(text, uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. التخزين -- منع سرد كل صور التحويلات من المفتاح العام
-- ---------------------------------------------------------------------------
-- ملحوظة: الباكت لسه public، فالروابط المباشرة شغالة زي ما هي (اللوحة والطالب
-- بيعرضوا الصور بيها). اللي بيتقفل هنا هو الـ list API اللي بيسمح بسحب أسماء
-- كل الملفات. القفل الكامل = باكت private + signed URLs (تغيير أكبر).
drop policy if exists "Anyone can view payment screenshots"   on storage.objects;
drop policy if exists "Anyone can upload payment screenshots" on storage.objects;

create policy "anon can upload a payment screenshot"
  on storage.objects for insert to anon
  with check (bucket_id = 'payment-screenshots');

create policy "admins can list payment screenshots"
  on storage.objects for select to authenticated
  using (bucket_id = 'payment-screenshots' and public.is_dashboard_admin());

commit;

-- ============================================================================
-- خطوة إجبارية بعد التشغيل: ضيف نفسك كأدمن
-- ============================================================================
-- 1. Supabase Dashboard > Authentication > Users > Add user
--    اعمل حساب بالإيميل وكلمة السر اللي هتدخل بيهم اللوحة، وفعّل Auto Confirm.
-- 2. Authentication > Sign In / Providers > Email:
--    اقفل "Allow new users to sign up"  <-- مهم جداً
-- 3. شغّل السطر ده وحط إيميلك مكان الموجود:
--
--    insert into public.admins (user_id, email)
--    select id, email from auth.users where email = 'you@example.com'
--    on conflict (user_id) do nothing;
--
-- من غير الخطوة 3 اللوحة هتفضل فاضية حتى لو سجّلت دخول بنجاح.
--
-- للتأكد إن كل حاجة ظبطت:
--    select * from public.admins;
--    select acted_at, action, acted_by, order_number from public.bookings_audit
--    order by acted_at desc limit 20;
-- ============================================================================
