'use strict';
(function() {

class InstallationsComponent {
  constructor(FileUploader, Notification, $cookies, $http) {
    this.FileUploader = FileUploader;
    this.Notification = Notification;
    this.$cookies = $cookies;
    this.$http = $http;
    this.installations = [];
  }

  $onInit() {
    this.getInstallations();

    this.upload = new this.FileUploader({
          url: '/api/installations/',
          queueLimit: 1,
          filters: [{
            name: 'csvFilter',
            fn: (item) => {
              // user can only upload CSV files
              var allowed = item.type === 'text/csv';

              if (!allowed) {
                this.Notification.error('Must select a CSV file.');
              }

              return allowed;
            }
          }],

          onBeforeUploadItem: (item) => {
            item.headers = {
              Authorization: 'Bearer ' + this.$cookies.get('token')
            };
          },

          onSuccessItem: () => {
            this.Notification.success('Uploaded and inserted data successfully');
            this.getInstallations();
          },

          onErrorItem: () => {
            this.Notification.error('There was an error processing the data.');
          },

          onCompleteAll: function() {
            this.clearQueue();
          }
        });
  }

  getInstallations() {
    this.$http.get('/api/installations/full').then(response => {
      this.installations = response.data;
    });
  }
}

angular.module('lowcarbonhubAppAdmin')
  .component('installations', {
    templateUrl: 'admin-app/installations/installations.html',
    controller: InstallationsComponent,
    controllerAs: '$data'
  });

})();