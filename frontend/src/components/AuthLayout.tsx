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
    "relative flex min-h-screen flex-col items-center overflow-hidden bg-gradient-to-b from-sky-200 via-sky-300/90 to-sky-500 px-4 py-12 pb-24 text-slate-900",
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
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute right-[-12%] top-[-18%] h-72 w-72 rounded-full bg-white/30 blur-3xl" />
      <div className="absolute bottom-[-18%] left-[-12%] h-96 w-96 rounded-full bg-cyan-200/40 blur-3xl" />
    </div>
      <div className={contentClassNames}>{children}</div>
    </div>
  );
};

export default AuthLayout;

