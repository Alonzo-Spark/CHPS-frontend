import Sidebar from '../components/layout/Sidebar'
import Topbar from '../components/layout/Topbar'

export default function DashboardLayout({ children, breadcrumbs }) {
  return (
    <div style={{ display: 'flex', background: '#f1f5f9', minHeight: '100vh', overflow: 'hidden', width: '100%' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'auto', width: '100%' }}>
        <Topbar breadcrumbs={breadcrumbs} />
        <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column' }}>{children}</div>
      </div>
    </div>
  )
}
