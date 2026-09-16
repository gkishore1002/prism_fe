let staticPromise: Promise<(latex: string) => string> | null = null

/** Convert stored LaTeX to HTML without loading the full editor. */
export function convertLatexToMarkupSafe(latex: string): Promise<string> {
  if (!staticPromise) {
    staticPromise = (async () => {
      await import('mathlive/fonts.css')
      await import('mathlive/static.css')
      const { convertLatexToMarkup } = await import('mathlive/ssr')
      return convertLatexToMarkup
    })()
  }
  return staticPromise.then((convert) => convert(latex))
}
