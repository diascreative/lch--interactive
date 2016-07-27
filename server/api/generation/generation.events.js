/**
 * Generation model events
 */

'use strict';

import {EventEmitter} from 'events';
var Generation = require('../../sqldb').Generation;
var GenerationEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
GenerationEvents.setMaxListeners(0);

// Model events
var events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  Generation.hook(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc, options, done) {
    GenerationEvents.emit(event + ':' + doc._id, doc);
    GenerationEvents.emit(event, doc);
    done(null);
  }
}

export default GenerationEvents;
