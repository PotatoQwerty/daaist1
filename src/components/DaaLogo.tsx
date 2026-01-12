"use client";
import Image from "next/image";
import { useTheme } from "next-themes";
import DaaLogoDark from "../../public/images/daalogodark.svg";
import DaaLogoLight from "../../public/images/DAAIST-LOGO.svg";
import Link from "next/link";
export default function DaaLogo() {
  const { theme } = useTheme();
  return (
    <Link href="/">
      <Image
        src={theme == "dark" ? DaaLogoDark : DaaLogoLight}
        height={250}
        width={250}
        alt="daa logo"
        loading="eager"
        className="opacity-90 hover:opacity-100 hover:scale-110 transition-all duration-300 ease-in-out"
      />
    </Link>
  );
}
