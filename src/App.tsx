// ======================================================
//  src/App.tsx — AIBBRY’s Task Tracker Root
// ======================================================
import { lazy, Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare } from 'lucide-react';
import './index.css';

const SupabaseAuth = lazy(() => import('./components/SupabaseAuth'));
const MainTaskTracker = lazy(() => import('./components/MainTaskTracker'));
const Analytics = lazy(() => import('@vercel/analytics/react').then((m) => ({ default: m.Analytics })));

const Skeleton = () => (
  <div className="flex-1 flex items-center justify-center text-white">Loading…</div>
);

export default function App() {
  const [user, setUser] = useState<any>(null);

  return (
    <>
      {/* WEBP background layer (behind everything) */}
      <div className="bg-wrap">
        <img
          src="/backgrounds/city_fire_image.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center -z-10"
        />
      </div>

      {/* Content sits above the background */}
      <div className="min-h-screen flex flex-col bg-cyber-dark text-neon-cyan p-6 relative z-0">
        <Suspense fallback={<Skeleton />}>
          {user ? (
            <motion.main
              key="main"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-1 dashboard-frame"
            >
              <MainTaskTracker user={user} onSignOut={() => setUser(null)} />
              <Analytics />
            </motion.main>
          ) : (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1 flex items-center justify-center"
            >
              <SupabaseAuth onAuthChange={setUser} />
            </motion.div>
          )}
        </Suspense>

        <footer className="text-center text-xs text-gray-500 mt-8">
          <CheckSquare size={14} className="inline mr-1" />
          Stay productive, MotherFucker!
        </footer>
      </div>
    </>
  );
}