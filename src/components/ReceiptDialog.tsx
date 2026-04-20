import { useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface ReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  items: { name: string; quantity: number; unitPrice: number }[];
  total: number;
  paymentMethod: string;
  branch: string;
  saleId: string;
  date: string;
  autoPrint?: boolean;
}

export default function ReceiptDialog({ open, onClose, items, total, paymentMethod, branch, saleId, date, autoPrint }: ReceiptDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { receiptSettings, sales } = useApp();

  const commonStyles = `
    body { 
      font-family: 'Courier New', Courier, monospace; 
      font-size: 10pt; 
      color: #000; 
      margin: 0; 
      padding: 0; 
      width: 260px; 
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .uppercase { text-transform: uppercase; }
    
    .receipt-logo {
      max-height: 80pt !important;
      max-width: 80% !important;
      margin: 0 auto 6pt auto;
      display: block;
      object-fit: contain;
      text-align: center;
    }
    .receipt-logo-wrapper {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 4pt;
    }

    .receipt-box { 
      border: 1pt solid #000 !important; 
      padding: 4pt; 
      margin-bottom: 6pt; 
    }
    .receipt-order-num { 
      border: 2pt solid #000 !important; 
      padding: 6pt; 
      margin: 8pt 0; 
      font-size: 26pt; 
      font-weight: bold; 
      text-align: center; 
      display: block;
    }
    .receipt-divider { 
      border-top: 1.5pt dashed #000; 
      margin: 4pt 0; 
    }
    .receipt-line { 
      border-top: 1.5pt solid #000; 
      margin: 4pt 0; 
    }
    
    .flex-row { display: flex; justify-content: space-between; }
    .highlight-bill { 
      border-top: 1pt solid #000; 
      border-bottom: 2pt solid #000; 
      padding: 4pt 2pt; 
      font-size: 14pt; 
      font-weight: bold; 
      display: flex; 
      justify-content: space-between; 
      background: #eee !important;
      -webkit-print-color-adjust: exact;
    }
    .item-table-header { 
      border-top: 1.5pt solid #000;
      border-bottom: 1.5pt solid #000; 
      font-weight: bold; 
      display: flex; 
      margin-top: 4pt;
      padding: 2pt 0;
      font-size: 10.5pt;
    }
    .w-qty { width: 12%; text-align: left; }
    .w-item { width: 45%; text-align: left; padding: 0 2pt; font-weight: bold; overflow-wrap: break-word; }
    .w-rate { width: 18%; text-align: right; }
    .w-amount { width: 25%; text-align: right; font-weight: bold; }
    .item-row { display: flex; padding: 2pt 0; align-items: flex-start; line-height: 1.1; width: 100%; }
    
    .phone-pill {
      background: #000 !important;
      color: #fff !important;
      padding: 1px 4px;
      font-weight: bold;
      -webkit-print-color-adjust: exact;
    }
  `;

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '80mm';
    iframe.style.height = '1000px'; 
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      // Use exact sizing for thermal paper (approx 80mm or 58mm)
      // 280px is good for 80mm. 
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt</title>
          <style>
            @page { 
              size: 80mm auto; 
              margin: 0; 
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              width: 80mm !important;
              height: auto !important;
              overflow: visible !important;
            }
            * {
              margin: 0 !important;
              padding: 0 !important;
              box-sizing: border-box !important;
            }
            ${commonStyles}
            .print-container {
              width: 80mm !important;
              padding: 2mm !important;
            }
          </style>
        </head>
        <body>
          <div id="print-root">
            ${content.innerHTML}
          </div>
        </body>
        </html>
      `);
      doc.close();

      // Wait for images to load before printing
      const images = iframe.contentWindow?.document.querySelectorAll('img');
      if (images && images.length > 0) {
        const promises = Array.from(images).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        });
        Promise.all(promises).then(() => {
          setTimeout(() => {
            iframe.contentWindow?.print();
          }, 300);
        });
      } else {
        setTimeout(() => {
          iframe.contentWindow?.print();
        }, 300);
      }

      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 5000);
    }
  };

  useEffect(() => {
    if (open) {
      handlePrint();
      onClose();
    }
  }, [open]);

  // Normalize branch name for logic comparisons (e.g. "Branch 1" -> "branch_1")
  const branchId = branch.toLowerCase().replace(' ', '_');
  const cashierName = branchId === 'branch_1' ? receiptSettings?.branch1Cashier : 
                     branchId === 'branch_2' ? receiptSettings?.branch2Cashier : 
                     receiptSettings?.branch1Cashier;

  const displayAddress = branchId === 'branch_1' ? receiptSettings?.branch1Address : 
                         branchId === 'branch_2' ? receiptSettings?.branch2Address : 
                         branchId === 'factory' ? receiptSettings?.dispatchAddress : 
                         receiptSettings?.address;

  const displayPhone = branchId === 'branch_1' ? receiptSettings?.branch1Phone : 
                       branchId === 'branch_2' ? receiptSettings?.branch2Phone : 
                       branchId === 'factory' ? receiptSettings?.dispatchPhone : 
                       receiptSettings?.phone;

  // Logic for sequential numbering
  const dDate = date ? new Date(date) : new Date();
  const isValidDate = dDate instanceof Date && !isNaN(dDate.getTime());
  const finalDate = isValidDate ? dDate : new Date();
  const dateStr = finalDate.toISOString().split('T')[0];
  // Daily sales for this branch on this specific date
  const dailySales = sales
    .filter(s => s.branch === branchId && s.date && s.date.startsWith(dateStr))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Invoice #: starts at 1 every day (counts from starting shift)
  const invoiceSerial = dailySales.findIndex(s => s.id === saleId) + 1 || 1;
  const paddedInvoiceSerial = String(invoiceSerial);

  // Day Serial: Number of operational days since first day of software use
  const allDates = [...new Set(sales.filter(s => s.date).map(s => String(s.date).split('T')[0].split(' ')[0]))].sort();
  const dayIndex = allDates.findIndex(d => d === dateStr);
  const daySerial = dayIndex >= 0 ? dayIndex + 1 : Math.max(allDates.length, 1);
  const paddedDaySerial = String(daySerial).padStart(4, '0');

  const formattedDate = finalDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
  const formattedTime = finalDate.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true });

  const displayPhoneFinal = displayPhone; // using a consistent name for JSX

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', left: '-9999px', top: 0, opacity: 0, pointerEvents: 'none' }}>
      <div ref={receiptRef}>
        <div className="print-container bg-white text-black">
          <div className="receipt-box text-center">
            {receiptSettings?.logoUrl ? (
              <div className="receipt-logo-wrapper">
                <img src={receiptSettings.logoUrl} alt="Logo" className="receipt-logo" crossOrigin="anonymous" />
              </div>
            ) : null}

            <div className="text-[13pt] font-black uppercase mb-1" style={{color:'#000', fontWeight:900, letterSpacing:'1px'}}>
              {receiptSettings?.brandName || "M.A BAKER'S"}
            </div>

            {receiptSettings?.tagline && (
              <div className="text-[8pt] italic mb-1 uppercase tracking-widest" style={{color:'#c08000'}}>{receiptSettings.tagline}</div>
            )}
            
            <div className="receipt-divider"></div>

            <div className="text-[10pt] leading-tight whitespace-pre-line mb-1 font-bold px-2">
              {displayAddress}
            </div>
            <div className="text-[11pt] font-bold">
              {displayPhoneFinal}
            </div>
            
            <div className="receipt-divider"></div>
            <div className="text-[9pt] font-bold uppercase tracking-tighter">
              {receiptSettings?.printedBy || 'GENX ERP & POS SYSTEMS'}
            </div>
          </div>

          <div className="text-[11pt] space-y-0.5 mb-2">
            <div className="flex-row">
              <span className="font-bold">Invoice #: {paddedInvoiceSerial}</span>
              <span className="font-bold">Day Serial: {paddedDaySerial}</span>
            </div>
            <div className="flex-row font-bold">
              <span>Restaurant:</span>
              <span className="uppercase">{receiptSettings?.brandName || "M.A BAKER'S"}</span>
            </div>
            <div className="flex-row">
              <span>Cashier:</span>
              <span>{cashierName || 'GENX ERP & POS SYSTEMS'}</span>
            </div>
            <div className="flex-row">
              <span>Type:</span>
              <span className="font-bold uppercase">{branchId === 'factory' || branch.toLowerCase().includes('factory') ? 'WALK IN' : (branchId === 'branch_1' ? 'BRANCH 1' : 'BRANCH 2')}</span>
            </div>
            <div className="flex-row">
              <span>Payment:</span>
              <span className="font-bold uppercase tracking-widest bg-stone-200 px-1">{paymentMethod}</span>
            </div>
            <div className="flex-row">
              <span>{formattedDate}</span>
              <span>{formattedTime}</span>
            </div>
          </div>

          <div className="item-table-header">
            <div className="w-qty">Qty</div>
            <div className="w-item">Item</div>
            <div className="w-rate">Rate</div>
            <div className="w-amount">Amount</div>
          </div>
          
          <div className="min-h-[40px] border-b-1.5pt border-black">
            {items.map((item, i) => (
              <div key={i} className="item-row text-[10.5pt]">
                <div className="w-qty font-bold">{Number.isInteger(item.quantity) ? item.quantity : Number(item.quantity).toFixed(3)}</div>
                <div className="w-item uppercase">{item.name}</div>
                <div className="w-rate">{item.unitPrice}</div>
                <div className="w-amount font-bold">{Number(Number(item.quantity * item.unitPrice).toFixed(2))}</div>
              </div>
            ))}
          </div>

          <div className="receipt-line"></div>

          <div className="receipt-line mt-4"></div>
          <div className="text-[11pt] space-y-1">
            <div className="flex-row">
              <span>SubTotal :</span>
              <span className="font-bold">{total}</span>
            </div>
            
            <div className="highlight-bill">
              <span>Net Bill :</span>
              <span>{total}</span>
            </div>
            
          </div>

          <div className="receipt-box text-center mt-2 border-2 border-black overflow-hidden">
            <div className="font-bold text-[8pt] mb-1 truncate whitespace-nowrap">
              {receiptSettings?.footerMessage1 || "Thank you for visiting M.A BAKER'S!"}
            </div>
            <div className="text-[8.5pt] leading-tight font-bold">
              {receiptSettings?.footerMessage2 || 'POWERED BY: GENX SYSTMS +923342826675'}
            </div>
          </div>
          </div>
        </div>
      </div>
    );
}

