import React, {useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const PayrollPage = () => {
  const { backendUrl } = useConfig();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  
  // --- MODIFIED: State to handle both single and bulk results ---
  const [payslipData, setPayslipData] = useState(null);
  const [bulkPayslipData, setBulkPayslipData] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Fetch all employees for the dropdown
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/employees`, { credentials: 'include' });
        if (response.ok) setEmployees(await response.json());
      } catch (err) { console.error("Failed to fetch employees", err); }
    };
    fetchEmployees();
  }, [backendUrl]);

  // --- MODIFIED: The main generation handler is now much more powerful ---
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedEmployee || !selectedMonth) {
      setError('Please select both an employee (or "All") and a month.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    setPayslipData(null);
    setBulkPayslipData([]);

    try {
      const [year, month] = selectedMonth.split('-');
      const isBulk = selectedEmployee === 'all';
      
      // It now correctly chooses between the bulk and single generation endpoints
      const url = isBulk 
        ? `${backendUrl}/api/payroll/generate/bulk` 
        : `${backendUrl}/api/payroll/generate`;

      const body = isBulk 
        ? { month: parseInt(month), year: parseInt(year) } 
        : { employeeId: selectedEmployee, month: parseInt(month), year: parseInt(year) };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate payslip(s).');
      
      setMessage(data.message);
      // It now correctly sets the state based on the type of response
      if (isBulk) {
        setBulkPayslipData(data.payslips || []);
      } else {
        setPayslipData(data.payslip);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const formatCurrency = (amount) => `₹ ${amount.toFixed(2)}`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Payroll Generation</h1>
      <p className="mt-1 text-sm text-gray-500">Generate and view monthly payslips for employees.</p>

      <div className="bg-white p-4 rounded-lg shadow">
        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label>
            {/* --- MODIFIED: Added "All Employees" option --- */}
            <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required>
              <option value="">-- Choose an option --</option>
              <option value="all">All Employees</option>
              {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Month</label>
            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Payslip(s)'}
          </button>
        </form>
      </div>

      {error && <div className="p-4 rounded-lg bg-red-50 border-red-200 text-red-700 flex items-center gap-3"><ExclamationTriangleIcon className="h-5 w-5"/><span>{error}</span></div>}
      {message && <div className="p-4 rounded-lg bg-green-50 border-green-200 text-green-700 flex items-center gap-3"><CheckCircleIcon className="h-5 w-5"/><span>{message}</span></div>}

      {/* --- MODIFIED: Single Payslip View is now more detailed --- */}
      {payslipData && !loading && (
        <div className="bg-white p-8 rounded-lg shadow animate-fadeIn">
          <h2 className="text-xl font-bold text-center text-gray-800 mb-6">Payslip for {new Date(payslipData.year, payslipData.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
          <div className="border-b pb-4 mb-4">
            <p><strong>Employee:</strong> {payslipData.employee.name} ({payslipData.employee.empId})</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 mt-6">
            <div>
              <h3 className="text-lg font-semibold border-b pb-2 mb-2">Earnings</h3>
              <div className="space-y-1 text-sm">
                {/* It now maps over the 'components' array to show every earning */}
                {payslipData.components.filter(c => c.category === 'Earning').map(c => (
                  <div key={c.name} className="flex justify-between"><span>{c.name}:</span> <span>{formatCurrency(c.amount)}</span></div>
                ))}
              </div>
              <div className="flex justify-between font-bold border-t mt-2 pt-2">
                <span>Gross Earnings:</span>
                <span>{formatCurrency(payslipData.grossEarnings)}</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold border-b pb-2 mb-2">Deductions</h3>
              <div className="space-y-1 text-sm">
                 {/* It now maps over 'components' to show every deduction and loss of pay */}
                 {payslipData.components.filter(c => c.category !== 'Earning').map(c => (
                  <div key={c.name} className="flex justify-between"><span>{c.name}:</span> <span>- {formatCurrency(c.amount)}</span></div>
                ))}
              </div>
              <div className="flex justify-between font-bold border-t mt-2 pt-2">
                <span>Total Deductions:</span>
                <span className="text-red-600">- {formatCurrency(payslipData.totalDeductions)}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-between text-xl font-bold mt-6 border-t-2 border-gray-300 pt-4">
            <span>Net Salary Payable:</span>
            <span className="text-green-600">{formatCurrency(payslipData.netSalary)}</span>
          </div>
        </div>
      )}

      {/* --- NEW: Bulk Payslip Table View --- */}
      {bulkPayslipData.length > 0 && !loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden animate-fadeIn">
          <h3 className="text-lg font-medium text-gray-900 px-6 py-4 border-b">
            Payslip Summary for {new Date(bulkPayslipData[0].year, bulkPayslipData[0].month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross Earnings</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Absent</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Half Days</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Unpaid Leave</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Deductions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bulkPayslipData.map(p => (
                  <tr key={p._id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.employee?.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatCurrency(p.grossEarnings)}</td>
                    <td className="px-6 py-4 text-sm text-center">{p.breakdown?.absentDays || 0}</td>
                    <td className="px-6 py-4 text-sm text-center">{p.breakdown?.halfDays || 0}</td>
                    <td className="px-6 py-4 text-sm text-center">{p.breakdown?.unpaidLeaveDays || 0}</td>
                    <td className="px-6 py-4 text-sm text-red-600">{formatCurrency(p.totalDeductions)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">{formatCurrency(p.netSalary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollPage;