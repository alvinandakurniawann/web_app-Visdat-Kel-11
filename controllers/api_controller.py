"""
API Controller
Menangani API endpoints untuk data
"""
from flask import Blueprint, jsonify, request
from models.data_normalizer import DataNormalizer


class APIController:
    """Controller untuk API endpoints"""
    
    def __init__(self, data_loader):
        """Initialize controller dengan data loader"""
        self.data_loader = data_loader
        self.bp = Blueprint('api', __name__)
        self._register_routes()
    
    def _register_routes(self):
        """Register all API routes"""
        self.bp.add_url_rule('/map-data', 'map_data', self.get_map_data, methods=['GET'])
        self.bp.add_url_rule('/chart-data', 'chart_data', self.get_chart_data, methods=['GET'])
        self.bp.add_url_rule('/cumulative-data', 'cumulative_data', self.get_cumulative_data, methods=['GET'])
        self.bp.add_url_rule('/break-even', 'break_even', self.get_break_even, methods=['GET'])
        self.bp.add_url_rule('/geojson', 'geojson', self.get_geojson, methods=['GET'])
        self.bp.add_url_rule('/local-authorities', 'local_authorities', self.get_local_authorities, methods=['GET'])
    
    def get_map_data(self):
        """Get data for map visualization"""
        try:
            year = int(request.args.get('year', 2025))
            benefit_types = request.args.getlist('benefit_types')
            
            # If no benefit_types provided, return empty data
            if not benefit_types:
                return jsonify({
                    'success': True,
                    'data': []
                })
            
            # Get data for each benefit type and aggregate
            all_data = {}
            for benefit_type in benefit_types:
                data = self.data_loader.get_data_for_map(year, benefit_type)
                for item in data:
                    la = item['local_authority']
                    if la not in all_data:
                        all_data[la] = 0.0
                    all_data[la] += item['value']
            
            # Convert to list format
            result_data = [
                {'local_authority': la, 'value': value}
                for la, value in all_data.items()
            ]
            
            return jsonify({
                'success': True,
                'data': result_data
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 400
    
    def get_chart_data(self):
        """Get time series data for charts"""
        try:
            local_authority = request.args.get('local_authority')
            if not local_authority:
                return jsonify({
                    'success': False,
                    'error': 'local_authority parameter required'
                }), 400
            
            benefit_types = request.args.getlist('benefit_types')
            if not benefit_types:
                benefit_types = None
            
            data = self.data_loader.get_data_for_chart(local_authority, benefit_types)
            
            return jsonify({
                'success': True,
                'data': data
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 400
    
    def get_cumulative_data(self):
        """Get cumulative data for charts"""
        try:
            local_authority = request.args.get('local_authority')
            if not local_authority:
                return jsonify({
                    'success': False,
                    'error': 'local_authority parameter required'
                }), 400
            
            benefit_types = request.args.getlist('benefit_types')
            if not benefit_types:
                benefit_types = None
            
            data = self.data_loader.get_cumulative_data(local_authority, benefit_types)
            
            return jsonify({
                'success': True,
                'data': data
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 400
    
    def get_break_even(self):
        """Get break-even year for a local authority"""
        try:
            local_authority = request.args.get('local_authority')
            if not local_authority:
                return jsonify({
                    'success': False,
                    'error': 'local_authority parameter required'
                }), 400
            
            break_even_year = self.data_loader.calculate_break_even(local_authority)
            
            return jsonify({
                'success': True,
                'break_even_year': break_even_year
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 400
    
    def get_geojson(self):
        """Get GeoJSON data"""
        try:
            geojson = self.data_loader.geojson
            return jsonify(geojson)
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 400
    
    def get_local_authorities(self):
        """Get list of local authorities"""
        try:
            authorities = self.data_loader.get_local_authorities()
            return jsonify({
                'success': True,
                'data': authorities
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 400

