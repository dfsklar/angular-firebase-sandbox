function initApp() {
    // Result from Redirect auth flow.
    // [START getidptoken]
    firebase.auth().getRedirectResult().then(function (result) {
        if (result.credential) {
            // This gives you a Google Access Token. You can use it to access the Google API.
            var token = result.credential.accessToken;
            // [START_EXCLUDE]
            // document.getElementById('quickstart-oauthtoken').textContent = token;
        } else {
            console.log("SKLAR - so we're not logged in I guess.");
            var provider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithRedirect(provider);
            // document.getElementById('quickstart-oauthtoken').textContent = 'null';
            // [END_EXCLUDE]
        }
        // The signed-in user info.
        var user = result.user;
    }).catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        // [START_EXCLUDE]
        if (errorCode === 'auth/account-exists-with-different-credential') {
            alert('You have already signed up with a different auth provider for that email.');
            // If you are using multiple auth providers on your app you should handle linking
            // the user's accounts here.
        } else {
            console.error(error);
        }
        // [END_EXCLUDE]
    });
}



window.onload = function() {
    initApp();
}


/*
var provider = new firebase.auth.GoogleAuthProvider();


if (!firebase.auth().currentUser) {
    console.log('no current user');
    // firebase.auth().signInWithRedirect(provider);
} else {
    firebase.auth().getRedirectResult().then(function (authData) {
        if (authData.credential) {
            var token = authData.credential.accessToken;
        }
        var user = authData.user;
        console.log(authData);
        console.log(user);
    }).catch(function (error) {
        console.log(error);
    });
}

*/
