import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  CalendarDays,
  LayoutDashboard,
  Link2,
  LogIn,
  Menu,
  Sparkles,
  UserCircle2,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { Popover } from "react-tiny-popover";
import {
  ConnectionsApiError,
  connectionsApi,
} from "../services/connectionsApi";
import type { FriendInbox } from "../types/user";

type TopNavProps = {
  isAuthenticated: boolean;
  onLogout: () => void;
  accessToken?: string | null;
};

const TopNav = ({
  isAuthenticated,
  onLogout,
  accessToken = null,
}: TopNavProps) => {
  const location = useLocation();
  const isLandingPage = !isAuthenticated && location.pathname === "/";
  const usesMemberNav =
    isAuthenticated && ["/", "/schedule"].includes(location.pathname);
  const isAuthEntryPage =
    !isAuthenticated && ["/login", "/signup"].includes(location.pathname);

  const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
    [
      "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]",
      isActive
        ? "bg-zinc-800 text-zinc-50 shadow-sm shadow-black/20"
        : "text-zinc-400 hover:bg-white/8 hover:text-zinc-50",
    ].join(" ");

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isInboxLoading, setInboxLoading] = useState(false);
  const [inboxError, setInboxError] = useState<string | null>(null);
  const [inboxData, setInboxData] = useState<FriendInbox | null>(null);
  const inboxButtonRef = useRef<HTMLButtonElement | null>(null);

  const resetInboxState = useCallback(() => {
    setInboxData(null);
    setInboxError(null);
    setIsPopoverOpen(false);
  }, []);

  useEffect(() => {
    resetInboxState();
  }, [accessToken, resetInboxState]);

  const loadInbox = useCallback(async () => {
    if (!accessToken) {
      setInboxData(null);
      setInboxError("Sign in to view connection requests.");
      return;
    }

    setInboxLoading(true);
    try {
      const data = await connectionsApi.getInbox(accessToken);
      setInboxData(data);
      setInboxError(null);
    } catch (error) {
      const message =
        error instanceof ConnectionsApiError
          ? error.message
          : error instanceof Error
          ? error.message
          : "Unable to load your inbox right now.";
      setInboxError(message);
      setInboxData(null);
    } finally {
      setInboxLoading(false);
    }
  }, [accessToken]);

  const handleInboxButtonClick = useCallback(() => {
    setIsPopoverOpen((prev) => {
      const next = !prev;
      if (next) {
        void loadInbox();
      }
      return next;
    });
  }, [loadInbox]);

  const handleClosePopover = useCallback(() => {
    setIsPopoverOpen(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      return;
    }
    void loadInbox();
  }, [isAuthenticated, accessToken, loadInbox]);

  if (usesMemberNav) {
    return (
      <header
        className={
          location.pathname === "/schedule"
            ? "match-member-nav match-member-nav--schedule"
            : "match-member-nav"
        }
      >
        <div className="match-member-nav__inner">
          <Link
            to="/"
            className="match-member-nav__brand landing-display"
          >
            Interlink
          </Link>
          <nav className="match-member-nav__links" aria-label="Dashboard navigation">
            <Link
              to="/schedule"
              className={location.pathname === "/schedule" ? "is-active" : undefined}
              aria-current={location.pathname === "/schedule" ? "page" : undefined}
            >
              Schedule
            </Link>
            <Link to="/friends">
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
            >
              <UserCircle2 aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  if (isLandingPage) {
    return (
      <header className="absolute inset-x-0 top-0 z-40 text-[#171817]">
        <div className="mx-auto flex h-24 w-full max-w-[96rem] items-center justify-between gap-6 px-5 sm:px-8 lg:px-10">
          <Link
            to="/"
            className="landing-display rounded-sm text-[2rem] leading-none tracking-[-0.05em] transition-opacity hover:opacity-65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#171817]"
          >
            Interlink
          </Link>
          <nav className="flex items-center gap-3 sm:gap-7" aria-label="Landing navigation">
            <a
              href="#how-it-works"
              className="hidden rounded-sm text-sm font-medium transition-opacity hover:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#171817] sm:inline"
            >
              How it works
            </a>
            <Link
              to="/signup"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#171817] px-5 text-sm font-semibold text-[#f2eee4] shadow-[0_18px_45px_-24px_rgba(23,24,23,0.75)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#292a27] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#171817] active:translate-y-px"
            >
              Find your people
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  if (isAuthEntryPage) {
    const isSignupPage = location.pathname === "/signup";

    return (
      <header className="absolute inset-x-0 top-0 z-40 text-[#f7f3eb]">
        <div className="mx-auto flex h-24 w-full max-w-[96rem] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link
            to="/"
            className="landing-display rounded-sm text-[2rem] leading-none tracking-[-0.05em] transition-opacity hover:opacity-65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Interlink
          </Link>
          <Link
            to={isSignupPage ? "/login" : "/signup"}
            className="rounded-sm text-sm font-medium transition-opacity hover:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            {isSignupPage ? "Log in" : "Create account"}
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#09090b] shadow-sm shadow-black/30">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 rounded-lg text-base font-semibold tracking-[-0.01em] text-zinc-50 transition hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-zinc-900 text-zinc-50 shadow-sm shadow-black/20">
            <Link2 className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">Interlink</span>
        </Link>

        <nav className="flex max-w-[78vw] items-center gap-1 overflow-x-auto rounded-xl border border-white/10 bg-zinc-950 p-1 shadow-sm shadow-black/20">
          <NavLink to="/" className={navLinkClassName} aria-label="Dashboard">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink
                to="/find-friends"
                className={navLinkClassName}
                aria-label="Matches"
              >
                <UsersRound className="h-4 w-4" />
                <span className="hidden sm:inline">Matches</span>
              </NavLink>
              <NavLink
                to="/schedule"
                className={navLinkClassName}
                aria-label="Schedule"
              >
                <CalendarDays className="h-4 w-4" />
                <span className="hidden sm:inline">Schedule</span>
              </NavLink>
              <NavLink
                to="/profile"
                className={navLinkClassName}
                aria-label="Profile"
              >
                <UserCircle2 className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </NavLink>
              <NavLink
                to="/friends"
                className={navLinkClassName}
                aria-label="Friends"
              >
                <UsersRound className="h-4 w-4" />
                <span className="hidden sm:inline">Friends</span>
              </NavLink>
              <NavLink
                to="/hangout-planner"
                className={navLinkClassName}
                aria-label="Hangout planner"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Hangout</span>
              </NavLink>
              <div className="relative">
                <Popover
                  isOpen={isPopoverOpen}
                  positions={["bottom", "left", "right"]}
                  align="end"
                  padding={8}
                  onClickOutside={handleClosePopover}
                  content={
                    <div className="w-72 max-w-[85vw] rounded-2xl border border-white/10 bg-zinc-950 p-4 text-zinc-50 shadow-xl shadow-black/40">
                      <header className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-semibold">
                          Connection inbox
                        </span>
                        <button
                          type="button"
                          onClick={handleClosePopover}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-400 transition hover:bg-white/8 hover:text-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        >
                          Close
                        </button>
                      </header>
                      {isInboxLoading ? (
                        <div className="space-y-2" aria-label="Loading inbox">
                          <span className="block h-9 rounded-xl bg-white/10" />
                          <span className="block h-9 rounded-xl bg-white/8" />
                        </div>
                      ) : inboxError ? (
                        <p className="text-xs text-red-300">{inboxError}</p>
                      ) : !inboxData ? (
                        <p className="text-xs text-zinc-400">
                          Sign in to view your inbox.
                        </p>
                      ) : (
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                            <span className="font-medium text-zinc-400">
                              Incoming
                            </span>
                            <span className="font-semibold text-zinc-50">
                              {inboxData.incomingRequests.length}
                            </span>
                          </div>
                          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                            <span className="font-medium text-zinc-400">
                              Outgoing
                            </span>
                            <span className="font-semibold text-zinc-50">
                              {inboxData.outgoingRequests.length}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  }
                >
                  <button
                    type="button"
                    ref={inboxButtonRef}
                    onClick={handleInboxButtonClick}
                    className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-zinc-400 transition duration-200 hover:bg-white/8 hover:text-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
                  >
                    <Menu className="h-4 w-4 sm:hidden" />
                    <span className="hidden sm:inline">Inbox</span>
                  </button>
                </Popover>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-zinc-400 transition duration-200 hover:bg-red-500/10 hover:text-red-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300 active:scale-[0.98]"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navLinkClassName} aria-label="Log in">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Log in</span>
              </NavLink>
              <NavLink
                to="/signup"
                className={navLinkClassName}
                aria-label="Create account"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Sign up</span>
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default TopNav;
