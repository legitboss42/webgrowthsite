import Image from "next/image";

export default function LoaderBrand() {
  return (
    <div
      className="relative flex flex-col items-center"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="loader-orbit-shell">
        <div className="loader-orbit-ring" />
        <div className="loader-orbit-track">
          <span className="loader-orbit-dot" />
        </div>

        <div className="loader-logo-wrap">
          <Image
            src="/images/brand/web-growth-logo.webp"
            alt="Web Growth"
            width={260}
            height={58}
            priority
            quality={60}
            className="h-auto w-[190px] md:w-[260px]"
          />
        </div>
      </div>

      <p className="mt-6 text-xs uppercase tracking-[0.28em] text-emerald-200/80">
        Loading
      </p>
    </div>
  );
}
