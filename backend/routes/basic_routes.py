from flask import jsonify
from flask_app import app

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Speech-to-text and appointment booking service is running'})


