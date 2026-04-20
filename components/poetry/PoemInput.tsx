type PoemInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function PoemInput({ value, onChange }: PoemInputProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <label htmlFor="poem-input" className="mb-2 block text-sm font-semibold text-slate-700">
        Poem text
      </label>
      <textarea
        id="poem-input"
        className="h-64 w-full resize-y rounded-lg border border-slate-300 p-3 text-sm leading-6 outline-none ring-indigo-500 transition focus:ring-2"
        placeholder="Paste your poem in plain text or markdown..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </section>
  );
}
