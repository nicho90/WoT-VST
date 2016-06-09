var pg = require('pg');
var types = require('pg').types;
types.setTypeParser(1700, 'text', parseFloat);
var _ = require('underscore');
var jwt = require('jsonwebtoken');
var secret = require('./../../config/secret');
var db_settings = require('../../server.js').db_settings;
var errors = require('./../../config/errors');
var verifier = require('./../../config/verifier');


// LIST
exports.request = function(req, res) {

    // Create URL
    var url = "postgres://" + db_settings.user + ":" + db_settings.password + "@" + db_settings.host + ":" + db_settings.port + "/" + db_settings.database_name;

    // Connect to Database
    pg.connect(url, function(err, client, done) {
        if (err) {
            res.status(errors.database.error_1.code).send(errors.database.error_1);
            return console.error(errors.database.error_1.message, err);
        } else {

            var query;

            // Check params
            if(req.params.sensor_id) {

                // Database Query
                client.query('SELECT * FROM Sensors WHERE sensor_id=$1;', [
                    req.params.sensor_id
                ], function(err, result) {
                    done();

                    if(err) {
                        res.status(errors.database.error_2.code).send(_.extend(errors.database.error_2, err));
                        return console.error(errors.database.error_2.message, err);
                    } else {

                        // Check if sensor exists
                        if(result.rows.length === 0) {
                            res.status(errors.query.error_2.code).send(errors.query.error_2);
                            return console.error(errors.query.error_2.message);
                        } else {

                            // Prepare Query
                            query = "SELECT " +
                                "emergency_stations.emergency_station_id, " +
                                "ST_Distance(emergency_stations.coordinates, sensors.coordinates) AS distance, " +
                                "'METER' AS distance_unit, " +
                                "emergency_stations.name, " +
                                "emergency_stations.phone_number, " +
                                "ST_X(emergency_stations.coordinates::geometry) AS lng, " +
                                "ST_Y(emergency_stations.coordinates::geometry) AS lat, " +
                                "emergency_stations.street, " +
                                "emergency_stations.house_number, " +
                                "emergency_stations.addition, " +
                                "emergency_stations.zip_code, " +
                                "emergency_stations.city, " +
                                "emergency_stations.country " +
                                "FROM Emergency_Stations emergency_stations, Sensors sensors " +
                                "WHERE sensors.sensor_id=$1 ORDER BY distance ASC LIMIT 5;";

                            // Database query
                            client.query(query, [
                                req.params.sensor_id
                            ], function(err, result) {
                                done();

                                if (err) {
                                    res.status(errors.database.error_2.code).send(_.extend(errors.database.error_2, err));
                                    return console.error(errors.database.error_2.message, err);
                                } else {

                                    // Send Result
                                    res.status(200).send(result.rows);
                                }
                            });
                        }
                    }
                });

            } else {

                // Check for longitude & latitude
                if(req.query.lng && req.query.lat){
                    query = "SELECT " +
                        "emergency_station_id, " +
                        "ST_Distance(coordinates, ST_GeographyFromText('POINT(" + req.query.lng + " " + req.query.lat + ")')) AS distance, " +
                        "'METER' AS distance_unit, " +
                        "name, " +
                        "phone_number, " +
                        "ST_X(coordinates::geometry) AS lng, " +
                        "ST_Y(coordinates::geometry) AS lat, " +
                        "street, " +
                        "house_number, " +
                        "addition, " +
                        "zip_code, " +
                        "city, " +
                        "country " +
                        "FROM Emergency_Stations ORDER BY distance ASC LIMIT 5;";
                } else {
                    query = "SELECT * FROM Emergency_Stations;";
                }

                // Database query
                client.query(query, function(err, result) {
                    done();

                    if (err) {
                        res.status(errors.database.error_2.code).send(_.extend(errors.database.error_2, err));
                        return console.error(errors.database.error_2.message, err);
                    } else {

                        // Send Result
                        res.status(200).send(result.rows);
                    }
                });
            }
        }
    });
};