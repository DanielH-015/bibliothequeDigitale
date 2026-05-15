import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../../core/network/socket_client.dart';

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  bool _isProcessing = false;

  void _onDetect(BarcodeCapture capture) {
    if (_isProcessing) return; // Prevent scanning multiple times in a row
    
    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isNotEmpty && barcodes.first.rawValue != null) {
      final String scannedCode = barcodes.first.rawValue!;
      
      setState(() {
        _isProcessing = true;
      });

      // Actual server request (which will trigger the Angular web interface)
      SocketClient.sendMobileScan(scannedCode);
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Carte étudiante scannée avec succès !'),
          backgroundColor: Colors.green,
        ),
      );

      // Block the scan for 3 seconds after success
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) {
          setState(() {
            _isProcessing = false;
          });
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scanner une Carte'),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
      ),
      body: Stack(
        children: [
          MobileScanner(
            onDetect: _onDetect,
          ),
          // Loading indicator while sending
          if (_isProcessing)
            Container(
              color: Colors.black54,
              child: const Center(
                child: CircularProgressIndicator(
                  color: Color(0xFFFFB300),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
