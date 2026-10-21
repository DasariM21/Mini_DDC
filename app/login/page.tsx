import { AuthForm } from '../../src/components/auth/auth-form';
import { getSupabaseConfig } from '../../src/lib/supabase/config';

type LoginPageProps = {
  searchParams: Promise<{ setup?: string; authError?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  return (
    <AuthForm
      mode="login"
      isConfigured={Boolean(getSupabaseConfig())}
      setupRequired={params.setup === 'required'}
      authError={params.authError}
    />
  );
}
