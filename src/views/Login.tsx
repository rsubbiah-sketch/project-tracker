import { motion } from 'framer-motion';
import { UpscaleLogo } from '../components/Logo';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login, loading } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm p-8 rounded-2xl border border-border bg-card text-center"
      >
        <div className="flex justify-center mb-6">
          <UpscaleLogo width={180} height={36} id="login" />
        </div>
        <h1 className="text-lg font-bold text-foreground mb-2">Project Tracker</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Sign in with your UpscaleAI account to continue
        </p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={login}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 11v4h6.2c-.9 2.5-3.3 4-6.2 4-3.6 0-6.5-2.9-6.5-6.5S8.4 6 12 6c1.5 0 2.9.5 4 1.4l2.9-2.9C17.1 2.7 14.7 1.5 12 1.5 6.2 1.5 1.5 6.2 1.5 12S6.2 22.5 12 22.5c5.5 0 10-4 10-10 0-.7-.1-1.3-.2-2H12z"/>
          </svg>
          {loading ? 'Loading...' : 'Sign in with Google'}
        </motion.button>
        <p className="text-xs text-muted-foreground mt-6">
          Restricted to @upscaleai.com accounts
        </p>
      </motion.div>
    </div>
  );
}
