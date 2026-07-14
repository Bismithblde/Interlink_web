import type { InputHTMLAttributes } from "react";

type AuthInputProps = {
  label: string;
  id: string;
} & InputHTMLAttributes<HTMLInputElement>;

const AuthInput = ({ label, id, className = "", ...rest }: AuthInputProps) => (
  <label className="grid gap-2" htmlFor={id}>
    <span className="text-sm font-medium text-zinc-200">
      {label}
    </span>
    <input
      id={id}
      className={`h-11 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 text-sm text-zinc-50 shadow-sm outline-none transition duration-200 placeholder:text-zinc-500 hover:border-white/20 focus:border-white/70 focus:ring-4 focus:ring-white/10 ${className}`}
      {...rest}
    />
  </label>
);

export default AuthInput;

