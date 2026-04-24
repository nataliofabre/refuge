-- =====================================================================
-- Application d'accompagnement à la sobriété — Schéma initial Supabase
-- Version : 1.0 (MVP)
-- Cible : Postgres 15+ avec extension Supabase (auth.users existant)
-- Exécution : copier/coller dans l'éditeur SQL Supabase OU psql
-- =====================================================================
--
-- Conventions :
--   * Toutes les tables métier référencent auth.users(id) via user_id.
--   * Les PK sont des uuid générés par gen_random_uuid() (extension pgcrypto).
--   * RLS activée par défaut sur toutes les tables métier.
--   * Les policies suivent la règle : patient voit ses propres lignes ;
--     praticien voit les lignes des patients liés ACTIVE + consentement.
--   * Les commentaires COMMENT ON documentent les règles métier.
--
-- ÉTAPES D'EXÉCUTION :
--   1) Activer les extensions (une fois).
--   2) Créer les types enum.
--   3) Créer les tables dans l'ordre des dépendances.
--   4) Index.
--   5) Triggers (updated_at).
--   6) Row Level Security + Policies.
--   7) Fonctions utilitaires (helper RLS).
--   8) Vues optionnelles (dashboards).
--
-- NOTE HDS : ce schéma ne suffit pas à être conforme HDS ; il doit être
-- exécuté sur une instance Supabase auto-hébergée chez un hébergeur HDS
-- certifié (OVHcloud HDS, Scaleway HDS, etc.) — cf. document de cadrage §19.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) EXTENSIONS
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";


