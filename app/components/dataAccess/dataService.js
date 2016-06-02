/* Firebase 3.0.3 Implementation */

function dataService($q, $firebaseAuth) {
	var config = {
      apiKey: "AIzaSyCOqxyqJWHbVXQoRe5yeDDckDFaezCWGFQ",
      authDomain: "project-5329216778150346102.firebaseapp.com",
      databaseURL: "https://project-5329216778150346102.firebaseio.com",
      storageBucket: "",
    };
    firebase.initializeApp(config);

	var ref = firebase.auth();
	var deferred = $q.defer();

	//Auth
	var auth = $firebaseAuth(ref);
	console.log(auth);
	this.currentUser = null;

	var createUser = function(email, password) {
		auth.$createUserWithEmailAndPassword(email, password)
			.then(function(userData) {
				console.log("Created user: ", userData.email);
			}).catch(function(error) {
				var errorCode = error.code;
				var errorMessage = error.message;

				//Log Error
				console.log(error);
			});
	};

	var login = function(email, password) {
		auth.$signInWithEmailAndPassword(email, password)
			.then(function(authData) {
				console.log("Logged in as: " + authData.uid);
			}).catch(function(error) {
				var errorCode = error.code;
				var errorMessage = error.message;

				//Log Error
				console.log(error);
			});
	};

	var signOut = function() {
		console.log('attempting sign out');
		auth.$signOut();

	};

	var getCurrentUser = function() {
		return deferred.promise;
	};

	auth.$onAuthStateChanged(function(authData) {
		console.log('state changed');
		if(authData) {
			console.log(authData);
			deferred.resolve(authData);
		} else {
			deferred.reject('Not authenticated');
		}
	});

	//Data
	//budgets
	var budgets = function() {
		var deferred = $q.defer();

		firebase.database().ref('budgets')
			.orderByChild('userId')
			.equalTo('test1')
			.on('value', function(budgets) {
				deferred.resolve(budgets.val());
			});
		
		return deferred.promise;
	};

	//Auth
	this.createUser = createUser;
	this.login = login;
	this.signOut = signOut;
	this.getCurrentUser = getCurrentUser;

	//Data
	this.getBudgets = budgets;
}

angular.module('budgetingIsFun')
	.service('dataService', ['$q', '$firebaseAuth', dataService]);