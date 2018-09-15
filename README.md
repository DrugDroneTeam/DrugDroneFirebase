# DrugDroneFirebase
Entry for HackZurich 2018.

Firebase backend to get drone location. This simulates an API of a live drone.

Methods:
- GET: `/confirmDrone?droneId={droneId}&userId={userId}`: confirm, that the drone has arrived.
  This allows the drone to return home.
- POST: `/requestDrone`: Request a drone. Pass objects:
    - `traffic`: is an object of air traffic the drone has to take care of. It represents the API provided
      by Swisscom, which is not be fetched by this API itself to save Firebase credits.
    - `drone`: has properties `start`, `end` for the current drone location and the final target.
      Pass also `pharma` if it has to stop by a pharmacie to get the medication. Each of these
      parameters is an object with `lat`, `lon`, and `alt` corresponding to lattitude, longitude and
      altitude.

You can connect to the reallifedatabase to get each the current location of the drone.
