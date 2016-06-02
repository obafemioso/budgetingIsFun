angular.module('budgetingIsFun', ['angular.filter', 'firebase'])
	.controller('BaseController', ['$scope', function($scope) {
		$scope.welcomeMessage = 'Welcome Savy Budgetter';
	}]);