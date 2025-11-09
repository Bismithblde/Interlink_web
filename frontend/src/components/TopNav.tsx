import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  CalendarDays,
  LayoutDashboard,
  LogIn,
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
      "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition",
      isActive
        ? "bg-sky-500/20 text-white shadow-lg shadow-sky-900/40"
        : "text-slate-300 hover:bg-slate-800/60 hover:text-white",
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
    <header className="relative border-b border-slate-800/70 bg-gradient-to-br from-slate-950 via-slate-900/95 to-slate-950 shadow-lg shadow-slate-950/40 backdrop-blur">
      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-3 text-lg font-semibold text-slate-100"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-600 via-sky-500 to-cyan-400 text-white shadow-md shadow-cyan-500/40">
            <LayoutDashboard className="h-5 w-5" />
          </span>
          <span className="hidden sm:inline-block">Interlink</span>
        </Link>

        <nav className="flex items-center gap-2 text-sm font-medium text-slate-300 sm:gap-3">
          <NavLink to="/" className={navLinkClassName}>
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/find-friends" className={navLinkClassName}>
                <UsersRound className="h-4 w-4" />
                <span className="hidden sm:inline">Matches</span>
              </NavLink>
              <NavLink to="/schedule" className={navLinkClassName}>
                <CalendarDays className="h-4 w-4" />
                <span className="hidden sm:inline">Schedule</span>
              </NavLink>
              <NavLink to="/profile" className={navLinkClassName}>
                <UserCircle2 className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </NavLink>
              <NavLink to="/friends" className={navLinkClassName}>
                <UsersRound className="h-4 w-4" />
                <span className="hidden sm:inline">Friends</span>
              </NavLink>
              <NavLink to="/hangout-planner" className={navLinkClassName}>
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
                    <div className="w-64 max-w-[85vw] rounded-2xl border border-slate-800/70 bg-slate-950/95 p-4 text-slate-100 shadow-xl shadow-slate-950/40">
                      <header className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-100">
                          Connection inbox
                        </span>
                        <button
                          type="button"
                          onClick={handleClosePopover}
                          className="rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400 transition hover:bg-slate-800/80 hover:text-white"
                        >
                          Close
                        </button>
                      </header>
                      {isInboxLoading ? (
                        <p className="text-xs text-slate-300">Loading inbox…</p>
                      ) : inboxError ? (
                        <p className="text-xs text-rose-300">{inboxError}</p>
                      ) : !inboxData ? (
                        <p className="text-xs text-slate-300">
                          Sign in to view your inbox.
                        </p>
                      ) : (
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/60 px-3 py-2">
                            <span className="font-semibold uppercase tracking-[0.3em] text-slate-400">
                              Incoming
                            </span>
                            <span className="text-slate-200">
                              {inboxData.incomingRequests.length}
                            </span>
                          </div>
                          <div className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/60 px-3 py-2">
                            <span className="font-semibold uppercase tracking-[0.3em] text-slate-400">
                              Outgoing
                            </span>
                            <span className="text-slate-200">
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
                    className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800/70 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                  >
                    Inbox
                  </button>
                </Popover>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-rose-500/20 hover:text-rose-300"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navLinkClassName}>
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Log in</span>
              </NavLink>
              <NavLink to="/signup" className={navLinkClassName}>
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Create account</span>
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default TopNav;
