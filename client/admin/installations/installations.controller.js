'use strict';
(function() {

class InstallationsComponent {
  constructor($http) {
    this.$http = $http;
    this.installations = [];
  }

  $onInit() {
    this.$http.get('/api/installations/full').then(response => {
      this.installations = response.data;
    });
  }
}

angular.module('lowcarbonhubAppAdmin')
  .component('installations', {
    templateUrl: 'admin/installations/installations.html',
    controller: InstallationsComponent,
    controllerAs: '$data'
  });

})();
