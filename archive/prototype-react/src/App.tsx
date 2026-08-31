import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import ZoneDetail from './pages/ZoneDetail'
import Alerts from './pages/Alerts'
import News from './pages/News'
import Citizen from './pages/Citizen'
import Analytics from './pages/Analytics'
import Admin from './pages/Admin'
import About from './pages/About'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Landing />} />
      <Route
        path="/citizen"
        element={
          <ProtectedRoute allowedRoles={['admin', 'citizen']}>
            <Citizen />
          </ProtectedRoute>
        }
      />
      <Route element={<AppLayout />}>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/zone/:id"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ZoneDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Alerts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/news"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <News />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route path="/about" element={<About />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
