import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Exports data to a PDF file
 * @param title The title of the document
 * @param headers Array of column headers
 * @param data 2D array of data rows
 * @param fileName Name of the file (without extension)
 */
export const exportToPDF = (title: string, headers: string[], data: any[][], fileName: string) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 15);
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
  
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: 30,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2 },
  });
  
  doc.save(`${fileName}.pdf`);
};

/**
 * Exports data to an Excel file
 * @param data Array of objects or 2D array
 * @param fileName Name of the file (without extension)
 * @param sheetName Name of the worksheet (optional)
 */
export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Data') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
