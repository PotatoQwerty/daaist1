import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import RegisterForm from "@/components/RegisterForm";
import { getEventSlug, getRegisterEventPath } from "@/lib/event-path";
import { getPublicEventById } from "@/lib/supabase/actions";
import { getBaseUrl } from "@/lib/base-url";

type EventRegisterPageProps = {
  params: Promise<{ eventId: string }>;
};

export const revalidate = 30;

export async function generateMetadata({
  params,
}: EventRegisterPageProps): Promise<Metadata> {
  const { eventId } = await params;
  const event = await getPublicEventById(eventId);

  if (!event) {
    return {
      title: "Event not found",
    };
  }

  return {
    title: `${event.title} registration`,
    description:
      event.description ||
      `Register for ${event.title} and prefill your details if you are signed in.`,
  };
}

export default async function EventRegisterPage({
  params,
}: EventRegisterPageProps) {
  const { eventId } = await params;
  const event = await getPublicEventById(eventId);
  // Prefers the configured origin over the request headers: this value
  // ends up inside the check-in QR code.
  const baseUrl = getBaseUrl(await headers());

  if (!event) {
    notFound();
  }

  if (decodeURIComponent(eventId) !== getEventSlug(event.title)) {
    redirect(getRegisterEventPath(event));
  }

  return <RegisterForm event={event} baseUrl={baseUrl} />;
}
