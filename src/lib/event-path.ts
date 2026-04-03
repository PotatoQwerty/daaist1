type EventPathInput = {
  id: string;
  title?: string | null;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isEventUuid(value: string) {
  return UUID_REGEX.test(value.trim());
}

export function getEventSlug(title?: string | null) {
  const normalized = (title || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "event";
}

export function getEventPath(event: EventPathInput) {
  return `/events/${getEventSlug(event.title)}`;
}

export function getEventCheckInPath(
  event: EventPathInput,
  token?: string | null,
) {
  const basePath = `${getEventPath(event)}/check-in`;
  if (!token) return basePath;

  return `${basePath}?token=${encodeURIComponent(token)}`;
}

export function getRegisterEventPath(event: EventPathInput) {
  return `/register/${getEventSlug(event.title)}`;
}
