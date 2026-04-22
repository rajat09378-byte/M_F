import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Image, Code, Brain, Zap, Sparkles,
  AlertCircle, ArrowRight, BookOpen, Network, Box, HelpCircle, MessageCircle
} from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { uploadFile, uploadText } from '../lib/api';

const FEATURES = [
  { icon: Brain, label: 'Concept Extraction', desc: 'AI maps all key ideas', color: 'from-forge-500 to-purple-600' },
  { icon: Network, label: 'Knowledge Graph', desc: 'Interactive concept web', color: 'from-cyan-500 to-forge-500' },
  { icon: Box, label: '3D Visualization', desc: 'Immersive 3D models', color: 'from-purple-600 to-pink-600' },
  { icon: HelpCircle, label: 'Smart Quiz', desc: 'AI-generated tests', color: 'from-pink-500 to-orange-500' },
  { icon: MessageCircle, label: 'AI Tutor', desc: 'Ask anything, anytime', color: 'from-emerald-500 to-cyan-500' },
];

const ACCEPT_TYPES = ['text/plain', 'application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const SAMPLE_TEXTS = [
  {
    label: '🧬 DNA & Genetics',
    text: `DNA (deoxyribonucleic acid) is the molecule that carries the genetic instructions for the development, functioning, growth and reproduction of all known organisms. DNA is made of chemical building blocks called nucleotides, which have three parts: a phosphate group, a sugar group and one of four nitrogen bases: adenine (A), thymine (T), guanine (G) and cytosine (C). The order of these bases determines the DNA's instructions, or genetic code. Human DNA consists of about 3 billion bases, and more than 99 percent of those bases are the same in all people. The sequence of bases encodes genes, which are instructions for making proteins. Proteins do most of the work in cells and are required for the structure, function, and regulation of the body's tissues and organs. Gene expression involves transcription (DNA → mRNA) and translation (mRNA → protein). Mutations in DNA can cause genetic disorders like cystic fibrosis, sickle cell disease, and Huntington's disease.`
  },
  {
    label: '⚛️ Quantum Mechanics',
    text: `Quantum mechanics is a fundamental theory in physics that provides a description of the physical properties of nature at the scale of atoms and subatomic particles. Key principles include: Wave-particle duality states that particles exhibit both wave and particle properties. The Heisenberg Uncertainty Principle states we cannot simultaneously know both the position and momentum of a particle with perfect precision. Quantum superposition allows particles to exist in multiple states until measured. Quantum entanglement occurs when particles become correlated such that the quantum state of each particle cannot be described independently. Schrödinger's equation describes how quantum states evolve over time. The concept of quantum tunneling allows particles to pass through barriers that classical physics would forbid. Applications include lasers, transistors, MRI machines, and the emerging field of quantum computing.`
  },
  {
    label: '🌐 Machine Learning',
    text: `Machine learning is a branch of artificial intelligence focused on building systems that learn from data. Supervised learning trains models on labeled examples to predict outputs for new inputs — used in image classification and spam detection. Unsupervised learning finds patterns without labels — clustering and dimensionality reduction. Reinforcement learning trains agents through rewards and penalties. Neural networks are inspired by the brain: layers of neurons learn hierarchical representations. Deep learning uses many layers to solve complex problems like computer vision and NLP. Key algorithms include linear regression, decision trees, random forests, support vector machines, and gradient boosting. Overfitting occurs when a model memorizes training data but fails to generalize — combated with regularization, dropout, and cross-validation. Transformers and attention mechanisms have revolutionized NLP, leading to models like GPT and BERT.`
  },
];

