export const DESKTOP_TOOLBAR_HEIGHT = 'lg:h-11'
export const DESKTOP_CONTROL_HEIGHT = 'lg:h-11'
export const DESKTOP_CONTROL_RADIUS = 'rounded-2xl'
export const DESKTOP_CONTROL_TEXT = 'text-sm lg:text-[14px] font-semibold'
export const DESKTOP_ICON_SIZE = 'w-5 h-5 lg:w-[18px] lg:h-[18px]'

export const DESKTOP_INPUT_BASE = [
  'w-full',
  'bg-white',
  'border',
  'border-zinc-200/80',
  DESKTOP_CONTROL_RADIUS,
  'leading-5',
  'placeholder-zinc-400',
  'focus:outline-none',
  'focus:ring-4',
  'focus:ring-amber-500/20',
  'focus:border-amber-500',
  DESKTOP_CONTROL_TEXT,
  'transition-all',
  'font-medium',
  'shadow-sm',
  DESKTOP_CONTROL_HEIGHT,
].join(' ')

export const DESKTOP_PRIMARY_BUTTON_BASE = [
  'flex',
  'items-center',
  'justify-center',
  'gap-2',
  'bg-amber-500',
  'hover:bg-amber-600',
  'hover:shadow-lg',
  'hover:-translate-y-0.5',
  'text-white',
  'font-bold',
  DESKTOP_CONTROL_RADIUS,
  'transition-all',
  'active:scale-[0.98]',
  'shadow-sm',
  'whitespace-nowrap',
  DESKTOP_CONTROL_HEIGHT,
].join(' ')

export const DESKTOP_CHIP_BASE = [
  'flex',
  'items-center',
  'justify-center',
  'gap-2',
  'rounded-2xl',
  'transition-all',
  'active:scale-95',
  'focus-visible:ring-4',
  'focus-visible:ring-amber-500/20',
  'h-11',
  'px-3',
  'text-sm',
  'font-semibold',
].join(' ')
