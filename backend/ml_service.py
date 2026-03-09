import numpy as np
import os
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "Epilepsy.h5")

# Global model reference
_model = None


def get_model():
    """Lazy-load the Keras model."""
    global _model
    if _model is None:
        try:
            from tensorflow.keras.models import load_model
            _model = load_model(MODEL_PATH)
            print(f"✅ Model loaded from {MODEL_PATH}")
        except Exception as e:
            print(f"⚠️ Could not load model: {e}")
            print("Running in demo mode — predictions will be simulated.")
            _model = "demo"
    return _model


def preprocess_eeg_data(raw_data: list) -> np.ndarray:
    """
    Preprocess EEG data following the notebook's approach:
    - Expects 178 data points
    - Subsample every 4th point
    - Normalize (zero mean, unit variance)
    - Reshape for LSTM input
    """
    data = np.array(raw_data, dtype=np.float64)

    if len(data.shape) == 1:
        data = data.reshape(1, -1)

    # Ensure we have 178 features
    if data.shape[1] != 178:
        raise ValueError(f"Expected 178 features, got {data.shape[1]}")

    # Reshape to (batch, 178, 1)
    data = data.reshape(-1, 178, 1)

    # Subsample every 4th point (as in the notebook)
    data_subsampled = data[:, ::4, :]

    # Normalize
    mean = data_subsampled.mean()
    std = data_subsampled.std()
    if std == 0:
        std = 1.0
    data_normalized = (data_subsampled - mean) / std

    return data_normalized


def predict_seizure(eeg_values: list) -> dict:
    """
    Run seizure prediction on EEG data.
    Returns: {prediction, confidence, class_probabilities, signal_stats}
    """
    model = get_model()

    raw = np.array(eeg_values, dtype=np.float64)

    # Compute signal statistics
    signal_stats = {
        "mean": float(np.mean(raw)),
        "std": float(np.std(raw)),
        "min": float(np.min(raw)),
        "max": float(np.max(raw)),
        "range": float(np.max(raw) - np.min(raw)),
        "median": float(np.median(raw)),
        "num_points": len(eeg_values),
    }

    if model == "demo":
        # Simulate a prediction in demo mode
        is_seizure = bool(np.random.random() > 0.5)
        confidence = float(np.random.uniform(0.75, 0.99))
        return {
            "prediction": "Seizure" if is_seizure else "Non-Seizure",
            "confidence": round(confidence, 4),
            "class_probabilities": {
                "seizure": round(confidence if is_seizure else 1 - confidence, 4),
                "non_seizure": round(1 - confidence if is_seizure else confidence, 4),
            },
            "signal_stats": signal_stats,
            "demo_mode": True,
        }

    # Real prediction
    try:
        preprocessed = preprocess_eeg_data(eeg_values)
        raw_pred = model.predict(preprocessed, verbose=0)

        # Model outputs 5 classes, argmax+1 gives class label
        predicted_class = int(np.argmax(raw_pred[0])) + 1

        # Binary: class 1 = seizure, rest = non-seizure
        is_seizure = predicted_class == 1

        # Confidence: probability of the predicted class
        class_probs = raw_pred[0].tolist()
        confidence = float(max(class_probs))

        # Seizure probability specifically
        seizure_prob = float(class_probs[0]) if len(class_probs) > 0 else 0.0

        return {
            "prediction": "Seizure" if is_seizure else "Non-Seizure",
            "confidence": round(confidence, 4),
            "seizure_probability": round(seizure_prob, 4),
            "class_probabilities": {
                "seizure": round(seizure_prob, 4),
                "non_seizure": round(1 - seizure_prob, 4),
            },
            "predicted_class": predicted_class,
            "raw_probabilities": [round(p, 4) for p in class_probs],
            "signal_stats": signal_stats,
            "demo_mode": False,
        }
    except Exception as e:
        return {
            "prediction": "Error",
            "confidence": 0.0,
            "error": str(e),
            "signal_stats": signal_stats,
            "demo_mode": False,
        }
