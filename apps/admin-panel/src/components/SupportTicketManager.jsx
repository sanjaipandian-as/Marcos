import React, { useState, useEffect } from 'react';
import { 
  LifeBuoy, 
  Search, 
  Send, 
  User, 
  CheckCircle,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import api from '../utils/api';

export default function SupportTicketManager() {
  const [tickets, setTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState('');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const list = await api.getSupportTickets();
      setTickets(list);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectTicket = async (ticket) => {
    setTicketDetails(ticket);
    setSelectedTicketId(ticket.id);
    try {
      const msgs = await api.getTicketMessages(ticket.id);
      setMessages(msgs);
    } catch (err) {
      console.error(err);
      setMessages([]);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const updated = await api.updateTicketStatus(id, status);
      loadTickets();
      if (selectedTicketId === id) {
        setTicketDetails(updated);
      }
    } catch (err) {
      alert('Failed to update ticket status.');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    try {
      await api.sendTicketMessage(selectedTicketId, chatMessage.trim());
      setChatMessage('');
      const msgs = await api.getTicketMessages(selectedTicketId);
      setMessages(msgs);
      loadTickets();
    } catch (err) {
      alert('Failed to send message.');
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Support Desk</h2>
        <p className="text-sm text-slate-500 font-medium">Resolve customer support inquiries and send real-time responses</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <div className="lg:col-span-5 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium space-y-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search subject, client..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <Search className="w-4.5 h-4.5 absolute left-3 top-3 text-slate-400" />
          </div>

          <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto pr-1">
            {filteredTickets.length === 0 ? (
              <p className="text-sm text-center text-slate-400 py-12 font-semibold">No support requests logged</p>
            ) : (
              filteredTickets.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTicket(t)}
                  className={`
                    w-full text-left p-4 rounded-2xl flex flex-col gap-2 transition-all focus:outline-none border my-1
                    ${selectedTicketId === t.id 
                      ? 'bg-brand-50/30 border-brand-200' 
                      : 'hover:bg-slate-50 border-transparent'}
                  `}
                >
                  <div className="flex justify-between items-start w-full gap-2">
                    <span className="text-sm font-extrabold text-slate-800 line-clamp-1 flex-1">{t.subject}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border shrink-0 ${getStatusColor(t.status)}`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400 font-bold w-full pt-1">
                    <span>From: {t.userName}</span>
                    <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-7">
          {!selectedTicketId ? (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-20 text-center text-slate-450 shadow-premium font-extrabold text-sm">
              Please select a support ticket from the list to initiate resolution chat threads.
            </div>
          ) : (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium h-[600px] flex flex-col justify-between">
              
              <div className="border-b border-slate-150 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-extrabold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm line-clamp-1 leading-snug">{ticketDetails.subject}</h4>
                    <p className="text-xs text-slate-450">Opened by: <span className="font-bold text-slate-600">{ticketDetails.userName}</span></p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  {['OPEN', 'IN_PROGRESS', 'RESOLVED'].map(st => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(ticketDetails.id, st)}
                      className={`
                        py-1 px-2.5 text-[10px] font-extrabold rounded-lg border transition-all focus:outline-none
                        ${ticketDetails.status === st 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'}
                      `}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 text-sm text-slate-655 leading-relaxed">
                  <p className="font-extrabold text-slate-750 pb-1.5 flex items-center gap-1.5">
                    <AlertCircle className="w-4.5 h-4.5 text-brand-500" />
                    <span>Inquiry Description:</span>
                  </p>
                  <p className="italic font-medium">"{ticketDetails.description}"</p>
                </div>

                {messages.map(msg => {
                  const isAdmin = msg.sender === 'ADMIN';
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col max-w-[85%] ${isAdmin ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">{msg.senderName}</span>
                      <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isAdmin 
                          ? 'bg-slate-900 text-white rounded-tr-none' 
                          : 'bg-emerald-50/80 text-emerald-950 rounded-tl-none border border-emerald-100/50'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold mt-1 px-1">
                        {new Date(msg.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSendMessage} className="border-t border-slate-100 pt-4 flex gap-2 shrink-0">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  placeholder="Type message response details..."
                  className="flex-1 text-sm border border-slate-205 rounded-xl py-2.5 px-4 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  required
                />
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 focus:outline-none shrink-0 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send Response</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
