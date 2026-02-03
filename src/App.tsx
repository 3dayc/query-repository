import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { QueryModal } from './components/QueryModal';
import { tableList, type TableInfo } from './data/mockData';

function App() {
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectTable = (table: TableInfo) => {
    setSelectedTable(table);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <Sidebar tables={tableList} onSelectTable={handleSelectTable} />

      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        <div className="max-w-md space-y-6">
          <div className="inline-block p-4 rounded-full bg-slate-900/50 border border-slate-800 mb-4 animate-pulse">
            <span className="text-4xl">🚀</span>
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-br from-white to-slate-500 bg-clip-text text-transparent">
            Select a Table
          </h1>
          <p className="text-slate-400 text-lg">
            Choose a table from the sidebar to view details and query examples.
          </p>
          <div className="flex justify-center gap-2 text-xs text-slate-600 font-mono mt-8">
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800">Use Table List</span>
            <span>→</span>
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800">View Queries</span>
            <span>→</span>
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800">Copy & Run</span>
          </div>
        </div>
      </main>

      <QueryModal
        isOpen={isModalOpen}
        onClose={closeModal}
        table={selectedTable}
      />
    </div>
  );
}

export default App;
