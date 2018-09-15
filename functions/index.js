'use strict';

const requestDrone = require('./droneProvider');
const updateLocation = require('./droneLocation');

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
    requestDrone.handler(req, res, admin);
});
exports.updateLocation = functions.database.ref('/drones/{pushId}/drone').onUpdate((change, context) => {
    updateLocation.handler(change, context, admin);
});

