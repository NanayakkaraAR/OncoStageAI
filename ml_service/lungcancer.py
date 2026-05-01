# -*- coding: utf-8 -*-
"""LungCancer.py

# Lung Cancer Stage Classification - Full ML Pipeline

**Project**: Lung Cancer Detection System  
**Goal**: Build a machine learning model to classify lung cancer into four stages (Stage I–IV) based on patient clinical data, enabling early diagnosis and assisting medical decision-making.  
"""

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib

def main():
    print("Loading dataset...")
    try:
        df = pd.read_csv("combined_dataset.csv")
    except FileNotFoundError:
        print("Error: combined_dataset.csv not found in the current directory.")
        print("Please ensure the dataset file is present.")
        return

    print("Dataset loaded successfully.")
    print("Class distribution for 'Stage':")
    print(df['Stage'].value_counts())

    print("\nPreprocessing data...")
    X = df.drop("Stage", axis=1)
    y = df["Stage"]

    if "Patient_ID" in X.columns:
        X = X.drop("Patient_ID", axis=1)

    for column in X.columns:
        if X[column].dtype == 'object':
            X[column] = X[column].map({"Yes": 1, "No": 0})

    # Handle any remaining missing values if map created NaNs
    if X.isnull().sum().sum() > 0:
        print("\nWarning: NaNs found in features after mapping. Filling with 0.")
        X = X.fillna(0)

    print("\nSplitting data...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print("Training RandomForest model...")
    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(X_train, y_train)

    print("Evaluating model...")
    y_pred = model.predict(X_test)
    
    print("\nAccuracy:", accuracy_score(y_test, y_pred))
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    print("\nTop 10 Feature Importances:")
    feature_importance = pd.Series(model.feature_importances_, index=X.columns)
    print(feature_importance.sort_values(ascending=False).head(10))

    print("\nSaving model to model.pkl...")
    joblib.dump(model, 'model.pkl')
    # Save the feature names so the API knows the exact expected input structure
    joblib.dump(list(X.columns), 'model_features.pkl')
    print("Model saved successfully!")

if __name__ == "__main__":
    main()