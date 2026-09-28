import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useBranding } from '../../hooks/useBranding'
import api from '../../lib/api'
import { HardHat, Bell, SignOut, User } from '@phosphor-icons/react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

interface NavbarMVPProps {
    activeView: string
    onViewChange: (view: string) => void
}

const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '')

export function NavbarMVP({ activeView, onViewChange }: NavbarMVPProps) {
    const { user, role, logout } = useAuth()
    const { branding } = useBranding()

    const getRoleBadgeColor = () => {
        switch (role) {
            case 'owner':
                return 'bg-red-100 text-red-700'
            case 'site_manager':
                return 'bg-blue-100 text-blue-700'
            case 'client':
                return 'bg-green-100 text-green-700'
            default:
                return 'bg-gray-100 text-gray-700'
        }
    }

    const getRoleLabel = () => {
        switch (role) {
            case 'owner':
                return 'Owner'
            case 'site_manager':
                return 'Site Manager'
            case 'client':
                return 'Client'
            default:
                return 'User'
        }
    }

    return (
        <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => onViewChange('dashboard')}
                    >
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md overflow-hidden"
                            style={{ backgroundColor: branding.accentColor || '#dc2626' }}>
                            {branding.logoUrl
                                ? <img src={`${API_BASE}${branding.logoUrl}`} alt="logo" className="w-full h-full object-contain" />
                                : <HardHat className="w-6 h-6 text-white" weight="fill" />}
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="font-bold text-gray-900 text-lg leading-none">
                                ELANJAI BUILDOS
                            </h1>
                            <p className="text-xs text-gray-500">Construction Management</p>
                        </div>
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center gap-3">
                        <NotificationBell />

                        {/* User Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center gap-2 px-2">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                        <User className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <div className="hidden md:block text-left">
                                        <p className="text-sm font-medium text-gray-900 leading-none">
                                            {user?.fullName || 'User'}
                                        </p>
                                        <Badge className={`text-[10px] px-1.5 py-0 mt-0.5 ${getRoleBadgeColor()}`}>
                                            {getRoleLabel()}
                                        </Badge>
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div>
                                        <p className="font-medium">{user?.fullName || 'User'}</p>
                                        <p className="text-xs text-gray-500">{user?.phone || 'No phone'}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {(role === 'owner' || role === 'admin') && (
                                    <DropdownMenuItem onClick={() => onViewChange('settings')}>
                                        <User className="w-4 h-4 mr-2" />
                                        Profile Settings
                                    </DropdownMenuItem>
                                )}
                                {role === 'owner' && (
                                    <DropdownMenuItem onClick={() => onViewChange('billing')}>
                                        <User className="w-4 h-4 mr-2" />
                                        Billing & subscription
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={logout} className="text-red-600">
                                    <SignOut className="w-4 h-4 mr-2" />
                                    Sign Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </nav>
    )
}

/** Live notification bell backed by /api/notifications. */
function NotificationBell() {
    const { user } = useAuth()
    const [items, setItems] = useState<any[]>([])

    const isRead = (n: any) => (n.readBy || []).includes(user?.id)
    const unread = items.filter(i => !isRead(i)).length

    const fetch_ = async () => {
        try {
            const { data } = await api.get('/notifications')
            setItems(data)
        } catch { /* silent */ }
    }

    useEffect(() => {
        fetch_()
        const t = setInterval(fetch_, 30000)
        return () => clearInterval(t)
    }, [])

    const markRead = async (id: string) => {
        setItems(prev => prev.map(i => i.id === id
            ? { ...i, readBy: [...(i.readBy || []), user?.id] } : i))
        try { await api.post(`/notifications/${id}/read`) } catch { /* silent */ }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5 text-gray-600" />
                    {unread > 0 && (
                        <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-0.5 bg-red-500 rounded-full text-[10px] text-white font-semibold flex items-center justify-center">
                            {unread > 9 ? '9+' : unread}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {items.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-6">No notifications</p>
                )}
                <div className="max-h-80 overflow-y-auto">
                    {items.slice(0, 20).map(n => (
                        <DropdownMenuItem key={n.id}
                            className="flex flex-col items-start gap-0.5 py-2.5 cursor-pointer"
                            onClick={() => markRead(n.id)}>
                            <span className={`text-sm ${!isRead(n) ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                {!isRead(n) && <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5 align-middle" />}
                                {n.title || n.type}
                            </span>
                            {n.message && <span className="text-xs text-gray-500 line-clamp-2">{n.message}</span>}
                            <span className="text-[10px] text-gray-400">
                                {n.createdAt ? new Date(n.createdAt).toLocaleString('en-IN') : ''}
                            </span>
                        </DropdownMenuItem>
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
