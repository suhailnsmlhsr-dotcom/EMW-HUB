# EMW Invoice — Full App

Invoices + receipts, public read/print, login-gated create/edit/delete, partial payments, linked invoice↔receipt tracking.

## What you're setting up
- **Supabase** — free hosted database (stores all invoices/receipts).
- **Vercel** — hosts the actual website (same as before).
- Your login: email `Suhailnsmlhsr@gmail.com`, password is whatever you set in step 3 below — it's never visible in the code, only stored as a private setting on Vercel.

## Step 1 — Create the database (Supabase)
1. Go to https://supabase.com → sign up (GitHub login is easiest) → **New Project**.
2. Pick any name/region, set a database password (save it somewhere — not the same as your site login), wait ~2 min for it to spin up.
3. Left sidebar → **SQL Editor** → **New query**.
4. Open `schema.sql` from this folder, copy all of it, paste into the editor, click **Run**.
5. Left sidebar → **Project Settings → API**. You'll need three values from this page in Step 3:
   - **Project URL** (this is `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` — same value, twice)
   - **anon public** key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **service_role** key (`SUPABASE_SERVICE_ROLE_KEY`) — keep this one secret, never share it

## Step 2 — Push this code to GitHub
1. Create a new repo on GitHub, e.g. `emw-invoice-app`.
2. Upload every file/folder in this project (GitHub website → **Add file → Upload files** — drag the whole thing in, or use `git push` if you're comfortable with git).
   - Do **not** upload `node_modules` or `.next` if they exist — they're excluded already in this package.

## Step 3 — Deploy on Vercel with your settings
1. Go to https://vercel.com/new → **Import Git Repository** → pick your repo.
2. Before clicking Deploy, expand **Environment Variables** and add all of these:

   | Key | Value |
   |---|---|
   | `SUPABASE_URL` | your Supabase Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service_role key |
   | `NEXT_PUBLIC_SUPABASE_URL` | same Project URL again |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon public key |
   | `ADMIN_EMAIL` | `Suhailnsmlhsr@gmail.com` |
   | `ADMIN_PASSWORD` | pick any password you want to log in with |
   | `SESSION_SECRET` | any long random string — generate one at randomkeygen.com |

3. Click **Deploy**. Takes ~1-2 minutes.
4. Visit your live URL → tap **Login** → sign in with the email/password you set above.

## Changing your password later
Vercel → your project → **Settings → Environment Variables** → edit `ADMIN_PASSWORD` → redeploy (Vercel prompts you, or push any small change to GitHub to trigger it).

## Install as an app on your phone
Open your live link → Safari: **Share → Add to Home Screen**. Chrome/Android: **⋮ → Add to Home screen**. Opens full-screen like a native app, works offline for viewing/printing already-loaded data once visited online at least once.

## How the numbering works
Every invoice and receipt shares one counter (`INV-0001`, `INV-0002`, ...) — whichever type was created last, the next one continues the count. You can always type a different number manually before saving.

## How receipts connect to invoices
When creating a receipt, choose **Select Existing Invoice** to pull in a client's details and work items automatically (everything stays editable). Saving updates that invoice's status to **Partial** or **Paid** depending on whether the full amount was received — you'll get a yes/no confirmation first. Choosing **Enter Manually** instead creates a standalone receipt not linked to any invoice.

## Backup — don't lose your data
- **Code**: living in your GitHub repo is your code backup — keep it there, don't rely on a local zip only.
- **Data (all invoices/receipts)**: Supabase → **Table Editor → documents → Export → CSV**, do this periodically (e.g. monthly) and save the file to Google Drive. This is your real data backup — the database itself is reliable, but exporting protects you against accidental mass-deletion.
- **Login credentials**: written only in Vercel's Environment Variables — if you forget your password, you can view/change it there anytime (you're logged into Vercel with your own account, so this is safe).

## Local development (optional, only if you want to test on your computer first)
```
npm install
cp .env.local.example .env.local   # then fill in real values
npm run dev
```
Opens at http://localhost:3000
