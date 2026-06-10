import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Download, 
  Calendar, 
  AlertCircle,
  Clock,
  User,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import api from '../utils/api';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [expandedLogId, setExpandedLogId] = useState(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const list = await api.getAuditLogs();
      setLogs(list);
    } catch (err) {
      console.error(err);
    }
  };

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-50 text-red-750 border-red-100 font-extrabold';
      case 'WARNING':
        return 'bg-amber-50 text-amber-755 border-amber-100 font-bold';
      default:
        return 'bg-blue-50 text-blue-750 border-blue-100';
    }
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    
    const headers = ['Log ID', 'Timestamp', 'User', 'Action', 'Severity', 'IP Address', 'Message'];
    const rows = logs.map(l => [
      l.id,
      l.createdAt,
      l.userName || 'System',
      l.action,
      l.severity,
      l.ipAddress,
      l.details.message
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `marcos_audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter(l => {
    const matchesSearch = l.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (l.userName && l.userName.toLowerCase().includes(searchTerm.toLowerCase())) || 
                          l.details.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'ALL' || l.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Security Audits</h2>
          <p className="text-xs text-slate-500 font-medium">Verify system adjustments, manual checkpoints, and administrative logins</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-555 text-slate-600 text-xs font-bold transition-all shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Export Logs (CSV)</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center w-full">
        <div className="relative flex-1 max-w-md w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search action keyword, user ID, details message..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
          />
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        </div>

        <select
          value={severityFilter}
          onChange={e => setSeverityFilter(e.target.value)}
          className="w-full sm:w-auto text-xs font-bold border border-slate-200 rounded-xl py-2 px-3 bg-white text-slate-650 focus:outline-none focus:border-brand-500 transition-colors"
        >
          <option value="ALL">All Severities</option>
          <option value="INFO">Info</option>
          <option value="WARNING">Warning</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-premium hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-6 w-8"></th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Security Severity</th>
                <th className="py-3 px-4">Action Label</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-bold">No security audits found.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr 
                        className="hover:bg-slate-50/20 transition-colors cursor-pointer"
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      >
                        <td className="py-4 px-6 text-center">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-405" />}
                        </td>
                        <td className="py-4 px-4 text-slate-450 font-medium whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase border ${getSeverityStyle(log.severity)}`}>
                            {log.severity}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-slate-705 tracking-tight whitespace-nowrap">
                          {log.action}
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-600 whitespace-nowrap">
                          {log.userName || 'System'}
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-500">{log.ipAddress}</td>
                        <td className="py-4 px-4 text-slate-500 line-clamp-1 truncate max-w-xs">{log.details.message}</td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan="7" className="py-4 px-8 border-b border-slate-100">
                            <div className="space-y-2 text-xs">
                              <p className="font-bold text-slate-700">Detailed Payload Audit Variables:</p>
                              <pre className="p-3 bg-slate-900 text-slate-300 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed max-w-3xl">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="md:hidden space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-bold bg-white border border-slate-200/60 rounded-3xl shadow-premium">
            No security audits found.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            return (
              <div 
                key={log.id} 
                className="bg-white border border-slate-200/60 rounded-3xl p-4 space-y-3 shadow-sm hover:shadow transition-shadow cursor-pointer"
                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-slate-700 tracking-tight text-[11px] truncate max-w-[60%]">
                    {log.action}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase border ${getSeverityStyle(log.severity)}`}>
                    {log.severity}
                  </span>
                </div>
                <div className="text-xs space-y-1 text-slate-600">
                  <p className="font-semibold text-slate-500">{log.userName || 'System'}</p>
                  <p className="text-slate-400 font-medium">{new Date(log.createdAt).toLocaleString()}</p>
                  <p className="text-slate-505 line-clamp-2 leading-normal mt-1">{log.details.message}</p>
                </div>
                <div className="flex justify-between items-center border-t border-slate-50 pt-3 text-[10px] text-slate-400">
                  <span>IP: {log.ipAddress}</span>
                  <span className="flex items-center gap-1 font-semibold text-brand-605">
                    {isExpanded ? (
                      <>
                        <span>Hide Details</span>
                        <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <span>Show Details</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    )}
                  </span>
                </div>
                {isExpanded && (
                  <div className="pt-2 space-y-1.5 border-t border-slate-100/60" onClick={e => e.stopPropagation()}>
                    <p className="font-bold text-[10px] text-slate-700">Detailed Payload Audit Variables:</p>
                    <pre className="p-3 bg-slate-900 text-slate-300 rounded-xl overflow-x-auto text-[10px] font-mono leading-relaxed w-full">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
