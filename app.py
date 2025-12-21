"""
Flask Application Entry Point
Main application file untuk web visualization dashboard
"""
from flask import Flask, render_template, jsonify
import sys
import os
from pathlib import Path

# Add web_app to path
sys.path.insert(0, str(Path(__file__).parent))

from config import Config
from models.data_loader import DataLoader
from controllers.main_controller import MainController
from controllers.api_controller import APIController

def create_app(config_class=Config):
    """Application factory pattern untuk membuat Flask app"""
    app = Flask(__name__, static_folder='static', static_url_path='/static')
    app.config.from_object(config_class)
    
    # Disable debug mode untuk production (Vercel)
    if os.environ.get('VERCEL'):
        app.config['DEBUG'] = False
    
    # Initialize data loader
    data_loader = DataLoader()
    
    # Initialize controllers
    main_controller = MainController(data_loader)
    api_controller = APIController(data_loader)
    
    # Register routes
    app.register_blueprint(main_controller.bp)
    app.register_blueprint(api_controller.bp, url_prefix='/api')
    
    return app

# Create app instance for Vercel
app = create_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

