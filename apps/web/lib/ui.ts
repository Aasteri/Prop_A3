/** Shared form field styles — dark text on white for readability */
export const INPUT =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[#e87722] focus:outline-none focus:ring-1 focus:ring-[#e87722]';

export const INPUT_INLINE =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[#e87722] focus:outline-none focus:ring-1 focus:ring-[#e87722]';

export const LABEL = 'mb-1 block text-sm font-medium text-slate-700';

export const CARD = 'rounded-xl border border-slate-200 bg-white shadow-sm';

export const PAGE_HEADER =
  'rounded-2xl border border-slate-200 bg-gradient-to-br from-[#1a2744] to-[#243a5e] p-6 text-white shadow-sm sm:p-8';

export const SECTION_TITLE = 'text-base font-semibold text-[#1a2744]';

export const STAT_CARD =
  'group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-[#e87722]/40 hover:shadow-md';

/** Primary CTA — brand orange, always white label */
export const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white hover:bg-[#d06818] disabled:opacity-50';

/** Solid navy CTA — always white label */
export const BTN_NAVY =
  'inline-flex items-center justify-center rounded-lg bg-[#1a2744] px-4 py-2 text-sm font-medium text-white hover:bg-[#243a5e] disabled:opacity-50';

/** Outline on light surfaces — dark label for contrast */
export const BTN_SECONDARY =
  'inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:opacity-50';

/** Ghost / outline on navy headers and dark heroes — white label */
export const BTN_GHOST_ON_DARK =
  'inline-flex items-center justify-center rounded-lg border border-white/30 px-4 py-2 text-sm font-medium text-white hover:bg-white/10';
