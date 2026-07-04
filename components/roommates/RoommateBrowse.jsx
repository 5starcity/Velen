'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import RoommateCard from './RoommateCard';
import { rankCandidates } from '../../lib/Matching';
import { fetchCandidateProfiles, fetchCurrentUserProfile } from '../../lib/roommates';
import './roommate-browse.css';

const SORT_OPTIONS = [
  { value: 'match', label: 'Best match' },
  { value: 'budget_low', label: 'Budget: low to high' },
  { value: 'budget_high', label: 'Budget: high to low' },
];

export default function RoommateBrowse() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [myProfile, setMyProfile] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sortBy, setSortBy] = useState('match');
  const [budgetFilter, setBudgetFilter] = useState('any');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setDataLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setDataLoading(true);
        const profile = await fetchCurrentUserProfile(user.uid);
        if (cancelled) return;
        setMyProfile(profile);

        if (profile) {
          const others = await fetchCandidateProfiles(profile.campus, user.uid);
          if (cancelled) return;
          setCandidates(others);
        }
      } catch (err) {
        console.error('RoommateBrowse fetch error:', err);
        if (!cancelled) setError('Could not load matches right now.');
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const ranked = useMemo(() => {
    if (!myProfile) return [];
    let results = rankCandidates(myProfile, candidates);

    if (budgetFilter !== 'any') {
      const ceiling = Number(budgetFilter);
      results = results.filter((r) => r.candidate.budgetMin <= ceiling);
    }

    if (sortBy === 'budget_low') {
      results = [...results].sort((a, b) => a.candidate.budgetMin - b.candidate.budgetMin);
    } else if (sortBy === 'budget_high') {
      results = [...results].sort((a, b) => b.candidate.budgetMin - a.candidate.budgetMin);
    }

    return results;
  }, [myProfile, candidates, sortBy, budgetFilter]);

  const handleViewProfile = (candidate) => {
    console.log('view profile', candidate.uid);
  };

  const handleExpressInterest = (candidate) => {
    console.log('express interest', candidate.uid);
  };

  if (authLoading || dataLoading) {
    return (
      <div className="roommate-browse">
        <p className="roommate-browse__subtitle">Loading matches...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="roommate-browse">
        <div className="roommate-browse__empty">
          <p className="roommate-browse__empty-title">Sign in to see your matches</p>
          <p className="roommate-browse__empty-body">
            You need an account to browse and match with roommates.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="roommate-browse">
        <div className="roommate-browse__empty">
          <p className="roommate-browse__empty-title">{error}</p>
          <p className="roommate-browse__empty-body">Try refreshing the page.</p>
        </div>
      </div>
    );
  }

  if (!myProfile) {
    return (
      <div className="roommate-browse">
        <div className="roommate-browse__empty">
          <p className="roommate-browse__empty-title">Complete your roommate profile</p>
          <p className="roommate-browse__empty-body">
            Tell us your lifestyle and what you're looking for so we can find real matches, not
            just a list of everyone.
          </p>
          <button
            type="button"
            className="roommate-browse__empty-cta"
            onClick={() => router.push('/roommates/preferences')}
          >
            Complete your profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="roommate-browse">
      <header className="roommate-browse__header">
        <h1 className="roommate-browse__title">Find your roommate</h1>
        <p className="roommate-browse__subtitle">
          Ranked by compatibility &mdash; not just who posted last.
        </p>
      </header>

      <div className="roommate-browse__filters">
        <div className="roommate-browse__filter-group">
          <label htmlFor="sort-select" className="roommate-browse__filter-label">
            Sort by
          </label>
          <select
            id="sort-select"
            className="roommate-browse__select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="roommate-browse__filter-group">
          <label htmlFor="budget-select" className="roommate-browse__filter-label">
            Max budget
          </label>
          <select
            id="budget-select"
            className="roommate-browse__select"
            value={budgetFilter}
            onChange={(e) => setBudgetFilter(e.target.value)}
          >
            <option value="any">Any budget</option>
            <option value="150000">Up to ₦150,000</option>
            <option value="200000">Up to ₦200,000</option>
            <option value="300000">Up to ₦300,000</option>
          </select>
        </div>

        <span className="roommate-browse__count">
          {ranked.length} {ranked.length === 1 ? 'match' : 'matches'}
        </span>
      </div>

      {ranked.length === 0 ? (
        <div className="roommate-browse__empty">
          <p className="roommate-browse__empty-title">No matches in this range yet</p>
          <p className="roommate-browse__empty-body">
            Try widening your budget filter, or check back as more students join.
          </p>
        </div>
      ) : (
        <div className="roommate-browse__grid">
          {ranked.map(({ candidate, match }) => (
            <RoommateCard
              key={candidate.uid}
              candidate={candidate}
              match={match}
              onViewProfile={handleViewProfile}
              onExpressInterest={handleExpressInterest}
            />
          ))}
        </div>
      )}
    </div>
  );
}