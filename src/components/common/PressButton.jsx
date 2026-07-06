import { forwardRef } from 'react';
import { motion } from 'motion/react';

export const PressButton = forwardRef(function PressButton(
  { children, className = '', disabled, type = 'button', ...rest },
  ref
) {
  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.015 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      className={className}
      {...rest}
    >
      {children}
    </motion.button>
  );
});

export default PressButton;