-- ---------------------------------------------------------------------
-- 2) TYPES ENUM
-- ---------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('patient', 'practitioner', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type link_status as enum ('pending', 'active', 'revoked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type goal_type as enum (
    'risk_reduction', 'total_stop', 'financial', 'sleep', 'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type consumption_category as enum (
    'alcohol', 'tobacco', 'cannabis', 'other_substance', 'behavior'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type emotion_state as enum (
    'stress', 'boredom', 'joy', 'sadness', 'anger', 'anxiety',
    'social_pressure', 'habit', 'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_type as enum (
    'followup_24h',
    'daily_goal_reminder',
    'weekly_summary_patient',
    'pre_consultation_summary',
    'welcome',
    'custom'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_channel as enum ('push', 'email', 'sms');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_status as enum ('scheduled', 'sent', 'failed', 'canceled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type resource_type as enum ('exercise', 'article', 'audio', 'video', 'breathing');
exception when duplicate_object then null; end $$;

do $$ begin
  create type verified_status as enum ('pending', 'verified', 'rejected');
exception when duplicate_object then null; end $$;


-- ---------------------------------------------------------------------
-- 3) TABLES
-- ---------------------------------------------------------------------

-- 3.1 users (projection de auth.users + rôle applicatif)
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  role        user_role not null default 'patient',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.users is 'Projection de auth.users avec rôle applicatif.';

-- 3.2 user_profiles (patient)
create table if not exists public.user_profiles (
  user_id                       uuid primary key references public.users(id) on delete cascade,
  display_name                  text,
  date_of_birth                 date,
  baseline_consumption_summary  jsonb,          -- libre, capturé à l'onboarding
  baseline_budget_estimate      numeric(10,2),  -- € par semaine
  main_goal                     goal_type,
  consent_to_share_data         boolean not null default false,
  consent_recorded_at           timestamptz,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);
comment on column public.user_profiles.consent_to_share_data
  is 'Consentement global au partage avec un psychiatre. Le périmètre fin est dans patient_practitioner_links.consent_scope.';

-- 3.3 practitioner_profiles
create table if not exists public.practitioner_profiles (
  user_id          uuid primary key references public.users(id) on delete cascade,
  full_name        text not null,
  profession       text not null,              -- "psychiatre", "psychologue", "addictologue", ...
  registration_id  text,                        -- RPPS / ADELI si applicable
  verified_status  verified_status not null default 'pending',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
comment on column public.practitioner_profiles.verified_status
  is 'Statut de vérification manuel par un admin avant activation des liens patient.';

-- 3.4 patient_practitioner_links
create table if not exists public.patient_practitioner_links (
  id                    uuid primary key default gen_random_uuid(),
  patient_user_id       uuid not null references public.users(id) on delete cascade,
  practitioner_user_id  uuid not null references public.users(id) on delete cascade,
  status                link_status not null default 'pending',
  consent_scope         jsonb not null default '{
    "consumptions": true,
    "cravings": true,
    "goals": true,
    "followup_reviews_24h": true,
    "notes_visible_to_patient": false
  }'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  revoked_at            timestamptz,
  constraint unique_patient_practitioner unique (patient_user_id, practitioner_user_id)
);
comment on column public.patient_practitioner_links.consent_scope
  is 'Périmètre de partage granulaire. Les policies RLS s''appuient dessus.';

-- 3.5 goals
create table if not exists public.goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  goal_type     goal_type not null,
  description   text,
  target_value  numeric(10,2),           -- ex : max 5 verres/semaine, ou 0 cigarette/jour
  target_unit   text,                     -- 'verres/semaine', 'cigarettes/jour', '€/mois'
  start_date    date not null default current_date,
  end_date      date,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 3.6 consumptions
create table if not exists public.consumptions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  consumed_at     timestamptz not null default now(),
  category        consumption_category not null,
  subcategory     text,                   -- 'beer', 'wine', 'spirits', 'cigarette', 'vape', etc.
  quantity        numeric(10,2) not null,
  unit            text not null,          -- 'standard_drink', 'cigarette', 'gram', 'episode'
  price           numeric(10,2),
  context         text,                   -- ex. 'soirée', 'seul', 'travail'
  trigger_reason  emotion_state,
  emotional_state text,
  sensation_after text,
  note            text,
  created_at      timestamptz not null default now()
);
comment on column public.consumptions.unit
  is 'Unité standardisée. Pour l''alcool : standard_drink = 10 g alcool pur (repère OMS).';

-- 3.7 craving_events
create table if not exists public.craving_events (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  created_at     timestamptz not null default now(),
  intensity      smallint not null check (intensity between 1 and 5),
  category       consumption_category,
  context        text,
  action_taken   text,
  resolved       boolean not null default false,
  resolved_at    timestamptz
);

-- 3.8 followup_reviews_24h
create table if not exists public.followup_reviews_24h (
  id                     uuid primary key default gen_random_uuid(),
  consumption_id         uuid not null references public.consumptions(id) on delete cascade,
  user_id                uuid not null references public.users(id) on delete cascade,
  sent_at                timestamptz not null default now(),
  answered_at            timestamptz,
  confirmed_consumption  boolean,
  confirmed_price        numeric(10,2),
  reflection_reason      text,
  regret_level           smallint check (regret_level between 1 and 5),
  comment                text
);

-- 3.9 resources (contenu éditorial, pas de RLS utilisateur)
create table if not exists public.resources (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  type        resource_type not null,
  category    text,
  content     text,                 -- markdown ou URL
  duration_s  integer,              -- pour audio/vidéo
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 3.10 exercises (exercices anti-craving structurés)
create table if not exists public.exercises (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  steps        jsonb not null,       -- liste ordonnée d'étapes
  duration_s   integer,
  category     text,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 3.11 notifications
create table if not exists public.notifications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  type           notification_type not null,
  channel        notification_channel not null,
  scheduled_at   timestamptz not null,
  sent_at        timestamptz,
  status         notification_status not null default 'scheduled',
  payload        jsonb,
  created_at     timestamptz not null default now()
);

-- 3.12 settings (1 ligne par utilisateur)
create table if not exists public.settings (
  user_id                    uuid primary key references public.users(id) on delete cascade,
  notifications_enabled      boolean not null default true,
  quiet_hours_start          time not null default '22:00',
  quiet_hours_end            time not null default '08:00',
  soft_mode                  boolean not null default false,   -- masque chiffres durs
  locale                     text not null default 'fr-FR',
  timezone                   text not null default 'Europe/Paris',
  updated_at                 timestamptz not null default now()
);

-- 3.13 consultation_summaries
create table if not exists public.consultation_summaries (
  id                    uuid primary key default gen_random_uuid(),
  patient_user_id       uuid not null references public.users(id) on delete cascade,
  practitioner_user_id  uuid not null references public.users(id) on delete cascade,
  period_start          date not null,
  period_end            date not null,
  summary_text          text not null,
  generated_at          timestamptz not null default now()
);

-- 3.14 practitioner_notes (notes privées pro, non visibles patient par défaut)
create table if not exists public.practitioner_notes (
  id                    uuid primary key default gen_random_uuid(),
  patient_user_id       uuid not null references public.users(id) on delete cascade,
  practitioner_user_id  uuid not null references public.users(id) on delete cascade,
  content               text not null,
  visible_to_patient    boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
comment on table public.practitioner_notes
  is 'Notes privées du praticien. Par défaut non visibles au patient. Toute écriture est auditable.';


-- ---------------------------------------------------------------------
-- 4) INDEX
-- ---------------------------------------------------------------------
create index if not exists idx_consumptions_user_time
  on public.consumptions (user_id, consumed_at desc);
create index if not exists idx_consumptions_category
  on public.consumptions (user_id, category);
create index if not exists idx_cravings_user_time
  on public.craving_events (user_id, created_at desc);
create index if not exists idx_followups_user
  on public.followup_reviews_24h (user_id, sent_at desc);
create index if not exists idx_goals_user_active
  on public.goals (user_id) where active;
create index if not exists idx_links_patient_active
  on public.patient_practitioner_links (patient_user_id, status);
create index if not exists idx_links_practitioner_active
  on public.patient_practitioner_links (practitioner_user_id, status);
create index if not exists idx_notifications_schedule
  on public.notifications (status, scheduled_at) where status = 'scheduled';


-- ---------------------------------------------------------------------
-- 5) TRIGGERS updated_at
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'users','user_profiles','practitioner_profiles',
      'patient_practitioner_links','goals','resources','exercises',
      'settings','practitioner_notes'
    ])
  loop
    execute format(
      'drop trigger if exists trg_touch_%1$s on public.%1$s;
       create trigger trg_touch_%1$s
       before update on public.%1$s
       for each row execute function public.touch_updated_at();', t);
  end loop;
end $$;


-- ---------------------------------------------------------------------
-- 6) ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.users                         enable row level security;
alter table public.user_profiles                 enable row level security;
alter table public.practitioner_profiles         enable row level security;
alter table public.patient_practitioner_links    enable row level security;
alter table public.goals                         enable row level security;
alter table public.consumptions                  enable row level security;
alter table public.craving_events                enable row level security;
alter table public.followup_reviews_24h          enable row level security;
alter table public.notifications                 enable row level security;
alter table public.settings                      enable row level security;
alter table public.consultation_summaries        enable row level security;
alter table public.practitioner_notes            enable row level security;
-- resources & exercises : lecture publique, écriture admin (voir policies)
alter table public.resources                     enable row level security;
alter table public.exercises                     enable row level security;


