import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { LoginForm } from "../forms";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getUser()) redirect("/portal/home");
  const { next } = await searchParams;
  return (
    <div className="animate-fade-in">
      <h1 className="text-[30px] font-extrabold tracking-tight text-ink">Welcome back</h1>
      <p className="mb-8 mt-1.5 text-[15px] text-ink-2">Sign in to your merchant portal.</p>
      <LoginForm next={next} />
      <p className="mt-6 text-center text-[14px] text-ink-2">
        New here?{" "}
        <Link href="/register" className="font-semibold text-brand-700 hover:underline">
          Create a free account
        </Link>
      </p>
      <p className="mt-10 text-center text-[12.5px] text-ink-3">
        Forgot your password? Ask your lecturer — they can reset it from the Lecturer panel.
      </p>
    </div>
  );
}
