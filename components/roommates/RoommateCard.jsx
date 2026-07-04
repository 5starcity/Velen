'use client';

import CompatibilityRing from './CompatibilityRing';

export default function RoommateCard({ candidate, match, onViewProfile, onExpressInterest }) {
  const ringSegments = match.segments.map((s) => ({ label: s.label, score: s.score }));

  return (
    <article className="roommate-card">
      <div className="roommate-card__top">
        <CompatibilityRing segments={ringSegments} overallScore={match.overallScore} />
        <div className="roommate-card__identity">
          <div className="roommate-card__avatar">{candidate.avatarInitials}</div>
          <div>
            <h3 className="roommate-card__name">{candidate.name}</h3>
            <p className="roommate-card__meta">{candidate.level} &middot; {candidate.school}</p>
          </div>
        </div>
      </div>

      <p className="roommate-card__budget">
        ₦{candidate.budgetMin.toLocaleString()} &ndash; ₦{candidate.budgetMax.toLocaleString()} / year
      </p>

      {match.topReasons.length > 0 && (
        <ul className="roommate-card__reasons">
          {match.topReasons.map((reason, i) => (
            <li key={i} className="roommate-card__reason-chip">
              {reason}
            </li>
          ))}
        </ul>
      )}

      <div className="roommate-card__actions">
        <button
          type="button"
          className="roommate-card__btn roommate-card__btn--secondary"
          onClick={() => onViewProfile(candidate)}
        >
          View profile
        </button>
        <button
          type="button"
          className="roommate-card__btn roommate-card__btn--primary"
          onClick={() => onExpressInterest(candidate)}
        >
          Express interest
        </button>
      </div>
    </article>
  );
}