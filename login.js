function initApp() {

    // If cookie present, the user is already logged-in
    logged_in_user = Cookies.getJSON("sklangular_logged_in_user");
    if (logged_in_user) {
        window.logged_in_user = logged_in_user;
        angular.bootstrap(document, ["Sklangular", "ProRater_DBService"]);
        return;
    }

    // Result from Redirect auth flow.
    firebase.auth().getRedirectResult().then(function (result) {
        if (result.credential) {
            // This gives you a Google Access Token. You can use it to access the Google API.
            var token = result.credential.accessToken;
        } else {
            console.log("SKLAR - so we're not logged in I guess.");
            var provider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithRedirect(provider);
        }
        // The signed-in user info.
        console.log(result);
        // alert(result.user);
        window.logged_in_user = result.user;
        logged_in_user_as_json = JSON.stringify(result.user);
        Cookies.set("sklangular_logged_in_user", result.user, { expires : 10/*days*/ });
        // READY TO START ANGULAR!
        angular.bootstrap(document, ["Sklangular", "ProRater_DBService"]);
    }).catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        if (errorCode === 'auth/account-exists-with-different-credential') {
            alert('You have already signed up with a different auth provider for that email.');
            // If you are using multiple auth providers on your app you should handle linking
            // the user's accounts here.
        } else {
            console.error(error);
        }
    });
}



window.onload = function() {
    initApp();
}
