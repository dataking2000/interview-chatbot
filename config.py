# -*- coding: utf-8 -*-

import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'ai-interview-chatbot-advanced-2024-prod'
    SESSION_TYPE = 'filesystem'
    PERMANENT_SESSION_LIFETIME = timedelta(hours=2)
    
    # AI Analysis Settings
    MAX_RESPONSE_TIME = 180
    MIN_WORD_COUNT = 25
    IDEAL_WORD_COUNT = 150
    
    # Scoring Weights
    TECHNICAL_WEIGHT = 0.4
    COMMUNICATION_WEIGHT = 0.3
    BEHAVIORAL_WEIGHT = 0.3
    
    # Domains
    SUPPORTED_DOMAINS = [
        'software_engineering', 'data_science', 'product_management',
        'business_analytics', 'digital_marketing', 'finance_banking',
        'healthcare', 'education', 'sales', 'customer_support'
    ]

class ProductionConfig(Config):
    DEBUG = False
    TESTING = False

class DevelopmentConfig(Config):
    DEBUG = True
    DEVELOPMENT = True