import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'onboarding_screen.dart';

class LanguageSelectionScreen extends StatelessWidget {
  const LanguageSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 600),
            child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.language,
                size: 100,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(height: 40),
              Text(
                'choose_language'.tr(),
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 60),
              _buildLanguageOption(context, 'English', const Locale('en')),
              const SizedBox(height: 20),
              _buildLanguageOption(context, 'Français', const Locale('fr')),
            ],
          ),
        ),
      ),
    ),
  ),
);
}

  Widget _buildLanguageOption(BuildContext context, String title, Locale locale) {
    final bool isSelected = context.locale == locale;
    final primaryColor = Theme.of(context).colorScheme.primary;

    return InkWell(
      onTap: () async {
        await context.setLocale(locale);
        // Add a slight delay to allow the state to rebuild and translation to be fetched
        Future.delayed(const Duration(milliseconds: 300), () {
          if (context.mounted) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) => const OnboardingScreen()),
            );
          }
        });
      },
      borderRadius: BorderRadius.circular(15),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 24),
        decoration: BoxDecoration(
          color: isSelected ? primaryColor.withValues(alpha: 0.1) : Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(15),
          border: Border.all(
            color: isSelected ? primaryColor : Colors.grey.withValues(alpha: 0.3),
            width: 2,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              title,
              style: TextStyle(
                fontSize: 18,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                color: isSelected ? primaryColor : Theme.of(context).colorScheme.onSurface,
              ),
            ),
            if (isSelected)
              Icon(Icons.check_circle, color: primaryColor)
            else
              const Icon(Icons.circle_outlined, color: Colors.grey),
          ],
        ),
      ),
    );
  }
}
