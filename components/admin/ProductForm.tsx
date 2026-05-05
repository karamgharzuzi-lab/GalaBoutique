"use client";

import { useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { getStorageInstance } from "@/lib/firebase";
import { createProduct, updateProduct } from "@/lib/products";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { Product, ProductVariant } from "@/lib/types";
import { SIZES, CATEGORIES } from "@/lib/types";

interface ColorDef { name: string; hex: string }

interface ProductFormProps {
  initial?: Product;
}

const DEFAULT_COLORS: ColorDef[] = [
  { name: "Black",  hex: "#1A1A1A" },
  { name: "White",  hex: "#F5F5F5" },
  { name: "Brown",  hex: "#5C2E00" },
  { name: "Beige",  hex: "#D4B896" },
  { name: "Navy",   hex: "#1B2A4A" },
];

type VariantKey = `${string}__${string}`;

/* ─────────────────────────────────────── */

function Section({
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="bg-white border border-brand-cream-dark rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between gap-3 hover:bg-brand-cream/30 transition-colors text-start"
      >
        <div>
          <p className="eyebrow mb-0.5">חלק</p>
          <h2 className="h-display text-lg text-brand-brown leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-brand-brown/50 mt-0.5">{subtitle}</p>}
        </div>
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
          className={cn("text-brand-brown/50 transition-transform flex-shrink-0", open && "rotate-180")}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-brand-cream-dark p-5">
          {children}
        </div>
      )}
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold tracking-wide uppercase text-brand-brown/70 mb-1.5">
      {children}
    </label>
  );
}

const inputBase = "w-full border border-brand-cream-dark rounded-md px-3 py-2.5 text-sm text-brand-brown bg-brand-cream focus:outline-none focus:ring-1 focus:ring-brand-gold focus:border-brand-gold";

/* ─────────────────────────────────────── */

