export const TABS = ['resumen', 'detalle', 'comparar', 'intercambios', 'logros'] as const
export type Tab = (typeof TABS)[number]

export const INTERCAMBIOS_TABS = ['explorar', 'conexiones', 'dados', 'recibidos'] as const
export type IntercambiosTab = (typeof INTERCAMBIOS_TABS)[number]

export const TAB_LABELS: Record<Tab, string> = {
  resumen: 'Resumen',
  detalle: 'Detalle',
  comparar: 'Ranking',
  intercambios: 'Canjes',
  logros: 'Logros',
}

export const INTERCAMBIOS_TAB_LABELS: Record<IntercambiosTab, string> = {
  explorar: 'Explorar',
  conexiones: 'Conexiones',
  dados: 'Enviados',
  recibidos: 'Recibidos',
}

export const LOCAL_STORAGE_KEY = 'tracker-mundial-album'
