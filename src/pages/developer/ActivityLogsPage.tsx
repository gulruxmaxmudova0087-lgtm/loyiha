import React, { useEffect, useState } from 'react';
import { History, Search, Shield, RefreshCw } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ActivityLog } from '../../types';
import { RoleBadge } from '../../components/common/Badge';
import { formatDateUz, formatTimeUz } from '../../services/attendanceService';

export const ActivityLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(100));
      const snap = await getDocs(q);
      setLogs(snap.docs.map(d => ({ ...d.data(), id: d.id } as ActivityLog)));
    } catch (err) {
      console.error('Faoliyat jurnalini yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    l =>
      l.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-teal-600" />
            Tizim Faoliyat Tarixi (Audit Trail)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Barcha administratorlar, xodimlar va tizim harakatlarining xavfsizlik jurnali
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Yangilash
        </button>
      </div>

      {/* Search Input */}
      <div className="relative w-full max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Ism, amal yoki tavsif bo'yicha qidirish..."
          className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Logs Table */}
      {filteredLogs.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          Faoliyat jurnali hozircha bo'sh.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Vaqt</th>
                  <th className="px-5 py-3.5 font-semibold">Foydalanuvchi</th>
                  <th className="px-5 py-3.5 font-semibold">Roli</th>
                  <th className="px-5 py-3.5 font-semibold">Amal turi</th>
                  <th className="px-5 py-3.5 font-semibold">Batafsil ma'lumot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                      <div>{formatDateUz(log.timestamp.split('T')[0])}</div>
                      <div className="font-mono text-[11px] text-slate-400">
                        {formatTimeUz(log.timestamp)}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {log.actorName}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <RoleBadge role={log.actorRole} />
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-teal-700 dark:text-teal-400 font-semibold whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
