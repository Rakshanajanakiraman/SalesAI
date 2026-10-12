import React, { useState, useEffect } from 'react';
import {
  FileText, Search, Printer, Eye, X, CheckCircle2,
  Calendar, User, Download, ArrowRight
} from 'lucide-react';
import api from '../services/api';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Invoice modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/invoices/', { params: { limit: 50 } });
      setInvoices(res.data.invoices || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Fetch invoices error:", err);
    } finally {
      setLoading(false);
    }
  };

  const viewInvoice = async (invoiceId) => {
    setLoadingDetail(true);
    setModalOpen(true);
    try {
      const res = await api.get(`/invoices/${invoiceId}`);
      setSelectedInvoice(res.data);
    } catch (err) {
      console.error("View invoice error:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const q = search.toLowerCase();
    return inv.invoice_number.toLowerCase().includes(q) ||
           (inv.customer_name && inv.customer_name.toLowerCase().includes(q)) ||
           (inv.sale_number && inv.sale_number.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-white">
            Invoices & Tax Billing Records
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {total} generated GST-compliant retail tax invoices and counter receipts.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-3.5 rounded-2xl">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number, customer name..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading billing invoices...</span>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No invoices found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 pl-6">Invoice #</th>
                  <th className="py-3.5">Customer Name</th>
                  <th className="py-3.5">Sale Reference</th>
                  <th className="py-3.5 text-right">Taxable Subtotal</th>
                  <th className="py-3.5 text-right">GST Amount</th>
                  <th className="py-3.5 text-right">Total Amount</th>
                  <th className="py-3.5 text-center">Status</th>
                  <th className="py-3.5 pr-6 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 pl-6 font-mono font-bold text-white">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3.5 text-slate-200 font-medium">
                      <div>
                        <span>{inv.customer_name}</span>
                        {inv.customer_phone && (
                          <span className="block text-[10px] text-slate-500">{inv.customer_phone}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-400 font-mono text-[11px]">
                      {inv.sale_number}
                    </td>
                    <td className="py-3.5 text-right text-slate-400 font-mono">
                      ₹{inv.subtotal.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 text-right text-slate-400 font-mono">
                      ₹{inv.tax_amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 text-right font-mono font-bold text-white text-sm">
                      ₹{inv.total_amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 pr-6 text-right">
                      <button
                        onClick={() => viewInvoice(inv.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center space-x-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Details & Printable Receipt Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl relative text-xs max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {loadingDetail || !selectedInvoice ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading invoice breakdown...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Invoice Header */}
                <div className="border-b border-slate-800 pb-5 flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold font-['Outfit'] text-white">
                      TAX INVOICE
                    </h2>
                    <span className="text-xs text-brand-400 font-mono font-bold block mt-0.5">
                      {selectedInvoice.invoice_number}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      Issued: {new Date(selectedInvoice.issued_at).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {selectedInvoice.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Customer & Merchant Meta */}
                <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Billed To</span>
                    <div className="text-sm font-bold text-white mt-1">
                      {selectedInvoice.customer?.name || "Retail Buyer"}
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      {selectedInvoice.customer?.phone}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      {selectedInvoice.customer?.city || "India"}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Merchant</span>
                    <div className="text-sm font-bold text-white mt-1">
                      MarketMind Retail India
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      GSTIN: 29ABCDE1234F1Z5
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      State Code: 29 (Karnataka)
                    </div>
                  </div>
                </div>

                {/* Items Breakdown Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                        <th className="pb-2">Item Description</th>
                        <th className="pb-2 text-center">Qty</th>
                        <th className="pb-2 text-right">Unit Price</th>
                        <th className="pb-2 text-center">GST %</th>
                        <th className="pb-2 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {selectedInvoice.items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/20">
                          <td className="py-2.5 font-medium text-white">
                            <div>
                              <span>{item.product_name}</span>
                              <span className="block text-[10px] font-mono text-slate-500">{item.sku}</span>
                            </div>
                          </td>
                          <td className="py-2.5 text-center text-slate-300">{item.quantity}</td>
                          <td className="py-2.5 text-right text-slate-300 font-mono">₹{item.unit_price}</td>
                          <td className="py-2.5 text-center text-slate-400">{item.tax_percent}%</td>
                          <td className="py-2.5 text-right font-mono font-bold text-white">₹{item.line_total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <div className="w-64 space-y-1.5">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal Excl. Tax:</span>
                      <span className="font-mono">₹{selectedInvoice.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Total GST (CGST+SGST):</span>
                      <span className="font-mono">₹{selectedInvoice.tax_amount.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white">
                      <span>Grand Total:</span>
                      <span className="font-mono text-brand-400 text-base">₹{selectedInvoice.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="pt-4 flex justify-end space-x-3">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center space-x-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Tax Receipt</span>
                  </button>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="gradient-btn px-5 py-2.5 rounded-xl text-white font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
