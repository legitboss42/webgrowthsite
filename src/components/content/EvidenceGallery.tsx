import Image from "next/image";

type EvidenceGalleryItem = {
  src: string;
  alt: string;
  note?: string;
};

type EvidenceGalleryProps = {
  items: EvidenceGalleryItem[];
};

export default function EvidenceGallery({ items }: EvidenceGalleryProps) {
  if (!items.length) return null;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <p className="text-xs uppercase tracking-[0.18em] text-blue-700">Representative Visuals</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <figure
            key={`${item.src}-${item.alt}`}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70"
          >
            <div className="relative aspect-[16/10]">
              <Image
                src={item.src}
                alt={item.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            {item.note ? <figcaption className="p-3 text-xs leading-6 text-slate-500">{item.note}</figcaption> : null}
          </figure>
        ))}
      </div>
    </section>
  );
}
