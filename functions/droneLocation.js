
const clone = require("deepcopy");

// Listens for new messages added to /drones/:pushId/original
//
exports.handler = function (change, context, admin) {
    // Grab the current value of what was written to the Realtime Database.
    const original = change.after.val();
    // move the drone by one second
    var moved = clone(original);
    moved.currentLocation = original.currentLocation + 1;
    // destination reached when all paths ran through
    if (!(moved.currentLocation < moved.pathPoints.length)) {
        // notificate delivery
        var message = {
            notification: {
                title: "Drone deployed.",
                body: "Enjoy your life, thanks for living with DrugDrones"
            }
        };
        admin.messaging().send(message)
            .then((response) => {
                // Response is a message ID string.
                console.log('Successfully sent message:', response);
                return response;
            })
            .catch((error) => {
                console.log('Error sending message:', error);
            });
    }
    sleep(60);
    // You must return a Promise when performing asynchronous tasks inside a Functions such as
    // writing to the Firebase Realtime Database.
    // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
    return snapshot.ref.set(moved);
};

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e30; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}
