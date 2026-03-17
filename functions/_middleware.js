// This middleware function routes all requests through the functions system.

exports.onRequest = (request, response) => {
    // Your routing logic goes here
    response.send('Request routed through functions system');
};