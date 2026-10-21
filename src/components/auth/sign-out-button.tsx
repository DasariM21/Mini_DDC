'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { createClient } from '../../lib/supabase/client';

export function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await createClient().auth.signOut();
      router.replace('/login');
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <button className="lp-button lp-button--secondary lp-button--sm" type="button" onClick={handleSignOut} disabled={isSigningOut}>
      {isSigningOut ? 'Signing out' : 'Sign out'}
    </button>
  );
}
