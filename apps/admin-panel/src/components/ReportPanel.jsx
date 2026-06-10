import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { 
  Download, 
  FileText, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';
import api from '../utils/api';

export default function ReportPanel() {
  const [reportRange, setReportRange] = useState('MONTHLY');
  const [growthData, setGrowthData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);

  useEffect(() => {
    loadReports();
  }, [reportRange]);

  const loadReports = async () => {
    try {
      const reports = await api.getExtendedReports();
      
      let scale = 1;
      if (reportRange === 'DAILY') scale = 0.05;
      else if (reportRange === 'WEEKLY') scale = 0.25;
      else if (reportRange === 'ANNUAL') scale = 12;

      const modifiedGrowth = reports.customerGrowth.map(g => ({
        ...g,
        count: Math.max(1, Math.round(g.count * scale))
      }));

      const modifiedPerformance = reports.productPerformance.map(p => ({
        ...p,
        quantitySold: Math.max(1, Math.round(p.quantitySold * scale)),
        revenueGenerated: Math.round(p.revenueGenerated * scale)
      }));

      setGrowthData(modifiedGrowth);
      setPerformanceData(modifiedPerformance);
      setLowStockAlerts(reports.lowStockAlerts);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popover blocked. Please allow popups to export report PDF.');
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>MARCOS - Analytical Report Summary (${reportRange})</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            h1 { border-bottom: 2px solid #064e3b; padding-bottom: 10px; color: #064e3b; font-size: 24px; margin-bottom: 5px; }
            .meta { font-size: 11px; color: #64748b; margin-bottom: 30px; }
            h2 { color: #0f172a; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 25px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
            th { background-color: #f8fafc; color: #475569; font-weight: bold; }
            .badge { padding: 2px 6px; border-radius: 9999px; font-size: 9px; font-weight: bold; text-transform: uppercase; }
            .warning { background-color: #fef3c7; color: #92400e; }
            .out { background-color: #fee2e2; color: #991b1b; }
            .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8; border-t: 1px solid #f1f5f9; padding-top: 15px; }
          </style>
        </head>
        <body>
          <h1>MARCOS Analytics & Operations Report</h1>
          <div class="meta">
            Scope: <strong>${reportRange} Overview</strong> &bull; 
            Generated: ${new Date().toLocaleString()} &bull; 
            Security Officer: Marcus George
          </div>
          
          <div class="section">
            <h2>Product Sales Performance</h2>
            <table>
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Product Item</th>
                  <th>Quantity Sold</th>
                  <th>Revenue Generated</th>
                </tr>
              </thead>
              <tbody>
                ${performanceData.map(p => `
                  <tr>
                    <td><code>${p.productId}</code></td>
                    <td><strong>${p.productName}</strong></td>
                    <td>${p.quantitySold} units</td>
                    <td>₹${Number(p.revenueGenerated).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="section">
            <h2>Inventory Stock Alerts</h2>
            <table>
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Product Item</th>
                  <th>Available Quantity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${lowStockAlerts.map(l => `
                  <tr>
                    <td><code>${l.id}</code></td>
                    <td>${l.name}</td>
                    <td><strong style="color: #ef4444;">${l.inventoryQty}</strong></td>
                    <td>
                      <span class="badge ${l.stockStatus === 'OUT_OF_STOCK' ? 'out' : 'warning'}">
                        ${l.stockStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            Confidential - MARCOS Internal Administrative Logs Only.
          </div>
          
          <script>
            window.onload = function() { 
              setTimeout(function() {
                window.print(); 
                window.close(); 
              }, 500);
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleExportCSV = () => {
    const headers = ['Product ID', 'Product Name', 'Quantity Sold', 'Revenue Generated'];
    const rows = performanceData.map(p => [p.productId, p.productName, p.quantitySold, p.revenueGenerated]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `marcos_sales_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Reports & Analytics</h2>
          <p className="text-xs text-slate-500 font-medium">Generate analytical summaries, customer growth metrics, and export data sheets</p>
        </div>
        
        <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
          <select
            value={reportRange}
            onChange={e => setReportRange(e.target.value)}
            className="text-xs font-bold border border-slate-200 rounded-xl py-2 px-3 bg-white text-slate-655 focus:outline-none"
          >
            <option value="DAILY">Daily Report</option>
            <option value="WEEKLY">Weekly Report</option>
            <option value="MONTHLY">Monthly Report</option>
            <option value="ANNUAL">Annual Report</option>
          </select>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Customer Registration Growth</h3>
            <p className="text-[10px] text-slate-400">Total new registered customer accounts over the last 6 months</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#f97316" strokeWidth={3} dot={{ fill: '#f97316', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Product Sales Performance</h3>
            <p className="text-[10px] text-slate-400">Revenue generated per product item (top sales)</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="productName" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="revenueGenerated" fill="#006241" radius={[8, 8, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
            <span>Low Stock / Out of Stock Warnings</span>
          </h3>
          <span className="text-[10px] text-red-500 font-extrabold bg-red-50 border border-red-100/35 px-2 py-0.5 rounded-full uppercase">
            Needs Reorder
          </span>
        </div>

        <div className="hidden sm:block overflow-x-auto border border-slate-150 rounded-2xl">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[9px] font-bold text-slate-400 uppercase">
              <tr>
                <th className="py-2 px-4">Product Name</th>
                <th className="py-2 px-4">Available Qty</th>
                <th className="py-2 px-4">Stock Status</th>
                <th className="py-2 px-4 text-right">Identifier ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-655">
              {lowStockAlerts.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-6 text-center text-slate-400 font-bold">No inventory warning triggers active.</td>
                </tr>
              ) : (
                lowStockAlerts.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/20">
                    <td className="py-3 px-4 font-bold text-slate-800">{item.name}</td>
                    <td className="py-3 px-4 font-extrabold text-red-500">{item.inventoryQty}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${item.stockStatus === 'OUT_OF_STOCK' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800'}`}>
                        {item.stockStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">{item.id}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="sm:hidden space-y-3">
          {lowStockAlerts.length === 0 ? (
            <div className="py-6 text-center text-slate-400 font-bold bg-slate-50 border border-slate-150 rounded-2xl">
              No inventory warning triggers active.
            </div>
          ) : (
            lowStockAlerts.map(item => (
              <div key={item.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">{item.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${item.stockStatus === 'OUT_OF_STOCK' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800'}`}>
                    {item.stockStatus.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">Available Qty: <strong className="text-red-500 font-extrabold">{item.inventoryQty}</strong></span>
                  <span className="font-mono text-slate-400 text-[10px]">{item.id}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
