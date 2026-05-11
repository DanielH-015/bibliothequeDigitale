import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http_parser/http_parser.dart';


class ApiClient {
  // Base URL of our Node.js backend
  static const String baseUrl = 'http://172.20.10.2:5000/api';
  
  // Local storage keys
  static const String _tokenKey = 'jwt_token';
  static const String _userIdKey = 'user_id'; // We need to store the ID returned by backend

  // Authenticate user, save JWT token and User ID
  static Future<bool> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      // 200 OK means credentials are valid
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        // Save the received token AND the user ID securely
        if (data['token'] != null && data['user'] != null) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(_tokenKey, data['token']);
          await prefs.setInt(_userIdKey, data['user']['id']); // Storing the database user ID
          return true;
        }
      }
      return false;
    } catch (e) {
      debugPrint('Login Exception: $e');
      return false;
    }
  }

    // --- AUTHENTICATION EXTENSIONS ---
  
  // Register a new user
  static Future<Map<String, dynamic>> register(Map<String, dynamic> data) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(data),
      );
      final body = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        return {'success': true, 'message': body['message']};
      }
      return {'success': false, 'message': body['message'] ?? 'Registration failed'};
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // Request password reset
  static Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/forgot-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      );
      final body = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        return {'success': true, 'message': body['message']};
      }
      return {'success': false, 'message': body['message'] ?? 'Request failed'};
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  // Verify email using deep link token
  static Future<Map<String, dynamic>> verifyEmail(String token) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/verify-email'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'token': token}),
      );
      final body = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        return {'success': true, 'message': body['message']};
      }
      return {'success': false, 'message': body['message'] ?? 'Verification failed'};
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }


  // Fetch the full student profile including QR Code and Loans
  static Future<Map<String, dynamic>?> getStudentProfile() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getInt(_userIdKey);
      
      if (userId == null) return null; // No user ID found locally

      final headers = await getAuthHeaders();
      
      // Makes request to EXACT backend route: GET /api/students/:id
      final response = await http.get(
        Uri.parse('$baseUrl/students/$userId'), 
        headers: headers,
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body); // Contains user data + studentProfile + loans
      } else {
        debugPrint('Failed to load profile. Status: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      debugPrint('Profile Exception: $e');
      return null;
    }
  }

  // Clear local session completely
  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userIdKey);
  }

  // Utility method to inject the token
  static Future<Map<String, String>> getAuthHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey) ?? '';
    
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }
    // Fetch all books from the library catalogue
  static Future<List<dynamic>?> getBooks() async {
    try {
      final headers = await getAuthHeaders();
      
      // Assumes the backend route to get all books is /api/books
      final response = await http.get(
        Uri.parse('$baseUrl/books'), 
        headers: headers,
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body); // Returns a JSON Array of books
      } else {
        debugPrint('Failed to load books. Status: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      debugPrint('Books Exception: $e');
      return null;
    }
  }

    // Make a reservation for a specific book
  static Future<bool> reserveBook(int bookId) async {
    try {
      final headers = await getAuthHeaders();
      
      // Sends a POST request to create a reservation with the book ID
      final response = await http.post(
        Uri.parse('$baseUrl/reservations'), 
        headers: headers,
        body: jsonEncode({ 'bookId': bookId }),
      );

      // Status 200 or 201 means creation was successful
      if (response.statusCode == 200 || response.statusCode == 201) {
        return true;
      } else {
        debugPrint('Failed to reserve book. Status: ${response.statusCode} - ${response.body}');
        return false;
      }
    } catch (e) {
      debugPrint('Reservation Exception: $e');
      return false;
    }
  }

  // Update student text information
  static Future<bool> updateStudentProfile(Map<String, dynamic> data) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getInt(_userIdKey);
      if (userId == null) return false;

      final response = await http.put(
        Uri.parse('$baseUrl/students/$userId'), 
        headers: await getAuthHeaders(),
        body: jsonEncode(data),
      );

      if (response.statusCode == 200) return true;
      
      // print the error of the action in the backend
      debugPrint(' ERREUR TEXTE BACKEND: ${response.statusCode} - ${response.body}');
      return false;
    } catch (e) {
      debugPrint(' EXCEPTION TEXTE: $e');
      return false;
    }
  }

  static Future<bool> uploadProfilePhoto(String imagePath) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getInt(_userIdKey);
      if (userId == null) return false;

      final token = prefs.getString(_tokenKey) ?? '';
      var request = http.MultipartRequest('POST', Uri.parse('$baseUrl/students/$userId/photo'));
      request.headers['Authorization'] = 'Bearer $token';
      
      // Extract file extension to determine the correct mime type
      final extension = imagePath.split('.').last.toLowerCase();
      String subType = 'jpeg'; // default fallback
      if (extension == 'png') subType = 'png';
      if (extension == 'webp') subType = 'webp';

      // Force Flutter to declare the file with the correct Content-Type (e.g. image/jpeg)
      // This prevents the backend multer from throwing "Only images are allowed."
      request.files.add(
        await http.MultipartFile.fromPath(
          'photo', 
          imagePath,
          contentType: MediaType('image', subType),
        )
      );
      
      var response = await request.send();
      
      if (response.statusCode == 200 || response.statusCode == 201) return true;
      
      final respStr = await response.stream.bytesToString();
      debugPrint(' BACKEND IMAGE ERROR: ${response.statusCode} - $respStr');
      return false;
    } catch (e) {
      debugPrint(' IMAGE EXCEPTION: $e');
      return false;
    }
  }

    // Send the new password to the backend
  static Future<Map<String, dynamic>> resetPassword(Map<String, dynamic> data) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/reset-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(data),
      );
      final body = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        return {'success': true, 'message': body['message']};
      }
      return {'success': false, 'message': body['message'] ?? 'Reset failed'};
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }





}
