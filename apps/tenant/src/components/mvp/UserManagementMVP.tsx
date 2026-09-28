import { useEffect, useState } from 'react'
import { useUsers } from '../../hooks/useUsers'
import { useSites } from '../../hooks/useSites'
import api from '../../lib/api'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { toast } from 'sonner'
import { UsersThree, UserPlus, Phone, MapPin, EnvelopeSimple, Key, CopySimple, At } from '@phosphor-icons/react'
import { Badge } from '../ui/badge'

export function UserManagementMVP() {
    const { clients, siteManagers, loading, updateUser } = useUsers()
    const { sites } = useSites()
    const [showInviteDialog, setShowInviteDialog] = useState(false)
    const [inviting, setInviting] = useState(false)
    const [invites, setInvites] = useState<any[]>([])

    // Manage sign-in state (password reset + username set)
    const [resetUser, setResetUser] = useState<any | null>(null)
    const [resetPassword, setResetPassword] = useState('')
    const [resetUsername, setResetUsername] = useState('')
    const [resetting, setResetting] = useState(false)

    const [inviteForm, setInviteForm] = useState({
        email: '',
        role: 'SITE_MANAGER' as 'ADMIN' | 'SITE_MANAGER' | 'CLIENT',
        site_id: '',
    })

    const fetchInvites = async () => {
        try {
            const { data } = await api.get('/users/invites')
            setInvites(data)
        } catch { setInvites([]) }
    }

    useEffect(() => { fetchInvites() }, [])

    const handleInvite = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(inviteForm.email)) {
            toast.error('Please enter a valid email address')
            return
        }
        if (inviteForm.role === 'CLIENT' && !inviteForm.site_id) {
            toast.error('Pick the client\'s site')
            return
        }
        setInviting(true)
        try {
            await api.post('/users/invite', {
                email: inviteForm.email,
                role: inviteForm.role,
                siteId: inviteForm.role === 'CLIENT' ? inviteForm.site_id : null,
            })
            toast.success(`Invite sent to ${inviteForm.email}`)
            setShowInviteDialog(false)
            setInviteForm({ email: '', role: 'SITE_MANAGER', site_id: '' })
            fetchInvites()
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to send invite')
        } finally {
            setInviting(false)
        }
    }

    const handleRevokeInvite = async (id: string) => {
        try {
            await api.delete(`/users/invites/${id}`)
            setInvites(prev => prev.filter(i => i.id !== id))
            toast.success('Invite revoked')
        } catch { toast.error('Failed to revoke') }
    }

    const handleResetPassword = async () => {
        if (!resetUser || (!resetPassword && resetUsername === (resetUser.username || ''))) {
            toast.error('Enter a new password or change the username')
            return
        }

        setResetting(true)
        const { error } = await updateUser(resetUser.id, {
            full_name: resetUser.full_name,
            phone: resetUser.phone,
            location: resetUser.location,
            role: resetUser.role,
            ...(resetPassword ? { password: resetPassword } : {}),
            ...(resetUsername !== (resetUser.username || '') ? { username: resetUsername } : {})
        })
        setResetting(false)

        if (error) {
            toast.error('Failed to update sign-in: ' + error)
        } else {
            toast.success('Sign-in updated')
            setResetUser(null)
            setResetPassword('')
            setResetUsername('')
        }
    }

    // Combine clients and site managers for display
    const allUsers = [
        ...clients.map(c => ({ ...c, role: 'CLIENT' })),
        ...siteManagers.map(m => ({ ...m, role: 'SITE_MANAGER' }))
    ]

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                    <UsersThree className="w-5 h-5 text-gray-400" />
                    Manage Users
                </CardTitle>
                <Button onClick={() => setShowInviteDialog(true)} size="sm" className="bg-red-600 hover:bg-red-700">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite User
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {allUsers.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No users found.</p>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {allUsers.map((user) => (
                                    <div key={user.id} className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-3 gap-2">
                                            <div className="space-y-1">
                                                <h3 className="font-semibold text-gray-900 leading-tight">{user.full_name || 'Unnamed User'}</h3>
                                                <Badge variant={user.role === 'CLIENT' ? 'default' : 'secondary'} className={user.role === 'CLIENT' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                                                    {user.role === 'CLIENT' ? 'Client' : 'Site Manager'}
                                                </Badge>
                                            </div>
                                            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0 border-gray-200 hover:bg-gray-100"
                                                onClick={() => { setResetUser(user); setResetUsername(user.username || '') }} title="Manage sign-in">
                                                <Key className="w-4 h-4 text-gray-500" />
                                            </Button>
                                        </div>
                                        <div className="space-y-2 text-sm text-gray-600">
                                            {user.phone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="w-4 h-4 text-gray-400" />
                                                    <span>{user.phone}</span>
                                                </div>
                                            )}
                                            {user.email && (
                                                <div className="flex items-center gap-2">
                                                    <EnvelopeSimple className="w-4 h-4 text-gray-400" />
                                                    <span className="truncate" title={user.email}>{user.email}</span>
                                                </div>
                                            )}
                                            {user.username && (
                                                <div className="flex items-center gap-2">
                                                    <At className="w-4 h-4 text-gray-400" />
                                                    <span className="truncate" title={user.username}>{user.username}</span>
                                                </div>
                                            )}
                                            {user.location && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-gray-400" />
                                                    <span className="truncate" title={user.location}>{user.location}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Pending invites */}
                {invites.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Pending invites</h3>
                        <div className="space-y-2">
                            {invites.map(inv => (
                                <div key={inv.id} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="font-medium text-gray-900">{inv.email}</span>
                                        <Badge className="bg-amber-100 text-amber-800">{inv.role}</Badge>
                                        <span className="text-xs text-gray-500">
                                            expires {new Date(inv.expiresAt).toLocaleDateString('en-IN')}
                                        </span>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-red-600 h-7"
                                        onClick={() => handleRevokeInvite(inv.id)}>Revoke</Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Invite User Dialog */}
                <Dialog open={showInviteDialog} onOpenChange={(open) => {
                    setShowInviteDialog(open)
                    if (!open) setInviteForm({ email: '', role: 'SITE_MANAGER', site_id: '' })
                }}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Invite User</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-gray-500">
                            They'll get an email with a link to set their name and password (valid 72h).
                        </p>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label>Role *</Label>
                                <Select
                                    value={inviteForm.role}
                                    onValueChange={(v) => setInviteForm({ ...inviteForm, role: v as any, site_id: '' })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SITE_MANAGER">Site Manager</SelectItem>
                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                        <SelectItem value="CLIENT">Client (links to a site)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Email *</Label>
                                <Input
                                    type="email"
                                    placeholder="user@example.com"
                                    value={inviteForm.email}
                                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                />
                            </div>
                            {inviteForm.role === 'CLIENT' && (
                                <div>
                                    <Label>Client's site *</Label>
                                    <Select
                                        value={inviteForm.site_id}
                                        onValueChange={(v) => setInviteForm({ ...inviteForm, site_id: v })}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                                        <SelectContent>
                                            {sites.map((s: any) => (
                                                <SelectItem key={s.id} value={s.id}>{s.site_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>Cancel</Button>
                            <Button onClick={handleInvite} disabled={inviting} className="bg-red-600 hover:bg-red-700">
                                {inviting ? 'Sending...' : 'Send Invite'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Manage Sign-in Dialog — password reset + username set */}
                <Dialog open={!!resetUser} onOpenChange={(open) => {
                    if (!open) setResetUser(null)
                }}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle>Manage Sign-in</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <p className="text-sm text-gray-500">
                                Update sign-in details for <span className="font-semibold text-gray-900">{resetUser?.full_name}</span>.
                            </p>
                            <div>
                                <Label>Username</Label>
                                <Input
                                    type="text"
                                    placeholder="name"
                                    value={resetUsername}
                                    onChange={(e) => setResetUsername(e.target.value)}
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Sign-in name: {resetUsername || 'name'}@&lt;this workspace&gt;
                                </p>
                            </div>
                            <div>
                                <Label>New Password (optional)</Label>
                                <Input
                                    type="text"
                                    placeholder="Leave blank to keep current"
                                    value={resetPassword}
                                    onChange={(e) => setResetPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setResetUser(null)}>Cancel</Button>
                            <Button onClick={handleResetPassword} disabled={resetting}
                                className="bg-red-600 hover:bg-red-700">
                                {resetting ? 'Saving...' : 'Save'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    )
}
