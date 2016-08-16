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
    // $urlRouterProvider
    //   .otherwise('/admin/');

    $stateProvider
      .state('admin', {
        url: '/admin',
        views: {
          AdminMainContent: {
            templateUrl: 'admin/home/home.html'
          }
        }
      })
      .state('admin.login', {
        url: '/login',
        views: {
          AdminSubPage: {
            templateUrl: 'admin/login/login.html',
            controller: 'LoginController',
            controllerAs: 'vm'
          }
        }
      })
      .state('admin.logout', {
        url: '/logout?referrer',
        views: {
          AdminSubPage: {
            referrer: 'admin',
            template: '',
            controller: function($state, Auth) {
              var referrer = $state.params.referrer ||
                              $state.current.referrer ||
                              'admin';
              Auth.logout();
              $state.go(referrer);
            }
          }
        }
      })
      .state('admin.settings', {
        url: '/settings',
        views: {
          AdminSubPage: {
            templateUrl: 'admin/settings/settings.html',
            controller: 'SettingsController',
            controllerAs: 'vm',
            authenticate: true
          }
        }
      });

    $locationProvider
      .hashPrefix(false)
      .html5Mode(true);
  })
  .run(function($rootScope) {
    $rootScope.$on('$stateChangeStart', function(event, next, nextParams, current) {
      if (next.name === 'logout' && current && current.name && !current.authenticate) {
        next.referrer = current.name;
      }
    });
  });
