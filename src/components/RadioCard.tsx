interface RadioCardProps {
  id: string;
  name: string;
  value: string;
  label: React.ReactNode;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
  icon?: React.ReactNode;
}

const RadioCard: React.FC<RadioCardProps> = ({
  id,
  name,
  value,
  label,
  onChange,
  required,
  icon,
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
      />
      <div className="w-32 h-24 p-3 flex flex-col justify-center items-center rounded-md bg-primary text-white ring-2 ring-transparent transition-all hover:shadow peer-checked:text-secondary peer-checked:ring-primary peer-checked:ring-offset-1">
        <p className="text-sm font-bold">{label}</p>
        <div className="mt-1">{icon}</div>
      </div>
    </label>
  );
};

export default RadioCard;
