import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.linear_model import LinearRegression
from datetime import datetime

app = Flask(__name__)
CORS(app)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # 1. Get input data from Node.js backend
        data = request.json.get('expenses', [])
        print(f"DEBUG: Received predict request with {len(data)} items")
        if not data or len(data) < 2:
            return jsonify({
                'prediction': 0, 
                'message': 'Insufficient data. Need at least 2 months of history for trend analysis.'
            })

        # 2. Preprocess Data
        df = pd.DataFrame(data)
        df['date'] = pd.to_datetime(df['date'])
        
        # Resample to monthly totals to find trends
        monthly_expenses = df.set_index('date').resample('ME')['amount'].sum().reset_index()
        monthly_expenses['month_index'] = np.arange(len(monthly_expenses))
        
        if len(monthly_expenses) < 2:
             return jsonify({
                 'prediction': float(monthly_expenses['amount'].iloc[0]), 
                 'message': 'Only one month of data detected. Cannot calculate trend yet.'
             })

        # --- ML MODEL TRAINING LOGIC ---
        # Features (X): Month Index (0, 1, 2...)
        # Target (y): Expenses amount
        X = monthly_expenses[['month_index']]
        y = monthly_expenses['amount']
        
        # Initialize and Train Linear Regression Model
        model = LinearRegression()
        model.fit(X, y)
        
        # --- PREDICTION LOGIC ---
        # Predict for the next month index
        next_month_index = np.array([[len(monthly_expenses)]])
        prediction = model.predict(next_month_index)[0]
        
        return jsonify({
            'prediction': round(max(0, prediction), 2),
            'accuracy_score': round(model.score(X, y), 2), # R-squared for viva explanation
            'message': 'Success: Prediction generated using Linear Regression model.'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/insights', methods=['POST'])
def insights():
    try:
        data = request.json.get('expenses', [])
        if not data:
            return jsonify({'insights': [], 'suggestions': [], 'highest_category': 'N/A', 'total_spending': 0})

        df = pd.DataFrame(data)
        df['date'] = pd.to_datetime(df['date'])
        
        total_spending = df['amount'].sum()
        
        # 1. Identify highest spending category
        category_spending = df.groupby('category')['amount'].sum()
        highest_category = category_spending.idxmax()
        highest_amount = category_spending.max()
        highest_percent = (highest_amount / total_spending) * 100 if total_spending > 0 else 0
        
        # General insights (Always provided if data exists)
        insights_list = [
            f"Total spending analyzed: ${total_spending:,.2f}",
            f"Highest spending category: {highest_category}",
            f"{highest_category} accounts for {highest_percent:.1f}% of your total budget."
        ]
        
        suggestions = []
        # Rule-based suggestions
        if highest_percent > 30:
            suggestions.append(f"You're spending a significant portion ({highest_percent:.1f}%) on {highest_category.lower()}. Try to diversify your budget.")
        else:
            suggestions.append(f"Great balance! No single category dominates your spending.")
        
        # 2. Detect unusual spending spikes / Compare current vs previous month
        monthly_totals = df.set_index('date').resample('ME')['amount'].sum()
        
        if len(monthly_totals) >= 2:
            last_month_val = monthly_totals.iloc[-1]
            prev_month_val = monthly_totals.iloc[-2]
            
            if prev_month_val > 0:
                change = ((last_month_val - prev_month_val) / prev_month_val) * 100
                if change > 0:
                    insights_list.append(f"Monthly trend: Expenses increased by {change:.1f}% compared to last month.")
                    if change > 20:
                        suggestions.append(f"Unusual spike detected: Your spending increased by {change:.1f}% this month!")
                elif change < 0:
                    insights_list.append(f"Healthy trend: Your expenses decreased by {abs(change):.1f}% compared to last month.")
                    suggestions.append("You saved money compared to last month. Well done!")
            
        return jsonify({
            'insights': insights_list,
            'suggestions': suggestions,
            'highest_category': highest_category,
            'total_spending': round(total_spending, 2)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)
