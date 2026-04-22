import { AnimatePresence, motion } from 'framer-motion';
import { useSession, SessionProvider } from './context/SessionContext';
import Navbar from './components/Navbar';
import UploadPage from './components/UploadPage';
import ConceptGraph from './components/ConceptGraph';
import Visualizer3D from './components/Visualizer3D';
import QuizPanel from './components/QuizPanel';
import TutorChat from './components/TutorChat';
import ParticleBackground from './components/ParticleBackground';

function AppContent() {
  const { sessionData, activeTab } = useSession();

  const tabContent = {
    upload: <UploadPage />,
    graph: <ConceptGraph />,
    visualizer: <Visualizer3D />,
    quiz: <QuizPanel />,
    tutor: <TutorChat />,
  };

  return (
    <div className="relative min-h-screen bg-mesh overflow-hidden">
      <ParticleBackground />
      <Navbar />
      <main className="pt-24 pb-8 px-4 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {!sessionData ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <UploadPage />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {tabContent[activeTab] || <UploadPage />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  );
}
