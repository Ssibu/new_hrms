import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useConfig } from '../context/ConfigContext';
import { CheckCircleIcon, ExclamationTriangleIcon, DocumentMagnifyingGlassIcon, BanknotesIcon } from '@heroicons/react/24/outline';


// --- FINALIZED TOOLTIP COMPONENT (Mouse-Position Aware) ---
const Tooltip = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // --- THE FIX: This function now uses mouse coordinates ---
  const handleMouseEnter = (e) => {
    // We get the Y and X coordinates of the mouse pointer from the event object.
    setPosition({
      top: e.clientY,
      left: e.clientX,
    });
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };
  
  const tooltipJsx = (
    <div
      style={{ top: position.top, left: position.left }}
      // The transform classes now position the tooltip relative to the mouse pointer
      className="fixed bg-gray-900 text-white text-xs rounded-lg p-2 shadow-lg z-50 w-max max-w-xs transform -translate-y-full -translate-x-1/2 -mt-2 pointer-events-none"
    >
      {content}
      <div 
        className="absolute top-full left-1/2 -translate-x-1/2"
        style={{
            width: 0, height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid rgb(17 24 39)', // tailwind gray-900
        }}
      />
    </div>
  );

  return (
    <>
      <span onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="inline-block">
        {children}
      </span>
      {isVisible && ReactDOM.createPortal(tooltipJsx, document.body)}
    </>
  );
};


const PayrollPage = () => {
  const { backendUrl } = useConfig();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  
  const [bulkResults, setBulkResults] = useState([]);
  const [singleResult, setSingleResult] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/employees`, { credentials: 'include' });
        if (response.ok) setEmployees(await response.json());
      } catch (err) { console.error("Failed to fetch employees", err); }
    };
    fetchEmployees();
  }, [backendUrl]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedEmployee || !selectedMonth) {
      setError('Please select both an employee (or "All") and a month.');
      return;
    }
    setLoading(true); setError(''); setMessage('');
    setSingleResult(null); setBulkResults([]);

    try {
      const [year, month] = selectedMonth.split('-');
      const isBulk = selectedEmployee === 'all';
      
      const url = isBulk ? `${backendUrl}/api/payroll/generate/bulk` : `${backendUrl}/api/payroll/generate`;
      const body = isBulk ? { month: parseInt(month), year: parseInt(year) } : { employeeId: selectedEmployee, month: parseInt(month), year: parseInt(year) };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate payslip(s).');
      
      setMessage(data.message);
      if (isBulk) {
        setBulkResults(data.results || []);
        if (data.errors && data.errors.length > 0) {
             setError(`Processed with ${data.errors.length} error(s). Check console for details.`);
             console.error("Bulk Generation Errors:", data.errors);
        }
      } else {
        setSingleResult(data.result);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const formatCurrency = (amount) => `₹${(amount != null ? amount : 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const renderTooltipContent = (components, title, category) => (
    <div className="text-left">
      <h4 className="font-bold border-b border-gray-700 mb-1 pb-1">{title}</h4>
      {components.filter(c => c.category === category).map(c => (
        <div key={c.name} className="flex justify-between gap-4">
          <span>{c.name}:</span>
          <span className="font-mono">{formatCurrency(c.amount)}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Run Payroll</h1>
          <p className="mt-1 text-sm text-gray-500">Generate, review, and finalize monthly payslips.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200"><h3 className="text-lg font-semibold text-gray-800">Payroll Generation</h3></div>
        <form onSubmit={handleGenerate}>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="employee-select" className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
              <select id="employee-select" value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
                <option value="">-- Choose option --</option>
                <option value="all">All Employees</option>
                {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-1">Pay Period</label>
              <input id="month-select" type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 font-semibold disabled:opacity-50 flex items-center gap-2 shadow-sm" disabled={loading}>
              <BanknotesIcon className="h-5 w-5" />
              {loading ? 'Generating...' : 'Generate Payslip(s)'}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        {error && <div className="p-4 rounded-lg bg-red-100 border border-red-200 text-red-800 flex items-center gap-3 animate-fadeIn"><ExclamationTriangleIcon className="h-5 w-5"/><span>{error}</span></div>}
        {message && <div className="p-4 rounded-lg bg-green-100 border border-green-200 text-green-800 flex items-center gap-3 animate-fadeIn"><CheckCircleIcon className="h-5 w-5"/><span>{message}</span></div>}

        {bulkResults.length > 0 && !loading && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden animate-fadeIn">
            <h3 className="text-lg font-semibold text-gray-900 px-6 py-4 border-b">Payroll Summary for {new Date(bulkResults[0].payslip.year, bulkResults[0].payslip.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Leave</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">LOP Days</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Earnings</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Deductions</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Salary</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bulkResults.map(({ payslip, attendanceSummary }) => (
                    <tr key={payslip._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payslip.employee?.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-mono">{attendanceSummary.totalDaysInMonth}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-mono">{attendanceSummary.presentDays}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-mono">{attendanceSummary.paidLeaveDays}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-mono text-orange-600 font-semibold">{attendanceSummary.lopDays}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                        <Tooltip content={renderTooltipContent(payslip.components, 'Earnings', 'Earning')}>
                          <span className="border-b border-dashed border-gray-500 cursor-pointer">{formatCurrency(payslip.grossEarnings)}</span>
                        </Tooltip>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-red-600">
                         <Tooltip content={renderTooltipContent(payslip.components, 'Deductions', 'Deduction')}>
                          <span className="border-b border-dashed border-gray-500 cursor-pointer">{formatCurrency(payslip.totalDeductions)}</span>
                        </Tooltip>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold font-mono text-green-600">{formatCurrency(payslip.netSalary)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && bulkResults.length === 0 && singleResult == null && (
          <div className="text-center p-12 bg-white rounded-lg shadow-md border-2 border-dashed">
              <DocumentMagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Ready to run payroll</h3>
              <p className="mt-1 text-sm text-gray-500">Select an employee and pay period to generate payslips.</p>
          </div>
        )}
      </div>
    </div>
  ); 
};

export default PayrollPage; 