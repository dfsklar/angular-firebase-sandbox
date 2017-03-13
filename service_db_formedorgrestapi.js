window.ANGLAPP.config(['$httpProvider', function ($httpProvider) {
  //Reset headers to avoid OPTIONS request (aka preflight)
  $httpProvider.defaults.headers.common.Authorization = 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1aWQiOiJlOGM5ZDVhYjI2YTU0Y2YxOGE5MzEyZDJmNzJmZTlmNyIsInJvbGUiOiJ1c2VyIiwiZW1haWwiOiJkZnNrbGFyQGdtYWlsLmNvbSIsImlhdCI6MTQ4OTM2NDg2OSwiZXhwIjoxNDg5NDA4MDY5fQ.Z4IOfw2hMQdtwiQz9N087UTJC0mHY5mA1w0Gebq0-tI';
  console.log("We have done the defaults setup.");
}]);



angular.module('ProRater_DBService', [])
    .factory('ProRater_DBOp', ['$q', '$http',
    function($q, $http) {
        var ProRater_DBOp = {};



/*
        Return a PROMISE for an object containing all data needed for the first rendering:
        {
            reviews_to_show: [ {}, {} ],
            stats_to_show: {
                    average: ____
            },
            this_user_review: { },
            
        }

        Each review is an object with: {
            $id: ____,
            flagged: true,
            title: ____, etc...
        }

*/
        ProRater_DBOp.fetchProduct = function(productID, userID) {
            $http.defaults.headers.common.Authorization = 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1aWQiOiJlOGM5ZDVhYjI2YTU0Y2YxOGE5MzEyZDJmNzJmZTlmNyIsInJvbGUiOiJ1c2VyIiwiZW1haWwiOiJkZnNrbGFyQGdtYWlsLmNvbSIsImlhdCI6MTQ4OTM2NDg2OSwiZXhwIjoxNDg5NDA4MDY5fQ.Z4IOfw2hMQdtwiQz9N087UTJC0mHY5mA1w0Gebq0-tI';
            var url = `http://stage-ai-comments.formed.org/api/v1/product-comments/${productID}`;
            var promise = $q.defer();
            $http.get(url, {
                headers: {
                    'Content-Type': 'text/plain',
                    'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1aWQiOiJlOGM5ZDVhYjI2YTU0Y2YxOGE5MzEyZDJmNzJmZTlmNyIsInJvbGUiOiJ1c2VyIiwiZW1haWwiOiJkZnNrbGFyQGdtYWlsLmNvbSIsImlhdCI6MTQ4OTM2NDg2OSwiZXhwIjoxNDg5NDA4MDY5fQ.Z4IOfw2hMQdtwiQz9N087UTJC0mHY5mA1w0Gebq0-tI'
                }
            }).then(
                function(response) {
                    promise.resolve(response.data);
                },
                // ERROR:
                function(response) {
                    // response.status == 401 is the most likely problem: unauthorized
                    // But no matter what has occurred here, we want to return a "canonical" response
                    // that simply provides no reviews, and that sets the star rating to 3 stars with 1000 ratings.
                    promise.resolve({
                        "consensus": {
                            "count": 1000,
                            "average": 3
                        },
                        "reviewsToShow": [],
                        "userHasAlreadyReviewed": false});
                }
            );
            return promise.promise;
        };



        ProRater_DBOp.setFlagState = function(reviewID, userID, flagState) {
            var refFlagsFromThisLoggedinUser = firebase.database().ref('flags').child(userID);
            refFlagsFromThisLoggedinUser.child(reviewID).set(flagState);
        };



        ProRater_DBOp.deleteReview = function(reviewID, productID, userID) {
            // Step 1:  remove the "key" storage that makes up the pre-cached index mapping userID to reviewID 
            firebase.database().ref('users').child(userID).child(productID).remove();
            // Step 2: remove the actual review.
            firebase.database().ref('reviewchunks').child(productID).child(reviewID).remove().then(
                function(ref) {
                    ProRater_DBOp.calcConsensus(productID, null);
                },
                function(error){}
            );
        };


        ProRater_DBOp.updateReview = function(productID, reviewID, data) {
            var thisUserReviewOfThisProduct = $firebaseObject(firebase.database().ref('reviewchunks').child(productID).child(reviewID));
            thisUserReviewOfThisProduct.$loaded(
                function(x) {
                    x.headline = data.headline;
                    x.comment = data.comment;
                    x.rating = data.rating;
                    x.time = Date.now();
                    x.$save().then(
                        function(ref) {
                            ProRater_DBOp.calcConsensus(productID, null);
                        }, function(error){});
            });
        };
        
        // NOT SCALABLE!  This client-side calc is not optimal.  In a real-world scenario,
        // this service talks to a mid-tier layer server-side and the consensus maintenance is located therein.
        ProRater_DBOp.calcConsensus = function(productID) {
            var refAllReviewsOfThisProduct = firebase.database().ref('reviewchunks').child(productID);
            var fbaAllReviews = $firebaseArray(refAllReviewsOfThisProduct);
            var refStatsForThisProduct = firebase.database().ref('stats').child(productID);
            fbaAllReviews.$loaded(
                function(allReviewsLoaded) {
                    var sum = 0;
                    var count = (allReviewsLoaded.length);
                    refStatsForThisProduct.child('count').set(count);
                    if (count == 0) {
                        refStatsForThisProduct.child('average').set(3);
                    } else {
                        allReviewsLoaded.forEach(function(oneReview) {
                            sum += oneReview.rating;
                        });
                        refStatsForThisProduct.child('average').set(sum/count);
                    }
                }
            );
        };

        // This returns the new review's ID (synchronously obtained, no promise needed).
        // Note that in the background an updating of the consensus will be performed but the caller is not given a PROMISE re: that.
        ProRater_DBOp.addReview = function(productID, user, data) {
            // THE WRITE OPERATION:  adding a new reviewchunk with the key being autogenerated.
            var refAllReviewsOfThisProduct = firebase.database().ref('reviewchunks').child(productID);
            var refStatsForThisProduct = firebase.database().ref('stats').child(productID);
            var new_chunk = refAllReviewsOfThisProduct.push();
            var chunk_uuid = new_chunk.key;
            data.time = Date.now();
            new_chunk.set({
                    headline: data.headline,
                    comment: data.comment,
                    rating: data.rating,
                    meta: user.meta,
                    uid: user.uid,
                    time: data.time
            }).then(function(){
                var refThisUserReview = firebase.database().ref('users').child(user.uid).child(productID);
                refThisUserReview.set(chunk_uuid).then(function(){
                    ProRater_DBOp.calcConsensus(productID, null);
                });
            });

            // Update average in the background
            return chunk_uuid;
        };

        return ProRater_DBOp;
    }
    ]);
