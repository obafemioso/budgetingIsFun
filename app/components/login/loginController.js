angular.module('budgetingIsFun')
	.controller('LoginController', ['loginService', function(loginService) {
		var self = this;

		self.currentUser = null;

		loginService.getCurrentUser()
			.then(function(user) {
				self.currentUser = user;
			}, function(err) {
				console.log(err);
				self.currentUser = null;
			});

		self.createUser = loginService.createUser;
		self.login = loginService.login;
		self.signOut = loginService.signOut;
	}]);