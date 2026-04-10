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
    <section className="rounded-2xl border border-white/10 bg-black/35 p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/85">Evidence Gallery</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <figure key={`${item.src}-${item.alt}`} className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
            <div className="relative aspect-[16/10]">
              <Image src={item.src} alt={item.alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
            {item.note ? <figcaption className="p-3 text-xs leading-6 text-white/65">{item.note}</figcaption> : null}
          </figure>
        ))}
      </div>
    </section>
  );
}
