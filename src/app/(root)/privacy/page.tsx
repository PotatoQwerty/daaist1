export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 h-screen">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-4 text-sm opacity-80">Last updated: 2026-01-16</p>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold">What we collect</h2>
        <p>
          Account info (name, email, registration number), profile data you
          choose to add, and app usage needed to run Daa&apos;ist.
        </p>

        <h2 className="text-xl font-semibold">Why we collect it</h2>
        <p>
          Authentication, club/community features, moderation, security, and
          improving the service.
        </p>

        <h2 className="text-xl font-semibold">Third parties</h2>
        <p>
          We use authentication providers (e.g. Google OAuth) and
          hosting/database providers to operate the app.
        </p>

        <h2 className="text-xl font-semibold">Contact</h2>
        <p>Email: support@daaist.com</p>
      </section>
    </main>
  );
}
