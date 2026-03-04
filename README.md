# ES Explorer – Compstore Menu Browser

A minimal Next.js (App Router) application that proxies Elasticsearch and displays results from the `compstore_menu_latest` index in a filterable, paginated table.

---

## File tree

```
es-explorer/
├── .env.local.example       # copy to .env.local and fill in
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── lib/
    │   └── es.ts             # server-side ES helper (fetch wrapper + query builders)
    ├── app/
    │   ├── layout.tsx        # root HTML layout
    │   ├── page.tsx          # mounts the client Explorer component
    │   └── api/
    │       ├── sources/
    │       │   └── route.ts  # GET /api/sources  → distinct restaurant_source values
    │       └── search/
    │           └── route.ts  # GET /api/search   → paginated, filterable document list
    └── components/
        └── Explorer.tsx      # client component: dropdown, table, pagination, loading/error
```

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Create your local env file
cp .env.local.example .env.local
# Edit .env.local – set ES_BASE_URL (and optionally ES_USERNAME / ES_PASSWORD)

# 3. Run the dev server
npm run dev
# Open http://localhost:3000
```

### Environment variables

| Variable        | Required | Description                                  |
|-----------------|----------|----------------------------------------------|
| `ES_BASE_URL`   | Yes      | Elasticsearch URL, e.g. `http://localhost:9200` |
| `ES_USERNAME`   | No       | Basic-auth username (leave blank for no auth)   |
| `ES_PASSWORD`   | No       | Basic-auth password                             |

---

## API routes

### `GET /api/sources`
Returns a JSON array of distinct `restaurant_source.keyword` values (up to 50).

### `GET /api/search`
| Param      | Default | Description                                   |
|------------|---------|-----------------------------------------------|
| `sources`  | (none)  | Comma-separated filter values, e.g. `yelp,google` |
| `page`     | `1`     | 1-based page number                           |
| `pageSize` | `50`    | Results per page (max 200)                    |

Returns `{ total, page, pageSize, rows }`.

---

## Security notes

**Why a backend proxy?**

- Elasticsearch should *never* be exposed directly to the browser. Doing so leaks credentials (basic-auth headers) and allows arbitrary queries against the cluster.
- The Next.js API routes act as a thin proxy: the browser only talks to `/api/*`, and the server-side code adds auth headers and constructs safe, pre-defined queries.
- In production you would further restrict the proxy (rate-limiting, auth on the Next.js side, read-only ES user, etc.).

---

## Customisation

- **Fields**: Edit the `FIELDS` array in `src/lib/es.ts` and the `COLUMNS` array in `src/components/Explorer.tsx` to add or remove columns.
- **Index name**: Change the `INDEX` constant at the top of `src/lib/es.ts`.
- **Page size**: Change `PAGE_SIZE` in `Explorer.tsx`.
- **Styling**: All styles are inline for simplicity; swap in Tailwind or CSS Modules if preferred.
