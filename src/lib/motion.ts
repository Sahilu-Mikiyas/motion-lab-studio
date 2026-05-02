export const motionConfig = {
  normal: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
  slow: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

export const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export const stagger = (delay = 0.05) => ({
  initial: {},
  animate: { transition: { staggerChildren: delay } },
});
