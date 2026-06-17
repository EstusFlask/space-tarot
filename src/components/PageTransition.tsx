import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

interface PageTransitionProps {
  screenKey: string;
  children: ReactNode;
}

export default function PageTransition({ screenKey, children }: PageTransitionProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className="relative">{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={screenKey}
        className="relative"
        exit={{
          transition: {
            duration: 0.18,
          },
        }}
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-30 backdrop-blur-[2px]"
          initial={{ opacity: 0.1 }}
          animate={{
            opacity: 0,
            transition: {
              duration: 0.36,
              ease: [0.16, 1, 0.3, 1],
            },
          }}
          exit={{
            opacity: 0.06,
            transition: {
              duration: 0.16,
              ease: [0.4, 0, 1, 1],
            },
          }}
          style={{
            background:
              'radial-gradient(circle at 50% 24%, rgba(255,255,255,0.08), transparent 30%), radial-gradient(circle at 20% 78%, rgba(165,231,255,0.06), transparent 34%), radial-gradient(circle at 82% 68%, rgba(255,172,232,0.05), transparent 32%), linear-gradient(120deg, rgba(255,255,255,0.035), rgba(15,19,31,0.01))',
          }}
        />

        <motion.div
          className="relative"
          initial={{
            opacity: 0,
            y: 6,
            filter: 'blur(3px) saturate(1.08)',
          }}
          animate={{
            opacity: 1,
            y: 0,
            filter: 'blur(0px) saturate(1)',
            transition: {
              duration: 0.34,
              ease: [0.16, 1, 0.3, 1],
            },
          }}
          exit={{
            opacity: 0,
            y: -3,
            filter: 'blur(2px) saturate(0.96)',
            transition: {
              duration: 0.18,
              ease: [0.4, 0, 1, 1],
            },
          }}
          style={{ willChange: 'opacity, transform, filter' }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
