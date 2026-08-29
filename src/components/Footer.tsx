import Link from "next/link";

const SECTIONS = [
  {
    heading: "Study",
    links: [
      { href: "/courses", label: "Courses" },
      { href: "/docs", label: "Documents" },
      { href: "/tools", label: "Tools" },
    ],
  },
  {
    heading: "Community",
    links: [
      { href: "/club", label: "Clubs" },
      { href: "/projects", label: "Projects" },
      { href: "/register", label: "Event passes" },
    ],
  },
  {
    heading: "About",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
    ],
  },
];

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="rule-t mt-24 bg-background">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-sm">
            <p className="text-lg font-bold">Daa&apos;ist</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Coursework, documents, clubs and events for students at the
              Département d&apos;Architecture d&apos;Alger. Built and maintained
              by the Archibénévoles club.
            </p>
          </div>

          {SECTIONS.map((section) => (
            <nav key={section.heading} aria-label={section.heading}>
              <h2 className="annot">{section.heading}</h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="rule-t mt-12 flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Daa&apos;ist
          </p>
          <a
            href="mailto:support@daaist.com"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            support@daaist.com
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
