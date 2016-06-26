angular.module('budgetingIsFun', 
	[
		'angular.filter', 
		'firebase', 
		'firebase.ref', 
		'firebase.auth',
		'firebase.database'
	])
	.controller('BaseController', function($scope) {
		$scope.welcomeMessage = 'Welcome Savy Budgetter';
	});