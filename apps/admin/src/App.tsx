import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AdminConsole, AdminLogin } from './pages/AdminConsole'

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

/** Platform admin app — everything lives under /admin on its own host. */
export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin/*" element={<AdminConsole />} />
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    )
}
