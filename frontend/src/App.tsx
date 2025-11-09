import { Route, Routes, useNavigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProfilePage from "./pages/ProfilePage";
import SchedulePage from "./pages/SchedulePage";
import SurveyPage from "./pages/SurveyPage";
import FindFriend from "./pages/FindFriend";
import { useAuth } from "./context/AuthContext";
import NotebookCanvas from "./components/NotebookCanvas";
import NotebookHomeContent from "./components/NotebookHomeContent";
import TopNav from "./components/TopNav";

const Home = () => {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-12%] top-[-18%] h-72 w-72 rounded-full bg-white/30 blur-3xl" />
        <div className="absolute bottom-[-18%] left-[-12%] h-96 w-96 rounded-full bg-cyan-200/40 blur-3xl" />
      </div>
      <div className="notebook-scene w-full max-w-3xl">
        <NotebookCanvas>
          <NotebookHomeContent />
        </NotebookCanvas>
      </div>
    </div>
  );
};

function App() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-sky-100 via-white to-sky-200 text-slate-900">
      <TopNav isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      <main className="flex flex-1 flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/survey" element={<SurveyPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/find-friends" element={<FindFriend />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
