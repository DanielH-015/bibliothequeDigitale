const { io } = require("socket.io-client");

// Fichier de simulation pour la fonction de scan de notre application
// Simulation de la connection au backend 
const socket = io("http://172.20.10.2:5000");

socket.on("connect", () => {
  console.log(" Simulation du téléphone connectée !");
  
  // simulation de la fonctionnalité de scan du Qr code de l'étudiant par la bibliothécaire 
  console.log(" Envoi du code étudiant au serveur...");
  socket.emit("mobile-scan", { studentId: "ETUDIANT-2026-89" });
  
  // fermeture du script après 1 seconde
  setTimeout(() => process.exit(0), 1000);
});
