"use client";

import { MenuPhoto } from "@/components/menu-photo";
import { useState, useTransition } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import type { Category, MenuItem } from "@/lib/types";
import { priceFmt } from "@/lib/wa";
import { categoryName, itemName, tr } from "@/lib/i18n";
import { useLocale } from "@/components/locale-provider";
import { uploadRestaurantImage } from "@/lib/upload";
import {
  createCategoryAction,
  deleteCategoryAction,
  deleteItemAction,
  moveCategoryAction,
  moveItemAction,
  renameCategoryAction,
  saveItemAction,
  toggleCategoryAction,
  toggleItemFieldAction,
} from "./actions";

interface Props {
  restaurantId: string;
  categories: Category[];
  items: MenuItem[];
}

export function MenuManager({ restaurantId, categories, items }: Props) {
  const { locale } = useLocale();
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [editing, setEditing] = useState<{ item?: MenuItem; categoryId: string } | null>(null);
  const [, startTransition] = useTransition();

  function moveCat(id: string, dir: -1 | 1) {
    const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
    const idx = sorted.findIndex((x) => x.id === id);
    const swapWith = idx + dir;
    if (swapWith < 0 || swapWith >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapWith];
    startTransition(async () => {
      await moveCategoryAction([
        { id: a.id, sort_order: b.sort_order },
        { id: b.id, sort_order: a.sort_order },
      ]);
    });
  }

  function moveItem(id: string, dir: -1 | 1) {
    const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
    const idx = sorted.findIndex((x) => x.id === id);
    const swapWith = idx + dir;
    if (swapWith < 0 || swapWith >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapWith];
    startTransition(async () => {
      await moveItemAction([
        { id: a.id, sort_order: b.sort_order },
        { id: b.id, sort_order: a.sort_order },
      ]);
    });
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">{tr(locale, "Menu", "المنيو")}</h1>
        <button
          type="button"
          onClick={() => setNewCatOpen(true)}
          className="press flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-brandstrong"
        >
          <Plus className="size-4" aria-hidden />
          {tr(locale, "New category", "قسم جديد")}
        </button>
      </div>

      {categories.length === 0 && !newCatOpen && (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-inkmuted">
          <p className="font-bold">{tr(locale, "Start with your first category", "ابدأ بإضافة أول قسم")}</p>
          <p className="mt-1 text-sm">{tr(locale, "For example: Grill, Drinks or Desserts", "مثال: المشويات، المشروبات، الحلويات…")}</p>
        </div>
      )}

      {[...categories]
        .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id))
        .map((cat, i, arr) => (
          <section key={cat.id} className="rounded-2xl border border-line bg-surface shadow-sm">
            <header className="flex flex-wrap items-center gap-2 border-b border-dashed border-line p-3.5">
              <h2 className="min-w-0 flex-1 truncate font-extrabold">{categoryName(cat, locale)}</h2>

              <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-inkmuted">
                <input
                  type="checkbox"
                  checked={cat.is_active}
                  onChange={(e) => startTransition(() => toggleCategoryAction(cat.id, e.target.checked).then(() => undefined))}
                  className="size-4 accent-[#C2410C]"
                />
                {tr(locale, "Visible", "ظاهر")}
              </label>

              <div className="flex items-center gap-0.5">
                <IconBtn
                  label={tr(locale, "Move up", "تحريك لفوق")}
                  disabled={i === 0}
                  onClick={() => moveCat(cat.id, -1)}
                >
                  <ChevronUp className="size-4" />
                </IconBtn>
                <IconBtn
                  label={tr(locale, "Move down", "تحريك لتحت")}
                  disabled={i === arr.length - 1}
                  onClick={() => moveCat(cat.id, 1)}
                >
                  <ChevronDown className="size-4" />
                </IconBtn>
              </div>

              <RenameCategoryBtn
                categoryId={cat.id}
                current={cat.name_ar}
                currentEn={cat.name_en}
                onClose={() => undefined}
              />
              <IconBtn label={tr(locale, "Delete category", "حذف القسم")} danger onClick={() => {
                if (!confirm(tr(locale, `Delete “${categoryName(cat, locale)}” and all its items?`, `حذف قسم «${cat.name_ar}» وكل أصنافه؟`))) return;
                startTransition(() => deleteCategoryAction(cat.id).then(() => undefined));
              }}>
                <Trash2 className="size-4" />
              </IconBtn>
            </header>

            <div className="flex flex-col gap-2 p-3">
              {items.filter((it) => it.category_id === cat.id).length === 0 && (
                <p className="py-4 text-center text-sm text-inkmuted">{tr(locale, "No items in this category yet", "لا توجد أصناف في هذا القسم بعد")}</p>
              )}
              {[...items]
                .filter((it) => it.category_id === cat.id)
                .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id))
                .map((item, j, jarr) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded-xl bg-paper p-2.5 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-brandsoft text-brand">
                        {item.image_url ? (
                          <MenuPhoto src={item.image_url} className="size-full object-cover" />
                        ) : (
                          <UtensilsCrossed className="size-5" aria-hidden />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-bold ${item.is_active ? "" : "line-through opacity-60"}`}>
                          {itemName(item, locale)}
                        </p>
                        <p className="text-[13px] font-extrabold text-brand">
                          {priceFmt(Number(item.price), "ج.م", locale)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 sm:flex-nowrap">
                      <ToggleChip
                        active={!item.is_sold_out}
                        onLabel={tr(locale, "Available", "متاح")}
                        offLabel={tr(locale, "Sold out", "غير متوفر")}
                        onClick={() =>
                          startTransition(() =>
                            toggleItemFieldAction(item.id, "is_sold_out", !item.is_sold_out).then(() => undefined)
                          )
                        }
                      />
                      <IconBtn
                        label={item.is_active ? tr(locale, "Hide from customers", "إخفاء عن العملاء") : tr(locale, "Show to customers", "إظهار للعملاء")}
                        onClick={() =>
                          startTransition(() =>
                            toggleItemFieldAction(item.id, "is_active", !item.is_active).then(() => undefined)
                          )
                        }
                      >
                        {item.is_active ? <Eye className="size-4" /> : <EyeOff className="size-4 text-inkmuted" />}
                      </IconBtn>
                      <div className="flex items-center gap-0.5">
                        <IconBtn
                          label={tr(locale, "Move up", "لفوق")}
                          disabled={j === 0}
                          onClick={() => moveItem(item.id, -1)}
                        >
                          <ChevronUp className="size-4" />
                        </IconBtn>
                        <IconBtn
                          label={tr(locale, "Move down", "لتحت")}
                          disabled={j === jarr.length - 1}
                          onClick={() => moveItem(item.id, 1)}
                        >
                          <ChevronDown className="size-4" />
                        </IconBtn>
                      </div>
                      <IconBtn label={tr(locale, "Edit item", "تعديل الصنف")} onClick={() => setEditing({ item, categoryId: cat.id })}>
                        <Pencil className="size-4" />
                      </IconBtn>
                      <IconBtn
                        label={tr(locale, "Delete item", "حذف الصنف")}
                        danger
                        onClick={() => {
                          if (!confirm(tr(locale, `Delete “${itemName(item, locale)}”?`, `حذف «${item.name_ar}»؟`))) return;
                          startTransition(() => deleteItemAction(item.id).then(() => undefined));
                        }}
                      >
                        <Trash2 className="size-4" />
                      </IconBtn>
                    </div>
                  </div>
                ))}

              <button
                type="button"
                onClick={() => setEditing({ categoryId: cat.id })}
                className="press mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line py-2.5 text-sm font-bold text-brand hover:bg-brandsoft"
              >
                <Plus className="size-4" aria-hidden />
                {tr(locale, `New item in “${categoryName(cat, locale)}”`, `صنف جديد في «${cat.name_ar}»`)}
              </button>
            </div>
          </section>
        ))}

      {newCatOpen && (
        <SimpleModal title={tr(locale, "New category", "قسم جديد")} onClose={() => setNewCatOpen(false)}>
          <form
            action={async (fd) => {
              await createCategoryAction(fd);
              setNewCatOpen(false);
            }}
            className="flex flex-col gap-3"
          >
            <input
              name="name_ar"
              required
              minLength={2}
              placeholder={tr(locale, "Arabic name — e.g. المشويات", "اسم القسم — مثال: المشويات")}
              className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none focus:border-brand"
              autoFocus
            />
            <input name="name_en" placeholder={tr(locale, "English name — e.g. Grill", "الاسم بالإنجليزية — مثال: Grill")} className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none focus:border-brand" dir="ltr" />
            <SubmitBtn>{tr(locale, "Add category", "إضافة القسم")}</SubmitBtn>
          </form>
        </SimpleModal>
      )}

      {editing && (
        <ItemModal
          restaurantId={restaurantId}
          categories={categories}
          item={editing.item}
          defaultCategoryId={editing.categoryId}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

/* ── small pieces ── */

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`press grid size-9 place-items-center rounded-lg hover:bg-brandsoft disabled:opacity-30 ${
        danger ? "text-danger hover:bg-red-50" : ""
      }`}
    >
      {children}
    </button>
  );
}

function ToggleChip({
  active,
  onLabel,
  offLabel,
  onClick,
}: {
  active: boolean;
  onLabel: string;
  offLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="switch"
      aria-checked={active}
      className={`press rounded-full px-3 py-1.5 text-xs font-bold ${
        active ? "bg-wa/10 text-wastrong" : "bg-warn/10 text-warn"
      }`}
    >
      {active ? onLabel : offLabel}
    </button>
  );
}

export function SimpleModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { locale } = useLocale();
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 fade-in"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={tr(locale, "Close", "إغلاق")}
            className="press grid size-9 place-items-center rounded-full hover:bg-brandsoft"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SubmitBtn({ children }: { children: React.ReactNode }) {
  const [pending] = useTransition();
  return (
    <button
      type="submit"
      disabled={pending}
      className="press flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 font-bold text-white shadow-md hover:bg-brandstrong disabled:opacity-60"
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

function RenameCategoryBtn({
  categoryId,
  current,
  currentEn,
  onClose,
}: {
  categoryId: string;
  current: string;
  currentEn: string | null;
  onClose: () => void;
}) {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  return (
    <>
      <IconBtn label={tr(locale, "Rename category", "إعادة تسمية القسم")} onClick={() => setOpen(true)}>
        <Pencil className="size-4" />
      </IconBtn>
      {open && (
        <SimpleModal title={tr(locale, "Rename category", "إعادة تسمية القسم")} onClose={() => setOpen(false)}>
          <form
            action={async (fd) => {
              await renameCategoryAction(categoryId, fd);
              setOpen(false);
              onClose();
            }}
            className="flex flex-col gap-3"
          >
            <input
              name="name_ar"
              defaultValue={current}
              required
              minLength={2}
              className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none focus:border-brand"
              autoFocus
            />
            <input name="name_en" defaultValue={currentEn ?? ""} placeholder={tr(locale, "English category name", "اسم القسم بالإنجليزية")} dir="ltr" className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none focus:border-brand" />
            <SubmitBtn>{tr(locale, "Save names", "حفظ الاسم")}</SubmitBtn>
          </form>
        </SimpleModal>
      )}
    </>
  );
}

function ItemModal({
  restaurantId,
  categories,
  item,
  defaultCategoryId,
  onClose,
}: {
  restaurantId: string;
  categories: Category[];
  item?: MenuItem;
  defaultCategoryId: string;
  onClose: () => void;
}) {
  const { locale } = useLocale();
  const [name, setName] = useState(item?.name_ar ?? "");
  const [nameEn, setNameEn] = useState(item?.name_en ?? "");
  const [desc, setDesc] = useState(item?.description_ar ?? "");
  const [descEn, setDescEn] = useState(item?.description_en ?? "");
  const [price, setPrice] = useState(item ? String(Number(item.price)) : "");
  const [categoryId, setCategoryId] = useState(item?.category_id ?? defaultCategoryId);
  const [imageUrl, setImageUrl] = useState<string | null>(item?.image_url ?? null);
  const [isActive, setIsActive] = useState(item?.is_active ?? true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    setError(null);
    try {
      const { url } = await uploadRestaurantImage(restaurantId, f);
      setImageUrl(url);
    } catch {
      setError(tr(locale, "Image upload failed. Try a smaller file.", "تعذر رفع الصورة، حاول صورة أصغر"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <SimpleModal title={item ? tr(locale, `Edit: ${itemName(item, locale)}`, `تعديل: ${item.name_ar}`) : tr(locale, "New item", "صنف جديد")} onClose={onClose}>
      <form
        action={async () => {
          const res = await saveItemAction({
            id: item?.id,
            category_id: categoryId,
            name_ar: name,
            name_en: nameEn || null,
            description_ar: desc,
            description_en: descEn || null,
            price: Number(price),
            image_url: imageUrl,
            is_active: isActive,
          });
          if (!res.ok) {
            setError(res.error);
            return;
          }
          onClose();
        }}
        className="flex max-h-[70dvh] flex-col gap-3 overflow-y-auto pe-1"
      >
        <div className="flex items-center gap-3">
          <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-brandsoft text-brand">
            {uploading ? (
              <Loader2 className="size-6 animate-spin" aria-hidden />
            ) : imageUrl ? (
              <MenuPhoto src={imageUrl} className="size-full object-cover" />
            ) : (
              <UtensilsCrossed className="size-6" aria-hidden />
            )}
          </div>
          <label className="press flex-1 cursor-pointer rounded-xl border border-dashed border-line px-3 py-3 text-center text-sm font-bold text-brand hover:bg-brandsoft">
            {imageUrl ? tr(locale, "Change image", "تغيير الصورة") : tr(locale, "Upload dish image", "رفع صورة الطبق")}
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
          </label>
          {imageUrl && (
            <IconBtn label={tr(locale, "Remove image", "إزالة الصورة")} onClick={() => setImageUrl(null)}>
              <X className="size-4 text-danger" />
            </IconBtn>
          )}
        </div>

        <LabeledInput label={tr(locale, "Arabic item name *", "اسم الصنف بالعربية *")} value={name} onChange={setName} required minLength={2} placeholder="نصف فرخة مشوية" />
        <LabeledInput label={tr(locale, "English item name", "اسم الصنف بالإنجليزية")} value={nameEn} onChange={setNameEn} placeholder="Half Grilled Chicken" />
        <LabeledInput label={tr(locale, "Arabic description", "الوصف بالعربية (اختياري)")} value={desc ?? ""} onChange={setDesc} placeholder="المكونات أو التقديم…" />
        <LabeledInput label={tr(locale, "English description", "الوصف بالإنجليزية (اختياري)")} value={descEn} onChange={setDescEn} placeholder="Ingredients or serving details…" />
        <div className="flex gap-3">
          <label className="block flex-1">
            <span className="mb-1 block text-sm font-bold">{tr(locale, "Price *", "السعر *")}</span>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              required
              placeholder="55"
              className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 outline-none focus:border-brand"
            />
          </label>
          <label className="block flex-1">
            <span className="mb-1 block text-sm font-bold">{tr(locale, "Category", "القسم")}</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 outline-none focus:border-brand"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {categoryName(c, locale)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="size-4 accent-[#C2410C]"
          />
          {tr(locale, "Visible to customers", "ظاهر للعملاء")}
        </label>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-danger">
            {error}
          </p>
        )}

        <SubmitBtn>{item ? tr(locale, "Save changes", "حفظ التعديلات") : tr(locale, "Add item", "إضافة الصنف")}</SubmitBtn>
      </form>
    </SimpleModal>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
        className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 outline-none focus:border-brand"
      />
    </label>
  );
}
