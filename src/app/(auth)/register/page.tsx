import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { RegisterForm } from "../forms";

export const metadata = { title: "Create account" };

export default async function RegisterPage() {
  if (await getUser()) redirect("/portal/home");
  return (
    <div className="animate-fade-in">
      <h1 className="text-[30px] font-extrabold tracking-tight text-ink">Create your account</h1>
      <p className="mb-8 mt-1.5 text-[15px] text-ink-2">Start accepting test payments on your project in minutes.</p>
      <RegisterForm needsCode={Boolean(process.env.REGISTRATION_CODE?.trim())} />
      <p className="mt-6 text-center text-[14px] text-ink-2">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
