import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, AlertTriangle, ArrowRight, ArrowDown } from 'lucide-react';
import api from '../utils/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ComposedChart, Line, CartesianGrid, LineChart } from 'recharts';
import CustomerIntelligence from './CustomerIntelligence';
import OrderIntelligence from './OrderIntelligence';
import RevenueIntelligence from './RevenueIntelligence';
import PromotionsIntelligence from './PromotionsIntelligence';
import InventoryIntelligence from './InventoryIntelligence';

const formatCurrency = (amount) => {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}k`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

export default function AnalyticsDashboard({ currentTab = 'customer' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeekStart, setSelectedWeekStart] = useState('');
  const [availableWeeks, setAvailableWeeks] = useState([]);

  const [showAllConverters, setShowAllConverters] = useState(false);
  const [showAllAbandoned, setShowAllAbandoned] = useState(false);
  const [showAllTopSelling, setShowAllTopSelling] = useState(false);
  const [showAllLowestSelling, setShowAllLowestSelling] = useState(false);
  const [showAllMostViewed, setShowAllMostViewed] = useState(false);
  const [showAllLeastViewed, setShowAllLeastViewed] = useState(false);
  const [showAllMostAdded, setShowAllMostAdded] = useState(false);
  const [showAllLeastAdded, setShowAllLeastAdded] = useState(false);
  const [showAllAov, setShowAllAov] = useState(false);
  const [showAllStockRisk, setShowAllStockRisk] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Assume API returns exactly the nested structure we created in backend
        const res = await api.getDashboard(selectedWeekStart); 
        console.log('Dashboard API response:', res);
        
        // Handle both nested and direct data structures safely
        let finalData = res;
        if (res && res.data) finalData = res.data;
        else if (res && res.success && res.data) finalData = res.data;
        
        console.log('Final data to set:', finalData);
        setData(finalData);
        if (finalData && finalData.availableWeeks) {
          setAvailableWeeks(finalData.availableWeeks);
        }
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedWeekStart]);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mb-4"></div>
        <p className="text-slate-500">Loading dashboard data...</p>
      </div>
    );
  }

  const {
    overview,
    timeBasedPatterns,
    productSales,
    productViews,
    cartActivity,
    conversion,
    funnel,
    cityIntelligence,
    peakHours,
    stockRisk
  } = data || {};

  if (!overview || !overview.revenue) {
    return (
      <div className="flex items-center justify-center min-h-[600px] bg-slate-50 text-red-500">
        <div>Error loading dashboard data. Missing required fields. Check console.</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 p-8 font-sans">
      
      {/* 1. OVERVIEW METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <MetricCard 
          title="Total Revenue" 
          value={formatCurrency(overview.revenue.value)} 
          diff={overview.revenue.diff} 
          diffLabel="vs last month"
        />
        <MetricCard 
          title="Orders" 
          value={overview.orders.value.toLocaleString()} 
          diff={overview.orders.diff} 
          diffLabel="vs last month"
        />
        <MetricCard 
          title="Avg Order Value" 
          value={`₹${overview.aov.value.toLocaleString()}`} 
          diff={overview.aov.diff} 
          diffLabel="vs last month"
          inverse
        />
        <MetricCard 
          title="Cart Abandon Rate" 
          value={`${overview.abandonRate.value}%`} 
          diff={overview.abandonRate.diff} 
          diffLabel={overview.abandonRate.diff < 0 ? "improvement" : "increase"}
          inverse
        />
      </div>

      {currentTab === 'customer' && (
        <CustomerIntelligence />
      )}

      {currentTab === 'orders' && (
        <OrderIntelligence />
      )}

      {currentTab === 'revenue' && (
        <RevenueIntelligence />
      )}

      {currentTab === 'promotions' && (
        <PromotionsIntelligence />
      )}

      {currentTab === 'inventory' && (
        <InventoryIntelligence />
      )}

      {currentTab === 'time' && timeBasedPatterns && (
        <TimeBasedPatterns 
          data={timeBasedPatterns} 
          availableWeeks={availableWeeks}
          selectedWeekStart={selectedWeekStart || data.selectedWeekStart || ''}
          setSelectedWeekStart={setSelectedWeekStart}
        />
      )}

      {currentTab === 'sales' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* 2. PRODUCT SALES PERFORMANCE */}
          <div className="mb-12">
            <h3 className="text-xs font-bold text-slate-500 tracking-wider mb-4 uppercase">Product Sales Performance</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ListCard 
                title="Top selling" 
                subtitle="by units sold this month"
                items={productSales.topSelling.map(p => ({ label: p.name, value: p.unitsSold, max: productSales.topSelling[0]?.unitsSold }))}
                barColor="bg-[#6db82f]"
              />
              <ListCard 
                title="Lowest selling" 
                subtitle="products at risk of stagnation"
                items={productSales.lowestSelling.map(p => ({ label: p.name, value: p.unitsSold, max: Math.max(...productSales.lowestSelling.map(x=>x.unitsSold), 1) }))}
                barColor="bg-[#e74c3c]"
              />
            </div>
          </div>

          {/* 3. PRODUCT VIEWS & CART ACTIVITY */}
          <div className="mb-12">
            <h3 className="text-xs font-bold text-slate-500 tracking-wider mb-4 uppercase">Product Views</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
              <ListCard 
                title="Most viewed" 
                subtitle="high discovery, check conversion"
                items={productViews.mostViewed.map(p => ({ label: p.name, value: p.views, max: productViews.mostViewed[0]?.views }))}
                barColor="bg-[#3498db]"
                valueFormatter={(v) => v.toLocaleString()}
              />
              <ListCard 
                title="Least viewed" 
                subtitle="may need promotion or removal"
                items={productViews.leastViewed.map(p => ({ label: p.name, value: p.views, max: Math.max(...productViews.leastViewed.map(x=>x.views), 1) }))}
                barColor="bg-[#e74c3c]"
                valueFormatter={(v) => v.toLocaleString()}
              />
            </div>

            <h3 className="text-xs font-bold text-slate-500 tracking-wider mb-4 uppercase">Cart Activity</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ListCard 
                title="Most added to cart" 
                subtitle="strong intent signal"
                items={cartActivity.mostAdded.map(p => ({ label: p.name, value: p.addedToCart, max: cartActivity.mostAdded[0]?.addedToCart }))}
                barColor="bg-[#1abc9c]"
              />
              <ListCard 
                title="Least added to cart" 
                subtitle="low interest or poor listing"
                items={cartActivity.leastAdded.map(p => ({ label: p.name, value: p.addedToCart, max: Math.max(...cartActivity.leastAdded.map(x=>x.addedToCart), 1) }))}
                barColor="bg-[#e74c3c]"
              />
            </div>
          </div>

          {/* 4. CONVERSION */}
          <div className="mb-12">
            <h3 className="text-xs font-bold text-slate-500 tracking-wider mb-4 uppercase">Cart → Checkout Conversion</h3>
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8 shadow-sm">
              <div className="mb-6">
                <h4 className="text-slate-800 font-semibold">Products that convert — cart added to checkout completed</h4>
                <p className="text-sm text-slate-400">sorted high to low conversion rate</p>
              </div>
              <div className="space-y-4">
                {(showAllConverters ? conversion.topConverters : conversion.topConverters.slice(0, 5)).map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">{p.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-400">{p.addedToCart} added <ArrowRight className="inline w-3 h-3 mx-1" /> {p.purchased} bought</span>
                      <Badge value={p.conversionRate} type="success" />
                    </div>
                  </div>
                ))}
              </div>
              {conversion.topConverters.length > 5 && (
                <button 
                  onClick={() => setShowAllConverters(!showAllConverters)}
                  className="mt-4 w-full py-2 text-sm font-medium text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {showAllConverters ? 'Show Less' : `Show All (${conversion.topConverters.length})`}
                </button>
              )}
            </div>

            <h3 className="text-xs font-bold text-slate-500 tracking-wider mb-4 uppercase">Abandoned Carts</h3>
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="mb-6">
                <h4 className="text-slate-800 font-semibold">Products abandoned most in cart</h4>
                <p className="text-sm text-slate-400">high abandon = pricing or trust issue</p>
              </div>
              <div className="space-y-4">
                {(showAllAbandoned ? conversion.mostAbandoned : conversion.mostAbandoned.slice(0, 5)).map((p, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-slate-200/50 pb-3 last:border-0 last:pb-0">
                    <span className="font-medium text-slate-700">{p.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-400">{p.abandoned} abandoned</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">abandoned</span>
                    </div>
                  </div>
                ))}
              </div>
              {conversion.mostAbandoned.length > 5 && (
                <button 
                  onClick={() => setShowAllAbandoned(!showAllAbandoned)}
                  className="mt-4 w-full py-2 text-sm font-medium text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {showAllAbandoned ? 'Show Less' : `Show All (${conversion.mostAbandoned.length})`}
                </button>
              )}
            </div>
          </div>

          {/* 5. FUNNEL & CITY INTELLIGENCE */}
          <div className="mb-12">
            <h3 className="text-xs font-bold text-slate-500 tracking-wider mb-4 uppercase">Conversion Funnel</h3>
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-12 shadow-sm">
              <div className="mb-6">
                <h4 className="text-slate-800 font-semibold">Overall store funnel</h4>
                <p className="text-sm text-slate-400">views → cart → checkout → purchase</p>
              </div>
              <div className="space-y-6">
                <FunnelBar label="Product Views" value={funnel.views} max={funnel.views} color="bg-blue-500" />
                <FunnelBar label="Added to Cart" value={funnel.addedToCart} max={funnel.views} color="bg-emerald-500" drop={funnel.views ? Math.round((1 - funnel.addedToCart/funnel.views)*100) : 0} prev={funnel.views} />
                <FunnelBar label="Reached Checkout" value={funnel.reachedCheckout} max={funnel.views} color="bg-orange-500" drop={funnel.addedToCart ? Math.round((1 - funnel.reachedCheckout/funnel.addedToCart)*100) : 0} prev={funnel.addedToCart} />
                <FunnelBar label="Completed Purchase" value={funnel.purchased} max={funnel.views} color="bg-[#6db82f]" drop={funnel.reachedCheckout ? Math.round((1 - funnel.purchased/funnel.reachedCheckout)*100) : 0} prev={funnel.reachedCheckout} />
              </div>
            </div>

            <h3 className="text-xs font-bold text-slate-500 tracking-wider mb-4 uppercase">City Intelligence</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ListCard 
                title="Orders by city" 
                subtitle="high to low"
                items={cityIntelligence.ordersByCity.map(c => ({ label: c.city, value: c.orders, max: cityIntelligence.ordersByCity[0]?.orders }))}
                barColor="bg-indigo-500"
                showRank
              />
              <ListCard 
                title="Customers by city" 
                subtitle="high to low"
                items={cityIntelligence.customersByCity.map(c => ({ label: c.city, value: c.customers, max: cityIntelligence.customersByCity[0]?.customers }))}
                barColor="bg-blue-500"
                showRank
              />
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="mb-6">
                  <h4 className="text-slate-800 font-semibold">Avg order value</h4>
                  <p className="text-sm text-slate-400">revenue per order by city</p>
                </div>
                <div className="space-y-3">
                  {(showAllAov ? cityIntelligence.aovByCity : cityIntelligence.aovByCity.slice(0, 5)).map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 w-4">{i + 1}</span>
                        <span className="font-medium text-slate-700">{c.city}</span>
                      </div>
                      <span className="text-slate-600">₹{c.aov.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                {cityIntelligence.aovByCity.length > 5 && (
                  <button 
                    onClick={() => setShowAllAov(!showAllAov)}
                    className="mt-4 w-full py-2 text-sm font-medium text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    {showAllAov ? 'Show Less' : `Show All (${cityIntelligence.aovByCity.length})`}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 6. PEAK HOURS & STOCK ALERTS */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 tracking-wider mb-4 uppercase">Peak Order Hours</h3>
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-12 shadow-sm">
              <div className="mb-6">
                <h4 className="text-slate-800 font-semibold">Order volume by hour & day</h4>
                <p className="text-sm text-slate-400">darker = more orders</p>
              </div>
              <Heatmap data={peakHours} />
            </div>

            <h3 className="text-xs font-bold text-slate-500 tracking-wider mb-4 uppercase">Stock Risk Alert</h3>
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="mb-6">
                <h4 className="text-slate-800 font-semibold text-red-400">High demand, low stock</h4>
                <p className="text-sm text-slate-400">act before stockout causes lost orders</p>
              </div>
              <div className="space-y-3">
                {(showAllStockRisk ? stockRisk : stockRisk.slice(0, 5)).map((p, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="text-orange-400 w-5 h-5" />
                      <span className="font-medium text-slate-700">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-500">Stock: <span className="text-slate-800 font-bold">{p.stock} units</span></span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#f1c40f]/10 text-[#f1c40f] border border-[#f1c40f]/20">{p.demand}</span>
                    </div>
                  </div>
                ))}
                {stockRisk.length === 0 && (
                  <div className="text-slate-400 text-sm">No critical stock risks detected.</div>
                )}
              </div>
              {stockRisk.length > 5 && (
                <button 
                  onClick={() => setShowAllStockRisk(!showAllStockRisk)}
                  className="mt-4 w-full py-2 text-sm font-medium text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {showAllStockRisk ? 'Show Less' : `Show All (${stockRisk.length})`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Subcomponents

function MetricCard({ title, value, diff, diffLabel, inverse = false }) {
  const isPositive = diff > 0;
  // If inverse, diff < 0 is good (e.g. lower abandon rate is good)
  const isGood = inverse ? !isPositive : isPositive;
  const Color = isGood ? 'text-slate-500' : 'text-slate-500'; // Kept neutral like screenshot

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-sm font-medium text-slate-500 mb-2">{title}</h3>
      <div className="text-3xl font-bold text-slate-800 mb-2">{value}</div>
      <div className="flex items-center text-xs text-slate-400">
        {diff !== 0 && (
          <span className={`flex items-center mr-2 ${isGood ? 'text-slate-500' : 'text-slate-500'}`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
            {Math.abs(diff)}%
          </span>
        )}
        <span>{diffLabel}</span>
      </div>
    </div>
  );
}

function ListCard({ title, subtitle, items, barColor, valueFormatter = (v) => v, showRank = true }) {
  const [showAll, setShowAll] = useState(false);
  const displayedItems = showAll ? items : items.slice(0, 5);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="mb-6">
        <h4 className="text-slate-800 font-semibold">{title}</h4>
        <p className="text-sm text-slate-400">{subtitle}</p>
      </div>
      <div className="space-y-4">
        {displayedItems.map((item, i) => {
          const percent = item.max > 0 ? (item.value / item.max) * 100 : 0;
          return (
            <div key={i} className="flex items-center text-sm">
              {showRank && <span className="text-slate-400 w-6 shrink-0">{i + 1}</span>}
              <span className="font-medium text-slate-700 truncate flex-1 pr-4">{item.label}</span>
              <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0 mx-4">
                <div className={`h-full ${barColor} rounded-full`} style={{ width: `${percent}%` }}></div>
              </div>
              <span className="text-slate-600 w-12 text-right shrink-0 font-medium">{valueFormatter(item.value)}</span>
            </div>
          );
        })}
        {items.length === 0 && <div className="text-sm text-slate-400">No data available</div>}
      </div>
      {items.length > 5 && (
        <button 
          onClick={() => setShowAll(!showAll)}
          className="mt-4 w-full py-2 text-sm font-medium text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
        >
          {showAll ? 'Show Less' : `Show All (${items.length})`}
        </button>
      )}
    </div>
  );
}

function Badge({ value, type }) {
  let colorClass = '';
  if (value >= 50) colorClass = 'bg-[#6db82f]/20 text-[#6db82f] border-[#6db82f]/30';
  else if (value >= 30) colorClass = 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  else colorClass = 'bg-red-500/20 text-red-400 border-red-500/30';

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${colorClass}`}>
      {value}%
    </span>
  );
}

