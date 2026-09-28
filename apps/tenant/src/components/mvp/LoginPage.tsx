import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { currentTenantSlug } from '../../lib/tenant'
import { HardHat, Eye, EyeSlash, WarningCircle, Copy } from '@phosphor-icons/react'

export function LoginPage() {
    const { signIn, loading, error } = useAuth()
    const [identifier, setIdentifier] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [localError, setLocalError] = useState<string | null>(null)
    const slug = currentTenantSlug()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLocalError(null)
        const { error } = await signIn(identifier, password)
        if (error) setLocalError(error.message)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-xl mb-4 shadow-lg">
                        <HardHat className="w-10 h-10 text-white" weight="fill" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">ELANJAI BUILDOS</h1>
                    <p className="text-gray-500 mt-1">
                        {slug ? <>Workspace: <span className="font-medium text-indigo-700">{slug}</span></>
                             : 'Construction Management System'}
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-xl p-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                                Email or Username
                            </label>
                            <input
                                id="identifier"
                                type="text"
                                autoComplete="username"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder={slug ? `you@company.com or name@${slug}` : 'you@company.com or name@workspace'}
                                required
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <Link to="/forgot-password" className="text-xs text-indigo-600 hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={8}
                                    className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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
                            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                    Signing In...
                                </span>
                            ) : 'Sign In'}
                        </button>
                    </form>

                    {!slug && (
                        <div className="mt-6 text-center">
                            <Link to="/signup" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                                Don't have a workspace? Create one
                            </Link>
                        </div>
                    )}

                    {slug === 'demo' && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 font-medium mb-2">Demo credentials (click to fill):</p>
                            <button
                                type="button"
                                onClick={() => { setIdentifier('owner@demo.local'); setPassword('Owner@12345'); }}
                                className="flex items-center justify-between w-full p-2 hover:bg-gray-100 rounded transition-colors text-left group text-xs text-gray-600"
                            >
                                <span><span className="font-medium">Owner:</span> owner@demo.local / Owner@12345</span>
                                <Copy className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-center text-xs text-gray-400 mt-6">
                    © 2026 Elanjai Buildos. All rights reserved.
                </p>
            </div>
        </div>
    )
}
