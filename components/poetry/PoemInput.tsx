type PoemInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function PoemInput({ value, onChange }: PoemInputProps) {
  return (
    <section className="rounded-lg border border-solid border-border bg-card p-4 text-card-foreground shadow-sm">
      <label htmlFor="poem-input" className="mb-2 block text-sm font-semibold">
        Poem text
      </label>
      <textarea
        id="poem-input"
        className="vp-field h-64 w-full resize-y rounded-md px-3 py-2 font-mono text-sm leading-6"
        placeholder="Paste your poem in plain text or markdown..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </section>
  );
}
