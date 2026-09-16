export type PrismMathCommand = 'backspace' | 'left' | 'right'

export interface PrismMathKey {
  id: string
  label: string
  insert?: string
  command?: PrismMathCommand
  title?: string
}

export interface PrismMathLayout {
  id: string
  label: string
  rows: PrismMathKey[][]
}

function key(id: string, label: string, insert: string, title?: string): PrismMathKey {
  return { id, label, insert, title }
}

function cmd(id: string, label: string, command: PrismMathCommand, title?: string): PrismMathKey {
  return { id, label, command, title }
}

export const PRISM_MATH_LAYOUTS: PrismMathLayout[] = [
  {
    id: 'school',
    label: 'School',
    rows: [
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((n) => key(n, n, n)),
      [
        key('plus', '+', '+'),
        key('minus', '−', '-'),
        key('times', '×', '\\times'),
        key('div', '÷', '\\div'),
        key('eq', '=', '='),
        key('neq', '≠', '\\neq'),
        key('lt', '<', '<'),
        key('gt', '>', '>'),
        key('lparen', '(', '('),
        key('rparen', ')', ')'),
      ],
      [
        key('sqrt', '√', '\\sqrt{#0}', 'Square root'),
        key('sq', 'x²', '#@^{2}', 'Square'),
        key('sub', 'xₙ', '#@_{#?}', 'Subscript'),
        key('half', '½', '\\frac{1}{2}'),
        key('frac', 'a/b', '\\frac{#@}{#?}', 'Fraction'),
        key('int', '∫', '\\int'),
        key('sum', 'Σ', '\\sum'),
        key('pi', 'π', '\\pi'),
        key('inf', '∞', '\\infty'),
        key('dot', '.', '.'),
      ],
      [
        key('sin', 'sin', '\\sin\\left(#0\\right)'),
        key('cos', 'cos', '\\cos\\left(#0\\right)'),
        key('tan', 'tan', '\\tan\\left(#0\\right)'),
        key('log', 'log', '\\log\\left(#0\\right)'),
        key('ln', 'ln', '\\ln\\left(#0\\right)'),
        cmd('left', '←', 'left', 'Move left'),
        cmd('right', '→', 'right', 'Move right'),
        cmd('bksp', '⌫', 'backspace', 'Delete'),
      ],
    ],
  },
  {
    id: 'algebra',
    label: 'Algebra',
    rows: [
      [
        key('x2', 'x²', '#@^{2}', 'Square'),
        key('x3', 'x³', '#@^{3}', 'Cube'),
        key('xn', 'xⁿ', '#@^{#?}', 'Power'),
        key('sqrt2', '√', '\\sqrt{#0}', 'Square root'),
        key('cbrt', '∛', '\\sqrt[3]{#0}', 'Cube root'),
        key('half2', '½', '\\frac{1}{2}'),
        key('frac2', 'a/b', '\\frac{#@}{#?}', 'Fraction'),
        key('abs', '|x|', '\\left|#0\\right|', 'Absolute value'),
        key('x', 'x', 'x'),
        key('y', 'y', 'y'),
      ],
      [
        key('leq', '≤', '\\leq'),
        key('geq', '≥', '\\geq'),
        key('neq2', '≠', '\\neq'),
        key('approx', '≈', '\\approx'),
        key('pm', '±', '\\pm'),
        key('cdot', '·', '\\cdot'),
        key('n', 'n', 'n'),
        key('theta', 'θ', '\\theta'),
        key('delta', 'Δ', '\\Delta'),
        key('inf2', '∞', '\\infty'),
      ],
      [
        key('mat', '▭', '\\begin{pmatrix}#0 & #0 \\\\ #0 & #0\\end{pmatrix}', '2×2 matrix'),
        key('parens', '( )', '\\left(#0\\right)'),
        key('brackets', '[ ]', '\\left[#0\\right]'),
        key('braces', '{ }', '\\left\\{#0\\right\\}'),
        cmd('left-a', '←', 'left', 'Move left'),
        cmd('right-a', '→', 'right', 'Move right'),
        cmd('bksp-a', '⌫', 'backspace', 'Delete'),
      ],
    ],
  },
  {
    id: 'calculus',
    label: 'Calculus',
    rows: [
      [
        key('int2', '∫', '\\int'),
        key('defint', '∫ₐᵇ', '\\int_{#?}^{#?} #0 \\,\\mathrm{d}#?', 'Definite integral'),
        key('oint', '∮', '\\oint'),
        key('partial', '∂', '\\partial'),
        key('ddx', 'd/dx', '\\frac{\\mathrm{d}}{\\mathrm{d}x}'),
        key('lim', 'lim', '\\lim_{#? \\to #?}'),
        key('sum2', 'Σ', '\\sum'),
        key('delta2', 'Δ', '\\Delta'),
        key('nabla', '∇', '\\nabla'),
        key('inf3', '∞', '\\infty'),
      ],
      [
        key('dx', 'dx', '\\mathrm{d}x'),
        key('dy', 'dy', '\\mathrm{d}y'),
        key('fx', 'f(x)', 'f\\left(#0\\right)'),
        key('to', '→', '\\to'),
        key('pi2', 'π', '\\pi'),
        cmd('left-c', '←', 'left', 'Move left'),
        cmd('right-c', '→', 'right', 'Move right'),
        cmd('bksp-c', '⌫', 'backspace', 'Delete'),
      ],
    ],
  },
  {
    id: 'trig',
    label: 'Trig',
    rows: [
      [
        key('sin2', 'sin', '\\sin\\left(#0\\right)'),
        key('cos2', 'cos', '\\cos\\left(#0\\right)'),
        key('tan2', 'tan', '\\tan\\left(#0\\right)'),
        key('csc', 'csc', '\\csc\\left(#0\\right)'),
        key('sec', 'sec', '\\sec\\left(#0\\right)'),
        key('cot', 'cot', '\\cot\\left(#0\\right)'),
        key('pi3', 'π', '\\pi'),
        key('deg', '°', '^{\\circ}'),
      ],
      [
        key('asin', 'sin⁻¹', '\\sin^{-1}\\left(#0\\right)'),
        key('acos', 'cos⁻¹', '\\cos^{-1}\\left(#0\\right)'),
        key('atan', 'tan⁻¹', '\\tan^{-1}\\left(#0\\right)'),
        key('theta2', 'θ', '\\theta'),
        key('alpha', 'α', '\\alpha'),
        key('beta', 'β', '\\beta'),
        cmd('left-t', '←', 'left', 'Move left'),
        cmd('right-t', '→', 'right', 'Move right'),
        cmd('bksp-t', '⌫', 'backspace', 'Delete'),
      ],
    ],
  },
  {
    id: 'greek',
    label: 'Greek',
    rows: [
      [
        key('a', 'α', '\\alpha'),
        key('b', 'β', '\\beta'),
        key('g', 'γ', '\\gamma'),
        key('d', 'δ', '\\delta'),
        key('th', 'θ', '\\theta'),
        key('l', 'λ', '\\lambda'),
        key('m', 'μ', '\\mu'),
        key('p', 'π', '\\pi'),
        key('s', 'σ', '\\sigma'),
        key('O', 'Ω', '\\Omega'),
      ],
      [
        key('e', 'ε', '\\epsilon'),
        key('ph', 'φ', '\\phi'),
        key('w', 'ω', '\\omega'),
        key('D', 'Δ', '\\Delta'),
        key('S', 'Σ', '\\Sigma'),
        key('P', 'Π', '\\Pi'),
        key('t', 'τ', '\\tau'),
        key('r', 'ρ', '\\rho'),
        cmd('left-g', '←', 'left', 'Move left'),
        cmd('right-g', '→', 'right', 'Move right'),
        cmd('bksp-g', '⌫', 'backspace', 'Delete'),
      ],
    ],
  },
]

export const MATH_KEYBOARD_INSTRUCTIONS = [
  'Click the question box (or an option) so the cursor is in that field.',
  'Type words and numbers on your keyboard as usual.',
  'Tap keys on the math keyboard for fractions, roots, powers, integrals, and symbols.',
  'Switch tabs — School, Algebra, Calculus, Trig, Greek — for more symbols.',
  'Use ← and → to move inside the formula, and ⌫ to delete.',
  'You do not need to write LaTeX. Prism stores the formula automatically.',
]
