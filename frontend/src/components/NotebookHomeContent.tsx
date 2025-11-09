import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NotebookHomeContent = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <h1 className="text-4xl font-semibold tracking-tight text-slate-100 sm:text-5xl">
        Interlink
      </h1>
      <p className="max-w-xl text-balance text-lg text-slate-300">
        Welcome! Choose an option below to explore the notebook-inspired auth
        flows while the real backend is on deck.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        {isAuthenticated ? (
          <Link
            to="/profile"
            className="inline-flex items-center rounded-full bg-sky-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            View Profile
          </Link>
        ) : (
          <>
            <Link
              to="/login"
              className="inline-flex items-center rounded-full bg-sky-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center rounded-full border border-sky-400/60 bg-slate-900/60 px-6 py-3 text-base font-semibold text-sky-200 shadow-lg shadow-slate-950/40 transition hover:border-sky-300/60 hover:bg-slate-900/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300/40"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
      <p className="text-xs font-medium uppercase tracking-[0.4em] text-sky-200/80">
        Page 02
      </p>
    </>
  );
};

export default NotebookHomeContent;


