import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import 'edit_profile_screen.dart';


class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _studentData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  // Load the data independently to ensure it's always fresh when opening the profile tab
  Future<void> _loadProfile() async {
    final data = await ApiClient.getStudentProfile();
    if (mounted) {
      setState(() {
        _studentData = data;
        _isLoading = false;
      });
    }
  }

  // A reusable widget to display nice information rows with icons
  Widget _buildInfoRow(IconData icon, String title, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12.0),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.1), // Subtle amber background
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Theme.of(context).colorScheme.primary), // Amber icon
          ),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 13,
                    color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  value.isNotEmpty ? value : 'Not provided',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Show spinner while fetching
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    // Show error if data is missing
    if (_studentData == null) {
      return const Center(child: Text('Could not load profile.'));
    }

    // Extract basic user info
    final String firstName = _studentData!['firstName'] ?? '';
    final String lastName = _studentData!['lastName'] ?? '';
    final String email = _studentData!['email'] ?? '';
    
    // Extract specific academic info from the nested profile
    final Map<String, dynamic> profile = _studentData!['studentProfile'] ?? {};
    final String regNumber = profile['registrationNumber'] ?? '';
    final String classroom = profile['classroom'] ?? '';
    final String studyStream = profile['studyStream'] ?? '';

    // Generate initials for the avatar (e.g. "PS" for Patrick Simba)
    final String initials = (firstName.isNotEmpty ? firstName[0] : '') + 
                            (lastName.isNotEmpty ? lastName[0] : '');

        // Checking if backend returned a profile image URL
    // We look inside the "studentProfile" object to find the "studentPhoto"
final Map<String, dynamic> profileI = _studentData!['studentProfile'] ?? {};
final String? profileImageUrl = profileI['studentPhoto'];


    return Scaffold(
      // --- Adding of the floating Action button ---
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          // Open edit screen and wait for it to return
          final bool? shouldRefresh = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => EditProfileScreen(studentData: _studentData!),
            ),
          );
          
          // If profile was saved, reload the data from Node.js!
          if (shouldRefresh == true) {
            setState(() => _isLoading = true);
            _loadProfile(); 
          }
        },
        icon: const Icon(Icons.edit, color: Colors.white),
        label: const Text('Edit', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const SizedBox(height: 20),
            
            // --- AVATAR & NAME SECTION ---
            CircleAvatar(
              radius: 50,
              backgroundColor: Theme.of(context).colorScheme.primary,
              // NOUVEAU : On affiche l'image du serveur si elle existe !
              backgroundImage: profileImageUrl != null && profileImageUrl.isNotEmpty
                  ? NetworkImage('${ApiClient.baseUrl.replaceAll('/api', '')}/$profileImageUrl')
                  : null,
              child: (profileImageUrl == null || profileImageUrl.isEmpty)
                  ? Text(
                      initials.toUpperCase(),
                      style: const TextStyle(fontSize: 35, fontWeight: FontWeight.bold, color: Colors.white),
                    )
                  : null,
            ),
            const SizedBox(height: 15),
            Text(
              '$firstName $lastName',
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            Text(
              email,
              style: TextStyle(fontSize: 16, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
            ),
            const SizedBox(height: 40),

            // --- ACADEMIC INFORMATION CARD ---
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Academic Information',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.secondary),
                  ),
                  const Divider(height: 30),
                  _buildInfoRow(Icons.badge_outlined, 'Registration Number', regNumber),
                  _buildInfoRow(Icons.class_outlined, 'Classroom', classroom),
                  _buildInfoRow(Icons.book_outlined, 'Study Stream', studyStream),
                ],
              ),
            ),
          ],
        ),
      ),
    );

  }
}
