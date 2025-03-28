'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const registered = searchParams.get('registered');
    
    if (registered) {
      router.push('/auth?registered=true');
    } else {
      router.push('/auth?tab=login');
    }
  }, [router, searchParams]);
  
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500">
        <span className="sr-only">Redirecting...</span>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    }>
      <LoginRedirect />
    </Suspense>
  );
}
