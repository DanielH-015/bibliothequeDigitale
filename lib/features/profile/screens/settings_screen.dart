import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/network/api_client.dart';
import '../../auth/screens/login_screen.dart';
import '../../notifications/screens/notifications_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _isDarkMode = false;

  @override
  void initState() {
    super.initState();
    // Pick up the current theme
    _isDarkMode = AppTheme.themeNotifier.value == ThemeMode.dark;
  }

  void _toggleTheme(bool value) async {
    setState(() {
      _isDarkMode = value;
    });
    // Change the theme of the application immediatly
    AppTheme.themeNotifier.value = value ? ThemeMode.dark : ThemeMode.light;
    
    // Save the phone change
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isDarkMode', value);
  }

  void _showLanguageDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text('choose_language'.tr(), textAlign: TextAlign.center),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                title: Text('english'.tr()),
                trailing: context.locale.languageCode == 'en' ? Icon(Icons.check, color: Theme.of(context).colorScheme.primary) : null,
                onTap: () async {
                  final nav = Navigator.of(context);
                  await context.setLocale(const Locale('en'));
                  nav.pop();
                },
              ),
              ListTile(
                title: Text('french'.tr()),
                trailing: context.locale.languageCode == 'fr' ? Icon(Icons.check, color: Theme.of(context).colorScheme.primary) : null,
                onTap: () async {
                  final nav = Navigator.of(context);
                  await context.setLocale(const Locale('fr'));
                  nav.pop();
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _handleLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('log_out'.tr(), textAlign: TextAlign.center),
        content: const Text('Are you sure you want to log out?'),
        actionsAlignment: MainAxisAlignment.center,
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('cancel_reservation_title'.tr() == 'cancel_reservation_title' ? 'Cancel' : 'close'.tr(), style: const TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text('log_out'.tr(), style: const TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await ApiClient.logout(); // Delete the token
      if (mounted) {
        // Delete the navigation historique and send the login
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (context) => const LoginScreen()),
          (Route<dynamic> route) => false,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).colorScheme.primary;

    return Scaffold(
      appBar: AppBar(
        title: Text('settings'.tr(), style: const TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 600),
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
          const Text('APPEARANCE', style: TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
            child: Column(
              children: [
                ListTile(
                  leading: Icon(Icons.dark_mode_outlined, color: primaryColor),
                  title: Text('dark_mode'.tr()),
                  trailing: Switch(
                    value: _isDarkMode,
                    onChanged: _toggleTheme,
                    activeThumbColor: primaryColor,
                  ),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: Icon(Icons.language, color: primaryColor),
                  title: Text('language'.tr()),
                  subtitle: Text(context.locale.languageCode == 'en' ? 'english'.tr() : 'french'.tr()),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
                  onTap: _showLanguageDialog,
                ),
              ],
            ),
          ),
          const SizedBox(height: 25),
          
          const Text('ACCOUNT', style: TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
            child: Column(
              children: [
                ListTile(
                  leading: Icon(Icons.notifications_outlined, color: primaryColor),
                  title: Text('notifications'.tr()),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const NotificationsScreen()),
                    );
                  }, 
                ),
                const Divider(height: 1),
                ListTile(
                  leading: Icon(Icons.security_outlined, color: primaryColor),
                  title: const Text('Privacy & Security'),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
                  onTap: () {}, // Prepare for a feature evolution
                ),
              ],
            ),
          ),
          const SizedBox(height: 25),
          
          // Logout Button
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
            child: ListTile(
              leading: const Icon(Icons.logout, color: Colors.red),
              title: Text('log_out'.tr(), style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
              onTap: _handleLogout,
            ),
          ),
        ],
      ),
    ),
  ),
);
}
}
