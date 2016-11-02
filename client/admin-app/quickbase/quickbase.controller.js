'use strict';
(function() {

class QuickBaseComponent {
  constructor(Notification, $cookies, $http) {
    this.$cookies = $cookies;
    this.$http = $http;
    this.Notification = Notification;
  }

  $onInit() {
    this.startDate = new Date(2016, 9, 25);
    this.endDate = new Date(2016, 10, 1);
  }

  downloadCSV() {
    this.$http.post('/api/quickbases', {
        startDate: this.startDate,
        endDate: this.endDate
      })
      .then(data => {
        const anchor = angular.element('<a/>');
        anchor.attr({
            href: 'data:attachment/csv;charset=utf-8,' + encodeURI(data),
            target: '_blank',
            download: 'filename.csv'
        })[0].click();
      })
      .catch(() => this.Notification.error('There was an error processing the data.'));
  }
}

angular.module('lowcarbonhubAppAdmin')
  .component('quickbase', {
    templateUrl: 'admin-app/quickbase/quickbase.html',
    controller: QuickBaseComponent,
    controllerAs: '$data'
  });
})();
