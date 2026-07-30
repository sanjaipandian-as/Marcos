import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Package, ShoppingCart, DollarSign,
  Truck, Calendar, Users, AlertTriangle, BarChart2, Clock,
  ArrowUpRight, RefreshCw, Eye, ShoppingBag, MapPin, Zap,
  Star, Activity, CheckCircle2, ChevronLeft, ChevronRight,
  CalendarDays, X
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import api from '../utils/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtCur = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtK = (n) => {
  const v = Number(n || 0);
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v}`;
};
const todayISO = () => new Date().toISOString().substring(0, 10);
const isToday = (dateStr) => dateStr === todayISO();

const STATUS_COLORS = {
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
  PROCESSING: 'bg-blue-50 text-blue-700 border-blue-100',
  SHIPPED: 'bg-violet-50 text-violet-700 border-violet-100',
  OUT_FOR_DELIVERY: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  CANCELLED: 'bg-red-50 text-red-600 border-red-100',
};
const CHART_COLORS = ['#c3a1c3', '#9b72b0', '#7b5ea7', '#5a3e8c', '#3d2766'];

// ─── Tooltip ─────────────────────────────────────────────────────────────────
function CT({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#3D2E3D] text-white px-3 py-2 rounded-xl text-xs shadow-xl space-y-0.5">
      <p className="text-slate-300 mb-1 font-semibold">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold">
          {p.name}: {p.name?.toLowerCase().includes('revenue') ? fmtK(p.value) : fmt(p.value)}
        </p>
      ))}
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KPICard({ icon: Icon, label, value, sub, diff, borderColor, iconBg, iconColor }) {
  const isPos = diff === undefined ? null : diff >= 0;
  return (
    <div className={`bg-white rounded-3xl p-5 shadow-premium border-t-2 hover:-translate-y-0.5 transition-all duration-300 ${borderColor}`}>
      <div className="flex justify-between items-start mb-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {isPos !== null && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${isPos ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
            {isPos ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
            {Math.abs(diff)}%
          </span>
        )}
      </div>
      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider leading-tight">{label}</p>
      <p className="text-2xl font-extrabold text-[#3D2E3D] tracking-tight mt-1">{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SH({ title, sub, action }) {
  return (
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-sm font-bold text-[#3D2E3D]">{title}</h3>
        {sub && <p className="text-[10px] text-slate-400 font-medium mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Date Filter Bar ──────────────────────────────────────────────────────────
function DateFilterBar({ selectedDate, onDateChange, loading, allOrders = [] }) {
  const today = todayISO();
  const [anchorDateStr, setAnchorDateStr] = useState(selectedDate || today);

  useEffect(() => {
    if (selectedDate) setAnchorDateStr(selectedDate);
  }, [selectedDate]);

  const daysList = useMemo(() => {
    const list = [];
    const base = new Date(anchorDateStr + 'T00:00:00.000Z');
    if (isNaN(base.getTime())) return list;

    for (let offset = -3; offset <= 3; offset++) {
      const d = new Date(base);
      d.setUTCDate(d.getUTCDate() + offset);
      const iso = d.toISOString().substring(0, 10);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }).toUpperCase();
      const dayNum = d.getUTCDate();
      const monthName = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });

      const dayStart = new Date(iso + 'T00:00:00.000Z');
      const dayEnd = new Date(dayStart);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

      let totalCount = 0;
      let newCount = 0;

      allOrders.forEach(o => {
        if (o.status === 'CANCELLED') return;
        const cDate = new Date(o.createdAt);
        if (cDate >= dayStart && cDate < dayEnd) {
          totalCount++;
          if (o.status === 'PENDING' || o.status === 'PAID') {
            newCount++;
          }
        }
      });

      list.push({
        iso,
        dayName,
        dayNum,
        monthName,
        totalCount,
        newCount,
      });
    }
    return list;
  }, [anchorDateStr, allOrders]);

  const handlePrevDay = () => {
    const d = new Date(anchorDateStr + 'T00:00:00.000Z');
    d.setUTCDate(d.getUTCDate() - 1);
    const newIso = d.toISOString().substring(0, 10);
    setAnchorDateStr(newIso);
    onDateChange(newIso);
  };

  const handleNextDay = () => {
    const d = new Date(anchorDateStr + 'T00:00:00.000Z');
    d.setUTCDate(d.getUTCDate() + 1);
    const newIso = d.toISOString().substring(0, 10);
    setAnchorDateStr(newIso);
    onDateChange(newIso);
  };

  const handleSelectToday = () => {
    setAnchorDateStr(today);
    onDateChange(today);
  };

  return (
    <div className="bg-[#FAF9FC] rounded-3xl border border-slate-200/80 shadow-sm p-2.5 flex flex-col md:flex-row items-center gap-3 transition-all">
      {/* Left controls: Datepicker icon, TODAY button, Divider, Prev arrow */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Calendar Picker button */}
        <div
          title="Pick custom date"
          className="relative p-2.5 rounded-2xl bg-white border border-slate-200/80 text-slate-600 hover:text-brand-600 hover:border-brand-200 hover:bg-brand-50/50 cursor-pointer shadow-xs transition-all flex items-center justify-center"
        >
          <Calendar className="w-4 h-4 pointer-events-none" />
          <input
            type="date"
            value={selectedDate}
            onChange={e => {
              if (e.target.value) {
                setAnchorDateStr(e.target.value);
                onDateChange(e.target.value);
              }
            }}
            onClick={e => { try { e.target.showPicker(); } catch (err) {} }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
        </div>

        {/* TODAY button */}
        <button
          onClick={handleSelectToday}
          className={`px-3.5 py-2 rounded-2xl text-[11px] font-black tracking-wider uppercase transition-all border ${
            selectedDate === today
              ? 'bg-[#D8BFD8] text-[#2B1B2B] border-[#C5A3C5] shadow-xs'
              : 'bg-white text-slate-500 border-slate-200/80 hover:bg-slate-100'
          }`}
        >
          Today
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* Prev Arrow */}
        <button
          onClick={handlePrevDay}
          className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-500 hover:bg-slate-100 hover:text-[#3D2E3D] shadow-xs transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Date Pills Horizontal Strip */}
      <div className="flex-1 flex items-center justify-between gap-2 overflow-x-auto py-1 px-1 scrollbar-none w-full">
        {daysList.map(item => {
          const isSelected = selectedDate === item.iso;
          return (
            <button
              key={item.iso}
              onClick={() => {
                setAnchorDateStr(item.iso);
                onDateChange(item.iso);
              }}
              className={`flex-1 min-w-[72px] max-w-[105px] flex flex-col items-center justify-between py-2 px-1.5 rounded-2xl border transition-all duration-200 select-none ${
                isSelected
                  ? 'bg-[#D8BFD8] border-[#C4A4C4] text-[#2B1B2B] shadow-md ring-2 ring-[#D8BFD8]/50 scale-[1.04]'
                  : 'bg-white border-slate-200/70 text-slate-600 hover:border-purple-200 hover:bg-purple-50/40 shadow-xs'
              }`}
            >
              {/* Top Stats Badges (Total & New Orders) */}
              <div className="flex items-center gap-1 mb-1.5">
                <span
                  title="Total orders on this date"
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                    isSelected
                      ? 'bg-white/80 text-[#2B1B2B]'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.totalCount} <span className="text-[7.5px] font-bold opacity-75">total</span>
                </span>
                {item.newCount > 0 && (
                  <span
                    title="New orders"
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-[#3D2E3D] text-white'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    +{item.newCount} <span className="text-[7.5px] font-bold opacity-80">new</span>
                  </span>
                )}
              </div>

              {/* Day Name */}
              <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isSelected ? 'text-[#3D263D]' : 'text-slate-400'}`}>
                {item.dayName}
              </span>

              {/* Date Number */}
              <span className={`text-base font-black leading-tight mt-0.5 ${isSelected ? 'text-[#1F101F]' : 'text-[#3D2E3D]'}`}>
                {item.dayNum}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right controls: Next Arrow */}
      <div className="flex items-center shrink-0">
        <button
          onClick={handleNextDay}
          className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-500 hover:bg-slate-100 hover:text-[#3D2E3D] shadow-xs transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}


const isActiveSlot = (timeSlot, dateStr) => {
  if (!timeSlot || !dateStr) return false;
  const today = new Date();
  const apptDate = new Date(dateStr);
  if (apptDate.toDateString() !== today.toDateString()) return false;

  const [start, end] = timeSlot.split(' - ');
  if (!start || !end) return false;

  const parseTime = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  const now = today.getHours() * 60 + today.getMinutes();
  const startMins = parseTime(start);
  const endMins = parseTime(end);

  return now >= startMins && now <= endMins;
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MasterDashboard({ setActiveTab, isActive }) {
  const [dash, setDash] = useState(null);
  const [allOrders, setAllOrders] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [loadingMain, setLoadingMain] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const [selectedOrderModal, setSelectedOrderModal] = useState(null);

  // ── Load main dashboard + all orders (on mount / refresh only)
  const loadMain = useCallback(async (quiet = false) => {
    if (!quiet) setLoadingMain(true);
    try {
      const [report, orders, appointments] = await Promise.all([
        api.getDashboardReport(),
        api.getOrders().catch(() => []),
        api.getAppointments().catch(() => []),
      ]);
      setDash({ ...report, _raw: report._raw });
      setAllOrders(Array.isArray(orders) ? orders : []);
      setAllAppointments(Array.isArray(appointments) ? appointments : (appointments?.data || []));
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Dashboard load failed:', e);
    } finally {
      if (!quiet) setLoadingMain(false);
    }
  }, []);

  useEffect(() => { loadMain(); }, [loadMain]);
  
  useEffect(() => { 
    if (isActive) {
      loadMain(true);
    }
  }, [isActive, loadMain]);

  // ── Client-side date filtering (no extra API call needed)
  const getDateStats = useCallback((date) => {
    const dayStart = new Date(date + 'T00:00:00.000Z');
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const inRange = (dateStr, start, end) => {
      const d = new Date(dateStr);
      return d >= start && d < end;
    };

    // Orders received on this date
    const dayOrders = allOrders.filter(o =>
      o.status !== 'CANCELLED' && inRange(o.createdAt, dayStart, dayEnd)
    );

    // Deliveries promised for this date
    const promisedDeliveries = allOrders.filter(o =>
      o.status !== 'CANCELLED' && o.deliveryDate && inRange(o.deliveryDate, dayStart, dayEnd)
    );
    const proceededDeliveries = promisedDeliveries.filter(o =>
      ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(o.status)
    );
    const completedDeliveries = promisedDeliveries.filter(o =>
      o.status === 'DELIVERED'
    );

    // Appointments scheduled for this date
    const dayAppointments = allAppointments.filter(a =>
      a.date && inRange(a.date, dayStart, dayEnd)
    );
    const confirmedAppointments = dayAppointments.filter(a =>
      a.status === 'CONFIRMED' || a.status === 'COMPLETED'
    );

    return {
      ordersReceived: dayOrders.length,
      deliveriesPromised: promisedDeliveries.length,
      deliveriesProceeded: proceededDeliveries.length,
      deliveriesCompleted: completedDeliveries.length,
      appointmentsScheduled: dayAppointments.length,
      appointmentsConfirmed: confirmedAppointments.length,
      ordersList: dayOrders.slice(0, 10),
      deliveriesPromisedList: promisedDeliveries,
      appointmentsList: dayAppointments, // all day meetings
    };
  }, [allOrders, allAppointments]);

  const handleDateChange = (d) => setSelectedDate(d);

  if (loadingMain) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-xs font-semibold">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const raw = dash?._raw || {};
  const overview = raw.overview || {};
  const rev = overview.revenue || {};
  const ord = overview.orders || {};
  const aovO = overview.aov || {};
  const abandon = overview.abandonRate || {};

  const revenueChart = dash?.revenueChart || [];
  const funnel = raw.funnel || {};
  const topSelling = (raw.productSales?.topSelling || []).slice(0, 5);
  const stockRisk = (raw.stockRisk || []).slice(0, 5);
  const cityData = (raw.cityIntelligence?.ordersByCity || []).slice(0, 5);
  const seasonalTrend = raw.timeBasedPatterns?.seasonalTrend || [];
  const dayPattern = raw.timeBasedPatterns?.dayOfWeekPattern || [];
  const recentOrders = (dash?.recentOrders || []).slice(0, 8);
  const topCats = dash?.topCategories || [];

  const ds = getDateStats(selectedDate);
  const nextLabel = isToday(selectedDate) ? "Tomorrow's" : `${new Date(new Date(selectedDate + 'T00:00:00').getTime() + 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}'s`;

  const funnelSteps = [
    { name: 'Views', value: funnel.views || 0 },
    { name: 'Checkout', value: funnel.reachedCheckout || 0 },
    { name: 'Purchased', value: funnel.purchased || 0 },
  ];

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[#3D2E3D] tracking-tight">Admin Dashboard</h2>
          <p className="text-sm text-slate-400 font-medium mt-0.5">End-to-end live platform overview</p>
        </div>
        <button
          onClick={loadMain}
          className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-[#3D2E3D] rounded-xl shadow-sm transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh · {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </button>
      </div>

      {/* ── Date Filter Bar ── */}
      <DateFilterBar selectedDate={selectedDate} onDateChange={handleDateChange} allOrders={allOrders} />

      {/* ── Date-Specific Stats Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Box 1: Orders Received */}
        <div
          onClick={() => {
            sessionStorage.setItem('admin_order_status_filter', 'ALL');
            sessionStorage.setItem('admin_order_date_filter', selectedDate);
            setActiveTab?.('orders-bookings');
          }}
          className="bg-white border border-brand-100 rounded-2xl p-4 flex flex-col justify-between cursor-pointer hover:shadow-premium hover:-translate-y-0.5 transition-all group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-brand-50 group-hover:bg-brand-100 flex items-center justify-center shrink-0 transition-colors">
              <ShoppingCart className="w-4 h-4 text-brand-600" />
            </div>
            <p className="text-[10px] text-brand-600 font-bold uppercase tracking-wider leading-tight">Orders<br />Received</p>
          </div>
          <p className="text-2xl font-black text-[#3D2E3D] mt-1">{ds.ordersReceived}</p>
        </div>

        {/* Box 2: Deliveries Promised */}
        <div
          onClick={() => {
            sessionStorage.setItem('admin_order_delivery_promised_date', selectedDate);
            setActiveTab?.('orders-bookings');
          }}
          className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between cursor-pointer hover:shadow-premium hover:-translate-y-0.5 transition-all group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-slate-100 flex items-center justify-center shrink-0 transition-colors">
              <Package className="w-4 h-4 text-slate-600" />
            </div>
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider leading-tight">Deliveries<br />Promised</p>
          </div>
          <p className="text-2xl font-black text-[#3D2E3D] mt-1">{ds.deliveriesPromised}</p>
        </div>

        {/* Box 3: Deliveries Proceeded */}
        <div
          onClick={() => {
            sessionStorage.setItem('admin_order_status_filter', 'PROCEEDED');
            setActiveTab?.('orders-bookings');
          }}
          className="bg-white border border-amber-100 rounded-2xl p-4 flex flex-col justify-between cursor-pointer hover:shadow-premium hover:-translate-y-0.5 transition-all group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center shrink-0 transition-colors">
              <Truck className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider leading-tight">Deliveries<br />Proceeded</p>
          </div>
          <p className="text-2xl font-black text-[#3D2E3D] mt-1">{ds.deliveriesProceeded}</p>
        </div>

        {/* Box 4: Deliveries Completed */}
        <div
          onClick={() => {
            sessionStorage.setItem('admin_order_status_filter', 'DELIVERED');
            setActiveTab?.('orders-bookings');
          }}
          className="bg-white border border-emerald-100 rounded-2xl p-4 flex flex-col justify-between cursor-pointer hover:shadow-premium hover:-translate-y-0.5 transition-all group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center shrink-0 transition-colors">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider leading-tight">Deliveries<br />Completed</p>
          </div>
          <p className="text-2xl font-black text-[#3D2E3D] mt-1">{ds.deliveriesCompleted}</p>
        </div>

        {/* Box 5: Appointments Scheduled */}
        <div
          onClick={() => {
            sessionStorage.setItem('admin_appt_status_filter', 'ALL');
            sessionStorage.setItem('admin_appt_date_filter', selectedDate);
            setActiveTab?.('orders-fittings');
          }}
          className="bg-white border border-blue-100 rounded-2xl p-4 flex flex-col justify-between cursor-pointer hover:shadow-premium hover:-translate-y-0.5 transition-all group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center shrink-0 transition-colors">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider leading-tight">Appointments<br />Scheduled</p>
          </div>
          <p className="text-2xl font-black text-[#3D2E3D] mt-1">{ds.appointmentsScheduled}</p>
        </div>

        {/* Box 6: Appointments Confirmed */}
        <div
          onClick={() => {
            sessionStorage.setItem('admin_appt_status_filter', 'CONFIRMED');
            sessionStorage.setItem('admin_appt_date_filter', selectedDate);
            setActiveTab?.('orders-fittings');
          }}
          className="bg-white border border-indigo-100 rounded-2xl p-4 flex flex-col justify-between cursor-pointer hover:shadow-premium hover:-translate-y-0.5 transition-all group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center shrink-0 transition-colors">
              <Star className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider leading-tight">Appointments<br />Confirmed</p>
          </div>
          <p className="text-2xl font-black text-[#3D2E3D] mt-1">{ds.appointmentsConfirmed}</p>
        </div>
      </div>

      {/* ── Date Details Section ── */}
      <div className="space-y-6">
        {/* Top 2 Columns: Orders Received & Appointments Scheduled */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Orders Received List */}
          <div className="bg-white rounded-3xl p-6 shadow-premium">
            <SH
              title={`Orders Received`}
              sub={`${ds.ordersReceived} orders on ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
              action={
                <button 
                  onClick={() => {
                    sessionStorage.setItem('admin_order_status_filter', 'ALL');
                    sessionStorage.setItem('admin_order_date_filter', selectedDate);
                    setActiveTab?.('orders-bookings');
                  }} 
                  className="text-[10px] font-bold text-brand-600 hover:underline"
                >
                  View all →
                </button>
              }
            />
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {ds.ordersList?.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                  <p className="text-xs font-semibold">No orders received on this date</p>
                </div>
              ) : ds.ordersList?.map(o => (
                <div 
                  key={o.id} 
                  onClick={() => setSelectedOrderModal(o)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/60 border border-slate-100 hover:bg-brand-50/40 transition-colors cursor-pointer group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#3D2E3D] group-hover:text-brand-700 transition-colors truncate">{o.invoiceNumber}</p>
                    <p className="text-[10px] text-slate-400 truncate">{o.user?.fullName || o.customerName || 'Guest'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs font-extrabold text-[#3D2E3D]">{fmtCur(o.payableAmount)}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[o.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Appointments List */}
          <div className="bg-white rounded-3xl p-6 shadow-premium">
            <SH
              title={`Appointments Scheduled`}
              sub={`${ds.appointmentsList?.length || 0} on ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
              action={
                <button 
                  onClick={() => {
                    sessionStorage.setItem('admin_appt_status_filter', 'ALL');
                    sessionStorage.setItem('admin_appt_date_filter', selectedDate);
                    setActiveTab?.('orders-fittings');
                  }} 
                  className="text-[10px] font-bold text-blue-600 hover:underline"
                >
                  View all →
                </button>
              }
            />
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {ds.appointmentsList?.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                  <p className="text-xs font-semibold">No appointments for this date</p>
                </div>
              ) : ds.appointmentsList?.map(a => {
                const active = isActiveSlot(a.timeSlot, a.date);
                return (
                  <div 
                    key={a.id} 
                    onClick={() => {
                      sessionStorage.setItem('admin_appt_status_filter', a.status || 'ALL');
                      setActiveTab?.('orders-fittings');
                    }}
                    className={`relative flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${active ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm' : 'bg-slate-50/60 border-slate-100 hover:bg-slate-100/80'}`}
                  >
                    {active && (
                      <div className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-white"></span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-xs font-bold truncate ${active ? 'text-indigo-950' : 'text-[#3D2E3D]'}`}>{a.user?.fullName || a.userName || 'Customer'}</p>
                        {active && <span className="text-[8px] font-black text-red-600 bg-red-100 px-1.5 rounded uppercase tracking-wider">Live Now</span>}
                      </div>
                      <p className={`text-[10px] ${active ? 'text-indigo-600 font-semibold' : 'text-slate-400'}`}>
                        {active && <Activity className="w-3 h-3 inline mr-1 text-indigo-500" />}
                        {a.type} · {a.timeSlot}
                      </p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${active ? 'bg-indigo-600 text-white border-indigo-600' : (a.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100')}`}>
                      {a.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── BIGGER Deliveries Promised Section (All Promised Deliveries for Specific Date - One by One Row List) ── */}
        <div id="deliveries-promised-section" className="bg-white rounded-3xl p-6 shadow-premium border-2 border-amber-200/80 transition-all duration-300">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-amber-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#3D2E3D] flex items-center gap-2">
                  <span>Deliveries Promised Pipeline</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Showing ALL promised orders for <strong className="text-amber-800">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                </p>
              </div>
            </div>

            <button 
              onClick={() => {
                sessionStorage.setItem('admin_order_delivery_promised_date', selectedDate);
                setActiveTab?.('orders-bookings');
              }} 
              className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-extrabold rounded-xl border border-amber-200 transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
            >
              <span>Open Order Manager</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Top Total Promised Stat Banner */}
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-white rounded-2xl p-4 mb-4 shadow-md flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-lg">
                📦
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-amber-100">Total Promised Deliveries for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                <p className="text-2xl font-black tracking-tight">{ds.deliveriesPromised} Order{ds.deliveriesPromised === 1 ? '' : 's'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs font-extrabold">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl">
                Pending: {ds.deliveriesPromisedList?.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING').length || 0}
              </span>
              <span className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl">
                Dispatched: {ds.deliveriesPromisedList?.filter(o => o.status === 'SHIPPED' || o.status === 'OUT_FOR_DELIVERY').length || 0}
              </span>
              <span className="bg-emerald-500 text-white px-3 py-1.5 rounded-xl shadow-xs">
                Completed: {ds.deliveriesProceeded}
              </span>
            </div>
          </div>

          {/* One-by-One Vertical Row List of ALL Promised Deliveries */}
          <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
            {ds.deliveriesPromisedList?.length === 0 ? (
              <div className="text-center py-12 bg-amber-50/20 rounded-2xl border border-dashed border-amber-200/60">
                <Package className="w-10 h-10 mx-auto mb-2 text-amber-300" />
                <p className="text-sm font-bold text-slate-700">No deliveries promised for this date</p>
                <p className="text-xs text-slate-400 mt-1">Select another date from the date strip above to view promised deliveries.</p>
              </div>
            ) : (
              ds.deliveriesPromisedList?.map(o => (
                <div 
                  key={o.id} 
                  onClick={() => setSelectedOrderModal(o)}
                  className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-amber-50/80 hover:border-amber-300 transition-all cursor-pointer group shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  {/* Left Column: Invoice & Package */}
                  <div className="flex items-center gap-3 min-w-[220px]">
                    <div className="w-9 h-9 rounded-xl bg-amber-100/70 text-amber-800 flex items-center justify-center shrink-0 font-bold">
                      <Package className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#3D2E3D] group-hover:text-amber-900 transition-colors">
                        {o.invoiceNumber}
                      </p>
                      <p className="text-[11px] font-bold text-slate-600 truncate">
                        {o.user?.fullName || o.customerName || 'Customer'}
                      </p>
                    </div>
                  </div>

                  {/* Middle Column: Customer Contact & Location */}
                  <div className="flex-1 text-xs text-slate-600 space-y-0.5 border-t md:border-t-0 md:border-l border-slate-200/60 pt-2 md:pt-0 md:pl-4">
                    {(o.user?.phoneNumber || o.shippingAddress?.phone) && (
                      <p className="font-semibold text-slate-700 flex items-center gap-1.5 truncate">
                        <span className="text-amber-600 font-bold">📞</span> {o.user?.phoneNumber || o.shippingAddress?.phone}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                      <span className="text-amber-600 font-bold">📍</span> {o.shippingAddress?.city || o.shippingAddress?.addressLine1 || 'Store Pickup / Standard Delivery'}
                    </p>
                  </div>

                  {/* Right Column: Amount & Status Badge */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60">
                    <div className="text-right">
                      <span className="text-xs font-black text-[#3D2E3D] block">
                        {fmtCur(o.payableAmount)}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        {o.items?.length || 1} Item(s)
                      </span>
                    </div>

                    <span className={`text-[10px] font-black px-3 py-1 rounded-xl border ${STATUS_COLORS[o.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      {o.status?.replace(/_/g, ' ')}
                    </span>

                    <button className="px-3 py-1.5 bg-white group-hover:bg-amber-500 group-hover:text-white text-slate-700 text-xs font-bold rounded-xl border border-slate-200 group-hover:border-amber-500 transition-colors shadow-xs">
                      View →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>



      {/* ── Separator ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-3 h-3" /> Monthly Overview
        </span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      {/* ── KPI Cards (monthly) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={DollarSign} label="Month Revenue" value={fmtCur(rev.value)} sub="vs last month" diff={rev.diff}
          borderColor="border-[#639922]" iconBg="bg-[#639922]/10" iconColor="text-[#639922]" />
        <KPICard icon={ShoppingBag} label="Month Orders" value={fmt(ord.value)} sub="non-cancelled" diff={ord.diff}
          borderColor="border-[#378ADD]" iconBg="bg-[#378ADD]/10" iconColor="text-[#378ADD]" />
        <KPICard icon={BarChart2} label="Avg Order Value" value={fmtCur(aovO.value)} sub="per transaction" diff={aovO.diff}
          borderColor="border-[#D8BFD8]" iconBg="bg-[#D8BFD8]/20" iconColor="text-[#ad83ad]" />
        <KPICard icon={Users} label="Total Orders" value={fmt(ord.value)} sub="all completed & active"
          borderColor="border-emerald-300" iconBg="bg-emerald-50" iconColor="text-emerald-600" />
      </div>

      {/* ── Revenue Chart + Funnel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 shadow-premium">
          <SH title="Revenue Trend (Last 6 Months)" sub="Monthly platform earnings" />
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D8BFD8" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#D8BFD8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => fmtK(v)} />
                <Tooltip content={<CT />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#c3a1c3" strokeWidth={2.5} fill="url(#rGrad)" dot={{ fill: '#c3a1c3', r: 3 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-premium">
          <SH title="Conversion Funnel" sub="All-time user journey" />
          <div className="space-y-3 mt-1">
            {funnelSteps.map((step, i) => {
              const max = funnelSteps[0].value || 1;
              const pct = Math.round((step.value / max) * 100);
              const colors = ['bg-violet-500', 'bg-brand-400', 'bg-brand-300', 'bg-emerald-400'];
              return (
                <div key={step.name}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-semibold text-slate-500">{step.name}</span>
                    <span className="text-[10px] font-bold text-[#3D2E3D]">{fmt(step.value)} {i > 0 ? `· ${pct}%` : ''}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${colors[i]}`} style={{ width: `${pct || 2}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Day Pattern + Cities ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-premium">
          <SH title="Revenue by Day of Week" sub="Selected week pattern" />
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayPattern} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => fmtK(v)} />
                <Tooltip content={<CT />} />
                <Bar dataKey="revenue" name="Revenue" fill="#c3a1c3" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-premium">
          <SH title="Top Cities by Orders" sub="All-time order count" />
          <div className="space-y-3">
            {cityData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No city data yet</p>
            ) : cityData.map((c) => {
              const max = cityData[0]?.orders || 1;
              const pct = Math.round((c.orders / max) * 100);
              return (
                <div key={c.city}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                      <MapPin className="w-3 h-3 text-brand-400" />{c.city}
                    </span>
                    <span className="text-[10px] font-bold text-[#3D2E3D]">{c.orders} orders</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Top Products + Stock Risk ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-premium">
          <SH title="Top Selling Products" sub="Units sold this month" />
          {topSelling.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {topSelling.map((p, i) => {
                const max = topSelling[0]?.unitsSold || 1;
                const pct = Math.round((p.unitsSold / max) * 100);
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="w-5 text-[10px] font-bold text-slate-300 shrink-0">#{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-semibold text-[#3D2E3D] truncate max-w-[200px]">{p.name}</span>
                        <span className="text-[10px] font-bold text-slate-500 shrink-0">{p.unitsSold} units · {p.stock} left</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-premium">
          <SH
            title="Stock Risk Alerts"
            sub="Products running low"
            action={<button onClick={() => setActiveTab?.('products')} className="text-[10px] font-bold text-brand-600 hover:underline">Manage →</button>}
          />
          {stockRisk.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <p className="text-xs font-semibold">All stock levels healthy</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stockRisk.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl bg-red-50 border border-red-100">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#3D2E3D] truncate">{p.name}</p>
                    <p className="text-[10px] text-red-500 font-semibold">{p.demand}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-sm font-extrabold text-red-600">{p.stock}</p>
                    <p className="text-[10px] text-slate-400">units left</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Seasonal Trend ── */}
      <div className="bg-white rounded-3xl p-6 shadow-premium">
        <SH title="Seasonal Revenue Trend" sub="This year vs last year by month" />
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={seasonalTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => fmtK(v)} />
              <Tooltip content={<CT />} />
              <Line type="monotone" dataKey="thisYear" name="This Year Revenue" stroke="#c3a1c3" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="lastYear" name="Last Year Revenue" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 mt-2">
          <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold"><span className="w-4 h-0.5 bg-[#c3a1c3] inline-block rounded" />This Year</span>
          <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold"><span className="w-4 h-0.5 bg-slate-300 inline-block rounded" />Last Year</span>
        </div>
      </div>

      {/* ── Categories + Recent Orders ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-premium">
          <SH title="Top Categories" sub="Revenue share by category" />
          {topCats.length > 0 ? (
            <>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={topCats} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value">
                      {topCats.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmtCur(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2">
                {topCats.slice(0, 4).map((c, i) => (
                  <div key={c.name} className="flex justify-between items-center text-[10px]">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      {c.name}
                    </span>
                    <span className="font-bold text-[#3D2E3D]">{fmtCur(c.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">No category data yet</p>
          )}
        </div>
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 shadow-premium">
          <SH
            title="Recent Orders"
            sub="Latest 8 transactions"
            action={<button onClick={() => setActiveTab?.('orders')} className="text-[10px] font-bold text-brand-600 hover:underline">View all →</button>}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-2 pr-3">Invoice</th>
                  <th className="pb-2 pr-3">Customer</th>
                  <th className="pb-2 pr-3">Amount</th>
                  <th className="pb-2 pr-3">Status</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {recentOrders.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-slate-400 text-xs">No orders yet</td></tr>
                )}
                {recentOrders.map(o => (
                  <tr 
                    key={o.id} 
                    onClick={() => setSelectedOrderModal(o)}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 pr-3 font-bold text-[#3D2E3D] group-hover:text-brand-700 transition-colors text-[11px]">{o.invoiceNumber}</td>
                    <td className="py-2.5 pr-3 text-slate-500 font-medium truncate max-w-[100px]">{o.customerName}</td>
                    <td className="py-2.5 pr-3 font-extrabold text-[#3D2E3D]">{fmtCur(o.payableAmount)}</td>
                    <td className="py-2.5 pr-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${STATUS_COLORS[o.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400 font-medium text-[10px]">
                      {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="bg-white rounded-3xl p-6 shadow-premium">
        <SH title="Quick Actions" sub="Jump to key sections" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'New Checkout', icon: ShoppingCart, tab: 'checkout', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
            { label: 'View Orders', icon: Package, tab: 'orders-bookings', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
            { label: 'Manage Products', icon: Star, tab: 'products', color: 'bg-violet-50 text-violet-700 hover:bg-violet-100' },
            { label: 'Analytics', icon: Activity, tab: 'reports', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
          ].map(a => (
            <button
              key={a.tab}
              onClick={() => setActiveTab?.(a.tab)}
              className={`flex items-center gap-2.5 p-4 rounded-2xl font-bold text-xs transition-all ${a.color}`}
            >
              <a.icon className="w-4 h-4" />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Order Details Dashboard Modal ── */}
      {selectedOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 space-y-6 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-[#3D2E3D]">{selectedOrderModal.invoiceNumber}</h3>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[selectedOrderModal.status] || 'bg-slate-100 text-slate-500'}`}>
                    {selectedOrderModal.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Ordered on {new Date(selectedOrderModal.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button 
                onClick={() => setSelectedOrderModal(null)}
                className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Address Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Details</p>
                <p className="text-sm font-bold text-[#3D2E3D]">{selectedOrderModal.customerName || selectedOrderModal.user?.fullName || 'Guest Customer'}</p>
                {selectedOrderModal.user?.phoneNumber && (
                  <p className="text-xs text-slate-500 font-medium">{selectedOrderModal.user.phoneNumber}</p>
                )}
                {selectedOrderModal.user?.email && (
                  <p className="text-xs text-slate-400 font-medium">{selectedOrderModal.user.email}</p>
                )}
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Promised Delivery Date</p>
                <p className="text-sm font-extrabold text-amber-700">
                  {selectedOrderModal.deliveryDate 
                    ? new Date(selectedOrderModal.deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Standard Processing'
                  }
                </p>
                <p className="text-xs text-slate-500 font-medium">Payment Mode: <strong className="text-slate-700 uppercase">{selectedOrderModal.paymentMethod || 'Online'}</strong></p>
              </div>
            </div>

            {/* Stage Progress Bar */}
            <div className="bg-brand-50/50 rounded-2xl p-4 border border-brand-100 space-y-3">
              <p className="text-[10px] font-bold text-brand-700 uppercase tracking-wider">Delivery Stage Pipeline</p>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 gap-1 overflow-x-auto pb-1">
                {['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((stage, idx) => {
                  const stageLabels = {
                    PENDING: 'Order Placed',
                    PAID: 'Measurement',
                    PROCESSING: 'Stitching',
                    SHIPPED: 'Completed',
                    OUT_FOR_DELIVERY: 'Out for Delivery',
                    DELIVERED: 'Delivered'
                  };
                  const happyPath = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
                  const currentIdx = happyPath.indexOf(selectedOrderModal.status);
                  const isDone = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={stage} className="flex flex-col items-center text-center min-w-[70px]">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${isCurrent ? 'bg-brand-600 text-[#3D2E3D] ring-4 ring-brand-200' : isDone ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        {isDone ? '✓' : idx + 1}
                      </div>
                      <span className={`text-[9px] mt-1 font-bold ${isCurrent ? 'text-brand-800' : isDone ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {stageLabels[stage]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Payable Amount</p>
                <p className="text-2xl font-black text-[#3D2E3D] mt-0.5">{fmtCur(selectedOrderModal.payableAmount)}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${selectedOrderModal.paymentStatus === 'PAID' || selectedOrderModal.paymentStatus === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  {selectedOrderModal.paymentStatus || 'PENDING'}
                </span>
              </div>
            </div>

            {/* Items List */}
            {selectedOrderModal.orderItems && selectedOrderModal.orderItems.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ordered Items</p>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {selectedOrderModal.orderItems.map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div>
                        <p className="font-bold text-[#3D2E3D]">{item.productName || item.product?.name || 'Custom Garment'}</p>
                        <p className="text-[10px] text-slate-400">Qty: {item.quantity || 1}</p>
                      </div>
                      <p className="font-extrabold text-[#3D2E3D]">{fmtCur(item.price * (item.quantity || 1))}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={() => setSelectedOrderModal(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  sessionStorage.setItem('admin_selected_order_id', selectedOrderModal.id);
                  setSelectedOrderModal(null);
                  setActiveTab?.('orders-bookings');
                }}
                className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-[#3D2E3D] text-xs font-extrabold shadow-sm transition-all"
              >
                Open in Order Manager →
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
