"use client";

import { Label } from "@/components/ui/label";
import {
  getExperiencePromptHelp,
  getExperiencePromptLabel,
} from "@/lib/event-extra";

type EventExperienceFieldProps = {
  topic: string;
  value: number;
  onChange: (value: number) => void;
};

export default function EventExperienceField({
  topic,
  value,
  onChange,
}: EventExperienceFieldProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-muted/25 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label htmlFor={`experience-${topic}`} className="text-sm font-medium">
            {getExperiencePromptLabel(topic)}
          </Label>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {getExperiencePromptHelp(topic)}
          </p>
        </div>
        <div className="rounded-full bg-background px-3 py-1 text-sm font-semibold text-primary">
          {value}%
        </div>
      </div>

      <input
        id={`experience-${topic}`}
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
      />

      <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <span>Beginner</span>
        <span>Advanced</span>
      </div>
    </div>
  );
}
