



window.ANGLAPP = angular.module('ProRater_Module', ['ngRoute', 'firebase', 'ngMaterial', 'ProRater_DBService', 'ProRater_UserService']);


function bootstrapAngular(authenticatedUserData, logoutFunc) {
    window.logged_in_user = authenticatedUserData;
    angular.module('ProRater_UserService').run(['ProRater_UserOp', function(service) {
        service.setUser(authenticatedUserData);
        service.registerLogoutCallback(logoutFunc);
    }]);
    angular.bootstrap(document, ["ProRater_Module", "ProRater_DBService", "ProRater_UserService"]);
}





function initApp() {

    var COOKIENAME = "prorater_logged_in_user";

    function logout() {
                Cookies.remove(COOKIENAME);
                firebase.auth().signOut().then(function() {
                    window.location.href = ('/');
                    // Sign-out was successful.
                }, function(error) {
                    alert("Logout failed - firebase not responding as expected.");
                });
    }


    // If cookie present, the user is already logged-in
    logged_in_user = Cookies.getJSON(COOKIENAME);
    if (logged_in_user) {
        bootstrapAngular(logged_in_user, logout);
        return;
    }

    // Result from Redirect auth flow.
    firebase.auth().getRedirectResult().then(function (result) {
        if (result.credential) {
            // This gives you a Google Access Token. You can use it to access the Google API.
            var token = result.credential.accessToken;
        } else {
            // Firebase is telling us: "nobody is logged in" so we must redirect the user to a google login panel
            var provider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithRedirect(provider);
        }

        // The signed-in user info returned by firebase has many user-identification fields.
        // For this demo app, we want to isolate just the ones we are interested in for display.
        // But take note: the field "uid" MUST BE PRESENT -- a requirement of the ProRater system.
        var user_data = {
            uid: result.user.uid,  // <<<< MUST BE PRESENT - all other fields must lie inside a 'meta' field
            meta: {
                authorName: result.user.displayName,
                authorEmail: result.user.email,
                photoURL: result.user.photoURL
            }
        };
        // Looks like cookies.set already handles JSON:  logged_in_user_as_json = JSON.stringify(user_metadata);
        Cookies.set(COOKIENAME, user_data, { expires : 1/*days*/ });
        bootstrapAngular(user_data, logout);
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
