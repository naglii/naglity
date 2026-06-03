import { redirect } from 'next/navigation';

// History has been merged into the monthly Statistics page.
export default function DriverHistoryPage() {
  redirect('/driver/stats');
}
