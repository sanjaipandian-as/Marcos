import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Users, UserX, Target } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, PieChart, Pie, Cell } from 'recharts';
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

export default function CustomerIntelligence() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.getCustomerIntelligence();
        setData(res);
      } catch (error) {
        console.error('Failed to load customer intelligence data', error);
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
        <p className="text-slate-500">Loading Customer Intelligence...</p>
      </div>
    );
  }

  const { kpis, top10Customers, segments, newVsReturning, churnRiskCustomers, categoryRepeatRates } = data;

  const CustomTooltipBar = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-xl text-xs font-medium text-slate-600 z-50 relative">
          <p className="mb-2 text-slate-900 font-bold">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="capitalize">{entry.name}:</span>
              <span className="text-slate-900">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomTooltipPie = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-xl text-xs font-medium text-slate-600 z-50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
            <span className="text-slate-900 font-bold">{data.name}</span>
          </div>
          <p className="mt-1 text-slate-500">{data.value}% of customers</p>
        </div>
      );
    }
    return null;
  };

  // Pie chart colors
  const COLORS = ['#a78bfa', '#34d399', '#fbbf24'];
  const segmentsWithColors = segments.map((s, i) => ({ ...s, color: COLORS[i % COLORS.length] }));

  return (
    <div className="mt-12 border-t border-slate-200 pt-12">
      <h2 className="text-sm font-bold text-slate-500 tracking-wider mb-6 uppercase flex items-center gap-2">
        <Users className="w-4 h-4" />
        Customer Intelligence
      </h2>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Total customers</h3>
          <div className="text-3xl font-bold text-slate-900 mb-2">{kpis.totalCustomers.value?.toLocaleString()}</div>
          <div className="flex items-center text-xs text-slate-500 font-medium">
            <ArrowUpRight className="w-3 h-3 mr-0.5 text-emerald-500" />
            <span className="text-emerald-500 mr-1">{kpis.totalCustomers.newThisMonth || kpis.totalCustomers.diff}</span> this month
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Avg CLV</h3>
          <div className="text-3xl font-bold text-slate-900 mb-2">₹{kpis.avgCLV.value?.toLocaleString()}</div>
          <div className="flex items-center text-xs text-slate-500 font-medium">
            top 10% avg <span className="font-bold text-slate-700 ml-1">₹{kpis.avgCLV.top10PercentAvg?.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Repeat rate</h3>
          <div className="text-3xl font-bold text-slate-900 mb-2">{kpis.repeatRate.value}%</div>
          <div className="flex items-center text-xs text-slate-500 font-medium">
            {kpis.repeatRate.diff >= 0 ? (
              <ArrowUpRight className="w-3 h-3 mr-0.5 text-emerald-500" />
            ) : (
              <ArrowDownRight className="w-3 h-3 mr-0.5 text-red-500" />
            )}
            <span className={kpis.repeatRate.diff >= 0 ? "text-emerald-500 mr-1" : "text-red-500 mr-1"}>{Math.abs(kpis.repeatRate.diff)}%</span> vs last month
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Churn risk</h3>
          <div className="text-3xl font-bold text-red-500 mb-2">{kpis.churnRisk.value}</div>
          <div className="flex items-center text-xs text-slate-500 font-medium">
            inactive 60+ days
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top 10 Customers */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-6">
            <h4 className="text-slate-900 font-bold text-lg">Top Customers by CLV</h4>
            <p className="text-sm text-slate-500">highest lifetime value</p>
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {top10Customers.map((c, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-slate-400 w-4 font-medium text-sm">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {c.initials}
                  </div>
                  <span className="font-bold text-slate-800 w-28 truncate">{c.fullName}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-sm text-slate-500 hidden sm:inline-block w-40 text-right">{c.location} • {c.ordersCount} orders</span>
                  <span className="font-bold text-slate-900 w-20 text-right">₹{c.totalSpend?.toLocaleString()}</span>
                </div>
              </div>
            ))}
            {top10Customers.length === 0 && (
              <div className="text-sm text-slate-500 text-center py-4">No top customers found.</div>
            )}
          </div>
        </div>

        {/* Customer Segments */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-6">
            <h4 className="text-slate-900 font-bold text-lg">Customer segments</h4>
            <p className="text-sm text-slate-500">one-time • repeat • VIP distribution</p>
          </div>
          <div className="h-64 relative mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segmentsWithColors}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {segmentsWithColors.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltipPie />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6">
            {segmentsWithColors.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: s.color }}></div>
                {s.name} {s.value}%
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* New vs Returning */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-6">
            <h4 className="text-slate-900 font-bold text-lg">New vs returning customers — 6 months</h4>
            <p className="text-sm text-slate-500">monthly trend of new and returning buyers</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-700 mb-6">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-indigo-400"></div> New</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-emerald-400"></div> Returning</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={newVsReturning} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <RechartsTooltip content={<CustomTooltipBar />} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="new" name="New" fill="#818cf8" radius={[2, 2, 0, 0]} maxBarSize={24} />
                <Bar dataKey="returning" name="Returning" fill="#34d399" radius={[2, 2, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Churn & Repeat Category */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex-1">
            <div className="mb-6">
              <h4 className="text-slate-900 font-bold text-lg">Churn risk customers</h4>
              <p className="text-sm text-slate-500">inactive 60 / 90 days — needs re-engagement</p>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {churnRiskCustomers.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-orange-100 bg-orange-50/50">
                  <div className="flex items-center gap-3 text-slate-800 font-medium text-sm">
                    <UserX className="w-4 h-4 text-orange-400" />
                    {c.fullName}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-900">₹{c.totalSpend?.toLocaleString()}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${c.riskLevel === '90+ days' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                      {c.riskLevel}
                    </span>
                  </div>
                </div>
              ))}
              {churnRiskCustomers.length === 0 && (
                <div className="text-sm text-slate-500 text-center py-4">No churn risk customers currently.</div>
              )}
            </div>

            <div className="mt-8 mb-6">
              <h4 className="text-slate-900 font-bold text-lg">Repeat purchase rate by category</h4>
            </div>
            <div className="space-y-4">
              {categoryRepeatRates.map((c, i) => (
                <div key={i} className="flex items-center text-sm">
                  <span className="font-bold text-slate-800 w-24 truncate shrink-0">{c.category}</span>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mx-4">
                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${c.rate}%` }}></div>
                  </div>
                  <span className="font-bold text-slate-600 w-10 text-right">{c.rate}%</span>
                </div>
              ))}
              {categoryRepeatRates.length === 0 && (
                <div className="text-sm text-slate-500 text-center py-4">Not enough category data.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
