'use strict';

(function() {

class InstallationComponent {
  constructor($http, $rootScope, $state) {
    this.$http = $http;
    this.$rootScope = $rootScope;

    this.details = {};
    this.name = $state.params.name;

    this.$rootScope.title = this.name;
  }

  $onInit() {
    const url = `/api/installations/${this.name}`;

    this.$http.get(url).then(response => {
      this.details = response.data;
      console.log(response);
    });
  }
}

angular.module('lowcarbonhubApp')
  .component('installation', {
    templateUrl: 'app/installation/installation.html',
    controller: InstallationComponent,
    controllerAs: '$installation'
  });

})();
