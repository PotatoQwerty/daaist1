import { CircleCheck, CircleX } from "lucide-react";

type RadioOptionProps = {
  id: string;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

const RadioOption = ({ id, label, value, onChange }: RadioOptionProps) => (
  <label htmlFor={id} className="cursor-pointer">
    <input
      type="radio"
      name="isdaa"
      id={id}
      // keep value for native semantics but don't pass the event to parent
      value={String(value)}
      className="peer sr-only"
      onChange={() => onChange(value)}
      required
    />
    <div className="w-full min-w-full p-3 rounded-md bg-background ring-2 ring-transparent transition-all hover:shadow peer-checked:text-secondary peer-checked:ring-secondary peer-checked:ring-offset-2">
      <div className="flex gap-1 items-center justify-center">
        <p>{label}</p>
        {value == true ? (
          <CircleCheck className="size-5 " />
        ) : (
          <CircleX className="size-5 " />
        )}
      </div>
    </div>
  </label>
);

export default function IsDaaSelector({
  handleFormChanges,
}: {
  handleFormChanges: (v: boolean) => void;
}) {
  const options = [
    { id: "yes", label: "Yes", value: true },
    { id: "no", label: "No", value: false },
  ];

  return (
    <div className="flex justify-between items-center w-fit">
      <div className="max-w-6xl mx-auto px-12">
        <div className="flex flex-wrap gap-3">
          {options.map((opt) => (
            <RadioOption
              key={opt.id}
              id={opt.id}
              label={opt.label}
              value={opt.value}
              onChange={handleFormChanges}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
