angular.module('ProRater_DBService', [])
    .factory('ProRater_DBOp', ['firebase', '$firebaseArray', '$firebaseObject', '$q',
    function(firebase, $firebaseArray, $firebaseObject, $q) {
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
        ProRater_DBOp.fetchProduct = function(productID, userID) {
            // Ref to the bucket of all reviews for this product.
            // Notice that the ref can be sent through limitToLast at the tail end.
            var refAllReviewsOfThisProduct = firebase.database().ref('reviewchunks').child(productID);
            var refStatsForThisProduct = firebase.database().ref('stats').child(productID);
            var refFlagsFromThisLoggedinUser = firebase.database().ref('flags').child(userID);
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
            var refThisUserReview = firebase.database().ref('users').child(userID).child(productID);
            var thisUserReviewKey = $firebaseObject(refThisUserReview);
            // ^^^ This is a promise. And the data located at that ref is the *key* of the review, not the actual review.
            // This key would be used as a child positioner into "refAllReviewsOfThisProduct".

            // I need to have all of these "ref"s already loaded in order to do the
            // work to:
            // 1) identify whether this user has already reviewed this product
            // 2) isolate that particular review so it does not appear in the read-only list of "other reviews".
            // 3) determine which reviews this user has flagged
            // So I must use $loaded thrice:
            var promise = $q.defer();
            $q.all( [
                    statsForThisProduct.$loaded(),
                    reviewsToShow.$loaded(),
                    thisUserReviewKey.$loaded(),
                    flagsFromThisLoggedinUser.$loaded()
                ] ).then (function() {
                    var RETVAL = {
                        consensus: statsForThisProduct,
                        reviewsToShow: reviewsToShow,
                        key_thisUserReviewOfThisProduct: thisUserReviewKey.$value,
                        userHasAlreadyReviewed: false
                    };
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
                        var thisUserReviewOfThisProduct = $firebaseObject(refAllReviewsOfThisProduct.child(RETVAL.key_thisUserReviewOfThisProduct));
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
                                promise.resolve(RETVAL);
                            }
                        );
                    } else {
                        promise.resolve(RETVAL);
                    }
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
            firebase.database().ref('reviewchunks').child(productID).child(reviewID).remove();
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
        
        ProRater_DBOp.calcConsensus = function(productID) {
            var refAllReviewsOfThisProduct = firebase.database().ref('reviewchunks').child(productID);
            var fbaAllReviews = $firebaseArray(refAllReviewsOfThisProduct);
            fbaAllReviews.$loaded(
                function(allReviewsLoaded) {
                    var sum = 0;
                    var count = (allReviewsLoaded.length);
                    allReviewsLoaded.forEach(function(oneReview) {
                        sum += oneReview.rating;
                     });
                    refStatsForThisProduct.child('average').set(sum/count);
                    refStatsForThisProduct.child('count').set(count);
                    if (cbCompletion) {
                        cbCompletion();
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
                window.sklangular.calcAverage($firebaseArray, refAllReviewsOfThisProduct, refStatsForThisProduct, null);
            var new_chunk = refAllReviewsOfThisProduct.push();
            var chunk_uuid = new_chunk.key;
            data.time = Date.now();
            new_chunk.set({
                    headline: data.headline,
                    comment: data.comment,
                    rating: data.rating,
                    authorName: user.displayName,
                    authorEmail: user.email,
                    photoURL: user.photoURL,
                    uid: user.uid,
                    time: data.time
            });

            var refThisUserReview = firebase.database().ref('users').child(user.uid).child(productID);
            refThisUserReview.set(chunk_uuid);

            // Update average in the background
            ProRater_DBOp.calcAverage(productID, null);
            return chunk_uuid;
        };

        return ProRater_DBOp;
    }
    ]);
