import streamlit as st
import joblib
import pandas as pd

st.title("Breast Cancer Prediction (PCA + Logistic Regression)")

model = joblib.load("pipeline_scaler_pca_logreg.pkl")

feature_names = [
    "mean radius","mean texture","mean perimeter","mean area","mean smoothness",
    "mean compactness","mean concavity","mean concave points","mean symmetry","mean fractal dimension",
    "radius error","texture error","perimeter error","area error","smoothness error",
    "compactness error","concavity error","concave points error","symmetry error","fractal dimension error",
    "worst radius","worst texture","worst perimeter","worst area","worst smoothness",
    "worst compactness","worst concavity","worst concave points","worst symmetry","worst fractal dimension"
]

st.write("Enter feature values")

inputs = []
for name in feature_names:
    value = st.number_input(name, value=0.0)
    inputs.append(value)

if st.button("Predict"):
    df = pd.DataFrame([inputs], columns=feature_names)
    pred = model.predict(df)[0]
    prob = model.predict_proba(df)[0][pred]

    if pred == 1:
        st.success(f"Prediction: BENIGN ({prob:.2f})")
    else:
        st.error(f"Prediction: MALIGNANT ({prob:.2f})")
