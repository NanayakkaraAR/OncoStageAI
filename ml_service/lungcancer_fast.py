# -*- coding: utf-8 -*-
"""
Fast Lung Cancer Stage Classification - Optimized Parameters
(No GridSearch - uses proven optimal parameters)
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
import joblib
import warnings
warnings.filterwarnings('ignore')

def main():
    print("="*60)
    print("FAST LUNG CANCER STAGE CLASSIFICATION")
    print("(Optimized Parameters)")
    print("="*60)
    
    print("\n[1/4] Loading dataset...")
    try:
        df = pd.read_csv("combined_dataset.csv")
    except FileNotFoundError:
        print("Error: combined_dataset.csv not found.")
        return
    
    print(f"Dataset shape: {df.shape}")
    print(f"Class distribution:\n{df['Stage'].value_counts()}\n")
    
    # ===== PREPROCESSING =====
    print("[2/4] Preprocessing data...")
    
    # Handle missing values
    df = df.fillna(df.mode().iloc[0])
    
    # Separate features and target
    X = df.drop(["Stage", "Patient_ID"], axis=1)
    y = df["Stage"]
    
    # Identify categorical and numerical columns
    categorical_cols = X.select_dtypes(include=['object']).columns.tolist()
    numerical_cols = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
    
    # Convert categorical features to numeric
    label_encoders = {}
    for col in categorical_cols:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col])
        label_encoders[col] = le
    
    # Scale numerical features
    scaler = StandardScaler()
    X[numerical_cols] = scaler.fit_transform(X[numerical_cols])
    
    print(f"Preprocessed: {len(categorical_cols)} categorical + {len(numerical_cols)} numerical features")
    
    # ===== TRAIN-TEST SPLIT =====
    print("\n[3/4] Splitting data (80-20 stratified)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # ===== TRAINING WITH OPTIMIZED PARAMETERS =====
    print("[4/4] Training optimized models...\n")
    
    print("Training Random Forest (optimized params)...")
    rf = RandomForestClassifier(
        n_estimators=300,
        max_depth=20,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
        class_weight='balanced'
    )
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)
    rf_acc = accuracy_score(y_test, rf_pred)
    rf_f1 = f1_score(y_test, rf_pred, average='weighted')
    print(f"  ✓ Accuracy: {rf_acc*100:.2f}%")
    print(f"  ✓ F1-Score: {rf_f1:.4f}")
    
    print("\nTraining Gradient Boosting (optimized params)...")
    gb = GradientBoostingClassifier(
        n_estimators=150,
        learning_rate=0.05,
        max_depth=7,
        min_samples_split=5,
        random_state=42
    )
    gb.fit(X_train, y_train)
    gb_pred = gb.predict(X_test)
    gb_acc = accuracy_score(y_test, gb_pred)
    gb_f1 = f1_score(y_test, gb_pred, average='weighted')
    print(f"  ✓ Accuracy: {gb_acc*100:.2f}%")
    print(f"  ✓ F1-Score: {gb_f1:.4f}")
    
    # Select best model
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
    
    # Detailed results
    print(f"\n{best_name} - Detailed Results:")
    print("\nConfusion Matrix:")
    cm = confusion_matrix(y_test, best_pred)
    print(cm)
    
    print("\nPer-Class Metrics:")
    print(classification_report(y_test, best_pred))
    
    print("\nTop 15 Important Features:")
    feature_imp = pd.Series(best_model.feature_importances_, index=X.columns)
    top_15 = feature_imp.sort_values(ascending=False).head(15)
    for i, (feat, imp) in enumerate(top_15.items(), 1):
        print(f"  {i:2d}. {feat:40s} {imp:.6f}")
    
    # Save models
    print("\n" + "="*60)
    print("Saving models and preprocessors...")
    joblib.dump(best_model, 'model.pkl')
    joblib.dump(list(X.columns), 'model_features.pkl')
    joblib.dump(scaler, 'model_scaler.pkl')
    joblib.dump(label_encoders, 'model_label_encoders.pkl')
    print("✓ Models saved successfully!")
    print("="*60)

if __name__ == "__main__":
    main()
