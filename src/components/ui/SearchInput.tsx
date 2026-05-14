import { Search } from 'lucide-react'
import { DESKTOP_INPUT_BASE } from '@/lib/toolbarStyles'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({ value, onChange, placeholder = 'Buscar...', className = '' }: Props) {
  return (
    <div className={`relative w-full md:w-80 ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 lg:h-[18px] lg:w-[18px] text-zinc-400" />
      </div>
      <input
        type="text"
        className={`block pl-11 pr-4 py-3 lg:py-0 ${DESKTOP_INPUT_BASE}`}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}
