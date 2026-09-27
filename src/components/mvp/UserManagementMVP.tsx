import { useState } from 'react'
import { useUsers } from '../../hooks/useUsers'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { toast } from 'sonner'
import { UsersThree, UserPlus, Phone, MapPin, EnvelopeSimple, Key, CopySimple } from '@phosphor-icons/react'
import { Badge } from '../ui/badge'

export function UserManagementMVP() {
    const { clients, siteManagers, loading, createUser, updateUser } = useUsers()
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [creating, setCreating] = useState(false)
    
    const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
    
    // Reset password state
    const [resetUser, setResetUser] = useState<any | null>(null)
    const [resetPassword, setResetPassword] = useState('')
    const [resetting, setResetting] = useState(false)
    
    // Form state
    const [form, setForm] = useState({
        full_name: '',
        phone: '',
        email: '',
        location: '',
        role: 'CLIENT' as 'CLIENT' | 'SITE_MANAGER',
        password: '',
    })

    const resetForm = () => {
        setForm({
            full_name: '',
            phone: '',
            email: '',
            location: '',
            role: 'CLIENT',
            password: '',
        })
    }

    const handleCreateUser = async () => {
        if (!form.full_name || !form.phone || !form.email) {
            toast.error('Name, Phone, and Email are mandatory')
            return
        }

        // Basic validations
        const phoneRegex = /^\+?[0-9]{10,12}$/
        if (!phoneRegex.test(form.phone.replace(/\s+/g, ''))) {
            toast.error('Please enter a valid phone number (10-12 digits)')
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(form.email)) {
            toast.error('Please enter a valid email address')
            return
        }

        setCreating(true)
        const { error, temporaryPassword } = await createUser({
            role: form.role,
            full_name: form.full_name,
            phone: form.phone,
            email: form.email,
            location: form.location,
            password: form.password || undefined
        })
        setCreating(false)

        if (error) {
            toast.error('Failed to create user: ' + error)
        } else {
            toast.success('User created successfully')
            setShowCreateDialog(false)
            resetForm()
            if (temporaryPassword) {
                setGeneratedPassword(temporaryPassword)
            }
        }
    }

    const handleResetPassword = async () => {
        if (!resetUser || !resetPassword) {
            toast.error('Please enter a new password')
            return
        }
        
        setResetting(true)
        const { error } = await updateUser(resetUser.id, {
            full_name: resetUser.full_name,
            phone: resetUser.phone,
            location: resetUser.location,
            role: resetUser.role,
            password: resetPassword
        })
        setResetting(false)

        if (error) {
            toast.error('Failed to reset password: ' + error)
        } else {
            toast.success('Password reset successfully')
            setResetUser(null)
            setResetPassword('')
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
                <Button onClick={() => setShowCreateDialog(true)} size="sm" className="bg-red-600 hover:bg-red-700">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
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
                                            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0 border-gray-200 hover:bg-gray-100" onClick={() => setResetUser(user)} title="Reset Password">
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

                {/* Create User Dialog */}
                <Dialog open={showCreateDialog} onOpenChange={(open) => {
                    setShowCreateDialog(open)
                    if (!open) resetForm()
                }}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Create New User</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label>Role *</Label>
                                <Select
                                    value={form.role}
                                    onValueChange={(v) => setForm({ ...form, role: v as 'CLIENT' | 'SITE_MANAGER' })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CLIENT">Client</SelectItem>
                                        <SelectItem value="SITE_MANAGER">Site Manager</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Full Name *</Label>
                                <Input
                                    placeholder="Mr. Ravi Kumar"
                                    value={form.full_name}
                                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Phone *</Label>
                                <Input
                                    placeholder="+91 98765 43210"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Email *</Label>
                                <Input
                                    type="email"
                                    placeholder="user@example.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Location (Optional for Site Managers)</Label>
                                <Input
                                    placeholder="City, Area"
                                    value={form.location}
                                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Password (Optional)</Label>
                                <Input
                                    type="text"
                                    placeholder="Leave blank to auto-generate"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 mt-1">If left blank, a secure temporary password will be generated.</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateUser} disabled={creating} className="bg-red-600 hover:bg-red-700">
                                {creating ? 'Creating...' : 'Create User'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Generated Password Dialog */}
                <Dialog open={!!generatedPassword} onOpenChange={(open) => !open && setGeneratedPassword(null)}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle>User Created</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-3 text-center">
                            <p className="text-sm text-gray-600">A secure password has been generated down below. Please copy it and share it with the user.</p>
                            <div className="p-3 bg-gray-100 rounded-lg flex items-center justify-between border border-gray-200">
                                <code className="text-lg font-mono font-bold text-gray-900">{generatedPassword}</code>
                                <Button size="sm" variant="ghost" onClick={() => {
                                    navigator.clipboard.writeText(generatedPassword || '')
                                    toast.success('Password copied to clipboard')
                                }}>
                                    <CopySimple className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setGeneratedPassword(null)} className="w-full">Done</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Reset Password Dialog */}
                <Dialog open={!!resetUser} onOpenChange={(open) => {
                    if (!open) setResetUser(null)
                }}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle>Reset Password</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <p className="text-sm text-gray-500">
                                Enter a new password for <span className="font-semibold text-gray-900">{resetUser?.full_name}</span>.
                            </p>
                            <div>
                                <Label>New Password</Label>
                                <Input
                                    type="text"
                                    placeholder="Enter new password"
                                    value={resetPassword}
                                    onChange={(e) => setResetPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setResetUser(null)}>Cancel</Button>
                            <Button onClick={handleResetPassword} disabled={resetting || !resetPassword} className="bg-red-600 hover:bg-red-700">
                                {resetting ? 'Resetting...' : 'Reset Password'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    )
}
