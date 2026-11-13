import React from 'react'
import AppRoutes from './app/routes/AppRoutes'
import { AuthProvider } from './app/providers/AuthProvider'
import { MetaProvider } from './app/providers/MetaProvider'
import { ToastProvider } from './app/providers/ToastProvider'

function App() {
  return (
    <ToastProvider>
      <MetaProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MetaProvider>
    </ToastProvider>
  )
}

export default App
