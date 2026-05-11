import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/network/api_client.dart';
import '../../../shared/widgets/custom_snackbar.dart';

class EditProfileScreen extends StatefulWidget {
  final Map<String, dynamic> studentData;

  const EditProfileScreen({super.key, required this.studentData});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  File? _selectedImage;

  // Text Controllers
  late TextEditingController _firstNameController;
  late TextEditingController _lastNameController;
  late TextEditingController _emailController;
  late TextEditingController _regNumberController;
  late TextEditingController _parentEmailController;

  // Dropdown Options & Selected Values
  final List<String> _classroomOptions = ['L1', 'L2', 'L3', 'M1', 'M2', 'PhD'];
  final List<String> _studyStreamOptions = [
    'Computer Science',
    'Mathematics',
    'Physics',
    'Literature',
    'Business',
    'Law',
    'Medicine',
  ];

  String? _selectedClassroom;
  String? _selectedStudyStream;

  @override
  void initState() {
    super.initState();
    final profile = widget.studentData['studentProfile'] ?? {};

    _firstNameController = TextEditingController(
      text: widget.studentData['firstName'],
    );
    _lastNameController = TextEditingController(
      text: widget.studentData['lastName'],
    );
    _emailController = TextEditingController(text: widget.studentData['email']);
    _regNumberController = TextEditingController(
      text: profile['registrationNumber'],
    );
    _parentEmailController = TextEditingController(
      text: profile['parentEmail'],
    );

    // Safely assign Dropdown values (add existing DB value to list if it's missing)
    String? existingClass = profile['classroom'];
    if (existingClass != null && existingClass.isNotEmpty) {
      if (!_classroomOptions.contains(existingClass)) {
  _classroomOptions.add(existingClass);
}

      _selectedClassroom = existingClass;
    }

    String? existingStream = profile['studyStream'];
    if (existingStream != null && existingStream.isNotEmpty) {
      if (!_studyStreamOptions.contains(existingStream)) {
  _studyStreamOptions.add(existingStream);
}

    }
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _regNumberController.dispose();
    _parentEmailController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.gallery);

    if (image != null) {
      setState(() => _selectedImage = File(image.path));
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    final dataToUpdate = {
      'firstName': _firstNameController.text.trim(),
      'lastName': _lastNameController.text.trim(),
      'email': _emailController.text.trim(),
      'registrationNumber': _regNumberController.text.trim(),
      'classroom': _selectedClassroom ?? '',
      'studyStream': _selectedStudyStream ?? '',
      'parentEmail': _parentEmailController.text.trim(),
    };

    final bool textSuccess = await ApiClient.updateStudentProfile(dataToUpdate);

    // if an image isn't choose we send it
    bool photoSuccess = true;
    if (_selectedImage != null) {
      photoSuccess = await ApiClient.uploadProfilePhoto(_selectedImage!.path);
    }

    if (mounted) {
      setState(() => _isLoading = false);

      if (!textSuccess) {
        CustomSnackBar.showError(
          context,
          'Failed to update profile information. Please try again.',
        );
      } else if (!photoSuccess) {
        CustomSnackBar.showError(
          context,
          'Profile updated, but failed to upload photo. Please try again.',
        );
      } else {
        CustomSnackBar.showSuccess(context, 'Profile updated successfully!');
        Navigator.pop(context, true);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).colorScheme.primary;

    return Scaffold(
      appBar: AppBar(title: const Text('Edit Profile')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(25.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              // PHOTO PICKER
              Center(
                child: Stack(
                  children: [
                    CircleAvatar(
                      radius: 60,
                      backgroundColor: primaryColor.withValues(alpha: 0.2),
                      backgroundImage: _selectedImage != null
                          ? FileImage(_selectedImage!)
                          : null,
                      child: _selectedImage == null
                          ? Icon(Icons.person, size: 60, color: primaryColor)
                          : null,
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: InkWell(
                        onTap: _pickImage,
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(color: Colors.black26, blurRadius: 5),
                            ],
                          ),
                          child: Icon(
                            Icons.camera_alt,
                            color: primaryColor,
                            size: 22,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 30),

              // TEXT FIELDS
              _buildTextField(
                'First Name',
                _firstNameController,
                Icons.person_outline,
              ),
              const SizedBox(height: 15),
              _buildTextField(
                'Last Name',
                _lastNameController,
                Icons.person_outline,
              ),
              const SizedBox(height: 15),
              _buildTextField(
                'Email Address',
                _emailController,
                Icons.email_outlined,
                isEmail: true,
              ),
              const Divider(height: 40),

              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Academic Details',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
              ),
              const SizedBox(height: 15),
              _buildTextField(
                'Registration Number',
                _regNumberController,
                Icons.badge_outlined,
              ),
              const SizedBox(height: 15),

              // DROPDOWNS
              _buildDropdownField(
                label: 'Classroom',
                currentValue: _selectedClassroom,
                options: _classroomOptions,
                icon: Icons.class_outlined,
                onChanged: (val) => setState(() => _selectedClassroom = val),
              ),
              const SizedBox(height: 15),
              _buildDropdownField(
                label: 'Study Stream',
                currentValue: _selectedStudyStream,
                options: _studyStreamOptions,
                icon: Icons.book_outlined,
                onChanged: (val) => setState(() => _selectedStudyStream = val),
              ),
              const SizedBox(height: 15),

              _buildTextField(
                'Parent Email',
                _parentEmailController,
                Icons.family_restroom,
                isEmail: true,
              ),
              const SizedBox(height: 30),

              // SAVE BUTTON
              SizedBox(
                width: double.infinity,
                height: 55,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _saveProfile,
                  child: _isLoading
                      ? const SizedBox(
                          height: 25,
                          width: 25,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 3,
                          ),
                        )
                      : const Text(
                          'Save Changes',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Text Field Helper
  Widget _buildTextField(
    String label,
    TextEditingController controller,
    IconData icon, {
    bool isEmail = false,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: isEmail ? TextInputType.emailAddress : TextInputType.text,
      validator: (value) => (value == null || value.trim().isEmpty)
          ? 'This field is required'
          : null,
      decoration: InputDecoration(labelText: label, prefixIcon: Icon(icon)),
    );
  }

  // Dropdown Field Helper
  Widget _buildDropdownField({
    required String label,
    required String? currentValue,
    required List<String> options,
    required IconData icon,
    required Function(String?) onChanged,
  }) {
    return DropdownButtonFormField<String>(
      initialValue: currentValue,
      decoration: InputDecoration(labelText: label, prefixIcon: Icon(icon)),
      items: options.map((String val) {
        return DropdownMenuItem<String>(value: val, child: Text(val));
      }).toList(),
      onChanged: onChanged,
      validator: (value) => value == null ? 'Please select an option' : null,
    );
  }
}
