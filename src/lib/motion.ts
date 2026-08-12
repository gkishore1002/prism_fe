import type { Transition, Variants } from 'framer-motion'

/** Shared Framer Motion presets — Learning Atlas light */

export const easeOut: Transition = {
  duration: 0.45,
  ease: [0.22, 1, 0.36, 1],
}

export const springSoft: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 32,
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: easeOut },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: easeOut },
}

/** Gentle page turn for reports / atlas views */
export const pageUnfold: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
    rotateX: 6,
    transformPerspective: 900,
  },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transformPerspective: 900,
    transition: { duration: 0.52, ease: [0.25, 0.1, 0.25, 1] },
  },
}

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: easeOut },
}

export const slideFromLeft: Variants = {
  hidden: { x: -28, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: springSoft },
  exit: { x: -24, opacity: 0, transition: { duration: 0.2 } },
}

export const drawerOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}
