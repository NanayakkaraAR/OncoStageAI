# -*- coding: utf-8 -*-
"""
Improved Lung Cancer Stage Classification - Enhanced ML Pipeline
Features:
- Better preprocessing with feature scaling
- Multiple model comparison
- Hyperparameter tuning
- Cross-validation
- Better feature engineering
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV, StratifiedKFold
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
import joblib
import warnings
warnings.filterwarnings('ignore')

def main():
    print("="*60)
    print("IMPROVED LUNG CANCER STAGE CLASSIFICATION")
    print("="*60)
    
    print("\n[1/5] Loading dataset...")
    try:
        df = pd.read_csv("combined_dataset.csv")
    except FileNotFoundError:
        print("Error: combined_dataset.csv not found.")
        return
    
    print(f"Dataset shape: {df.shape}")
    print(f"Class distribution:\n{df['Stage'].value_counts()}\n")
    
    # ===== PREPROCESSING =====
    print("[2/5] Preprocessing data...")
    
    # Handle missing values
    df = df.fillna(df.mode().iloc[0])
    
    # Separate features and target
    X = df.drop(["Stage", "Patient_ID"], axis=1)
    y = df["Stage"]
    
    # Identify categorical and numerical columns
    categorical_cols = X.select_dtypes(include=['object']).columns.tolist()
    numerical_cols = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
    
    print(f"Categorical features: {len(categorical_cols)}")
    print(f"Numerical features: {len(numerical_cols)}")
    
    # ===== FEATURE ENGINEERING =====
    # Convert categorical features to numeric
    label_encoders = {}
    for col in categorical_cols:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col])
        label_encoders[col] = le
    
    # Scale numerical features
    scaler = StandardScaler()
    X[numerical_cols] = scaler.fit_transform(X[numerical_cols])
    
    print(f"Preprocessed features shape: {X.shape}")
    
    # ===== TRAIN-TEST SPLIT =====
    print("\n[3/5] Splitting data (80-20 stratified)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"Training set: {X_train.shape[0]}, Test set: {X_test.shape[0]}")
    
    # ===== MODEL TRAINING WITH HYPERPARAMETER TUNING =====
    print("\n[4/5] Training and tuning models...\n")
    
    models = {}
    
    # Model 1: Random Forest with tuning
    print("Training Random Forest with GridSearch...")
    rf_params = {
        'n_estimators': [200, 300],
        'max_depth': [15, 20, 25],
        'min_samples_split': [5, 10],
        'min_samples_leaf': [2, 4]
    }
    rf = GridSearchCV(
        RandomForestClassifier(random_state=42, n_jobs=-1),
        rf_params,
        cv=5,
        scoring='accuracy',
        n_jobs=-1,
        verbose=0
    )
    rf.fit(X_train, y_train)
    print(f"  Best params: {rf.best_params_}")
    print(f"  CV accuracy: {rf.best_score_:.4f}")
    models['Random Forest'] = rf.best_estimator_
    
    # Model 2: Gradient Boosting with tuning
    print("\nTraining Gradient Boosting with GridSearch...")
    gb_params = {
        'n_estimators': [100, 150],
        'learning_rate': [0.01, 0.05, 0.1],
        'max_depth': [5, 7, 9],
        'min_samples_split': [5, 10]
    }
    gb = GridSearchCV(
        GradientBoostingClassifier(random_state=42),
        gb_params,
        cv=5,
        scoring='accuracy',
        n_jobs=-1,
        verbose=0
    )
    gb.fit(X_train, y_train)
    print(f"  Best params: {gb.best_params_}")
    print(f"  CV accuracy: {gb.best_score_:.4f}")
    models['Gradient Boosting'] = gb.best_estimator_
    
    # ===== EVALUATION =====
    print("\n[5/5] Evaluating models on test set...\n")
    print("="*60)
    
    best_model = None
    best_accuracy = 0
    best_model_name = ""
    
    for model_name, model in models.items():
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred, average='weighted')
        
        print(f"\n{model_name}:")
        print(f"  Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
        print(f"  F1-Score (weighted): {f1:.4f}")
        
        if accuracy > best_accuracy:
            best_accuracy = accuracy
            best_model = model
            best_model_name = model_name
    
    print("\n" + "="*60)
    print(f"BEST MODEL: {best_model_name}")
    print(f"BEST ACCURACY: {best_accuracy:.4f} ({best_accuracy*100:.2f}%)")
    print("="*60)
    
    # Detailed evaluation of best model
    print(f"\n{best_model_name} - Detailed Evaluation:")
    y_pred = best_model.predict(X_test)
    
    print("\nConfusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(cm)
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    print("\nTop 15 Feature Importances:")
    feature_importance = pd.Series(best_model.feature_importances_, index=X.columns)
    top_features = feature_importance.sort_values(ascending=False).head(15)
    for i, (feat, imp) in enumerate(top_features.items(), 1):
        print(f"  {i:2d}. {feat:40s} {imp:.6f}")
    
    # ===== SAVE MODEL =====
    print("\n" + "="*60)
    print("Saving model and preprocessing objects...")
    joblib.dump(best_model, 'model.pkl')
    joblib.dump(list(X.columns), 'model_features.pkl')
    joblib.dump(scaler, 'model_scaler.pkl')
    joblib.dump(label_encoders, 'model_label_encoders.pkl')
    print("✓ model.pkl - trained model")
    print("✓ model_features.pkl - feature names")
    print("✓ model_scaler.pkl - feature scaler")
    print("✓ model_label_encoders.pkl - categorical encoders")
    print("="*60)

if __name__ == "__main__":
    main()
