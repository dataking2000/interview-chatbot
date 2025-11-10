#!/usr/bin/env bash
# build.sh

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Creating necessary directories..."
mkdir -p data

echo "Downloading NLTK data..."
python -c "
import nltk
nltk.download('punkt')
nltk.download('stopwords')
print('NLTK data downloaded successfully')
"

echo "Build completed successfully!"