import PageHeader from "@/components/PageHeader";

export const metadata = {
  title: "Daa'ist - Privacy policy",
  description: "What Daa'ist collects, why, and who it is shared with.",
  alternates: { canonical: "https://daaist.com/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 md:py-16">
      <PageHeader title="Privacy Policy" meta="Updated 2026-01-16" />

      <section className="legal mt-12">
        <h2>What we collect</h2>
        <p>
          Account info (name, email, registration number), profile data you
          choose to add, and app usage needed to run Daa&apos;ist.
        </p>

        <h2>Why we collect it</h2>
        <p>
          Authentication, club/community features, moderation, security, and
          improving the service.
        </p>

        <h2>Third parties</h2>
        <p>
          We use authentication providers (e.g. Google OAuth) and
          hosting/database providers to operate the app.
        </p>

        <h2>Contact</h2>
        <p>
          Email: <a href="mailto:support@daaist.com">support@daaist.com</a>
        </p>
      </section>
    </main>
  );
}
