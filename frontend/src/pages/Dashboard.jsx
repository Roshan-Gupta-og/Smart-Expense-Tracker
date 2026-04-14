import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { TrendingUp, CreditCard, ArrowUpRight, ArrowDownRight, DollarSign, Loader2, Sparkles, AlertCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import api from '../api';
import './Dashboard.css';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expenses, setExpenses] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [prediction, setPrediction] = useState(null);
    const [aiInsights, setAiInsights] = useState(null);
    const [summary, setSummary] = useState({
        totalThisMonth: 0,
        highestCategory: 'N/A'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async (isManual = false) => {
        if (isManual) setRefreshing(true);
        else setLoading(true);
        try {
            // Fetch everything, but don't let one failure break the whole page
            const results = await Promise.allSettled([
                api.get('/expenses'),
                api.get('/ai/predict'),
                api.get('/ai/insights'),
                api.get('/budgets')
            ]);

            const [expRes, predRes, insRes, budRes] = results.map(r => r.status === 'fulfilled' ? r.value : null);

            if (expRes) {
                const allExpenses = expRes.data;
                setExpenses(allExpenses);
                
                // Calculate summary stats immediately from the fetched data
                const now = new Date();
                const currentMonthExpenses = allExpenses.filter(e => {
                    const d = new Date(e.date);
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                });

                const total = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
                
                setSummary({
                    totalThisMonth: total,
                    highestCategory: (insRes && insRes.data.highest_category) || 'N/A'
                });
            }

            if (predRes) setPrediction(predRes.data);
            if (insRes) setAiInsights(insRes.data);
            if (budRes) setBudgets(budRes.data);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Calculate Budget Warnings
    const getBudgetWarnings = () => {
        const catSpending = {};
        expenses.forEach(e => {
            catSpending[e.category] = (catSpending[e.category] || 0) + e.amount;
        });

        return budgets.map(b => {
            const spent = catSpending[b.category] || 0;
            const percent = (spent / b.limit) * 100;
            return { category: b.category, spent, limit: b.limit, percent };
        }).filter(b => b.percent > 80);
    };

    const budgetWarnings = getBudgetWarnings();

    // Prepare chart data
    const getCategoryData = () => {
        const categories = {};
        expenses.forEach(e => {
            categories[e.category] = (categories[e.category] || 0) + e.amount;
        });
        return Object.keys(categories).map((name, i) => ({
            name,
            value: categories[name],
            color: COLORS[i % COLORS.length]
        }));
    };

    const getTrendData = () => {
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const trend = last7Days.map(date => {
            const amount = expenses
                .filter(e => e.date.startsWith(date))
                .reduce((sum, e) => sum + e.amount, 0);
            return {
                date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
                amount
            };
        });
        return trend;
    };

    if (loading) {
        return (
            <div className="loader-container">
                <Loader2 className="spinner" size={48} />
                <p>Analyzing your finances...</p>
            </div>
        );
    }

    const categoryData = getCategoryData();
    const trendData = getTrendData();

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div>
                    <h1 className="title">Overview</h1>
                    <p className="subtitle">Real-time spending analysis & AI predictions</p>
                </div>
                <div className="header-actions" style={{display: 'flex', gap: '1rem'}}>
                    <button 
                        className={`secondary-btn ${refreshing ? 'spinning' : ''}`} 
                        onClick={() => fetchData(true)}
                        title="Refresh Data"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '10px', color: '#fff', cursor: 'pointer' }}
                    >
                        <RefreshCw size={18} className={refreshing ? "spinner" : ""} />
                    </button>
                    <button className="add-expense-btn" onClick={() => window.location.href='/transactions'}>
                        <CreditCard size={18} />
                        <span>Manage Expenses</span>
                    </button>
                </div>
            </header>

            <div className="summary-grid">
                <div className="summary-card glass-panel highlight-card">
                    <div className="card-icon blue-bg">
                        <DollarSign size={24} color="#3b82f6" />
                    </div>
                    <div className="card-info">
                        <h3>Total Monthly Expense</h3>
                        <div className="align-amount">
                            <span className="amount">${summary.totalThisMonth.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="summary-card glass-panel">
                    <div className="card-icon purple-bg">
                        <TrendingUp size={24} color="#8b5cf6" />
                    </div>
                    <div className="card-info">
                        <h3>Highest Spending</h3>
                        <div className="align-amount">
                            <span className="amount">{summary.highestCategory}</span>
                        </div>
                    </div>
                </div>
                
                <div className="summary-card ai-insight-card glass-panel">
                    <div className="ai-sparkles">
                        <Sparkles size={16} /> AI Prediction
                    </div>
                    <p>Next month's projected spending:</p>
                    <span className="amount predictive">
                        {prediction?.prediction ? `$${prediction.prediction.toFixed(2)}` : 'N/A'}
                    </span>
                    <p className="small-text">{prediction?.message}</p>
                </div>
            </div>

            {/* Budget Health / Warnings */}
            <div className="budget-alerts-grid">
                {budgetWarnings.length > 0 ? (
                    <div className="warning-panel glass-panel">
                        <div className="section-header">
                            <AlertCircle size={20} color="#ef4444" />
                            <h3>Budget Alerts</h3>
                        </div>
                        <div className="alerts-container">
                            {budgetWarnings.map((w, i) => (
                                <div key={i} className="alert-item">
                                    <span className="alert-cat">{w.category}</span>
                                    <span className="alert-msg">
                                        {w.percent >= 100 ? 'Limit exceeded!' : 'Approaching limit (80%+)'}
                                    </span>
                                    <div className="alert-progress">
                                        <div 
                                            className={`progress-fill ${w.percent >= 100 ? 'danger' : 'warning'}`} 
                                            style={{width: `${Math.min(w.percent, 100)}%`}}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : budgets.length > 0 && (
                    <div className="success-panel glass-panel">
                        <div className="section-header">
                            <ShieldCheck size={20} color="#10b981" />
                            <h3>Budget Health</h3>
                        </div>
                        <p className="subtitle">All your category expenses are within limits. Great job!</p>
                    </div>
                )}
            </div>

            <div className="charts-grid">
                <div className="chart-card glass-panel">
                    <h3>Recent weekly Trend</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={100}>
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`}/>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff'}}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="amount" 
                                    stroke="#3b82f6" 
                                    strokeWidth={3} 
                                    dot={{ fill: '#3b82f6', r: 4 }}
                                    activeDot={{ r: 8, stroke: 'rgba(59, 130, 246, 0.4)', strokeWidth: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card glass-panel">
                    <h3>Category Breakdown</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={100}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff'}}
                                />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {aiInsights?.suggestions?.length > 0 && (
                <div className="ai-suggestions-section glass-panel">
                    <div className="section-header">
                        <Sparkles size={20} color="#c4b5fd" />
                        <h3>Smart Recommendations</h3>
                    </div>
                    <ul className="suggestions-list">
                        {aiInsights.suggestions.map((s, i) => (
                            <li key={i}>{s}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="transactions-section glass-panel">
                <div className="section-header">
                    <h3>Recent Transactions</h3>
                    <button className="view-all-btn" onClick={() => window.location.href='/transactions'}>View All</button>
                </div>
                
                <div className="transactions-list">
                    {expenses.slice(0, 5).map((tx) => (
                        <div key={tx._id} className="transaction-item">
                            <div className="tx-left">
                                <div className="tx-icon" style={{
                                    backgroundColor: `${COLORS[Math.floor(Math.random() * COLORS.length)]}15`,
                                    color: '#fff'
                                }}>
                                    <CreditCard size={20} />
                                </div>
                                <div className="tx-details">
                                    <h4>{tx.description}</h4>
                                    <span className="tx-category">{tx.category} • {new Date(tx.date).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="tx-right">
                                <span className="tx-amount">-${tx.amount.toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                    {expenses.length === 0 && <p className="subtitle">No recent transactions.</p>}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
