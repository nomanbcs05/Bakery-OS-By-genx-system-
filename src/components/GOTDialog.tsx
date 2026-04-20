import { useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface GOTDialogProps {
  open: boolean;
  onClose: () => void;
  items: { name: string; quantity: number }[];
  destination: string;
  tokenNumber?: number;
  autoPrint?: boolean;
}

export default function GOTDialog({ open, onClose, items, destination, tokenNumber, autoPrint }: GOTDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { receiptSettings } = useApp();

  const commonStyles = `
    body { 
      font-family: 'Courier New', Courier, monospace; 
      font-size: 10pt; 
      color: #000; 
      margin: 0; 
      padding: 0; 
      width: 270px; 
    }
    .text-center { text-align: center; }
    .font-bold { font-weight: bold; }
    .uppercase { text-transform: uppercase; }
    
    .ticket-header { 
      border-bottom: 2pt solid #000; 
      padding-bottom: 5pt; 
      margin-bottom: 8pt; 
      text-align: center;
    }
    .ticket-title { 
      font-size: 20pt; 
      font-weight: bold; 
      background: #000; 
      color: #fff; 
      display: inline-block; 
      padding: 2pt 10pt;
      margin-bottom: 4pt;
    }
    .destination-box {
      border: 1.5pt solid #000;
      padding: 4pt;
      margin: 4pt 0;
      font-size: 16pt;
      font-weight: bold;
    }
    .item-row {
      display: flex;
      border-bottom: 1pt dashed #000;
      padding: 6pt 0;
      font-size: 14pt;
      align-items: center;
    }
    .item-qty {
      width: 50px;
      font-weight: bold;
      font-size: 18pt;
    }
    .item-name {
      flex: 1;
      font-weight: bold;
    }
    .footer {
      margin-top: 15pt;
      border-top: 2pt solid #000;
      padding-top: 5pt;
      text-align: center;
      font-size: 10pt;
    }
  `;

  const handlePrint = () => {
    const content = printRef.current;
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
      doc.write(`
        <html><head><title>GOT Ticket</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
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
        </style></head>
        <body>
          <div class="print-container">
            ${content.innerHTML}
          </div>
          <script>
            window.onload = () => { 
              setTimeout(() => {
                window.print();
                window.onafterprint = () => { window.close(); };
              }, 250);
            };
          </script>
        </body></html>
      `);
      doc.close();

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

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true });

  const destLabels: Record<string, string> = { 
    branch_1: 'BRANCH 1', 
    branch_2: 'BRANCH 2', 
    walkin: 'WALK-IN (FACTORY)' 
  };

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', left: '-9999px', top: 0, opacity: 0, pointerEvents: 'none' }}>
      <div ref={printRef} className="bg-white text-black">
        <div className="ticket-header">
          <div className="ticket-title">GOT TICKET</div>
          <div className="font-bold text-[14pt] uppercase">M.A BAKER'S</div>
          <div className="text-[9pt] leading-tight mt-1">{receiptSettings?.dispatchAddress}</div>
          <div className="text-[9pt] font-bold">{receiptSettings?.dispatchPhone}</div>
        </div>

        <div className="text-center mb-4">
          <div className="text-[10pt]">{dateStr} | {timeStr}</div>
          {tokenNumber && (
            <div className="text-[28pt] font-black underline my-1">
              TOKEN #: {tokenNumber}
            </div>
          )}
          <div className="text-[11pt] font-bold mt-1">DISPATCH TO:</div>
          <div className="destination-box uppercase">
            {destLabels[destination] || destination || 'UNSPECIFIED'}
          </div>
        </div>

        <div className="border-t-2 border-black pt-2">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between border-b border-dashed border-stone-300 py-1">
              <div className="font-bold text-[11pt] uppercase">{item.name}</div>
              <div className="font-black text-[12pt]">x {item.quantity}</div>
            </div>
          ))}
        </div>

        <div className="footer">
          <div className="font-bold">TOTAL ITEMS: {items.reduce((acc, curr) => acc + curr.quantity, 0)}</div>
          <div className="mt-2 text-[8pt]">Bakewise ERP - Dispatch System by genx systems +923342826675</div>
        </div>
      </div>
    </div>
  );
}
