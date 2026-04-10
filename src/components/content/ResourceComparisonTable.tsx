type ComparisonRow = {
  criterion: string;
  optionA: string;
  optionB: string;
};

type ResourceComparisonTableProps = {
  optionALabel: string;
  optionBLabel: string;
  rows: ComparisonRow[];
};

export default function ResourceComparisonTable({
  optionALabel,
  optionBLabel,
  rows,
}: ResourceComparisonTableProps) {
  if (!rows.length) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-black/35">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-white/5 text-white/80">
          <tr>
            <th className="px-4 py-3">Criterion</th>
            <th className="px-4 py-3">{optionALabel}</th>
            <th className="px-4 py-3">{optionBLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.criterion} className="border-t border-white/10 text-white/74">
              <td className="px-4 py-3 font-medium text-white/88">{row.criterion}</td>
              <td className="px-4 py-3">{row.optionA}</td>
              <td className="px-4 py-3">{row.optionB}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
