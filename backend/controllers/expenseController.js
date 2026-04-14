const Expense = require('../models/Expense');

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
const addExpense = async (req, res) => {
  try {
    const { amount, category, date, description } = req.body;

    if (!amount || !category || !description) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const expense = new Expense({
      user: req.user._id,
      amount,
      category,
      date: date || Date.now(),
      description,
    });

    const savedExpense = await expense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get user expenses (with optional filtering)
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    let query = { user: req.user._id };

    // Filter by Category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by Date range
    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    } else if (req.query.startDate) {
        query.date = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
        query.date = { $lte: new Date(req.query.endDate) };
    }

    const expenses = await Expense.find(query).sort({ date: -1 }); // Newest first
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check for user ownership
    if (expense.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized to update this expense' });
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedExpense);
  } catch (error) {
    // Check if error is due to an invalid ObjectId
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Expense not found' });
    }
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check for user ownership
    if (expense.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized to delete this expense' });
    }

    await expense.deleteOne();

    res.json({ message: 'Expense removed successfully', id: req.params.id });
  } catch (error) {
     // Check if error is due to an invalid ObjectId
     if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Expense not found' });
    }
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  addExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
};
