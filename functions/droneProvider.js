// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
require("index")

// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /drones/:pushId/drone
exports.requestDrone = functions.https.onRequest((req, res) => {
    // Grab the drone parameter.
    const requestedDrone = req.body.drone;
    // Grab the air traffic data.
    const traffic = req.body.traffic;
    // Find the ideal route for the drone
    requestedDrone.pathPoints = findPath(requestedDrone.start, requestedDrone.end, requestedDrone.pharma, traffic);
    // set inital position to be moved
    requestedDrone.currentLocation = 0;
    // Push the new message into the Realtime Database using the Firebase Admin SDK.
    return admin.database().ref('/drones').push({ drone: requestedDrone }).then((snapshot) => {
        // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
        return res.redirect(303, snapshot.ref.toString());
    });
});

/**
 * Find the path/the locations the drone will have.
 * In actuality, this should come from an API provided by the drone
 *
 * @param {Object} start
 * @param {Object} end
 * @param {Object} via
 * @param {Object} traffic
 */
function findPath(start, end, via, traffic) {
    // go to pharmacy
    var path = move(start, via, traffic);
    // at pharmacy, take drug
    pos.time += 60;
    // go to target
    var path2 = move(path[path.length - 1], end, traffic);
    path.concat(path2);
    return path;
}

/**
 * Get the path for one point to one other
 *
 * @param {Object} start
 * @param {Object} end
 * @param {Object} traffic
 */
function move(start, end, traffic) {
    var path = [];
    var pos = start;
    // as long as the drone is not at target
    while (pos.lat !== end.lat || pos.lon !== end.lon || pos.alt !== end.alt) {
        // basic movement, ignoring speed changes, wind, collisions, mountains, masts, ...
        pos.lat = step(pos.lat, end.lat);
        pos.lon = step(pos.lon, end.lon);
        pos.alt = step(pos.alt, end.alt);
        pos.time += 60;
        path.push(Object.clone(pos));
    }
    return path;
}

/**
 * Get one path further
 *
 * @param {Object} start
 * @param {Object} target
 */
function step(start, target) {
    if (start === target) {
        return target;
    }
    var speedOfDrone = 80 * (1000 / 360); // km/h => m/s
    var prefix = start > target ? -1 : 1;
    var next = start + prefix * speedOfDrone * 1;
    var prefix2 = next > target ? -1 : 1;
    return prefix2 !== prefix ? target : next;
}