-- 6.1 Fonctions helpers

create or replace function public.current_role_is(r user_role)
returns boolean language sql stable as $$
  select exists (select 1 from public.users u
                 where u.id = auth.uid() and u.role = r);
$$;

create or replace function public.is_linked_practitioner(patient uuid, scope_key text)
returns boolean language sql stable as $$
  select exists (
    select 1
    from public.patient_practitioner_links l
    where l.practitioner_user_id = auth.uid()
      and l.patient_user_id = patient
      and l.status = 'active'
      and coalesce((l.consent_scope ->> scope_key)::boolean, false) = true
  );
$$;


-- 6.2 Policies

-- users
drop policy if exists users_self_select on public.users;
create policy users_self_select on public.users
  for select using (id = auth.uid());

drop policy if exists users_self_update on public.users;
create policy users_self_update on public.users
  for update using (id = auth.uid());

-- user_profiles
drop policy if exists profile_self_all on public.user_profiles;
create policy profile_self_all on public.user_profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists profile_pro_read on public.user_profiles;
create policy profile_pro_read on public.user_profiles
  for select using (public.is_linked_practitioner(user_id, 'consumptions'));

-- practitioner_profiles
drop policy if exists pro_profile_self on public.practitioner_profiles;
create policy pro_profile_self on public.practitioner_profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists pro_profile_linked_patient_read on public.practitioner_profiles;
create policy pro_profile_linked_patient_read on public.practitioner_profiles
  for select using (
    exists (
      select 1 from public.patient_practitioner_links l
      where l.patient_user_id = auth.uid()
        and l.practitioner_user_id = practitioner_profiles.user_id
        and l.status in ('pending','active')
    )
  );

-- patient_practitioner_links : deux côtés peuvent lire
drop policy if exists links_either_side_read on public.patient_practitioner_links;
create policy links_either_side_read on public.patient_practitioner_links
  for select using (patient_user_id = auth.uid() or practitioner_user_id = auth.uid());

drop policy if exists links_patient_insert on public.patient_practitioner_links;
create policy links_patient_insert on public.patient_practitioner_links
  for insert with check (patient_user_id = auth.uid());

drop policy if exists links_patient_update on public.patient_practitioner_links;
create policy links_patient_update on public.patient_practitioner_links
  for update using (patient_user_id = auth.uid()) with check (patient_user_id = auth.uid());

-- goals
drop policy if exists goals_self on public.goals;
create policy goals_self on public.goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists goals_pro_read on public.goals;
create policy goals_pro_read on public.goals
  for select using (public.is_linked_practitioner(user_id, 'goals'));

-- consumptions
drop policy if exists conso_self on public.consumptions;
create policy conso_self on public.consumptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists conso_pro_read on public.consumptions;
create policy conso_pro_read on public.consumptions
  for select using (public.is_linked_practitioner(user_id, 'consumptions'));

-- craving_events
drop policy if exists crav_self on public.craving_events;
create policy crav_self on public.craving_events
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists crav_pro_read on public.craving_events;
create policy crav_pro_read on public.craving_events
  for select using (public.is_linked_practitioner(user_id, 'cravings'));

