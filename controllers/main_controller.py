"""
Main Controller
Menangani routes untuk halaman utama dan views
"""
from flask import Blueprint, render_template
from models.data_normalizer import DataNormalizer


class MainController:
    """Controller untuk main routes"""
    
    def __init__(self, data_loader):
        """Initialize controller dengan data loader"""
        self.data_loader = data_loader
        self.bp = Blueprint('main', __name__)
        self._register_routes()
    
    def _register_routes(self):
        """Register all routes"""
        self.bp.add_url_rule('/', 'index', self.index, methods=['GET'])
    
    def index(self):
        """Render main dashboard page"""
        # Get initial data for the page
        local_authorities = self.data_loader.get_local_authorities()
        years = self.data_loader.get_years()
        benefit_types = self.data_loader.get_benefit_types()
        
        # Get benefit type labels
        from config import Config
        benefit_labels = {
            bt: Config.BENEFIT_TYPES.get(bt, bt)
            for bt in benefit_types
        }
        
        # Find matching property in GeoJSON
        normalizer = DataNormalizer()
        geojson = self.data_loader.geojson
        matching_property = normalizer.find_matching_property(
            geojson,
            local_authorities
        )
        
        return render_template(
            'index.html',
            local_authorities=local_authorities,
            years=years,
            benefit_types=benefit_types,
            benefit_labels=benefit_labels,
            matching_property=matching_property,
            min_year=min(years),
            max_year=max(years)
        )

