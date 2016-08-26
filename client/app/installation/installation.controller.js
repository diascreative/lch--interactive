'use strict';

(function() {

class InstallationComponent {
  constructor($http, $state) {
    this.$http = $http;

    this.details = {};
    this.name = $state.params.name;
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
