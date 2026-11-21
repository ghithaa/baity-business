# Baity Business — بيتي بزنس

The marketplace website that connects households with providers of home services and crafts (home cooking, sweets, cleaning, maintenance, sewing…). Arabic first, with English.

It is a front end only. It talks to the **Baity backend** (`Home-Helper-Backend`, the `/api/biz/...` endpoints) and uses the same accounts as the Baity app. The theme, font (Cairo) and layout are taken from the Baity frontend.

## Run

```bash
npm install
npm run dev            # http://localhost:5174, proxies /api to http://localhost:3001
```

To proxy to another API, set `VITE_API_PROXY_TARGET`.

## Regenerate the API client

The client in `src/api-client/generated` is generated from the backend's `openapi.yaml` (tags `biz`, `biz-provider`, `biz-orders`, `biz-admin`). Use **orval 8.27.0**, the same version as the Baity frontend, which needs Node 22 or newer:

```bash
API_SPEC=../Home-Helper-Backend/openapi.yaml npx orval@8.27.0 --config ./orval.config.ts
```

## Structure

| Path | What |
|---|---|
| `src/pages` | Buyer pages: home, search, listing + order/booking, provider profile, my orders, order detail with chat |
| `src/pages/provider` | Provider application and panel: orders, offers, hours and days off, balance, profile, category requests |
| `src/pages/admin` | Admin: approve providers, categories, category requests, orders and disputes, fees and debt limit |
| `src/components/layout` | The Baity-style frame: sidebar on desktop, header + bottom tabs on phones |
| `src/lib/format.ts` | Money (halalas → SAR), Riyadh dates, status labels, API error messages |

Text is written inline as `tr("عربي", "English")`.
# baity-business
