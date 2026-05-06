from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer

def get_preprocessing_pipeline():
    """
    Creates a text preprocessing pipeline using TF-IDF.
    """
    return Pipeline(steps=[
        ('tfidf', TfidfVectorizer(max_features=500, stop_words='english'))
    ])
