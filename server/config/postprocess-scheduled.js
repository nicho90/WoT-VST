/**
 * Postprocess Observations from the Scheduled topic
 */
exports.process = function(message) {

    var pg = require('pg');
    var db_settings = require('../server.js').db_settings;
    var async = require('async');
    var errors = require('./errors');

    var transporter = require('./email.js').transporter;
    var _mailOptions = require('./email.js').mailOptions;
    var path = require('path');
    var fs = require('fs');
    var mustache = require('mustache');


    // Create URL
    var url = "postgres://" + db_settings.user + ":" + db_settings.password + "@" + db_settings.host + ":" + db_settings.port + "/" + db_settings.database_name;

    // Connect to Database
    pg.connect(url, function(err, client, done) {

        if (err) {
            return console.error(errors.database.error_1.message, err);
        } else {

            // Start pipeline
            async.waterfall([

                // 1. Calculate Median
                function(callback) {
                    var measurements = JSON.parse(message).features;
                    var measurement = median(measurements); //Select the median measurement
                    //console.log("Half: ", measurement);
                    callback(null, measurement);
                },

                // 2. Find sensor_id in Sensors with device_id
                function(measurement, callback) {

                    // Database query
                    client.query('SELECT * FROM Sensors WHERE device_id=$1;', [
                        measurement.properties.device_id
                    ], function(err, result) {
                        done();

                        if (err) {
                            console.error(errors.database.error_2.message, err);
                            callback(new Error(errors.database.error_2.message));
                        } else {
                            if (result.rows.length > 0) {
                                callback(null, measurement, result.rows[0].sensor_id);
                            } else {
                                console.error(errors.query.error_2.message);
                                callback(new Error(errors.query.error_2.message));
                            }
                        }
                    });
                },

                // 3. Save new measuremt in Database
                function(measurement, sensor, callback) {

                    // Database query
                    client.query('INSERT INTO Measurements (created, updated, sensor_id, distance, measured) VALUES (now(), now(), $1, $2, now());', [
                        sensor.sensor_id,
                        measurement.properties.distance //,
                        // TODO: Use measurement.measured instead of now()
                    ], function(err, result) {
                        done();

                        if (err) {
                            console.error(errors.database.error_2.message, err);
                            callback(new Error(errors.database.error_2.message));
                        } else {
                            callback(null, measurement, sensor);
                        }
                    });
                },

                // 4. Check Sensor-Settings for threshold
                function(measurement, sensor, callback) {

                    // TODO:
                    // - Change sensor.interval to sensor.default_frequency and sensor.threshold_frequency in PostgreSQL-Schemas
                    // - Rename threshold.value to threshold.threshold_value in PostgreSQL-Schema

                    if (measurement.properties.distance > sensor.threshold) {
                        // TODO: Send MQTT-Message increase frequency
                        callback(null, measurement, sensor);
                    } else {
                        // TODO: Send MQTT-Message decrease frequency
                        callback(null, measurement, sensor);
                    }
                },

                // 5. Get all subscribed Users for this sensor
                function(measurement, sensor, callback) {

                    var query = "SELECT DISTINCT" +
                        "users.username, " +
                        "users.email_address, " +
                        "users.first_name, " +
                        "users.last_name " +
                        "FROM Subscriptions subscriptions JOIN Users users ON subscriptions.username=users.username " +
                        "WHERE subscriptions.sensor_id=$1;";

                    // Database query
                    client.query(query, [
                        sensor.sensor_id
                    ], function(err, result) {
                        done();

                        if (err) {
                            console.error(errors.database.error_2.message, err);
                            callback(new Error(errors.database.error_2.message));
                        } else {
                            callback(null, measurement, sensor, result.rows);
                        }
                    });
                },

                // 6. Check all Thresholds of subscribed Users for this sensor
                function(measurement, sensor, users, callback) {

                    async.each(users, function(user, callback) {

                        var query = "SELECT " +
	                        "subscriptions.subscription_id, " +
	                        "subscriptions.threshold_id, " +
                        	"thresholds.description, " +
                        	"thresholds.category, " +
                        	"thresholds.value" +
                            "FROM Subscriptions subscriptions JOIN Thresholds thresholds ON subscriptions.threshold_id=thresholds.threshold_id " +
                            "WHERE subscriptions.sensor_id=$1 AND subscriptions.username=$2 AND thresholds.value > $3;";

                        // Database query
                        client.query(query, [
                            sensor.sensor_id,
                            user.username,
                            measurement.properties.distance
                        ], function(err, result) {
                            done();

                            if (err) {
                                console.error(errors.database.error_2.message, err);
                                callback(new Error(errors.database.error_2.message));
                            } else {

                                if(result.rows.lenght > 0){

                                    console.log(result.rows);
                                    var triggered_thresholds = result.rows;

                                    // Read Template
	                                fs.readFile(path.join(__dirname, '../templates/notification.html'), function(err, data) {
	                                    if (err) throw err;

	                                    // Render HTML-content
	                                    var output = mustache.render(data.toString(), user, sensor, triggered_thresholds);

	                                    // Create Text for Email-Previews and Email without HTML-support
	                                    var text =
	                                        'Attention ' + user.first_name + ' ' + user.last_name + '!\n' +
	                                        'At least one of your thresholds has been triggered for a  sensor, which you are subscribed to!\n\n\n' +
                                            // TODO: Input Sensor and list all thresholds
	                                        'GWoT-VST - Institute for Geoinformatics (Heisenbergstraße 2, 48149 Münster, Germany)';

	                                    // Set Mail options
	                                    var mailOptions = {
	                                        from: _mailOptions.from,
	                                        to: user.email_address,
	                                        subject: 'One or more thresholds has been triggered!',
	                                        text: text,
	                                        html: output
	                                    };

	                                    // Send Email
	                                    transporter.sendMail(mailOptions, function(error, info) {
	                                        if (error) {
	                                            return console.log(error);
	                                        } else {
	                                            console.log('Message sent: ' + info.response);
	                                        }
	                                    });
	                                });

                                    // TODO:
                                    // - Emit Websocket-notification if result.rows.lenght > 0!

                                    callback();
                                } else {
                                    callback();
                                }
                            }
                        });
                    }, function(err) {
                        if (err) {
                            console.error("");
                            callback(new Error(""));
                        } else {
                            console.log("Emails were sent to all users!");
                            callback(null);
                        }
                    });

                }
            ], function(err, callback) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Pipeline has been finished!");
                }
            });
        }
    });
};


/**
 * Calculate Median from 5 measurement values
 * @param  {[type]} values [description]
 * @return {[type]}        [description]
 */
function median(values) {
    values.sort(function(a, b) {
        return a.properties.distance.value - b.properties.distance.value;
    });
    var half = Math.floor(values.length / 2);
    return values[half];
}
