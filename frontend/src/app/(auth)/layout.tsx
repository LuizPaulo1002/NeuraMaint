import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication | NeuraMaint',
  description: 'Sign in to access your industrial maintenance dashboard',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}