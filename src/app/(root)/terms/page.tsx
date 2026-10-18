import PageHeader from "@/components/PageHeader";
import { absoluteUrl } from "@/lib/site";

export const metadata = {
  title: "Terms of service",
  description: "The terms that apply to using Daa'ist.",
  alternates: { canonical: absoluteUrl("/terms") },
};

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 md:py-16">
      <PageHeader title="Terms of Service" meta="Updated 2026-01-16" />

      {/* Structure and type only. The clauses themselves are unchanged. */}
      <section className="legal mt-12">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing and using Daa&apos;ist, you accept and agree to be bound
          by the terms and provision of this agreement. If you do not agree to
          abide by the above, please do not use this service.
        </p>

        <h2>2. Use License</h2>
        <p>
          Permission is granted to temporarily download one copy of the
          materials (information or software) on Daa&apos;ist for personal,
          non-commercial transitory viewing only. This is the grant of a
          license, not a transfer of title, and under this license you may not:
        </p>
        <ul>
          <li>Modifying or copying the materials</li>
          <li>
            Using the materials for any commercial purpose or for any public
            display
          </li>
          <li>
            Attempting to decompile or reverse engineer any software contained
            on Daa&apos;ist
          </li>
          <li>
            Removing any copyright or other proprietary notations from the
            materials
          </li>
          <li>
            Transferring the materials to another person or
            &quot;mirroring&quot; the materials on any other server
          </li>
        </ul>

        <h2>3. Disclaimer</h2>
        <p>
          The materials on Daa&apos;ist are provided on an &apos;as is&apos;
          basis. Daa&apos;ist makes no warranties, expressed or implied, and
          hereby disclaims and negates all other warranties including, without
          limitation, implied warranties or conditions of merchantability,
          fitness for a particular purpose, or non-infringement of intellectual
          property or other violation of rights.
        </p>

        <h2>4. Limitations</h2>
        <p>
          In no event shall Daa&apos;ist or its suppliers be liable for any
          damages (including, without limitation, damages for loss of data or
          profit, or due to business interruption) arising out of the use or
          inability to use the materials on Daa&apos;ist.
        </p>

        <h2>5. Accuracy of Materials</h2>
        <p>
          The materials appearing on Daa&apos;ist could include technical,
          typographical, or photographic errors. Daa&apos;ist does not warrant
          that any of the materials on Daa&apos;ist are accurate, complete, or
          current. Daa&apos;ist may make changes to the materials contained on
          its website at any time without notice.
        </p>

        <h2>6. Links</h2>
        <p>
          Daa&apos;ist has not reviewed all of the sites linked to its website
          and is not responsible for the contents of any such linked site. The
          inclusion of any link does not imply endorsement by Daa&apos;ist of
          the site. Use of any such linked website is at the user&apos;s own
          risk.
        </p>

        <h2>7. Modifications</h2>
        <p>
          Daa&apos;ist may revise these terms of service for our website at any
          time without notice. By using this website, you are agreeing to be
          bound by the then current version of these terms of service.
        </p>

        <h2>8. Contact</h2>
        <p>
          Email: <a href="mailto:support@daaist.com">support@daaist.com</a>
        </p>
      </section>
    </main>
  );
}
