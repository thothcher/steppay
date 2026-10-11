import Link from "next/link";
import { getUser } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui";
import { DocsMobileNav, DocsNav, DocsPager } from "./DocsNav";

export const metadata = { title: { default: "Documentation", template: "%s · StepPay Docs" } };

export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={28} />
          </Link>
          <span className="rounded-md bg-lime-200 px-2 py-0.5 text-[12px] font-bold text-forest-900">Docs</span>
          <div className="flex-1" />
          {user ? (
            <ButtonLink href="/portal/home" size="sm">
              Open portal
            </ButtonLink>
          ) : (
            <>
              <Link href="/login" className="hidden text-[14px] font-semibold text-ink-2 hover:text-ink sm:block">
                Sign in
              </Link>
              <ButtonLink href="/register" size="sm">
                Get API keys
              </ButtonLink>
            </>
          )}
        </div>
      </header>
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:py-12">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <DocsNav />
          </div>
        </aside>
        <main className="min-w-0">
          <DocsMobileNav />
          <article className="mx-auto max-w-[820px] pt-4 lg:pt-0">
            {children}
            <DocsPager />
          </article>
        </main>
      </div>
    </div>
  );
}
