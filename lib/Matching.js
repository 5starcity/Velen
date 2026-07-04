/**
 * Roommate matching engine.
 *
 * Two-sided profile model:
 *   profile.isFields   -> "who I am"        (e.g. sleepSchedule: 'early')
 *   profile.wantFields -> "who I want"      (e.g. sleepSchedule: 'early')
 *
 * Hard filters exclude a pair entirely (budget, gender pref, move-in window,
 * location/campus). Soft categories are scored and weighted.
 *
 * This runs server-side in production (Cloud Function on profile write, or
 * on-demand), cached to matchScores/{uidA}_{uidB} in Firestore. Do not
 * recompute on every render.
 */

 export const CATEGORY_WEIGHTS = {
    sleepSchedule: 0.22,
    cleanliness: 0.22,
    noiseTolerance: 0.16,
    studyHabits: 0.14,
    socialStyle: 0.14,
    guestPolicy: 0.12,
  };
  
  export const CATEGORY_LABELS = {
    sleepSchedule: 'Sleep schedule',
    cleanliness: 'Cleanliness',
    noiseTolerance: 'Noise tolerance',
    studyHabits: 'Study habits',
    socialStyle: 'Social style',
    guestPolicy: 'Guests',
  };
  
  // Ordinal scales so "close but not identical" still scores partial credit
  // instead of a binary match/no-match.
  const SCALES = {
    sleepSchedule: ['early', 'flexible', 'late'],
    cleanliness: ['very_tidy', 'tidy', 'relaxed', 'messy'],
    noiseTolerance: ['quiet', 'moderate', 'lively'],
    studyHabits: ['room', 'mixed', 'library'],
    socialStyle: ['introvert', 'ambivert', 'extrovert'],
    guestPolicy: ['rarely', 'sometimes', 'often'],
  };
  
  function ordinalSimilarity(scaleKey, a, b) {
    const scale = SCALES[scaleKey];
    if (!scale || a == null || b == null) return 0.5;
    const iA = scale.indexOf(a);
    const iB = scale.indexOf(b);
    if (iA === -1 || iB === -1) return 0.5;
    const maxDist = scale.length - 1;
    return 1 - Math.abs(iA - iB) / maxDist;
  }
  
  /**
   * Hard filters — run first, exclude before any scoring happens.
   * Returns { passes: boolean, reason?: string }
   */
  export function passesHardFilters(userA, userB) {
    if (userA.budgetMin > userB.budgetMax || userB.budgetMin > userA.budgetMax) {
      return { passes: false, reason: 'budget_mismatch' };
    }
    if (userA.genderPref && userA.genderPref !== 'any' && userA.genderPref !== userB.gender) {
      return { passes: false, reason: 'gender_pref' };
    }
    if (userB.genderPref && userB.genderPref !== 'any' && userB.genderPref !== userA.gender) {
      return { passes: false, reason: 'gender_pref' };
    }
    if (userA.campus && userB.campus && userA.campus !== userB.campus) {
      return { passes: false, reason: 'campus_mismatch' };
    }
    return { passes: true };
  }
  
  /**
   * Scores one direction of "wants" against the other person's "is" for a
   * single soft category, then the algorithm averages both directions.
   */
  function categoryScore(category, userA, userB) {
    const aWantsBIs = ordinalSimilarity(category, userA.wantFields[category], userB.isFields[category]);
    const bWantsAIs = ordinalSimilarity(category, userB.wantFields[category], userA.isFields[category]);
    return (aWantsBIs + bWantsAIs) / 2;
  }
  
  /**
   * Main entry point. Returns overall score (0-100), per-category breakdown
   * for the ring, and the top human-readable reasons for the card copy.
   */
  export function computeMatch(userA, userB) {
    const hardFilter = passesHardFilters(userA, userB);
    if (!hardFilter.passes) {
      return { eligible: false, reason: hardFilter.reason };
    }
  
    const segments = Object.keys(CATEGORY_WEIGHTS).map((key) => {
      const score = categoryScore(key, userA, userB);
      return { key, label: CATEGORY_LABELS[key], score, weight: CATEGORY_WEIGHTS[key] };
    });
  
    const weightedSum = segments.reduce((sum, s) => sum + s.score * s.weight, 0);
    const overallScore = Math.round(weightedSum * 100);
  
    const topReasons = [...segments]
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .filter((s) => s.score > 0.75)
      .map((s) => reasonCopy(s.key, userA, userB));
  
    return {
      eligible: true,
      overallScore,
      segments,
      topReasons,
    };
  }
  
  function reasonCopy(key, userA, userB) {
    const copy = {
      sleepSchedule: 'You both keep a similar sleep schedule',
      cleanliness: 'Similar standards for tidiness',
      noiseTolerance: 'Compatible noise preferences',
      studyHabits: 'You study the same way',
      socialStyle: 'Similar social energy',
      guestPolicy: 'Aligned on having guests over',
    };
    return copy[key] || 'Good overall fit';
  }
  
  /**
   * Rank a list of candidate profiles against the current user, filtering
   * out anyone who fails hard filters, sorted best-match first.
   */
  export function rankCandidates(currentUser, candidates) {
    return candidates
      .map((candidate) => ({ candidate, match: computeMatch(currentUser, candidate) }))
      .filter((entry) => entry.match.eligible)
      .sort((a, b) => b.match.overallScore - a.match.overallScore);
  }