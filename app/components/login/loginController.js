angular.module('budgetingIsFun')
	.controller('LoginController', ['loginService', '$scope', function(loginService, $scope) {
		var self = this;

		self.user = loginService.getUser();

		self.createUser = loginService.createUser;
		self.login = loginService.login;
		self.signOut = loginService.signOut;

		$scope.$watch(self.user);
	}]);