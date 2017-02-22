'use strict';
(function() {

class QuickBaseComponent {
  constructor(Notification, $cookies, $http) {
    this.$cookies = $cookies;
    this.$http = $http;
    this.Notification = Notification;
  }

  $onInit() {
    this.startDate = new Date();
    this.endDate = new Date();

    this.endDate.setDate(this.endDate.getDate() - 1);
    this.startDate.setDate(this.endDate.getDate() - 7);
  }

  downloadCSV() {
    this.$http.post('/api/quickbases', {
        startDate: this.startDate,
        endDate: this.endDate
      })
      .then(res => {
        const anchor = angular.element('<a/>');
        anchor.attr({
            href: 'data:attachment/csv;charset=utf-8,' + encodeURI(res.data),
            target: '_blank',
            download: `quickbase--${this.startDate}-${this.endDate}.csv`
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
