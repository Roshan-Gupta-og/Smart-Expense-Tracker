const axios = require('axios');
const Expense = require('../models/Expense');

// @desc    Get AI prediction for next month's total expense
// @route   GET /api/ai/predict
// @access  Private
const getPrediction = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user._id });

    if (!expenses || expenses.length === 0) {
      return res.json({ prediction: 0, message: 'No expenses found to generate prediction.' });
    }

    console.log(`Sending ${expenses.length} expenses to ML Predict service at http://127.0.0.1:5001/predict`);
    const mlResponse = await axios.post('http://127.0.0.1:5001/predict', {
      expenses: expenses.map(exp => ({
        amount: exp.amount,
        date: exp.date,
        category: exp.category
      }))
    });
    console.log("Prediction received:", mlResponse.data);

    res.json(mlResponse.data);
  } catch (error) {
    console.error('ML Prediction Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error communicating with ML service', error: error.message });
  }
};

// @desc    Get AI insights and smart suggestions
// @route   GET /api/ai/insights
// @access  Private
const getInsights = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user._id });

    if (!expenses || expenses.length === 0) {
      console.log("No expenses found for user, returning empty insights.");
      return res.json({ insights: [], suggestions: [], highest_category: 'N/A', total_spending: 0 });
    }

    console.log(`Sending ${expenses.length} expenses to ML Insights service at http://127.0.0.1:5001/insights`);
    const mlResponse = await axios.post('http://127.0.0.1:5001/insights', {
      expenses: expenses.map(exp => ({
        amount: exp.amount,
        date: exp.date,
        category: exp.category
      }))
    });
    console.log("Insights received:", mlResponse.data);

    res.json(mlResponse.data);
  } catch (error) {
    console.error('ML Insights Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Error communicating with ML service', error: error.message });
  }
};

module.exports = {
  getPrediction,
  getInsights
};
