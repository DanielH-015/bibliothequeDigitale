import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/custom_snackbar.dart';
import '../../auth/screens/login_screen.dart';
import '../../profile/screens/profile_screen.dart';
import '../../catalogue/screens/catalogue_screen.dart';
import '../../profile/screens/settings_screen.dart';
import '../../notifications/screens/notifications_screen.dart';



class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0; // Active tab index

  // Variables to hold backend data
  Map<String, dynamic>? _studentData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchProfile(); // Load data automatically when screen opens
  }

  // Fetch real data from Node.js
  Future<void> _fetchProfile() async {
    final data = await ApiClient.getStudentProfile();

    // Check if widget is still visible to avoid crashes
    if (mounted) {
      setState(() {
        _studentData = data;
        _isLoading = false;
      });
    }
  }

  Future<void> _handleLogout() async {
    await ApiClient.logout();
    if (mounted) {
      CustomSnackBar.showInfo(context, 'Successfully logged out');
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
    }
  }

  Future<void> _cancelReservation(int reservationId) async {
    // ask user confirmation
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
        title: const Text('Cancel Reservation'),
        content: const Text('Are you sure you want to cancel this reservation?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('No, keep it', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Yes, cancel', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    // If confirmed, we rollback by the API
    if (confirm == true) {
      setState(() => _isLoading = true);
      final success = await ApiClient.cancelReservation(reservationId);
      
      if (mounted) {
        if (success) {
          CustomSnackBar.showSuccess(context, 'Reservation cancelled successfully');
          _fetchProfile(); // Reload datas 
        } else {
          setState(() => _isLoading = false);
          CustomSnackBar.showError(context, 'Failed to cancel reservation');
        }
      }
    }
  }


  void _showQrCodeDialog(BuildContext context) {
    if (_studentData == null || _studentData!['studentProfile'] == null) {
      CustomSnackBar.showError(context, 'QR Code unavailable');
      return;
    }

    // Retrieve the unique QR Code ID securely from the database
    final String qrCodeId = _studentData!['studentProfile']['qrCodeId'];

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: const Text('My QR Code', textAlign: TextAlign.center),
          content: SizedBox(
            width: 250,
            height: 250,
            child: Center(
              child: QrImageView(
                data: qrCodeId, // Inject dynamic backend data here
                version: QrVersions.auto,
                size: 200.0,
                backgroundColor: Colors.white, // Ensure visibility in dark mode
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close', style: TextStyle(fontSize: 16)),
            ),
          ],
        );
      },
    );
  }

  // Home Tab View displaying real data
  // Home Tab View displaying real data
  Widget _buildHomeTab() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_studentData == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 60, color: Colors.red),
            const SizedBox(height: 15),
            const Text('Failed to load profile data.'),
            const SizedBox(height: 15),
            ElevatedButton(
              onPressed: () {
                setState(() => _isLoading = true);
                _fetchProfile();
              },
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    final primaryColor = Theme.of(context).colorScheme.primary;
    final String firstName = _studentData!['firstName'] ?? 'Student';
    final String lastName = _studentData!['lastName'] ?? '';
    final Map<String, dynamic> profileData =
        _studentData!['studentProfile'] ?? {};

    final List<dynamic> allLoans = profileData['loans'] ?? [];
    final List<dynamic> activeLoans = allLoans
        .where((loan) => loan['status'] == 'ACTIVE')
        .toList();
    final int activeLoansCount = activeLoans.length;

    // Extract Pending Reservations from backend data
    final List<dynamic> allReservations = profileData['reservations'] ?? [];
    final pendingReservations = allReservations
        .where((res) => res['status'] == 'PENDING')
        .toList();

    // 1. RefreshIndicator allows "Pull-to-Refresh"
    return RefreshIndicator(
      onRefresh: _fetchProfile,
      color: primaryColor,
      child: SingleChildScrollView(
        physics:
            const AlwaysScrollableScrollPhysics(), // Required for RefreshIndicator to work
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Welcome back,',
              style: TextStyle(
                fontSize: 16,
                color: Theme.of(
                  context,
                ).colorScheme.onSurface.withValues(alpha: 0.6),
              ),
            ),
            const SizedBox(height: 5),
            Text(
              '$firstName $lastName',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Theme.of(context).colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 30),

            // Current Loans Card (Added a beautiful gradient here!)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(25),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [primaryColor, const Color(0xFFFF8F00)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: primaryColor.withValues(alpha: 0.3),
                    blurRadius: 15,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.menu_book, color: Colors.white, size: 40),
                  const SizedBox(height: 15),
                  const Text(
                    'Active Loans',
                    style: TextStyle(color: Colors.white70, fontSize: 16),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    '$activeLoansCount Book(s)',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Active Loans Carousel
            if (activeLoans.isNotEmpty) ...[
              SizedBox(
                height: 140,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: activeLoans.length,
                  itemBuilder: (context, index) {
                    final loan = activeLoans[index];
                    final book = loan['book'] ?? {};
                    final title = book['title'] ?? 'Unknown Book';
                    final coverImage = book['coverImage'];
                    
                    // Format due date
                    final DateTime dueDate = DateTime.parse(loan['dueDate']);
                    final String formattedDate = '${dueDate.day.toString().padLeft(2, '0')}/${dueDate.month.toString().padLeft(2, '0')}/${dueDate.year}';
                    
                    return Container(
                      width: 250,
                      margin: const EdgeInsets.only(right: 15, bottom: 10),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surface,
                        borderRadius: BorderRadius.circular(15),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.05),
                            blurRadius: 5,
                            offset: const Offset(0, 3),
                          )
                        ],
                      ),
                      child: Row(
                        children: [
                          // Cover Image
                          Container(
                            width: 60,
                            height: 85,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(8),
                              color: primaryColor.withValues(alpha: 0.1),
                            ),
                            clipBehavior: Clip.hardEdge,
                            child: (coverImage != null && coverImage.toString().isNotEmpty)
                                ? Image.network(
                                    ApiClient.getImageUrl(coverImage),
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, stackTrace) => Icon(Icons.menu_book, color: primaryColor.withValues(alpha: 0.5)),
                                  )
                                : Icon(Icons.menu_book, color: primaryColor.withValues(alpha: 0.5)),
                          ),
                          const SizedBox(width: 15),
                          // Details
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  title,
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 8),
                                const Text(
                                  'Due Date:',
                                  style: TextStyle(fontSize: 11, color: Colors.grey),
                                ),
                                Text(
                                  formattedDate,
                                  style: TextStyle(
                                    fontSize: 12, 
                                    fontWeight: FontWeight.w600,
                                    color: dueDate.isBefore(DateTime.now()) ? Colors.red : primaryColor,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 20),
            ],

            Text(
              'Quick Actions',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Theme.of(context).colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 15),
                        Row(
              children: [
                _buildActionCard(
                  context,
                  Icons.search,
                  'Catalogue',
                  primaryColor,
                  () => setState(() => _currentIndex = 1),
                ),
                const SizedBox(width: 15),
                _buildActionCard(
                  context,
                  Icons.qr_code,
                  'My QR Code',
                  primaryColor,
                  () => _showQrCodeDialog(context),
                ),
              ],
            ),

            const SizedBox(height: 35),

            // --- 2. PENDING RESERVATIONS SECTION ---
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Pending Reservations',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: primaryColor.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '${pendingReservations.length}',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: primaryColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 15),

            if (pendingReservations.isEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Text(
                    'No pending reservations.',
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ),
              )
            else
              ...pendingReservations.map((res) {
                // Formatting the expiration date
                final DateTime expireDate = DateTime.parse(res['expiresAt']);
                final String formattedDate =
                    '${expireDate.day.toString().padLeft(2, '0')}/${expireDate.month.toString().padLeft(2, '0')}/${expireDate.year}';

                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(15),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: primaryColor.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.hourglass_top, color: primaryColor),
                      const SizedBox(width: 15),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Reservation Valid',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                            Text(
                              'Pick up before: $formattedDate',
                              style: const TextStyle(
                                fontSize: 12,
                                color: Colors.grey,
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.cancel_outlined, color: Colors.red),
                        tooltip: 'Cancel Reservation',
                        onPressed: () => _cancelReservation(res['id']),
                      ),
                    ],
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard(
    BuildContext context,
    IconData icon,
    String title,
    Color color,
    VoidCallback onTap,
  ) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(15),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 20),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(15),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            children: [
              Icon(icon, size: 40, color: color),
              const SizedBox(height: 10),
              Text(
                title,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // List of pages for BottomNavigationBar
    final List<Widget> pages = [
      _buildHomeTab(), // Index 0
      const CatalogueScreen(), // Index 1
      const ProfileScreen(), // Index 2
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(
          // Dynamic title based on active tab
          _currentIndex == 0
              ? 'Dashboard'
              : _currentIndex == 1
              ? 'Catalogue'
              : 'My Profile',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_none),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const NotificationsScreen()),
                  ).then((_) => _fetchProfile()); // Refresh profile to update badge when coming back
                },
              ),
              if (_studentData != null && (_studentData!['unreadNotificationsCount'] ?? 0) > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 16,
                      minHeight: 16,
                    ),
                    child: Text(
                      '${_studentData!['unreadNotificationsCount']}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.menu),
            onSelected: (value) async {
              if (value == 'settings') {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const SettingsScreen(),
                  ),
                );
              } else if (value == 'logout') {
                _handleLogout();
              }
            },

            itemBuilder: (BuildContext context) {
              return [
                PopupMenuItem<String>(
                  value: 'settings',
                  child: Row(
                    children: [
                      Icon(
                        Icons.settings_outlined,
                        color: Theme.of(context).iconTheme.color,
                      ),
                      const SizedBox(width: 10),
                      const Text('Settings'),
                    ],
                  ),
                ),
                const PopupMenuDivider(),
                const PopupMenuItem<String>(
                  value: 'logout',
                  child: Row(
                    children: [
                      Icon(Icons.logout, color: Colors.red),
                      SizedBox(width: 10),
                      Text(
                        'Log Out',
                        style: TextStyle(
                          color: Colors.red,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ];
            },
          ),
        ],
      ),

      body: pages[_currentIndex],

      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(
            icon: Icon(Icons.library_books),
            label: 'Catalogue',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}
