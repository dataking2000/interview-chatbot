#!/usr/bin/env bash
# build.sh

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Creating necessary directories..."
mkdir -p data
mkdir -p static/css
mkdir -p static/js
mkdir -p templates

echo "Downloading NLTK data..."
python -c "
import nltk
try:
    nltk.download('punkt')
    nltk.download('stopwords')
    print('NLTK data downloaded successfully')
except Exception as e:
    print('NLTK download warning:', str(e))
    print('App will use fallback methods')
"

echo "Build completed successfully!"