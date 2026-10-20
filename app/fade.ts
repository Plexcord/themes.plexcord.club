// Critically damped spring (no overshoot): interruptible and always continues from the current value.
export const spring = { type: "spring", bounce: 0, duration: 0.4 } as const;

export const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { ...spring, delay }
});
