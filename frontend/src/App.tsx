import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import TopNav from "./components/TopNav";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SchedulePage = lazy(() => import("./pages/SchedulePage"));
const SurveyPage = lazy(() => import("./pages/SurveyPage"));
const FriendsPage = lazy(() => import("./pages/FriendsPage"));
const HangoutPlanner = lazy(() => import("./pages/HangoutPlanner"));

const routeFallback = (
  <div className="flex flex-1 items-center justify-center bg-[#0a0a0a] px-6 py-24 text-zinc-400">
    <div className="flex w-full max-w-sm flex-col gap-3" aria-label="Loading page">
      <span className="h-12 rounded-2xl bg-white/10" />
      <span className="h-4 rounded-full bg-white/8" />
      <span className="h-4 w-2/3 rounded-full bg-white/8" />
    </div>
  </div>
);

function App() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, session } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#0a0a0a] text-zinc-50">
      <TopNav
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        accessToken={session?.access_token ?? null}
      />
      <main className="flex flex-1 flex-col">
        <Suspense fallback={routeFallback}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/survey" element={<SurveyPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/find-friends" element={<Navigate replace to="/" />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/hangout-planner" element={<HangoutPlanner />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default App;
