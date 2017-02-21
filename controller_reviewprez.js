/*
  _____           _____       _            
 |  __ \         |  __ \     | |           
 | |__) | __ ___ | |__) |__ _| |_ ___ _ __ 
 |  ___/ '__/ _ \|  _  // _` | __/ _ \ '__|
 | |   | | | (_) | | \ \ (_| | ||  __/ |   
 |_|   |_|  \___/|_|  \_\__,_|\__\___|_|       v1.0

 (c) David F. Sklar, 2017

 License Forthcoming!


 This is the...
    REVIEW-PRESENTATION CONTROLLER !!
                                           */                                  


angular.module('ProRater_Module', ['ngRoute', 'firebase', 'ngMaterial', 'ProRater_DBService'])



    // This is a "promise-based" controller that does a fetch (from a db-wrapping service) and waits for
    // the result before setting its this.projects which is being watched by the GUI.
    .controller('ProRater_Controller_ReviewPrez',
        function ($scope, ProRater_DBOp, $firebaseObject, $routeParams, $firebaseArray, $window, $mdDialog, $mdMenu, $route, $q) {
            console.log("inside RLcontroller");

            // These next lines will allow the template to refer to things such as {{productID}}
            $scope.productID = $routeParams.productID;
            $scope.user = window.logged_in_user;  // This is an object with fields such as uid, etc.

            var self = this;

            $scope.userHasNotYetReviewed = true;

            ProRater_DBOp.fetchProduct($scope.productID, $scope.user.uid).then(
                function(data) {
                    // We now have all of the data needed for this display of ratings/notes
                    $scope.consensus = data.consensus;
                    $scope.consensus.ratingOutOfTen = Math.round($scope.consensus.average*2);
                    $scope.consensus.ratingOutOfFive = $scope.consensus.ratingOutOfTen / 2;
                    $scope.writeableReview =  jQuery.extend({}, data.thisUserReview);  // shallow copy
                    $scope.reviewsToShow = data.reviewsToShow;
                    self.reviewsToShow = data.reviewsToShow;  // !!! BIZARRE: ng-repeat uses self not $scope.  WHY?
                    $scope.key_thisUserReviewOfThisProduct = data.key_thisUserReviewOfThisProduct;
                    $scope.userHasNotYetReviewed =  ! data.userHasAlreadyReviewed;
                    if ($scope.userHasNotYetReviewed) {
                        $scope.declare_this_user_not_yet_reviewed();
                    } else {
                        $('.review-presentation').css('opacity', '1');
                    }
                },
                function(data) {
                    console.log('err');
                    console.log(data);
                }
            );

            $scope.add_flag = function(rvu) {
                idReview = rvu.$id;
                rvu.flagged = true;
                ProRater_DBOp.setFlagState(idReview, $scope.user.uid, true/*add flag*/);
            };

            $scope.remove_flag = function(rvu) {
                idReview = rvu.$id;
                rvu.flagged = false;
                ProRater_DBOp.setFlagState(idReview, $scope.user.uid, false/*remove flag*/);
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
                    ProRater_DBOp.deleteReview($scope.key_thisUserReviewOfThisProduct, $scope.productID, $scope.user.uid);
                    $scope.declare_this_user_not_yet_reviewed();
                    $route.reload();
                }, function() {
                    ;
                });
            };


            $scope.filter_to_only_others = function() {
                return function(reviewToTest) {
                    return (reviewToTest.$id != $scope.key_thisUserReviewOfThisProduct);
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
                $scope.key_thisUserReviewOfThisProduct = ProRater_DBOp.addReview($scope.productID, $scope.user, $scope.writeableReview);
                $mdDialog.hide();
            };


            $scope.update_review = function() {
                $scope.writeableReview = jQuery.extend({}, $scope.unsavedwriteableReview);  // shallow copy
                ProRater_DBOp.updateReview($scope.productID, $scope.key_thisUserReviewOfThisProduct, $scope.writeableReview);
              /*
                self.thisUserReviewOfThisProduct.headline = $scope.writeableReview.headline;
                self.thisUserReviewOfThisProduct.comment = $scope.writeableReview.comment;
                self.thisUserReviewOfThisProduct.rating = $scope.writeableReview.rating;
                self.thisUserReviewOfThisProduct.time = Date.now();
                self.thisUserReviewOfThisProduct.$save();
                */
                $mdDialog.hide();
                $route.reload();
            };

            $scope.show_comment_UI = function() {
                $scope.unsavedwriteableReview.intendsToAddComment = true;
            };
        });
