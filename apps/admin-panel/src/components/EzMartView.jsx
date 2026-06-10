import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  Users, 
  DollarSign,
  ChevronDown
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '../utils/api';

export default function EzMartView({ theme }) {
  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    orderCount: 0,
    pendingVisits: 0,
    topCategories: [],
    indiaActiveUsers: [],
    productTraffic: [],
    revenueChart: [],
    conversionRates: []
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const dashboard = await api.getDashboardReport();
        setReportData({
          totalRevenue: dashboard.totalRevenue || 0,
          orderCount: dashboard.orderCount || 0,
          pendingVisits: dashboard.pendingVisits || 0,
          topCategories: dashboard.topCategories || [],
          indiaActiveUsers: dashboard.indiaActiveUsers || [],
          productTraffic: dashboard.productTraffic || [],
          revenueChart: dashboard.revenueChart || [],
          conversionRates: dashboard.conversionRates || []
        });
      } catch (err) {
        console.error('Failed to load dashboard report stats:', err);
      }
    }
    loadStats();
  }, []);

  const isGreen = theme === 'oripiofin';

  // Map backend monthly revenue chart data dynamically
  const chartData = (reportData.revenueChart || []).map(item => ({
    name: item.month,
    Revenue: item.revenue,
    Order: Math.round(item.revenue / 5000) // simulated order density
  }));

  // Fallback for line chart if database is empty/fresh
  const displayChartData = chartData.length > 0 ? chartData : [
    { name: 'Jan 26', Revenue: 45000, Order: 9 },
    { name: 'Feb 26', Revenue: 52000, Order: 10 },
    { name: 'Mar 26', Revenue: 68000, Order: 13 },
    { name: 'Apr 26', Revenue: 58000, Order: 11 },
    { name: 'May 26', Revenue: 84000, Order: 16 },
    { name: 'Jun 26', Revenue: reportData.totalRevenue || 95000, Order: reportData.orderCount || 19 }
  ];

  // Dynamic categories with theme colors
  const categoryData = (reportData.topCategories || []).map((cat, idx) => {
    const colors = isGreen 
      ? ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0']
      : ['#f97316', '#fb923c', '#fdba74', '#fed7aa'];
    return {
      name: cat.name,
      value: cat.value,
      color: colors[idx % colors.length]
    };
  });

  // Calculate total active users to get percentage
  const totalActiveUsers = (reportData.indiaActiveUsers || []).reduce((acc, curr) => acc + curr.count, 0);

  // Dynamic active locations in India (district and state)
  const activeLocations = (reportData.indiaActiveUsers || []).map((loc, idx) => {
    const percentage = totalActiveUsers > 0 ? Math.round((loc.count / totalActiveUsers) * 100) : 0;
    const colors = isGreen
      ? ['bg-emerald-500', 'bg-emerald-400', 'bg-emerald-350', 'bg-emerald-300']
      : ['bg-orange-500', 'bg-orange-400', 'bg-orange-350', 'bg-orange-300'];
    return {
      name: loc.name,
      percentage,
      color: colors[idx % colors.length]
    };
  });

  // Dynamic product traffic sources
  const productTrafficSources = (reportData.productTraffic || []).map((pt, idx) => {
    const colors = isGreen
      ? ['bg-emerald-500', 'bg-emerald-400', 'bg-emerald-300', 'bg-emerald-200', 'bg-emerald-100']
      : ['bg-orange-500', 'bg-orange-400', 'bg-orange-300', 'bg-orange-250', 'bg-orange-200'];
    return {
      name: pt.name,
      percentage: pt.percentage,
      color: colors[idx % colors.length]
    };
  });

  // Sales target calculation
  const salesTarget = 150000; // Realistic target based on inventory price
  const targetProgress = Math.min(Math.round((reportData.totalRevenue / salesTarget) * 100), 100);

  const conversionRates = (reportData.conversionRates || []).map((c, idx) => {
    const colors = isGreen
      ? ['#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#059669']
      : ['#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#ea580c'];
    return {
      name: c.name,
      value: c.value,
      change: c.change,
      color: colors[idx % colors.length]
    };
  });

  return (
    <div className="space-y-6">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Sales */}
        <div className={`border rounded-3xl p-6 shadow-premium relative overflow-hidden group ${isGreen ? 'bg-emerald-50/50 border-emerald-100' : 'bg-orange-50/50 border-orange-100'}`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-500">Total Sales</span>
              <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight my-2">
                ₹{(reportData.totalRevenue).toLocaleString('en-IN')}
              </h3>
            </div>
            <div className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center shadow-md ${isGreen ? 'bg-emerald-500' : 'bg-orange-500'}`}>
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +3.34% <span className="text-slate-400 font-normal">vs last week</span>
          </span>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-500">Total Orders</span>
              <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight my-2">
                {(reportData.orderCount).toLocaleString()}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +4.15% <span className="text-slate-400 font-normal">vs last week</span>
          </span>
        </div>

        {/* Total Visitors */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-500">Active Locations (India)</span>
              <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight my-2">
                {reportData.indiaActiveUsers.length} Cities
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +8.02% <span className="text-slate-400 font-normal">vs last week</span>
          </span>
        </div>
      </div>

      {/* Row 2: Revenue Line Chart & Monthly Target Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Revenue Analytics Line Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm">Revenue Analytics</h4>
              <div className="flex gap-4 text-[10px] text-slate-400 mt-1">
                <span className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full inline-block ${isGreen ? 'bg-emerald-500' : 'bg-orange-500'}`} /> Revenue</span>
                <span className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full inline-block ${isGreen ? 'bg-emerald-300' : 'bg-orange-300'}`} strokeDasharray="3 3" /> Order</span>
              </div>
            </div>
            <button className={`flex items-center gap-1 text-[10px] font-bold border border-transparent py-1.5 px-3 rounded-xl text-white shadow-sm ${isGreen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-500 hover:bg-orange-600'}`}>
              <span>Last 6 Months</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <div className="h-56 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="Revenue" stroke={isGreen ? '#10b981' : '#ea580c'} strokeWidth={3} dot={{ fill: isGreen ? '#10b981' : '#ea580c', r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Order" stroke={isGreen ? '#6ee7b7' : '#fdba74'} strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Target radial progress card (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium flex flex-col justify-between items-center text-center">
          <div className="w-full flex justify-between">
            <h4 className="font-extrabold text-slate-800 text-sm">Monthly Sales Target</h4>
            <span className="text-[10px] text-slate-400 font-bold">...</span>
          </div>

          <div className="relative w-36 h-36 flex items-center justify-center my-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke={isGreen ? '#d1fae5' : '#fef3c7'} strokeWidth="8" fill="transparent" />
              <circle cx="50" cy="50" r="40" stroke={isGreen ? '#10b981' : '#f97316'} strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - (targetProgress / 100))} strokeLinecap="round" />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-slate-800">{targetProgress}%</span>
              <span className="text-[9px] font-bold text-emerald-600 leading-none flex items-center gap-0.5 mt-0.5">
                <TrendingUp className="w-2.5 h-2.5" /> +8.02%
              </span>
            </div>
          </div>

          <div className="space-y-1 my-2">
            <p className="text-xs font-bold text-slate-800">{targetProgress >= 100 ? 'Target Reached! 🏆' : 'Great Progress! 🎉'}</p>
            <p className="text-[10px] text-slate-400 px-4 leading-normal">
              Our sales achievement increased this month. Let's aim to reach 100% next month.
            </p>
          </div>

          <div className="w-full grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-2">
            <div>
              <p className="text-[9px] text-slate-400 font-semibold uppercase">Target</p>
              <p className="text-xs font-bold text-slate-800">₹{salesTarget.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-semibold uppercase">Revenue</p>
              <p className="text-xs font-bold text-slate-800">₹{reportData.totalRevenue.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Top Categories Donut & Active Users (India) & Traffic Sources (Products) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Top Categories Donut */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <h4 className="font-extrabold text-slate-800 text-sm">Top Categories</h4>
            <span className="text-[10px] font-bold text-slate-400">Real Sales</span>
          </div>

          <div className="h-40 relative flex items-center justify-center my-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-[9px] text-slate-400 font-medium leading-none">Total Sales</span>
              <span className="text-xs font-extrabold text-slate-800 mt-1">₹{(reportData.totalRevenue).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="space-y-1.5 text-[10px] max-h-36 overflow-y-auto pr-1">
            {categoryData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-bold text-slate-800">₹{(item.value).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Users in Indian States/Districts */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <h4 className="font-extrabold text-slate-800 text-sm">India Active Users</h4>
            <span className="text-[10px] text-slate-400">By State & District</span>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800">{totalActiveUsers}</span>
              <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="w-2.5 h-2.5" /> +8.02%
              </span>
            </div>
            <p className="text-[9px] text-slate-400">Total verified users from India</p>
          </div>

          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
            {activeLocations.map((c) => (
              <div key={c.name} className="space-y-1 text-xs">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-500">{c.name}</span>
                  <span className="text-slate-800">{c.percentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources (Product Traffic Popularity) */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <h4 className="font-extrabold text-slate-800 text-sm">Product Traffic</h4>
            <span className="text-[10px] text-slate-400">Popularity Share</span>
          </div>

          <div className="h-16 flex items-end gap-1.5 my-3 px-2">
            {productTrafficSources.map((t) => (
              <div key={t.name} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end" title={`${t.name}: ${t.percentage}%`}>
                <div 
                  className={`w-full rounded-lg cursor-pointer transition-colors ${isGreen ? 'bg-emerald-100 hover:bg-emerald-500' : 'bg-orange-100 hover:bg-orange-500'}`} 
                  style={{ height: `${t.percentage || 5}%` }} 
                />
              </div>
            ))}
          </div>

          <div className="space-y-1.5 text-[10px] max-h-36 overflow-y-auto pr-1">
            {productTrafficSources.map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2 truncate pr-4">
                  <span className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${isGreen ? 'bg-emerald-400' : 'bg-orange-400'}`} />
                  <span className="truncate" title={s.name}>{s.name}</span>
                </span>
                <span className="font-bold text-slate-800 shrink-0">{s.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Conversion Rate widget */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-extrabold text-slate-800 text-sm">Conversion Rate</h4>
          <span className={`text-xs font-bold py-1.5 px-3 rounded-xl shadow-sm text-white ${isGreen ? 'bg-emerald-600' : 'bg-orange-500'}`}>This Week</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {conversionRates.map((c) => (
            <div key={c.name} className={`p-4 rounded-2xl border flex flex-col justify-between h-32 relative overflow-hidden group ${isGreen ? 'bg-emerald-50/20 border-emerald-100/30' : 'bg-orange-50/20 border-orange-100/30'}`}>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">{c.name}</span>
                <span className="text-lg font-black text-slate-800 block mt-1.5">
                  {(c.value).toLocaleString()}
                </span>
              </div>
              <span className={`
                text-[9px] font-bold py-0.5 px-2 rounded-full inline-flex items-center gap-0.5 w-max
                ${c.change.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}
              `}>
                {c.change}
              </span>
              <div className="absolute bottom-0 left-0 right-0 h-1 transition-all group-hover:h-2" style={{ backgroundColor: c.color }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
