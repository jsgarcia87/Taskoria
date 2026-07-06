import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import PixelIcon from './PixelIcon';
import { PressButton } from './PressButton';
import { useToast } from './Toast';

const CATEGORIES = [
  { id: 'bug',       label: 'Bug' },
  { id: 'idea',      label: 'Idea' },
  { id: 'confusing', label: 'Confusing' },
  { id: 'general',   label: 'General' },
];

const FeedbackModal = ({ onClose, currentUser, activeProfileId }) => {
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (message.trim().length < 3 || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('api/feedback.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser?.id ?? null,
          profile_id: activeProfileId ?? null,
          category,
          message: message.trim(),
          url: window.location.href,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Thanks — your feedback reached the guild.');
        onClose();
      } else {
        toast.error(data.error || 'Could not send. Try again in a moment.');
      }
    } catch (err) {
      toast.error('Network error — check your connection and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
      animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
      exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClose}
      className="fixed inset-0 z-[210] flex items-center justify-center bg-black/70 p-4"
    >
      <motion.form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.99 }}
        transition={{ type: 'spring', stiffness: 300, damping: 34 }}
        className="relative w-full max-w-md bg-rpg-panel/85 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl flex flex-col gap-4"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div>
          <div className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px] mb-1">Beta feedback</div>
          <h3 className="text-xl font-heading font-bold text-rpg-gold text-shadow-glow">Tell the guild</h3>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            Bugs, ideas, confusing bits — anything you noticed. This goes straight to Sangar.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                category === c.id
                  ? 'bg-rpg-gold/15 border-rpg-gold/50 text-rpg-gold'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={4000}
          placeholder="What happened, what did you expect, what would make it better…"
          className="w-full min-h-[140px] bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-gray-500 focus:border-rpg-gold/60 focus:ring-1 focus:ring-rpg-gold/40 outline-none transition-colors resize-y font-sans"
          autoFocus
        />

        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <span>{message.length}/4000</span>
          <span>Enter to break, ⌘/Ctrl+Enter to send</span>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-colors font-bold text-xs uppercase tracking-widest"
          >
            Cancel
          </button>
          <PressButton
            type="submit"
            disabled={submitting || message.trim().length < 3}
            className="flex-1 py-3 bg-rpg-gold text-rpg-bg rounded-xl font-bold text-xs uppercase tracking-widest shadow-glow-gold disabled:opacity-50"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit(e);
            }}
          >
            {submitting ? 'Sending…' : 'Send to Sangar'}
          </PressButton>
        </div>
      </motion.form>
    </motion.div>
  );
};

/**
 * Floating feedback button. Discreet, bottom-right on desktop and above the
 * BottomNav on mobile to not overlap the FAB. Uses the same motion vocabulary
 * as PressButton (spring 340/28, subtle hover/tap).
 */
const FeedbackButton = ({ currentUser, activeProfileId }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 340, damping: 26 }}
        className="fixed z-40 bottom-28 right-4 lg:bottom-6 lg:right-6 w-11 h-11 rounded-full bg-rpg-panel/80 border border-white/15 backdrop-blur-md shadow-lg text-gray-300 hover:text-rpg-gold hover:border-rpg-gold/50 flex items-center justify-center transition-colors"
        aria-label="Send feedback"
        title="Send feedback"
      >
        <PixelIcon name="book" size={16} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <FeedbackModal
            onClose={() => setOpen(false)}
            currentUser={currentUser}
            activeProfileId={activeProfileId}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default FeedbackButton;
