function firebaseFactory(FBPROJ) {
	var config = {
      apiKey: "AIzaSyCOqxyqJWHbVXQoRe5yeDDckDFaezCWGFQ",
      authDomain: FBPROJ + ".firebaseapp.com",
      databaseURL: "https://" + FBPROJ + ".firebaseio.com",
      storageBucket: "",
    };
    firebase.initializeApp(config);

    return firebase;
}

angular.module('firebase.ref', ['firebase', 'firebase.config'])
	.factory('Ref', ['FBPROJ', firebaseFactory]);