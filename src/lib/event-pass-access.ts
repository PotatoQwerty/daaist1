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

/**
 * Whether an unclaimed registration belongs to the caller.
 *
 * Matches on the email only. A registration number is not proof of identity:
 * it is typed into a public form, printed on student cards, and previously a
 * signed-in user could pass any value here to unlock a stranger's pass and
 * bind that stranger's registration to their own account.
 *
 * The email compared here is the verified address on the caller's session,
 * because every caller that reaches this point is signed in (see
 * canRevealParticipantCheckInToken).
 */
function matchesParticipantIdentity(
  participant: ParticipantAccessRecord,
  identity: ParticipantIdentity,
) {
  const participantEmail = normalizeEmail(participant.email);
  const email = normalizeEmail(identity.email);

  return Boolean(email && participantEmail && participantEmail === email);
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
