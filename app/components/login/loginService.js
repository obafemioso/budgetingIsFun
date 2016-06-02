function loginService($q, dataService) {
	/*Templates

		user
		{
			email : string,
			password : string
		}
	*/
	var currentUser = null;

	var createUser = function(newUser) {
		dataService.createUser(newUser.email, newUser.password);
	};

	var login = function(user) {
		console.log('attempting login');
		console.log(user);
		dataService.login(user.email, user.password);
	};

	var signOut = function() {
		dataService.signOut();
	};

	var getCurrentUser = function() {
		return dataService.getCurrentUser()
			.then(function(user) {
				currentUser = user;
				return  currentUser;
			})
			.catch(function(error) {
				console.log(error);
				currentUser = null;
				return currentUser;
			});
	};

	this.createUser = createUser;
	this.login = login;
	this.signOut = signOut;
	this.getCurrentUser = getCurrentUser;
}

angular.module('budgetingIsFun')
	.service('loginService', ['$q', 'dataService', loginService]);