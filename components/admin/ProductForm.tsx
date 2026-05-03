"use client";

import { useRef, useState } from "react";
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

export default function ProductForm({ initial }: ProductFormProps) {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

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
      toast("Upload failed", "error");
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
    if (!nameEn.trim()) { toast("English name is required", "error"); return; }
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
        toast("Product saved!");
      } else {
        await createProduct(data);
        toast("Product created!");
        router.push(`/${locale}/admin/products`);
      }
    } catch {
      toast("Failed to save product", "error");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {/* Names */}
      <div className="bg-white rounded-2xl p-5 shadow-card space-y-4">
        <h2 className="text-sm font-bold text-brand-brown">Product Name</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-brand-brown/70 mb-1">English</label>
            <input value={nameEn} onChange={(e) => setNameEn(e.target.value)}
              className="w-full border border-brand-cream-dark rounded-xl px-3 py-2 text-sm text-brand-brown bg-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-brown/70 mb-1">Hebrew</label>
            <input value={nameHe} onChange={(e) => setNameHe(e.target.value)} dir="rtl"
              className="w-full border border-brand-cream-dark rounded-xl px-3 py-2 text-sm text-brand-brown bg-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-gold"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl p-5 shadow-card space-y-4">
        <h2 className="text-sm font-bold text-brand-brown">Description</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-brand-brown/70 mb-1">English</label>
            <textarea value={descEn} onChange={(e) => setDescEn(e.target.value)} rows={3}
              className="w-full border border-brand-cream-dark rounded-xl px-3 py-2 text-sm text-brand-brown bg-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-gold resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-brown/70 mb-1">Hebrew</label>
            <textarea value={descHe} onChange={(e) => setDescHe(e.target.value)} rows={3} dir="rtl"
              className="w-full border border-brand-cream-dark rounded-xl px-3 py-2 text-sm text-brand-brown bg-brand-cream focus:outline-none focus:ring-2 focus:ring-brand-gold resize-none"
            />
          </div>
        </div>
      </div>

      {/* Category + flags */}
      <div className="bg-white rounded-2xl p-5 shadow-card space-y-4">
        <h2 className="text-sm font-bold text-brand-brown">Category & Flags</h2>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs font-semibold text-brand-brown/70 mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as Product["category"])}
              className="border border-brand-cream-dark rounded-xl px-3 py-2 text-sm bg-brand-cream text-brand-brown"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isBestSeller} onChange={(e) => setIsBestSeller(e.target.checked)} className="rounded" />
            <span className="text-sm font-medium text-brand-brown">Best Seller</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isSpecialOffer} onChange={(e) => setIsSpecialOffer(e.target.checked)} className="rounded" />
            <span className="text-sm font-medium text-brand-brown">Special Offer</span>
          </label>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-2xl p-5 shadow-card space-y-3">
        <h2 className="text-sm font-bold text-brand-brown">Images</h2>
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); handleImageUpload(e.dataTransfer.files); }}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-brand-cream-dark rounded-xl p-6 text-center cursor-pointer hover:border-brand-brown/30 transition-colors"
        >
          <p className="text-sm text-brand-brown/60">Drag & drop images here, or click to select</p>
          <p className="text-xs text-brand-brown/40 mt-1">First image = primary photo</p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => handleImageUpload(e.target.files)}
        />
        {uploading && <p className="text-xs text-brand-brown/60 animate-pulse">Uploading...</p>}
        {images.length > 0 && (
          <div className="flex gap-3 flex-wrap">
            {images.map((url, i) => (
              <div key={url} className="relative group">
                <Image src={url} alt="" width={80} height={80}
                  className={cn("rounded-xl object-cover w-20 h-20", i === 0 && "ring-2 ring-brand-gold")}
                />
                {i > 0 && (
                  <button onClick={() => moveImageLeft(i)}
                    className="absolute top-0 left-0 bg-brand-gold text-brand-brown w-5 h-5 rounded-br-lg text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                  >←</button>
                )}
                <button onClick={() => removeImage(url)}
                  className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 rounded-bl-lg text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                >×</button>
                {i === 0 && <span className="absolute bottom-0 left-0 right-0 text-[8px] text-center bg-brand-gold/90 text-brand-brown rounded-b-xl py-0.5 font-bold">PRIMARY</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Colors */}
      <div className="bg-white rounded-2xl p-5 shadow-card space-y-3">
        <h2 className="text-sm font-bold text-brand-brown">Colors</h2>
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => (
            <div key={c.name} className="flex items-center gap-1.5 bg-brand-cream rounded-xl px-3 py-1.5">
              <span className="w-4 h-4 rounded-full border border-white ring-1 ring-gray-200" style={{ backgroundColor: c.hex }} />
              <span className="text-sm text-brand-brown">{c.name}</span>
              <button onClick={() => removeColor(c.name)} className="text-brand-brown/40 hover:text-red-500 text-sm ml-0.5">×</button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text" placeholder="Color name (optional)" value={newColorName}
            onChange={(e) => setNewColorName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addColor()}
            className="border border-brand-cream-dark rounded-xl px-3 py-2 text-sm text-brand-brown bg-brand-cream w-44 focus:outline-none focus:ring-2 focus:ring-brand-gold"
          />
          <input type="color" value={newColorHex} onChange={(e) => setNewColorHex(e.target.value)}
            className="w-10 h-9 border border-brand-cream-dark rounded-xl cursor-pointer"
          />
          <Button variant="outline" size="sm" onClick={addColor}>Add Color</Button>
        </div>
        <p className="text-[11px] text-brand-brown/40">Pick a color and click Add Color. Name is optional — leave blank to use the hex value.</p>
      </div>

      {/* Variants table */}
      <div className="bg-white rounded-2xl p-5 shadow-card">
        <h2 className="text-sm font-bold text-brand-brown mb-4">Variants (Size × Color)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-brand-cream-dark">
                <th className="text-start py-2 pr-3 font-semibold text-brand-brown/70 w-14">Size</th>
                {colors.map((c) => (
                  <th key={c.name} className="text-center py-2 px-2 font-semibold text-brand-brown/70 min-w-[120px]">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.hex }} />
                      {c.name}
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
                        qtyNum === 0 && v.price ? "bg-red-50" : ""
                      )}>
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-1">
                            <input
                              type="number" min="0" placeholder="Qty"
                              value={v.qty}
                              onChange={(e) => setVariantField(size, color.name, "qty", e.target.value)}
                              className="w-14 border border-brand-cream-dark rounded-lg px-1.5 py-1 text-xs text-brand-brown bg-brand-cream focus:outline-none focus:ring-1 focus:ring-brand-gold"
                            />
                            <input
                              type="number" min="0" placeholder="₪ Price"
                              value={v.price}
                              onChange={(e) => setVariantField(size, color.name, "price", e.target.value)}
                              className="w-16 border border-brand-cream-dark rounded-lg px-1.5 py-1 text-xs text-brand-brown bg-brand-cream focus:outline-none focus:ring-1 focus:ring-brand-gold"
                            />
                          </div>
                          <input
                            type="number" min="0" placeholder="₪ Sale (opt)"
                            value={v.salePrice}
                            onChange={(e) => setVariantField(size, color.name, "salePrice", e.target.value)}
                            className="w-full border border-brand-cream-dark rounded-lg px-1.5 py-1 text-xs text-brand-gold bg-brand-cream focus:outline-none focus:ring-1 focus:ring-brand-gold"
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
      </div>

      {/* Save */}
      <div className="flex justify-end gap-3 pb-8">
        <Button variant="outline" onClick={() => router.push(`/${locale}/admin/products`)}>
          Cancel
        </Button>
        <Button loading={saving} onClick={handleSave}>
          {saving ? "Saving..." : initial ? "Save Changes" : "Create Product"}
        </Button>
      </div>
    </div>
  );
}
