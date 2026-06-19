import type { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
  alignTop?: boolean;
  contentClassName?: string;
};

const AuthLayout = ({
  children,
  alignTop = false,
  contentClassName,
}: AuthLayoutProps) => {
  const containerClassNames = [
    "relative flex min-h-screen flex-col items-center overflow-hidden bg-[#0a0a0a] px-4 py-12 pb-24 text-zinc-50",
    alignTop ? "justify-start" : "justify-center",
  ]
    .filter(Boolean)
    .join(" ");

  const contentClassNames = [
    "relative z-10 flex w-full flex-col gap-8",
    contentClassName ? contentClassName : "max-w-xl",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClassNames}>
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[size:32px_32px]"
        aria-hidden="true"
      />
      <div className={contentClassNames}>{children}</div>
    </div>
  );
};

export default AuthLayout;

