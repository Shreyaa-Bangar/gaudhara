# 🐄 GAU DHARA – Milk Dairy Website

Full-stack dairy e-commerce site: products, cart & checkout, login/sign-up, contact form, and an **Admin portal**.
Frontend = plain HTML/CSS/JS. Backend = Node.js + SQLite. **No `npm install` needed** (only Node's built-in modules are used).

## Run it
Requirements: **Node.js 22.5 or newer** (`node -v` to check).

```bash
node --no-warnings server/server.js      # or:  npm start
```

Open **http://localhost:3000**. The database (`server/data/gaudhara.db`) is created automatically on first run
with the 14 products already loaded.

> Open the site through the server (`http://localhost:3000`), not by double-clicking the HTML files —
> login, orders and the admin portal need the server.

## Admin portal
`http://localhost:3000/admin.html` (also shown as "🛠 Admin Portal" in the navbar once an admin is logged in).

First run creates the admin account and prints it in the terminal. Default: `admin@gaudhara.com` / `Admin@12345`.
**Change it** by setting env vars *before the first run*:

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-strong-password' node --no-warnings server/server.js
```
(If the DB already exists, delete `server/data/` to re-create it – this erases all data.)

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
| Backend | `server/server.js` (API + static files), `server/db.js` (tables + seed data) |

## How products work
The database keeps **one row per size** (e.g. `Paneer 100 g ₹45`, `Paneer 250 g ₹105`). The Products page groups rows
with the **same name** into one card with quantity buttons. In the Admin portal, to add a new size of an existing
product, add a row with the same name and a different quantity.

## API (all JSON)
Public: `GET /api/products`, `POST /api/contact`, `POST /api/auth/signup|login|logout`, `GET /api/auth/me`
Customer: `POST /api/orders`, `GET /api/orders/mine`
Admin only: `/api/admin/stats|products|orders|messages|users`

## Database tables
`users` · `products` · `orders` · `order_items` · `messages` (see `server/db.js`).

## Security notes
Passwords are hashed with scrypt; sessions are signed HttpOnly cookies; order prices are always recalculated
on the server; admin routes check the role on every request; login/signup/contact are rate-limited;
all database text is HTML-escaped before display. For a real deployment: run behind HTTPS with
`NODE_ENV=production`, set `SESSION_SECRET`, and change the admin password.

## Bug fixed in this update
`script.js` and `style.css` each contained the whole file pasted twice, which caused
`SyntaxError: Identifier '$' has already been declared` – that crashed the script and left the Products page empty.
