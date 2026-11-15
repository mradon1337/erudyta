import { useContext } from 'react'
import { ProgressContext, type ProgressContextValue } from './progressContext.ts'

export function useProgress(): ProgressContextValue {
  const value = useContext(ProgressContext)
  if (!value) throw new Error('useProgress wymaga <ProgressProvider>')
  return value
}
