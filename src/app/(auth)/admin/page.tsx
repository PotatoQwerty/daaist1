import { auth } from "@/auth";
import { redirect } from "next/navigation";
export default async function AdminPage() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">Admin dashboard</h1>
      <p>this page is still under construction</p>
    </div>
  );
}
