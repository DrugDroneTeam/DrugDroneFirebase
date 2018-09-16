
const clone = require("deepcopy");

// Listens for new drones added to /drones/
exports.handler = function (snapshot, admin) {
    // move the drone by delta t
    if (!snapshot || !snapshot.val()) {
        // this may occurr as we also subscribe to the "delete" event
        console.warn("No snapshot to move.", snapshot);
        return;
    }
    const key = Object.keys(snapshot.val())[0];
    console.log("moving snapshot with key " + key);
    var originalDrone = clone(snapshot.val()[key].drone);
    if (Math.random() < 0.25) {
        console.log(originalDrone.currentLocation, originalDrone.pathPoints.length, key);
        console.log(JSON.stringify(originalDrone));
    }
    originalDrone.currentLocation = originalDrone.currentLocation + 1;
    // destination reached when all paths ran through
    if (!originalDrone.pathPoints) {
        console.log("pathPoints false", JSON.stringify(originalDrone));
        return;
    }
    if (originalDrone.currentLocation >= originalDrone.pathPoints.length) {
        //snapshot.off("value");
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
    sleep(350); // sleep 1000 ms = 1 sec
    // write update to db
    console.log("finally updating " + key);
    var promise = admin.database().ref('drones/' + key + '/drone').set(originalDrone);
    // snapshot.update(originalDrone);
    promise.then(() => {
        console.log("promised then after update of " + key);
        return true;
        // work with the document snapshot here, and send your response
    })
        .catch(error => {
            // deal with any errors if necessary.
            return response.status(500).send(error)
        });
};

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e30; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}
