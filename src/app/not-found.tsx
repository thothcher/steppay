import { ButtonLink } from "@/components/ui";
import { LogoMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="text-center">
        <LogoMark size={48} inverted />
        <div className="mt-6 text-[64px] font-extrabold leading-none tracking-tight text-forest-900">404</div>
        <h1 className="mt-2 text-[20px] font-bold">This page does not exist</h1>
        <p className="mt-1 text-[14.5px] text-ink-2">The link may be wrong or the payment may belong to another account.</p>
        <div className="mt-6 flex justify-center gap-2">
          <ButtonLink href="/">Home</ButtonLink>
          <ButtonLink href="/docs" variant="secondary">
            Docs
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
