import { useState } from "react";
import type { BizProviderBody } from "@/api-client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCities } from "@/hooks/use-biz-me";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** The provider profile form, for applying and for later edits. */
export function ProviderForm({
  initial,
  submitLabel,
  busy,
  onSubmit,
}: {
  initial?: Partial<BizProviderBody>;
  submitLabel: string;
  busy: boolean;
  onSubmit: (body: BizProviderBody) => void;
}) {
  const { lang, tr } = useLanguage();
  const cities = useCities();
  const [displayName, setDisplayName] = useState(initial?.displayName ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [city, setCity] = useState(initial?.city ?? "riyadh");
  const [served, setServed] = useState<string[]>(initial?.cities ?? []);
  const [docNumber, setDocNumber] = useState(initial?.freelanceDocNumber ?? "");
  const [docExpiry, setDocExpiry] = useState(initial?.freelanceDocExpiry ?? "");

  const toggle = (id: string) => setServed((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          displayName,
          bio: bio || null,
          phone,
          city,
          cities: served.filter((c) => c !== city),
          freelanceDocNumber: docNumber,
          freelanceDocExpiry: docExpiry,
        });
      }}
    >
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{tr("الاسم الذي يظهر للمشترين", "Name shown to buyers")}</Label>
          <Input required minLength={2} maxLength={80} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={tr("مثال: مطبخ أم محمد", "e.g. Umm Mohammed's Kitchen")} />
        </div>
        <div className="space-y-1.5">
          <Label>{tr("رقم الجوال", "Mobile number")}</Label>
          <Input required dir="ltr" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xxxxxxxx" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>{tr("نبذة عنك وعن خدماتك", "About you and your services")}</Label>
        <Textarea rows={3} maxLength={1000} value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label>{tr("مدينتك", "Your city")}</Label>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {cities?.map((c) => <SelectItem key={c.id} value={c.id}>{lang === "ar" ? c.nameAr : c.nameEn}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{tr("مدن أخرى تخدمينها أو توصّلين إليها (اختياري)", "Other cities you serve or deliver to (optional)")}</Label>
        <div className="flex flex-wrap gap-2">
          {cities?.filter((c) => c.id !== city).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className={cn("rounded-full border px-3 py-1.5 text-xs font-bold", served.includes(c.id) ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground")}
            >
              {lang === "ar" ? c.nameAr : c.nameEn}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-[hsl(var(--gold)/0.4)] bg-[hsl(var(--gold-muted))] p-4 space-y-3">
        <p className="font-bold text-sm">{tr("وثيقة العمل الحر", "Freelance document")}</p>
        <p className="text-xs text-muted-foreground">
          {tr("مطلوبة لكل مقدّمي الخدمات. تراجعها الإدارة قبل ظهور عروضك.", "Required for every provider. The admin reviews it before your offers go live.")}
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>{tr("رقم الوثيقة", "Document number")}</Label>
            <Input required dir="ltr" minLength={4} maxLength={40} value={docNumber} onChange={(e) => setDocNumber(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{tr("تاريخ الانتهاء", "Expiry date")}</Label>
            <Input required type="date" dir="ltr" value={docExpiry} onChange={(e) => setDocExpiry(e.target.value)} />
          </div>
        </div>
      </div>

      <Button type="submit" size="lg" className="rounded-xl font-bold" disabled={busy}>{submitLabel}</Button>
    </form>
  );
}
