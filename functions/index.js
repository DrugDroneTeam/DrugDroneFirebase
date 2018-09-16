const requestDrone = require('./droneProvider');
const updateLocation = require('./droneLocation');
const confirmDrone = require('./droneConfirmation');

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

//exports.updateLocationCreated = admin.database().ref('drones').on("value", (change) => {
    // Grab the current value of what was written to the Realtime Database.
    //return updateLocation.handler(change, admin);
//});

