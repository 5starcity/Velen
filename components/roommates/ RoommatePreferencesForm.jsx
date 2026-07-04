'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import './roommate-preferences.css';

const CATEGORY_FIELDS = [
  {
    key: 'sleepSchedule',
    label: 'Sleep schedule',
    options: [
      { value: 'early', label: 'Early bird' },
      { value: 'flexible', label: 'Flexible' },
      { value: 'late', label: 'Night owl' },
    ],
  },
  {
    key: 'cleanliness',
    label: 'Cleanliness',
    options: [
      { value: 'very_tidy', label: 'Very tidy' },
      { value: 'tidy', label: 'Tidy' },
      { value: 'relaxed', label: 'Relaxed' },
      { value: 'messy', label: 'Messy' },
    ],
  },
  {
    key: 'noiseTolerance',
    label: 'Noise level',
    options: [
      { value: 'quiet', label: 'Prefer quiet' },
      { value: 'moderate', label: 'Moderate' },
      { value: 'lively', label: 'Lively' },
    ],
  },
  {
    key: 'studyHabits',
    label: 'Study habits',
    options: [
      { value: 'room', label: 'Study in room' },
      { value: 'mixed', label: 'Mixed' },
      { value: 'library', label: 'Study at library' },
    ],
  },
  {
    key: 'socialStyle',
    label: 'Social style',
    options: [
      { value: 'introvert', label: 'Introvert' },
      { value: 'ambivert', label: 'Ambivert' },
      { value: 'extrovert', label: 'Extrovert' },
    ],
  },
  {
    key: 'guestPolicy',
    label: 'Having guests over',
    options: [
      { value: 'rarely', label: 'Rarely' },
      { value: 'sometimes', label: 'Sometimes' },
      { value: 'often', label: 'Often' },
    ],
  },
];

const CAMPUS_OPTIONS = ['UST', 'RSU', 'UNIPORT'];

const emptyFieldSet = CATEGORY_FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {});

