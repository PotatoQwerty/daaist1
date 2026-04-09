export const EVENT_STUDY_YEAR_OPTIONS = [
  "First Year",
  "Second Year",
  "Third Year",
  "Fourth Year",
  "Fifth Year",
] as const;

export type EventStudyYear = (typeof EVENT_STUDY_YEAR_OPTIONS)[number];

export const EVENT_ATTENDANCE_ROLE_OPTIONS = [
  "participant",
  "invited_only",
] as const;

export type EventAttendanceRole =
  (typeof EVENT_ATTENDANCE_ROLE_OPTIONS)[number];

export type EventExperiencePrompt = {
  topic: string;
  required?: boolean;
};

export type EventYesNoQuestion = {
  question: string;
  required?: boolean;
};

export type EventParticipantExperienceAnswer = {
  topic: string;
  percentage: number;
};

export type EventParticipantYesNoAnswer = {
  question: string;
  answer: boolean;
};

export type EventExtraData = {
  experiencePrompts?: EventExperiencePrompt[];
  yesNoQuestions?: EventYesNoQuestion[];
  allowedStudyYears?: EventStudyYear[];
};

export type EventParticipantExtraData = {
  attendanceRole?: EventAttendanceRole;
  experience?: EventParticipantExperienceAnswer[];
  yesNo?: EventParticipantYesNoAnswer[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePercentage(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(100, Math.max(0, Math.round(value)))
    : null;
}

export function normalizeAttendanceRole(
  value: unknown,
): EventAttendanceRole | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();
  return EVENT_ATTENDANCE_ROLE_OPTIONS.find((item) => item === normalizedValue)
    ? (normalizedValue as EventAttendanceRole)
    : null;
}

export function getAttendanceRoleLabel(value: EventAttendanceRole) {
  return value === "participant" ? "Participant" : "Invited only";
}

function normalizePrompt(value: unknown): EventExperiencePrompt | null {
  if (!isRecord(value)) {
    return null;
  }

  const topic = normalizeText(value.topic);
  if (!topic) {
    return null;
  }

  return {
    topic,
    required: value.required !== false,
  };
}

function normalizeYesNoQuestion(value: unknown): EventYesNoQuestion | null {
  if (!isRecord(value)) {
    return null;
  }

  const question = normalizeText(value.question);
  if (!question) {
    return null;
  }

  return {
    question,
    required: value.required !== false,
  };
}

function normalizeParticipantExperienceAnswer(
  value: unknown,
): EventParticipantExperienceAnswer | null {
  if (!isRecord(value)) {
    return null;
  }

  const topic = normalizeText(value.topic);
  const percentage = normalizePercentage(value.percentage);

  if (!topic || percentage === null) {
    return null;
  }

  return {
    topic,
    percentage,
  };
}

function normalizeParticipantYesNoAnswer(
  value: unknown,
): EventParticipantYesNoAnswer | null {
  if (!isRecord(value)) {
    return null;
  }

  const question = normalizeText(value.question);
  if (!question || typeof value.answer !== "boolean") {
    return null;
  }

  return {
    question,
    answer: value.answer,
  };
}

function dedupeExperiencePrompts(prompts: EventExperiencePrompt[]) {
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

function dedupeYesNoQuestions(questions: EventYesNoQuestion[]) {
  const seen = new Set<string>();

  return questions.filter((question) => {
    const key = question.question.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function dedupeParticipantExperienceAnswers(
  answers: EventParticipantExperienceAnswer[],
) {
  const seen = new Set<string>();

  return answers.filter((answer) => {
    const key = answer.topic.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function dedupeParticipantYesNoAnswers(answers: EventParticipantYesNoAnswer[]) {
  const seen = new Set<string>();

  return answers.filter((answer) => {
    const key = answer.question.toLowerCase();
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

  const experiencePrompts = dedupeExperiencePrompts(
    legacyPrompt ? [legacyPrompt, ...promptsFromArray] : promptsFromArray,
  );

  const yesNoQuestions = dedupeYesNoQuestions(
    Array.isArray(value.yesNoQuestions)
      ? value.yesNoQuestions
          .map(normalizeYesNoQuestion)
          .filter((question): question is EventYesNoQuestion => Boolean(question))
      : [],
  );

  const allowedStudyYears = normalizeAllowedStudyYears(value.allowedStudyYears);

  return {
    experiencePrompts:
      experiencePrompts.length > 0 ? experiencePrompts : undefined,
    yesNoQuestions: yesNoQuestions.length > 0 ? yesNoQuestions : undefined,
    allowedStudyYears:
      allowedStudyYears.length > 0 ? allowedStudyYears : undefined,
  };
}

export function parseEventParticipantExtraData(
  value: unknown,
): EventParticipantExtraData {
  if (!isRecord(value)) {
    return {};
  }

  const attendanceRole = normalizeAttendanceRole(value.attendanceRole) ?? undefined;
  const experience = dedupeParticipantExperienceAnswers(
    Array.isArray(value.experience)
      ? value.experience
          .map(normalizeParticipantExperienceAnswer)
          .filter(
            (
              answer,
            ): answer is EventParticipantExperienceAnswer => Boolean(answer),
          )
      : [],
  );
  const yesNo = dedupeParticipantYesNoAnswers(
    Array.isArray(value.yesNo)
      ? value.yesNo
          .map(normalizeParticipantYesNoAnswer)
          .filter((answer): answer is EventParticipantYesNoAnswer => Boolean(answer))
      : [],
  );

  return {
    attendanceRole,
    experience: experience.length > 0 ? experience : undefined,
    yesNo: yesNo.length > 0 ? yesNo : undefined,
  };
}

export function buildEventExtraData(input: {
  experienceTopics: string[];
  yesNoQuestions: string[];
  allowedStudyYears: string[];
}): EventExtraData {
  const experiencePrompts = dedupeExperiencePrompts(
    input.experienceTopics
      .map((topic) => topic.trim())
      .filter(Boolean)
      .map((topic) => ({
        topic,
        required: true,
      })),
  );

  const yesNoPrompts = dedupeYesNoQuestions(
    input.yesNoQuestions
      .map((question) => question.trim())
      .filter(Boolean)
      .map((question) => ({
        question,
        required: true,
      })),
  );

  const allowedStudyYears = normalizeAllowedStudyYears(input.allowedStudyYears);

  return {
    experiencePrompts:
      experiencePrompts.length > 0 ? experiencePrompts : undefined,
    yesNoQuestions: yesNoPrompts.length > 0 ? yesNoPrompts : undefined,
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
