from flask import jsonify, Blueprint
basic = Blueprint('basic', __name__)

@basic.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Speech-to-text and appointment booking service is running'})


