var mqtt = require('mqtt');
var client = mqtt.connect('mqtt://giv-gwot-vst.uni-muenster.de:1883');

client.on('connect', function() {
    //client.publish('/data/realtime', '{"device_id": "rpi-1","status" : true}', {retain: false, qa: 1});
    //client.publish('/data/realtime', '{"device_id": "rpi-1","status" : false}', {retain: false, qa: 1});
    //client.publish('/settings', '{"device_id": "rpi-1","interval": 5000}', {retain: false, qa: 1});

    // Manipulate for testing
    //var data = '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[0,0]},"properties":{"device_id":"rpi-3","timestamp":"2016-07-05T14:18:20.932Z","distance":{"value":200,"unit":"cm"}}},{"type":"Feature","geometry":{"type":"Point","coordinates":[0,0]},"properties":{"device_id":"rpi-3","timestamp":"2016-07-05T14:18:43.407Z","distance":{"value":200,"unit":"cm"}}},{"type":"Feature","geometry":{"type":"Point","coordinates":[0,0]},"properties":{"device_id":"rpi-3","timestamp":"2016-07-05T14:18:55.428Z","distance":{"value":200,"unit":"cm"}}},{"type":"Feature","geometry":{"type":"Point","coordinates":[0,0]},"properties":{"device_id":"rpi-3","timestamp":"2016-07-05T14:19:07.460Z","distance":{"value":200,"unit":"cm"}}},{"type":"Feature","geometry":{"type":"Point","coordinates":[0,0]},"properties":{"device_id":"rpi-3","timestamp":"2016-07-05T14:19:19.495Z","distance":{"value":200,"unit":"cm"}}}]}';
    //var data = '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[0,0]},"properties":{"device_id":"rpi-3","timestamp":"2016-07-05T14:18:20.932Z","distance":{"value":193,"unit":"cm"}}},{"type":"Feature","geometry":{"type":"Point","coordinates":[0,0]},"properties":{"device_id":"rpi-3","timestamp":"2016-07-05T14:18:43.407Z","distance":{"value":193,"unit":"cm"}}},{"type":"Feature","geometry":{"type":"Point","coordinates":[0,0]},"properties":{"device_id":"rpi-3","timestamp":"2016-07-05T14:18:55.428Z","distance":{"value":193,"unit":"cm"}}},{"type":"Feature","geometry":{"type":"Point","coordinates":[0,0]},"properties":{"device_id":"rpi-3","timestamp":"2016-07-05T14:19:07.460Z","distance":{"value":193,"unit":"cm"}}},{"type":"Feature","geometry":{"type":"Point","coordinates":[0,0]},"properties":{"device_id":"rpi-3","timestamp":"2016-07-05T14:19:19.495Z","distance":{"value":193,"unit":"cm"}}}]}';
    //var data = '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[0,0]},"properties":{"device_id":"rpi-3","timestamp":"2016-07-05T14:18:20.932Z","distance":{"value":188,"unit":"cm"}}},{"type":"Feature","geometry":{"type":"Point","coordinates":[0,0]},"properties":{"device_id":"rpi-3","timestamp":"2016-07-05T14:18:43.407Z","distance":{"value":188,"unit":"cm"}}},{"type":"Feature","geometry":{"type":"Point","coordinates":[0,0]},"properties":{"device_id":"rpi-3","timestamp":"2016-07-05T14:18:55.428Z","distance":{"value":188,"unit":"cm"}}},{"type":"Feature","geometry":{"type":"Point","coordinates":[0,0]},"properties":{"device_id":"rpi-3","timestamp":"2016-07-05T14:19:07.460Z","distance":{"value":188,"unit":"cm"}}},{"type":"Feature","geometry":{"type":"Point","coordinates":[0,0]},"properties":{"device_id":"rpi-3","timestamp":"2016-07-05T14:19:19.495Z","distance":{"value":188,"unit":"cm"}}}]}';
    var data = '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[0,0]},"properties":{"device_id":"rpi-1","timestamp":"2016-07-13T14:18:20.932Z","distance":{"value":100,"unit":"cm"}}},{"type":"Feature","geometry":{"type":"Point","coordinates":[0,0]},"properties":{"device_id":"rpi-1","timestamp":"2016-07-05T14:18:43.407Z","distance":{"value":100,"unit":"cm"}}},{"type":"Feature","geometry":{"type":"Point","coordinates":[0,0]},"properties":{"device_id":"rpi-1","timestamp":"2016-07-05T14:18:55.428Z","distance":{"value":100,"unit":"cm"}}},{"type":"Feature","geometry":{"type":"Point","coordinates":[0,0]},"properties":{"device_id":"rpi-1","timestamp":"2016-07-05T14:19:07.460Z","distance":{"value":100,"unit":"cm"}}},{"type":"Feature","geometry":{"type":"Point","coordinates":[0,0]},"properties":{"device_id":"rpi-1","timestamp":"2016-07-05T14:19:19.495Z","distance":{"value":100,"unit":"cm"}}}]}';

    client.publish('/sensor/scheduled/measurement', data, {retain: false, qa: 1});

    client.end();
});
