const clone = require("deepcopy");

// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /drones/:pushId/drone
exports.handler = function (req, res, admin) {
    console.log("Drone requested.");
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
        // Return last inserted id
        return res.status(200).send({
            key: snapshot.key
        });
    });
};

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
    if (!start.time) {
        start.time = new Date();
    } else if (!(start.time instanceof Date)) {
        start.time = new Date(start.time);
    }
    // go to pharmacy
    var path = move(start, via, traffic);
    // at pharmacy, take drug
    var pharmacyPath = clone(path[path.length - 1]);
    pharmacyPath.time.setSeconds(pharmacyPath.time.getSeconds() + 1);
    path.push(pharmacyPath);
    // go to target
    var path2 = move(path[path.length - 1], end, traffic);
    return path.concat(path2);
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
    while (pos.lat !== end.lat && pos.lon !== end.lon && pos.alt !== end.alt) {
        // basic movement, ignoring speed changes, wind, collisions, mountains, masts, ...
        pos.lat = step(pos.lat, end.lat);
        pos.lon = step(pos.lon, end.lon);
        pos.alt = step(pos.alt, end.alt);
        pos.time.setSeconds(pos.time.getSeconds() + 1);
        path.push(clone(pos));
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
    var speedOfDrone = 80 / 360; // [km/h] => [km/s] because step t in [s]
    var prefix = start > target ? -1 : 1;
    var next = start + prefix * speedOfDrone * 1;
    var prefix2 = next > target ? -1 : 1;
    return prefix2 !== prefix ? target : next;
}
