import React, { useState, useEffect } from 'react';
import { Package, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import api from '../utils/api';

export default function OrderIntelligence() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.getOrderIntelligence();
        setData(res);
      } catch (error) {
        console.error('Failed to load order intelligence data', error);
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
        <p className="text-slate-500">Loading Order Intelligence...</p>
      </div>
    );
  }

  const { totalOrders, avgFulfillment, cancellationRate, returnRate, orderStatusBreakdown, fulfillmentTrend, cancelByProduct, returnByProduct, sizingChart } = data;

  const CustomTooltipLine = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-xl text-xs font-medium text-slate-600 z-50">
          <p className="mb-1 text-slate-900 font-bold">{label}</p>
          <div className="flex items-center gap-2">
            <span className="text-indigo-500">Avg Time:</span>
            <span className="text-slate-900">{payload[0].value} days</span>
          </div>
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
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.fill }} />
            <span className="text-slate-900 font-bold">{data.name}</span>
          </div>
          <p className="mt-1 text-slate-500">{data.value}% of orders</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-12 border-t border-slate-200 pt-12">
      <h2 className="text-sm font-bold text-slate-500 tracking-wider mb-6 uppercase flex items-center gap-2">
        <Package className="w-4 h-4" />
        Order Intelligence
      </h2>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Total orders</h3>
          <div className="text-3xl font-bold text-slate-900 mb-2">{totalOrders.value?.toLocaleString()}</div>
          <div className="flex items-center text-xs text-slate-500 font-medium">
            {totalOrders.label}
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Avg fulfillment</h3>
          <div className="text-3xl font-bold text-slate-900 mb-2">{avgFulfillment.value}</div>
          <div className="flex items-center text-xs text-slate-500 font-medium">
            {avgFulfillment.label}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Cancellation rate</h3>
          <div className="text-3xl font-bold text-slate-900 mb-2">{cancellationRate.value}</div>
          <div className="flex items-center text-xs text-slate-500 font-medium">
            <ArrowDownRight className="w-3 h-3 mr-0.5 text-emerald-500" />
            <span className="text-emerald-500 mr-1">{cancellationRate.label.split(' ')[0]}</span> {cancellationRate.label.split(' ')[1] || ''}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Return rate</h3>
          <div className="text-3xl font-bold text-slate-900 mb-2">{returnRate.value}</div>
          <div className="flex items-center text-xs text-slate-500 font-medium">
            {returnRate.label}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Order status breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-6">
            <h4 className="text-slate-900 font-bold text-lg">Order status breakdown</h4>
            <p className="text-sm text-slate-500">live snapshot of all orders</p>
          </div>
          <div className="space-y-4">
            {orderStatusBreakdown.map((status, i) => (
              <div key={i} className="flex items-center text-sm">
                <div className="flex items-center gap-2 w-32 shrink-0">
                  <div className={`w-2 h-2 rounded-full ${status.color}`}></div>
                  <span className="font-bold text-slate-800">{status.status}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mx-4 relative flex">
                  {/* Using standard style inline background color extracted from the utility class for easier inline width styling */}
                  <div className={`h-full rounded-full ${status.color}`} style={{ width: `${status.percent}%` }}></div>
                </div>
                <div className="w-24 shrink-0 text-right flex justify-end gap-3">
                   <span className="font-bold text-slate-900 w-10 text-right">{status.count}</span>
                   <span className="text-slate-500 w-8 text-right">{status.percent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Avg fulfillment time trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-6">
            <h4 className="text-slate-900 font-bold text-lg">Avg fulfillment time trend</h4>
            <p className="text-sm text-slate-500">days from order placed to delivered — 8 weeks</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fulfillmentTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} domain={['dataMin - 1', 'dataMax + 1']} />
                <RechartsTooltip content={<CustomTooltipLine />} />
                <Line type="monotone" dataKey="days" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>


    </div>
  );
}