-- followup_reviews_24h
drop policy if exists fu_self on public.followup_reviews_24h;
create policy fu_self on public.followup_reviews_24h
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists fu_pro_read on public.followup_reviews_24h;
create policy fu_pro_read on public.followup_reviews_24h
  for select using (public.is_linked_practitioner(user_id, 'followup_reviews_24h'));

-- notifications (le backend insère ; l'utilisateur lit les siennes)
drop policy if exists notif_self_read on public.notifications;
create policy notif_self_read on public.notifications
  for select using (user_id = auth.uid());

-- settings
drop policy if exists settings_self on public.settings;
create policy settings_self on public.settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- consultation_summaries
drop policy if exists cs_patient on public.consultation_summaries;
create policy cs_patient on public.consultation_summaries
  for select using (patient_user_id = auth.uid());

drop policy if exists cs_practitioner on public.consultation_summaries
  ;
create policy cs_practitioner on public.consultation_summaries
  for all using (practitioner_user_id = auth.uid())
  with check (
    practitioner_user_id = auth.uid()
    and public.is_linked_practitioner(patient_user_id, 'consumptions')
  );

-- practitioner_notes
drop policy if exists pn_practitioner_own on public.practitioner_notes;
create policy pn_practitioner_own on public.practitioner_notes
  for all using (practitioner_user_id = auth.uid())
  with check (
    practitioner_user_id = auth.uid()
    and public.is_linked_practitioner(patient_user_id, 'consumptions')
  );

drop policy if exists pn_patient_read_public on public.practitioner_notes;
create policy pn_patient_read_public on public.practitioner_notes
  for select using (patient_user_id = auth.uid() and visible_to_patient = true);

-- resources & exercises : lecture publique authentifiée
drop policy if exists resources_read_all on public.resources;
create policy resources_read_all on public.resources
  for select using (active = true);

drop policy if exists exercises_read_all on public.exercises;
create policy exercises_read_all on public.exercises
  for select using (active = true);

-- (écriture resources/exercises réservée à des rôles admin via service role key
--  ou une future policy "current_role_is('admin')")


-- ---------------------------------------------------------------------
-- 7) FONCTIONS UTILITAIRES MÉTIER
-- ---------------------------------------------------------------------

-- 7.1 Total consommations par semaine (7 derniers jours)
create or replace function public.weekly_consumption_totals(p_user uuid)
returns table(category consumption_category, qty numeric, spent numeric)
language sql stable as $$
  select
    c.category,
    sum(c.quantity)::numeric as qty,
    sum(coalesce(c.price, 0))::numeric as spent
  from public.consumptions c
  where c.user_id = p_user
    and c.consumed_at >= now() - interval '7 days'
  group by c.category;
$$;

-- 7.2 Argent cumulé dépensé sur une période
create or replace function public.total_spent(p_user uuid, p_from timestamptz, p_to timestamptz)
returns numeric
language sql stable as $$
  select coalesce(sum(price), 0)::numeric
  from public.consumptions
  where user_id = p_user
    and consumed_at between p_from and p_to;
$$;

-- 7.3 Streak « jours sans consommation » jusqu'à aujourd'hui
create or replace function public.current_sober_streak_days(p_user uuid)
returns integer
language plpgsql stable as $$
declare
  last_conso date;
begin
  select max(consumed_at)::date into last_conso
  from public.consumptions where user_id = p_user;

  if last_conso is null then
    return coalesce((
      select (current_date - (u.created_at::date))::int
      from public.users u where u.id = p_user
    ), 0);
  end if;

  return greatest((current_date - last_conso)::int - 1, 0);
end;
$$;


-- ---------------------------------------------------------------------
-- 8) VUES OPTIONNELLES
-- ---------------------------------------------------------------------

-- 8.1 Vue tableau de bord patient — sécurité héritée des RLS tables sous-jacentes
create or replace view public.v_patient_dashboard as
select
  u.id as user_id,
  (select count(*) from public.consumptions c
     where c.user_id = u.id and c.consumed_at >= now() - interval '7 days') as conso_count_7d,
  public.total_spent(u.id, now() - interval '7 days', now()) as spent_7d,
  public.total_spent(u.id, now() - interval '30 days', now()) as spent_30d,
  (select count(*) from public.craving_events e
     where e.user_id = u.id and e.created_at >= now() - interval '7 days') as cravings_7d,
  (select count(*) from public.craving_events e
     where e.user_id = u.id and e.resolved and e.created_at >= now() - interval '7 days') as cravings_resolved_7d,
  public.current_sober_streak_days(u.id) as sober_streak_days
from public.users u
where u.role = 'patient';

-- =====================================================================
-- FIN DU SCHÉMA
-- =====================================================================
