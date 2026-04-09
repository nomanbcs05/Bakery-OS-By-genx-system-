import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, QrCode } from 'lucide-react';
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
}

export default function ReceiptDialog({ open, onClose, items, total, paymentMethod, branch, saleId, date }: ReceiptDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { receiptSettings, currentUser } = useApp();

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;
    const win = window.open('', '_blank', 'width=320,height=600');
    if (!win) return;
    win.document.write(`
      <html><head><title>Receipt</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          font-size: 11px; 
          color: #000; 
          background: #fff;
          margin: 0; 
          padding: 10px; 
          width: 280px; 
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        .border-y { border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 4px 0; }
        .border-b { border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 4px; }
        .border-t { border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }
        .double-border-b { border-bottom: 3px double #000; padding-bottom: 4px; margin-bottom: 4px; }
        .flex-between { display: flex; justify-content: space-between; align-items: center; }
        .grid-meta { display: grid; grid-template-columns: 100px 1fr; gap: 2px; margin-bottom: 8px; }
        
        .brand-name { font-family: 'Times New Roman', Times, serif; font-size: 22px; font-weight: bold; margin: 4px 0; }
        .tagline { font-family: 'Times New Roman', Times, serif; font-size: 12px; font-style: italic; }
        .branch-name { font-size: 14px; font-weight: bold; margin: 4px 0; }
        .address-text { font-size: 9px; line-height: 1.2; }
        
        .table-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1.2fr; font-weight: bold; font-size: 10px; }
        .item-row { margin-top: 4px; font-size: 10px; }
        .item-details { display: grid; grid-template-columns: 1fr 1fr 1fr 1.2fr; padding-left: 20%; color: #333; margin-top: 2px; }
        
        .totals-grid { display: grid; grid-template-columns: 1fr auto; gap: 4px; }
        
        .box { border: 1px solid #000; padding: 4px; }
      </style></head><body>
      ${content.innerHTML}
      <script>window.print(); window.close();</script>
      </body></html>
    `);
    win.document.close();
  };

  const formattedDate = new Date(date).toLocaleString('en-GB', { 
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', 
    hour: 'numeric', minute: '2-digit', hour12: true 
  }).replace(',', '');

  const totalQty = items.reduce((acc, item) => acc + item.quantity, 0);
  const gst = 0; // Replace with actual GST calculation if needed
  const grossAmount = total - gst;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Print Receipt</DialogTitle>
        </DialogHeader>

        <div className="bg-white text-black p-4 mx-auto w-[300px] border shadow-sm" ref={receiptRef}>
          {/* Logo & Header */}
          <div className="text-center mb-3">
            <div className="flex justify-center mb-1">
              <svg width="40" height="24" viewBox="0 0 100 60" fill="currentColor">
                {/* Decorative logo simulation */}
                <path d="M50 0 L60 20 L80 20 L65 35 L70 55 L50 40 L30 55 L35 35 L20 20 L40 20 Z" fill="#000" />
                <path d="M50 10 L55 25 L70 25 L60 35 L65 50 L50 40 L35 50 L40 35 L30 25 L45 25 Z" fill="#fff" />
              </svg>
            </div>
            <div className="font-serif text-[22px] font-bold leading-tight tracking-tight" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
              {receiptSettings?.brandName || 'Rehmat-e-Shereen'}
            </div>
            <div className="font-serif text-[12px] italic mb-1" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
              {receiptSettings?.tagline || 'make life delicious'}
            </div>
            <div className="text-[14px] font-bold mb-1">
              {branch.toUpperCase()}
            </div>
            <div className="text-[9px] leading-tight">
              {receiptSettings?.address || 'Main Branch, KARACHI, Pakistan'}
            </div>
            <div className="text-[9px] font-bold mt-1">
              UAN #: {receiptSettings?.phone || '021 111 111 111'}
            </div>
          </div>

          <div className="text-center font-bold text-[12px] border-y border-black py-1 mb-2">
            Sale Receipt
          </div>

          {/* Meta Details */}
          <div className="grid grid-cols-[100px_1fr] gap-x-1 gap-y-1 text-[11px] mb-2">
            <div className="font-bold">Invoice #</div>
            <div>: {saleId.slice(0, 8).toUpperCase()}</div>
            
            <div className="font-bold">Operator Name</div>
            <div>: {currentUser?.name || 'SYS_ADMIN'}</div>
            
            <div className="font-bold">Invoice Date</div>
            <div>: {formattedDate}</div>
            
            <div className="font-bold">Client Name</div>
            <div>: Walk-in Customer</div>
            
            <div className="font-bold">SalesMan</div>
            <div>: {currentUser?.id?.slice(0, 6) || '000001'}</div>
            
            <div className="font-bold">Counter</div>
            <div>: MAIN COUNTER</div>
            
            <div className="font-bold">Reference #</div>
            <div>: 0</div>
          </div>

          {/* Table Header */}
          <div className="border-y border-black py-1 mb-1 bg-gray-50 flex text-[9px] font-bold">
            <div className="w-[45%]">Item Name</div>
            <div className="w-[15%] text-right">Price</div>
            <div className="w-[15%] text-center">Qty/Wt</div>
            <div className="w-[12%] text-center">Tax %</div>
            <div className="w-[13%] text-right">Amount</div>
          </div>

          {/* Category Example */}
          <div className="text-center font-bold text-[10px] my-1 tracking-wider border-b border-black pb-1">
            ITEMS
          </div>

          {/* Items List */}
          <div className="mb-2 min-h-[50px]">
            {items.map((item, i) => (
              <div key={i} className="mb-2 text-[10px]">
                <div className="truncate">{String(i + 1).padStart(5, '0')} {item.name}</div>
                <div className="flex w-full text-gray-700 mt-[2px]">
                  <div className="w-[15%]"></div>
                  <div className="w-[30%] text-right">{item.unitPrice.toLocaleString()}</div>
                  <div className="w-[25%] text-center">{item.quantity}.000 P</div>
                  <div className="w-[15%] text-center">0.00%</div>
                  <div className="w-[15%] text-right text-black">{((item.quantity * item.unitPrice)).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Totals */}
          <div className="border-y border-black py-1 flex justify-between font-bold text-[10px] px-2 mb-2">
            <span>Total Item <span className="ml-4">{items.length}</span></span>
            <span>Total Qty <span className="ml-4">{totalQty}</span></span>
          </div>

          <div className="text-[11px] space-y-1 mb-2">
            <div className="flex justify-between">
              <span>Gross Amount</span>
              <span className="font-bold">{grossAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>On Invoice Discount</span>
              <span className="border-b border-black border-dashed flex-1 mx-2 relative top-[-4px]"></span>
              <div className="flex justify-end min-w-[60px]">
                <span className="mr-4">(0.00%)</span>
                <span>0.00</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span>G.S.T</span>
              <span className="border-b border-black border-dashed flex-1 mx-2 relative top-[-4px]"></span>
              <span className="font-bold">{gst.toFixed(2)}</span>
            </div>
          </div>

          {/* Other Charges */}
          <div className="text-[11px] mb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="border-t border-black flex-1"></span>
              <span className="font-bold">Other Charges Detail</span>
              <span className="border-t border-black flex-1"></span>
            </div>
            <div className="flex justify-between pl-2">
              <span className="italic text-[10px]">Fbr Service Fee</span>
              <span className="border-b border-black border-dashed flex-1 mx-2 relative top-[-4px]"></span>
              <span>1</span>
            </div>
            <div className="flex justify-between font-bold mt-1">
              <span>Total Charges</span>
              <span className="border-b border-black flex-1 mx-2 relative top-[-4px]"></span>
              <span>1</span>
            </div>
          </div>

          {/* Net Amount */}
          <div className="border-t-[1px] border-b-[3px] border-black border-double py-1 mb-3 flex justify-between items-center bg-gray-50">
            <span className="font-bold text-[13px]">Net Amount</span>
            <span className="font-bold text-[15px]">{(total + 1).toLocaleString()}</span>
          </div>

          {/* FBR Info */}
          <div className="text-center mb-3">
            <div className="font-bold text-[11px]">FBR Invoice #</div>
            <div className="text-[10px] tracking-widest">{saleId.replace(/[^0-9]/g, '').padEnd(16, '0').slice(0, 16)}</div>
            
            <div className="flex justify-center items-center gap-4 mt-2">
              <div className="text-[9px] font-bold border border-black p-1 text-center w-20 uppercase">
                <svg viewBox="0 0 24 24" className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                POS<br/>System
              </div>
              <div className="border border-black p-1">
                <QrCode size={40} strokeWidth={1} />
              </div>
            </div>
            
            <div className="text-[9px] mt-2 italic leading-tight px-4">
              Verify this invoice through FBR TaxAsaan MobileApp or SMS at 9966 and win exciting prizes in draw
            </div>
          </div>

          {/* Payment Info */}
          <div className="border border-black flex flex-col text-[11px]">
            <div className="flex justify-between p-1 border-b border-black">
              <span className="font-bold">Cash Paid</span>
              <span>{(total + 1).toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-1 bg-gray-100">
              <span className="font-bold">Cash Back</span>
              <span>-</span>
            </div>
          </div>

        </div>

        <DialogFooter className="flex gap-2 sm:gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">Close</Button>
          <Button onClick={handlePrint} className="flex-1 shrink-0">
            <Printer className="h-4 w-4 mr-1" /> Print Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

