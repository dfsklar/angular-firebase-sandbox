
angular.module('Sklangular', ['ngRoute', 'firebase', 'ngMaterial'])

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
        function ($scope, $firebaseObject, $routeParams, $firebaseArray, $window, $mdDialog, $route) {
            console.log("inside RLcontroller");

            // These next lines will allow the template to refer to things such as {{productID}}
            $scope.productID = $routeParams.productID;
            $scope.user = window.logged_in_user;

            var self = this;

            $scope.userHasNotYetReviewed = true;

            // Ref to the bucket of all reviews for this product.
            // Notice that the ref can be sent through limitToLast at the tail end.
            var refAllReviewsOfThisProduct = firebase.database().ref('reviewchunks').child($scope.productID);
            var refReviewsToShow = refAllReviewsOfThisProduct.limitToLast(20);
            // ^^^^^^^^^^^^ This is only a promise; the data will not have been loaded yet!
            // Notice that here is where I'm doing the reversal of order.
            self.reviewsToShow = $firebaseArray(refReviewsToShow).reverse();
            // ^^^^^^^^^^^^ This is only a promise; the data will not have been loaded yet!

            // We can use this user's own index of all reviews he/she have contributed to determine whether
            // this user has ever reviewed *this* product.
            // Again, this is only a promise!
            var refThisUserReview = firebase.database().ref('users').child($scope.user.uid).child($scope.productID);
            self.thisUserReviewKey = $firebaseObject(refThisUserReview);
            // ^^^ This is a promise. And the data located at that ref is the *key* of the review, not the actual review.
            // This key would be used as a child positioner into "refAllReviewsOfThisProduct".


            $scope.popupReviewDialog = function(ev) {
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


            $scope.filter_to_only_others = function() {
                return function(reviewToTest) {
                    return (reviewToTest.$id != self.key_thisUserReviewOfThisProduct);
                }
            };

            // I need to have both of these "ref"s already loaded in order to do the
            // work to:
            // 1) identify whether this user has already reviewed this product
            // 2) isolate that particular review so it does not appear in the read-only list of "other reviews".
            // So I must use $loaded twice:
            self.reviewsToShow.$loaded(
                function(reviewsLoaded) {
                    self.loadedReviewsToShow = reviewsLoaded;
                    self.thisUserReviewKey.$loaded(
                        function(thisUserReviewLoaded) {
                            self.key_thisUserReviewOfThisProduct = thisUserReviewLoaded.$value;
                            $scope.key_thisUserReviewOfThisProduct = self.key_thisUserReviewOfThisProduct;
                            if (self.key_thisUserReviewOfThisProduct) {
                                // If we get here, this user *has* indeed already reviewed this very product.
                                // One more firebase load will give us that particular review:
                                $scope.userHasNotYetReviewed = false;
                                self.thisUserReviewOfThisProduct = $firebaseObject(refAllReviewsOfThisProduct.child(self.key_thisUserReviewOfThisProduct));
                                self.thisUserReviewOfThisProduct.$loaded(
                                    function(x) {
                                        $scope.writeableReview = {
                                            comment: x.comment,
                                            rating: x.rating,
                                            time: x.time,
                                            photoURL: x.photoURL,
                                            authorName: x.authorName,
                                            authorEmail: x.authorEmail
                                        };
                                    }
                                )
                                $('.review-presentation').css('opacity', '1');
                            }
                            else {
                                // This user has NOT already reviewed this product!
                                $scope.writeableReview = {
                                    comment: "",
                                    rating: 1
                                };
                                $('.review-presentation').css('opacity', '1');
                            }
                        }
                    )
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

            $scope.push_review_to_server = function() {
                $scope.userHasNotYetReviewed = false;  // Do this immediately to lock out ability to submit more than once accidentally.
                var new_chunk = refAllReviewsOfThisProduct.push();
                var chunk_uuid = new_chunk.key;
                new_chunk.set({
                    comment: $scope.writeableReview.comment,
                    rating: $scope.writeableReview.rating,
                    authorName: $scope.user.displayName,
                    authorEmail: $scope.user.email,
                    photoURL: $scope.user.photoURL,
                    uid: $scope.user.uid,
                    time: Date.now()
                });
                self.key_thisUserReviewOfThisProduct = chunk_uuid;
                $scope.writeableReview.time = Date.now();
                self.thisUserReviewOfThisProduct = $firebaseObject(refAllReviewsOfThisProduct.child(chunk_uuid));
                refThisUserReview.set(chunk_uuid);
            };


            $scope.update_review = function() {
                self.thisUserReviewOfThisProduct.comment = $scope.writeableReview.comment;
                self.thisUserReviewOfThisProduct.rating = $scope.writeableReview.rating;
                self.thisUserReviewOfThisProduct.time = Date.now();
                self.thisUserReviewOfThisProduct.$save();
                $mdDialog.hide();
                $route.reload();  // Essential since we have no real way to force the writeable starstrip on the main page (not the dialogbox) to update!
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
