import { useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useReducedMotion,
} from 'motion/react';

const defaultFormatter = (v) => Math.round(v).toLocaleString();

export function NumberTicker({
  value,
  duration = 0.7,
  formatter = defaultFormatter,
  className = '',
}) {
  const shouldReduce = useReducedMotion();
  const mv = useMotionValue(value);
  const display = useTransform(mv, formatter);

  useEffect(() => {
    if (shouldReduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return controls.stop;
  }, [value, duration, mv, shouldReduce]);

  return <motion.span className={className}>{display}</motion.span>;
}

export default NumberTicker;
