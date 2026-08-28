import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Modal } from '../components/common/Modal';
import PixelIcon from '../components/common/PixelIcon';

const ConfirmContext = createContext(null);

const VARIANTS = {
    danger: {
        icon: 'skull',
        iconColor: '#f87171',
        confirmClass: 'bg-red-600 hover:bg-red-500 shadow-red-500/20',
        accentBorder: 'border-red-500/20',
    },
    quest: {
        icon: 'sword',
        iconColor: '#fddf8c',
        confirmClass: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20',
        accentBorder: 'border-rpg-gold/20',
    },
    warning: {
        icon: 'shield',
        iconColor: '#fbbf24',
        confirmClass: 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20',
        accentBorder: 'border-amber-500/20',
    },
};

export const ConfirmProvider = ({ children }) => {
    const [pending, setPending] = useState(null);
    const resolveRef = useRef(null);

    const confirm = useCallback((options) => {
        return new Promise((resolve) => {
            resolveRef.current = resolve;
            setPending(typeof options === 'string' ? { message: options } : options);
        });
    }, []);

    const respond = (value) => {
        resolveRef.current?.(value);
        resolveRef.current = null;
        setPending(null);
    };

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            <Modal
                isOpen={!!pending}
                onClose={() => respond(false)}
                zIndex={60}
                wrapperClassName="w-full max-w-sm"
            >
                {pending && (
                    <ConfirmPanel
                        {...pending}
                        onConfirm={() => respond(true)}
                        onCancel={() => respond(false)}
                    />
                )}
            </Modal>
        </ConfirmContext.Provider>
    );
};

function ConfirmPanel({
    title,
    message,
    confirmText = 'Proceed',
    cancelText = 'Turn Back',
    variant = 'quest',
    onConfirm,
    onCancel,
}) {
    const v = VARIANTS[variant] || VARIANTS.quest;

    return (
        <div className={`glass-panel p-6 text-center border ${v.accentBorder}`}>
            <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <PixelIcon name={v.icon} size={24} color={v.iconColor} />
                </div>
            </div>

            {title && (
                <h3 className="text-lg font-heading font-bold text-white mb-2 tracking-wide">
                    {title}
                </h3>
            )}

            <p className="text-sm text-gray-300 leading-relaxed mb-6">
                {message}
            </p>

            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-400 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
                >
                    {cancelText}
                </button>
                <button
                    onClick={onConfirm}
                    autoFocus
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] ${v.confirmClass}`}
                >
                    {confirmText}
                </button>
            </div>
        </div>
    );
}

export const useConfirm = () => {
    const ctx = useContext(ConfirmContext);
    if (!ctx) {
        return (opts) => {
            const msg = typeof opts === 'string' ? opts : opts?.message || 'Are you sure?';
            return Promise.resolve(window.confirm(msg));
        };
    }
    return ctx;
};

export default ConfirmProvider;
