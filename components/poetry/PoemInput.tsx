type PoemInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function PoemInput({ value, onChange }: PoemInputProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-lg border border-solid border-border bg-card p-4 text-card-foreground shadow-sm">
      <label htmlFor="poem-input" className="mb-2 block text-xl font-semibold">
        Poem text
      </label>
      <textarea
        id="poem-input"
        className="vp-field min-h-0 w-full flex-1 resize-none rounded-md px-3 py-2 font-mono text-sm leading-6"
        placeholder="Paste your poem in plain text or markdown..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </section>
  );
}
