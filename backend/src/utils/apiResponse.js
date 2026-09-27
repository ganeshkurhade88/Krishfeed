class ApiResponse {
  constructor(success, data, message = '') {
    this.success = success;
    this.data = data;
    this.message = message;
    this.timestamp = new Date().toISOString();
  }

  static success(data, message = 'Success') {
    return new ApiResponse(true, data, message);
  }

  static error(message = 'Error', data = null) {
    return new ApiResponse(false, data, message);
  }
}

module.exports = ApiResponse;
