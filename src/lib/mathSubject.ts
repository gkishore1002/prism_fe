/** True for Mathematics / Maths / Applied Mathematics and similar school subjects. */
export function isMathematicsSubject(subject: string | undefined | null): boolean {
  const value = (subject ?? '').trim().toLowerCase()
  if (!value) return false
  if (value.includes('mathematic')) return true
  return /\bmaths?\b/.test(value)
}

const LATEX_HINT =
  /\\[a-zA-Z]+|\\[{}%]|[\^_]\{?|\\frac|\\sqrt|\\int|\\sum|\\lim|\\pi|\\theta|\\infty|\\times|\\div|\\leq|\\geq|\\neq|\\partial|\\cdot|\\sin|\\cos|\\tan|\\log|\\ln|\\left|\\right|\\text\s*\{/

/** True when stored question text is MathLive/LaTeX rather than plain prose. */
export function looksLikeLatex(text: string | undefined | null): boolean {
  if (!text) return false
  return LATEX_HINT.test(text)
}
