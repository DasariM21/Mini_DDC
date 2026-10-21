import { AuthForm } from '../../src/components/auth/auth-form';
import { getSupabaseConfig } from '../../src/lib/supabase/config';

export default function SignupPage() {
  return <AuthForm mode="signup" isConfigured={Boolean(getSupabaseConfig())} />;
}
