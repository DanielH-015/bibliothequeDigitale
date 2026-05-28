import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/onboarding/screens/onboarding_screen.dart';

void main() async {
  // Required when using 'await' inside the main() function
  WidgetsFlutterBinding.ensureInitialized();
  
  // Read the saved theme preference before launching the app
  final prefs = await SharedPreferences.getInstance();
  final isDarkMode = prefs.getBool('isDarkMode');
  final isFirstLaunch = prefs.getBool('isFirstLaunch') ?? true;
  
  // Apply the theme if the user has previously saved a preference
  if (isDarkMode != null) {
    AppTheme.themeNotifier.value = isDarkMode ? ThemeMode.dark : ThemeMode.light;
  }
  runApp(LibraryApp(isFirstLaunch: isFirstLaunch));
}

class LibraryApp extends StatelessWidget {
  final bool isFirstLaunch;

  const LibraryApp({super.key, required this.isFirstLaunch});

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
          home: isFirstLaunch ? const OnboardingScreen() : const LoginScreen(),
        );
      },
    );
  }
}
