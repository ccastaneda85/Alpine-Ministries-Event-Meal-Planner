import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Trail = string[]

interface BreadcrumbContextValue {
  trail: Trail
  setTrail: (trail: Trail) => void
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null)

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [trail, setTrail] = useState<Trail>([])
  return (
    <BreadcrumbContext.Provider value={{ trail, setTrail }}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

export function useBreadcrumbContext(): BreadcrumbContextValue {
  const ctx = useContext(BreadcrumbContext)
  if (!ctx) throw new Error('useBreadcrumbContext must be used inside BreadcrumbProvider')
  return ctx
}

/**
 * Convenience hook for views: pass the trail entries (falsy values are dropped)
 * and the breadcrumb updates on mount and whenever any entry changes.
 */
export function useBreadcrumb(entries: Array<string | null | undefined | false>) {
  const { setTrail } = useBreadcrumbContext()
  const cleaned = entries.filter((e): e is string => typeof e === 'string' && e.length > 0)
  const key = cleaned.join('')
  useEffect(() => {
    setTrail(cleaned)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}
