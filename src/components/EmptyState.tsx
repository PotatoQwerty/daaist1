import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-accent/50 rounded-xl min-h-[300px] w-full supports-backdrop-filter:bg-background/60">
      <div className="bg-white p-3 rounded-full shadow-sm mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-accent mb-1">{title}</h3>
      <p className="text-sm text-gray-400 max-w-xs">{description}</p>
    </div>
  );
}
