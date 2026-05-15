import 'package:socket_io_client/socket_io_client.dart' as io_client;
import 'package:flutter/foundation.dart';
import 'dart:async';

class SocketClient {
  static const String serverUrl = 'http://172.20.10.2:5000';
  
  static Future<void> sendMobileScan(String studentId) async {
    io_client.Socket socket = io_client.io(serverUrl, io_client.OptionBuilder()
        .setTransports(['websocket'])
        .disableAutoConnect()
        .build());

    socket.connect();

    socket.onConnect((_) {
      debugPrint('Connected to Socket.io server from Flutter!');
      
      socket.emit('mobile-scan', {'studentId': studentId});
      debugPrint('Sent mobile-scan event for student: $studentId');
      
      Future.delayed(const Duration(seconds: 1), () {
        socket.disconnect();
      });
    });
    
    socket.onConnectError((err) => debugPrint('Socket connection error: $err'));
  }
}
