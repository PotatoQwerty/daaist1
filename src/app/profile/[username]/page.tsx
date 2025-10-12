import { supabaseCli } from "../../../../lib/supabase";
import Image from "next/image";
import Link from "next/link";
import PfpPlaceholder from "../../../../public/images/placeholder.png";
import IsDaa from "../../../../public/images/isdaa.svg";
import DaaistLogo from "../../../../public/images/DAAIST-LOGO.svg";
interface ProfilePageProps {
  params: Promise<{ username: string }>;
}
export async function generateMetadata({ params }: ProfilePageProps) {
  return {
    title: `${params.username}'s Profile | DAA’ist`,
  };
}
export default async function UserProfile({ params }: ProfilePageProps) {
  const { username } = await params;

  const { data: user, error } = await supabaseCli
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !user) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        <p>User not found 😕</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary to-[#f3f3f3] text-gray-900 flex flex-col items-center px-6 py-10">
      {/* ================= Header / Profile ================= */}
      <div className="relative w-full max-w-5xl bg-white shadow-lg rounded-3xl p-10 mb-10 flex flex-col md:flex-row justify-between items-center gap-8">
        {/* Decorative shapes (Bauhaus) */}
        <div className="absolute top-6 left-6 w-8 h-8 bg-secondary rounded-full" />
        <div className="absolute bottom-4 left-6 w-10 h-10 bg-primary rotate-45" />

        {/* Profile Info */}
        <div className="flex items-center gap-6">
          <Image
            src={user?.image || PfpPlaceholder}
            alt="Profile"
            width={100}
            height={100}
            className="rounded-full border-4 border-primary shadow-md"
          />
          <div className="w-full">
            <h1 className="text-3xl font-bold tracking-tight">{user?.name}</h1>
            <p className="text-gray-500">@{user?.username}</p>
            <div className="mt-2 flex items-center gap-3 w-full">
              <span className="text-sm font-medium bg-primary text-white px-3 py-1 rounded-full">
                5th Year (M2)
              </span>
              <span className="flex items-center gap-1 text-sm">
                <Image src={IsDaa} width={18} height={18} alt="isdaa" />
                <span>DAA’ist</span>
              </span>
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="hidden md:block">
          <Link href="/">
            <Image
              src={DaaistLogo}
              width={250}
              height={120}
              alt="DAA’ist Logo"
              className="opacity-90 hover:opacity-100 hover:scale-110 transition-all duration-300 ease-in-out"
            />
          </Link>
        </div>
      </div>

      {/* ================= Uploaded Posts ================= */}
      <section className="w-full max-w-5xl mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-primary uppercase tracking-wide">
            Uploaded Projects
          </h2>
          <button className="text-sm bg-secondary hover:bg-[#e6b800] text-black font-semibold px-4 py-2 rounded-full shadow cursor-pointer transition duration-300 ease-in-out">
            + Upload New
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition p-5 border border-gray-100"
            >
              <h3 className="text-lg font-bold mb-2">
                Poster Design Guide.pdf
              </h3>
              <p className="text-gray-500 text-sm mb-2">
                Uploaded 2 days ago · M1 Year
              </p>
              <div className="flex justify-between items-center mt-4">
                <span className="text-xs text-gray-400">File type: PDF</span>
                <button className="text-primary font-medium hover:underline">
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= Liked Posts ================= */}
      <section className="w-full max-w-5xl mb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-primary uppercase tracking-wide">
            Favorites
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition"
            >
              <div className="relative">
                <Image
                  src="/assets/sample-file.png"
                  alt="Liked File"
                  width={400}
                  height={200}
                  className="object-cover w-full h-40"
                />
                <div className="absolute top-2 right-2 bg-white rounded-full p-2 shadow">
                  <Image
                    src="/assets/heart-filled.svg"
                    width={18}
                    height={18}
                    alt="liked"
                  />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">
                  “Lighting Project.zip”
                </h3>
                <p className="text-sm text-gray-500">3rd year (L3)</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= Footer ================= */}
      <footer className="text-center text-sm text-gray-500 py-8">
        © 2025 DAA’ist
      </footer>
    </div>
  );
}
