angular.module('ProRater_DBService', [])
    .factory('ProRater_DBOp', ['firebase',
    function(firebase) {
        var ProRater_DBOp = {};

        ProRater_DBOp.fetchAllReviewsForThisProduct = function(productID) {
            return firebase.database().ref('reviewchunks').child(productID);
        };

        return ProRater_DBOp;
    }
    ]);
