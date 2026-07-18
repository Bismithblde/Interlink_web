import type { MatchRankingDebug as MatchRankingDebugData } from "../../services/findFriendApi";

type MatchRankingDebugProps = {
  debug: MatchRankingDebugData;
};

const score = (value: number) => value.toFixed(4);

const MatchRankingDebug = ({ debug }: MatchRankingDebugProps) => {
  const isExploration = debug.selectionMode === "exploration";

  return (
    <aside
      className={`match-ranking-debug match-ranking-debug--${debug.selectionMode}`}
      aria-label={`Ranking diagnostics for candidate ${debug.candidateId}`}
    >
      <header className="match-ranking-debug__header">
        <div>
          <span>Ranking trace v{debug.algorithmVersion}</span>
          <code>{debug.candidateId}</code>
        </div>
        <strong>{isExploration ? "Exploration boosted" : "Similarity ranked"}</strong>
      </header>

      <dl className="match-ranking-debug__scores">
        <div><dt>Final rank</dt><dd>{score(debug.finalRankScore)}</dd></div>
        <div><dt>Base rank</dt><dd>{score(debug.baseRankScore)}</dd></div>
        <div><dt>Display fit</dt><dd>{debug.compatibilityScore}%</dd></div>
        <div><dt>Confidence</dt><dd>{score(debug.confidence)}</dd></div>
        <div><dt>Profile affinity</dt><dd>{score(debug.profileAffinity)}</dd></div>
        <div><dt>Reciprocal affinity</dt><dd>{score(debug.reciprocalAffinity)}</dd></div>
        <div><dt>Tag affinity to them</dt><dd>{score(debug.tagAffinityTowardCandidate)}</dd></div>
        <div><dt>Tag affinity to you</dt><dd>{score(debug.tagAffinityTowardViewer)}</dd></div>
        <div><dt>Class Jaccard</dt><dd>{score(debug.classJaccard)}</dd></div>
        <div><dt>Graph score</dt><dd>{score(debug.graphScore)}</dd></div>
        <div><dt>Intent to them</dt><dd>{score(debug.intentTowardCandidate)}</dd></div>
        <div><dt>Intent to you</dt><dd>{score(debug.intentTowardViewer)}</dd></div>
        <div><dt>Directional to them</dt><dd>{score(debug.directionalTowardCandidate)}</dd></div>
        <div><dt>Directional to you</dt><dd>{score(debug.directionalTowardViewer)}</dd></div>
        <div><dt>Fatigue multiplier</dt><dd>{score(debug.fatigueMultiplier)}</dd></div>
        <div><dt>Exploration boost</dt><dd>{score(debug.explorationBoost)}</dd></div>
        <div><dt>Recent impressions</dt><dd>{debug.recentImpressions}</dd></div>
        <div><dt>Longest overlap</dt><dd>{debug.longestOverlapMinutes} min</dd></div>
        <div><dt>Total overlap</dt><dd>{debug.overlapMinutes} min</dd></div>
      </dl>

      <div className="match-ranking-debug__method">
        <div>
          <span>Similarity strategy</span>
          <code>{debug.similarityStrategy}</code>
        </div>
        <div>
          <span>Embedding similarity</span>
          <code>{debug.embeddingSimilarity === null ? "not used" : score(debug.embeddingSimilarity)}</code>
        </div>
        <div>
          <span>Shared canonical tags</span>
          <code>{debug.sharedTags.length ? debug.sharedTags.join(", ") : "none"}</code>
        </div>
      </div>

      <p className="match-ranking-debug__note">
        Profile affinity combines IDF-weighted tag overlap with class overlap. Final rank applies fatigue and any exploration boost to the base score. This path does not call an embedding model.
      </p>
    </aside>
  );
};

export default MatchRankingDebug;
