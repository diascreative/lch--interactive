'use strict';
(function() {

class InstallationComponent {
  constructor(Notification, $http, $state) {
    this.$http = $http;
    this.$state = $state;
    this.Notification = Notification;

    this.details = {};
    this.id = this.$state.params.id;
  }

  $onInit() {
    const url = `/api/installations/${this.id}/full`;

    this.$http.get(url).then(response => {
      this.installation = response.data;
    });

    const sourcesUrl = `/api/installations/sources`;

    this.$http.get(sourcesUrl).then(response => {
      this.sources = response.data;
    });
  }

  saveChanges(installation) {
    if (installation._id) {
      const url = `/api/installations/${installation._id}`;

      this.$http.post(url, installation)
        .then(() => this.Notification.success('Updated installation successfully'))
        .catch(() => this.Notification.error('There was an error processing the data.'));
    } else {
      this.Notification.error('There was an error processing the data.');
    }
  }
}

angular.module('lowcarbonhubAppAdmin')
  .component('installation', {
    templateUrl: 'admin-app/installation/installation.html',
    controller: InstallationComponent,
    controllerAs: 'vm'
  });
})();
