
angular.module('Sklangular', ['ngRoute', 'firebase'])

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

            .when('/framework_list', {
                controller: 'ProjectListController as projectList',
                templateUrl: 'list.html'
                // resolve: resolveProjects // ^^^^ see above comment
            })
            .when('/edit/:projectId', {
                controller: 'EditProjectController as editProject',
                templateUrl: 'detail.html'
                // resolve: resolveProjects
            })
            .when('/new', {
                controller: 'NewProjectController as editProject',
                templateUrl: 'detail.html'
                // resolve: resolveProjects
            })
            .otherwise({
                redirectTo: '/'
            });
    })



    // This is a good "promissory" controller that does a firebase fetch and waits for
    // the result before setting its this.projects which is being watched by the GUI.
    .controller('ReviewListController',
        function ($scope, $firebaseObject, $routeParams, $firebaseArray) {
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

            // We first assume that this particular logged-in user has NOT yet reviewed this particular product.
            // So we initialize the writeable review with some "prompting" as shown here.
            // Below, after the database remote loads have completed, we will override this
            // if we find out this user had already reviewed this product.
            $scope.writeableReview = {
                comment: "",
                rating: 3
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
                            if (self.key_thisUserReviewOfThisProduct) {
                                // If we get here, this user *has* indeed already reviewed this very product.
                                // One more firebase load will give us that particular review:
                                $scope.userHasNotYetReviewed = false;
                                self.thisUserReviewOfThisProduct = $firebaseObject(refAllReviewsOfThisProduct.child(self.key_thisUserReviewOfThisProduct));
                                self.thisUserReviewOfThisProduct.$loaded(
                                    function(x) {
                                        $scope.writeableReview = {
                                            comment: x.comment,
                                            rating: x.rating
                                        };
                                    }
                                )
                            }
                        }
                    )
                }
            );



            // HANDLERS

            $scope.push_review_to_server = function() {
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
                refThisUserReview.set(chunk_uuid);
            }
        })





    // This is a good "promissory" controller that does a firebase fetch and waits for
    // the result before setting its this.projects which is being watched by the GUI.
    .controller('ProjectListController', function ($firebaseObject, $firebaseArray) {
        var ref = firebase.database().ref('framework-db');

        // Now these next 4 lines are actually not necessary at all, but they show how
        // you would handle obtaining the results here for processing before fulfilling
        // the promise.
        ref.on("value", function (snapshot) {
            var heythere = snapshot.val();
            var x = 3;
        });

        // https://github.com/firebase/angularfire/blob/master/docs/guide/synchronized-arrays.md
        // ^^^ includes the ability to do sorting and "limiting" right there in the firebase query!
        // READ IT!!!
        var projectList = this;
        projectList.userName = window.logged_in_user.displayName;
        projectList.email = window.logged_in_user.email;
        projectList.photoURL = window.logged_in_user.photoURL;
        projectList.projects = $firebaseArray(ref);
        // <tr ng-repeat="project in projectList.projects | filter:projectList.search | orderBy:'name'">
    })


    .controller('NewProjectController', function ($location, projects) {
        var editProject = this;
        editProject.save = function () {
            projects.$add(editProject.project).then(function (data) {
                $location.path('/');
            });
        };
    })

    .controller('EditProjectController',
        function ($location, $routeParams, projects) {
            var editProject = this;
            var projectId = $routeParams.projectId,
                projectIndex;

            editProject.projects = projects;
            projectIndex = editProject.projects.$indexFor(projectId);
            editProject.project = editProject.projects[projectIndex];

            editProject.destroy = function () {
                editProject.projects.$remove(editProject.project).then(function (data) {
                    $location.path('/');
                });
            };

            editProject.save = function () {
                editProject.projects.$save(editProject.project).then(function (data) {
                    $location.path('/');
                });
            };
        });
