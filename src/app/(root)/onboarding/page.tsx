import { auth } from "@/auth";
import OnboardingForm from "@/components/OnboardingForm";
import { redirect } from "next/navigation";

export default async function Onboarding() {
  const session = await auth();
  const onboarded = session?.user.onboarded;
  if (onboarded) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Section */}
      <div className="w-1/2 justify-center items-center hidden md:flex relative overflow-hidden">
        {/* Abstract Bauhaus shapes */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400 rounded-full" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-primary " />
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-primary " />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-6 bg-white" />
        <h1 className="text-foreground text-5xl font-bold z-10">DAA’ist</h1>
        {/* the loading component is causing a problem when its hidden for smaller screens  */}
        {/* <Loading /> */}
      </div>

      {/* Right Section */}
      <OnboardingForm />
    </div>
  );
}
