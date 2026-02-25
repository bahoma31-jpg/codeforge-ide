import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Lazy load the main layout component (heavy component with Monaco, Terminal, etc.)
const MainLayout = dynamic(
  () => import('@/components/codeforge/layout/main-layout'),
  {
    ssr: false, // Disable SSR for client-only components
    loading: () => <LoadingSpinner />,
  }
);

export default function Home() {
  return <MainLayout />;
}
