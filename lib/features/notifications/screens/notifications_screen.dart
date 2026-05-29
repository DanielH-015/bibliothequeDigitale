import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../core/network/api_client.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool _isLoading = true;
  List<dynamic> _notifications = [];

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
  }

  Future<void> _fetchNotifications() async {
    setState(() => _isLoading = true);
    final data = await ApiClient.getNotifications();
    if (mounted) {
      setState(() {
        _notifications = data ?? [];
        _isLoading = false;
      });
    }
  }

  Future<void> _markAsRead(int id, int index) async {
    final success = await ApiClient.markNotificationAsRead(id);
    if (success && mounted) {
      setState(() {
        _notifications[index]['isRead'] = true;
      });
    }
  }

  Future<void> _deleteNotification(int id, int index) async {
    final success = await ApiClient.deleteNotification(id);
    if (success && mounted) {
      setState(() {
        _notifications.removeAt(index);
      });
    }
  }

  String _translateNotification(String typeCode, Map<String, dynamic> payload) {
    switch (typeCode) {
      case 'WELCOME':
        return 'notif_welcome'.tr(args: [payload['userName'] ?? '']);
      case 'NEW_BOOK':
        return 'notif_new_book'.tr(args: [payload['bookTitle'] ?? '']);
      case 'REMINDER_24H':
        return 'notif_reminder_24h'.tr(args: [payload['bookTitle'] ?? '']);
      case 'REMINDER_TODAY':
        return 'notif_reminder_today'.tr(args: [payload['bookTitle'] ?? '']);
      case 'REMINDER_LATE_1D':
        return 'notif_late_1d'.tr(args: [payload['bookTitle'] ?? '']);
      case 'OVERDUE_MANUAL_ALERT':
        return 'notif_manual_alert'.tr(args: [payload['bookTitle'] ?? '']);
      default:
        return "Notification: $typeCode";
    }
  }

  IconData _getIconForType(String typeCode) {
    if (typeCode == 'NEW_BOOK') return Icons.menu_book;
    if (typeCode.contains('LATE') || typeCode.contains('OVERDUE')) return Icons.warning_amber_rounded;
    return Icons.notifications_active;
  }

  Color _getColorForType(String typeCode) {
    if (typeCode == 'NEW_BOOK') return Colors.blue;
    if (typeCode.contains('LATE') || typeCode.contains('OVERDUE')) return Colors.red;
    return Colors.orange;
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
              title: Text('notifications'.tr(), style: const TextStyle(fontWeight: FontWeight.bold)),
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
          else if (_notifications.isEmpty)
            SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.notifications_off_outlined, size: 80, color: Colors.grey.withValues(alpha: 0.5)),
                    const SizedBox(height: 20),
                    Text(
                      'no_notifications'.tr(),
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
                    final notif = _notifications[index];
                    final isRead = notif['isRead'] == true;
                    Map<String, dynamic> payload = {};
                    try {
                      payload = jsonDecode(notif['payloadJson']);
                    } catch (e) {
                      // ignore
                    }

                    final message = _translateNotification(notif['typeCode'], payload);
                    final date = DateTime.parse(notif['createdAt']);
                    final formattedDate = DateFormat('dd MMM yyyy, HH:mm').format(date);
                    final typeColor = _getColorForType(notif['typeCode']);

                    return Dismissible(
                      key: Key(notif['id'].toString()),
                      direction: DismissDirection.endToStart,
                      background: Container(
                        alignment: Alignment.centerRight,
                        padding: const EdgeInsets.only(right: 20),
                        margin: const EdgeInsets.only(bottom: 15),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Icon(Icons.delete, color: Colors.white, size: 30),
                      ),
                      onDismissed: (direction) {
                        _deleteNotification(notif['id'], index);
                      },
                      child: Container(
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
                          border: Border.all(
                            color: isRead ? Colors.transparent : primaryColor.withValues(alpha: 0.3),
                            width: 1.5,
                          ),
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(20),
                            onTap: () {
                              if (!isRead) _markAsRead(notif['id'], index);
                            },
                            child: Padding(
                              padding: const EdgeInsets.all(15),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Icon Box
                                  Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: typeColor.withValues(alpha: 0.1),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(_getIconForType(notif['typeCode']), color: typeColor, size: 24),
                                  ),
                                  const SizedBox(width: 15),
                                  // Content
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text(
                                              formattedDate,
                                              style: TextStyle(
                                                fontSize: 12,
                                                color: Colors.grey.shade500,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                            if (!isRead)
                                              Container(
                                                width: 10,
                                                height: 10,
                                                decoration: BoxDecoration(
                                                  color: primaryColor,
                                                  shape: BoxShape.circle,
                                                ),
                                              ),
                                          ],
                                        ),
                                        const SizedBox(height: 8),
                                        Text(
                                          message,
                                          style: TextStyle(
                                            fontWeight: isRead ? FontWeight.normal : FontWeight.w600,
                                            fontSize: 15,
                                            height: 1.4,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                  childCount: _notifications.length,
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
