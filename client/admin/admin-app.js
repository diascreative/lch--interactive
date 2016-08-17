'use strict';

angular.module('lowcarbonhubAppAdmin', [
  'lowcarbonhubAppAdmin.auth',
  'lowcarbonhubAppAdmin.constants',
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ui.router',
  'validation.match'
])
.config(function($urlRouterProvider, $locationProvider, $stateProvider) {
    $urlRouterProvider
      .otherwise('/admin');

    $locationProvider
      .hashPrefix(false)
      .html5Mode(true);

    $stateProvider
      .state('admin', {
        url: '/admin',
        authenticate: true
      })
      .state('login', {
        url: '/admin/login',
        templateUrl: 'admin/login/login.html',
        controller: 'LoginController',
        controllerAs: 'vm'
      })
      .state('logout', {
        url: '/admin/logout?referrer',
        referrer: 'admin',
        template: '',
        controller: function($state, Auth) {
          var referrer = $state.params.referrer ||
                          $state.current.referrer ||
                          'admin';
          Auth.logout();
          $state.go(referrer);
        }
      });
  })
  .run(function($rootScope) {
    $rootScope.$on('$stateChangeStart', function(event, next, nextParams, current) {
      if (next.name === 'logout' && current && current.name && !current.authenticate) {
        next.referrer = current.name;
      }
    });
  });