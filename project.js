window.sklangular = {
    calcAverage: function($firebaseArray, refAllReviews, refStatsForThisProduct, cbCompletion) {
        var fbaAllReviews = $firebaseArray(refAllReviews);
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
    }
};




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


angular.module('Sklangular', ['ngRoute', 'firebase', 'ngMaterial', 'ProRater_DBService'])

    .value('fbURL', 'https://angularsandbox-640d4.firebaseio.com/')


    .config(function ($routeProvider) {

        /*  var resolveProjects = {
         projects: function (Projects) {
         return Projects.fetch();
         }
         };
         */
        /*
         The use of "resolve" in these route providers establishes a promise that must be resolved before
         the page will be shown at all.
         The controller will be given the info, already fetched.  Simple controller!
         This is an alternative to having a controller that has to go out and fetch the data.

         The resolve value must be set to an angular module's ".config" function's variable with that name.

         BUT: this means the start of page display is delayed, and this may not be acceptable
         if it is instead desired that a page *portion* be delayed.

         I'm going to try having NO resolve condition for the "list" fucker and instead have the controller
         do the actual fetching.
         */
        $routeProvider

            .when('/product_description/:productID', {
                // The captured :productID will be sent to the controller via $routeParams
                // Note that it is REQUIRED that you give an "as" alias to the controller class name!
                // Will not work if you don't but not sure why.
                controller: 'ReviewListController as reviewlistCTRLR',
                templateUrl: 'review_list.html'

            })

            .when('/product_list', {
                controller: 'ProductListController as prodlistCTRLR',
                templateUrl: 'product_list.html'
            })

            .otherwise({
                redirectTo: '/product_list'
            });
    })



    // This is a good "promissory" controller that does a firebase fetch and waits for
    // the result before setting its this.projects which is being watched by the GUI.
    .controller('ReviewListController',
        function ($scope, ProRater_DBOp, $firebaseObject, $routeParams, $firebaseArray, $window, $mdDialog, $mdMenu, $route, $q) {
            console.log("inside RLcontroller");

            // These next lines will allow the template to refer to things such as {{productID}}
            $scope.productID = $routeParams.productID;
            $scope.user = window.logged_in_user;  // This is an object with fields such as uid, etc.

            var self = this;

            $scope.userHasNotYetReviewed = true;

            ProRater_DBOp.fetchProduct($scope.productID, $scope.user.uid).then(
                function(data) {
                    console.log(data);
                },
                function(data) {
                    console.log('err');
                    console.log(data);
                }
            );

            $scope.add_flag = function(rvu) {
                idReview = rvu.$id;
                rvu.flagged = true;
                self.refFlagsFromThisLoggedinUser.child(idReview).set(true);
            };

            $scope.remove_flag = function(rvu) {
                idReview = rvu.$id;
                rvu.flagged = false;
                self.refFlagsFromThisLoggedinUser.child(idReview).remove();
            };

            $scope.popupReviewDialog = function(ev) {
                $scope.unsavedwriteableReview = jQuery.extend({}, $scope.writeableReview);  // shallow copy
                $mdDialog.show({
                    scope: $scope,  // We want the popup dialog to use THIS controller!
                    preserveScope: true,  // If you don't do this, this shared scope will be DESTROYED when dialog is closed.
                    templateUrl: 'dialog1.tmpl.html',
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose:true,
                    fullscreen: $scope.customFullscreen // Only for -xs, -sm breakpoints.
                });
            };

            $scope.popupConfirmDelete = function(ev) {
                // Appending dialog to document.body to cover sidenav in docs app
                var confirm = $mdDialog.confirm()
                    .title('Confirm delete')
                    .textContent('Are you sure you want to delete your rating/commentary?')
                    .ariaLabel('Confirm delete?')
                    .targetEvent(ev)
                    .ok('Please delete!')
                    .cancel('Do not delete');

                $mdDialog.show(confirm).then(function() {
                    refThisUserReview.remove();
                    $scope.declare_this_user_not_yet_reviewed();
                    $route.reload();
                }, function() {
                    ;
                });
            };


            $scope.filter_to_only_others = function() {
                return function(reviewToTest) {
                    return (reviewToTest.$id != self.key_thisUserReviewOfThisProduct);
                }
            };

            $scope.declare_this_user_not_yet_reviewed = function() {
                $scope.writeableReview = {
                    intendsToAddComment: false,
                    comment: "",
                    headline: "",
                    rating: -1,
                    authorName: $scope.user.displayName,
                    authorEmail: $scope.user.email,
                    photoURL: $scope.user.photoURL,
                    uid: $scope.user.uid
                };
                $('.review-presentation').css('opacity', '1');
                $scope.userHasNotYetReviewed = true;
            };

            // I need to have all of these "ref"s already loaded in order to do the
            // work to:
            // 1) identify whether this user has already reviewed this product
            // 2) isolate that particular review so it does not appear in the read-only list of "other reviews".
            // 3) determine which reviews this user has flagged
            // So I must use $loaded thrice:
            $q.all( [
                self.statsForThisProduct.$loaded(),
                self.reviewsToShow.$loaded(),
                self.thisUserReviewKey.$loaded(),
                self.flagsFromThisLoggedinUser.$loaded()
            ] ).then (function() {
                    $scope.consensus = self.statsForThisProduct;
                    $scope.consensus.ratingOutOfTen = Math.round($scope.consensus.average*2);
                    $scope.consensus.ratingOutOfFive = $scope.consensus.ratingOutOfTen / 2;
                    self.loadedReviewsToShow = self.reviewsToShow;
                    self.loadedReviewsToShow.forEach(function(x){
                        var s = self.flagsFromThisLoggedinUser.$getRecord(x.$id);
                        if (s) {
                            // Basically this is the execution of a JOIN
                            x.flagged = true;
                        }
                    });
                    self.key_thisUserReviewOfThisProduct = self.thisUserReviewKey.$value;
                    $scope.key_thisUserReviewOfThisProduct = self.key_thisUserReviewOfThisProduct;
                    if (self.key_thisUserReviewOfThisProduct) {
                        // If we get here, this user *has* indeed already reviewed this very product.
                        // One more firebase load will give us that particular review:
                        $scope.userHasNotYetReviewed = false;
                        self.thisUserReviewOfThisProduct = $firebaseObject(refAllReviewsOfThisProduct.child(self.key_thisUserReviewOfThisProduct));
                        self.thisUserReviewOfThisProduct.$loaded(
                            function(x) {
                                $scope.writeableReview = {
                                    intendsToAddComment: (x.comment!='' || x.headline!=''),
                                    comment: x.comment,
                                    headline: x.headline,
                                    rating: x.rating,
                                    time: x.time,
                                    photoURL: x.photoURL,
                                    authorName: x.authorName,
                                    authorEmail: x.authorEmail
                                };
                            }
                        );
                        $('.review-presentation').css('opacity', '1');
                    }
                    else {
                        $scope.declare_this_user_not_yet_reviewed();
                    }
                }
            );



            // HANDLERS

            $scope.doLogout = function() {
                Cookies.remove("sklangular_logged_in_user");
                firebase.auth().signOut().then(function() {
                    $window.location = ('/angular-firebase-sandbox');
                    // Sign-out was successful.
                }, function(error) {
                   $window.alert("Logout failed.");
                });
            };

            $scope.submit = function() {
                if ($scope.userHasNotYetReviewed) {
                    $scope.push_review_to_server();
                } else {
                    $scope.update_review();
                }
            };

            $scope.push_review_to_server = function() {
                $scope.writeableReview = jQuery.extend({}, $scope.unsavedwriteableReview);  // shallow copy
                $scope.userHasNotYetReviewed = false;  // Do this immediately to lock out ability to submit more than once accidentally.
                //
                // THE WRITE OPERATION:  adding a new reviewchunk with the key being autogenerated.
                var new_chunk = refAllReviewsOfThisProduct.push();
                var chunk_uuid = new_chunk.key;
                new_chunk.set({
                    headline: $scope.writeableReview.headline,
                    comment: $scope.writeableReview.comment,
                    rating: $scope.writeableReview.rating,
                    authorName: $scope.user.displayName,
                    authorEmail: $scope.user.email,
                    photoURL: $scope.user.photoURL,
                    uid: $scope.user.uid,
                    time: Date.now()
                });

                self.key_thisUserReviewOfThisProduct = chunk_uuid; // this is touching a regular JS var, not anything firebasey
                $scope.writeableReview.time = Date.now();
                // THE WRITE OPERATION:  adding this new chunkID to this loggedin user's MAP prodID >> chunkID, not a PUSH but rather a set
                self.thisUserReviewOfThisProduct = $firebaseObject(refAllReviewsOfThisProduct.child(chunk_uuid));
                refThisUserReview.set(chunk_uuid);

                // Update average
                $mdDialog.hide();
                window.sklangular.calcAverage($firebaseArray, refAllReviewsOfThisProduct, refStatsForThisProduct,
                   function() {
                       $route.reload();
                       // Essential since we have no real way to force the
                       // writeable starstrip on the main page (not the dialogbox) to update!
                   });
            };


            $scope.update_review = function() {
                $scope.writeableReview = jQuery.extend({}, $scope.unsavedwriteableReview);  // shallow copy
                self.thisUserReviewOfThisProduct.headline = $scope.writeableReview.headline;
                self.thisUserReviewOfThisProduct.comment = $scope.writeableReview.comment;
                self.thisUserReviewOfThisProduct.rating = $scope.writeableReview.rating;
                self.thisUserReviewOfThisProduct.time = Date.now();
                self.thisUserReviewOfThisProduct.$save();
                // Update average
                $mdDialog.hide();
                window.sklangular.calcAverage($firebaseArray, refAllReviewsOfThisProduct, refStatsForThisProduct,
                   function() {
                       $route.reload();
                   });
            };

            $scope.show_comment_UI = function() {
                $scope.unsavedwriteableReview.intendsToAddComment = true;
            };
        })






    // This is a good "promissory" controller that does a firebase fetch and waits for
    // the result before setting its this.projects which is being watched by the GUI.
    .controller('ProductListController',
        function ($scope, $routeParams, $window) {
            // This currently just hardwires 3 products.
            this.products = {
                'prod-001': {
                    id: 'prod-001', label: "Kinky Boots",
                    image: "http://theaterleague.com/wp-content/uploads/2014/12/kwicks-slider-size-KINKYlogo.gif"
                },
                'prod-002': {
                    id: 'prod-002', label: "The Lion King",
                    image: 'https://www.ppacri.org/assets/img/thumbnail_lionking-01-105c3f10c0.jpg'
                },
                'prod-003': {
                    id: 'prod-003', label: "Phantom of the Opera",
                    image: 'http://www.stsonstage.com/uploads/images/catalog_src/the-phantom-of-the-opera_src_1.jpg'
                }
            };

            $scope.products = this.products;

            // Supports logout.
            $scope.user = window.logged_in_user;
            $scope.doLogout = function() {
                Cookies.remove("sklangular_logged_in_user");
                firebase.auth().signOut().then(function() {
                    $window.location = ('/angular-firebase-sandbox');
                    // Sign-out was successful.
                }, function(error) {
                    $window.alert("Logout failed.");
                });
            };
        });
