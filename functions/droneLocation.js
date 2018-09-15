
const clone = require("deepcopy");

// Listens for new messages added to /drones/
exports.handler = function (snapshot, admin) {
    // move the drone by one second
    console.log(snapshot);
    console.log(JSON.stringify(snapshot));
    const key = Object.keys(snapshot)[0];
    var originalDrone = snapshot[key].drone;
    console.log(JSON.stringify(originalDrone));
    console.log(originalDrone.currentLocation, originalDrone.pathPoints.length, key);
    originalDrone.currentLocation = originalDrone.currentLocation + 1;
    // destination reached when all paths ran through
    if (!originalDrone.pathPoints) {
        console.log("pathPoints false", JSON.stringify(originalDrone));
        return;
    }
    console.log(originalDrone.currentLocation, originalDrone.pathPoints.length, key);
    if (originalDrone.currentLocation >= originalDrone.pathPoints.length) {
        // notificate delivery
        var message = {
            notification: {
                title: "Drone deployed.",
                body: "Enjoy your life, thanks for living with DrugDrones"
            },
            topic: "drone-status"
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
        return;
    }
    sleep(100); // sleep 1000 ms = 1 sec
    // write update to db
    console.log("updating " + key);
    //snapshot.child(key + '/drone').ref.update(originalDrone);
    // snapshot.child(key).ref.set({ drone: originalDrone });
    return admin.database.ref('/drones/' + key).set({ drone: originalDrone }, (result) => {
        return console.log("res", result);
    });
    //admin.database('/drones/' + key + '/drone').ref.set(originalDrone);
    // snapshot.update(originalDrone);
};

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e30; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}
