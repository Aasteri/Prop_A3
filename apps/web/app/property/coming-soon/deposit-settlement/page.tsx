'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Deposit settlement lives on MOVE_OUT inventories — keep old URL from breaking. */
export default function DepositSettlementRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/inventories?type=MOVE_OUT');
  }, [router]);

  return (
    <p className="p-8 text-center text-sm text-slate-600">
      Redirecting to move-out inventories for deposit settlement…
    </p>
  );
}