export default function UploadPage() {
  const { setSessionData, setIsLoading, isLoading, setError, error, setActiveTab } = useSession();
  const [tab, setTab] = useState('text'); // 'text' | 'file'
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');

  const STAGES = [
    'Parsing content…',
    'Extracting concepts with Gemini AI…',
    'Building knowledge graph…',
    'Generating quiz questions…',
    'Preparing 3D visualization…',
    'Almost done…',
  ];

  const simulateProgress = () => {
    let i = 0;
    setProgress(5);
    const interval = setInterval(() => {
      i++;
      setProgress(Math.min(5 + i * 14, 90));
      setStage(STAGES[Math.min(i, STAGES.length - 1)]);
      if (i >= STAGES.length) clearInterval(interval);
    }, 3500);
    return interval;
  };

  const handleSubmit = async () => {
    if (tab === 'text' && text.trim().length < 20) {
      setError('Please enter at least 20 characters of content to analyze.');
      return;
    }
    if (tab === 'file' && !file) {
      setError('Please select a file to upload.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setProgress(0);
    setStage(STAGES[0]);
    const interval = simulateProgress();

    try {
      let data;
      if (tab === 'file') {
        data = await uploadFile(file, (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 30));
        });
      } else {
        data = await uploadText(text);
      }
      clearInterval(interval);
      setProgress(100);
      setStage('Complete!');
      setTimeout(() => {
        setSessionData(data);
        setActiveTab('graph');
        setIsLoading(false);
      }, 600);
    } catch (err) {
      clearInterval(interval);
      setError(err.message || 'Failed to process content. Please try again.');
      setIsLoading(false);
      setProgress(0);
      setStage('');
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const fileIcon = () => {
    if (!file) return Upload;
    if (file.type.startsWith('image/')) return Image;
    if (file.type === 'application/pdf') return FileText;
    return Code;
  };

  const FileIcon = fileIcon();

  return (
    <div className="relative z-10">
      {/* Hero */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-forge-600/20 border border-forge-500/30 mb-6">
            <Sparkles className="w-4 h-4 text-forge-400" />
            <span className="text-sm font-medium text-forge-300">Powered by Google Gemini AI</span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-4 leading-none tracking-tight">
            <span className="gradient-text">MIND FORGE</span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
            Transform any content into an <span className="text-cyan-400 font-semibold">interactive learning experience</span> — with AI-powered concept maps, 3D visualizations, quizzes, and a personal AI tutor.
          </p>
        </motion.div>
      </div>

      {/* Feature pills */}
      <motion.div
        className="flex flex-wrap justify-center gap-3 mb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.label}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i + 0.2 }}
            whileHover={{ scale: 1.05, y: -2 }}
          >
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${f.color} flex items-center justify-center`}>
              <f.icon className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white/90">{f.label}</div>
              <div className="text-xs text-white/40">{f.desc}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Upload card */}
      <motion.div
        className="glass-card p-8 max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {/* Tab switcher */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-6">
          {[
            { id: 'text', icon: BookOpen, label: 'Paste Text' },
            { id: 'file', icon: Upload, label: 'Upload File' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setError(null); setFile(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-forge-600 text-white shadow-lg shadow-forge-600/30'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'text' ? (
            <motion.div
              key="text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste any educational content here — textbook excerpts, articles, lecture notes, code snippets, research papers…"
                className="w-full h-48 bg-white/5 border border-white/10 rounded-xl p-4 text-white/90 placeholder-white/30 text-sm resize-none focus:outline-none focus:border-forge-500/60 focus:bg-white/[0.07] transition-all leading-relaxed"
                disabled={isLoading}
              />
              {/* Sample texts */}
              <div className="mt-3">
                <p className="text-xs text-white/40 mb-2">Try a sample:</p>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_TEXTS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => setText(s.text)}
                      disabled={isLoading}
                      className="px-3 py-1.5 text-xs rounded-xl bg-white/5 border border-white/10 hover:border-forge-500/40 hover:bg-forge-600/10 transition-all text-white/60 hover:text-white/90"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-white/30">{text.length} chars</span>
                <span className="text-xs text-white/30">Min. 20 chars required</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="file"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className={`upload-zone p-10 text-center cursor-pointer ${dragging ? 'dragging' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById('file-input').click()}
              >
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  accept=".txt,.pdf,.jpg,.jpeg,.png,.gif,.webp,.js,.py,.ts,.java,.cpp,.c,.md"
                  onChange={(e) => setFile(e.target.files[0])}
                  disabled={isLoading}
                />
                <AnimatePresence mode="wait">
                  {file ? (
                    <motion.div
                      key="file-selected"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-forge-600/20 border border-forge-500/40 flex items-center justify-center">
                        <FileIcon className="w-8 h-8 text-forge-400" />
                      </div>
                      <p className="font-semibold text-white">{file.name}</p>
                      <p className="text-sm text-white/40 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                      <button
                        className="mt-3 text-xs text-forge-400 hover:text-forge-300 underline"
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      >
                        Remove
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <Upload className="w-8 h-8 text-white/30" />
                      </div>
                      <p className="text-white/60 font-medium">Drag & drop or click to browse</p>
                      <p className="text-sm text-white/30 mt-2">
                        Supports: TXT, PDF, Images, JS, PY, TS, Java, C++, Markdown
                      </p>
                      <p className="text-xs text-white/20 mt-1">Max 10MB</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30"
            >
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-forge-300 font-medium">{stage}</span>
                <span className="text-sm text-white/40">{progress}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-forge-500 via-cyan-400 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="flex gap-1.5 mt-4 justify-center">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit button */}
        {!isLoading && (
          <motion.button
            onClick={handleSubmit}
            className="btn-glow w-full mt-6 py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-3 text-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Brain className="w-5 h-5" />
            <span>Forge My Knowledge</span>
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        )}
      </motion.div>

      {/* How it works */}
      <motion.div
        className="max-w-3xl mx-auto mt-16 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p className="text-xs text-white/25 font-mono uppercase tracking-widest mb-6">How It Works</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { step: '01', title: 'Upload Content', desc: 'Paste text or upload a file in any format' },
            { step: '02', title: 'AI Processes', desc: 'Gemini extracts concepts, builds graphs & quizzes' },
            { step: '03', title: 'Learn Deeply', desc: 'Explore interactive visualizations and chat with AI tutor' },
          ].map((item) => (
            <div key={item.step} className="glass-card p-5 text-center">
              <div className="text-3xl font-black text-forge-500/40 font-mono mb-2">{item.step}</div>
              <div className="font-semibold text-white/80 text-sm mb-1">{item.title}</div>
              <div className="text-xs text-white/40">{item.desc}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
