import React, { useState, useEffect } from 'react';
import { IndianRupee, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, Legend } from 'recharts';
import api from '../utils/api';

const formatCurrency = (amount) => {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}k`;
  }
  return `₹${amount?.toLocaleString('en-IN')}`;
};

export default function RevenueIntelligence() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.getRevenueIntelligence();
        setData(res);
      } catch (error) {
        console.error('Failed to load revenue intelligence data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] bg-slate-50 mt-12 rounded-xl border border-slate-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mb-4"></div>
        <p className="text-slate-500">Loading Revenue Intelligence...</p>
      </div>
    );
  }

  const { totalRevenue, revenueLost, momGrowth, yoyGrowth, revenueByCategory, momVsYoy, newVsReturning } = data;

  const CustomTooltipBar = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-xl text-xs font-medium text-slate-600 z-50">
          <p className="mb-2 text-slate-900 font-bold">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }} />
              <span className="capitalize">{entry.name}:</span>
              <span className="text-slate-900">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomTooltipHorizontal = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-xl text-xs font-medium text-slate-600 z-50">
          <p className="mb-2 text-slate-900 font-bold">{label}</p>
          <div className="flex items-center gap-2">
            <span className="text-indigo-500">Revenue:</span>
            <span className="text-slate-900 font-bold">{formatCurrency(payload[0].value)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-12 border-t border-slate-200 pt-12">
      <h2 className="text-sm font-bold text-slate-500 tracking-wider mb-6 uppercase flex items-center gap-2">
        <IndianRupee className="w-4 h-4" />
        Revenue Intelligence
      </h2>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Total revenue</h3>
          <div className="text-3xl font-bold text-slate-900 mb-2">{formatCurrency(totalRevenue?.value || 0)}</div>
          <div className="flex items-center text-xs text-slate-500 font-medium">
            {totalRevenue?.label}
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Revenue lost</h3>
          <div className="text-3xl font-bold text-red-500 mb-2">{formatCurrency(revenueLost?.value || 0)}</div>
          <div className="flex items-center text-xs text-slate-500 font-medium">
            {revenueLost?.label}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">MoM growth</h3>
          <div className="text-3xl font-bold text-slate-900 mb-2">
            {momGrowth?.value > 0 ? '+' : ''}{momGrowth?.value}%
          </div>
          <div className="flex items-center text-xs text-slate-500 font-medium">
            {momGrowth?.value > 0 ? (
              <ArrowUpRight className="w-3 h-3 mr-0.5 text-emerald-500" />
            ) : momGrowth?.value < 0 ? (
              <ArrowDownRight className="w-3 h-3 mr-0.5 text-red-500" />
            ) : null}
            <span className={momGrowth?.value > 0 ? "text-emerald-500 mr-1" : momGrowth?.value < 0 ? "text-red-500 mr-1" : "mr-1"}>
              {Math.abs(momGrowth?.value || 0)}%
            </span>
            {momGrowth?.label.replace('vs last month', 'vs prev')}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">YoY growth</h3>
          <div className="text-3xl font-bold text-slate-900 mb-2">
            {yoyGrowth?.value > 0 ? '+' : ''}{yoyGrowth?.value}%
          </div>
          <div className="flex items-center text-xs text-slate-500 font-medium">
             {yoyGrowth?.value > 0 ? (
              <ArrowUpRight className="w-3 h-3 mr-0.5 text-emerald-500" />
            ) : yoyGrowth?.value < 0 ? (
              <ArrowDownRight className="w-3 h-3 mr-0.5 text-red-500" />
            ) : null}
            <span className={yoyGrowth?.value > 0 ? "text-emerald-500 mr-1" : yoyGrowth?.value < 0 ? "text-red-500 mr-1" : "mr-1"}>
              {Math.abs(yoyGrowth?.value || 0)}%
            </span>
            {yoyGrowth?.label.replace('vs same month last year', 'vs last yr')}
          </div>
        </div>
      </div>

      <div className="mb-8">
        {/* Revenue by category */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-6">
            <h4 className="text-slate-900 font-bold text-lg">Revenue by category</h4>
            <p className="text-sm text-slate-500">top performing product categories</p>
          </div>
          <div style={{ height: Math.max(256, (revenueByCategory?.length || 0) * 40 + 60) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByCategory} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(val) => `₹${val/100000}L`} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} width={80} />
                <RechartsTooltip content={<CustomTooltipHorizontal />} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="value" fill="#818cf8" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* MoM vs YoY comparison */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-6">
            <h4 className="text-slate-900 font-bold text-lg">Month-over-month vs year-over-year</h4>
            <p className="text-sm text-slate-500">revenue comparison — last 6 months</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-700 mb-6">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-indigo-500"></div> This year</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-slate-200"></div> Last year</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={momVsYoy} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(val) => `₹${val/100000}L`} />
                <RechartsTooltip content={<CustomTooltipBar />} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="thisYear" name="This Year" fill="#818cf8" radius={[2, 2, 0, 0]} maxBarSize={24} />
                <Bar dataKey="lastYear" name="Last Year" fill="#e2e8f0" radius={[2, 2, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* New vs Returning */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-6">
            <h4 className="text-slate-900 font-bold text-lg">Revenue — new vs returning customers</h4>
            <p className="text-sm text-slate-500">returning customers drive higher avg spend</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-700 mb-6">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-indigo-400"></div> New</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-emerald-400"></div> Returning</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={newVsReturning} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(val) => `₹${val/100000}L`} />
                <RechartsTooltip content={<CustomTooltipBar />} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="new" name="New" stackId="a" fill="#818cf8" maxBarSize={40} />
                <Bar dataKey="returning" name="Returning" stackId="a" fill="#34d399" radius={[2, 2, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
