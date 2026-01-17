interface RadioCardProps {
  id: string;
  name: string;
  value: string;
  label: React.ReactNode;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
  icon?: React.ReactNode;
  checked?: boolean;
}

const RadioCard: React.FC<RadioCardProps> = ({
  id,
  name,
  value,
  label,
  onChange,
  required,
  icon,
  checked,
}) => {
  return (
    <label htmlFor={id} className="cursor-pointer">
      <input
        type="radio"
        name={name}
        id={id}
        value={value}
        className="peer sr-only"
        onChange={onChange}
        required={required}
        checked={checked}
      />
      <div className="flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-xl border border-border/60 bg-background/70 px-3 py-4 text-center text-foreground transition hover:-translate-y-0.5 hover:shadow-sm peer-checked:border-primary/50 peer-checked:bg-primary/10 peer-checked:text-primary">
        <p className="text-sm font-semibold">{label}</p>
        {icon && <div className="text-lg">{icon}</div>}
      </div>
    </label>
  );
};

export default RadioCard;
