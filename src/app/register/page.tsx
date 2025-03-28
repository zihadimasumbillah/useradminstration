'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function RegisterRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/auth?tab=register');
  }, [router]);
  
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500">
        <span className="sr-only">Redirecting...</span>
      </div>
    </div>
  );
}

export default function Register() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    }>
      <RegisterRedirect />
    </Suspense>
  );
}
