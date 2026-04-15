import { CSVLink } from 'react-csv';
import { exportToPDF } from '../../utils/exportUtils.jsx';

export default function ExportButtons({ csvData, pdfData, pdfTitle, filename, columns }) {
  const hasData = csvData && csvData.length > 0;

  return (
    <div className="flex gap-2">
      <CSVLink
        data={csvData}
        filename={`${filename}.csv`}
        className={`px-3 py-1 rounded text-sm ${
          hasData
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
        onClick={(e) => !hasData && e.preventDefault()}
      >
        📄 CSV
      </CSVLink>
      <button
        onClick={() => hasData && exportToPDF(pdfTitle, columns, pdfData, `${filename}.pdf`)}
        disabled={!hasData}
        className={`px-3 py-1 rounded text-sm ${
          hasData
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        📑 PDF
      </button>
    </div>
  );
}