import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import RegisterForm from "@/components/RegisterForm";
import { getEventSlug, getRegisterEventPath } from "@/lib/event-path";
import { getPublicEventById } from "@/lib/supabase/actions";

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
      title: "Event Not Found - Daa'ist",
    };
  }

  return {
    title: `${event.title} Registration - Daa'ist`,
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
  const headerList = await headers();
  const protocol = headerList.get("x-forwarded-proto") || "http";
  const host =
    headerList.get("x-forwarded-host") || headerList.get("host") || "";
  const baseUrl = host ? `${protocol}://${host}` : "";

  if (!event) {
    notFound();
  }

  if (decodeURIComponent(eventId) !== getEventSlug(event.title)) {
    redirect(getRegisterEventPath(event));
  }

  return <RegisterForm event={event} baseUrl={baseUrl} />;
}
