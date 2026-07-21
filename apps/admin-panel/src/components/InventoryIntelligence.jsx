import React, { useState, useEffect } from 'react';
import { PackageOpen, AlertCircle, Heart, HeartOff, PackageMinus } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, Legend } from 'recharts';
import api from '../utils/api';

export default function InventoryIntelligence() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deadStockTab, setDeadStockTab] = useState('never');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.getInventoryIntelligence();
        setData(res);
      } catch (error) {
        console.error('Failed to load inventory intelligence data', error);
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
        <p className="text-slate-500">Loading Inventory Intelligence...</p>
      </div>
    );
  }

  const { deadStock, desireGap, incomplete, healthScore } = data;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-12 border-t border-slate-200 pt-12">
      <h2 className="text-sm font-bold text-slate-500 tracking-wider mb-6 uppercase flex items-center gap-2">
        <PackageOpen className="w-4 h-4" />
        Inventory & Catalogue Health
      </h2>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Dead stock (90d)</h3>
          <div className="text-3xl font-bold text-red-500 mb-2">{deadStock?.count || 0}</div>
          <div className="flex items-center text-xs text-slate-500 font-medium">
            zero sales in 90 days
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Desire gap items</h3>
          <div className="text-3xl font-bold text-amber-500 mb-2">{desireGap?.count || 0}</div>
          <div className="flex items-center text-xs text-slate-500 font-medium">
            wishlisted, rarely bought
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Incomplete listings</h3>
          <div className="text-3xl font-bold text-amber-600 mb-2">{incomplete?.count || 0}</div>
          <div className="flex items-center text-xs text-slate-500 font-medium">
            missing images or desc
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Catalogue health</h3>
          <div className="text-3xl font-bold text-slate-900 mb-2">{healthScore || 0}%</div>
          <div className="flex items-center text-xs text-slate-500 font-medium">
            score out of 100
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Dead Stock List */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-4">
            <h4 className="text-slate-900 font-bold text-lg">Dead stock — zero sales in 90 days</h4>
            <p className="text-sm text-slate-500">products created over 90 days ago with zero recent sales</p>
          </div>

          <div className="flex gap-2 mb-6 border-b border-slate-100 pb-2">
            <button 
              onClick={() => setDeadStockTab('never')}
              className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${deadStockTab === 'never' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Never sold
            </button>
            <button 
              onClick={() => setDeadStockTab('cold')}
              className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${deadStockTab === 'cold' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Went cold
            </button>
          </div>

          <div className="flex flex-col gap-4 max-h-96 overflow-y-auto pr-2">
            {deadStock?.items?.filter(i => deadStockTab === 'never' ? i.neverSold : !i.neverSold).length > 0 ? (
              deadStock.items.filter(i => deadStockTab === 'never' ? i.neverSold : !i.neverSold).map((item, i) => (
              <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <PackageMinus className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-800 text-sm truncate w-40" title={item.name}>{item.name}</span>
                  </div>
                  <span className="text-xs text-slate-400 ml-6">{item.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-medium">Stock: {item.stockCount}</span>
                  <span className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold min-w-[90px] text-center whitespace-nowrap">
                    {item.neverSold ? `new ${item.daysSinceCreated}d ago` : `${item.daysSinceLastSale}d no sale`}
                  </span>
                </div>
              </div>
            ))) : <p className="text-slate-500 text-sm">No items in this category.</p>}
          </div>
        </div>

        {/* Desire Gap List */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-6">
            <h4 className="text-slate-900 font-bold text-lg">Desire gap — wishlisted but never purchased</h4>
            <p className="text-sm text-slate-500">high wishlist, zero conversion — price or trust issue</p>
          </div>
          <div className="flex flex-col gap-4 max-h-96 overflow-y-auto pr-2">
            {desireGap?.items?.length > 0 ? desireGap.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4 text-pink-400" />
                  <span className="font-semibold text-slate-800 text-sm">{item.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-500 font-medium">{item.wishlistCount} wishlisted</span>
                  <span className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-bold w-16 text-center">
                    {item.salesCount} sold
                  </span>
                </div>
              </div>
            )) : <p className="text-slate-500 text-sm">No significant desire gaps found.</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Incomplete Listings List */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-6">
            <h4 className="text-slate-900 font-bold text-lg">Incomplete product listings</h4>
            <p className="text-sm text-slate-500">missing images, descriptions, or pricing</p>
          </div>
          <div className="flex flex-col gap-4 max-h-96 overflow-y-auto pr-2">
            {incomplete?.items?.length > 0 ? incomplete.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-slate-800 text-sm">{item.name}</span>
                </div>
                <span className="text-xs text-slate-500 font-medium text-right max-w-[150px] truncate" title={item.missing}>
                  {item.missing}
                </span>
              </div>
            )) : <p className="text-slate-500 text-sm">All listings are complete!</p>}
          </div>
        </div>

        {/* Price History Tracking Block */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h4 className="text-slate-900 font-bold text-lg">Price History Tracking</h4>
              <p className="text-sm text-slate-500">Historical price modifications &amp; audit log</p>
            </div>
            <span className="px-2.5 py-1 bg-brand-50 text-brand-700 border border-brand-200 rounded-full text-xs font-extrabold">
              {data.priceHistory?.count || 0} Changes Recorded
            </span>
          </div>

          <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-2">
            {data.priceHistory?.items?.length > 0 ? (
              data.priceHistory.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 transition-colors">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-extrabold text-slate-800 text-sm">{item.productName}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Modified by {item.changedBy} • {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-slate-400 line-through">₹{item.oldPrice}</span>
                        <span className="text-slate-400 font-bold">→</span>
                        <span className="font-extrabold text-slate-800">₹{item.newPrice}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${item.diff > 0 ? 'bg-amber-100 text-amber-800' : item.diff < 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                      {item.diffPercent}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-500 font-bold">No price modifications recorded yet.</p>
                <p className="text-[10px] text-slate-400 mt-1">Changes made to product prices in the catalogue will be automatically audited and tracked here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
