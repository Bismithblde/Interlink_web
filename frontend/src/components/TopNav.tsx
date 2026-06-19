import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
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
