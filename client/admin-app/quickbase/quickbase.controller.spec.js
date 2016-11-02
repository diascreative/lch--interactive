'use strict';

describe('Component: QuickBaseComponent', function () {

  // load the controller's module
  beforeEach(module('lowcarbonhubAppAdmin'));

  var InstallationsComponent, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function($componentController, $rootScope) {
    scope = $rootScope.$new();
    InstallationsComponent = $componentController('QuickBaseComponent', {
      $scope: scope
    });
  }));

  it('should ...', function() {
    expect(1).toEqual(1);
  });
});
