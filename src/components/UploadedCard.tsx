import { MoreVertical, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function UploadedCard({
  title,
  category,
  subject,
  level,
  link,
  type,
  size,
  onDelete,
  style,
}: {
  title: string;
  category: string;
  subject: string;
  level: string;
  link: string;
  type: string;
  size: number;
  style?: string;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={`bg-background w-60 h-[140px] rounded-xl shadow  p-4 border relative ${style}`}
    >
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-lg text-foreground">{title}</h3>
        <div className="relative" ref={menuRef}>
          <MoreVertical
            className="w-5 h-5 cursor-pointer text-gray-500 hover:text-accent"
            onClick={() => setOpen((p) => !p)}
          />
          {open && (
            <div className="absolute right-0 mt-2 bg-white border rounded-lg shadow-lg w-32">
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-gray-300 rounded-lg w-full text-left"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-gray-500 text-sm mt-2">
        {category === "doc" ? (
          <>{category.toUpperCase()}</>
        ) : (
          <>
            {subject.toUpperCase()} • {level.toUpperCase()} •{" "}
            {category.toUpperCase()}
          </>
        )}
      </p>
      <p className="text-xs text-gray-400 mt-1">
        {type} • {(size / (1024 * 1024)).toFixed(2)} MB
      </p>
      <a
        href={link}
        target="_blank"
        className="text-secondary text-sm mt-2 inline-block hover:opacity-80 hover:underline "
      >
        View file
      </a>
    </div>
  );
}
