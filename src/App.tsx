import { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { useAppStore } from './store/useAppStore';
import { ConfirmDialog } from './components/ConfirmDialog';

function App() {
  const { fetchData, isLoading } = useAppStore();

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
      <Sidebar />
      <MainContent />
      <ConfirmDialog />
    </div>
  );
}

export default App;
