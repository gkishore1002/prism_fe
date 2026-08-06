import { baseTheme } from '@/theme'

export const authTheme = {
  ...baseTheme,
  darkPanel: 'gradient-dark',
  lightPanel: 'bg-[#F8FAFC]',
  brandMark:
    'w-10 h-10 rounded-[14px] gradient-brand-icon flex items-center justify-center ios-shadow-sm',
  roleCard: `${baseTheme.panel} card-hover`,
  input:
    'w-full rounded-[12px] border border-[#D1D5DB] bg-white px-4 py-3 text-[15px] text-[#0F172A] outline-none placeholder:text-[#94A3B8] focus:border-[#818CF8] focus:shadow-[0_0_0_3px_rgba(129,140,248,0.25)]',
}
