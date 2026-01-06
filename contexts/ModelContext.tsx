'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type Model = 'gemini-2.5-pro' | 'gemini-2.0-flash'

interface ModelContextType {
  selectedModel: Model
  setSelectedModel: (model: Model) => void
}

const ModelContext = createContext<ModelContextType | undefined>(undefined)

export function ModelProvider({ children }: { children: ReactNode }) {
  const [selectedModel, setSelectedModel] = useState<Model>('gemini-2.5-pro')

  return (
    <ModelContext.Provider value={{ selectedModel, setSelectedModel }}>
      {children}
    </ModelContext.Provider>
  )
}

export function useModel() {
  const context = useContext(ModelContext)
  if (context === undefined) {
    throw new Error('useModel must be used within a ModelProvider')
  }
  return context
}

