# Refuge — app d'accompagnement à la sobriété (v0)

App mobile/web responsive pour suivre consommations, cravings, objectifs, avec partage optionnel vers un psychiatre.

**Stack** : Next.js 14 (App Router) · TypeScript · Tailwind · Supabase (Auth + Postgres + RLS) · Recharts · Lucide.

**Déploiement** : GitHub → Vercel (gratuit) · base Supabase cloud (gratuit, région EU Frankfurt).

> ⚠️ Cette v0 n'est pas hébergée HDS. Elle est conçue pour un usage **test perso / démo / beta fermée avec des proches consentants**, pas pour accueillir de vrais patients avec un vrai suivi médical. Avant un lancement public avec un psychiatre, revoir le §19 du document de cadrage.

---

## 1. Prérequis

Installés sur ta machine :

- [Node.js 20+](https://nodejs.org/) (vérifie avec `node -v`)
- [Git](https://git-scm.com/)
- Un compte [GitHub](https://github.com)
- Un compte [Supabase](https://supabase.com) (gratuit)
- Un compte [Vercel](https://vercel.com) (gratuit, connecte-le à GitHub)

---

## 2. Installation locale (5 min)

```bash
cd app-sobriete
npm install
cp .env.example .env.local
# édite .env.local avec les clés Supabase (voir étape 3)
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

---

## 3. Configuration Supabase (10 min)

### 3.1 Créer le projet

1. Va sur [supabase.com](https://supabase.com) → **New project**.
2. Choisis la région **Frankfurt (eu-central-1)**.
3. Note le mot de passe DB quelque part.
4. Attends ~2 min que le projet soit prêt.

### 3.2 Appliquer le schéma

1. Dans Supabase → **SQL Editor** → **New query**.
2. Colle le contenu de `supabase/schema.sql` (fourni dans ce repo).
3. Clique **Run**. Tu dois voir ~40 "OK" — aucune erreur.

### 3.3 Activer l'auth par email magic link

1. Dans Supabase → **Authentication** → **Providers** → **Email** : activé par défaut.
2. Désactive **Confirm email** si tu veux accélérer les tests (optionnel, à réactiver en prod).
3. **URL Configuration** → ajoute :
   - `http://localhost:3000/auth/callback`
   - `https://<ton-domaine>.vercel.app/auth/callback` (après le déploiement)

### 3.4 Récupérer les clés

Dans Supabase → **Settings** → **API** :

- `NEXT_PUBLIC_SUPABASE_URL` = URL du projet
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = clé `anon public`

Colle-les dans `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Relance `npm run dev`.

---

## 4. Pousser sur GitHub

```bash
cd app-sobriete
git init
git add .
git commit -m "v0 initiale"
# crée un repo vide sur github.com (bouton "New")
git remote add origin https://github.com/<ton-user>/refuge.git
git branch -M main
git push -u origin main
```

---

## 5. Déployer sur Vercel (3 min)

1. Va sur [vercel.com/new](https://vercel.com/new) → **Import Git Repository**.
2. Sélectionne ton repo `refuge`.
3. Dans **Environment Variables**, ajoute les trois clés `.env.local` (mets `NEXT_PUBLIC_SITE_URL` à l'URL Vercel que tu connaîtras après, tu peux la laisser vide au 1er deploy).
4. Clique **Deploy**. Vercel build et te donne une URL `https://refuge-xxx.vercel.app`.
5. Retourne dans Supabase → Auth → URL Configuration → ajoute l'URL Vercel + `/auth/callback`.
6. Dans Vercel → Settings → Env Vars → mets à jour `NEXT_PUBLIC_SITE_URL` avec la vraie URL, puis **Redeploy**.

---

## 6. Installer comme une app sur ton téléphone (PWA)

- **iPhone** : ouvre le lien Vercel dans Safari → bouton Partager → **Ajouter à l'écran d'accueil**.
- **Android** : ouvre dans Chrome → menu → **Ajouter à l'écran d'accueil**.

Tu auras une icône et l'app se lancera en plein écran.

---

## 7. Donner un rôle « praticien » à un compte (pour tester la vue pro)

Par défaut, tout nouveau compte est `patient`. Pour passer un compte en `practitioner` :

1. Connecte-toi une première fois avec l'email que tu veux transformer en compte pro (pour que la ligne existe).
2. Dans Supabase → **SQL Editor** :

```sql
update public.users
set role = 'practitioner'
where email = 'ton-email-pro@exemple.fr';

insert into public.practitioner_profiles (user_id, full_name, profession, verified_status)
select id, 'Dr Exemple', 'psychiatre', 'verified'
from public.users where email = 'ton-email-pro@exemple.fr';
```

Ensuite, connecte-toi avec ce compte et va sur `/pro/patients`.

Pour lier un patient à un praticien (toujours côté SQL pour la v0, UI à faire en v1) :

```sql
insert into public.patient_practitioner_links (patient_user_id, practitioner_user_id, status)
values (
  (select id from public.users where email='patient@example.fr'),
  (select id from public.users where email='ton-email-pro@exemple.fr'),
  'active'
);
```

---

## 8. Structure

```
app-sobriete/
├── app/
│   ├── page.tsx                  # Landing
│   ├── login/                    # Magic link
│   ├── auth/callback/            # Retour OAuth
│   ├── onboarding/               # Multi-step
│   ├── (app)/                    # Espace patient (bottom nav)
│   │   ├── dashboard/
│   │   ├── log/                  # Déclarer une conso
│   │   ├── craving/              # Respiration + actions
│   │   ├── goals/
│   │   ├── evolution/
│   │   ├── impact/
│   │   ├── resources/
│   │   └── profile/
│   └── (pro)/pro/
│       └── patients/             # Liste + fiche patient
├── components/ui/                # Design system
├── lib/supabase/                 # Clients (browser / server / middleware)
├── lib/                          # utils, constants, types
├── supabase/schema.sql           # Schéma complet avec RLS
├── middleware.ts                 # Auth gating
└── tailwind.config.ts            # Palette "medical fun"
```

---

## 9. Prochaines évolutions suggérées

- Rappel 24h post-conso (Supabase Edge Function + cron).
- Questionnaire AUDIT-C / Fagerström côté onboarding pro.
- Export RGPD de toutes les données utilisateur (route `/api/export`).
- Liaison patient↔praticien par code à 6 chiffres (UI, pas juste SQL).
- PWA icons + splash screen.
- Migration vers un hébergement HDS avant ouverture publique.

---

## 10. Dépannage

| Symptôme | Solution |
|---|---|
| `Missing env var NEXT_PUBLIC_SUPABASE_URL` | Vérifie `.env.local` (minuscule `l`) et relance `npm run dev`. |
| Le magic link ne redirige pas | Vérifie Supabase → Auth → URL Configuration : le callback doit être listé. |
| 403 RLS sur une table | Vérifie que tu as exécuté `supabase/schema.sql` en entier, et que l'utilisateur est bien auth. |
| Vue pro vide | Vérifie `public.users.role = 'practitioner'` (SQL) et au moins un `patient_practitioner_links` actif. |

---

Bon courage — et prends-soin de toi au passage 🌱
