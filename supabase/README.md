# Supabase setup

The repository contains a connected Supabase project, but the remote database currently does not
expose any of the application tables. The generated Edge Function is also not deployed: its health
route returns `404 NOT_FOUND`.

## 1. Apply the database migration

Open the connected Supabase project, go to **SQL Editor**, paste the complete contents of
`migrations/20250618000000_workshop_schema.sql`, and run it once.

Alternatively, after installing and authenticating the Supabase CLI:

```sh
supabase link --project-ref <project-ref>
supabase db push
```

The migration is idempotent and creates:

- `profiles`
- `clients`
- `employees`
- `vehicles`
- `orders`
- `quotes`
- `appointments`
- `maintenance_bookings`
- `loyalty_rewards`
- `loyalty_redemptions`
- `referrals`
- `kv_store_6c346218`

All tables have Row Level Security enabled. Anonymous access is denied. Client records are visible
only to the matching authenticated user; operational records are manageable only by authenticated
staff. The KV table is reserved for the Edge Function's service-role client.

## 2. Configure authentication before persisting personal data

The current login screen is a prototype and does not authenticate with Supabase Auth. Do not connect
the forms to the database until real admin, employee, and client accounts exist and each account has
a matching `profiles` row. Client accounts also need a `clients.user_id` link.

Do not place `SUPABASE_SERVICE_ROLE_KEY` in frontend code. It is only valid in the managed Edge
Function environment.

## 3. Deploy the Edge Function

The source entry point is `functions/server/index.tsx`. Deployment must preserve the function's
managed environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

After deployment, verify:

```text
GET /functions/v1/make-server-6c346218/health
```

The expected body is:

```json
{ "status": "ok" }
```

## 4. Verify the remote schema

After the migration, a request to each `/rest/v1/<table>?select=*&limit=1` endpoint should no longer
return `PGRST205`. An anonymous request may return an empty result or an authorization error because
RLS intentionally blocks personal and operational data.
