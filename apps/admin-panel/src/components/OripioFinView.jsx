import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  TrendingUp,
  Plus,
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  ArrowRight,
  Calendar as CalendarIcon,
  CreditCard,
  ArrowDownLeft,
  X,
  DollarSign
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import api from '../utils/api';
import { MockDB } from '../utils/mockData';

export default function OripioFinView({ setActiveTab }) {
  const [recentOrders, setRecentOrders] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [revenueStats, setRevenueStats] = useState({ totalRevenue: 0, orderCount: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [metrics, setMetrics] = useState([
    { id: 'm-1', code: 'Total Revenue', symbol: '₹', balance: 0, desc: 'Overall Platform Earnings', flag: '💰' },
    { id: 'm-2', code: 'Total Orders', symbol: '', balance: 0, desc: 'Successful Transactions', flag: '📦' },
    { id: 'm-3', code: 'Average Order Value', symbol: '₹', balance: 0, desc: 'Per Order Average', flag: '📈' },
  ]);

  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [selectedWalletIdx, setSelectedWalletIdx] = useState(0);
  const [activeCardMenu, setActiveCardMenu] = useState(null);

  const [cashFlowMode, setCashFlowMode] = useState('YEARLY');
  const [selectedMonth, setSelectedMonth] = useState('2026-06');
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);
  const [calendarYear, setCalendarYear] = useState(2026);
  const [cashFlowData, setCashFlowData] = useState({
    total: 342323.44,
    inflow: 48670.00,
    outflow: 7456.00
  });

  useEffect(() => {
    loadStats();
    loadWallets();
  }, []);

  function loadWallets() {
    // Legacy mock function - removed mock wallets
  }

  async function loadStats() {
    try {
      const report = await api.getDashboardReport();
      setRecentOrders(report.recentOrders);
      setChartData(report.revenueChart);
      setRevenueStats({
        totalRevenue: report.totalRevenue,
        orderCount: report.orderCount
      });
      setMetrics([
        { id: 'm-1', code: 'Total Revenue', symbol: '₹', balance: report.totalRevenue || 0, desc: 'Overall Platform Earnings', flag: '💰' },
        { id: 'm-2', code: 'Total Orders', symbol: '', balance: report.orderCount || 0, desc: 'Successful Transactions', flag: '📦' },
        { id: 'm-3', code: 'Average Order Value', symbol: '₹', balance: report.aov || 0, desc: 'Per Order Average', flag: '📈' },
      ]);
      setCashFlowData({
        total: report.totalRevenue || 0,
        inflow: report.totalRevenue || 0,
        outflow: 0
      });
    } catch (err) {
      console.error(err);
    }
  }

  const handleMonthChange = (monthKey) => {
    setSelectedMonth(monthKey);
    const ledger = MockDB.get('m_calendar_cashflow');

    const data = ledger[monthKey] || { total: 300000, inflow: 30000, outflow: 7000, list: [40000, 45000, 35000, 50000, 48000, 42000] };

    setCashFlowData({
      total: data.total,
      inflow: data.inflow,
      outflow: data.outflow
    });

    if (data.list) {
      const weeksLabel = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
      setChartData(data.list.map((val, idx) => ({
        month: weeksLabel[idx],
        revenue: val
      })));
    }
  };

  const handleAddMoneySubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(addAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const updated = wallets.map((w, idx) => {
      if (idx === selectedWalletIdx) {
        return { ...w, balance: w.balance + parsedAmount };
      }
      return w;
    });

    setWallets(updated);
    MockDB.set('m_wallets', updated);

    const logMsg = `Added ₹${parsedAmount.toLocaleString()} to ${wallets[selectedWalletIdx].code} wallet.`;
    MockDB.addAuditLog('WALLET_FUNDED', {
      message: logMsg,
      walletCode: wallets[selectedWalletIdx].code,
      amount: parsedAmount
    }, 'INFO');

    setShowAddMoney(false);
    setAddAmount('');
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 shadow-xl text-xs space-y-1.5 animate-fadeIn">
          <p className="font-semibold text-slate-400">Cash Flow Metrics</p>
          <div className="flex justify-between gap-4">
            <span>Amount:</span>
            <span className="font-bold text-brand-700">₹{payload[0].value.toLocaleString()}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const filteredOrders = recentOrders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#3D2E3D] tracking-tight">Marcos dashboard</h2>
          <p className="text-sm text-[#7A6B7A] font-medium font-sans">Real-time statistics, balance overview, and invoices</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Total Revenue Card - Green top accent */}
        <div className="relative bg-white rounded-3xl p-6 shadow-premium border-t-2 border-[#639922] hover:-translate-y-0.5 transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div className="flex gap-3 items-center">
              <div className="w-11 h-11 rounded-2xl bg-[#639922]/10 flex items-center justify-center text-[#639922]">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[#7A6B7A] font-medium tracking-wide leading-tight">Total revenue</p>
                <p className="text-[10px] text-[#7A6B7A] leading-none mt-1">Overall earnings</p>
              </div>
            </div>
          </div>

          <div className="my-6">
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold tracking-tight text-[#3D2E3D]">
                ₹{metrics[0].balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
              <span className="text-[10px] font-bold bg-green-50 text-[#639922] py-0.5 px-2 rounded-full flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +1.5%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#F0E5F0] pt-3">
            <span className="text-xs text-[#7A6B7A] font-medium">All successful payments</span>
            <button
              onClick={() => setActiveTab && setActiveTab('staff')}
              className="text-xs font-bold text-[#3D2E3D] hover:text-[#C4A4C4] flex items-center gap-1 focus:outline-none"
            >
              <span>View roster</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Total Orders Card - Blue top accent */}
        <div className="relative bg-white rounded-3xl p-6 shadow-premium border-t-2 border-[#378ADD] hover:-translate-y-0.5 transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div className="flex gap-3 items-center">
              <div className="w-11 h-11 rounded-2xl bg-[#378ADD]/10 flex items-center justify-center text-[#378ADD]">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[#7A6B7A] font-medium tracking-wide leading-tight">Total orders</p>
                <p className="text-[10px] text-[#7A6B7A] leading-none mt-1">Successful transactions</p>
              </div>
            </div>
          </div>

          <div className="my-6">
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-[#3D2E3D] tracking-tight">
                {metrics[1].balance.toLocaleString()}
              </h3>
              <span className="text-[10px] font-bold bg-blue-50 text-[#378ADD] py-0.5 px-2 rounded-full flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +3.2%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#F0E5F0] pt-3">
            <span className="text-xs text-[#7A6B7A] font-medium">All completed orders</span>
            <button
              onClick={() => setActiveTab && setActiveTab('loyalty')}
              className="text-xs font-bold text-[#3D2E3D] hover:text-[#C4A4C4] flex items-center gap-1 focus:outline-none"
            >
              <span>View reserve</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Average Order Value Card - Thistle top accent */}
        <div className="relative bg-white rounded-3xl p-6 shadow-premium border-t-2 border-[#D8BFD8] hover:-translate-y-0.5 transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div className="flex gap-3 items-center">
              <div className="w-11 h-11 rounded-2xl bg-[#D8BFD8]/20 flex items-center justify-center text-[#ad83ad]">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[#7A6B7A] font-medium tracking-wide leading-tight">Average order value</p>
                <p className="text-[10px] text-[#7A6B7A] leading-none mt-1">Per order average</p>
              </div>
            </div>
          </div>

          <div className="my-6">
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-[#3D2E3D] tracking-tight">
                ₹{metrics[2].balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
              <span className="text-[10px] font-bold bg-brand-50 text-[#ad83ad] py-0.5 px-2 rounded-full flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +4.7%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#F0E5F0] pt-3">
            <span className="text-xs text-[#7A6B7A] font-medium">Average purchase value</span>
            <button
              onClick={() => setActiveTab && setActiveTab('reports')}
              className="text-xs font-bold text-[#3D2E3D] hover:text-[#C4A4C4] flex items-center gap-1 focus:outline-none"
            >
              <span>View analysis</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        <div className="lg:col-span-5 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-[#3D2E3D] text-sm">Key performance metrics</h4>
              <p className="text-[10px] text-[#7A6B7A] font-semibold uppercase tracking-wider">Marcos platform</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {metrics.map((metric) => (
              <div
                key={metric.id}
                className="p-4 rounded-2xl border transition-all flex flex-col justify-between h-28 bg-[#F7F4F9]/30 border-[#F0E5F0]"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-[#3D2E3D]">{metric.flag} {metric.code}</span>
                </div>
                <div className="my-2">
                  <span className="text-base font-bold text-[#3D2E3D] tracking-tight">
                    {metric.symbol}{metric.balance.toLocaleString(undefined, { minimumFractionDigits: metric.symbol ? 2 : 0 })}
                  </span>
                </div>
                <span className="text-[9px] text-[#7A6B7A] font-medium">{metric.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium flex flex-col justify-between">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <span className="text-[10px] font-bold text-[#7A6B7A]/80 uppercase tracking-wider">Cash flow overview</span>
              <h4 className="text-2xl font-bold text-[#3D2E3D] tracking-tight">
                ₹{cashFlowData.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h4>
              <div className="flex gap-3 text-[10px] text-[#7A6B7A] font-bold mt-1">
                <span className="text-[#639922]">Inflow: +₹{cashFlowData.inflow.toLocaleString()}</span>
                <span className="text-[#E24B4A]">Outflow: -₹{cashFlowData.outflow.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex gap-1 p-1 bg-[#F7F4F9] rounded-xl shrink-0">
                <button
                  onClick={() => { setCashFlowMode('MONTHLY'); }}
                  className={`py-1 px-3 text-[10px] font-bold rounded-lg transition-all ${cashFlowMode === 'MONTHLY' ? 'bg-white text-[#3D2E3D] shadow-sm' : 'text-[#7A6B7A] hover:text-[#3D2E3D]'}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => { setCashFlowMode('YEARLY'); setChartData([]); loadStats(); }}
                  className={`py-1 px-3 text-[10px] font-bold rounded-lg transition-all ${cashFlowMode === 'YEARLY' ? 'bg-white text-[#3D2E3D] shadow-sm' : 'text-[#7A6B7A] hover:text-[#3D2E3D]'}`}
                >
                  Yearly
                </button>
              </div>

              {cashFlowMode === 'MONTHLY' && (
                <div className="relative shrink-0 z-30">
                  <button
                    onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
                    className="text-[10px] font-bold border border-[#F0E5F0] bg-white hover:bg-slate-50 py-1.5 px-3.5 rounded-xl shadow-sm focus:outline-none flex items-center gap-1.5 text-[#3D2E3D]"
                  >
                    <CalendarIcon className="w-3.5 h-3.5 text-[#7A6B7A]" />
                    <span>{(() => {
                      const [year, month] = selectedMonth.split('-');
                      const monthsName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      return `${monthsName[parseInt(month) - 1]} ${year}`;
                    })()}</span>
                  </button>

                  {showCalendarDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowCalendarDropdown(false)} />
                      <div className="absolute right-0 mt-2 bg-white border border-[#F0E5F0] rounded-2xl shadow-xl p-4 w-60 z-20 animate-fadeIn space-y-3">
                        <div className="flex justify-between items-center border-b border-[#F0E5F0] pb-2">
                          <button
                            type="button"
                            onClick={() => setCalendarYear(prev => prev - 1)}
                            className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 font-bold"
                          >
                            &lt;
                          </button>
                          <span className="font-extrabold text-[#3D2E3D] text-xs">{calendarYear}</span>
                          <button
                            type="button"
                            onClick={() => setCalendarYear(prev => prev + 1)}
                            className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 font-bold"
                          >
                            &gt;
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((monName, idx) => {
                            const monthVal = String(idx + 1).padStart(2, '0');
                            const key = `${calendarYear}-${monthVal}`;
                            const isActive = selectedMonth === key;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => {
                                  handleMonthChange(key);
                                  setShowCalendarDropdown(false);
                                }}
                                className={`
                                  py-2 text-[10px] font-bold rounded-xl text-center border transition-all
                                  ${isActive
                                    ? 'bg-brand-500 border-brand-500 text-[#3D2E3D] shadow-sm font-black'
                                    : 'border-[#F0E5F0] bg-[#F7F4F9]/50 text-[#7A6B7A] hover:bg-[#F0E5F0]/40 hover:text-[#3D2E3D]'}
                                `}
                              >
                                {monName}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="h-48 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                <Bar
                  dataKey="revenue"
                  fill="#c3a1c3"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 w-full">
          <h4 className="font-semibold text-[#3D2E3D] text-sm">Recent ledger activities</h4>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search activity..."
                className="w-full sm:w-auto pl-8 pr-4 py-1.5 text-xs rounded-xl bg-[#F7F4F9] border border-[#F0E5F0] focus:bg-white focus:outline-none text-[#3D2E3D] placeholder-[#7A6B7A]/60"
              />
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#7A6B7A]" />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto text-xs font-semibold border border-[#F0E5F0] rounded-xl py-1.5 px-3 bg-white text-[#3D2E3D] focus:outline-none"
            >
              <option value="ALL">All status</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#F0E5F0] text-[10px] font-bold text-[#7A6B7A] uppercase tracking-wider">
                <th className="py-3 px-4">Invoice ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Payment method</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0E5F0] text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-[#7A6B7A] font-medium">No activity matching criteria.</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-brand-50/20 transition-colors">
                    <td className="py-4 px-4 font-bold text-[#3D2E3D]">{order.invoiceNumber}</td>
                    <td className="py-4 px-4 text-[#7A6B7A] font-medium">{order.customerName}</td>
                    <td className="py-4 px-4 text-[#7A6B7A]/80 font-medium">
                      {new Date(order.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-4 font-semibold text-[#7A6B7A]">{order.paymentMethod}</td>
                    <td className="py-4 px-4 font-extrabold text-[#3D2E3D]">
                      ₹{Number(order.payableAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className={`
                        inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                        ${order.status === 'PAID' || order.status === 'DELIVERED'
                          ? 'bg-green-50 text-[#639922]'
                          : order.status === 'PENDING'
                            ? 'bg-blue-50 text-[#378ADD]'
                            : 'bg-red-50 text-[#E24B4A]'}
                      `}>
                        • {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="py-8 text-center text-[#7A6B7A] font-medium bg-[#F7F4F9]/30 rounded-2xl border border-[#F0E5F0]">
              No activity matching criteria.
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="bg-[#F7F4F9]/30 border border-[#F0E5F0] rounded-2xl p-4 space-y-3 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#3D2E3D]">{order.invoiceNumber}</span>
                  <span className={`
                    inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                    ${order.status === 'PAID' || order.status === 'DELIVERED'
                      ? 'bg-green-50 text-[#639922]'
                      : order.status === 'PENDING'
                        ? 'bg-blue-50 text-[#378ADD]'
                        : 'bg-red-50 text-[#E24B4A]'}
                  `}>
                    • {order.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <p className="text-[#7A6B7A] font-semibold">{order.customerName}</p>
                    <p className="text-[#7A6B7A]/80 font-medium">
                      {new Date(order.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#7A6B7A]">{order.paymentMethod}</p>
                    <p className="font-extrabold text-[#3D2E3D] text-sm">
                      ₹{Number(order.payableAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>

  );
}
