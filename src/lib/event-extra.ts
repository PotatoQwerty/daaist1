export const EVENT_STUDY_YEAR_OPTIONS = [
  "First Year",
  "Second Year",
  "Third Year",
  "Fourth Year",
  "Fifth Year",
] as const;

export type EventStudyYear = (typeof EVENT_STUDY_YEAR_OPTIONS)[number];

export type EventExperiencePrompt = {
  topic: string;
  required?: boolean;
};

export type EventExtraData = {
  experiencePrompts?: EventExperiencePrompt[];
  allowedStudyYears?: EventStudyYear[];
};

export type EventParticipantExtraData = {
  experience?: Array<{
    topic: string;
    percentage: number;
  }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeTopic(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePrompt(value: unknown): EventExperiencePrompt | null {
  if (!isRecord(value)) {
    return null;
  }

  const topic = normalizeTopic(value.topic);
  if (!topic) {
    return null;
  }

  return {
    topic,
    required: value.required !== false,
  };
}

function dedupePrompts(prompts: EventExperiencePrompt[]) {
  const seen = new Set<string>();

  return prompts.filter((prompt) => {
    const key = prompt.topic.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function normalizeAllowedStudyYears(value: unknown): EventStudyYear[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const allowed = new Set<EventStudyYear>(EVENT_STUDY_YEAR_OPTIONS);
  const deduped = new Set<EventStudyYear>();

  value.forEach((item) => {
    if (typeof item !== "string") {
      return;
    }

    const match = EVENT_STUDY_YEAR_OPTIONS.find((year) => year === item.trim());
    if (match && allowed.has(match)) {
      deduped.add(match);
    }
  });

  return Array.from(deduped);
}

export function parseEventExtraData(value: unknown): EventExtraData {
  if (!isRecord(value)) {
    return {};
  }

  const promptsFromArray = Array.isArray(value.experiencePrompts)
    ? value.experiencePrompts
        .map(normalizePrompt)
        .filter((prompt): prompt is EventExperiencePrompt => Boolean(prompt))
    : [];

  const legacyExperienceValue = value.experience;
  const legacyPrompt =
    isRecord(legacyExperienceValue) && legacyExperienceValue.enabled === true
      ? normalizePrompt({
          topic: legacyExperienceValue.topic,
          required: legacyExperienceValue.required,
        })
      : null;

  const experiencePrompts = dedupePrompts(
    legacyPrompt ? [legacyPrompt, ...promptsFromArray] : promptsFromArray,
  );

  const allowedStudyYears = normalizeAllowedStudyYears(value.allowedStudyYears);

  return {
    experiencePrompts:
      experiencePrompts.length > 0 ? experiencePrompts : undefined,
    allowedStudyYears:
      allowedStudyYears.length > 0 ? allowedStudyYears : undefined,
  };
}

export function buildEventExtraData(input: {
  experienceTopics: string[];
  allowedStudyYears: string[];
}): EventExtraData {
  const experiencePrompts = dedupePrompts(
    input.experienceTopics
      .map((topic) => topic.trim())
      .filter(Boolean)
      .map((topic) => ({
        topic,
        required: true,
      })),
  );

  const allowedStudyYears = normalizeAllowedStudyYears(input.allowedStudyYears);

  return {
    experiencePrompts:
      experiencePrompts.length > 0 ? experiencePrompts : undefined,
    allowedStudyYears:
      allowedStudyYears.length > 0 ? allowedStudyYears : undefined,
  };
}

export function getAllowedStudyYears(extraData?: EventExtraData) {
  return extraData?.allowedStudyYears?.length
    ? extraData.allowedStudyYears
    : [...EVENT_STUDY_YEAR_OPTIONS];
}

export function getExperiencePromptLabel(topic: string) {
  return `How confident are you with ${topic}?`;
}

export function getExperiencePromptHelp(topic: string) {
  return `Move the slider to show your current experience level with ${topic}.`;
}
