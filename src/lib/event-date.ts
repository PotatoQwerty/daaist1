const DATE_PREFIX_REGEX = /^(\d{4})-(\d{2})-(\d{2})/;

const eventDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function getDatePrefix(value?: string | null) {
  if (!value) return null;

  const match = value.match(DATE_PREFIX_REGEX);
  return match ? match[0] : null;
}

function buildUtcDateFromPrefix(prefix: string) {
  const [year, month, day] = prefix.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function parseEventDate(value?: string | null) {
  const prefix = getDatePrefix(value);
  if (prefix) {
    return buildUtcDateFromPrefix(prefix);
  }

  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(
    Date.UTC(
      parsed.getUTCFullYear(),
      parsed.getUTCMonth(),
      parsed.getUTCDate(),
    ),
  );
}

export function formatEventDate(
  value?: string | null,
  fallback = "Date to be announced",
) {
  const date = parseEventDate(value);
  return date ? eventDateFormatter.format(date) : fallback;
}

export function formatEventDateRange(
  startDate?: string | null,
  endDate?: string | null,
  fallback = "Date to be announced",
) {
  const startLabel = formatEventDate(startDate, fallback);
  if (startLabel === fallback) {
    return fallback;
  }

  const endLabel = formatEventDate(endDate, "");
  if (!endLabel || endLabel === startLabel) {
    return startLabel;
  }

  return `${startLabel} - ${endLabel}`;
}
