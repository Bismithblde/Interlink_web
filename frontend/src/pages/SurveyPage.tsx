import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SurveyPage = () => {
  const location = useLocation();
  const { user } = useAuth();

  return user ? (
    <Navigate replace to="/signup?step=profile&edit=1" state={location.state} />
  ) : (
    <Navigate
      replace
      to="/login"
      state={{ redirectTo: "/signup?step=profile&edit=1" }}
    />
  );
};

export default SurveyPage;
