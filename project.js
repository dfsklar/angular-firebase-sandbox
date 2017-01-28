
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
            var ref = firebase.database().ref('reviewchunks').child($routeParams.productID);
            this.reviews = $firebaseArray(ref);

            console.log("inside RLcontroller");
            // These next lines will allow the template to refer to things such as {{productID}}
            $scope.productID = $routeParams.productID;
            $scope.user = window.logged_in_user;
            $scope.writeableReview = {
                comment: "Write your review here",
                rating: 3
            };
            $scope.reviews = this.reviews;
            // <tr ng-repeat="review in ReviewListController.reviews | filter:projectList.search | orderBy:'name'">

            // HANDLERS

            $scope.push_review_to_server = function() {
                var new_chunk = ref.push();
                new_chunk.set({
                    comment: $scope.writeableReview.comment,
                    rating: $scope.writeableReview.rating,
                    author: $scope.user.displayName
                });
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
