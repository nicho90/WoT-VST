// Required packages
var usonic = require("r-pi-usonic");
var gpio = require("gpio");
var mqtt = require("mqtt");
var GeoJSON = require('geojson');
var broker = require("./config/broker");
var sensor = require("./config/sensor");
var gpio_settings = require("./config/gpio");
var ip = require("ip");

/**
 * Number of measurements that are used for selecting the median
 */
var numMeasure = 10;
/**
 * Phyiscal connection of a LED
 */
var led = gpio.export(gpio_settings.led, {
    direction: "out",
    ready: function() {}
});


/**
 * Scheduled measurment
 */
var scheduledTimer = {
    status: true,
    interval: sensor.interval, // default interval 1 min
    start: function() {
        if (!this.status) return;
        this.timeout = setTimeout(function() {
            scheduledTimer.publish();
        }, this.interval);
    },
    publish: function() {
        pubSD();
        //console.log("Scheduled publish " , measurements);
        measurements = []; //empty the measurements array to collect the next [numMeasure] measurements
        this.start();
    },
    stop: function() {
        clearTimeout(this.timeout);
        return;
    }
};


/**
 * Function to reset the scheduled timer interval
 */
var resetScheduledTimer = function() {
    scheduledTimer.stop();
    scheduledTimer.start();
};


/**
 * Realtime measurment
 */
var realtimeTimer = {
    status: false,
    interval: 1000,
    start: function() {
        if (!this.status) return;
        this.timeout = setTimeout(function() {
            realtimeTimer.publish();
        }, this.interval);
    },
    publish: function() {
        pubRT();
        this.start();
    },
    stop: function() {
        clearTimeout(this.timeout);
        return;
    }
};


/**
 * Function to reset the realtime timer interval
 */
var resetRealtimeTimer = function() {
    realtimeTimer.stop();
    realtimeTimer.start();
};


/**
 * Measurement object for storing every measurment and generating the message
 */
var measurement = {
    device_id: sensor.device_id,
    timestamp: new Date(),
    distance: {
        value: 0, // Distance in cm
        unit: "cm"
    },
    lng: sensor.lng, // (regarding geoMQTT)
    lat: sensor.lat // (regarding geoMQTT)
};

var measurements = []; // collect [numMeasure] measurements for publishing


/**
 *
 */
var measurementTimer = {
    stopped: false,
    interval: sensor.interval / numMeasure, // default measurement interval [numMeasure]x faster than scheduled interval
    start: function(iv) {
        this.stopped = false;
        if (iv) this.interval = iv;
        this.timeout = setTimeout(function() {
            measurementTimer.measure();
        }, this.interval);
    },
    measure: function() {
        if (this.stopped) return;
        // Make the measurement
        measurement.distance.value = gpio_settings.sensor();
        measurement.timestamp = new Date();
        measurements.push(JSON.parse(JSON.stringify(measurement))); // push measurement to the measurements array
        console.log("Distance " + measurement.distance.value + " measured at time " + measurement.timestamp);
        //this.blink(); // LED blinking disabled
        this.start();
    },
    blink: function() {
        led.set();
        setTimeout(function() {
            led.set(0);
        }, 100);
    },
    stop: function() {
        this.stopped = true;
        clearTimeout(this.timeout);
        return;
    }
};


/**
 * Function to set a new timer interval
 */
var setMeasurementTimer = function(iv) {
    measurementTimer.stop();
    measurementTimer.start(iv);
};


/**
 * Ultasonic Sensor initialization. Needs to be called once when script starts
 */
var initSensor = function() {
    usonic.init(function(error) {
        if (error) {
            console.log("Sensor initialization failed.");
        } else {
            console.log("Sensor initialization succeeded. " + new Date());
            gpio_settings.sensor = usonic.createSensor(gpio_settings.echo, gpio_settings.trig, gpio_settings.measurement_timeout);
            measurementTimer.start();
            scheduledTimer.start();
            realtimeTimer.start();
        }
    });
};


/**
 * Initialize and start the sensor
 */
initSensor();


/**
 * Create MQTT-Client and setup clientId, if MQTT-Broker is online (heartbeat)
 */
var client = mqtt.connect("mqtt://" + broker.url + ":" + broker.port, {
    encoding: 'utf8',
    clientId: sensor.device_id,
    will: { // Last Will (if Sensor goes offline)
        topic: 'dead',
        payload: 'mypayload',
        qos: 2,
        retain: true
    }
});


/**
 * Connect to MQTT-Broker
 */
client.on('connect', function() {
    console.log("Client connected");
    options = {
        qos: 2, // Quality of Service: 2 = at least once
        retain: true
    };
    client.subscribe('/data/realtime');
    client.subscribe('/settings');
    client.subscribe('/ipcheck');
});


/**
 * Publish message with scheduled data
 */
var pubSD = function() {
    client.publish(
        '/sensor/scheduled/measurement',
        JSON.stringify(GeoJSON.parse(measurements, {
            Point: ['lat', 'lng']
        })),
        this.options);
};


/**
 * Verify incomming scheduled settings
 */
var verifySD = function(message) {
    scheduledTimer.interval = message.interval;
    if (!realtimeTimer.status) {
        setMeasurementTimer(scheduledTimer.interval / numMeasure);
        resetScheduledTimer();
    }
};


/**
 * Publish message with realtime data
 */
var pubRT = function() {
    client.publish(
        '/sensor/realtime/measurement',
        JSON.stringify(GeoJSON.parse([measurement], {
            Point: ['lat', 'lng']
        })),
        this.options
    );
};


/**
 * Verify incomming realtime settings
 */
var verifyRT = function(message) {
    realtimeTimer.status = message.status;
    if (message.status) {
        measurementTimer.interval = realtimeTimer.interval;
        setMeasurementTimer(realtimeTimer.interval);
        resetRealtimeTimer();
    } else if (!message.status) {
        measurementTimer.interval = scheduledTimer.interval;
        setMeasurementTimer(scheduledTimer.interval);
        resetRealtimeTimer();
        resetScheduledTimer();
    }
};


/**
 * Publish the ip of the PI
 */
var pubIP = function() {
    client.publish(
        '/sensor/ip',
        //JSON.stringify(ifaces.wlan0),
        ip.address().toString(),
        this.options
    );
};


/**
 * Recieve Messages from MQTT-Broker
 */
client.on('message', function(topic, message) {
    var _message = JSON.parse(message);
    console.log(_message);
    if (_message.device_id == sensor.device_id) {
        switch (topic) {
            case '/data/realtime':
                verifyRT(_message);
                break;
            case '/settings':
                verifySD(_message);
                break;
            case '/ipcheck':
                pubIP();
                break;
            default:
                console.log("MQTT receive invalid topic.");
        }
    } else {
        console.log("MQTT receive invalid id.");
    }
});
