import React, { forwardRef } from 'react';

export interface InvoiceItem {
  id: string;
  name: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface CustomerLedgerInvoiceA4Props {
  invoiceNo: string;
  date: string;
  customer: {
    name: string;
    city: string;
    phone: string;
  };
  items: InvoiceItem[];
  todayTotal: number;
  prevBalance: number;
  totalAmount: number;
  grandTotal: number;
}

export const CustomerLedgerInvoiceA4 = forwardRef<HTMLDivElement, CustomerLedgerInvoiceA4Props>(
  ({ invoiceNo, date, customer, items, todayTotal, prevBalance, totalAmount, grandTotal }, ref) => {
    return (
      <div 
        ref={ref} 
        className="bg-white text-black p-8 max-w-[210mm] mx-auto font-sans text-sm leading-normal print:p-6 print:m-0 print:w-full print:max-w-none"
        style={{ minHeight: '297mm', boxSizing: 'border-box' }}
      >
        {/* Style tag for print layout */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background-color: white !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}} />

        {/* 1. HEADER DESIGN */}
        <div className="text-center mb-6 border-b-2 border-black pb-4">
          <div className="tracking-widest font-black text-xs uppercase text-slate-600 mb-1">
            INVOICE
          </div>
          <h1 className="text-3xl font-black tracking-tight text-black uppercase mb-1">
            M.A BAKERS
          </h1>
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            RAHEEL MUSHTAQ SIDDIQUE
          </div>
          <div className="text-xs font-semibold text-slate-700 mt-1 flex justify-center gap-6">
            <span>PHONE: 0309-3660360</span>
            <span>PHONE: 0329-7040402</span>
          </div>
        </div>

        {/* 2. CUSTOMER INFO BOX - with border */}
        <div className="border-2 border-black p-4 rounded-md mb-6 bg-slate-50/50">
          <div className="grid grid-cols-2 gap-y-2 text-xs">
            <div className="flex">
              <span className="font-bold w-36 uppercase text-slate-600">Invoice No:</span>
              <span className="font-mono font-black text-black">{invoiceNo}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-24 uppercase text-slate-600">Date:</span>
              <span className="font-semibold text-black">{date}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-36 uppercase text-slate-600">Customer Name:</span>
              <span className="font-bold text-black uppercase">{customer.name || 'N/A'}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-24 uppercase text-slate-600">City:</span>
              <span className="font-semibold text-black uppercase">{customer.city || 'N/A'}</span>
            </div>
            <div className="flex col-span-2">
              <span className="font-bold w-36 uppercase text-slate-600">Customer Contact No:</span>
              <span className="font-mono font-semibold text-black">{customer.phone || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* 3. ITEMS TABLE - with border */}
        <div className="border-2 border-black rounded-md overflow-hidden mb-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-200 border-b-2 border-black text-xs font-black uppercase text-black">
                <th className="p-2.5 border-r-2 border-black w-12 text-center">Sr.</th>
                <th className="p-2.5 border-r-2 border-black">Particulars</th>
                <th className="p-2.5 border-r-2 border-black w-24 text-right">Qty</th>
                <th className="p-2.5 border-r-2 border-black w-28 text-right">Rate</th>
                <th className="p-2.5 w-32 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y border-black text-xs">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                    No items added to this invoice.
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-slate-50">
                    <td className="p-2 border-r-2 border-black text-center font-mono text-slate-500">
                      {index + 1}
                    </td>
                    <td className="p-2 border-r-2 border-black font-semibold text-black">
                      {item.name}
                    </td>
                    <td className="p-2 border-r-2 border-black text-right font-mono font-bold">
                      {item.qty}
                    </td>
                    <td className="p-2 border-r-2 border-black text-right font-mono">
                      {item.rate.toLocaleString()}
                    </td>
                    <td className="p-2 text-right font-mono font-black text-black">
                      {item.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}

              {/* Pad empty rows if fewer than 5 items to make A4 look balanced */}
              {items.length > 0 && items.length < 5 && Array.from({ length: 5 - items.length }).map((_, i) => (
                <tr key={`empty-${i}`} className="opacity-40">
                  <td className="p-2 border-r-2 border-black text-center font-mono">&nbsp;</td>
                  <td className="p-2 border-r-2 border-black">&nbsp;</td>
                  <td className="p-2 border-r-2 border-black text-right">&nbsp;</td>
                  <td className="p-2 border-r-2 border-black text-right">&nbsp;</td>
                  <td className="p-2 text-right">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. SUMMARY BOX - Bold, Right Aligned */}
        <div className="flex justify-end mb-10">
          <div className="w-80 border-2 border-black rounded-md p-3 bg-slate-50 space-y-1.5 text-xs">
            <div className="flex justify-between items-center py-0.5">
              <span className="font-bold text-slate-700 uppercase">Current Invoice:</span>
              <span className="font-mono font-bold text-black">
                PKR {todayTotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-slate-300 pb-1.5">
              <span className="font-bold text-slate-700 uppercase">Previous Remaining Balance:</span>
              <span className={`font-mono font-bold ${prevBalance > 0 ? 'text-rose-700' : 'text-slate-800'}`}>
                PKR {prevBalance.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="font-bold text-slate-800 uppercase">Total Invoice Amount:</span>
              <span className="font-mono font-black text-black text-sm">
                PKR {totalAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t-2 border-black">
              <span className="font-black text-black text-sm uppercase">Grand Total:</span>
              <span className="font-mono font-black text-black text-base underline decoration-double">
                PKR {grandTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* 5. FOOTER */}
        <div className="mt-auto pt-6 border-t border-slate-300">
          {/* Center: Payment Term & Conditions */}
          <div className="text-center mb-8">
            <div className="text-xs font-black uppercase tracking-wider text-slate-800">
              Payment Term & Conditions
            </div>
            <div className="text-xs font-bold text-rose-700 mt-1 uppercase tracking-wide">
              Kindly clear your Invoice DAILY BASIS
            </div>
          </div>

          {/* Signatures Left & Right */}
          <div className="flex justify-between items-end px-4 mb-8 text-xs font-bold text-black">
            <div className="text-left">
              <div className="w-52 border-b-2 border-black mb-1.5"></div>
              <span>Checked & Approved By</span>
            </div>
            <div className="text-right">
              <div className="w-52 border-b-2 border-black mb-1.5 ml-auto"></div>
              <span>Customer Signature: ___________</span>
            </div>
          </div>

          {/* Center Bottom Addresses */}
          <div className="text-center border-t border-black pt-3 text-[10px] text-slate-600 space-y-0.5">
            <div className="font-medium">
              <span className="font-bold text-black">Address:</span> Main Factory Gate, M.A Bakers, Narowal Road
            </div>
            <div className="font-semibold text-black tracking-tight">
              Website: Mabakers.com.pk | Frosto.com.pk | FB | Insta
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CustomerLedgerInvoiceA4.displayName = 'CustomerLedgerInvoiceA4';