export default function RoommatePreferencesForm() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [basics, setBasics] = useState({
    displayName: '',
    campus: CAMPUS_OPTIONS[0],
    gender: '',
    genderPref: 'any',
    budgetMin: '',
    budgetMax: '',
  });
  const [isFields, setIsFields] = useState(emptyFieldSet);
  const [wantFields, setWantFields] = useState(emptyFieldSet);

  const step1Complete =
    basics.displayName.trim() &&
    basics.gender &&
    basics.budgetMin &&
    basics.budgetMax &&
    Object.values(isFields).every(Boolean);

  const step2Complete = Object.values(wantFields).every(Boolean);

  async function handleSubmit() {
    if (!user) return;
    setSaving(true);
    setError(null);

    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          displayName: basics.displayName,
          roommateProfile: {
            displayName: basics.displayName,
            campus: basics.campus,
            gender: basics.gender,
            genderPref: basics.genderPref,
            budgetMin: Number(basics.budgetMin),
            budgetMax: Number(basics.budgetMax),
            isFields,
            wantFields,
          },
        },
        { merge: true }
      );
      router.push('/roommates');
    } catch (err) {
      console.error('Failed to save roommate profile:', err);
      setError("Couldn't save your profile. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rz-pref">
      <header className="rz-pref__header">
        <h1 className="rz-pref__title">Set up your roommate profile</h1>
        <p className="rz-pref__subtitle">
          Two short steps. This is what powers your match score.
        </p>
        <div className="rz-pref__progress">
          <div className={`rz-pref__progress-step ${step >= 1 ? 'rz-pref__progress-step--active' : ''}`} />
          <div className={`rz-pref__progress-step ${step >= 2 ? 'rz-pref__progress-step--active' : ''}`} />
        </div>
      </header>

      {step === 1 && (
        <section className="rz-pref__section">
          <h2 className="rz-pref__section-title">About you</h2>

          <div className="rz-pref__field-row">
            <label className="rz-pref__label" htmlFor="displayName">
              Display name
            </label>
            <input
              id="displayName"
              className="rz-pref__input"
              type="text"
              value={basics.displayName}
              onChange={(e) => setBasics((b) => ({ ...b, displayName: e.target.value }))}
              placeholder="What roommates will see"
            />
          </div>

          <div className="rz-pref__field-row rz-pref__field-row--split">
            <div>
              <label className="rz-pref__label" htmlFor="gender">
                Gender
              </label>
              <select
                id="gender"
                className="rz-pref__select"
                value={basics.gender}
                onChange={(e) => setBasics((b) => ({ ...b, gender: e.target.value }))}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="rz-pref__label" htmlFor="campus">
                Campus
              </label>
              <select
                id="campus"
                className="rz-pref__select"
                value={basics.campus}
                onChange={(e) => setBasics((b) => ({ ...b, campus: e.target.value }))}
              >
                {CAMPUS_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rz-pref__field-row rz-pref__field-row--split">
            <div>
              <label className="rz-pref__label" htmlFor="budgetMin">
                Budget min (₦/year)
              </label>
              <input
                id="budgetMin"
                className="rz-pref__input"
                type="number"
                value={basics.budgetMin}
                onChange={(e) => setBasics((b) => ({ ...b, budgetMin: e.target.value }))}
                placeholder="150000"
              />
            </div>
            <div>
              <label className="rz-pref__label" htmlFor="budgetMax">
                Budget max (₦/year)
              </label>
              <input
                id="budgetMax"
                className="rz-pref__input"
                type="number"
                value={basics.budgetMax}
                onChange={(e) => setBasics((b) => ({ ...b, budgetMax: e.target.value }))}
                placeholder="250000"
              />
            </div>
          </div>

          {CATEGORY_FIELDS.map((field) => (
            <div className="rz-pref__field-row" key={field.key}>
              <span className="rz-pref__label">{field.label}</span>
              <div className="rz-pref__pill-group">
                {field.options.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    className={`rz-pref__pill ${
                      isFields[field.key] === opt.value ? 'rz-pref__pill--selected' : ''
                    }`}
                    onClick={() => setIsFields((prev) => ({ ...prev, [field.key]: opt.value }))}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="rz-pref__actions">
            <button
              type="button"
              className="rz-pref__btn rz-pref__btn--primary"
              disabled={!step1Complete}
              onClick={() => setStep(2)}
            >
              Next: what you're looking for
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="rz-pref__section">
          <h2 className="rz-pref__section-title">What you're looking for in a roommate</h2>

          <div className="rz-pref__field-row">
            <label className="rz-pref__label" htmlFor="genderPref">
              Preferred roommate gender
            </label>
            <select
              id="genderPref"
              className="rz-pref__select"
              value={basics.genderPref}
              onChange={(e) => setBasics((b) => ({ ...b, genderPref: e.target.value }))}
            >
              <option value="any">No preference</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {CATEGORY_FIELDS.map((field) => (
            <div className="rz-pref__field-row" key={field.key}>
              <span className="rz-pref__label">{field.label}</span>
              <div className="rz-pref__pill-group">
                {field.options.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    className={`rz-pref__pill ${
                      wantFields[field.key] === opt.value ? 'rz-pref__pill--selected' : ''
                    }`}
                    onClick={() => setWantFields((prev) => ({ ...prev, [field.key]: opt.value }))}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {error && <p className="rz-pref__error">{error}</p>}

          <div className="rz-pref__actions rz-pref__actions--split">
            <button type="button" className="rz-pref__btn rz-pref__btn--secondary" onClick={() => setStep(1)}>
              Back
            </button>
            <button
              type="button"
              className="rz-pref__btn rz-pref__btn--primary"
              disabled={!step2Complete || saving}
              onClick={handleSubmit}
            >
              {saving ? 'Saving...' : 'Save and see matches'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}