

angular.module('ProRater_UserService', [])
    .factory('ProRater_UserOp', [
    function() {
        var ProRater_UserOp = {};

        var current_user = null;

        ProRater_UserOp.setUser = function(userinfo) {
            current_user = userinfo;
        };

        ProRater_UserOp.getUserInfo = function() {
            return current_user;
        };

        return ProRater_UserOp;
    }
    ]);
