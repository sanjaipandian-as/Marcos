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
  
  const [wallets, setWallets] = useState([
    { id: 'w-1', code: 'INR Main', symbol: '₹', balance: 250520.00, limit: 'Limit is ₹50k a month', status: 'Active', flag: '🇮🇳' },
    { id: 'w-2', code: 'INR Savings', symbol: '₹', balance: 158004.00, limit: 'Limit is ₹10k a month', status: 'Active', flag: '🇮🇳' },
    { id: 'w-3', code: 'INR Investment', symbol: '₹', balance: 501207.00, limit: 'Limit is ₹20k a month', status: 'Active', flag: '🇮🇳' },
    { id: 'w-4', code: 'INR Rewards', symbol: '₹', balance: 15000.00, limit: 'Limit is ₹5k a month', status: 'Inactive', flag: '🇮🇳' },
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
    const list = MockDB.get('m_wallets');
    if (list && list.length > 0) {
      setWallets(list);
    }
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
            <span className="font-bold text-emerald-400">₹{payload[0].value.toLocaleString()}</span>
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
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">MARCOS Dashboard</h2>
          <p className="text-sm text-slate-500 font-medium font-sans">Real-time statistics, balance overview, and invoices</p>
        </div>
        
        <button
          onClick={() => setShowAddMoney(true)}
          className="self-start sm:self-auto flex items-center gap-1.5 py-2 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold shadow-premium shadow-brand-500/10 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Add Money</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="relative bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-3xl p-6 shadow-2xl hover:-translate-y-1 transition-all duration-300 group ring-1 ring-emerald-500/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.15),transparent_60%)] rounded-3xl pointer-events-none" />
          <div className="flex justify-between items-start z-20 relative">
            <div className="flex gap-3 items-center">
              <div className="w-11 h-11 rounded-2xl bg-emerald-800/40 border border-emerald-700/50 flex items-center justify-center text-emerald-300">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-emerald-300 font-bold tracking-wide leading-tight">My Balance</p>
                <p className="text-[10px] text-emerald-400/80 leading-none">Main Operations Wallet</p>
              </div>
            </div>
            <div className="relative">
              <button 
                onClick={() => setActiveCardMenu(activeCardMenu === 'balance' ? null : 'balance')}
                className="text-emerald-400 hover:text-white p-1 hover:bg-emerald-800/30 rounded-lg transition-colors"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {activeCardMenu === 'balance' && (
                <div className="absolute right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1 w-36 z-30 text-xs text-slate-300 animate-fadeIn">
                  <button onClick={() => { setShowAddMoney(true); setSelectedWalletIdx(0); setActiveCardMenu(null); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-800">Add Funds</button>
                  <button onClick={() => alert('Exporting statements...')} className="w-full text-left px-3 py-1.5 hover:bg-slate-800">Statement</button>
                  <button onClick={() => setActiveCardMenu(null)} className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-red-400">Lock Card</button>
                </div>
              )}
            </div>
          </div>

          <div className="my-6 z-10 relative">
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black tracking-tight text-white">
                ₹{wallets[0].balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 py-0.5 px-2 rounded-full flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +1.5%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-emerald-800/80 pt-3 z-10 relative">
            <span className="text-xs text-emerald-300/80 font-medium">Quick Limit: ₹50,000/mo</span>
            <button 
              onClick={() => setActiveTab && setActiveTab('staff')}
              className="text-xs font-bold text-emerald-300 hover:text-white flex items-center gap-1 focus:outline-none"
            >
              <span>View Roster</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-white via-slate-50 to-emerald-50/20 border border-slate-200/80 rounded-3xl p-6 shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.05),transparent_60%)] rounded-3xl pointer-events-none" />
          <div className="flex justify-between items-start z-20 relative">
            <div className="flex gap-3 items-center">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold tracking-wide leading-tight">Savings Account</p>
                <p className="text-[10px] text-slate-400 leading-none font-medium">Steady Growth Reserve</p>
              </div>
            </div>
            <div className="relative">
              <button 
                onClick={() => setActiveCardMenu(activeCardMenu === 'savings' ? null : 'savings')}
                className="text-slate-400 hover:text-slate-700 p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {activeCardMenu === 'savings' && (
                <div className="absolute right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl py-1 w-36 z-30 text-xs text-slate-650 animate-fadeIn">
                  <button onClick={() => { setShowAddMoney(true); setSelectedWalletIdx(1); setActiveCardMenu(null); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-550">Transfer In</button>
                  <button onClick={() => alert('Exporting savings statement...')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50">Statement</button>
                  <button onClick={() => setActiveCardMenu(null)} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-red-500">Deactivate</button>
                </div>
              )}
            </div>
          </div>

          <div className="my-6 z-10 relative">
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                ₹{wallets[1].balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 py-0.5 px-2 rounded-full flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +3.2%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3 z-10 relative">
            <span className="text-xs text-slate-400 font-medium">Interest Yield: 6.5% p.a.</span>
            <button 
              onClick={() => setActiveTab && setActiveTab('loyalty')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 focus:outline-none"
            >
              <span>View Reserve</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-white via-slate-50 to-blue-50/20 border border-slate-200/80 rounded-3xl p-6 shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.05),transparent_60%)] rounded-3xl pointer-events-none" />
          <div className="flex justify-between items-start z-20 relative">
            <div className="flex gap-3 items-center">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold tracking-wide leading-tight">Investment Portfolio</p>
                <p className="text-[10px] text-slate-400 leading-none font-medium">Wealth & Asset Growths</p>
              </div>
            </div>
            <div className="relative">
              <button 
                onClick={() => setActiveCardMenu(activeCardMenu === 'portfolio' ? null : 'portfolio')}
                className="text-slate-400 hover:text-slate-700 p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {activeCardMenu === 'portfolio' && (
                <div className="absolute right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl py-1 w-36 z-30 text-xs text-slate-655 animate-fadeIn">
                  <button onClick={() => { setShowAddMoney(true); setSelectedWalletIdx(2); setActiveCardMenu(null); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-50">Invest More</button>
                  <button onClick={() => alert('Viewing portfolio breakdown...')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50">Analyze</button>
                  <button onClick={() => setActiveCardMenu(null)} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-red-500">Deactivate</button>
                </div>
              )}
            </div>
          </div>

          <div className="my-6 z-10 relative">
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                ₹{wallets[2].balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
              <span className="text-[10px] font-bold bg-blue-50 text-blue-600 py-0.5 px-2 rounded-full flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +4.7%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3 z-10 relative">
            <span className="text-xs text-slate-400 font-medium">Bespoke Design Capital</span>
            <button 
              onClick={() => setActiveTab && setActiveTab('reports')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 focus:outline-none"
            >
              <span>View Analysis</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-5 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-bold text-slate-850 text-sm">Currency Wallets</h4>
              <p className="text-[10px] text-slate-450 font-semibold uppercase tracking-wider">MARCOS Ledger</p>
            </div>
            
            <button 
              onClick={() => setShowAddMoney(true)}
              className="flex items-center gap-1 text-[10px] font-bold text-slate-700 hover:bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-xl shadow-sm focus:outline-none"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Funds</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {wallets.map((wallet, idx) => (
              <div 
                key={wallet.id} 
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between h-28 hover:shadow-md cursor-pointer ${wallet.status === 'Active' ? 'bg-slate-50/50 border-slate-200/50' : 'bg-slate-50/10 border-slate-100/50 opacity-60'}`}
                onClick={() => { setSelectedWalletIdx(idx); setShowAddMoney(true); }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-800">{wallet.flag} {wallet.code}</span>
                  <span className={`text-[9px] font-bold bg-white border border-slate-200 text-slate-500 py-0.5 px-2 rounded-full`}>
                    {wallet.status}
                  </span>
                </div>
                <div className="my-2">
                  <span className="text-base font-extrabold text-slate-800 tracking-tight">
                    ₹{wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 font-semibold">{wallet.limit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium flex flex-col justify-between">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cash Flow Overview</span>
              <h4 className="text-2xl font-black text-slate-800 tracking-tight">
                ₹{cashFlowData.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h4>
              <div className="flex gap-3 text-[10px] text-slate-550 font-bold mt-1">
                <span className="text-emerald-600">Inflow: +₹{cashFlowData.inflow.toLocaleString()}</span>
                <span className="text-red-500">Outflow: -₹{cashFlowData.outflow.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
                <button 
                  onClick={() => { setCashFlowMode('MONTHLY'); }} 
                  className={`py-1 px-3 text-[10px] font-bold rounded-lg transition-all ${cashFlowMode === 'MONTHLY' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-455 hover:text-slate-800'}`}
                >
                  Monthly
                </button>
                <button 
                  onClick={() => { setCashFlowMode('YEARLY'); setChartData([]); loadStats(); }} 
                  className={`py-1 px-3 text-[10px] font-bold rounded-lg transition-all ${cashFlowMode === 'YEARLY' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-455 hover:text-slate-800'}`}
                >
                  Yearly
                </button>
              </div>

              {cashFlowMode === 'MONTHLY' && (
                <div className="relative shrink-0 z-30">
                  <button
                    onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
                    className="text-[10px] font-bold border border-slate-250 bg-white hover:bg-slate-50 py-1.5 px-3.5 rounded-xl shadow-sm focus:outline-none flex items-center gap-1.5"
                  >
                    <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>{(() => {
                      const [year, month] = selectedMonth.split('-');
                      const monthsName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      return `${monthsName[parseInt(month) - 1]} ${year}`;
                    })()}</span>
                  </button>

                  {showCalendarDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowCalendarDropdown(false)} />
                      <div className="absolute right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 w-60 z-20 animate-fadeIn space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <button 
                            type="button" 
                            onClick={() => setCalendarYear(prev => prev - 1)}
                            className="p-1 hover:bg-slate-105 rounded-lg text-slate-500 font-bold"
                          >
                            &lt;
                          </button>
                          <span className="font-extrabold text-slate-800 text-xs">{calendarYear}</span>
                          <button 
                            type="button" 
                            onClick={() => setCalendarYear(prev => prev + 1)}
                            className="p-1 hover:bg-slate-105 rounded-lg text-slate-500 font-bold"
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
                                    ? 'bg-brand-500 border-brand-500 text-white shadow-sm font-black' 
                                    : 'border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-slate-100 hover:text-slate-800'}
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
                  fill="#064e3b" 
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
          <h4 className="font-bold text-slate-800 text-sm">Recent Ledger Activities</h4>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search activity..."
                className="w-full sm:w-auto pl-8 pr-4 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200/80 focus:bg-white focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto text-xs font-bold border border-slate-200 rounded-xl py-1.5 px-3 bg-white text-slate-650 focus:outline-none"
            >
              <option value="ALL">All Status</option>
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
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Invoice ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">No activity matching criteria.</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-800">{order.invoiceNumber}</td>
                    <td className="py-4 px-4 text-slate-600 font-medium">{order.customerName}</td>
                    <td className="py-4 px-4 text-slate-400 font-medium">
                      {new Date(order.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-500">{order.paymentMethod}</td>
                    <td className="py-4 px-4 font-extrabold text-slate-800">
                      ₹{Number(order.payableAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className={`
                        inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                        ${order.status === 'PAID' || order.status === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-700' 
                          : order.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'}
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
            <div className="py-8 text-center text-slate-400 font-medium bg-slate-50/50 rounded-2xl border border-slate-100">
              No activity matching criteria.
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">{order.invoiceNumber}</span>
                  <span className={`
                    inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                    ${order.status === 'PAID' || order.status === 'DELIVERED'
                      ? 'bg-emerald-50 text-emerald-700' 
                      : order.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-red-50 text-red-700'}
                  `}>
                    • {order.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <p className="text-slate-600 font-semibold">{order.customerName}</p>
                    <p className="text-slate-400 font-medium">
                      {new Date(order.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-500">{order.paymentMethod}</p>
                    <p className="font-extrabold text-slate-800 text-sm">
                      ₹{Number(order.payableAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showAddMoney && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-scaleUp">
            <button
              onClick={() => setShowAddMoney(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-extrabold text-slate-850 text-base pb-2 border-b border-slate-100">
              Add Money to Wallet
            </h3>

            <form onSubmit={handleAddMoneySubmit} className="space-y-4 pt-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Target Wallet</label>
                <select
                  value={selectedWalletIdx}
                  onChange={e => setSelectedWalletIdx(Number(e.target.value))}
                  className="w-full text-xs font-bold border border-slate-200 rounded-xl py-2 px-3 bg-white focus:outline-none"
                >
                  {wallets.map((w, idx) => (
                    <option key={w.id} value={idx}>{w.flag} {w.code} (Bal: ₹{w.balance.toLocaleString()})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Amount to Add (INR ₹)</label>
                <input
                  type="number"
                  value={addAmount}
                  onChange={e => setAddAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full text-sm font-bold border border-slate-200 rounded-xl py-2.5 px-4 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs shadow-md transition-all"
              >
                Process Transaction
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
