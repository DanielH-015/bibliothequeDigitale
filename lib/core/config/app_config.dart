class AppConfig {

  // CONFIGURATION DU RESEAU LOCAL


  static const String serverIp = '172.20.10.2';
  
  static const String serverPort = '5000';
  
  // URLs générées automatiquement
  static const String baseUrl = 'http://$serverIp:$serverPort/api';
  static const String socketUrl = 'http://$serverIp:$serverPort';
}
