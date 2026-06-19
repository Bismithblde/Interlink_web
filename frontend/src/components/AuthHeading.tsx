type AuthHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

const AuthHeading = ({ eyebrow, title, description }: AuthHeadingProps) => (
  <header className="flex flex-col gap-3 text-left">
    {eyebrow ? (
      <span className="text-sm font-medium text-zinc-400">
        {eyebrow}
      </span>
    ) : null}
    <h1 className="text-3xl font-semibold tracking-[-0.02em] text-zinc-50 sm:text-4xl">
      {title}
    </h1>
    {description ? (
      <p className="max-w-lg text-base leading-7 text-zinc-400">
        {description}
      </p>
    ) : null}
  </header>
);

export default AuthHeading;

