import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/custom_snackbar.dart';

class BookDetailScreen extends StatefulWidget {
  // We pass the book data from the catalogue grid to this screen
  final Map<String, dynamic> book;

  const BookDetailScreen({super.key, required this.book});

  @override
  State<BookDetailScreen> createState() => _BookDetailScreenState();
}

class _BookDetailScreenState extends State<BookDetailScreen> {
  bool _isReserving = false;

  Future<void> _handleReservation() async {
    setState(() => _isReserving = true);
    
    // The database ID of the book
    final int bookId = widget.book['id'];
    
    // Call our Node.js backend
    final success = await ApiClient.reserveBook(bookId);
    
    if (mounted) {
      setState(() => _isReserving = false);
      if (success) {
        CustomSnackBar.showSuccess(context, 'Reservation successful! You have 3 days to pick it up.');
        Navigator.pop(context); // Go back to catalogue
      } else {
        CustomSnackBar.showError(context, 'Failed to reserve. It might be out of stock or you already reserved it.');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).colorScheme.primary;
    final String title = widget.book['title'] ?? 'Unknown Title';
    final String author = widget.book['author'] ?? 'Unknown Author';
    final String isbn = widget.book['isbn'] ?? 'N/A';
    final int available = widget.book['availableCopies'] ?? 0;
    final int publishedYear = widget.book['publishedYear'] ?? 2000;

    return Scaffold(
      appBar: AppBar(title: const Text('Book Details')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(25.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Big Book Cover Placeholder
            Center(
              child: Container(
                width: 200,
                height: 280,
                decoration: BoxDecoration(
                  color: primaryColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(15),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 15, offset: const Offset(0, 10))
                  ],
                ),
                child: Icon(Icons.menu_book_rounded, size: 100, color: primaryColor.withValues(alpha: 0.5)),
              ),
            ),
            const SizedBox(height: 30),
            
            // Title & Author
            Text(title, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(author, style: TextStyle(fontSize: 18, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
            const Divider(height: 40),
            
            // Metadata
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildMetaBox('ISBN', isbn),
                _buildMetaBox('Published', publishedYear.toString()),
                _buildMetaBox('Available', available.toString(), isHighlight: available > 0),
              ],
            ),
            const SizedBox(height: 40),

            // Synopsis Placeholder
            const Text('Synopsis', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            Text(
              'A fascinating exploration of themes and characters woven into an incredible story. This book is highly recommended for all students looking to expand their knowledge.',
              style: TextStyle(fontSize: 15, height: 1.5, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.8)),
            ),
          ],
        ),
      ),
      
      // Floating Action Button for Reservation at the bottom
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: SizedBox(
            height: 60,
            child: ElevatedButton(
              onPressed: (available > 0 && !_isReserving) ? _handleReservation : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: available > 0 ? primaryColor : Colors.grey,
              ),
              child: _isReserving
                  ? const CircularProgressIndicator(color: Colors.white)
                  : Text(
                      available > 0 ? 'Reserve Book Now' : 'Out of Stock',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
            ),
          ),
        ),
      ),
    );
  }

  // Small helper for Metadata boxes
  Widget _buildMetaBox(String label, String value, {bool isHighlight = false}) {
    return Column(
      children: [
        Text(label, style: const TextStyle(fontSize: 13, color: Colors.grey)),
        const SizedBox(height: 5),
        Text(
          value, 
          style: TextStyle(
            fontSize: 16, 
            fontWeight: FontWeight.bold,
            color: isHighlight ? Colors.green : Theme.of(context).colorScheme.onSurface
          )
        ),
      ],
    );
  }
}
