import { motion } from 'framer-motion';
import type { PropsWithChildren } from 'react';

type SlideSectionProps = PropsWithChildren<{
  id: string;
  title: string;
}>;

export function SlideSection({ id, title, children }: SlideSectionProps) {
  return (
    <section id={id} className="slide-panel min-h-screen w-full snap-start px-6 pb-12 pt-24 md:px-14" aria-label={title}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.4 }}
        className="mx-auto flex h-full w-full max-w-7xl flex-col"
      >
        {children}
      </motion.div>
    </section>
  );
}
