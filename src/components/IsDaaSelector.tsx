import { CircleCheck, CircleX } from "lucide-react";

type RadioOptionProps = {
  id: string;
  label: string;
  value: boolean;
  isChecked: boolean; // <--- NEW PROP
  onChange: (value: boolean) => void;
};

const RadioOption = ({
  id,
  label,
  value,
  isChecked,
  onChange,
}: RadioOptionProps) => (
  <label htmlFor={id} className="cursor-pointer">
    <input
      type="radio"
      name="isdaa"
      id={id}
      checked={isChecked}
      onChange={() => onChange(value)}
      className="peer sr-only"
    />
    <div className="min-w-[120px] rounded-md border border-border bg-background/80 p-3 text-sm font-semibold text-foreground ring-2 ring-transparent ring-offset-2 ring-offset-background transition hover:bg-muted/50 hover:shadow-sm peer-checked:border-primary/40 peer-checked:bg-primary/10 peer-checked:ring-primary">
      <div className="flex gap-1 items-center justify-center">
        <p>{label}</p>
        {value === true ? (
          <CircleCheck className="size-5" />
        ) : (
          <CircleX className="size-5" />
        )}
      </div>
    </div>
  </label>
);

export default function IsDaaSelector({
  currentValue,
  handleFormChanges,
}: {
  currentValue: boolean | null; // <--- ALLOW NULL
  handleFormChanges: (v: boolean) => void;
}) {
  const options = [
    { id: "yes", label: "Yes", value: true },
    { id: "no", label: "No", value: false },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {options.map((opt) => (
        <RadioOption
          key={opt.id}
          id={opt.id}
          label={opt.label}
          value={opt.value}
          isChecked={currentValue === opt.value}
          onChange={handleFormChanges}
        />
      ))}
    </div>
  );
}
