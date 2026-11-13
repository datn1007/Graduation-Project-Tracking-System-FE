import { createContext } from 'react'

// Context objects live here so provider files only export components (keeps Fast Refresh happy).
export const AuthContext = createContext(null)
export const ToastContext = createContext(null)
export const MetaContext = createContext(null)
