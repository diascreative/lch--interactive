'use strict';

describe('Component: FilterComponent', function () {

  // load the controller's module
  beforeEach(module('lowcarbonhubApp'));

  var FilterComponent, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($componentController, $rootScope) {
    scope = $rootScope.$new();
    FilterComponent = $componentController('FilterComponent', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
