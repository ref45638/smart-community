import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminLogin from './pages/admin/Login'
import QRCodeGenerator from './pages/admin/QRCodeGenerator'
import PollManager from './pages/admin/PollManager'
import ResidentHome from './pages/resident/Home'
import ResidentLogin from './pages/resident/Login'
import VotePage from './pages/resident/VotePage'

function App() {
    return (
        <HashRouter>
            <Routes>
                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/qrcode" element={<QRCodeGenerator />} />
                <Route path="/admin/polls" element={<PollManager />} />
                <Route path="/admin" element={<Navigate to="/admin/qrcode" replace />} />

                {/* Resident Routes */}
                <Route path="/" element={<ResidentHome />} />
                <Route path="/login" element={<ResidentLogin />} />
                <Route path="/vote/:pollId" element={<VotePage />} />

                {/* Redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </HashRouter>
    )
}

export default App
