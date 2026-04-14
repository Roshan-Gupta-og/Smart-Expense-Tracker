import React, { useState, useEffect } from 'react';
import { 
    Loader2, AlertTriangle, CheckCircle2, DollarSign, PieChart as PieIcon, 
    ArrowUp, ArrowDown, Sparkles, TrendingUp
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import api from '../api';
import './Analytics.css';

const CATEGORIES = ['Food', 'Travel', 'Rent', 'Shopping', 'Utilities', 'Entertainment', 'Others'];

const Analytics = () => {
    const [loading, setLoading] = useState(true);
    const [expenses, setExpenses] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [insights, setInsights] = useState({ insights: [], suggestions: [] });
    const [newBudget, setNewBudget] = useState({ category: 'Food', limit: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [expRes, budRes, insRes] = await Promise.all([
                api.get('/expenses'),
                api.get('/budgets'),
                api.get('/ai/insights')
            ]);
            setExpenses(expRes.data);
            setBudgets(budRes.data);
            setInsights(insRes.data);
        } catch (err) {
            console.error('Error fetching analytics data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSetBudget = async (e) => {
        e.preventDefault();
        try {
            await api.post('/budgets', newBudget);
            setNewBudget({ category: 'Food', limit: '' });
            fetchData();
        } catch (err) {
            console.error('Error setting budget:', err);
        }
    };

    // Calculate chart and budget data
    const getBudgetData = () => {
        const catSpending = {};
        expenses.forEach(e => {
            catSpending[e.category] = (catSpending[e.category] || 0) + e.amount;
        });

        return CATEGORIES.map(cat => {
            const budget = budgets.find(b => b.category === cat);
            const spent = catSpending[cat] || 0;
            const limit = budget ? budget.limit : 0;
            const percent = limit > 0 ? (spent / limit) * 100 : 0;
            
            return {
                name: cat,
                spent,
                limit,
                percent,
                status: percent > 100 ? 'exceeded' : percent > 80 ? 'warning' : 'ok'
            };
        }).filter(b => b.limit > 0 || b.spent > 0);
    };

    if (loading) {
        return (
            <div className="loader-container">
                <Loader2 className="spinner" size={48} />
                <p>Generating AI Insights...</p>
            </div>
        );
    }

    const budgetStats = getBudgetData();

    return (
        <div className="analytics-container">
            <header className="page-header">
                <div>
                    <h1 className="title">AI Insights & Analytics</h1>
                    <p className="subtitle">Deep dive into your spending habits and budget status</p>
                </div>
            </header>

            <div className="analytics-grid">
                {/* AI Suggestions Card */}
                <div className="glass-panel main-ai-card">
                    <div className="card-header">
                        <Sparkles size={24} color="#c4b5fd" />
                        <h3>AI Financial Analysis</h3>
                    </div>
                    
                    <div className="insights-section">
                        <h4>Financial Discovery</h4>
                        <div className="insights-list">
                            {insights.insights && insights.insights.length > 0 ? (
                                insights.insights.map((ins, i) => (
                                    <div key={i} className="insight-item">
                                        <TrendingUp size={16} color="#c4b5fd" />
                                        <span>{ins}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="subtitle">Add more transactions to see detailed patterns.</p>
                            )}
                        </div>
                    </div>

                    <div className="suggestions-section">
                        <h4>Smart Advice</h4>
                        <div className="suggestions-list">
                            {insights.suggestions && insights.suggestions.length > 0 ? (
                                insights.suggestions.map((s, i) => (
                                    <div key={i} className="suggestion-item">
                                        <CheckCircle2 size={16} color="#10b981" />
                                        <p>{s}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="subtitle">Your spending seems optimal. Keep it up!</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Set Budget Form */}
                <div className="glass-panel budget-form-card">
                    <div className="card-header">
                        <DollarSign size={24} color="#3b82f6" />
                        <h3>Set Budget Limit</h3>
                    </div>
                    <form onSubmit={handleSetBudget} className="budget-form">
                        <select 
                            value={newBudget.category}
                            onChange={(e) => setNewBudget({...newBudget, category: e.target.value})}
                        >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input 
                            type="number" 
                            placeholder="Limit Amount ($)" 
                            required
                            value={newBudget.limit}
                            onChange={(e) => setNewBudget({...newBudget, limit: e.target.value})}
                        />
                        <button type="submit" className="primary-btn">Set Limit</button>
                    </form>
                </div>
            </div>

            <div className="budgets-section glass-panel">
                <div className="card-header">
                    <PieIcon size={24} color="#10b981" />
                    <h3>Category Budget Status</h3>
                </div>
                
                <div className="budget-list">
                    {budgetStats.map((stat, i) => (
                        <div key={i} className="budget-item">
                            <div className="budget-info">
                                <span className="cat-name">{stat.name}</span>
                                <span className="spent-status">
                                    ${stat.spent.toFixed(2)} / ${stat.limit > 0 ? stat.limit.toFixed(2) : 'No limit'}
                                </span>
                            </div>
                            <div className="progress-bar-bg">
                                <div 
                                    className={`progress-bar-fill ${stat.status}`}
                                    style={{ width: `${Math.min(stat.percent, 100)}%` }}
                                ></div>
                            </div>
                            <div className="budget-footer-info">
                                {stat.status === 'exceeded' ? (
                                    <span className="error-text"><AlertTriangle size={14} /> Exceeded by ${ (stat.spent - stat.limit).toFixed(2) }</span>
                                ) : (
                                    <span className="success-text"><CheckCircle2 size={14} /> ${ (stat.limit - stat.spent).toFixed(2) } remaining</span>
                                )}
                            </div>
                        </div>
                    ))}
                    {budgetStats.length === 0 && <p className="subtitle">No budgets set. Set categories limits above to track progress.</p>}
                </div>
            </div>

            <div className="chart-section glass-panel">
                <h3>Spending vs Budget Comparison</h3>
                <div className="bar-chart-wrapper">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={budgetStats}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip 
                                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                            />
                            <Bar dataKey="spent" name="Spent" radius={[4, 4, 0, 0]}>
                                {budgetStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.status === 'exceeded' ? '#ef4444' : '#3b82f6'} />
                                ))}
                            </Bar>
                            <Bar dataKey="limit" name="Limit" fill="rgba(255,255,255,0.1)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
