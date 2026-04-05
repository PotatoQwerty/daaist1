type ParticipantAccessRecord = {
  user_id?: string | null;
  email?: string | null;
  registration_number?: string | null;
};

type ParticipantIdentity = {
  userId?: string | null;
  email?: string | null;
  registrationNumber?: string | null;
};

function normalizeUserId(value?: string | null) {
  return value?.trim() || "";
}

function normalizeEmail(value?: string | null) {
  return value?.trim().toLowerCase() || "";
}

function normalizeRegistrationNumber(value?: string | null) {
  return value?.trim() || "";
}

function matchesParticipantIdentity(
  participant: ParticipantAccessRecord,
  identity: ParticipantIdentity,
) {
  const participantEmail = normalizeEmail(participant.email);
  const participantRegistrationNumber = normalizeRegistrationNumber(
    participant.registration_number,
  );
  const email = normalizeEmail(identity.email);
  const registrationNumber = normalizeRegistrationNumber(
    identity.registrationNumber,
  );

  return (
    Boolean(email && participantEmail && participantEmail === email) ||
    Boolean(
      registrationNumber &&
        participantRegistrationNumber &&
        participantRegistrationNumber === registrationNumber,
    )
  );
}

export function canRevealParticipantCheckInToken(
  participant: ParticipantAccessRecord,
  identity: ParticipantIdentity,
) {
  const userId = normalizeUserId(identity.userId);
  const participantUserId = normalizeUserId(participant.user_id);

  if (!userId) {
    return false;
  }

  if (participantUserId) {
    return participantUserId === userId;
  }

  return matchesParticipantIdentity(participant, identity);
}

export function canAttachParticipantToUser(
  participant: ParticipantAccessRecord,
  identity: ParticipantIdentity,
) {
  const participantUserId = normalizeUserId(participant.user_id);
  return !participantUserId && canRevealParticipantCheckInToken(participant, identity);
}

export function getExistingRegistrationMessage(options: {
  canRevealToken: boolean;
  isSignedIn: boolean;
}) {
  if (options.canRevealToken) {
    return "You are already registered for this event.";
  }

  return options.isSignedIn
    ? "A registration already exists for this event, but this account cannot reopen its saved pass."
    : "A registration already exists for this event. Sign in with the same account to reopen the saved pass.";
}
