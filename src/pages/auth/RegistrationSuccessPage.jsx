import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, CheckCircle2, Mail, ArrowRight } from 'lucide-react'

const RegistrationSuccessPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 flex flex-col items-center justify-center px-4 py-10">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-green-900 rounded-xl flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-green-900">Registration Successful</h1>
        <p className="text-gray-500 text-sm mt-1">Please check your email to complete the setup</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 w-full max-w-lg p-8">
        <h2 className="text-xl font-bold text-green-900 mb-1">Next Steps</h2>
        <p className="text-sm text-gray-500 mb-6">
          We've sent an email to your registered address with a secure link to set your password.
          Please check your inbox (and spam folder) and follow the instructions to complete your registration.
        </p>

        {/* Action Button */}
        <div className="text-center">
          <Link to="/login" className="btn-primary">
            Go to Login
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-start gap-2">
          <Shield size={15} className="text-green-700 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-500 leading-relaxed">
            This connection is secured via enterprise-grade 256-bit encryption. Your credentials are encrypted before storage.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between w-full max-w-lg mt-6 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-gray-400">System Status: Operational</span>
        </div>
        <span className="text-xs text-gray-400">© 2024 Institutional Audit Management. All Rights Reserved.</span>
      </div>
    </div>
  )
}

export default RegistrationSuccessPage