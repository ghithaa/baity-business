import { useEffect, useState } from "react";
import {
  useCreateBizListing,
  useUpdateBizListing,
  type BizListing,
  type BizListingBody,
  type BizListingBodyKind,
  type BizListingBodyPriceUnit,
} from "@/api-client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategories } from "@/hooks/use-biz-me";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { invalidateApi } from "@/lib/query-client";
import { errorText, toHalalas } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Add or edit one listing. `listing` = null adds a new one. */
export function ListingDialog({ open, listing, onClose }: { open: boolean; listing: BizListing | null; onClose: () => void }) {
  const { lang, tr } = useLanguage();
  const { toast } = useToast();
  const categories = useCategories();
  const create = useCreateBizListing();
  const update = useUpdateBizListing();

  const [kind, setKind] = useState<BizListingBodyKind>("product");
  const [categoryId, setCategoryId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState<BizListingBodyPriceUnit>("item");
  const [duration, setDuration] = useState("120");
  const [stock, setStock] = useState("");
  const [prepHours, setPrepHours] = useState("0");
  const [pickup, setPickup] = useState(true);
  const [delivery, setDelivery] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState("0");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    const l = listing;
    setKind(l?.kind ?? "product");
    setCategoryId(l ? String(l.categoryId) : "");
    setTitle(l?.title ?? "");
    setDescription(l?.description ?? "");
    setPrice(l ? String(l.priceHalalas / 100) : "");
    setUnit(l?.priceUnit ?? "item");
    setDuration(String(l?.durationMinutes ?? 120));
    setStock(l?.stock != null ? String(l.stock) : "");
    setPrepHours(String(l?.prepHours ?? 0));
    setPickup(l?.allowsPickup ?? true);
    setDelivery(l?.allowsDelivery ?? false);
    setDeliveryFee(String((l?.deliveryFeeHalalas ?? 0) / 100));
    setActive(l?.isActive ?? true);
  }, [open, listing]);

  // A product is priced per item; a service per visit or per hour.
  useEffect(() => {
    if (kind === "product") setUnit("item");
    else if (unit === "item") setUnit("visit");
  }, [kind]); // eslint-disable-line react-hooks/exhaustive-deps

  const usable = categories?.filter((c) => c.kind === "both" || c.kind === kind) ?? [];

  const submit = () => {
    const body: BizListingBody = {
      kind,
      categoryId: Number(categoryId),
      title: title.trim(),
      description: description.trim(),
      priceHalalas: toHalalas(price),
      priceUnit: unit,
      durationMinutes: kind === "service" ? Number(duration) : null,
      stock: kind === "product" && stock !== "" ? Number(stock) : null,
      prepHours: Number(prepHours) || 0,
      allowsPickup: kind === "product" && pickup,
      allowsDelivery: kind === "product" && delivery,
      deliveryFeeHalalas: kind === "product" && delivery ? toHalalas(deliveryFee || "0") : 0,
      isActive: active,
    };
    const done = {
      onSuccess: () => {
        invalidateApi("/api/biz/provider/listings", "/api/biz/listings", "/api/biz/providers");
        toast({ title: listing ? tr("تم حفظ العرض", "Offer saved") : tr("تمت إضافة العرض", "Offer added") });
        onClose();
      },
      onError: (err: unknown) => toast({ variant: "destructive", title: errorText(err, lang) }),
    };
    if (listing) update.mutate({ id: listing.id, data: body }, done);
    else create.mutate({ data: body }, done);
  };

  const busy = create.isPending || update.isPending;
  const valid = !!categoryId && title.trim().length >= 2 && Number(price) >= 1 && (kind === "service" || pickup || delivery);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{listing ? tr("تعديل العرض", "Edit offer") : tr("عرض جديد", "New offer")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(["product", "service"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={cn("rounded-lg border p-3 text-start", kind === k ? "border-primary bg-primary/5" : "border-border")}
              >
                <p className="font-bold text-sm">{k === "product" ? tr("منتج", "Product") : tr("خدمة في المنزل", "Home service")}</p>
                <p className="text-[11px] text-muted-foreground">{k === "product" ? tr("أكل، حلويات، أعمال يدوية", "Food, sweets, crafts") : tr("بموعد محجوز في بيت المشتري", "Booked visit at the buyer's home")}</p>
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label>{tr("التصنيف", "Category")}</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder={tr("اختاري التصنيف", "Choose a category")} /></SelectTrigger>
              <SelectContent>
                {usable.map((c) => <SelectItem key={c.id} value={String(c.id)}>{lang === "ar" ? c.nameAr : c.nameEn}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">{tr("لم تجدي تصنيفك؟ اطلبي إضافته من تبويب «ملفي».", "Category missing? Request it from the “Profile” tab.")}</p>
          </div>

          <div className="space-y-1.5">
            <Label>{tr("العنوان", "Title")}</Label>
            <Input maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{tr("الوصف", "Description")}</Label>
            <Textarea rows={3} maxLength={3000} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{tr("السعر (ر.س)", "Price (SAR)")}</Label>
              <Input type="number" min={1} step="0.5" dir="ltr" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            {kind === "service" ? (
              <div className="space-y-1.5">
                <Label>{tr("التسعير", "Priced")}</Label>
                <Select value={unit} onValueChange={(v) => setUnit(v as BizListingBodyPriceUnit)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visit">{tr("للزيارة", "Per visit")}</SelectItem>
                    <SelectItem value="hour">{tr("بالساعة", "Per hour")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>{tr("الكمية المتوفرة", "In stock")}</Label>
                <Input type="number" min={0} dir="ltr" value={stock} onChange={(e) => setStock(e.target.value)} placeholder={tr("حسب الطلب", "Made to order")} />
              </div>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground -mt-2">{tr("يرى المشتري السعر مع رسوم الخدمة 5%، ويُخصم 5% من البائع عند الاكتمال.", "Buyers see the price plus a 5% service fee; 5% is taken from you on completion.")}</p>

          {kind === "service" ? (
            <div className="space-y-1.5">
              <Label>{unit === "hour" ? tr("دقائق كل ساعة محجوزة", "Minutes per booked hour") : tr("مدة الزيارة (دقيقة)", "Visit length (minutes)")}</Label>
              <Input type="number" min={15} step={15} dir="ltr" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>{tr("مدة التجهيز (ساعات)", "Preparation time (hours)")}</Label>
                <Input type="number" min={0} dir="ltr" value={prepHours} onChange={(e) => setPrepHours(e.target.value)} />
              </div>
              <div className="rounded-lg bg-muted/60 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label>{tr("استلام من عندي", "Pickup from me")}</Label>
                  <Switch checked={pickup} onCheckedChange={setPickup} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{tr("أوصّل بنفسي", "I deliver")}</Label>
                  <Switch checked={delivery} onCheckedChange={setDelivery} />
                </div>
                {delivery && (
                  <div className="space-y-1.5">
                    <Label>{tr("رسوم التوصيل (ر.س)", "Delivery fee (SAR)")}</Label>
                    <Input type="number" min={0} dir="ltr" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} />
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <Label>{tr("العرض ظاهر للمشترين", "Visible to buyers")}</Label>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{tr("إلغاء", "Cancel")}</Button>
          <Button disabled={!valid || busy} onClick={submit}>{tr("حفظ", "Save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
