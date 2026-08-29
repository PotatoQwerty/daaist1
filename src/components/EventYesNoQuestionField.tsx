import { CircleCheck, CircleX } from "lucide-react";
import { Label } from "./ui/label";

type EventYesNoQuestionFieldProps = {
  question: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
};

type ChoiceProps = {
  id: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
  icon: "yes" | "no";
};

function Choice({ id, label, selected, onSelect, icon }: ChoiceProps) {
  return (
    <label htmlFor={id} className="cursor-pointer">
      <input
        id={id}
        type="radio"
        name={id}
        checked={selected}
        onChange={onSelect}
        className="peer sr-only"
      />
      <div className="min-w-[120px] rounded-md border border-border bg-background/80 p-3 text-sm font-semibold text-foreground ring-2 ring-transparent ring-offset-2 ring-offset-background transition hover:bg-muted/50 hover:shadow-sm peer-checked:border-primary/40 peer-checked:bg-primary/10 peer-checked:ring-primary">
        <div className="flex items-center justify-center gap-2">
          <span>{label}</span>
          {icon === "yes" ? (
            <CircleCheck className="h-5 w-5" />
          ) : (
            <CircleX className="h-5 w-5" />
          )}
        </div>
      </div>
    </label>
  );
}

export default function EventYesNoQuestionField({
  question,
  value,
  onChange,
}: EventYesNoQuestionFieldProps) {
  const slug = question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return (
    <div className="space-y-3 rounded-[1.5rem] border border-border bg-card p-4">
      <Label className="text-base font-semibold leading-6">{question}</Label>
      <div className="flex flex-wrap gap-3">
        <Choice
          id={`${slug || "question"}-yes`}
          label="Yes"
          selected={value === true}
          onSelect={() => onChange(true)}
          icon="yes"
        />
        <Choice
          id={`${slug || "question"}-no`}
          label="No"
          selected={value === false}
          onSelect={() => onChange(false)}
          icon="no"
        />
      </div>
    </div>
  );
}
