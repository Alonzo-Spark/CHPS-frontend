import React from 'react'
import { Bell } from 'lucide-react'
import './StubPage.css'

export default function Notices() {
  return (
    <div className="stub-page">
      <div className="stub-icon"><Bell size={36} /></div>
      <h2>Notices</h2>
      <p>Connect your backend to display notices here.</p>
    </div>
  )
}
