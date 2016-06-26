function loginService($q, authService) {
	/*Templates

		user
		{
			email : string,
			password : string
		}
	*/

	var createUser = function(newUser) {
		authService.createUser(newUser.email, newUser.password);
	};

	var login = function(user) {
		authService.login(user.email, user.password);
	};

	var signOut = function() {
		authService.signOut();
	};

	this.createUser = createUser;
	this.login = login;
	this.signOut = signOut;
	this.getUser = authService.getUser;
}

angular.module('budgetingIsFun')
	.service('loginService', ['$q', 'authService', loginService]);