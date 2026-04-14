import React, { useState, useEffect } from 'react';
import { 
    Plus, Search, Filter, Trash2, Edit2, X, Download, Loader2, Calendar, Tag, DollarSign, FileText, FileDown
} from 'lucide-react';
import api from '../api';
import './Transactions.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const CATEGORIES = ['Food', 'Travel', 'Rent', 'Shopping', 'Utilities', 'Entertainment', 'Others'];

const Transactions = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        amount: '',
        category: 'Food',
        date: new Date().toISOString().split('T')[0],
        description: ''
    });
    const [filters, setFilters] = useState({
        category: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchExpenses();
    }, [filters]);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams(filters).toString();
            const { data } = await api.get(`/expenses?${query}`);
            setExpenses(data);
        } catch (err) {
            console.error('Error fetching expenses:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/expenses/${editingId}`, formData);
            } else {
                await api.post('/expenses', formData);
            }
            setIsModalOpen(false);
            setEditingId(null);
            setFormData({
                amount: '',
                category: 'Food',
                date: new Date().toISOString().split('T')[0],
                description: ''
            });
            fetchExpenses();
        } catch (err) {
            console.error('Error saving expense:', err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            try {
                await api.delete(`/expenses/${id}`);
                fetchExpenses();
            } catch (err) {
                console.error('Error deleting expense:', err);
            }
        }
    };

    const handleEdit = (exp) => {
        setEditingId(exp._id);
        setFormData({
            amount: exp.amount,
            category: exp.category,
            date: exp.date.split('T')[0],
            description: exp.description
        });
        setIsModalOpen(true);
    };

    const downloadReport = () => {
        const csvRows = [
            ['Date', 'Category', 'Description', 'Amount'],
            ...expenses.map(e => [new Date(e.date).toLocaleDateString(), e.category, e.description, e.amount])
        ];
        const csvContent = csvRows.map(e => e.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'expense_report.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.text('Smart Expense Report', 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
        
        const tableData = expenses.map(e => [
            new Date(e.date).toLocaleDateString(),
            e.category,
            e.description,
            `$${e.amount.toFixed(2)}`
        ]);

        doc.autoTable({
            startY: 30,
            head: [['Date', 'Category', 'Description', 'Amount']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] }
        });

        doc.save('expense_report.pdf');
    };

    return (
        <div className="transactions-container">
            <header className="page-header">
                <div>
                    <h1 className="title">Transactions</h1>
                    <p className="subtitle">Manage and track all your spending</p>
                </div>
                <div className="header-actions">
                    <button className="secondary-btn" onClick={downloadReport} title="Download CSV">
                        <Download size={18} />
                    </button>
                    <button className="secondary-btn" onClick={downloadPDF} title="Download PDF">
                        <FileDown size={18} />
                    </button>
                    <button className="primary-btn" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} />
                        <span>New Expense</span>
                    </button>
                </div>
            </header>

            <div className="filter-bar glass-panel">
                <div className="filter-group">
                    <Filter size={18} />
                    <select 
                        value={filters.category} 
                        onChange={(e) => setFilters({...filters, category: e.target.value})}
                    >
                        <option value="">All Categories</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="filter-group">
                    <Calendar size={18} />
                    <input 
                        type="date" 
                        value={filters.startDate} 
                        onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                        placeholder="Start Date"
                    />
                </div>
                <div className="filter-group">
                    <Calendar size={18} />
                    <input 
                        type="date" 
                        value={filters.endDate} 
                        onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                        placeholder="End Date"
                    />
                </div>
                {(filters.category || filters.startDate || filters.endDate) && (
                    <button className="clear-filter" onClick={() => setFilters({category: '', startDate: '', endDate: ''})}>
                        Clear
                    </button>
                )}
            </div>

            <div className="transactions-content glass-panel">
                {loading ? (
                    <div className="table-loader">
                        <Loader2 className="spinner" />
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Amount</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((exp) => (
                                    <tr key={exp._id}>
                                        <td>{new Date(exp.date).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`cat-tag ${exp.category.toLowerCase()}`}>
                                                {exp.category}
                                            </span>
                                        </td>
                                        <td>{exp.description}</td>
                                        <td className="amount-cell">-${exp.amount.toFixed(2)}</td>
                                        <td>
                                            <div className="action-btns">
                                                <button onClick={() => handleEdit(exp)} className="edit-icon">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(exp._id)} className="delete-icon">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {expenses.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="empty-state">No transactions found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel">
                        <div className="modal-header">
                            <h3>{editingId ? 'Edit Expense' : 'Add New Expense'}</h3>
                            <button className="close-btn" onClick={() => { setIsModalOpen(false); setEditingId(null); }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Amount ($)</label>
                                <div className="input-with-icon">
                                    <DollarSign size={18} />
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        required 
                                        value={formData.amount}
                                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <div className="input-with-icon">
                                    <Tag size={18} />
                                    <select 
                                        value={formData.category}
                                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                                <div className="input-with-icon">
                                    <Calendar size={18} />
                                    <input 
                                        type="date" 
                                        required 
                                        value={formData.date}
                                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <div className="input-with-icon">
                                    <FileText size={18} />
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        placeholder="e.g. Weekly Groceries"
                                    />
                                </div>
                            </div>
                            <button type="submit" className="primary-btn submit-btn">
                                {editingId ? 'Update Expense' : 'Add Expense'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Transactions;
