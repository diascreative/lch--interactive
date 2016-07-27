/**
 * Installation model events
 */

'use strict';

import {EventEmitter} from 'events';
var Installation = require('../../sqldb').Installation;
var InstallationEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
InstallationEvents.setMaxListeners(0);

// Model events
var events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  Installation.hook(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc, options, done) {
    InstallationEvents.emit(event + ':' + doc._id, doc);
    InstallationEvents.emit(event, doc);
    done(null);
  }
}

export default InstallationEvents;
