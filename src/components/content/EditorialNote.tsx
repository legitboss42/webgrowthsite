type EditorialNoteProps = {
  note: string;
  methodology?: string;
};

export default function EditorialNote({ note, methodology }: EditorialNoteProps) {
  return (
    <section className="rounded-3xl border border-blue-200 bg-blue-50/80 p-6 shadow-[0_18px_40px_rgba(59,130,246,0.08)]">
      <p className="text-xs uppercase tracking-[0.18em] text-blue-700">Editorial Note</p>
      <p className="mt-3 text-sm leading-7 text-slate-700">{note}</p>
      {methodology ? <p className="mt-3 text-sm leading-7 text-slate-600">{methodology}</p> : null}
    </section>
  );
}
