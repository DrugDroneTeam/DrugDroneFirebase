const clone = require("deepcopy");

// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /drones/:pushId/drone
exports.handler = function (req, res, admin) {
    console.log("Drone requested.");
    // validate requested parameters
    if (!requestIsValid(req)) {
        return res.status(401).send({
            error: "Not all required parameters present."
        });
    }
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

// handler for the Google Assistant WebHook
exports.assistedHandler = function (req, res, admin) {
    // actions setup
    const ActionsSdkApp = require('actions-on-google').ActionsSdkApp;
    const ApiAiApp = require('actions-on-google').ApiAiApp;
    const app = new ApiAiApp({ request: req, response: res });
    const intent = app.getIntent();
    // check intent
    switch (intent) {
        case 'input.welcome': {
            // you are able to request for multiple permissions at once
            const permissions = [
                app.SupportedPermissions.NAME,
                app.SupportedPermissions.DEVICE_PRECISE_LOCATION
            ];
            app.askForPermissions('We need to know where the medication has to go', permissions);
        }
            break;
        case 'Ineedmedication.Ineedmedication-fallback': {
            if (app.isPermissionGranted()) {
                // permissions granted.
                const displayName = app.getUserName().displayName;

                //NOTE: app.getDeviceLocation().address always return undefined for me. not sure if it is a bug.
                // 			app.getDeviceLocation().coordinates seems to return a correct values
                //			so i have to use node-geocoder to get the address out of the coordinates
                const coordinates = app.getDeviceLocation().coordinates;
                const address = app.getDeviceLocation().address;

                // we still do not have money to buy us out of google,
                // and can't expect users to tell us where the pharmacy is. So: just here, something, invented, hardcoded
                const start = {
                    long: 0,
                    lat: 40,
                    alt: 400
                };
                const pharma = {
                    long: 8.5188729999999993,
                    lat: 47.387764999999987,
                    alt: 412
                };
                const requestedDrone = {
                    start: start,
                    pharma: pharma,
                    end: {
                        "lat": coordinates.latitude,
                        "lon": coordinates.longitude,
                        "alt": 414
                    }
                };
                requestedDrone.pathPoints = findPath(requestedDrone.start, requestedDrone.end, requestedDrone.pharma, traffic);
                // set inital position to be moved
                requestedDrone.currentLocation = 0;
                // Push the new message into the Realtime Database using the Firebase Admin SDK.
                admin.database().ref('/drones').push({ drone: requestedDrone }).then((snapshot) => {
                    // Return last inserted id
                    // return res.status(200).send({
                    //     key: snapshot.key
                    // });
                    return true;
                }).catch((e) => {
                    return false;
                });
                app.tell('Dear ' + app.getUserName().givenName + '! We send medication to ' + address);
                return app.tell('It will arrive approx. at ' + requestedDrone.pathPoints[requestedDrone.pathPoints.length - 1].time.toLocaleDateString("en-US"));
            } else {
                // permissions are not granted. ask them one by one manually
                return app.ask('Alright. Can you tell me your coordinates please?');
            }
        }
        // break;
        default:
            return res.status(401).send({
                err: "invalid request"
            });
    }
    return app.tell('This text should never be read by anyone. Should. Ha. Ha.');
}

/**
 * Assert that all necessairy parameters are present
 *
 * @param {Object} req
 */
function requestIsValid(req) {
    const body = req.body;
    if (isset(body.traffic) && body.drone) {
        const drone = body.drone;
        return (
            (isset(drone.start) && isset(drone.start.lat) && isset(drone.start.lon) && isset(drone.end.alt))
            && (isset(drone.end) && isset(drone.end.lat) && isset(drone.end.lon) && isset(drone.end.alt))
        );
    }
    return false;
}

function isset(obj) {
    return typeof obj !== 'undefined';
}

/**
 * Find the path/the locations the drone will have.
 * In actuality, this should come from an API provided by the drone
 *
 * @param {Object} start
 * @param {Object} end
 * @param {Object} via e.g. the pharmacy
 * @param {Object} traffic
 */
function findPath(start, end, via, traffic) {
    if (!start.time) {
        start.time = new Date();
    } else if (!(start.time instanceof Date)) {
        start.time = new Date(start.time);
    }
    var path = [];
    // go to pharmacy
    if (via) {
        path = move(start, via, traffic);
        // at pharmacy, take drug
        if (path.length) {
            var pharmacyPath = clone(path[path.length - 1]);
            pharmacyPath.time.setSeconds(pharmacyPath.time.getSeconds() + 1);
            path.push(pharmacyPath);
        }
    } else {
        path.push(start);
    }
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
    var pos = clone(start);
    var cnt = 0;
    console.log(start, end);
    // as long as the drone is not at target
    while (pos.lat !== end.lat && pos.lon !== end.lon && pos.alt !== end.alt && cnt < 60) {
        // basic movement, ignoring speed changes, wind, collisions, mountains, masts, ...
        pos.lat = step(pos.lat, end.lat);
        pos.lon = step(pos.lon, end.lon);
        pos.alt = step(pos.alt, end.alt);
        pos.time.setSeconds(pos.time.getSeconds() + 1);
        path.push(clone(pos));
        // we do not want to have too much data & long ways
        cnt = cnt + 1;
    }
    // we overflew the max points. oh.
    if (cnt >= 60) {
        var endPos = clone(end);
        endPos.time = clone(pos.time);
        endPos.time.setSeconds(pos.time.getSeconds() + 1);
        path.push(endPos);
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
