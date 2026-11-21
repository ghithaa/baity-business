import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true },
  },
});

/**
 * Invalidate every cached query whose path starts with one of these prefixes.
 * Generated query keys are the request path, so `/api/biz/orders/5` and
 * `/api/biz/orders` are different first elements; a plain queryKey match
 * would miss the sibling.
 */
export function invalidateApi(...prefixes: string[]): Promise<void> {
  return queryClient.invalidateQueries({
    predicate: (query) => {
      const first = query.queryKey[0];
      return typeof first === "string" && prefixes.some((p) => first.startsWith(p));
    },
  });
}
