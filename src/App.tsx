import React from 'react';
import { RouterProvider } from 'react-router-dom'
import { router } from './routes/router'
import './app.scss'

console.log('[App.tsx]', `Hello world from Electron ${process.versions.electron}!`)

export const App: React.FC = () => {
  return (
    <RouterProvider router={router} />
  )
}
