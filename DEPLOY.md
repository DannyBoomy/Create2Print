# Create2Print — Deployment Guide v2
## From zero to live

---

## STEP 1: Add your logo file

1. Take the logo image ChatGPT gave you (the Create2Print logo PNG)
2. Rename it to exactly: `logo.png`
3. Put it inside the `public/` folder in this project
4. That's it — the app will automatically show it in the header

---

## STEP 2: Create your .env.local file

In VS Code, right-click `.env.local.example` → Copy → Paste → rename to `.env.local`

Fill in all your keys:

```
OPENAI_API_KEY=your_openai_key
PRINTIFY_API_KEY=your_printify_key
PRINTIFY_SHOP_ID=your_printify_shop_id
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## STEP 3: Update Printify Variant IDs

Open `lib/products.ts` — find the placeholder variant IDs and replace them with real ones.

To get real variant IDs, run this in your terminal for each product
(replace BLUEPRINT_ID, PROVIDER_ID, and YOUR_KEY):

```
curl -H "Authorization: Bearer YOUR_KEY" https://api.printify.com/v1/catalog/blueprints/BLUEPRINT_ID/print_providers/PROVIDER_ID/variants.json
```

Products and their blueprint/provider IDs:
- Rolled Poster: Blueprint 1220, Provider 99
- Matte Canvas: Blueprint 1159, Provider 99
- Matte Canvas Framed: Blueprint 944, Provider 99
- Indoor Wall Tapestry: Blueprint 241, Provider 99

---

## STEP 4: Install and run locally

Open VS Code terminal (Ctrl + backtick):

```
npm install
npm run dev
```

Go to http://localhost:3000 — test the full flow.

---

## STEP 5: Push to GitHub

```
git init
git add .
git commit -m "Create2Print v2"
```

Then create a repo on github.com and push:
```
git remote add origin https://github.com/YOUR_USERNAME/create2print.git
git push -u origin main
```

---

## STEP 6: Deploy to Vercel

1. Go to vercel.com → Add New Project → Import your GitHub repo
2. Click Deploy
3. Go to Settings → Environment Variables
4. Add ALL keys from your .env.local (same names, same values)
5. Change NEXT_PUBLIC_APP_URL to your Vercel URL
6. Redeploy

---

## STEP 7: Connect your domain

1. Buy create2print.ai
2. Vercel → Settings → Domains → Add create2print.ai
3. Follow Vercel's DNS instructions
4. Done in ~30 minutes

---

## Updating the app later

1. Edit files in VS Code
2. Test with npm run dev
3. git add . && git commit -m "update" && git push
4. Vercel auto-deploys in ~1 minute

---

## Need help?

Bring the exact error message back to Claude and it'll be fixed immediately.
