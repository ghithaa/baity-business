import { useGetBizMe, useListBizCities, useListBizCategories } from "@/api-client";
import { useAuth } from "@/contexts/AuthContext";

/** The signed-in user's marketplace roles. Nothing while signed out. */
export function useBizMe() {
  const { user } = useAuth();
  const q = useGetBizMe({ query: { enabled: !!user, staleTime: 15_000 } });
  return {
    me: user ? q.data : undefined,
    provider: user ? q.data?.provider ?? null : null,
    isAdmin: !!(user && q.data?.isAdmin),
    isLoading: !!user && q.isLoading,
  };
}

/** Reference lists that rarely change. */
export function useCities() {
  return useListBizCities({ query: { staleTime: Infinity } }).data;
}
export function useCategories() {
  return useListBizCategories({ query: { staleTime: 5 * 60_000 } }).data;
}
