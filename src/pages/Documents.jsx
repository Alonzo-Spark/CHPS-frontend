import React from 'react'
import { FileText } from 'lucide-react'
import './StubPage.css'

export default function Documents() {
  return (
    <div className="stub-page">
      <div className="stub-icon"><FileText size={36} /></div>
      <h2>Documents</h2>
      <p>Connect your backend to manage documents here.</p>
    </div>
  )
}
