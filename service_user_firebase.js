

angular.module('ProRater_UserService', [])
    .factory('ProRater_UserOp', [
    function() {
        var ProRater_UserOp = {};

        var current_user = null;
        var registered_logout_callback = null;

        ProRater_UserOp.setUser = function(userinfo) {
            // The main requirement regarding the contents of the userInfo hashmap is this:
            //    > It must contain a unique ID for the user, located at userinfo.uid
            // All the other data associated with the user is up to you and must be planted
            // inside a hashmap located at userinfo.meta
            // In this demo app, we have fields like .meta.authorName, .meta.authorEmail, etc.
            // Any info in the .meta object will be stored in the data record for each reviewblock,
            // for the purpose of allowing your template to access them for display.
            current_user = userinfo;
        };

        /*
        It is up to the surrounding application to keep track of whether a user is logged-in
        and keep users away from review presentations/UX if indeed not logged-in.
        The surrounding application also is responsible for all login/logout UX and backend.
        Thus this service has no "unsetUser" endpoint, and this service expects the 
        app to have registered a function for logout, that controllers using this service
        can invoke indirectly if it is desired to use Angular to provide the logout "button".
        */
        ProRater_UserOp.registerLogoutCallback = function(logoutFunc) {
            registered_logout_callback = logoutFunc;
        };
        ProRater_UserOp.logout = function() {
            if (registered_logout_callback) {
                registered_logout_callback();
            }
        };

        ProRater_UserOp.getUserInfo = function() {
            // The return value will have this structure:
            // {  uid: _____, meta: { K: V, K: V, ... }
            return current_user;
        };



        return ProRater_UserOp;
    }
    ]);