export default function ProductForm({ initial }: ProductFormProps) {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  // Section open state
  const [openSection, setOpenSection] = useState<"basics" | "media" | "variants">("basics");

  // Basic fields
  const [nameEn, setNameEn] = useState(initial?.name.en ?? "");
  const [nameHe, setNameHe] = useState(initial?.name.he ?? "");
  const [descEn, setDescEn] = useState(initial?.description.en ?? "");
  const [descHe, setDescHe] = useState(initial?.description.he ?? "");
  const [category, setCategory] = useState<Product["category"]>(initial?.category ?? "dresses");
  const [isBestSeller, setIsBestSeller] = useState(initial?.isBestSeller ?? false);
  const [isSpecialOffer, setIsSpecialOffer] = useState(initial?.isSpecialOffer ?? false);

  // Images
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Colors
  const [colors, setColors] = useState<ColorDef[]>(() => {
    if (initial?.variants.length) {
      const uniq = Array.from(
        new Map(initial.variants.map((v) => [v.color, v.colorHex])).entries()
      ).map(([name, hex]) => ({ name, hex }));
      return uniq.length ? uniq : DEFAULT_COLORS.slice(0, 1);
    }
    return DEFAULT_COLORS.slice(0, 1);
  });
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#C9A84C");

  // Variants: keyed by "size__color"
  const [variants, setVariants] = useState<Map<VariantKey, { qty: string; price: string; salePrice: string }>>(() => {
    const m = new Map<VariantKey, { qty: string; price: string; salePrice: string }>();
    if (initial) {
      initial.variants.forEach((v) => {
        m.set(`${v.size}__${v.color}`, {
          qty: String(v.quantity),
          price: String(v.price),
          salePrice: v.salePrice ? String(v.salePrice) : "",
        });
      });
    }
    return m;
  });

  const [saving, setSaving] = useState(false);

  function getVariant(size: string, color: string) {
    return variants.get(`${size}__${color}` as VariantKey) ?? { qty: "", price: "", salePrice: "" };
  }

  function setVariantField(size: string, color: string, field: "qty" | "price" | "salePrice", value: string) {
    const key: VariantKey = `${size}__${color}`;
    setVariants((m) => {
      const next = new Map(m);
      const existing = next.get(key) ?? { qty: "", price: "", salePrice: "" };
      next.set(key, { ...existing, [field]: value });
      return next;
    });
  }

  async function compressImage(file: File): Promise<Blob> {
    return new Promise((resolve) => {
      const img = document.createElement("img");
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const MAX_DIM = 1400;
        const ratio = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.82);
      };
      img.src = objectUrl;
    });
  }

  async function handleImageUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const storage = await getStorageInstance();
      const urls = await Promise.all(
        Array.from(files).map(async (file) => {
          const blob = await compressImage(file);
          const path = `products/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
          const r = storageRef(storage, path);
          return new Promise<string>((resolve, reject) => {
            const task = uploadBytesResumable(r, blob, { contentType: "image/jpeg" });
            task.on("state_changed", null, reject, async () => {
              resolve(await getDownloadURL(task.snapshot.ref));
            });
          });
        })
      );
      setImages((prev) => [...prev, ...urls]);
    } catch {
      toast("העלאה נכשלה", "error");
    }
    setUploading(false);
  }

  async function removeImage(url: string) {
    try {
      const r = storageRef(await getStorageInstance(), url);
      await deleteObject(r);
    } catch {}
    setImages((prev) => prev.filter((u) => u !== url));
  }

  function moveImageLeft(idx: number) {
    if (idx === 0) return;
    setImages((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }

  function addColor() {
    const name = newColorName.trim() || newColorHex.toUpperCase();
    if (colors.find((c) => c.name.toLowerCase() === name.toLowerCase())) return;
    setColors((prev) => [...prev, { name, hex: newColorHex }]);
    setNewColorName("");
    setNewColorHex("#C9A84C");
  }

  function removeColor(name: string) {
    setColors((prev) => prev.filter((c) => c.name !== name));
    setVariants((m) => {
      const next = new Map(m);
      SIZES.forEach((s) => next.delete(`${s}__${name}` as VariantKey));
      return next;
    });
  }

  async function handleSave() {
    if (!nameEn.trim()) {
      toast("שם באנגלית הוא שדה חובה", "error");
      setOpenSection("basics");
      return;
    }
    setSaving(true);

    const builtVariants: ProductVariant[] = [];
    SIZES.forEach((size) => {
      colors.forEach((color) => {
        const v = getVariant(size, color.name);
        const price = parseFloat(v.price);
        if (!v.price || isNaN(price)) return;
        builtVariants.push({
          size,
          color: color.name,
          colorHex: color.hex,
          quantity: parseInt(v.qty) || 0,
          price,
          ...(v.salePrice ? { salePrice: parseFloat(v.salePrice) } : {}),
        });
      });
    });

    const data = {
      name: { en: nameEn, he: nameHe },
      description: { en: descEn, he: descHe },
      category,
      images,
      variants: builtVariants,
      isBestSeller,
      isSpecialOffer,
    };

    try {
      if (initial) {
        await updateProduct(initial.id, data);
        toast("המוצר נשמר");
      } else {
        await createProduct(data);
        toast("המוצר נוצר");
        router.push(`/${locale}/admin/products`);
      }
    } catch {
      toast("שמירת המוצר נכשלה", "error");
    }
    setSaving(false);
  }

  const variantCount = Array.from(variants.values()).filter((v) => v.price && parseFloat(v.price) > 0).length;

  return (
    <div className="space-y-3">
      {/* Section 1: Basics */}
      <Section
        title="פרטי מוצר"
        subtitle={`${nameEn || "ללא שם"} · ${category}`}
        open={openSection === "basics"}
        onToggle={() => setOpenSection(openSection === "basics" ? "media" : "basics")}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <FieldLabel>שם (אנגלית)</FieldLabel>
            <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className={inputBase} />
          </div>
          <div>
            <FieldLabel>שם (עברית)</FieldLabel>
            <input value={nameHe} onChange={(e) => setNameHe(e.target.value)} dir="rtl" className={inputBase} />
          </div>
          <div>
            <FieldLabel>תיאור (אנגלית)</FieldLabel>
            <textarea value={descEn} onChange={(e) => setDescEn(e.target.value)} rows={3} className={cn(inputBase, "resize-none")} />
          </div>
          <div>
            <FieldLabel>תיאור (עברית)</FieldLabel>
            <textarea value={descHe} onChange={(e) => setDescHe(e.target.value)} rows={3} dir="rtl" className={cn(inputBase, "resize-none")} />
          </div>
        </div>

        <div className="hairline mb-4" />

        <div className="flex flex-wrap items-center gap-5">
          <div>
            <FieldLabel>קטגוריה</FieldLabel>
            <select value={category} onChange={(e) => setCategory(e.target.value as Product["category"])}
              className="border border-brand-cream-dark rounded-md px-3 py-2.5 text-sm bg-brand-cream text-brand-brown"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer mt-5">
            <input type="checkbox" checked={isBestSeller} onChange={(e) => setIsBestSeller(e.target.checked)} className="rounded accent-brand-gold" />
            <span className="text-sm text-brand-brown">נמכר ביותר</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer mt-5">
            <input type="checkbox" checked={isSpecialOffer} onChange={(e) => setIsSpecialOffer(e.target.checked)} className="rounded accent-brand-gold" />
            <span className="text-sm text-brand-brown">מבצע מיוחד</span>
          </label>
        </div>
      </Section>

      {/* Section 2: Media */}
      <Section
        title="תמונות"
        subtitle={`${images.length} תמונ${images.length === 1 ? "ה" : "ות"}`}
        open={openSection === "media"}
        onToggle={() => setOpenSection(openSection === "media" ? "variants" : "media")}
      >
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); handleImageUpload(e.dataTransfer.files); }}
          onDragOver={(e) => e.preventDefault()}
          className="border border-dashed border-brand-cream-dark rounded-md p-8 text-center cursor-pointer hover:border-brand-gold/50 hover:bg-brand-cream/30 transition-colors"
        >
          <p className="text-sm text-brand-brown/70">גרור תמונות לכאן, או לחץ לבחירה</p>
          <p className="text-xs text-brand-brown/40 mt-1">התמונה הראשונה היא הראשית</p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => handleImageUpload(e.target.files)}
        />
        {uploading && <p className="text-xs text-brand-brown/60 animate-pulse mt-2">מעלה...</p>}
        {images.length > 0 && (
          <div className="flex gap-3 flex-wrap mt-4">
            {images.map((url, i) => (
              <div key={url} className="relative group">
                <Image src={url} alt="" width={88} height={88}
                  className={cn("rounded-md object-cover w-22 h-22", i === 0 && "ring-2 ring-brand-gold")}
                />
                {i > 0 && (
                  <button onClick={() => moveImageLeft(i)}
                    className="absolute top-0 left-0 bg-brand-gold text-brand-brown w-5 h-5 rounded-br-md text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="הזז שמאלה"
                  >←</button>
                )}
                <button onClick={() => removeImage(url)}
                  className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 rounded-bl-md text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="הסר"
                >×</button>
                {i === 0 && <span className="absolute bottom-0 left-0 right-0 text-[8px] text-center bg-brand-gold/95 text-brand-brown rounded-b-md py-0.5 font-bold tracking-luxe uppercase">ראשית</span>}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Section 3: Variants */}
      <Section
        title="וריאנטים ומחירים"
        subtitle={`${colors.length} צבע${colors.length === 1 ? "" : "ים"} · ${variantCount} וריאנט${variantCount === 1 ? "" : "ים"} עם מחיר`}
        open={openSection === "variants"}
        onToggle={() => setOpenSection(openSection === "variants" ? "basics" : "variants")}
      >
        {/* Colors row */}
        <div className="mb-4">
          <FieldLabel>צבעים</FieldLabel>
          <div className="flex flex-wrap gap-2 mb-3">
            {colors.map((c) => (
              <div key={c.name} className="flex items-center gap-1.5 bg-brand-cream rounded-md px-3 py-1.5 border border-brand-cream-dark">
                <span className="w-3.5 h-3.5 rounded-full ring-1 ring-brand-brown/15" style={{ backgroundColor: c.hex }} />
                <span className="text-sm text-brand-brown">{c.name}</span>
                <button onClick={() => removeColor(c.name)} className="text-brand-brown/40 hover:text-red-500 text-base ms-1 leading-none" aria-label="Remove color">×</button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text" placeholder="שם הצבע (אופציונלי)" value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addColor())}
              className="border border-brand-cream-dark rounded-md px-3 py-2 text-sm text-brand-brown bg-brand-cream w-44 focus:outline-none focus:ring-1 focus:ring-brand-gold focus:border-brand-gold"
            />
            <input type="color" value={newColorHex} onChange={(e) => setNewColorHex(e.target.value)}
              className="w-10 h-10 border border-brand-cream-dark rounded-md cursor-pointer"
              aria-label="Pick color"
            />
            <Button variant="outline" size="sm" onClick={addColor}>הוסף צבע</Button>
          </div>
        </div>

        <div className="hairline mb-4" />

        {/* Variants table */}
        <FieldLabel>וריאנטים — מידה × צבע</FieldLabel>
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-brand-cream-dark">
                <th className="text-start py-2 pr-3 eyebrow w-14">מידה</th>
                {colors.map((c) => (
                  <th key={c.name} className="text-center py-2 px-2 eyebrow min-w-[140px]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full ring-1 ring-brand-brown/15" style={{ backgroundColor: c.hex }} />
                      <span className="normal-case tracking-normal">{c.name}</span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SIZES.map((size) => (
                <tr key={size} className="border-b border-brand-cream last:border-0">
                  <td className="py-2 pr-3 font-bold text-brand-brown text-sm">{size}</td>
                  {colors.map((color) => {
                    const v = getVariant(size, color.name);
                    const qtyNum = parseInt(v.qty) || 0;
                    return (
                      <td key={color.name} className={cn(
                        "py-2 px-2",
                        qtyNum === 0 && v.price ? "bg-red-50/50" : ""
                      )}>
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-1">
                            <input
                              type="number" min="0" placeholder="Qty"
                              value={v.qty}
                              onChange={(e) => setVariantField(size, color.name, "qty", e.target.value)}
                              className="w-14 border border-brand-cream-dark rounded-md px-1.5 py-1 text-xs text-brand-brown bg-brand-cream focus:outline-none focus:ring-1 focus:ring-brand-gold"
                            />
                            <input
                              type="number" min="0" placeholder="₪"
                              value={v.price}
                              onChange={(e) => setVariantField(size, color.name, "price", e.target.value)}
                              className="w-16 border border-brand-cream-dark rounded-md px-1.5 py-1 text-xs text-brand-brown bg-brand-cream focus:outline-none focus:ring-1 focus:ring-brand-gold"
                            />
                          </div>
                          <input
                            type="number" min="0" placeholder="₪ Sale (opt)"
                            value={v.salePrice}
                            onChange={(e) => setVariantField(size, color.name, "salePrice", e.target.value)}
                            className="w-full border border-brand-cream-dark rounded-md px-1.5 py-1 text-xs text-brand-gold bg-brand-cream focus:outline-none focus:ring-1 focus:ring-brand-gold"
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Save bar — sticky */}
      <div className="sticky bottom-16 md:bottom-0 z-20 bg-brand-cream/95 backdrop-blur-md py-4 -mx-5 px-5 border-t border-brand-cream-dark flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push(`/${locale}/admin/products`)}>
          ביטול
        </Button>
        <Button loading={saving} onClick={handleSave}>
          {saving ? "שומר..." : initial ? "שמור שינויים" : "צור מוצר"}
        </Button>
      </div>
    </div>
  );
}
