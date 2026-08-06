import { useMemo } from 'react'

/** Soft ambient particles for premium SaaS atmosphere — decorative only. */
export function AmbientParticles({ count = 28 }: { count?: number }) {
  const dots = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${(i * 37) % 100}%`,
        top: `${(i * 53) % 100}%`,
        size: 1 + (i % 3),
        delay: `${(i % 10) * 0.4}s`,
        duration: `${8 + (i % 6)}s`,
      })),
    [count],
  )

  return (
    <div
      className="prism-particles pointer-events-none fixed inset-0 overflow-hidden z-0"
      aria-hidden
    >
      {dots.map((d) => (
        <span
          key={d.id}
          className="absolute rounded-full bg-indigo-400/30"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            animation: `particle-drift ${d.duration} ease-in-out ${d.delay} infinite alternate`,
          }}
        />
      ))}
    </div>
  )
}
