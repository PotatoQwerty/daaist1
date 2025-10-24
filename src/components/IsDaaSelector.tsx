import React from "react";

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
    <div className="w-full min-w-full p-3 rounded-md bg-background text-gray-500 ring-2 ring-transparent transition-all hover:shadow peer-checked:text-primary peer-checked:ring-primary peer-checked:ring-offset-2">
      <div className="flex flex-col gap-1 items-center justify-center">
        <p>{label}</p>
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="m10.6 13.8l-2.175-2.175q-.275-.275-.675-.275t-.7.3q-.275.275-.275.7q0 .425.275.7L9.9 15.9q.275.275.7.275q.425 0 .7-.275l5.675-5.675q.275-.275.275-.675t-.3-.7q-.275-.275-.7-.275q-.425 0-.7.275ZM12 22q-2.075 0-3.9-.788q-1.825-.787-3.175-2.137q-1.35-1.35-2.137-3.175Q2 14.075 2 12t.788-3.9q.787-1.825 2.137-3.175q1.35-1.35 3.175-2.138Q9.925 2 12 2t3.9.787q1.825.788 3.175 2.138q1.35 1.35 2.137 3.175Q22 9.925 22 12t-.788 3.9q-.787 1.825-2.137 3.175q-1.35 1.35-3.175 2.137Q14.075 22 12 22Z"
          />
        </svg>
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
