/**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
* Anchor Smooth Scroll - Smooth scroll to the given anchor on click
*   adapted from this stackoverflow answer: http://stackoverflow.com/a/21918502/257494
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
angular.module('lowcarbonhubApp')
  .directive('tooltip', function($location) {
  'use strict';

  return {
    restrict: 'A',
    replace: false,
    scope: {
      'tooltip': '@'
    },

    link: function($scope, $element) {

      initialize();

      /* initialize -
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
      function initialize() {
        // listen for a click
        var title = $element.attr('title');
        $element[0].setAttribute('title', '');

        $element[0].classList.add('tooltip');
        $element.append('<span class="tooltip__message">' + title + '</span>');
      }
    }
  };
});
