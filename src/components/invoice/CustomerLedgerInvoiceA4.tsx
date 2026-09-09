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

// Inline SVG Logo
const MABakersLogo = () => (
  <svg width="70" height="70" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 5 L90 25 L90 65 L50 95 L10 65 L10 25 Z" stroke="#1e3a6e" strokeWidth="4" fill="none" />
    <path d="M50 14 L78 28 L78 62 L50 80 L22 62 L22 28 Z" stroke="#1e3a6e" strokeWidth="2.5" fill="none" />
    <text x="50" y="58" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="26" fontWeight="900" fill="#1e3a6e">MA</text>
  </svg>
);

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline', marginRight: '6px', flexShrink: 0, marginTop: '1px' }}>
    <circle cx="12" cy="12" r="10" stroke="#1e3a6e" strokeWidth="2" fill="none" />
    <path d="M7 12.5L10.5 16L17 9" stroke="#1e3a6e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CustomerLedgerInvoiceA4 = forwardRef<HTMLDivElement, CustomerLedgerInvoiceA4Props>(
  ({ invoiceNo, date, customer, items, todayTotal, prevBalance, totalAmount, grandTotal }, ref) => {
    const MIN_ROWS = 6;
    const emptyRowCount = Math.max(0, MIN_ROWS - items.length);

    const cellStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
      padding: '7px 9px',
      borderRight: '1px solid #d0dff0',
      borderBottom: '1px solid #d0dff0',
      fontSize: '11px',
      ...extra,
    });

    return (
      <div
        ref={ref}
        className="invoice-print-root"
        style={{
          width: '210mm',
          minHeight: '297mm',
          backgroundColor: '#ffffff',
          color: '#000000',
          fontFamily: "'Segoe UI', Arial, Helvetica, sans-serif",
          fontSize: '12px',
          lineHeight: '1.4',
          boxSizing: 'border-box',
          padding: '8mm 10mm',
          margin: '0 auto',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <style dangerouslySetInnerHTML={{
          __html: `
          @media print {
            @page { size: A4 portrait; margin: 0; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; margin: 0 !important; }
            .invoice-print-root { padding: 8mm 10mm !important; margin: 0 !important; }
            .no-print { display: none !important; }
          }
        `}} />

        {/* ===== HEADER ===== */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '3mm', borderBottom: '2.5px solid #1e3a6e', marginBottom: '4mm' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MABakersLogo />
            <div>
              <div style={{ fontSize: '30px', fontWeight: '900', color: '#1e3a6e', letterSpacing: '-0.5px', lineHeight: '1.1' }}>MA BAKERS</div>
              <div style={{ fontSize: '9.5px', fontWeight: '700', color: '#1e3a6e', letterSpacing: '2.5px', textTransform: 'uppercase', marginTop: '3px' }}>PREMIUM BAKERY &amp; CAFE</div>
              <div style={{ fontSize: '9px', fontWeight: '600', color: '#4a6a9e', letterSpacing: '2px', marginTop: '4px' }}>FRESH &nbsp;&nbsp;|&nbsp;&nbsp; QUALITY &nbsp;&nbsp;|&nbsp;&nbsp; TRUST</div>
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: '10px', color: '#1e3a6e' }}>
            <div style={{ fontSize: '8.5px', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '5px', color: '#1e3a6e' }}>
              BAKING HAPPINESS<br />SINCE 1998
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end', marginBottom: '3px' }}>
              <div style={{ fontSize: '10px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }}>
                  <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.47 11.47 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.47 11.47 0 00.57 3.58 1 1 0 01-.25 1.01l-2.2 2.2z" stroke="#1e3a6e" strokeWidth="2" fill="none" />
                </svg>
                <span style={{ fontWeight: '700' }}>Raheel Mushtaq</span><span style={{ color: '#6a8aae' }}> | </span><span style={{ fontWeight: '700' }}>Siddique</span>
              </div>
            </div>
            <div style={{ marginBottom: '2px', fontWeight: '600' }}>0309-3660360 &nbsp;&nbsp;&nbsp;&nbsp; 0329-7040402</div>
            <div style={{ marginBottom: '2px' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }}>
                <rect x="2" y="4" width="20" height="16" rx="2" stroke="#1e3a6e" strokeWidth="2" fill="none" />
                <path d="M2 7l10 7 10-7" stroke="#1e3a6e" strokeWidth="2" strokeLinecap="round" />
              </svg>
              info@mabakers.com.pk
            </div>
            <div style={{ marginBottom: '2px' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }}>
                <circle cx="12" cy="12" r="10" stroke="#1e3a6e" strokeWidth="2" fill="none" />
                <path d="M2 12h20M12 2c-2.5 2.5-4 5.5-4 10s1.5 7.5 4 10M12 2c2.5 2.5 4 5.5 4 10s-1.5 7.5-4 10" stroke="#1e3a6e" strokeWidth="1.8" fill="none" />
              </svg>
              www.mabakers.com.pk
            </div>
            <div>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#1e3a6e" strokeWidth="2" fill="none" />
                <circle cx="12" cy="9" r="2.5" stroke="#1e3a6e" strokeWidth="1.8" fill="none" />
              </svg>
              Mabakers, Nawabshah, Sindh
            </div>
          </div>
        </div>

        {/* ===== INVOICE INFO BOX ===== */}
        <div style={{ backgroundColor: '#e8f0fb', border: '1px solid #b8cce8', borderRadius: '5px', padding: '5mm 6mm', marginBottom: '4mm', position: 'relative', overflow: 'hidden' }}>
          {/* Watermark */}
          <div style={{ position: 'absolute', top: '8px', right: '14px', fontSize: '13px', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#9ab8d8', lineHeight: '1.5', textAlign: 'right' }}>
            Good<br />Food<br />Brings<br />People<br />Together
          </div>

          <div style={{ fontSize: '22px', fontWeight: '900', color: '#1e3a6e', marginBottom: '5px', letterSpacing: '1px' }}>INVOICE</div>

          <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', rowGap: '4px', maxWidth: '88%' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', fontSize: '10.5px' }}>
              <span style={{ color: '#4a6a9e', fontWeight: '600', minWidth: '105px' }}>Invoice No:</span>
              <span style={{ fontWeight: '900', color: '#1e3a6e', fontFamily: 'monospace', fontSize: '11px' }}>{invoiceNo}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', fontSize: '10.5px' }}>
              <span style={{ color: '#4a6a9e', fontWeight: '600', minWidth: '38px' }}>Date:</span>
              <span style={{ fontWeight: '700', color: '#1e3a6e' }}>{date}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', fontSize: '10.5px' }}>
              <span style={{ color: '#4a6a9e', fontWeight: '600', minWidth: '105px' }}>Customer Name:</span>
              <span style={{ fontWeight: '900', color: '#1e3a6e', fontSize: '12px', textTransform: 'uppercase' }}>{customer.name || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', fontSize: '10.5px' }}>
              <span style={{ color: '#4a6a9e', fontWeight: '600', minWidth: '38px' }}>City:</span>
              <span style={{ fontWeight: '700', color: '#1e3a6e', textTransform: 'uppercase' }}>{customer.city || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', fontSize: '10.5px' }}>
              <span style={{ color: '#4a6a9e', fontWeight: '600', minWidth: '105px' }}>Customer Contact No:</span>
              <span style={{ fontWeight: '600', color: '#1e3a6e', fontFamily: 'monospace' }}>{customer.phone || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* ===== ITEMS TABLE ===== */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '5mm', border: '1px solid #b8cce8' }}>
          <thead>
            <tr style={{ backgroundColor: '#1e3a6e' }}>
              <th style={{ ...cellStyle({ color: '#fff', fontWeight: '800', fontSize: '9.5px', letterSpacing: '0.5px', textAlign: 'center', width: '36px', borderRight: '1px solid #3a5aae', borderBottom: 'none', textTransform: 'uppercase' }) }}>SR.</th>
              <th style={{ ...cellStyle({ color: '#fff', fontWeight: '800', fontSize: '9.5px', letterSpacing: '0.5px', textAlign: 'left', borderRight: '1px solid #3a5aae', borderBottom: 'none', textTransform: 'uppercase' }) }}>PARTICULARS</th>
              <th style={{ ...cellStyle({ color: '#fff', fontWeight: '800', fontSize: '9.5px', letterSpacing: '0.5px', textAlign: 'center', width: '55px', borderRight: '1px solid #3a5aae', borderBottom: 'none', textTransform: 'uppercase' }) }}>QTY</th>
              <th style={{ ...cellStyle({ color: '#fff', fontWeight: '800', fontSize: '9.5px', letterSpacing: '0.5px', textAlign: 'center', width: '78px', borderRight: '1px solid #3a5aae', borderBottom: 'none', textTransform: 'uppercase' }) }}>RATE (PKR)</th>
              <th style={{ ...cellStyle({ color: '#fff', fontWeight: '800', fontSize: '9.5px', letterSpacing: '0.5px', textAlign: 'right', width: '85px', borderRight: 'none', borderBottom: 'none', textTransform: 'uppercase' }) }}>AMOUNT (PKR)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id || index} style={{ backgroundColor: '#ffffff' }}>
                <td style={{ ...cellStyle({ textAlign: 'center', color: '#4a6a9e', fontWeight: '600' }) }}>{index + 1}</td>
                <td style={{ ...cellStyle({ fontWeight: '700', color: '#1e3a6e', textTransform: 'uppercase' }) }}>{item.name}</td>
                <td style={{ ...cellStyle({ textAlign: 'center', fontWeight: '700', color: '#000' }) }}>{item.qty}</td>
                <td style={{ ...cellStyle({ textAlign: 'center', color: '#000' }) }}>{item.rate.toLocaleString()}</td>
                <td style={{ ...cellStyle({ textAlign: 'right', fontWeight: '900', color: '#1e3a6e', borderRight: 'none' }) }}>{item.amount.toLocaleString()}</td>
              </tr>
            ))}
            {Array.from({ length: emptyRowCount }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td style={{ ...cellStyle({ height: '28px' }) }}>&nbsp;</td>
                <td style={{ ...cellStyle({}) }}>&nbsp;</td>
                <td style={{ ...cellStyle({}) }}>&nbsp;</td>
                <td style={{ ...cellStyle({}) }}>&nbsp;</td>
                <td style={{ ...cellStyle({ borderRight: 'none' }) }}>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ===== BOTTOM: Payment Terms + Totals ===== */}
        <div style={{ display: 'flex', gap: '8mm', marginBottom: '4mm', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '7px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="2" width="8" height="4" rx="1" stroke="#1e3a6e" strokeWidth="2" fill="none" />
                <path d="M8 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-2" stroke="#1e3a6e" strokeWidth="2" fill="none" />
                <line x1="9" y1="9" x2="15" y2="9" stroke="#1e3a6e" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="9" y1="13" x2="15" y2="13" stroke="#1e3a6e" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="9" y1="17" x2="13" y2="17" stroke="#1e3a6e" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#1e3a6e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PAYMENT TERMS &amp; CONDITIONS</span>
            </div>
            {['Payment is due within the agreed term.', 'Kindly clear your invoice daily basis.', 'Late payments may be subject to additional charges.', 'For any queries, please contact us.'].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '5px', fontSize: '10px', color: '#333' }}>
                <CheckIcon /><span>{t}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ width: '225px', border: '1px solid #b8cce8', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderBottom: '1px solid #dce8f5' }}>
              <span style={{ fontSize: '9.5px', fontWeight: '600', color: '#4a6a9e', textTransform: 'uppercase', letterSpacing: '0.3px' }}>CURRENT INVOICE</span>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#1e3a6e' }}>PKR {todayTotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderBottom: '1px solid #dce8f5', backgroundColor: '#f5f8fd' }}>
              <span style={{ fontSize: '9.5px', fontWeight: '600', color: '#4a6a9e', textTransform: 'uppercase', letterSpacing: '0.3px' }}>PREVIOUS REMAINING BALANCE</span>
              <span style={{ fontSize: '10px', fontWeight: '800', color: prevBalance > 0 ? '#b91c1c' : '#1e3a6e' }}>PKR {prevBalance.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderBottom: '2px solid #1e3a6e' }}>
              <span style={{ fontSize: '9.5px', fontWeight: '700', color: '#1e3a6e', textTransform: 'uppercase', letterSpacing: '0.3px' }}>TOTAL INVOICE AMOUNT</span>
              <span style={{ fontSize: '10px', fontWeight: '800', color: '#1e3a6e' }}>PKR {totalAmount.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#1e3a6e' }}>
              <span style={{ fontSize: '11px', fontWeight: '900', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>GRAND TOTAL</span>
              <span style={{ fontSize: '13px', fontWeight: '900', color: '#ffffff', fontFamily: 'monospace' }}>PKR {grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ===== SIGNATURES ===== */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '5mm', marginBottom: '5mm' }}>
          <div>
            <div style={{ width: '150px', borderBottom: '1.5px solid #1e3a6e', marginBottom: '5px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#1e3a6e" strokeWidth="2" fill="none" />
                <path d="M7 12.5L10.5 16L17 9" stroke="#1e3a6e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#1e3a6e' }}>Checked &amp; Approved By</div>
                <div style={{ fontSize: '10px', color: '#4a6a9e' }}>M.A Bakers</div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginBottom: '5px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 3a2.83 2.83 0 014 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="#1e3a6e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              <span style={{ fontSize: '10px', fontWeight: '600', color: '#1e3a6e' }}>Customer Signature</span>
            </div>
            <div style={{ width: '140px', borderBottom: '1.5px solid #1e3a6e', marginBottom: '6px', marginLeft: 'auto' }} />
            <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '19px', fontWeight: '700', color: '#1e3a6e', lineHeight: '1' }}>Thank You!</div>
            <div style={{ fontSize: '8px', fontWeight: '700', color: '#4a6a9e', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '2px' }}>FOR YOUR BUSINESS</div>
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <div style={{ backgroundColor: '#1e3a6e', borderRadius: '3px', padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', color: '#d0e0f8', fontSize: '10px', fontWeight: '600', gap: '4px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#d0e0f8" strokeWidth="2" fill="none" />
              <circle cx="12" cy="9" r="2.5" stroke="#d0e0f8" strokeWidth="1.8" fill="none" />
            </svg>
            Mabakers, Nawabshah, Sindh
          </div>
          <div style={{ color: '#8aadcc', fontSize: '12px' }}>|</div>
          <div style={{ display: 'flex', alignItems: 'center', color: '#d0e0f8', fontSize: '10px', fontWeight: '600', gap: '4px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#d0e0f8" strokeWidth="2" fill="none" />
              <path d="M2 12h20M12 2c-2.5 2.5-4 5.5-4 10s1.5 7.5 4 10M12 2c2.5 2.5 4 5.5 4 10s-1.5 7.5-4 10" stroke="#d0e0f8" strokeWidth="1.8" fill="none" />
            </svg>
            www.mabakers.com.pk
          </div>
        </div>
      </div>
    );
  }
);

CustomerLedgerInvoiceA4.displayName = 'CustomerLedgerInvoiceA4';
