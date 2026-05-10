import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/screens/login_screen.dart';

void main() async {
  // Required when using 'await' inside the main() function
  WidgetsFlutterBinding.ensureInitialized();
  
  // Read the saved theme preference before launching the app
  final prefs = await SharedPreferences.getInstance();
  final isDarkMode = prefs.getBool('isDarkMode');
  
  // Apply the theme if the user has previously saved a preference
  if (isDarkMode != null) {
    AppTheme.themeNotifier.value = isDarkMode ? ThemeMode.dark : ThemeMode.light;
  }
  runApp(const LibraryApp());
}

class LibraryApp extends StatelessWidget {
  const LibraryApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: AppTheme.themeNotifier,
      builder: (context, ThemeMode currentMode, child) {
        return MaterialApp(
          title: 'Digital Library',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: currentMode, // The app now listens to the global variable!
          home: const LoginScreen(),
        );
      },
    );
  }
}
