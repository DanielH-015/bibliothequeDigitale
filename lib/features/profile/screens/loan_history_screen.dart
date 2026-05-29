import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../core/network/api_client.dart';

class LoanHistoryScreen extends StatefulWidget {
  const LoanHistoryScreen({super.key});

  @override
  State<LoanHistoryScreen> createState() => _LoanHistoryScreenState();
}

class _LoanHistoryScreenState extends State<LoanHistoryScreen> {
  bool _isLoading = true;
  List<dynamic> _loans = [];

  @override
  void initState() {
    super.initState();
    _fetchLoanHistory();
  }

  Future<void> _fetchLoanHistory() async {
    setState(() => _isLoading = true);
    
    // We already fetch the user profile which contains the loans, 
    // or we can fetch them from ApiClient if we add a dedicated method.
    // For now, let's use the profile endpoint.
    final profileData = await ApiClient.getStudentProfile();
    
    if (mounted) {
      setState(() {
        if (profileData != null && profileData['studentProfile'] != null && profileData['studentProfile']['loans'] != null) {
          _loans = profileData['studentProfile']['loans'];
          // Sort by date descending
          _loans.sort((a, b) => DateTime.parse(b['loanDate']).compareTo(DateTime.parse(a['loanDate'])));
        }
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).colorScheme.primary;

    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 800),
          child: CustomScrollView(
            slivers: [
          SliverAppBar(
            expandedHeight: 120.0,
            floating: false,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: Text('loan_history'.tr(), style: const TextStyle(fontWeight: FontWeight.bold)),
              titlePadding: const EdgeInsets.only(left: 20, bottom: 16),
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Theme.of(context).colorScheme.secondary, primaryColor.withValues(alpha: 0.8)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
              ),
            ),
          ),
          if (_isLoading)
            SliverFillRemaining(
              child: Center(child: CircularProgressIndicator(color: primaryColor)),
            )
          else if (_loans.isEmpty)
            SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.history_edu, size: 80, color: Colors.grey.withValues(alpha: 0.5)),
                    const SizedBox(height: 20),
                    Text(
                      'no_loan_history'.tr(),
                      style: TextStyle(color: Colors.grey.shade600, fontSize: 18),
                    ),
                  ],
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.all(15),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final loan = _loans[index];
                    final isReturned = loan['status'] == 'RETURNED';
                    final isLate = loan['status'] == 'LATE';
                    
                    final bookTitle = loan['book'] != null ? loan['book']['title'] : 'unknown_book'.tr();
                    final bookCover = loan['book'] != null ? loan['book']['coverImage'] : null;
                    final loanDate = DateFormat('dd MMM yyyy').format(DateTime.parse(loan['loanDate']));
                    final dueDate = DateFormat('dd MMM yyyy').format(DateTime.parse(loan['dueDate']));
                    final returnDate = loan['returnDate'] != null 
                        ? DateFormat('dd MMM yyyy').format(DateTime.parse(loan['returnDate'])) 
                        : 'not_returned_yet'.tr();

                    return Container(
                      margin: const EdgeInsets.only(bottom: 15),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surface,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.05),
                            blurRadius: 10,
                            offset: const Offset(0, 5),
                          )
                        ],
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(15),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Book Cover Thumbnail
                            Container(
                              width: 60,
                              height: 85,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(10),
                                color: primaryColor.withValues(alpha: 0.1),
                              ),
                              clipBehavior: Clip.hardEdge,
                              child: (bookCover != null && bookCover.toString().isNotEmpty)
                                  ? Image.network(
                                      ApiClient.getImageUrl(bookCover),
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
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                        child: Text(
                                          bookTitle,
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                        decoration: BoxDecoration(
                                          color: isReturned 
                                              ? Colors.green.withValues(alpha: 0.1)
                                              : (isLate ? Colors.red.withValues(alpha: 0.1) : Colors.orange.withValues(alpha: 0.1)),
                                          borderRadius: BorderRadius.circular(20),
                                        ),
                                        child: Text(
                                          loan['status'],
                                          style: TextStyle(
                                            color: isReturned ? Colors.green : (isLate ? Colors.red : Colors.orange),
                                            fontWeight: FontWeight.bold,
                                            fontSize: 10,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text('borrowed_on'.tr(), style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                          const SizedBox(height: 2),
                                          Text(loanDate, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                        ],
                                      ),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.end,
                                        children: [
                                          Text(isReturned ? 'returned_on'.tr() : 'due_date'.tr(), style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                          const SizedBox(height: 2),
                                          Text(isReturned ? returnDate : dueDate, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                        ],
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                  childCount: _loans.length,
                ),
              ),
            ),
        ],
      ),
    ),
  ),
);
}
}
