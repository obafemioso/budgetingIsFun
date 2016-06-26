function firebaseAuth($firebaseAuth, Ref) {
	return $firebaseAuth(Ref.auth());
}

angular.module('firebase.auth', ['firebase', 'firebase.ref'])
	.factory('Auth', ['$firebaseAuth', 'Ref', firebaseAuth]);