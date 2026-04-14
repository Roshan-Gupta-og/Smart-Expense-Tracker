# Smart Expense Tracker with AI Insights

A complete, full-stack web application designed to track user expenses and provide intelligent financial insights using Machine Learning.

## 🚀 Features

- **User Authentication**: Secure Login/Signup with JWT and Bcrypt hashing.
- **Expense Tracking**: Add, Edit, Delete, and Filter expenses by category and date.
- **Dashboard**: Visual analytics using charts (Pie & Line) for spending trends.
- **AI Predictions**: Linear Regression model predicts your next month's budget.
- **Smart Insights**: Detects unusual spending spikes and provides intelligent tips.
- **Budgeting**: Set limits per category and get visual alerts when you exceed them.
- **Reports**: Export your transaction history as a CSV file.
- **Theme Support**: Premium Dark Mode and Light Mode toggle.

## 🛠️ Tech Stack

- **Frontend**: React.js (Vite), Recharts, Lucide Icons, Axios.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB.
- **ML Service**: Python, Flask, Pandas, Scikit-learn.

## 🚦 Getting Started

### Prerequisites
- Node.js installed
- Python 3.x installed
- MongoDB running locally (default: `mongodb://localhost:27017/smart_expense_tracker`)

### Installation & Execution

Detailed instructions for each service:

1. **Backend (Node.js)**:
   - Navigate to `/backend`
   - Run `npm install`
   - Start the server: `npm run dev` (Runs on Port 5000)

2. **ML Service (Flask)**:
   - Navigate to `/ml-service`
   - Activate virtual environment: `.\venv\Scripts\activate`
   - Run `python app.py` (Runs on Port 5001)

3. **Frontend (React)**:
   - Navigate to `/frontend`
   - Run `npm install`
   - Start the app: `npm run dev` (Runs on Port 5173)

## 📁 Project Structure

```text
├── backend/            # Express.js Server & MongoDB Models
├── frontend/           # React.js Client side
└── ml-service/         # Python Flask API for ML Predictions
```

## 🎯 Final Year Project (Viva Tips)
- **ML Model**: The prediction uses a Simple Linear Regression algorithm from scikit-learn. It converts your monthly spending into a time-series index to forecast future costs.
- **Data Flow**: Frontend (React) -> Backend (Express) -> ML Service (Flask) -> Backend -> Frontend.
- **Security**: Passwords are never stored in plain text; they are salted and hashed using Bcrypt.

---

**Developed for Excellence.** 💡
