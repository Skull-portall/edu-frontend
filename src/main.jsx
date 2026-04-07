import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import ErrorBoundary from './components/common/ErrorBoundary'
import { registerServiceWorker } from './utils/pwa.js'
import './index.css'

const queryClient = new QueryClient({
 defaultOptions: {
 queries: {
 refetchOnWindowFocus: false,
 staleTime: 1000 * 60 * 5, // 5 minutes
 cacheTime: 1000 * 60 * 30, // 30 minutes
 retry: 1,
 },
 },
})

// Register Service Worker on first load (after React renders)
if (import.meta.env.PROD) {
 // Only in production to avoid SW issues during hot-reload dev
 window.addEventListener('load', () => {
 registerServiceWorker();
 });
} else {
 // In dev, register after a delay so HMR doesn't conflict
 window.addEventListener('load', () => {
 setTimeout(() => registerServiceWorker(), 3000);
 });
}

ReactDOM.createRoot(document.getElementById('root')).render(
 <React.StrictMode>
 <QueryClientProvider client={queryClient}>
 <ErrorBoundary>
 <App />
 <Toaster
 position="top-right"
 toastOptions={{
 duration: 4000,
 style: {
 background: '#fff',
 color: '#1f2937',
 borderRadius: '12px',
 boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
 border: '1px solid #f3f4f6',
 fontFamily: 'Inter, sans-serif',
 fontSize: '14px',
 fontWeight: '500',
 },
 success: {
 iconTheme: { primary: '#16a34a', secondary: '#fff' },
 },
 error: {
 iconTheme: { primary: '#dc2626', secondary: '#fff' },
 },
 }}
 />
 </ErrorBoundary>
 </QueryClientProvider>
 </React.StrictMode>,
)
