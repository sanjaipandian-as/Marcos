import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShoppingCart, 
  Calendar, 
  ShieldAlert, 
  Play, 
  Wifi, 
  WifiOff, 
  Trash2,
  Clock
} from 'lucide-react';
import { MockDB } from '../utils/mockData';

export default function LiveAlertsFeed({ isOpen, onClose, onAlertsRead }) {
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    // Load initial alerts from audit logs for presentation
    const logs = MockDB.get('m_audit_logs').slice(0, 8);
    const initialAlerts = logs.map(l => ({
      id: l.id,
      type: l.action.includes('ORDER') ? 'order' : (l.action.includes('APPOINTMENT') || l.action.includes('VISIT') ? 'appointment' : 'security'),
      title: l.action.replace(/_/g, ' '),
      message: l.details?.message || l.details || '',
      time: new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date(l.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }),
      timestamp: new Date(l.createdAt).getTime(),
      details: l.details,
      severity: l.severity || 'INFO',
      ipAddress: l.ipAddress || '127.0.0.1',
      userName: l.userName || 'System'
    }));
    setAlerts(initialAlerts);
    setIsConnected(true);

    // Listen to custom window events for mock websocket alerts
    const handleMockAlert = (e) => {
      const { type, data } = e.detail;
      let newAlert = null;

      if (type === 'order') {
        newAlert = {
          id: data.id,
          type: 'order',
          title: 'ORDER PLACED',
          message: `New offline sale completed for ${data.customerName}. Total: ₹${data.payableAmount}`,
          time: new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(data.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }),
          timestamp: Date.now(),
          details: data,
          severity: 'INFO',
          ipAddress: '127.0.0.1',
          userName: data.customerName
        };
      } else if (type === 'audit_log') {
        newAlert = {
          id: data.id,
          type: data.action.includes('POINTS') ? 'loyalty' : (data.action.includes('ORDER') ? 'order' : (data.action.includes('APPOINTMENT') || data.action.includes('VISIT') ? 'appointment' : 'security')),
          title: data.action.replace(/_/g, ' '),
          message: data.details?.message || data.details || '',
          time: new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(data.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }),
          timestamp: Date.now(),
          details: data.details,
          severity: data.severity || 'INFO',
          ipAddress: data.ipAddress || '127.0.0.1',
          userName: data.userName || 'Marcus George'
        };
      }

      if (newAlert) {
        setAlerts(prev => [newAlert, ...prev]);
        if ('vibrate' in navigator) navigator.vibrate(100);
      }
    };

    window.addEventListener('ws_mock_alert', handleMockAlert);

    // Setup periodic simulation in background (every 40 seconds)
    const interval = setInterval(() => {
      triggerRandomSimulation();
    }, 40000);

    return () => {
      window.removeEventListener('ws_mock_alert', handleMockAlert);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      onAlertsRead();
    }
  }, [isOpen, alerts.length]);

  const triggerRandomSimulation = () => {
    const events = [
      {
        type: 'order',
        title: 'ORDER PLACED',
        message: 'Customer Priya Sharma placed an offline order for ₹1,44,300.00'
      },
      {
        type: 'appointment',
        title: 'FITTING APPOINTMENT CREATED',
        message: 'Amit Patel scheduled a verification fitting for June 12 at 02:30 PM'
      },
      {
        type: 'security',
        title: 'SECURITY WARN: PLATFORM SETTINGS UPDATED',
        message: 'System configurations modified by SuperAdmin Marcus George'
      }
    ];

    const randomEvent = events[Math.floor(Math.random() * events.length)];
    const mockAlert = {
      id: `sim-${Date.now()}`,
      type: randomEvent.type,
      title: randomEvent.title,
      message: randomEvent.message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }),
      timestamp: Date.now(),
      details: { message: randomEvent.message, simulated: true, eventTime: new Date().toISOString() },
      severity: randomEvent.type === 'security' ? 'WARNING' : 'INFO',
      ipAddress: '192.168.1.5',
      userName: 'System Simulator'
    };

    setAlerts(prev => [mockAlert, ...prev]);
    
    // Add to audit logs also
    MockDB.addAuditLog(randomEvent.title.replace(/ /g, '_'), { message: randomEvent.message }, randomEvent.type === 'security' ? 'WARNING' : 'INFO');
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="w-4 h-4 text-emerald-600" />;
      case 'appointment':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-red-600" />;
    }
  };

  const getAlertBg = (type) => {
    switch (type) {
      case 'order':
        return 'bg-emerald-50 border-emerald-100';
      case 'appointment':
        return 'bg-blue-50 border-blue-100';
      default:
        return 'bg-red-50 border-red-100';
    }
  };

  return (
    <div className={`
      fixed top-0 bottom-0 right-0 z-50 w-80 bg-white border-l border-slate-200 shadow-2xl
      flex flex-col transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}
    `}>
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="w-4 h-4 text-emerald-500 animate-pulse" />
          ) : (
            <WifiOff className="w-4 h-4 text-slate-400" />
          )}
          <span className="font-bold text-slate-800 text-sm">Real-time Feed</span>
          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">
            Live
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Simulator Control Trigger */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Feed Simulator
        </span>
        <button
          onClick={triggerRandomSimulation}
          className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-[10px] font-bold transition-all shadow-sm"
        >
          <Play className="w-2.5 h-2.5 fill-white" />
          <span>Simulate WebSocket Event</span>
        </button>
      </div>

      {/* Alerts Log Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {alerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
            <Clock className="w-8 h-8 stroke-1 text-slate-300" />
            <span className="text-xs">No active events logged yet</span>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => setSelectedAlert(alert)}
              className={`p-3.5 rounded-xl border flex gap-3 shadow-sm transition-all duration-200 hover:shadow cursor-pointer active:scale-95 ${getAlertBg(alert.type)}`}
            >
              <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center border border-slate-100 shadow-sm shrink-0">
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start gap-1">
                  <span className="text-[11px] font-extrabold text-slate-700 tracking-tight leading-none uppercase">
                    {alert.title}
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold shrink-0">
                    {alert.time}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-snug line-clamp-2">
                  {alert.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Clear logs */}
      {alerts.length > 0 && (
        <div className="p-3 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={() => setAlerts([])}
            className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>
      )}

      {/* Selected Alert Details Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6 relative flex flex-col max-h-[80vh] overflow-y-auto animate-scaleUp">
            <button
              onClick={() => setSelectedAlert(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-650 transition-colors focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 shrink-0">
              <ShieldAlert className={`w-5.5 h-5.5 ${selectedAlert.severity === 'WARNING' || selectedAlert.severity === 'CRITICAL' ? 'text-red-500' : 'text-emerald-500'}`} />
              <h3 className="font-extrabold text-slate-800 text-base uppercase tracking-tight">{selectedAlert.title}</h3>
            </div>

            <div className="space-y-4 py-4 text-xs text-slate-650 leading-relaxed overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[9px] font-bold text-slate-450 uppercase block">Severity</span>
                  <span className={`text-[10px] font-extrabold uppercase ${selectedAlert.severity === 'WARNING' || selectedAlert.severity === 'CRITICAL' ? 'text-red-650' : 'text-emerald-655'}`}>
                    {selectedAlert.severity}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-450 uppercase block">IP Address</span>
                  <span className="font-semibold text-slate-850">{selectedAlert.ipAddress}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-450 uppercase block">User</span>
                  <span className="font-semibold text-slate-850">{selectedAlert.userName}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-450 uppercase block">Timestamp</span>
                  <span className="font-semibold text-slate-750">{selectedAlert.date} {selectedAlert.time}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-450 uppercase block">Message</span>
                <p className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-750 font-semibold leading-normal">
                  {selectedAlert.message}
                </p>
              </div>

              {selectedAlert.details && (
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-455 uppercase block">Raw JSON Payload</span>
                  <pre className="bg-slate-900 text-emerald-400 p-4 rounded-2xl text-[10px] overflow-auto max-h-48 font-mono leading-relaxed">
                    {JSON.stringify(selectedAlert.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedAlert(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors block text-center mt-2"
            >
              Acknowledge Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
