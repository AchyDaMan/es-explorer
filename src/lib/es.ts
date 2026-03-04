// src/lib/es.ts
// Minimal Elasticsearch helper used by API routes only (server-side).

const ES_BASE_URL = (process.env.ES_BASE_URL || "http://localhost:9200").replace(
  /\/$/,
  ""
);
const ES_USERNAME = process.env.ES_USERNAME || "";
const ES_PASSWORD = process.env.ES_PASSWORD || "";
const INDEX = "compstore_menu_latest";

function headers(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (ES_USERNAME) {
    h["Authorization"] =
      "Basic " + Buffer.from(`${ES_USERNAME}:${ES_PASSWORD}`).toString("base64");
  }
  return h;
}

export async function esPost<T = unknown>(path: string, body: object): Promise<T> {
  const url = `${ES_BASE_URL}/${INDEX}/${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ES ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ---- Query builders --------------------------------------------------------

export const FIELDS = [
  "restaurant_name",
  "restaurant_source",
  "airport",
  "city",
  "state_or_province",
  "address",
  "menu_item_name",
  "description",
  "menu_section",
  "price",
  "datetime_timestamp",
] as const;

export type DocFields = Record<(typeof FIELDS)[number], unknown>;

export interface SearchResult {
  total: number;
  page: number;
  pageSize: number;
  rows: DocFields[];
}

export async function fetchSources(month: string, airports: string[] = []): Promise<string[]> {
  /*
  const filter: object[] = [{ term: { month } }];
  if (airports.length > 0) filter.push({ terms: { "airport.keyword": airports } });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await esPost("_search", {
    size: 0,
    query: { bool: { filter } },
    aggs: { sources: { terms: { field: "restaurant_source.keyword", size: 50 } } },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.aggregations?.sources?.buckets ?? []).map((b: any) => b.key as string).sort();
  */
  return ["chownow", "clover", "menufy", "opentable", "toasttab", "tripadvisor", "ubereats"]
  }

export async function fetchAirports(sources: string[] = []): Promise<string[]> {
  const filter: object[] = [{ term: { month: "2026-01" } }];
  if (sources.length > 0) filter.push({ terms: { "restaurant_source.keyword": sources } });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await esPost("_search", {
    size: 0,
    query: { bool: { filter } },
    aggs: { airports: { terms: { field: "airport.keyword", size: 200 } } },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.aggregations?.airports?.buckets ?? []).map((b: any) => b.key as string).sort();
  }

export async function fetchDocuments(
  sources: string[],
  airports: string[],
  page: number,
  pageSize: number
): Promise<SearchResult> {
  sources = sources.filter(item => item !== "yelp");
  sources.sort()
  const from = (page - 1) * pageSize;
  const query = {
    bool: {
      filter: [
        { term: { month: "2026-01" } },
        ...(sources.length > 0
          ? [{ terms: { "restaurant_source.keyword": sources } }]
          : []),
        ...(airports.length > 0
          ? [{ terms: { "airport.keyword": airports } }]
          : []),
      ],
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await esPost("_search", {
    size: pageSize,
    from,
    sort: [
      { "restaurant_name.keyword": "asc" },
      { "menu_item_name.keyword": "asc" },
    ],
    _source: [...FIELDS],
    query,
  });

  const total: number =
    typeof data.hits.total === "number" ? data.hits.total : data.hits.total.value;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: DocFields[] = (data.hits.hits ?? []).map((h: any) => h._source);

  return { total, page, pageSize, rows };
}
