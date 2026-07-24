'use client';

import { auth } from '@/lib/firebase';

export default function TokenTestPage() {
  const handleClick = async () => {
    const user = auth.currentUser;
    if (!user) {
      console.log('No user logged in');
      return;
    }
    const token = await user.getIdToken();
    console.log(token);
  };

  return (
    <button onClick={handleClick} style={{ padding: '12px 24px', fontSize: '16px' }}>
      Get Firebase Token
    </button>
  );
}