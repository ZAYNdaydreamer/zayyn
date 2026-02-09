import joblib
import pandas as pd

model = joblib.load("pipeline_scaler_pca_logreg.pkl")

feature_names = [
    "mean radius","mean texture","mean perimeter","mean area","mean smoothness",
    "mean compactness","mean concavity","mean concave points","mean symmetry","mean fractal dimension",
    "radius error","texture error","perimeter error","area error","smoothness error",
    "compactness error","concavity error","concave points error","symmetry error","fractal dimension error",
    "worst radius","worst texture","worst perimeter","worst area","worst smoothness",
    "worst compactness","worst concavity","worst concave points","worst symmetry","worst fractal dimension"
]

sample = pd.DataFrame([[0.0]*30], columns=feature_names)

pred = model.predict(sample)
prob = model.predict_proba(sample)

print("Prediction:", pred)
print("Probability:", prob)
