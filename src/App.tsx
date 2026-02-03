import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { QueryModal } from './components/QueryModal';
import type { DbTable } from './types/db';
import { api } from './services/api';

function App() {
  const [tables, setTables] = useState<DbTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<DbTable | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTables = useCallback(async () => {
    try {
      const data = await api.getTables();
      setTables(data);
    } catch (error) {
      console.error('Failed to fetch tables:', error);
      alert('Failed to load tables. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const handleSelectTable = (table: DbTable) => {
    setSelectedTable(table);
    setIsModalOpen(true);
  };

  const handleCreateTable = async (name: string, description: string) => {
    try {
      await api.createTable(name, description);
      await fetchTables(); // Refresh list
    } catch (error) {
      console.error('Failed to create table:', error);
      alert('Failed to create table.');
    }
  };

  const handleDeleteTable = async (id: string) => {
    try {
      await api.deleteTable(id);
      if (selectedTable?.id === id) {
        setIsModalOpen(false);
        setSelectedTable(null);
      }
      await fetchTables(); // Refresh list
    } catch (error) {
      console.error('Failed to delete table:', error);
      alert('Failed to delete table.');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <Sidebar
        tables={tables}
        selectedTableId={selectedTable?.id || null}
        onSelectTable={handleSelectTable}
        onCreateTable={handleCreateTable}
        onDeleteTable={handleDeleteTable}
      />

      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        <div className="max-w-md space-y-6">
          <div className="inline-block p-4 rounded-full bg-slate-900/50 border border-slate-800 mb-4 animate-pulse">
            <span className="text-4xl">🚀</span>
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-br from-white to-slate-500 bg-clip-text text-transparent">
            Anti-Gravity
          </h1>
          <p className="text-slate-400 text-lg">
            Manage your Databricks queries with style. <br />
            Select a table to start.
          </p>
          <div className="flex justify-center gap-2 text-xs text-slate-600 font-mono mt-8">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span>Supabase Connected</span>
          </div>
        </div>
      </main>

      {selectedTable && (
        <QueryModal
          isOpen={isModalOpen}
          onClose={closeModal}
          table={selectedTable}
        />
      )}
    </div>
  );
}

export default App;
