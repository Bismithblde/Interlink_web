import type { InputHTMLAttributes } from "react";

type AuthInputProps = {
  label: string;
  id: string;
} & InputHTMLAttributes<HTMLInputElement>;

const AuthInput = ({ label, id, className = "", ...rest }: AuthInputProps) => (
  <label className="flex items-center gap-6" htmlFor={id}>
    <span className="w-32 shrink-0 text-xs uppercase tracking-wide text-slate-400">
      {label}
    </span>
    <input
      id={id}
      className={`flex-1 rounded-full border border-dashed border-slate-600 bg-slate-900/60 px-6 py-3 text-slate-100 shadow-inner shadow-slate-950/40 outline-none transition hover:border-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40 ${className}`}
      {...rest}
    />
  </label>
);

export default AuthInput;

