import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { useAppStore } from './store/useAppStore';
import { ConfirmDialog } from './components/ConfirmDialog';
import { TrashBin } from './components/TrashBin';
import { UrlSyncController } from './components/UrlSyncController';
import { LoginPage } from './pages/LoginPage';
import { AuthGuard } from './components/AuthGuard';
import { GlobalToast } from './components/GlobalToast';

function DashboardLayout() {
  const { fetchData, isLoading, viewMode } = useAppStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#0f1016] flex items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#0f1016] text-slate-200 overflow-hidden font-sans">
      <UrlSyncController />
      <Sidebar />
      {viewMode === 'trash' ? <TrashBin /> : <MainContent />}
      <ConfirmDialog />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <AuthGuard>
              <DashboardLayout />
            </AuthGuard>
          }
        />
      </Routes>
      <GlobalToast />
    </BrowserRouter>
  );
}

export default App;
