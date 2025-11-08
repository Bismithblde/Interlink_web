const LoginPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-16 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/60 p-8 shadow-xl shadow-blue-500/10 backdrop-blur">
        <h1 className="text-3xl font-semibold tracking-tight">Login</h1>
        <p className="mt-2 text-sm text-slate-400">
          This is a placeholder login screen. Replace the contents with your
          form and authentication logic when ready.
        </p>
        <div className="mt-8 rounded-lg border border-dashed border-white/10 bg-slate-900/40 p-6 text-center text-sm text-slate-500">
          <p>Login form goes here.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

