// confirmation handler
// deletes from realtime database, inserts into firestore
exports.handler = function (req, res, admin) {
    console.log("Drone confirmed.");
    // get request with the drone id
    const droneId = req.query.droneId;
    // get drone
    const droneRef = admin.database().ref('/drones/' + droneId + '/drone');
    droneRef.on("value", snapshot => {
        const drone = snapshot.val();
        // get request with the user id
        const userId = req.query.userId;
        // write to firestore
        admin.firestore().collection('/drones').add({
            drone: drone,
            userId: userId,
            confirmationTime: new Date()
        }).then(writeResult => {
            // write is complete here.
            // delete drone from realtime db
            droneRef.set(null);
            // finish request
            return res.status(200).send({
                result: "success"
            });
            // catch exception
        }).catch(ex => {
            console.log(ex);
            return res.status(500).send({
                err: ex
            });
        });
    });
}
