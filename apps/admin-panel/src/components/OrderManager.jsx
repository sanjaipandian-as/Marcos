import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  Printer, 
  Mail,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  X
} from 'lucide-react';
import api from '../utils/api';

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeShiftMenu, setActiveShiftMenu] = useState(null);

  const [packingSlip, setPackingSlip] = useState(null);
  const [isSlipOpen, setIsSlipOpen] = useState(false);

  const handleViewPackingSlip = async (orderId) => {
    try {
      const slip = await api.getPackingSlip(orderId);
      setPackingSlip({ ...slip, orderId });
      setIsSlipOpen(true);
    } catch (err) {
      alert(err.message || 'Failed to fetch packing slip.');
    }
  };

  const handleDispatchOrder = async () => {
    if (!packingSlip || !packingSlip.orderId) return;
    try {
      await handleUpdateStatus(packingSlip.orderId, 'SHIPPED');
      setIsSlipOpen(false);
      alert('Order successfully verified and marked as SHIPPED (Dispatched)!');
    } catch (err) {
      alert(err.message || 'Failed to update order status.');
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const list = await api.getOrders();
      setOrders(list);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.updateOrderStatus(id, status);
      loadOrders();
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder(prev => ({ ...prev, status }));
      }
    } catch (err) {
      alert(err.message || 'Status update failed.');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          order.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'DELIVERED':
      case 'PAID':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'PROCESSING':
      case 'SHIPPED':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-red-50 text-red-700 border-red-100';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Orders & Invoices</h2>
        <p className="text-xs text-slate-500 font-medium">Track customer orders, manage processing cycles, and inspect invoices</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center w-full">
        <div className="relative flex-1 max-w-md w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search invoice number, client name..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
          />
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto text-xs font-bold border border-slate-200 rounded-xl py-2 px-3 bg-white text-slate-650 focus:outline-none focus:border-brand-500 transition-colors"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-premium hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-6">Invoice No.</th>
                <th className="py-3 px-6">Customer Name</th>
                <th className="py-3 px-6">Sale Type</th>
                <th className="py-3 px-6">Payment Method</th>
                <th className="py-3 px-6">Payable</th>
                <th className="py-3 px-6">Order Status</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-bold">No orders found.</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/20 transition-colors">
                    <td className="py-4 px-6 font-extrabold text-slate-800">{order.invoiceNumber}</td>
                    <td className="py-4 px-6 text-slate-600 font-medium">{order.customerName}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${order.isOfflineSales ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'}`}>
                        {order.isOfflineSales ? 'Offline' : 'Online App'}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-500">{order.paymentMethod}</td>
                    <td className="py-4 px-6 font-extrabold text-slate-800">
                      ₹{Number(order.payableAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${getStatusStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors"
                          title="View Invoice Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <div className="relative">
                          <button 
                            onClick={() => setActiveShiftMenu(activeShiftMenu === order.id ? null : order.id)}
                            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 flex items-center gap-0.5"
                          >
                            <span className="text-[10px] font-bold">Shift</span>
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          
                          {activeShiftMenu === order.id && (
                            <>
                              <div className="fixed inset-0 z-20" onClick={() => setActiveShiftMenu(null)} />
                              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-1 space-y-1 z-35 w-28 animate-fadeIn">
                                {['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
                                  <button
                                    key={st}
                                    onClick={() => {
                                      handleUpdateStatus(order.id, st);
                                      setActiveShiftMenu(null);
                                    }}
                                    className={`w-full text-left px-2.5 py-1.5 text-[10px] font-bold rounded-lg transition-colors ${order.status === st ? 'bg-brand-55 text-brand-600 font-extrabold' : 'text-slate-600 hover:bg-slate-50'}`}
                                  >
                                    {st}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="md:hidden space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-bold bg-white border border-slate-200/60 rounded-3xl shadow-premium">
            No orders found.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white border border-slate-200/60 rounded-3xl p-4 space-y-3 shadow-sm hover:shadow transition-shadow">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-800 text-sm">{order.invoiceNumber}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${order.isOfflineSales ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'}`}>
                  {order.isOfflineSales ? 'Offline' : 'Online App'}
                </span>
              </div>
              <div className="text-xs space-y-1 text-slate-600">
                <p className="font-bold text-slate-800">{order.customerName}</p>
                <p className="font-medium text-slate-400">{order.paymentMethod}</p>
              </div>
              <div className="flex justify-between items-center border-t border-slate-50 pt-3">
                <div className="space-y-1">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${getStatusStyle(order.status)}`}>
                    {order.status}
                  </span>
                  <p className="font-extrabold text-slate-800 text-sm">
                    ₹{Number(order.payableAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <div className="relative">
                    <button 
                      onClick={() => setActiveShiftMenu(activeShiftMenu === order.id ? null : order.id)}
                      className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 flex items-center gap-0.5"
                    >
                      <span className="text-[10px] font-bold">Shift</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {activeShiftMenu === order.id && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setActiveShiftMenu(null)} />
                        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-1 space-y-1 z-35 w-28 animate-fadeIn">
                          {['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
                            <button
                              key={st}
                              onClick={() => {
                                handleUpdateStatus(order.id, st);
                                setActiveShiftMenu(null);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 text-[10px] font-bold rounded-lg transition-colors ${order.status === st ? 'bg-brand-55 text-brand-650 font-extrabold' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl p-6 relative flex flex-col max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-655 transition-colors focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex-1 space-y-6 pt-4">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-black text-slate-800 text-lg tracking-tight">MARCOS STUDIO</h3>
                  <p className="text-[10px] text-slate-400">Custom Luxury Tailoring & Apparel</p>
                </div>
                <div className="text-right">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${getStatusStyle(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                  <p className="text-[10px] text-slate-450 mt-1.5">{selectedOrder.invoiceNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Billed To</p>
                  <p className="font-bold text-slate-800 mt-1">{selectedOrder.customerName}</p>
                  <p className="text-slate-500">
                    {selectedOrder.isOfflineSales ? 'Walk-In Customer' : 'App Registered Client'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Details</p>
                  <p className="font-semibold text-slate-700 mt-1">{selectedOrder.paymentMethod} Payment</p>
                  <p className="text-slate-500">
                    {new Date(selectedOrder.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[9px] font-bold text-slate-400 uppercase">
                    <tr>
                      <th className="py-2 px-3">Product Item</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Price</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{item.productName}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-505">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">₹{Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-slate-800">
                          ₹{(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="w-1/2 ml-auto space-y-2 text-xs border-t border-slate-100 pt-3">
                 <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">₹{Number(selectedOrder.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Discount</span>
                  <span className="font-semibold text-red-500">-₹{Number(selectedOrder.discountAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Taxes (GST 18%)</span>
                  <span className="font-semibold text-slate-800">₹{Number(selectedOrder.taxAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-extrabold text-slate-800">
                  <span>Payable Amount</span>
                  <span>₹{Number(selectedOrder.payableAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4 flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-605 font-bold text-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
              <button
                onClick={() => handleViewPackingSlip(selectedOrder.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-605 font-bold text-xs"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Packing Slip</span>
              </button>
              <button
                onClick={() => alert('Mock Email Dispatched: Invoice Sent to Customer.')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-sm"
              >
                <Mail className="w-4 h-4" />
                <span>Email Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isSlipOpen && packingSlip && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6 relative flex flex-col">
            <button
              onClick={() => setIsSlipOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-655 transition-colors focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4 pt-2">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-800 text-base">Packing Checklist Slip</h3>
                <p className="text-xs text-slate-400 font-semibold">{packingSlip.invoiceNumber}</p>
              </div>

              <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
                {(packingSlip.packingItems || packingSlip.items || []).map((item, idx) => (
                  <label key={idx} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors cursor-pointer select-none">
                    <input type="checkbox" className="w-4 h-4 rounded text-brand-500 border-slate-300 focus:ring-brand-55" />
                    <div className="flex-1 text-xs">
                      <p className="font-bold text-slate-800">{item.name}</p>
                      {(item.sku || item.material) && (
                        <p className="text-[10px] text-slate-400 font-medium">
                          {item.sku ? `SKU: ${item.sku}` : `Material: ${item.material}`}
                        </p>
                      )}
                    </div>
                    <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-lg text-[10px]">
                      Qty: {item.qty ?? item.quantity}
                    </span>
                  </label>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-4 flex gap-2">
                <button
                  onClick={handleDispatchOrder}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all text-center"
                >
                  Verify & Ready for Dispatch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
