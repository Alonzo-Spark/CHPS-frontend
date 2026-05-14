import Sidebar from '../components/layout/Sidebar'
import Topbar from '../components/layout/Topbar'

export default function DashboardLayout({ children, breadcrumbs }) {
  return (
    <div style={{ display: 'flex', background: '#f1f5f9', minHeight: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'auto' }}>
        <Topbar breadcrumbs={breadcrumbs} />
        <div style={{ flex: 1 }}>{children}</div>
      </div>
    </div>
  )
}
