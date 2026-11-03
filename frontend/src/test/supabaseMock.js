import { vi } from "vitest";

// Builds a fake Supabase client whose query chain resolves to `result`.
// Every chain method (select, insert, update, delete, eq, order) returns the
// same thenable, so any combination like from().update().eq() can be awaited.
export function createSupabaseMock(result = { data: [], error: null }) {
  const query = {
    result,
    then: (resolve, reject) => Promise.resolve(query.result).then(resolve, reject),
  };
  for (const method of ["select", "insert", "update", "delete", "eq", "order"]) {
    query[method] = vi.fn(() => query);
  }
  const client = { from: vi.fn(() => query) };
  return { client, query };
}
