angular.module('budgettingIsFun', ['angular.filter'])
	.controller('BaseController', ['$scope', function($scope) {
		$scope.welcomeMessage = 'Welcome Savy Budgetter';
	}]);