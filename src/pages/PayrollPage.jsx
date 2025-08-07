import React, { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';

const PayrollPage = () => {
  const { backendUrl } = useConfig();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [payslipData, setPayslipData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      setError('Please select an employee and a month.');
      return;
    }
    setLoading(true);
    setError('');
    setPayslipData(null);
    try {
      const [year, month] = selectedMonth.split('-');
      const response = await fetch(`${backendUrl}/api/payroll/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ employeeId: selectedEmployee, month: parseInt(month), year: parseInt(year) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate payslip.');
      setPayslipData(data.payslip);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Generate Employee Payslip</h1>

      {/* Filter & Action Bar */}
      <div className="bg-white p-4 rounded-lg shadow">
        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label>
            <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required>
              <option value="">-- Choose Employee --</option>
              {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Month</label>
            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Payslip'}
          </button>
        </form>
      </div>

      {error && <div className="p-4 rounded-lg bg-red-100 text-red-700 text-center">{error}</div>}

      {/* Payslip Display Area */}
      {payslipData && (
        <div className="bg-white p-8 rounded-lg shadow animate-fadeIn">
          <h2 className="text-xl font-bold text-center text-gray-800 mb-6">Payslip for {new Date(payslipData.year, payslipData.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
          <div className="border-b pb-4 mb-4">
            <p><strong>Employee:</strong> {payslipData.employee.name}</p>
            <p><strong>Employee ID:</strong> {payslipData.employee.empId}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-lg">
            <p>Gross Salary:</p><p className="text-right font-semibold">₹ {payslipData.grossSalary.toFixed(2)}</p>
            <p className="text-red-600">Total Deductions:</p><p className="text-right font-semibold text-red-600">- ₹ {payslipData.totalDeductions.toFixed(2)}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xl font-bold mt-4 border-t pt-4">
            <p>Net Salary:</p><p className="text-right text-green-600">₹ {payslipData.netSalary.toFixed(2)}</p>
          </div>

          {payslipData.deductionDetails.length > 0 && (
            <div className="mt-8">
              <h3 className="font-semibold text-gray-700 mb-2">Deduction Details:</h3>
              <div className="overflow-x-auto rounded border">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payslipData.deductionDetails.map((detail, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">{new Date(detail.date).toLocaleDateString()}</td>
                        <td className="px-4 py-2">{detail.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PayrollPage;