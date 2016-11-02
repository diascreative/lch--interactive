/**
 * Quickbase model events
 */

'use strict';

import {EventEmitter} from 'events';
var Quickbase = require('../../sqldb').Quickbase;
var QuickbaseEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
QuickbaseEvents.setMaxListeners(0);

// Model events
var events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  Quickbase.hook(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc, options, done) {
    QuickbaseEvents.emit(event + ':' + doc._id, doc);
    QuickbaseEvents.emit(event, doc);
    done(null);
  }
}

export default QuickbaseEvents;
