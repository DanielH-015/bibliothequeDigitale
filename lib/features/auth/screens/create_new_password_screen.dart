import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/custom_snackbar.dart';

class CreateNewPasswordScreen extends StatefulWidget {
  final String token; // The token extracted from the email link
  const CreateNewPasswordScreen({super.key, required this.token});

  @override
  State<CreateNewPasswordScreen> createState() => _CreateNewPasswordScreenState();
}

class _CreateNewPasswordScreenState extends State<CreateNewPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isLoading = false;
  bool _isPasswordVisible = false;

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleResetPassword() async {
    if (!_formKey.currentState!.validate()) return;
    
    if (_passwordController.text != _confirmPasswordController.text) {
      CustomSnackBar.showError(context, 'Passwords do not match');
      return;
    }

    setState(() => _isLoading = true);

    final data = {
      'token': widget.token,
      'newPassword': _passwordController.text
    };
    
    final result = await ApiClient.resetPassword(data);

    if (mounted) {
      setState(() => _isLoading = false);
      if (result['success']) {
        CustomSnackBar.showSuccess(context, 'Password updated successfully! You can now log in.');
        Navigator.of(context).popUntil((route) => route.isFirst); // Go back to login screen
      } else {
        CustomSnackBar.showError(context, result['message']);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).colorScheme.primary;
    final secondaryColor = Theme.of(context).colorScheme.secondary;
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: secondaryColor,
      body: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 600),
              child: Column(
                children: [
                  // HEADER
              Stack(
                children: [
                  Container(
                    height: 200,
                    width: double.infinity,
                    alignment: Alignment.center,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(15),
                          decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withValues(alpha: 0.15)),
                          child: Icon(Icons.auto_stories_rounded, size: 60, color: primaryColor),
                        ),
                        const SizedBox(height: 10),
                        const Text('Digital', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 1.5)),
                        const Text('Library', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w300, color: Colors.white70, letterSpacing: 5.0)),
                      ],
                    ),
                  ),
                  Positioned(
                    top: 10, left: 10,
                    child: IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ),
                ],
              ),
              
              // FORM
              Container(
                width: double.infinity,
                constraints: BoxConstraints(minHeight: size.height - 200 - MediaQuery.of(context).padding.top),
                padding: const EdgeInsets.fromLTRB(25, 35, 25, 20),
                decoration: BoxDecoration(
                  color: Theme.of(context).scaffoldBackgroundColor,
                  borderRadius: const BorderRadius.only(topLeft: Radius.circular(40), topRight: Radius.circular(40)),
                ),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('New Password', style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface)),
                      const SizedBox(height: 5),
                      Text('Please enter your new secure password.', style: TextStyle(fontSize: 14, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
                      const SizedBox(height: 30),

                      TextFormField(
                        controller: _passwordController,
                        obscureText: !_isPasswordVisible,
                        decoration: InputDecoration(
                          labelText: 'New Password',
                          prefixIcon: const Icon(Icons.lock_outline),
                          suffixIcon: IconButton(
                            icon: Icon(_isPasswordVisible ? Icons.visibility_off : Icons.visibility, color: Colors.grey),
                            onPressed: () => setState(() => _isPasswordVisible = !_isPasswordVisible),
                          ),
                        ),
                        validator: (value) => value != null && value.length < 6 ? 'Minimum 6 characters' : null,
                      ),
                      const SizedBox(height: 15),

                      TextFormField(
                        controller: _confirmPasswordController,
                        obscureText: !_isPasswordVisible,
                        decoration: const InputDecoration(
                          labelText: 'Confirm Password',
                          prefixIcon: Icon(Icons.lock_reset),
                        ),
                        validator: (value) => value != _passwordController.text ? 'Passwords do not match' : null,
                      ),
                      const SizedBox(height: 30),

                      Container(
                        width: double.infinity, height: 55,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(15),
                          gradient: const LinearGradient(colors: [Color(0xFFFFB300), Color(0xFFFF8F00)]),
                          boxShadow: [BoxShadow(color: const Color(0xFFFFB300).withValues(alpha: 0.4), blurRadius: 15, offset: const Offset(0, 5))],
                        ),
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : _handleResetPassword,
                          style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent),
                          child: _isLoading
                              ? const SizedBox(height: 25, width: 25, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3))
                              : const Text('Save Password', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 1.2)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  ),
);
}
}
