import { vi } from "vitest";

const CHAIN_METHODS = [
  "select",
  "insert",
  "update",
  "upsert",
  "delete",
  "eq",
  "gte",
  "order",
  "single",
  "maybeSingle",
];

// Builds a fake Supabase client whose query chain resolves to `result`.
// Every chain method returns the same thenable, so any combination like
// from().update().eq() can be awaited. Set `query.result` to change the
// response, or pass `resolver(table)` to answer per table.
export function createSupabaseMock(result = { data: [], error: null }, resolver) {
  const queries = {};

  const makeQuery = (table) => {
    const query = {
      table,
      result,
      then: (resolve, reject) =>
        Promise.resolve(resolver ? resolver(table, query) : query.result).then(
          resolve,
          reject
        ),
    };
    for (const method of CHAIN_METHODS) {
      query[method] = vi.fn(() => query);
    }
    return query;
  };

  const query = makeQuery(null);
  const client = {
    from: vi.fn((table) => {
      if (!resolver) return query;
      queries[table] ??= makeQuery(table);
      return queries[table];
    }),
  };
  return { client, query, queries };
}
