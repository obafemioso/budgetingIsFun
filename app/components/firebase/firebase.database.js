function firebaseDatabase(Ref) {
	return Ref.database();
}

angular.module('firebase.database', ['firebase', 'firebase.ref'])
	.factory('Database', ['Ref', firebaseDatabase]);