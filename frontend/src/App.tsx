import { Link, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";

const Home = () => (
  <div className="mx-auto flex max-w-4xl flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
    <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
      Interlink
    </h1>
    <p className="max-w-xl text-balance text-lg text-slate-400">
      Welcome! Use the link below to open the login screen. This is just a
      placeholder layout while authentication is being wired up.
    </p>
    <Link
      to="/login"
      className="inline-flex items-center rounded-full bg-blue-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
    >
      Go to Login
    </Link>
  </div>
);

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-white/5 bg-slate-950/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-xl font-semibold text-white">
            Interlink
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-300">
            <Link
              to="/"
              className="rounded-full px-3 py-1 transition hover:text-white"
            >
              Home
            </Link>
            <Link
              to="/login"
              className="rounded-full px-3 py-1 transition hover:text-white"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex flex-1 flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </main>
      <footer className="border-t border-white/5 bg-slate-950/40 py-4 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Interlink. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
