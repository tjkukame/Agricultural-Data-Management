import { CSVLink } from 'react-csv';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Prepare data for CSV export
 * @param {Array} data - Array of objects
 * @param {Array} columns - Array of { label, key }
 * @returns {Array} - Formatted array for CSV
 */
export const prepareCSVData = (data, columns) => {
  if (!data || data.length === 0) return [];
  return data.map(row => {
    const csvRow = {};
    columns.forEach(col => {
      csvRow[col.label] = row[col.key] ?? '';
    });
    return csvRow;
  });
};

/**
 * Export data to PDF
 * @param {string} title - PDF title
 * @param {Array} columns - Array of { label, key }
 * @param {Array} data - Array of objects
 * @param {string} filename - Output filename
 */
export const exportToPDF = (title, columns, data, filename = 'export.pdf') => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }
  
  const doc = new jsPDF('landscape');
  doc.setFontSize(16);
  doc.text(title, 14, 10);
  
  const tableData = data.map(row => columns.map(col => row[col.key] ?? ''));
  
  autoTable(doc, {
    head: [columns.map(col => col.label)],
    body: tableData,
    startY: 20,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 240, 240] },
  });
  
  doc.save(filename);
};

/**
 * Export multiple tables to a single PDF
 * @param {string} title - Main title
 * @param {Array} sections - Array of { title, columns, data }
 * @param {string} filename - Output filename
 */
export const exportMultipleToPDF = (title, sections, filename = 'export.pdf') => {
  const doc = new jsPDF('landscape');
  let yOffset = 10;
  
  doc.setFontSize(16);
  doc.text(title, 14, yOffset);
  yOffset += 10;
  
  sections.forEach((section, index) => {
    if (index > 0) {
      doc.addPage();
      yOffset = 10;
    }
    doc.setFontSize(14);
    doc.text(section.title, 14, yOffset);
    yOffset += 8;
    
    const tableData = section.data.map(row => section.columns.map(col => row[col.key] ?? ''));
    autoTable(doc, {
      head: [section.columns.map(col => col.label)],
      body: tableData,
      startY: yOffset,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    });
    yOffset = doc.lastAutoTable.finalY + 10;
  });
  
  doc.save(filename);
};

/**
 * ExportButtons component (reusable)
 */
export const ExportButtons = ({ csvData, pdfData, pdfTitle, filename, columns }) => {
  const hasData = csvData && csvData.length > 0;
  
  return (
    <div className="flex gap-2">
      <CSVLink
        data={csvData}
        filename={`${filename}.csv`}
        className={`px-3 py-1 rounded text-sm ${hasData ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
        onClick={(e) => !hasData && e.preventDefault()}
      >
        Export CSV
      </CSVLink>
      <button
        onClick={() => hasData && exportToPDF(pdfTitle, columns, pdfData, `${filename}.pdf`)}
        disabled={!hasData}
        className={`px-3 py-1 rounded text-sm ${hasData ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
      >
        Export PDF
      </button>
    </div>
  );
};