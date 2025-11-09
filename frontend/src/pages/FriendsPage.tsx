import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { connectionsApi, ConnectionsApiError } from "../services/connectionsApi";
import { useAuth } from "../context/AuthContext";
import type { FriendEdge } from "../types/user";

const searchFilter = (friend: FriendEdge, term: string) => {
  const profile = friend.profile || { id: friend.id };
  const haystack = [
    profile.name,
    profile.email,
    profile.major,
    profile.favoriteSpot,
    profile.vibeCheck,
    ...(profile.hobbies ?? []),
    ...(profile.interests ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(term);
};

const FriendsPage = () => {
  const { session } = useAuth();
  const accessToken = session?.access_token ?? null;

  const [friends, setFriends] = useState<FriendEdge[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFriends = async () => {
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const graph = await connectionsApi.getFriendGraph(accessToken);
        setFriends(graph.friends);
      } catch (err) {
        const message =
          err instanceof ConnectionsApiError
            ? err.message
            : err instanceof Error
            ? err.message
            : "Unable to load friends.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadFriends();
  }, [accessToken]);

  const filteredFriends = useMemo(() => {
    const trimmed = searchTerm.trim().toLowerCase();
    if (!trimmed) return friends;
    return friends.filter((friend) => searchFilter(friend, trimmed));
  }, [friends, searchTerm]);

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-slate-950" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),transparent_55%)]" />

      <header className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold text-slate-50">Your friends</h1>
        <p className="text-sm text-slate-400">
          Browse your current connections and search by name, major, or shared interests.
        </p>
        <div className="flex flex-col gap-3 rounded-3xl border border-slate-800/70 bg-slate-900/60 p-4 shadow-slate-950/30 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name, major, hobby..."
            className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-600"
          />
          <span className="text-xs uppercase tracking-[0.35em] text-slate-500">
            {filteredFriends.length} friend{filteredFriends.length === 1 ? "" : "s"}
          </span>
        </div>
      </header>

      {isLoading ? (
        <section className="flex flex-col gap-4 rounded-3xl border border-slate-800/70 bg-slate-900/70 p-6 text-sm text-slate-300">
          <span className="text-xs uppercase tracking-[0.35em] text-slate-500">
            Loading friends…
          </span>
          <div className="grid gap-3 md:grid-cols-2">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-800/60" />
            ))}
          </div>
        </section>
      ) : error ? (
        <section className="rounded-3xl border border-rose-500/40 bg-rose-900/40 p-6 text-sm text-rose-200">
          <h2 className="text-lg font-semibold text-rose-100">Unable to load friends</h2>
          <p className="mt-2">{error}</p>
        </section>
      ) : filteredFriends.length === 0 ? (
        <section className="rounded-3xl border border-slate-800/70 bg-slate-900/70 p-6 text-sm text-slate-300">
          <p>
            {friends.length === 0
              ? "You haven't added any friends yet. Send a connection request from your match results to get started."
              : "No friends match your search. Try a different name or keyword."}
          </p>
        </section>
      ) : (
        <section className="grid gap-5 md:grid-cols-2">
          {filteredFriends.map((friend) => {
            const profile = friend.profile || { id: friend.id };
            const title = profile.name || profile.email || "Friend";
            const subtitle = profile.major || profile.vibeCheck || "Connection";
            const hobbies = profile.hobbies ?? [];
            const interests = profile.interests ?? [];

            return (
              <article
                key={`${friend.id}-${friend.friendId ?? friend.requestId ?? "card"}`}
                className="flex flex-col gap-4 rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/50 transition hover:-translate-y-[2px] hover:border-sky-500/40 hover:shadow-sky-500/20"
              >
                <header className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold text-slate-50">{title}</h2>
                  <span className="text-xs uppercase tracking-[0.35em] text-slate-500">
                    {subtitle}
                  </span>
                  {profile.email && (
                    <span className="text-xs text-slate-400">{profile.email}</span>
                  )}
                </header>

                {(hobbies.length > 0 || interests.length > 0) && (
                  <div className="flex flex-wrap gap-2">
                    {[...hobbies.slice(0, 4), ...interests.slice(0, 2)].map((tag) => (
                      <span
                        key={`${friend.id}-${tag}`}
                        className="inline-flex items-center rounded-full bg-slate-800/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {friend.since && (
                  <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
                    Friends since {new Date(friend.since).toLocaleDateString()}
                  </p>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
};

export default FriendsPage;
