/* Using Firebase 3.0.3 */

function authService($q, $timeout, Auth, Database) {
	console.log(Auth);

	var user = {};

	var login = function(email, password) {
		Auth.$signInWithEmailAndPassword(email, password);
	};

	var signOut = function() {
		Auth.$signOut();
	};

	//return current user as a promise
	var getUser = function() {
		return user;
	};

	Auth.$onAuthStateChanged(function(authData) {
		if(authData) {
			user.data = authData;
		} else {
			user.data = null;
		}
	});

	var createUser = function(email, pass) {
		Auth.$createUserWithEmailAndPassword(email, pass)
			.then(function() {
				return Auth.$signInWithEmailAndPassword(email, pass);
			})
			.then(createProfile);

		function createProfile(newUser) {
			var ref = Database.ref('users/' + newUser.uid), def = $q.defer();
			console.log(ref);
			ref.set({email: newUser.email, name: firstPartOfEmail(newUser.email), budgets: {}, incomes: {}}, 
				function(err) {
					$timeout(function() {
						if( err ) {
							def.reject(err);
						}
						else {
							def.resolve(ref);
						}
					});
				});
			return def.promise;
		}
	};

	function firstPartOfEmail(email) {
      return ucfirst(email.substr(0, email.indexOf('@'))||'');
    }

    function ucfirst (str) {
      // inspired by: http://kevin.vanzonneveld.net
      str += '';
      var f = str.charAt(0).toUpperCase();
      return f + str.substr(1);
    }
    
	this.createUser = createUser;
	this.login = login;
	this.signOut = signOut;
	this.getUser = getUser;
}

angular.module('budgetingIsFun')
	.service('authService', ['$q', '$timeout', 'Auth', 'Database', authService]);