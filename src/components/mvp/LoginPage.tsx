import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { HardHat, Eye, EyeSlash, User, WarningCircle, Copy } from '@phosphor-icons/react'

export function LoginPage() {
    const { signIn, signUp, loading, error } = useAuth()
    const [isSignUp, setIsSignUp] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [localError, setLocalError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLocalError(null)

        if (isSignUp) {
            if (!fullName.trim()) {
                setLocalError('Please enter your full name')
                return
            }
            const { error } = await signUp(email, password, fullName, phone, 'OWNER')
            if (error) {
                setLocalError(error.message)
            }
        } else {
            const { error } = await signIn(email, password)
            if (error) {
                setLocalError(error.message)
            }
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-100 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-xl mb-4 shadow-lg">
                        <HardHat className="w-10 h-10 text-white" weight="fill" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">ELANJAI BUILDOS</h1>
                    <p className="text-gray-500 mt-1">Construction Management System</p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-xl shadow-xl p-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                        {isSignUp ? 'Create Account' : 'Welcome Back'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isSignUp && (
                            <>
                                <div>
                                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            id="fullName"
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Enter your name"
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone Number
                                    </label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+91 98765 43210"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeSlash className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {(localError || error) && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                                <WarningCircle className="w-5 h-5 flex-shrink-0" />
                                <span>{localError || error?.message}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 focus:ring-4 focus:ring-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                                </span>
                            ) : (
                                isSignUp ? 'Create Account' : 'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => {
                                setIsSignUp(!isSignUp)
                                setLocalError(null)
                            }}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                            {isSignUp
                                ? 'Already have an account? Sign In'
                                : "Don't have an account? Create one"}
                        </button>
                    </div>

                    {/* Demo Credentials */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 font-medium mb-2">Demo Credentials (click to fill):</p>
                        <div className="text-xs text-gray-600 space-y-2">
                            <button
                                type="button"
                                onClick={() => { setEmail('admin@demo.com'); setPassword('admin123'); }}
                                className="flex items-center justify-between w-full p-2 hover:bg-gray-100 rounded transition-colors text-left group"
                            >
                                <span><span className="font-medium">Admin:</span> admin@demo.com / admin123</span>
                                <Copy className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                            </button>
                            <button
                                type="button"
                                onClick={() => { setEmail('owner@demo.com'); setPassword('owner123'); }}
                                className="flex items-center justify-between w-full p-2 hover:bg-gray-100 rounded transition-colors text-left group"
                            >
                                <span><span className="font-medium">Owner:</span> owner@demo.com / owner123</span>
                                <Copy className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                            </button>
                            <button
                                type="button"
                                onClick={() => { setEmail('manager@demo.com'); setPassword('manager123'); }}
                                className="flex items-center justify-between w-full p-2 hover:bg-gray-100 rounded transition-colors text-left group"
                            >
                                <span><span className="font-medium">Manager:</span> manager@demo.com / manager123</span>
                                <Copy className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                            </button>
                            <button
                                type="button"
                                onClick={() => { setEmail('client@demo.com'); setPassword('client123'); }}
                                className="flex items-center justify-between w-full p-2 hover:bg-gray-100 rounded transition-colors text-left group"
                            >
                                <span><span className="font-medium">Client:</span> client@demo.com / client123</span>
                                <Copy className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                            </button>
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs text-gray-400 mt-6">
                    © 2026 Elanjai Buildos. All rights reserved.
                </p>
            </div>
        </div>
    )
}
