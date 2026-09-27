import { Bell, User, HardHat } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { UserRole, Notification } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
}

export function Navbar({ currentRole, onRoleChange, notifications, onNotificationClick }: NavbarProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  const roleLabels: Record<UserRole, string> = {
    admin: 'Admin',
    owner: 'Owner',
    'site-manager': 'Site Manager',
    client: 'Client',
  };

  return (
    <nav className="bg-red-600 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <HardHat size={28} weight="fill" className="flex-shrink-0 md:w-8 md:h-8" />
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-bold tracking-tight leading-none truncate">ElanjaiBuildos</h1>
              <p className="text-xs text-red-100 leading-none mt-0.5 hidden sm:block">Construction Management</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative text-white hover:bg-red-700 hover:text-white h-9 w-9 md:h-10 md:w-10"
                >
                  <Bell size={18} weight="fill" className="md:w-5 md:h-5" />
                  {unreadCount > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-amber-500 text-white border-2 border-red-600 text-xs"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 max-w-[calc(100vw-2rem)] p-0" align="end">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => onNotificationClick(notification)}
                        className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.read ? 'bg-red-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                              notification.type === 'critical'
                                ? 'bg-rose-600'
                                : notification.type === 'warning'
                                ? 'bg-amber-500'
                                : 'bg-emerald-600'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">
                              {notification.projectName}
                            </p>
                            <p className="text-sm text-gray-700 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <Select value={currentRole} onValueChange={(value) => onRoleChange(value as UserRole)}>
              <SelectTrigger className="w-[120px] sm:w-[140px] md:w-[180px] bg-white text-gray-900 border-none h-9 md:h-10 text-sm md:text-base">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <User size={14} weight="fill" className="flex-shrink-0 md:w-4 md:h-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="admin">
                  <span className="font-medium">Admin</span>
                </SelectItem>
                <SelectItem value="owner">
                  <span className="font-medium">Owner</span>
                </SelectItem>
                <SelectItem value="site-manager">
                  <span className="font-medium">Site Manager</span>
                </SelectItem>
                <SelectItem value="client">
                  <span className="font-medium">Client</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </nav>
  );
}
