angular.module('ProRater_DBService', [])
    .factory('ProRater_DBOp', ['firebase',
    function(firebase) {
        var ProRater_DBOp = {};






/*

ABOUT THE FIREBASE STRUCTURE:

   reviewchunks:
      {prodID}:
         {commblockID}:
              OBJECTcommblock
   users:
      {userID}:
         {prodID}: commblockID

   flags:
      {userID}:
         {commblockID}: true   << the value is meaningless.  It is the presence of this value that means it was flagged.

*/



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
        ProRater_DBOp.fetchProduct = function(productID) {
            // Ref to the bucket of all reviews for this product.
            // Notice that the ref can be sent through limitToLast at the tail end.
            var refAllReviewsOfThisProduct = firebase.database().ref('reviewchunks').child($scope.productID);
            var refStatsForThisProduct = firebase.database().ref('stats').child($scope.productID);
            var refFlagsFromThisLoggedinUser = firebase.database().ref('flags').child($scope.user.uid);
            var refReviewsToShow = refAllReviewsOfThisProduct.limitToLast(20); // << promise

            var flagsFromThisLoggedinUser = $firebaseArray(refFlagsFromThisLoggedinUser);  // << this is a promise!

            // Notice that here is where I'm doing the reversal of order.
            var reviewsToShow = $firebaseArray(refReviewsToShow).reverse();
            // ^^^^^^^^^^^^ This is only a promise; the data will not have been loaded yet!
            var statsForThisProduct = $firebaseObject(refStatsForThisProduct);
            // ^^^^^^^^^^^^ This is only a promise; the data will not have been loaded yet!

            // We can use this user's own index of all reviews he/she have contributed to determine whether
            // this user has ever reviewed *this* product.
            // Again, this is only a promise!
            var refThisUserReview = firebase.database().ref('users').child($scope.user.uid).child($scope.productID);
            var thisUserReviewKey = $firebaseObject(refThisUserReview);
            // ^^^ This is a promise. And the data located at that ref is the *key* of the review, not the actual review.
            // This key would be used as a child positioner into "refAllReviewsOfThisProduct".

            // I need to have all of these "ref"s already loaded in order to do the
            // work to:
            // 1) identify whether this user has already reviewed this product
            // 2) isolate that particular review so it does not appear in the read-only list of "other reviews".
            // 3) determine which reviews this user has flagged
            // So I must use $loaded thrice:
            return $q((resolve, reject) => {
                return $q.all( [
                    statsForThisProduct.$loaded(),
                    reviewsToShow.$loaded(),
                    thisUserReviewKey.$loaded(),
                    flagsFromThisLoggedinUser.$loaded()
                ] ).then (function() {
                    var RETVAL = {
                        averageStarRating: statsForThisProduct.average,
                        reviewsToShow: reviewsToShow,
                        key_thisUserReviewOfThisProduct: thisUserReviewKey.$value,
                        userHasAlreadyReviewed: false
                    };
                    //    $scope.consensus.ratingOutOfTen = Math.round($scope.consensus.average*2);
                    //    $scope.consensus.ratingOutOfFive = $scope.consensus.ratingOutOfTen / 2;
                    var loadedReviewsToShow = reviewsToShow;
                    RETVAL.reviewsToShow.forEach(function(x){
                        var s = flagsFromThisLoggedinUser.$getRecord(x.$id);
                        if (s) {
                            // Basically this is the execution of a JOIN
                            x.flagged = true;
                        }
                    });
                    if (RETVAL.key_thisUserReviewOfThisProduct) {
                        RETVAL.userHasAlreadyReviewed = true;
                        // If we get here, this user *has* indeed already reviewed this very product.
                        // One more firebase load will give us that particular review:
                        var thisUserReviewOfThisProduct = $firebaseObject(refAllReviewsOfThisProduct.child(self.key_thisUserReviewOfThisProduct));
                        thisUserReviewOfThisProduct.$loaded(
                            function(x) {
                                RETVAL.thisUserReview = {
                                    intendsToAddComment: (x.comment!='' || x.headline!=''),
                                    comment: x.comment,
                                    headline: x.headline,
                                    rating: x.rating,
                                    time: x.time,
                                    photoURL: x.photoURL,
                                    authorName: x.authorName,
                                    authorEmail: x.authorEmail
                                };
                                resolve(RETVAL);
                            }
                        );
                    } else {
                        resolve(RETVAL);
                    }
                }
            );
            }
                     );
        };


        return ProRater_DBOp;
    }
    ]);
