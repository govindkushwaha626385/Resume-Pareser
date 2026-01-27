import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Pages
import UploadPage from './pages/UploadPage';
import DashboardPage from './pages/DashboardPage';
import ReportPage from './pages/ReportPage';

function App() {
  return (
    // Main App Container
    // - antialiased: Sharper text rendering
    // - overflow-x-hidden: Critical for mobile to prevent horizontal scrolling
    // - selection: Custom text highlight color
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-700 relative overflow-x-hidden">
      
      {/* --- AESTHETIC BACKGROUND LAYER --- */}
      {/* Fixed position ensures it stays in place while you scroll on mobile */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        
        {/* Top Left Gradient Orb */}
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] min-w-[300px] min-h-[300px] rounded-full bg-indigo-200/30 blur-[100px] mix-blend-multiply animate-pulse"></div>
        
        {/* Bottom Right Gradient Orb */}
        <div className="absolute bottom-[-10%] right-[-5%] w-[35vw] h-[35vw] min-w-[250px] min-h-[250px] rounded-full bg-blue-100/40 blur-[80px] mix-blend-multiply"></div>
        
        {/* Center Subtle Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] rounded-full bg-white/60 blur-[120px] opacity-60"></div>
      
      </div>

      {/* --- CONTENT LAYER --- */}
      {/* Relative + Z-10 ensures content sits ON TOP of the background */}
      <div className="relative z-10">
        <Router>
          <Routes>
            
            {/* Redirect Home ("/") to Dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Dashboard: Shows job list and candidate leaderboard */}
            <Route path="/dashboard" element={<DashboardPage />} />
            
            {/* Upload Page: To submit new resumes */}
            <Route path="/upload" element={<UploadPage />} />
            
            {/* Report Page: Detailed analysis of a specific candidate */}
            <Route path="/report/:candidateId" element={<ReportPage />} />

          </Routes>
        </Router>
      </div>
    </div>
  );
}

export default App;