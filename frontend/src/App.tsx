import { Route, Routes, useNavigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProfilePage from "./pages/ProfilePage";
import SchedulePage from "./pages/SchedulePage";
import SurveyPage from "./pages/SurveyPage";
import FindFriend from "./pages/FindFriend";
import { useAuth } from "./context/AuthContext";
import DashboardPage from "./pages/DashboardPage";
import TopNav from "./components/TopNav";
import FriendsPage from "./pages/FriendsPage";

function App() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, session } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <TopNav
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        accessToken={session?.access_token ?? null}
      />
      <main className="flex flex-1 flex-col">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/survey" element={<SurveyPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/find-friends" element={<FindFriend />} />
          <Route path="/friends" element={<FriendsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
