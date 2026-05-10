import 'package:flutter/material.dart';
import 'package:frontend/features/catalogue/screens/book_detail_screen.dart';
import '../../../core/network/api_client.dart';

class CatalogueScreen extends StatefulWidget {
  const CatalogueScreen({super.key});

  @override
  State<CatalogueScreen> createState() => _CatalogueScreenState();
}

class _CatalogueScreenState extends State<CatalogueScreen> {
  List<dynamic> _allBooks = [];
  List<dynamic> _filteredBooks = [];
  bool _isLoading = true;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadBooks();
  }

  Future<void> _loadBooks() async {
    final books = await ApiClient.getBooks();
    if (mounted) {
      setState(() {
        _allBooks = books ?? [];
        _filteredBooks = _allBooks;
        _isLoading = false;
      });
    }
  }

  // Allow student to search dynamically by title or author
  void _filterBooks(String query) {
    if (query.isEmpty) {
      setState(() => _filteredBooks = _allBooks);
      return;
    }

    final lowerQuery = query.toLowerCase();
    setState(() {
      _filteredBooks = _allBooks.where((book) {
        final title = (book['title'] ?? '').toString().toLowerCase();
        final author = (book['author'] ?? '').toString().toLowerCase();
        return title.contains(lowerQuery) || author.contains(lowerQuery);
      }).toList();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    final primaryColor = Theme.of(context).colorScheme.primary;

    return Column(
      children: [
        // --- SEARCH BAR ---
        Container(
          padding: const EdgeInsets.all(20),
          color: Theme.of(context).scaffoldBackgroundColor,
          child: TextField(
            controller: _searchController,
            onChanged: _filterBooks,
            decoration: InputDecoration(
              hintText: 'Search by title or author...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
                        _filterBooks('');
                      },
                    )
                  : null,
            ),
          ),
        ),

        // --- CATALOGUE GRID ---
        Expanded(
          child: _filteredBooks.isEmpty
              ? Center(
                  child: Text(
                    'No books found',
                    style: TextStyle(
                      color: Theme.of(
                        context,
                      ).colorScheme.onSurface.withValues(alpha: 0.5),
                    ),
                  ),
                )
              : GridView.builder(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 10,
                  ),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount:
                        2, // 2 books per row to look like a library shelf
                    childAspectRatio:
                        0.65, // Taller than wide to match book proportions
                    crossAxisSpacing: 15,
                    mainAxisSpacing: 15,
                  ),
                  itemCount: _filteredBooks.length,
                  itemBuilder: (context, index) {
                    final book = _filteredBooks[index];
                    final String title = book['title'] ?? 'Unknown Title';
                    final String author = book['author'] ?? 'Unknown Author';
                    final int available = book['availableCopies'] ?? 0;

                    // --- ICI ON AJOUTE LE INKWELL ---
                    return InkWell(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => BookDetailScreen(
                              book: book,
                            ), // On ouvre la page de détails !
                          ),
                        );
                      },
                      borderRadius: BorderRadius.circular(15),
                      child: Container(
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.surface,
                          borderRadius: BorderRadius.circular(15),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.05),
                              blurRadius: 8,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Book Cover Placeholder
                            Expanded(
                              child: Container(
                                width: double.infinity,
                                decoration: BoxDecoration(
                                  color: primaryColor.withValues(alpha: 0.1),
                                  borderRadius: const BorderRadius.only(
                                    topLeft: Radius.circular(15),
                                    topRight: Radius.circular(15),
                                  ),
                                ),
                                child: Icon(
                                  Icons.menu_book_rounded,
                                  size: 50,
                                  color: primaryColor.withValues(alpha: 0.5),
                                ),
                              ),
                            ),

                            // Book Details below the cover
                            Padding(
                              padding: const EdgeInsets.all(12.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    title,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    author,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Theme.of(context)
                                          .colorScheme
                                          .onSurface
                                          .withValues(alpha: 0.6),
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 8),

                                  // Availability Badge (Green or Red)
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: available > 0
                                          ? Colors.green.withValues(alpha: 0.1)
                                          : Colors.red.withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      available > 0
                                          ? 'Available'
                                          : 'Out of Stock',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: available > 0
                                            ? Colors.green
                                            : Colors.red,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}
