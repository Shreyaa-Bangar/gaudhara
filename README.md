# 🐄 GAU DHARA – Milk Dairy Website

Full-stack dairy e-commerce site: products, cart & checkout, login/sign-up, contact form, and an **Admin portal**.
Frontend = plain HTML/CSS/JS. Backend = Node.js + SQLite. **No `npm install` needed** (only Node's built-in modules are used).

## Run it (Supabase version)
The site is now plain HTML/CSS/JS that talks straight to **Supabase** (database + login). No Node server is needed.

1. Create a Supabase project and run `supabase/schema.sql` in **SQL Editor** (tables, security rules, order function, starter products).
2. Authentication → Sign In / Providers → Email: turn **Confirm email** OFF while testing.
3. Create `supabase-config.js` in the project root (it is loaded before `nav.js` on every page):
   ```js
   const SUPABASE_URL = 'https://YOUR-PROJECT-ID.supabase.co';
   const SUPABASE_ANON_KEY = 'sb_publishable_...';      // publishable/anon key ONLY – never the secret/service_role key
   window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
   ```
4. Open the site through a web server, **not** by double-clicking files (login needs a real `http://` address). In VS Code use the *Live Server* extension, or run `npx serve`, or `python -m http.server 3000`.
5. Sign up once on the website, then make yourself admin in the SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'your-email@gmail.com';
   ```
6. Deploy the folder to Vercel/Netlify, then put the live URL in Supabase → Authentication → URL Configuration.

> `nav.js` contains the "API" layer: every page still calls `GD.api('/api/...')`, and nav.js answers those calls with Supabase.
> The old Node + SQLite server is kept in `server/` only as a reference and is no longer used.

## Admin portal
`http://localhost:3000/admin.html` (also shown as "🛠 Admin Portal" in the navbar once an admin is logged in).

The admin is whoever has `role = 'admin'` in the `profiles` table (see step 5 above). Admin rights are enforced by Supabase security rules (RLS), not just by the page.

What the admin can do: dashboard stats · add/edit/hide/delete products · view orders and change status
(Pending → Confirmed → Out for delivery → Delivered / Cancelled) · read, mark and delete contact messages · see customers.

## Pages
| Page | File |
|---|---|
| Home / Offers | `index.html`, `offers.html` |
| Products (each product once; pick a quantity → price appears; search + filters; mini-cart) | `products.html` + `script.js` |
| Cart page (quantities, remove, summary, delivery form, place order) | `cart.html` + `cart.js` |
| Login / Sign up / Contact / My account | `login.html`, `signup.html`, `contact.html`, `account.html` + `auth.js` |
| Admin portal | `admin.html`, `admin.css`, `admin.js` |
| Shared navbar login state, fetch helper, cart store | `nav.js` |
| Supabase | `supabase-config.js` (your URL + publishable key), `supabase/schema.sql` (tables, RLS, functions) |

## How products work
The database keeps **one row per size** (e.g. `Paneer 100 g ₹45`, `Paneer 250 g ₹105`). The Products page groups rows
with the **same name** into one card with quantity buttons. In the Admin portal, to add a new size of an existing
product, add a row with the same name and a different quantity.

## API (all JSON)
Public: `GET /api/products`, `POST /api/contact`, `POST /api/auth/signup|login|logout`, `GET /api/auth/me`
Customer: `POST /api/orders`, `GET /api/orders/mine`
Admin only: `/api/admin/stats|products|orders|messages|users`

## Database tables (Supabase)
`users` · `products` · `orders` · `order_items` · `messages` (see `supabase/schema.sql`).

## Security notes
Passwords are hashed with scrypt; sessions are signed HttpOnly cookies; order prices are always recalculated
on the server; admin routes check the role on every request; login/signup/contact are rate-limited;
all database text is HTML-escaped before display. For a real deployment: run behind HTTPS with
`NODE_ENV=production`, set `SESSION_SECRET`, and change the admin password.

## Bug fixed in this update
`script.js` and `style.css` each contained the whole file pasted twice, which caused
`SyntaxError: Identifier '$' has already been declared` – that crashed the script and left the Products page empty.
