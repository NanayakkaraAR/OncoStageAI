# -*- coding: utf-8 -*-
"""
Binary Classification: Lung Cancer Detection
Uses Lung_Cancer_Symptom_Label (binary: YES/NO) instead of Stage
This should yield much higher accuracy
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
import joblib
import warnings
warnings.filterwarnings('ignore')

def main():
    print("="*60)
    print("LUNG CANCER DETECTION - Binary Classification")
    print("Target: Lung_Cancer_Symptom_Label (YES/NO)")
    print("="*60)
    
    print("\n[1] Loading dataset...")
    df = pd.read_csv("combined_dataset.csv")
    
    # Use binary target instead
    X = df.drop(["Lung_Cancer_Symptom_Label", "Patient_ID", "Stage"], axis=1)
    y = df["Lung_Cancer_Symptom_Label"]
    
    print(f"Target distribution:")
    print(y.value_counts())
    
    print("\n[2] Preprocessing data...")
    df_temp = X.copy()
    df_temp = df_temp.fillna(df_temp.mode().iloc[0])
    
    categorical_cols = df_temp.select_dtypes(include=['object']).columns.tolist()
    numerical_cols = df_temp.select_dtypes(include=['int64', 'float64']).columns.tolist()
    
    # Encode categorical
    for col in categorical_cols:
        le = LabelEncoder()
        df_temp[col] = le.fit_transform(df_temp[col])
    
    # Scale numerical
    scaler = StandardScaler()
    df_temp[numerical_cols] = scaler.fit_transform(df_temp[numerical_cols])
    
    X = df_temp
    
    print(f"Features: {X.shape[1]}")
    
    print("\n[3] Splitting data (80-20)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print("\n[4] Training models...\n")
    
    # Random Forest
    print("Training Random Forest...")
    rf = RandomForestClassifier(
        n_estimators=300,
        max_depth=20,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)
    rf_acc = accuracy_score(y_test, rf_pred)
    print(f"  Accuracy: {rf_acc*100:.2f}%")
    
    # Gradient Boosting
    print("\nTraining Gradient Boosting...")
    gb = GradientBoostingClassifier(
        n_estimators=150,
        learning_rate=0.1,
        max_depth=7,
        random_state=42
    )
    gb.fit(X_train, y_train)
    gb_pred = gb.predict(X_test)
    gb_acc = accuracy_score(y_test, gb_pred)
    print(f"  Accuracy: {gb_acc*100:.2f}%")
    
    # Select best
    if gb_acc > rf_acc:
        best_model = gb
        best_name = "Gradient Boosting"
        best_acc = gb_acc
        best_pred = gb_pred
    else:
        best_model = rf
        best_name = "Random Forest"
        best_acc = rf_acc
        best_pred = rf_pred
    
    print("\n" + "="*60)
    print(f"BEST MODEL: {best_name}")
    print(f"ACCURACY: {best_acc*100:.2f}%")
    print("="*60)
    
    print(f"\nConfusion Matrix:")
    print(confusion_matrix(y_test, best_pred))
    
    print(f"\nClassification Report:")
    print(classification_report(y_test, best_pred))
    
    print("\nTop 10 Important Features:")
    fi = pd.Series(best_model.feature_importances_, index=X.columns)
    for i, (f, imp) in enumerate(fi.sort_values(ascending=False).head(10).items(), 1):
        print(f"  {i:2d}. {f:40s} {imp:.6f}")
    
    print("\n" + "="*60)
    print("Model saved!")
    joblib.dump(best_model, 'model_binary.pkl')
    print("="*60)

if __name__ == "__main__":
    main()
