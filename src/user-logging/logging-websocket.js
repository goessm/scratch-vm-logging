// const wsURL = 'ws://localhost:8000/logging'; // local
const wsURL = 'wss://scratch-log-endpoint.herokuapp.com/logging'; // heroku

const authKey = 'notthatsecret';

let ws;
let saveError = false;

const handleResponse = function (msg) {
    try {
        msg = JSON.parse(msg);
    } catch (e) {
        console.log('message received was not valid JSON');
        return;
    }
    if (msg?.success) {
        saveError = false;
    } else {
        console.log(`Actions not saved on endpoint: ${msg.error}`);
        saveError = true;
    }

};

const connectWebSocket = function () {
    if (ws?.readyState === WebSocket.OPEN) return;
    console.log("creating new websocket");
    ws = new WebSocket(wsURL);

    ws.onopen = function () {
        console.log('WebSocket Connected');
    };

    ws.onmessage = function (ev) {
        console.log(`Received ws message: ${ev.data}`);
        handleResponse(ev.data);
    };

    ws.onerror = function (ev) {
        console.error('WebSocket error:', ev);
    };

    ws.onclose = function (ev) {
        console.log(`Websocket closed: ${ev.code}  ${ev.reason}`);
        // Retry
        const retryDelay = 5000;
        console.log(`retrying websocket connection in ${retryDelay}ms`);
        setTimeout(connectWebSocket, retryDelay);
    };
};

connectWebSocket();

const isOpen = function () {
    return ws?.readyState === WebSocket.OPEN;
};

/**
 * Stores whether or not the last response from the logging endpoint reported a save error.
 * @returns {boolean} Last response had a save error
 */
const hasSaveError = function () {
    return (saveError);
};
/**
 * Sends a String over the websocket
 * @param {string} message The String to send
 * @returns {boolean} True if message was sent, else false
 */
const sendString = function (message) {
    if (!isOpen()) return false;
    ws.send(message);
    return isOpen();
};

/**
 * Sends user actions over the websocket
 * @param {[object]} actions Array of user action objects
 * @returns {boolean} True if message was sent, else false
 */
const sendActions = function (actions) {
    if (!isOpen) return false;
    const payload = {};
    payload.authKey = authKey;
    payload.userActions = actions;
    ws.send(JSON.stringify(payload));
    return isOpen();
};

module.exports = {
    sendActions: sendActions,
    sendString: sendString,
    isOpen: isOpen,
    hasSaveError: hasSaveError
};