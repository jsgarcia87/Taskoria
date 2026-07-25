import { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

const BACKDROP_TRANSITION = { duration: 0.22, ease: 'easeOut' };
const PANEL_ENTER = { duration: 0.26, ease: [0.22, 1, 0.36, 1] };
const PANEL_EXIT = { duration: 0.18, ease: [0.22, 1, 0.36, 1] };

/**
 * Modal — backdrop fade + panel scale-in con easing coherente con el resto de la app.
 * - `dismissable=false` desactiva backdrop click y Escape (para formularios que
 *   no deben cerrarse por accidente perdiendo datos).
 * - `wrapperClassName` gobierna el layout del contenedor del panel; el `children`
 *   se encarga del look (glass-panel, colores, etc.).
 */
export function Modal({
    isOpen,
    onClose,
    children,
    dismissable = true,
    zIndex = 50,
    backdropClassName = 'bg-black/80 backdrop-blur-sm',
    wrapperClassName = 'w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar',
}) {
    const shouldReduce = useReducedMotion();

    useEffect(() => {
        if (!isOpen || !dismissable) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, dismissable, onClose]);

    const panelInitial = shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 };
    const panelAnimate = shouldReduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 };
    const panelExit = shouldReduce
        ? { opacity: 0, transition: PANEL_EXIT }
        : { opacity: 0, scale: 0.98, y: 4, transition: PANEL_EXIT };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={`fixed inset-0 flex items-center justify-center p-4 ${backdropClassName}`}
                    style={{ zIndex }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={BACKDROP_TRANSITION}
                    onClick={dismissable ? onClose : undefined}
                >
                    <motion.div
                        className={wrapperClassName}
                        initial={panelInitial}
                        animate={panelAnimate}
                        exit={panelExit}
                        transition={PANEL_ENTER}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default Modal;
