import type { Variants, Easing } from 'framer-motion';

const EASE: Easing = [0.22, 1, 0.36, 1];

export const motionConfig = {
  normal: { duration: 0.3, ease: EASE },
  slow: { duration: 0.5, ease: EASE },
};

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export const stagger = (delay = 0.05): Variants => ({
  initial: {},
  animate: { transition: { staggerChildren: delay } },
});
