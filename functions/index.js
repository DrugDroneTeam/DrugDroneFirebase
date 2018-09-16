const requestDrone = require('./droneProvider');
const updateLocation = require('./droneLocation');
const confirmDrone = require('./droneConfirmation');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

exports.requestDrone = functions.https.onRequest((req, res) => {
    return requestDrone.handler(req, res, admin);
});
exports.requestDroneAssisted = functions.https.onRequest((req, res) => {
    return requestDrone.assistedHandler(req, res, admin);
});
exports.confirmDrone = functions.https.onRequest((req, res) => {
    return confirmDrone.handler(req, res, admin);
});
//exports.updateLocationCreated = admin.database().ref('drones').onWrite((change) => {
//exports.updateLocationCreated = functions.database.ref('drones').on("value", (change) => {
exports.updateLocationCreated = admin.database().ref('drones').on("value", (change) => {
    // Grab the current value of what was written to the Realtime Database.
    return updateLocation.handler(change, admin);
});
//exports.updateLocationUpdated = functions.database.ref('/drones/{pushId}/drone').onChange((snapshot) => {
//    return updateLocation.handler(snapshot, admin);
//});

