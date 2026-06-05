import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_DURATION = 4000;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const dismiss = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const push = useCallback((type, message, opts = {}) => {
        const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const duration = opts.duration ?? TOAST_DURATION;
        setToasts((prev) => [...prev, { id, type, message }]);
        if (duration > 0) {
            setTimeout(() => dismiss(id), duration);
        }
        return id;
    }, [dismiss]);

    const api = {
        success: (msg, opts) => push('success', msg, opts),
        error: (msg, opts) => push('error', msg, opts),
        info: (msg, opts) => push('info', msg, opts),
        dismiss,
    };

    return (
        <ToastContext.Provider value={api}>
            {children}
            {createPortal(<ToastViewport toasts={toasts} onDismiss={dismiss} />, document.body)}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        // Fallback so non-wrapped callers don't crash; logs to console.
        return {
            success: (m) => console.info('[toast:success]', m),
            error: (m) => console.error('[toast:error]', m),
            info: (m) => console.info('[toast:info]', m),
            dismiss: () => {},
        };
    }
    return ctx;
};

const ToastViewport = ({ toasts, onDismiss }) => (
    <div
        className="fixed z-[9999] top-4 right-4 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] sm:w-auto pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
    >
        {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
    </div>
);

const ICONS = {
    success: { Icon: CheckCircle2, color: 'text-green-400', bar: 'bg-green-400' },
    error: { Icon: AlertCircle, color: 'text-red-400', bar: 'bg-red-400' },
    info: { Icon: Info, color: 'text-rpg-gold', bar: 'bg-rpg-gold' },
};

const ToastItem = ({ toast, onDismiss }) => {
    const [enter, setEnter] = useState(false);
    useEffect(() => {
        const r = requestAnimationFrame(() => setEnter(true));
        return () => cancelAnimationFrame(r);
    }, []);

    const { Icon, color, bar } = ICONS[toast.type] || ICONS.info;

    return (
        <div
            className={`pointer-events-auto bg-[#1a102e]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl flex items-stretch overflow-hidden transition-all duration-300 ${enter ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
            role={toast.type === 'error' ? 'alert' : 'status'}
        >
            <div className={`w-1 ${bar}`}></div>
            <div className="flex items-start gap-3 px-3 py-3 flex-1 min-w-0">
                <Icon size={18} className={`${color} flex-shrink-0 mt-0.5`} />
                <div className="text-sm text-white leading-snug flex-1 min-w-0 break-words">{toast.message}</div>
                <button
                    onClick={() => onDismiss(toast.id)}
                    className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
                    aria-label="Dismiss"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};

export default ToastProvider;
