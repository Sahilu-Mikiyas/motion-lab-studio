export const motionConfig = {
  fast: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  normal: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  slow: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

export const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const stagger = (delay = 0.04) => ({
  animate: { transition: { staggerChildren: delay } },
});

export const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: motionConfig.normal },
};
