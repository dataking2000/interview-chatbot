#!/usr/bin/env bash
# build.sh

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Downloading NLTK data..."
python -c "
import nltk
nltk.download('punkt')
nltk.download('vader_lexicon')
nltk.download('stopwords')
print('NLTK data downloaded successfully')
"

echo "Build completed successfully!"