function FunnelBar({ label, value, max, color, drop = 0, prev = 0 }) {
  const percent = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-slate-700">{label}</span>
        <div className="flex items-center gap-3">
          <span className="text-slate-800 font-bold">{value.toLocaleString()}</span>
          {drop > 0 && <span className="text-red-400 text-xs font-medium bg-red-400/10 px-1.5 py-0.5 rounded">↓ {drop}% drop</span>}
        </div>
      </div>
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}

function Heatmap({ data }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const timeLabels = ['6am', '9am', '12pm', '3pm', '6pm', '9pm'];
  
  // Flatten data to find max value for opacity scaling
  let maxVal = 0;
  for (let d = 0; d < 7; d++) {
    for (let h = 6; h <= 21; h++) {
      if (data[d][h] > maxVal) maxVal = data[d][h];
    }
  }

  // Create grid cells (6am-9pm, so rows are 6, 9, 12, 15, 18, 21)
  const rows = [6, 9, 12, 15, 18, 21];

  const getColor = (val) => {
    if (val === 0) return 'bg-slate-100'; // Empty state
    const ratio = val / (maxVal || 1);
    if (ratio > 0.75) return 'bg-emerald-600 text-white';
    if (ratio > 0.5) return 'bg-emerald-500 text-white';
    if (ratio > 0.25) return 'bg-emerald-400 text-slate-800';
    return 'bg-emerald-300 text-slate-800';
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="flex mb-2">
          <div className="w-16"></div> {/* Offset for y-axis labels */}
          {days.map(d => (
            <div key={d} className="flex-1 text-center text-xs font-medium text-slate-500">{d}</div>
          ))}
        </div>
        
        {rows.map((r, i) => (
          <div key={r} className="flex items-center mb-1">
            <div className="w-16 text-xs font-medium text-slate-400">{timeLabels[i]}</div>
            {days.map((_, dayIdx) => {
              // Aggregate surrounding 3 hours for each row block to match screenshot's chunky feel
              const val = data[dayIdx][r] + (data[dayIdx][r+1]||0) + (data[dayIdx][r+2]||0);
              const colorClass = getColor(val);
              return (
                <div key={`${r}-${dayIdx}`} className="flex-1 p-0.5">
                  <div className={`h-8 rounded-sm flex items-center justify-center text-[10px] font-bold ${colorClass}`}>
                    {val > 0 ? val : ''}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
          <span>Low</span>
          <div className="flex gap-1">
            <div className="w-6 h-3 rounded-sm bg-emerald-300"></div>
            <div className="w-6 h-3 rounded-sm bg-emerald-400"></div>
            <div className="w-6 h-3 rounded-sm bg-emerald-500"></div>
            <div className="w-6 h-3 rounded-sm bg-emerald-600"></div>
          </div>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}

// New TimeBasedPatterns Component
function TimeBasedPatterns({ data, availableWeeks = [], selectedWeekStart, setSelectedWeekStart }) {
  if (!data) return null;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-xl text-xs font-medium text-slate-600 z-50 relative">
          <p className="mb-2 text-slate-900 font-bold">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="capitalize">{entry.name}:</span>
              <span className="text-slate-900">₹{entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const yAxisFormatter = (val) => {
    if (val === 0) return '₹0K';
    return `₹${(val / 1000).toFixed(0)}K`;
  };

  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase">Time-Based Patterns</h3>
        {availableWeeks.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Select Week:</span>
            <select
              value={selectedWeekStart}
              onChange={(e) => setSelectedWeekStart(e.target.value)}
              className="text-xs bg-white border border-slate-200 text-slate-600 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-300 font-medium shadow-sm cursor-pointer"
            >
              {availableWeeks.map(w => (
                <option key={w.start} value={w.start}>{w.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm relative">
        
        {/* Top Chart: Seasonal trend */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-6 relative">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h4 className="text-slate-900 font-bold text-lg">Seasonal trend — monthly revenue</h4>
              <p className="text-sm text-slate-500">wedding & festival peaks highlighted</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#22c55e]"></div> This year</div>
              <div className="flex items-center gap-2"><div className="w-4 h-0.5 bg-[#94a3b8]"></div> Last year</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#f59e0b]"></div> Festival period</div>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.seasonalTrend} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={yAxisFormatter} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                
                <Bar dataKey="thisYear" name="This year" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                
                <Line type="monotone" dataKey="lastYear" name="Last year" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#94a3b8', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#f59e0b' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="absolute bottom-4 right-1/4 translate-x-12 hidden md:block">
             <div className="w-10 h-1 bg-[#f59e0b]/30 rounded-full mx-auto mb-1"></div>
          </div>
        </div>

        {/* Bottom Charts Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Bottom Left: Day-of-week */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <div className="mb-8">
              <h4 className="text-slate-900 font-bold text-lg">Day-of-week revenue pattern</h4>
              <p className="text-sm text-slate-500">which days generate the most revenue</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.dayOfWeekPattern} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={yAxisFormatter} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Right: Weekly comparison */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 pb-12">
            <div className="mb-8">
              <h4 className="text-slate-900 font-bold text-lg">This week vs last week vs same week last year</h4>
              <p className="text-sm text-slate-500">daily revenue comparison</p>
            </div>
            <div className="h-56 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.weeklyComparison} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={yAxisFormatter} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  
                  <Line type="monotone" dataKey="thisWeek" name="This week" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#ffffff' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="lastWeek" name="Last week" stroke="#f97316" strokeWidth={2} dot={{ r: 3, fill: '#f97316', strokeWidth: 2, stroke: '#ffffff' }} />
                  <Line type="monotone" dataKey="sameWeekLastYear" name="Same wk LY" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#94a3b8', strokeWidth: 2, stroke: '#ffffff' }} />
                </LineChart>
              </ResponsiveContainer>
              
              {/* Custom Legend to match design at the bottom */}
              <div className="absolute -bottom-8 left-0 flex items-center gap-4 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-2"><div className="w-4 h-0.5 bg-[#8b5cf6]"></div> This week</div>
                <div className="flex items-center gap-2"><div className="w-4 h-0.5 bg-[#f97316]"></div> Last week</div>
                <div className="flex items-center gap-2"><div className="w-4 h-0.5 bg-[#94a3b8]"></div> Same wk LY</div>
              </div>
            </div>
          </div>

        </div>
        
        {/* Scroll down indicator to match design */}
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shadow-sm z-10">
          <ArrowDown size={16} />
        </div>
      </div>
    </div>
  );
}
