type EditorialNoteProps = {
  note: string;
  methodology?: string;
};

export default function EditorialNote({ note, methodology }: EditorialNoteProps) {
  return (
    <section className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/90">Editorial Note</p>
      <p className="mt-3 text-sm leading-7 text-white/80">{note}</p>
      {methodology ? <p className="mt-3 text-sm leading-7 text-white/72">{methodology}</p> : null}
    </section>
  );
}
