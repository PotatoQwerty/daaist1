"use client";

import { useId, useState } from "react";
import type { DiagramAppearance } from "@/lib/diagramAppearance";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function ColorField({ label, value, onChange }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      <div className="flex h-11 items-center gap-3 rounded-md border border-input bg-background/80 px-3 transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(event) => { setDraft(null); onChange(event.target.value); }}
          className="h-6 w-6 shrink-0 cursor-pointer appearance-none overflow-hidden rounded-sm border border-border bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-none [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:border-0"
        />
        <label htmlFor={`${id}-hex`} className="sr-only">{label} hex code</label>
        <Input
          id={`${id}-hex`}
          type="text"
          value={draft ?? value}
          maxLength={7}
          spellCheck={false}
          pattern="#[0-9a-fA-F]{6}"
          title="Six-digit hex color, for example #C46635"
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            if (/^#[0-9a-fA-F]{6}$/.test(next)) {
              onChange(next);
              setDraft(null);
            }
          }}
          onBlur={() => setDraft(null)}
          className="h-full flex-1 rounded-none border-0 bg-transparent px-0 font-mono text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
      </div>
    </div>
  );
}

export default function DiagramAppearanceFields({ value, onChange, defaults, labels }: {
  value: DiagramAppearance;
  onChange: (value: DiagramAppearance) => void;
  defaults: string[];
  labels: string[];
}) {
  const id = useId();
  return (
    <fieldset className="space-y-4 rounded-md border border-border p-4">
      <legend className="px-1 text-sm font-semibold">Appearance</legend>
      <div className="space-y-2">
        <label htmlFor={`${id}-background`} className="block text-sm font-medium">Background</label>
        <select
          id={`${id}-background`}
          value={value.theme}
          onChange={(event) => onChange({ ...value, theme: event.target.value as DiagramAppearance["theme"] })}
          className="h-11 w-full rounded-md border border-input bg-background/80 px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:max-w-xs"
        >
          <option value="light">Light / report</option>
          <option value="transparent">Transparent</option>
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {labels.map((label, index) => (
          <ColorField
            key={label}
            label={label}
            value={value.palette[index]}
            onChange={(color) => onChange({ ...value, palette: value.palette.map((current, i) => i === index ? color : current) })}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          id={`${id}-auto-text`}
          type="checkbox"
          className="size-4 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          checked={value.textColor === undefined}
          onChange={(event) => onChange({
            ...value,
            textColor: event.target.checked ? undefined : value.theme === "transparent" ? "#FFFFFF" : "#263238",
          })}
        />
        <label htmlFor={`${id}-auto-text`} className="text-sm">Automatic text color</label>
      </div>
      {value.textColor !== undefined && (
        <ColorField
          label="Text color"
          value={value.textColor}
          onChange={(textColor) => onChange({ ...value, textColor })}
        />
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange({ theme: value.theme, palette: [...defaults] })}
      >
        Reset colors
      </Button>
      <p className="text-xs text-muted-foreground">Generate a new image to apply appearance changes. Automatic text adapts to the export background.</p>
    </fieldset>
  );
}
