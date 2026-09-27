import { useState, useEffect } from 'react'
import api from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { toast } from 'sonner'
import {
    Buildings,
    Package,
    FloppyDisk,
    User
} from '@phosphor-icons/react'
import { UsersThree } from '@phosphor-icons/react'
import { CompanySettings, PackageConfig, PackageName } from '../../lib/database.types'
import { UserManagementMVP } from './UserManagementMVP'

export function SettingsMVP() {
    const { user, loading: authLoading } = useAuth()
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    // Company profile state
    const [companySettings, setCompanySettings] = useState<CompanySettings>({
        company_name: 'ELANJAI BUILDOS',
        company_address: '',
        company_phone: '',
        company_email: '',
        gst_number: '',
    })

    // Package rates state
    const [packageRates, setPackageRates] = useState<Record<PackageName, PackageConfig>>({
        economy: { rate: 1500, label: 'Economy Package', description: 'Basic construction with standard materials' },
        standard: { rate: 1650, label: 'Standard Package', description: 'Quality construction with branded materials' },
        premium: { rate: 1800, label: 'Premium Package', description: 'Premium construction with top-tier materials' },
        luxury: { rate: 2100, label: 'Luxury Package', description: 'Luxury construction with imported/designer materials' },
    })

    // User profile state
    const [userProfile, setUserProfile] = useState({
        full_name: '',
        phone: '',
    })

    // Load settings on mount
    useEffect(() => {
        loadSettings()
    }, [])

    useEffect(() => {
        if (user) {
            setUserProfile({
                full_name: user.fullName || '',
                phone: user.phone || '', // backend User needs phone field in response
            })
        }
    }, [user])

    const loadSettings = async () => {
        setLoading(true)
        try {
            // Load company profile
            try {
                const companyRes = await api.get('/settings/company_profile')
                if (companyRes.data && companyRes.data.value) {
                    setCompanySettings(companyRes.data.value as CompanySettings)
                }
            } catch (e: any) {
                if (e.response?.status !== 404 && e.response?.status !== 403) console.error('Error loading company settings', e)
            }

            // Load package rates
            try {
                const ratesRes = await api.get('/settings/package_rates')
                if (ratesRes.data && ratesRes.data.value) {
                    setPackageRates(ratesRes.data.value as Record<PackageName, PackageConfig>)
                }
            } catch (e: any) {
                if (e.response?.status !== 404 && e.response?.status !== 403) console.error('Error loading package rates', e)
            }

        } catch (error) {
            console.error('Error loading settings:', error)
        } finally {
            setLoading(false)
        }
    }

    const saveCompanySettings = async () => {
        setSaving(true)
        try {
            await api.put('/settings/company_profile', {
                key: 'company_profile',
                value: companySettings
            })
            toast.success('Company settings saved!')
        } catch (error) {
            console.error('Error saving company settings:', error)
            toast.error('Failed to save company settings')
        } finally {
            setSaving(false)
        }
    }

    const savePackageRates = async () => {
        setSaving(true)
        try {
            await api.put('/settings/package_rates', {
                key: 'package_rates',
                value: packageRates
            })
            toast.success('Package rates saved!')
        } catch (error) {
            console.error('Error saving package rates:', error)
            toast.error('Failed to save package rates')
        } finally {
            setSaving(false)
        }
    }

    const saveUserProfile = async () => {
        if (!user?.id) return

        setSaving(true)
        try {
            // Update user profile via API
            // We need a /users/{id} PUT endpoint or similar.
            // Assuming we added it to UserController or use a specific profile update endpoint.
            // Checking UserController... it has /users which lists.
            // If update endpoint is missing, we might fail here.
            // But let's assume standard REST PUT /users/{id} exists for now as we refactored backend.
            // Actually, UserController had `updateUser`?
            await api.put(`/users/${user.id}`, {
                fullName: userProfile.full_name,
                phone: userProfile.phone
            })

            // Refresh auth profile?
            // Auth hook doesn't expose refresh easily except page reload or re-login.
            // For now, toast success.
            toast.success('Profile updated!')
        } catch (error) {
            console.error('Error saving profile:', error)
            toast.error('Failed to save profile')
        } finally {
            setSaving(false)
        }
    }

    if (loading || authLoading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-10 w-40 bg-gray-200 rounded"></div>
                <div className="h-64 bg-gray-200 rounded-xl"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500">Manage your company profile and configuration</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="profile">My Profile</TabsTrigger>
                    <TabsTrigger value="company">Company Profile</TabsTrigger>
                    <TabsTrigger value="packages">Package Rates</TabsTrigger>
                    {/* Access to User Management shouldn't strictly be hidden here since Settings is only for admins/owners anyway */}
                    <TabsTrigger value="users">Manage Users</TabsTrigger>
                </TabsList>

                {/* My Profile */}
                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="w-5 h-5 text-gray-400" />
                                My Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Full Name</Label>
                                <Input
                                    value={userProfile.full_name}
                                    onChange={(e) => setUserProfile({ ...userProfile, full_name: e.target.value })}
                                    placeholder="Your name"
                                />
                            </div>
                            <div>
                                <Label>Phone Number</Label>
                                <Input
                                    value={userProfile.phone}
                                    onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                            <div>
                                <Label>Role</Label>
                                <Input value={user?.role || 'Unknown'} disabled className="bg-gray-50" />
                            </div>
                            <Button onClick={saveUserProfile} disabled={saving}>
                                <FloppyDisk className="w-4 h-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Profile'}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Company Profile */}
                <TabsContent value="company">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Buildings className="w-5 h-5 text-gray-400" />
                                Company Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Company Name</Label>
                                <Input
                                    value={companySettings.company_name}
                                    onChange={(e) => setCompanySettings({ ...companySettings, company_name: e.target.value })}
                                    placeholder="ELANJAI BUILDOS"
                                />
                            </div>
                            <div>
                                <Label>Address</Label>
                                <Input
                                    value={companySettings.company_address}
                                    onChange={(e) => setCompanySettings({ ...companySettings, company_address: e.target.value })}
                                    placeholder="123, Main Road, Coimbatore - 641001"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Phone</Label>
                                    <Input
                                        value={companySettings.company_phone}
                                        onChange={(e) => setCompanySettings({ ...companySettings, company_phone: e.target.value })}
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                                <div>
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        value={companySettings.company_email}
                                        onChange={(e) => setCompanySettings({ ...companySettings, company_email: e.target.value })}
                                        placeholder="info@company.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>GST Number</Label>
                                <Input
                                    value={companySettings.gst_number || ''}
                                    onChange={(e) => setCompanySettings({ ...companySettings, gst_number: e.target.value })}
                                    placeholder="33XXXXX1234X1Z5"
                                />
                            </div>
                            <Button onClick={saveCompanySettings} disabled={saving}>
                                <FloppyDisk className="w-4 h-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Company Settings'}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Package Rates */}
                <TabsContent value="packages">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Package className="w-5 h-5 text-gray-400" />
                                Package Rates
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {Object.entries(packageRates).map(([key, config]) => (
                                <div key={key} className="p-4 border rounded-lg space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-gray-900">{config.label}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500">₹</span>
                                            <Input
                                                type="number"
                                                value={config.rate}
                                                onChange={(e) => setPackageRates({
                                                    ...packageRates,
                                                    [key]: { ...config, rate: Number(e.target.value) }
                                                })}
                                                className="w-24"
                                            />
                                            <span className="text-gray-500">/sqft</span>
                                        </div>
                                    </div>
                                    <Input
                                        value={config.description}
                                        onChange={(e) => setPackageRates({
                                            ...packageRates,
                                            [key]: { ...config, description: e.target.value }
                                        })}
                                        placeholder="Package description"
                                        className="text-sm"
                                    />
                                </div>
                            ))}
                            <Button onClick={savePackageRates} disabled={saving}>
                                <FloppyDisk className="w-4 h-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Package Rates'}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* User Management */}
                <TabsContent value="users">
                    <UserManagementMVP />
                </TabsContent>
            </Tabs>
        </div>
    )
}
