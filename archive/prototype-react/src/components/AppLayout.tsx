import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-ridge-bg">
      <Sidebar />
      <div className="ml-[240px] min-h-screen transition-all">
        <TopBar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
