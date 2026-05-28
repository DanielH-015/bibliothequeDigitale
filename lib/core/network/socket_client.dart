import 'package:socket_io_client/socket_io_client.dart' as io_client;
import 'package:flutter/foundation.dart';
import 'dart:async';
import '../config/app_config.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SocketClient {
  static const String serverUrl = AppConfig.socketUrl;
  
  static Future<void> sendMobileScan(String studentId) async {
    io_client.Socket socket = io_client.io(serverUrl, io_client.OptionBuilder()
        .setTransports(['websocket'])
        .disableAutoConnect()
        .build());

    socket.connect();

    socket.onConnect((_) async {
      debugPrint('Connected to Socket.io server from Flutter!');
      
      final prefs = await SharedPreferences.getInstance();
      final adminId = prefs.getInt('user_id');

      socket.emit('mobile-scan', {
        'studentId': studentId,
        'adminId': adminId
      });
      debugPrint('Sent mobile-scan event for student: $studentId, admin: $adminId');
      
      Future.delayed(const Duration(seconds: 1), () {
        socket.disconnect();
      });
    });
    
    socket.onConnectError((err) => debugPrint('Socket connection error: $err'));
  }
}
