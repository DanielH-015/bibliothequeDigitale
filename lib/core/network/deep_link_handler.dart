import 'dart:async';
import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'api_client.dart';
import '../../shared/widgets/custom_snackbar.dart';
import '../../features/auth/screens/create_new_password_screen.dart';

class DeepLinkHandler {
  static final _appLinks = AppLinks();
  static StreamSubscription? _subscription;

  static void init(BuildContext context) {
    // 1. Listen when app is in background/foreground
    _subscription = _appLinks.uriLinkStream.listen((uri) {
      if (!context.mounted) return; // SECURITY CHECK
      _handleDeepLink(uri, context);
    });

    // 2. Listen when app was completely closed and launched from the link
    _appLinks.getInitialLink().then((uri) {
      if (uri != null) {
        // Wait a bit for the UI to be fully built before showing snackbars
        Future.delayed(const Duration(seconds: 1), () {
          if (!context.mounted) return; // SECURITY CHECK
          _handleDeepLink(uri, context);
        });
      }
    });
  }

  static void _handleDeepLink(Uri uri, BuildContext context) async {
    if (uri.scheme == 'digitallibrary' && uri.host == 'auth') {
      final action = uri.pathSegments.isNotEmpty ? uri.pathSegments.first : '';
      final token = uri.queryParameters['token'];

      if (token == null) return;

      if (action == 'verify') {
        if (!context.mounted) return;

        // Process Email Verification
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Verifying account...'),
            backgroundColor: Colors.blue,
          ),
        );

        final result = await ApiClient.verifyEmail(token);

        // --- ASYNC GAP ---
        if (!context.mounted) return; // SECURITY CHECK AFTER AWAIT

        if (result['success']) {
          CustomSnackBar.showSuccess(
            context,
            'Account verified! You can now log in.',
          );
        } else {
          CustomSnackBar.showError(context, result['message']);
        }
      } else if (action == 'reset') {
        if (!context.mounted) return;

        // Navigate automatically to the "New Password" screen, passing the token
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => CreateNewPasswordScreen(token: token),
          ),
        );
      }
    }
  }

  static void dispose() {
    _subscription?.cancel();
  }
}
