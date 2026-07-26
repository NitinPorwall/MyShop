# MyShop — Full Stack E-Commerce Platform

A role-based, multi-category e-commerce platform where **sellers** can list,
edit, and delete products across categories like Electronics, Fashion, Home &
Kitchen, Beauty, Books, Sports & Fitness, and Groceries, and **customers** can
browse, search, filter, and buy them. Built with a Node.js/Express/MongoDB
REST API and a plain HTML/CSS/JavaScript frontend that talks to it over the
Fetch API.

## Tech Stack

- **Backend:** Node.js, Express.js, MongoDB (Mongoose), JWT, bcrypt.js
- **Frontend:** HTML, CSS, vanilla JavaScript (Fetch API, localStorage)
- **Deployment:** Render

## Features

- Role-based accounts (customer / seller) with JWT authentication and bcrypt password hashing
- RESTful APIs for the full product lifecycle: create, read, update, delete
- Products span multiple categories (Electronics, Fashion, Home & Kitchen, Beauty, Books, Sports & Fitness, Groceries, and any custom category a seller adds)
- Sellers manage only their own products; ownership is enforced server-side
- Customers can search, filter by category, and sort by price
- Cart persisted in `localStorage`; checkout creates a real order and decrements stock
- Server always re-reads prices/stock from the database at checkout — the client is never trusted for pricing

## Project Structure

```
myshop/
├── server.js              # Express app entry point
├── seed.js                 # Optional: populates demo data
├── config/db.js            # MongoDB connection
├── models/                 # User, Product, Order (Mongoose schemas)
├── middleware/authMiddleware.js  # JWT verification + role guard
├── controllers/            # Route handler logic
├── routes/                 # Express routers (auth, products, orders)
└── public/                 # Static frontend (served by Express)
    ├── index.html           # Catalogue
    ├── product.html         # Product detail
    ├── cart.html            # Cart + checkout
    ├── login.html / register.html
    ├── seller-dashboard.html
    ├── css/style.css
    └── js/                  # api.js (fetch + localStorage), and one file per page
```

## Local Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   Copy `.env.example` to `.env` and fill in your own values:
   ```
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/myshop
   JWT_SECRET=replace_this_with_a_long_random_secret
   PORT=5000
   ```
   You can use a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster for `MONGO_URI`.

3. **(Optional) Seed demo data**
   ```bash
   npm run seed
   ```
   Creates a demo seller account (`seller@myshop.test` / `password123`) and 8 sample products.

4. **Run the server**
   ```bash
   npm run dev     # with nodemon, auto-restarts on changes
   # or
   npm start
   ```
   Visit `http://localhost:5000`.

## API Reference

| Method | Endpoint                  | Auth            | Description                          |
|--------|----------------------------|------------------|--------------------------------------|
| POST   | `/api/auth/register`       | Public           | Create an account (customer/seller)  |
| POST   | `/api/auth/login`          | Public           | Log in, returns a JWT                |
| GET    | `/api/products`            | Public           | List products (`category`, `search`, `sort`, `minPrice`, `maxPrice` query params) |
| GET    | `/api/products/:id`        | Public           | Get one product                      |
| GET    | `/api/products/seller/mine`| Seller           | List the logged-in seller's products |
| POST   | `/api/products`            | Seller           | Create a product                     |
| PUT    | `/api/products/:id`        | Seller (owner)   | Update a product you own             |
| DELETE | `/api/products/:id`        | Seller (owner)   | Delete a product you own             |
| POST   | `/api/orders`              | Customer         | Place an order (`{ items: [{productId, qty}] }`) |
| GET    | `/api/orders/mine`         | Customer         | List your own past orders            |
| GET    | `/api/orders/seller`       | Seller           | List orders containing your products |

Protected routes expect `Authorization: Bearer <token>`.

## Deploying to Render

1. Push this project to a GitHub repository.
2. On [Render](https://render.com), create a **New Web Service** and connect the repo.
3. Set:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
4. Add environment variables in the Render dashboard: `MONGO_URI`, `JWT_SECRET` (Render sets `PORT` automatically).
5. Deploy. Express serves both the API and the static frontend from a single service, so no separate frontend deployment is needed.

## Notes on Design Choices

- Passwords are hashed with bcrypt before being stored; plaintext passwords are never persisted.
- JWTs are stateless and carry only `{ id, role }` — no sensitive data.
- The frontend keeps the JWT and cart in `localStorage` and attaches the token to every authenticated Fetch call.
- Ownership checks happen in the controllers (`product.seller.toString() !== req.user.id`), not just in the UI, so the API itself is safe to call directly.
