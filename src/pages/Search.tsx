import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { SearchX } from "lucide-react";
import {
  useSearchBizListings,
  type SearchBizListingsParams,
  type SearchBizListingsKind,
  type SearchBizListingsSort,
} from "@/api-client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategories, useCities } from "@/hooks/use-biz-me";
import { ListingCard } from "@/components/ListingCard";
import { EmptyState, Loading, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toHalalas } from "@/lib/format";

const ALL = "all";

/** Filters live in the URL, so a search can be shared and survives a reload. */
function readParams(search: string): SearchBizListingsParams {
  const p = new URLSearchParams(search);
  const num = (k: string) => (p.get(k) ? Number(p.get(k)) : undefined);
  return {
    q: p.get("q") || undefined,
    categoryId: num("categoryId"),
    city: p.get("city") || undefined,
    kind: (p.get("kind") as SearchBizListingsKind) || undefined,
    delivery: p.get("delivery") === "true" ? "true" : undefined,
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    sort: (p.get("sort") as SearchBizListingsSort) || undefined,
    page: num("page"),
  };
}

function writeParams(params: SearchBizListingsParams): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `/search?${s}` : "/search";
}

export default function SearchPage() {
  const { lang, tr } = useLanguage();
  const search = useSearch();
  const [, navigate] = useLocation();
  const params = useMemo(() => readParams(search), [search]);
  const categories = useCategories();
  const cities = useCities();
  const [q, setQ] = useState(params.q ?? "");
  useEffect(() => setQ(params.q ?? ""), [params.q]);

  const results = useSearchBizListings(params);
  const set = (patch: Partial<SearchBizListingsParams>) => navigate(writeParams({ ...params, ...patch, page: undefined }));
  const page = params.page ?? 1;

  return (
    <div>
      <PageHeader title={tr("تصفّح الخدمات", "Browse")} subtitle={tr("ابحثي وفلتري حسب مدينتك واحتياجك", "Search and filter by your city and need")} />

      <div className="rounded-xl bg-card border border-card-border shadow-card p-4 md:p-5 mb-6 space-y-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            set({ q: q.trim() || undefined });
          }}
        >
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("ابحثي بالاسم أو الوصف…", "Search by name or description…")} />
          <Button type="submit">{tr("بحث", "Search")}</Button>
        </form>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Select value={params.categoryId ? String(params.categoryId) : ALL} onValueChange={(v) => set({ categoryId: v === ALL ? undefined : Number(v) })}>
            <SelectTrigger><SelectValue placeholder={tr("التصنيف", "Category")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{tr("كل التصنيفات", "All categories")}</SelectItem>
              {categories?.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{lang === "ar" ? c.nameAr : c.nameEn}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={params.city ?? ALL} onValueChange={(v) => set({ city: v === ALL ? undefined : v })}>
            <SelectTrigger><SelectValue placeholder={tr("المدينة", "City")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{tr("كل المدن", "All cities")}</SelectItem>
              {cities?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{lang === "ar" ? c.nameAr : c.nameEn}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={params.kind ?? ALL} onValueChange={(v) => set({ kind: v === ALL ? undefined : (v as SearchBizListingsKind) })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{tr("منتجات وخدمات", "Products & services")}</SelectItem>
              <SelectItem value="product">{tr("منتجات", "Products")}</SelectItem>
              <SelectItem value="service">{tr("خدمات في المنزل", "Home services")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={params.sort ?? "newest"} onValueChange={(v) => set({ sort: v as SearchBizListingsSort })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{tr("الأحدث", "Newest")}</SelectItem>
              <SelectItem value="rating">{tr("الأعلى تقييمًا", "Top rated")}</SelectItem>
              <SelectItem value="price_asc">{tr("السعر: من الأقل", "Price: low to high")}</SelectItem>
              <SelectItem value="price_desc">{tr("السعر: من الأعلى", "Price: high to low")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2">
            <Switch id="delivery" checked={params.delivery === "true"} onCheckedChange={(v) => set({ delivery: v ? "true" : undefined })} />
            <Label htmlFor="delivery" className="text-sm">{tr("يصل إلى منزلي (توصيل أو زيارة)", "Comes to me (delivery or visit)")}</Label>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{tr("السعر (ر.س)", "Price (SAR)")}</span>
            <Input
              type="number"
              min={0}
              className="w-24"
              placeholder={tr("من", "Min")}
              defaultValue={params.minPrice !== undefined ? params.minPrice / 100 : ""}
              onBlur={(e) => set({ minPrice: e.target.value ? toHalalas(e.target.value) : undefined })}
            />
            <Input
              type="number"
              min={0}
              className="w-24"
              placeholder={tr("إلى", "Max")}
              defaultValue={params.maxPrice !== undefined ? params.maxPrice / 100 : ""}
              onBlur={(e) => set({ maxPrice: e.target.value ? toHalalas(e.target.value) : undefined })}
            />
          </div>
        </div>
      </div>

      {results.isLoading ? (
        <Loading />
      ) : results.data?.items.length ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.data.items.map((item) => (
              <ListingCard key={item.id} item={item} />
            ))}
          </div>
          <div className="flex justify-center gap-2 mt-8">
            {page > 1 && (
              <Button variant="outline" onClick={() => navigate(writeParams({ ...params, page: page - 1 }))}>
                {tr("السابق", "Previous")}
              </Button>
            )}
            {results.data.hasMore && (
              <Button variant="outline" onClick={() => navigate(writeParams({ ...params, page: page + 1 }))}>
                {tr("التالي", "Next")}
              </Button>
            )}
          </div>
        </>
      ) : (
        <EmptyState
          icon={SearchX}
          title={tr("لا توجد نتائج", "No results")}
          hint={tr("جرّبي كلمات أخرى أو أزيلي بعض الفلاتر.", "Try other words or remove some filters.")}
          action={<Button variant="outline" onClick={() => navigate("/search")}>{tr("مسح الفلاتر", "Clear filters")}</Button>}
        />
      )}
    </div>
  );
}
