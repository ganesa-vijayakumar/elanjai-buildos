import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Phone, LockKey, ArrowRight } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface ClientLoginProps {
  onLogin: (phoneNumber: string) => void
}

export function ClientLogin({ onLogin }: ClientLoginProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [generatedOtp, setGeneratedOtp] = useState('')

  const handleSendOtp = () => {
    if (phoneNumber.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number')
      return
    }

    setIsLoading(true)
    const mockOtp = Math.floor(1000 + Math.random() * 9000).toString()
    setGeneratedOtp(mockOtp)

    setTimeout(() => {
      setOtpSent(true)
      setIsLoading(false)
      toast.success(`OTP sent to ${phoneNumber}`, {
        description: `Mock OTP: ${mockOtp} (for demo purposes)`,
        duration: 10000,
      })
    }, 1000)
  }

  const handleVerifyOtp = () => {
    if (otp !== generatedOtp) {
      toast.error('Invalid OTP', {
        description: 'Please enter the correct OTP',
      })
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      toast.success('Login successful!')
      onLogin(phoneNumber)
    }, 800)
  }

  const handleResendOtp = () => {
    handleSendOtp()
    setOtp('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ELANJAI BUILDOS</h1>
          <p className="text-gray-600 text-sm">CIVIL ENGINEERING CONTRACTOR</p>
          <div className="h-1 w-24 bg-red-600 mx-auto mt-4 rounded-full" />
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center">Client Portal</CardTitle>
            <CardDescription className="text-center">
              {otpSent ? 'Enter the OTP sent to your phone' : 'Login with your registered phone number'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!otpSent ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone-number">Phone Number</Label>
                  <div className="relative">
                    <Phone size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="phone-number"
                      type="tel"
                      placeholder="Enter 10-digit mobile number"
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      className="pl-10 h-12 text-lg"
                      disabled={isLoading}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Demo numbers: 9876543210, 9876543211, 9876543212
                  </p>
                </div>

                <Button
                  onClick={handleSendOtp}
                  disabled={phoneNumber.length !== 10 || isLoading}
                  className="w-full h-12 text-base bg-red-600 hover:bg-red-700"
                >
                  {isLoading ? 'Sending...' : 'Send OTP'}
                  <ArrowRight size={20} className="ml-2" />
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">One-Time Password</Label>
                  <div className="relative">
                    <LockKey size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 4-digit OTP"
                      maxLength={4}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="pl-10 h-12 text-lg tracking-widest text-center"
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    OTP sent to +91 {phoneNumber}
                  </p>
                </div>

                <Button
                  onClick={handleVerifyOtp}
                  disabled={otp.length !== 4 || isLoading}
                  className="w-full h-12 text-base bg-red-600 hover:bg-red-700"
                >
                  {isLoading ? 'Verifying...' : 'Verify & Login'}
                  <ArrowRight size={20} className="ml-2" />
                </Button>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false)
                      setOtp('')
                      setGeneratedOtp('')
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900 underline"
                  >
                    Change number
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Resend OTP
                  </button>
                </div>
              </>
            )}

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Secure authentication for project tracking
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">Need help accessing your project?</p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <a href="tel:9677265045" className="text-red-600 hover:text-red-700 font-medium">
              Call: 9677265045
            </a>
            <span className="text-gray-400">|</span>
            <a href="mailto:elanjaibuildos@gmail.com" className="text-red-600 hover:text-red-700 font-medium">
              Email Support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
