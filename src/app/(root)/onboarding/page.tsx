import { createClient } from "@/lib/supabase/server";
import OnboardingForm from "@/components/OnboardingForm";
import { isOnboarded } from "@/lib/supabase/actions";
import { redirect } from "next/navigation";
export const metadata = {
  title: "Daaist - Onboarding",
  description: "Onboarding page for Daaist",
  robots: {
    index: false,
    follow: false,
  },
};
export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const onboarded = await isOnboarded(user.id);

  if (onboarded) {
    redirect("/");
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white">
      <div className="relative w-full md:w-1/2 h-48 md:h-screen md:sticky md:top-0 bg-gray-50 overflow-hidden flex items-center justify-center transition-all duration-500 ease-in-out">
        {/* Decorative Circles (Using % to be responsive) */}
        <div className="absolute top-[-10%] left-[-10%] w-40 h-40 md:w-72 md:h-72 bg-yellow-400/80 rounded-full blur-2xl md:blur-3xl mix-blend-multiply" />
        <div className="absolute bottom-[-10%] right-[-5%] w-48 h-48 md:w-96 md:h-96 bg-primary/60 rounded-full blur-2xl md:blur-3xl mix-blend-multiply" />
        <div className="absolute top-[20%] right-[10%] w-24 h-24 md:w-40 md:h-40 bg-purple-400/50 rounded-full blur-xl mix-blend-multiply" />

        {/* Brand Text */}
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-gray-900 drop-shadow-sm">
            DAA’ist
          </h1>
          <p className="text-sm md:text-lg text-gray-600 font-medium mt-2 tracking-widest uppercase">
            Student Portal
          </p>
        </div>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-20 bg-background">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          <OnboardingForm />
        </div>
      </div>
    </div>
  );
}
