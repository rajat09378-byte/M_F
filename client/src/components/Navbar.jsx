import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '../context/SessionContext';
import { Brain, Upload, Network, Box, HelpCircle, MessageCircle, Sparkles, Zap } from 'lucide-react';

const tabs = [
  { id: 'upload', label: 'Upload', icon: Upload, description: 'Add Content' },
  { id: 'graph', label: 'Concept Map', icon: Network, description: 'Knowledge Graph' },
  { id: 'visualizer', label: '3D View', icon: Box, description: '3D Simulation' },
  { id: 'quiz', label: 'Quiz', icon: HelpCircle, description: 'Test Yourself' },
  { id: 'tutor', label: 'AI Tutor', icon: MessageCircle, description: 'Ask Questions' },
];

export default function Navbar() {
  const { sessionData, activeTab, setActiveTab, clearSession } = useSession();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
      <div className="max-w-7xl mx-auto">
        <div className="glass-card px-6 py-3 flex items-center justify-between" style={{ borderRadius: '20px' }}>
          {/* Logo */}
          <motion.button
            onClick={clearSession}
            className="flex items-center gap-3 group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forge-500 to-purple-600 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-lg gradient-text leading-none">MIND FORGE</div>
              <div className="text-xs text-white/40 font-mono">AI Learning Engine</div>
            </div>
          </motion.button>

          {/* Navigation Tabs */}
          {sessionData && (
            <div className="flex items-center gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                      isActive
                        ? 'text-white'
                        : 'text-white/50 hover:text-white/80'
                    }`}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-forge-600/40 to-purple-600/40 border border-forge-500/30"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    <Icon className="w-4 h-4 relative z-10" />
                    <span className="relative z-10 hidden md:block">{tab.label}</span>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-3">
            {sessionData && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
              >
                <div className="pulse-dot" style={{ background: '#22c55e' }} />
                <span className="text-xs text-emerald-400 font-medium">{sessionData.subject || 'Active'}</span>
              </motion.div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forge-600/20 border border-forge-500/20">
              <Zap className="w-3.5 h-3.5 text-forge-400" />
              <span className="text-xs text-forge-400 font-mono">Gemini</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
