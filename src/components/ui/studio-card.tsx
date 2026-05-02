import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

export const Card = forwardRef<HTMLDivElement, HTMLMotionProps<'div'> & { hover?: boolean }>(
  ({ className, hover = true, children, ...props }, ref) => (
    <motion.div
      ref={ref}
      whileHover={hover ? { y: -3 } : undefined}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative surface border border-border rounded-xl p-5 overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
);
Card.displayName = 'Card';
