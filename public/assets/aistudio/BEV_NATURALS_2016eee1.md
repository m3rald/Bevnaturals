# Bev Naturals Cosmetics — living brief

This file is the recall surface. Update it whenever the owner sends new facts.
Source brief: Gmail, 11 September 2026, Olaoluwa Opeyemi → oplafem10@gmail.com and adereb18@gmail.com.

## Status

- **18 September 2026 — production storefront.** Home, Shop, Product, Cart, Checkout, Order thank-you, About, Shipping, FAQ, Studio ledger.
- Customer accounts are off. Orders persist in the store database. Studio PIN gates the ledger.
- **GitHub:** [m3rald/Bev-Naturals](https://github.com/m3rald/Bev-Naturals)

## Locked from the brief

| Item | Value |
|---|---|
| Brand | Bev Naturals Cosmetics |
| Category | Hair treatment products (adult + kiddies) |
| Fulfilment | Ibadan, nationwide Nigeria |
| Pay (live) | Opay transfer · Bev Naturals Cosmetics · **6419555143** |
| Pay (later) | Paystack, hidden until `storeConfig.paystack.enabled = true` |
| Store email | adereb18@gmail.com |
| Naming | Title Case. Adult hyphens only on Anti-Dandruff and Leave-In. Kiddies hyphens only on Leave-In and Rinse-Out. Spelling: Ayurvedic. |

Catalog, prices, and sizes live in `src/lib/catalog.ts`. Payment flags live in `src/lib/store-config.ts`. Studio PIN lives in `src/lib/admin.server.ts`.

## Temporary decisions (until the owner overwrites)

- **Palette:** ink `#1C1410`, paper `#F3EBDF`, clay `#B85C38`, leaf `#3D5344`, brass `#C6A36A`. Dark mode included.
- **Photography:** owner pack shots plus studio-style catalog stills for remaining SKUs.
- **Delivery fees:** quoted after transfer until a state table is sent.
- **WhatsApp:** omitted until a number is sent.
- **Kiddies Nature Pop Conditioning Sample:** listed as Conditioning Shampoo; confirm if that spelling is final.

## Studio

- Path: `/admin`
- PIN: `IbadanBev` (change in `src/lib/admin.server.ts`)
- Actions: view orders, mark awaiting payment / paid / preparing / shipped.

## How to continue in a new chat

> Continue Bev Naturals Cosmetics from where we stopped.

Then send: brand hex colours, extra labelled product photos, WhatsApp number, delivery fee table, Paystack keys, and any catalog edits.
