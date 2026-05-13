type PoemInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function PoemInput({ value, onChange }: PoemInputProps) {
  return (
    <section className="vp-panel flex min-h-0 flex-1 flex-col p-4">
      <label htmlFor="poem-input" className="mb-3 block">
        <span className="vp-kicker block">POEM</span>
      </label>
      <textarea
        id="poem-input"
        className="vp-field min-h-0 w-full flex-1 resize-none rounded-[10px] px-3 py-3 font-mono text-sm leading-6"
        placeholder="Paste your poem in plain text or markdown..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </section>
  );
}
