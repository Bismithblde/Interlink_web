import { Link, useLocation } from "react-router-dom";
import { UserCircle2 } from "lucide-react";

type TopNavProps = {
  isAuthenticated: boolean;
  onLogout: () => void;
  accessToken?: string | null;
};

const TopNav = ({ isAuthenticated, onLogout }: TopNavProps) => {
  const location = useLocation();
  const isAuthEntryPage = ["/login", "/signup"].includes(location.pathname);

  const shellClassName = [
    "match-member-nav",
    isAuthenticated ? "match-member-nav--member" : "",
    !isAuthenticated ? "match-member-nav--public" : "",
    !isAuthenticated && !isAuthEntryPage ? "match-member-nav--landing" : "",
    isAuthEntryPage ? "match-member-nav--inverse" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={shellClassName}>
      <div className="match-member-nav__inner">
        <Link to="/" className="match-member-nav__brand landing-display">
          Interlink
        </Link>

        {isAuthenticated ? (
          <nav className="match-member-nav__links" aria-label="Member navigation">
            <Link
              to="/schedule"
              className={location.pathname === "/schedule" ? "is-active" : undefined}
              aria-current={location.pathname === "/schedule" ? "page" : undefined}
            >
              Schedule
            </Link>
            <Link
              to="/friends"
              className={location.pathname === "/friends" ? "is-active" : undefined}
              aria-current={location.pathname === "/friends" ? "page" : undefined}
            >
              Connections
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="match-member-nav__signout"
            >
              Sign out
            </button>
            <Link
              to="/profile"
              className="match-member-nav__profile"
              aria-label="Open profile"
              aria-current={location.pathname === "/profile" ? "page" : undefined}
            >
              <UserCircle2 aria-hidden="true" />
            </Link>
          </nav>
        ) : isAuthEntryPage ? (
          <nav className="match-member-nav__links" aria-label="Account navigation">
            <Link to={location.pathname === "/signup" ? "/login" : "/signup"}>
              {location.pathname === "/signup" ? "Log in" : "Create account"}
            </Link>
          </nav>
        ) : (
          <nav className="match-member-nav__links" aria-label="Landing navigation">
            {location.pathname === "/" ? <a href="#how-it-works">How it works</a> : null}
            <Link to="/signup" className="match-member-nav__cta">
              Find your people
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default TopNav;
