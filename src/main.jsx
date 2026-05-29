import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // แคชข้อมูลไว้ 5 นาที ลดภาระเซิร์ฟเวอร์ D1
      refetchOnWindowFocus: false, // ปิดการดึงข้อมูลซ้ำเวลาเด็กสลับแท็บเบราว์เซอร์ไปมา
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)