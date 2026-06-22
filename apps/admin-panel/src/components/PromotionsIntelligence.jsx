import React, { useState, useEffect } from 'react';
import { Tag, IndianRupee, Percent } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, Legend, ScatterChart, Scatter, ZAxis } from 'recharts';
import api from '../utils/api';

const formatCurrency = (amount) => {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}k`;
  return `₹${amount?.toLocaleString('en-IN')}`;
};

export default function PromotionsIntelligence() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.getPromotionsIntelligence();
        setData(res);
      } catch (error) {
        console.error('Failed to load promotions intelligence data', error);
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
        <p className="text-slate-500">Loading Promotions Intelligence...</p>
      </div>
    );
  }

  const { activeCoupons, discountGiven, revenueFromPromos, marginImpact, couponUsage, revenueVsDiscount, topPromoProducts, volumeLiftVsMargin } = data;

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

  const CustomScatterTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-xl text-xs font-medium text-slate-600 z-50">
          <p className="mb-1 text-slate-900 font-bold">{data.campaign}</p>
          <p>Volume lift: {data.volumeLift} usage</p>
          <p>Margin loss: {data.marginLoss}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-12 border-t border-slate-200 pt-12">
      <h2 className="text-sm font-bold text-slate-500 tracking-wider mb-6 uppercase flex items-center gap-2">
        <Tag className="w-4 h-4" />
        Promotions & Discounts
      </h2>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Active coupons</h3>
          <div className="text-3xl font-bold text-slate-900 mb-2">{activeCoupons?.value || 0}</div>
          <div className="flex items-center text-xs text-slate-500 font-medium">
            {activeCoupons?.expiring || 0} expiring this week
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Discount given</h3>
          <div className="text-3xl font-bold text-slate-900 mb-2">{formatCurrency(discountGiven?.value || 0)}</div>
          <div className="flex items-center text-xs text-slate-500 font-medium">
            this month total
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Revenue from promos</h3>
          <div className="text-3xl font-bold text-slate-900 mb-2">{formatCurrency(revenueFromPromos?.value || 0)}</div>
          <div className="flex items-center text-xs text-slate-500 font-medium">
            {discountGiven?.value > 0 ? (revenueFromPromos?.value / discountGiven?.value).toFixed(1) : 0}x return on discount
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Margin impact</h3>
          <div className="text-3xl font-bold text-amber-500 mb-2">{marginImpact?.value || 0}%</div>
          <div className="flex items-center text-xs text-slate-500 font-medium">
            avg margin reduction
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Coupon Usage */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-6">
            <h4 className="text-slate-900 font-bold text-lg">Coupon usage — most to least used</h4>
            <p className="text-sm text-slate-500">number of orders using each coupon code</p>
          </div>
          <div className="flex flex-col gap-4 max-h-96 overflow-y-auto pr-2">
            {couponUsage?.length > 0 ? couponUsage.map((c, i) => {
              const maxVal = Math.max(...couponUsage.map(x => x.usedCount));
              const pct = (c.usedCount / maxVal) * 100;
              return (
                <div key={i} className="flex items-center gap-4 text-sm font-medium">
                  <div className="w-24 font-bold text-slate-700 truncate">{c.code}</div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                  <div className="w-8 text-right text-slate-900">{c.usedCount}</div>
                  <div className="w-16 text-center text-xs text-amber-700 bg-amber-50 rounded-full py-0.5 border border-amber-200">{c.discountText}</div>
                </div>
              )
            }) : <p className="text-slate-500 text-sm">No coupons used yet.</p>}
          </div>
        </div>

        {/* Revenue vs Discount */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-6">
            <h4 className="text-slate-900 font-bold text-lg">Revenue generated vs discount given</h4>
            <p className="text-sm text-slate-500">per campaign — ROI of each promotion</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-700 mb-6">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-indigo-400"></div> Revenue</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-rose-400"></div> Discount</div>
          </div>
          <div className="h-64">
            {revenueVsDiscount?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueVsDiscount} margin={{ top: 0, right: 0, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="campaign" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} angle={-25} textAnchor="end" dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(val) => `₹${val/1000}k`} />
                  <RechartsTooltip content={<CustomTooltipBar />} cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#818cf8" radius={[2, 2, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="discount" name="Discount" fill="#fb7185" radius={[2, 2, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-slate-500 text-sm">No campaign data available.</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top products during sale periods */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-6">
            <h4 className="text-slate-900 font-bold text-lg">Top products during sale periods</h4>
            <p className="text-sm text-slate-500">most purchased when a promo was active</p>
          </div>
          <div className="flex flex-col gap-4 max-h-96 overflow-y-auto pr-2">
            {topPromoProducts?.length > 0 ? topPromoProducts.map((p, i) => {
              const maxVal = Math.max(...topPromoProducts.map(x => x.quantity));
              const pct = (p.quantity / maxVal) * 100;
              return (
                <div key={i} className="flex items-center gap-4 text-sm font-medium">
                  <div className="w-4 text-slate-400">{i + 1}</div>
                  <div className="w-32 truncate text-slate-700">{p.name}</div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                  <div className="w-10 text-right text-slate-900">{p.quantity}</div>
                </div>
              )
            }) : <p className="text-slate-500 text-sm">No promo products sold yet.</p>}
          </div>
        </div>

        {/* Scatter plot */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-6">
            <h4 className="text-slate-900 font-bold text-lg">Did discounts increase volume or cut margin?</h4>
            <p className="text-sm text-slate-500">volume lift vs margin loss per campaign</p>
          </div>
          <div className="h-64">
            {volumeLiftVsMargin?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" dataKey="volumeLift" name="Volume lift" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} label={{ value: 'Volume Lift (Usage)', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis type="number" dataKey="marginLoss" name="Margin loss" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} label={{ value: 'Margin Loss %', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
                  <ZAxis type="category" dataKey="campaign" name="Campaign" />
                  <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomScatterTooltip />} />
                  <Scatter name="Campaigns" data={volumeLiftVsMargin} fill="#8b5cf6" />
                </ScatterChart>
              </ResponsiveContainer>
            ) : <p className="text-slate-500 text-sm">No volume/margin data available.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
