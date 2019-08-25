// Used to find the order list element
const tableClass = "ReactVirtualized__Grid ReactVirtualized__Table__Grid";

// Used to find order elements within the order list element
const rowClass = "ReactVirtualized__Table__row";

// Number of orders last time we checked
let lastRowCount = 0;

// Whether or not the next limit order event is caused by user input
let buttonClicked = false;

// Used to debounce resetting buttonClicked
// (Debounce = prevent from happening multiple times in too short of a timespan)
let buttonClickedTimeout = null;

// Used to debounce limit order event alerts
let sendMessageTimeout = null;

// Runs when the extension loads
(function onInit() {
    // Find all table elements
    let tables = document.getElementsByClassName(tableClass);

    // If none are found, wait 1 second and try again
    if (tables.length == 0) return setTimeout(onInit, 1000);

    // Print a message to console to show that the extension is loaded
    console.log("Binance Order Filled Alert - Extension loaded");

    // Create a mutation observer to listen for changes in the order list
    let observer = new MutationObserver(() => onTableChanged(tables[0]));

    // Begin listening for order list changes
    observer.observe(tables[0], { attributes: true, childList: true, subtree: true });

    // Begin listening for clicks
    document.body.addEventListener("click", onClick);
})();

// Runs when the user clicks anywhere
function onClick(e) {
    // Only continue if the user clicked a button
    if (e.target.tagName != "BUTTON") return;

    // Mark the next limit order event as caused by user input
    buttonClicked = true;

    // Debounce resetting buttonClicked
    clearTimeout(buttonClickedTimeout);
    buttonClickedTimeout = setTimeout(() => buttonClicked = false, 1000);
}

// Runs anything inside the order list changes
function onTableChanged(table) {
    // Count the number of orders in the order list
    let rowCount = table.getElementsByClassName(rowClass).length;

    // If the count has changed since the last time we looked, call onRowCountChanged
    if (rowCount != lastRowCount) onRowCountChanged(rowCount - lastRowCount);

    // Store the row count for next time
    lastRowCount = rowCount;
}

// Runs when the number of orders in the order list changes
function onRowCountChanged(countChange) {
    // Begin creating the message:
    // If the limit order event was caused by user input, and the number of
    // orders in the order list has increased, the message will be "Order placed",
    // otherwise the message will be blank for now
    let message = buttonClicked ? "Order placed" : null;

    // If the number of orders in the order list has decreased, the message will be
    // "Order cancelled" or "Order filled" depending on if the limit order event was
    // caused by user input or not.
    if (countChange < 0)
        message = buttonClicked ? "Order cancelled" : "Order filled"

    // Only send the message if it's not blank
    if (message != null) sendMessage(message);

    // Reset buttonClicked
    buttonClicked = false;
    clearTimeout(buttonClickedTimeout);
}

// Sends a message to the background script to play an audio alert
function sendMessage(message) {
    // Debounce sending the message
    clearTimeout(sendMessageTimeout);
    sendMessageTimeout = setTimeout(() => {
        // Send the message to the background script
        chrome.runtime.sendMessage(chrome.runtime.id, message)
    }, 500);
}