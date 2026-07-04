import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Roommate profile data lives under a namespaced `roommateProfile` map on
 * each user doc, e.g:
 *
 * users/{uid} = {
 *   ...existing fields (email, role, etc),
 *   roommateProfile: {
 *     isFields: { sleepSchedule, cleanliness, noiseTolerance, studyHabits, socialStyle, guestPolicy },
 *     wantFields: { same keys },
 *     budgetMin, budgetMax, gender, genderPref, campus,
 *     displayName, level, school,
 *   }
 * }
 *
 * Namespacing under roommateProfile avoids colliding with unrelated fields
 * already on the user doc, and lets us cheaply query "who has opted in"
 * without a schema migration on the whole users collection.
 *
 * Until onboarding for isFields/wantFields ships, most docs won't have
 * this map at all — normalizeProfile() below returns null for those,
 * and callers filter them out rather than matching on missing data.
 */

function normalizeProfile(uid, data) {
  const rp = data?.roommateProfile;
  if (!rp || !rp.isFields || !rp.wantFields) {
    return null; // hasn't completed the matching profile yet
  }

  return {
    uid,
    name: rp.displayName || data.displayName || 'Student',
    level: rp.level || '',
    school: rp.school || '',
    gender: rp.gender || null,
    genderPref: rp.genderPref || 'any',
    campus: rp.campus || null,
    budgetMin: rp.budgetMin ?? 0,
    budgetMax: rp.budgetMax ?? Infinity,
    avatarInitials: (rp.displayName || data.displayName || 'S')
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    isFields: rp.isFields,
    wantFields: rp.wantFields,
  };
}

/**
 * Fetch the current user's matching profile. Returns null if they haven't
 * completed the roommate-matching onboarding fields yet — callers should
 * show a "complete your profile" prompt in that case, not an error.
 */
export async function fetchCurrentUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return normalizeProfile(uid, snap.data());
}

/**
 * Fetch candidate profiles on the same campus, excluding the current user.
 * Firestore can't query "budget range overlaps" directly, so campus is the
 * only server-side filter — budget and everything else is filtered
 * client-side inside rankCandidates()/passesHardFilters().
 */
export async function fetchCandidateProfiles(campus, excludeUid) {
  const usersRef = collection(db, 'users');
  const q = campus
    ? query(usersRef, where('roommateProfile.campus', '==', campus))
    : query(usersRef);

  const snap = await getDocs(q);
  const profiles = [];

  snap.forEach((docSnap) => {
    if (docSnap.id === excludeUid) return;
    const profile = normalizeProfile(docSnap.id, docSnap.data());
    if (profile) profiles.push(profile);
  });

  return profiles;
}