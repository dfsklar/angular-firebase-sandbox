angular.module('project', ['ngRoute', 'firebase'])

    .value('fbURL', 'https://angularsandbox-640d4.firebaseio.com/')


    /*
    .service('Projects', function($q, $firebaseObject, $firebaseArray, $firebaseAuth, projectListValue) {
      var self = this;
      this.fetch = function () {

          // We may already have a this.projects (actual or promised), so return it if it does exist:
          if (this.projects)
              return $q.when(this.projects);

          // Set up a promise.
          var deferred = $q.defer();
          var ref = firebase.database().ref('projects-fresh');

          var $projects = $firebaseObject(ref);
          $projects.$loaded()
              .then(function() {
                  console.log("FEW");
              })

          ref.on('value', function(snapshot) {
            if (snapshot.val() === null) {
              $projects.$set(projectListValue);
            }
            self.projects = $projects.$asArray();

            deferred.resolve(self.projects);
          });

          //Remove projects list when no longer needed.
          ref.onDisconnect().remove();
          return deferred.promise;
        });
      };
    })
    */


    .config(function($routeProvider) {

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
            .when('/', {
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


    .controller('ProjectListControllerPreFetched', function(projects) {
      var projectList = this;
      projectList.projects = projects;
    })


    // DFSKLARD: my attempt at a controller that does a firebase fetch and thus must cope with a deferral.
    .controller('ProjectListController', function($firebaseObject, $firebaseArray) {
        var ref = firebase.database().ref();
        ref.on("value", function(snapshot){
           var heythere = snapshot.val();
           var x = 3;
        });

        // https://github.com/firebase/angularfire/blob/master/docs/guide/synchronized-arrays.md
        // ^^^ includes the ability to do sorting and "limiting" right there in the firebase query!
        // READ IT!!!
        var projectList = this;
        projectList.projects = $firebaseArray(ref);
    })



    .controller('NewProjectController', function($location, projects) {
      var editProject = this;
      editProject.save = function() {
          projects.$add(editProject.project).then(function(data) {
              $location.path('/');
          });
      };
    })

    .controller('EditProjectController',
      function($location, $routeParams, projects) {
        var editProject = this;
        var projectId = $routeParams.projectId,
            projectIndex;

        editProject.projects = projects;
        projectIndex = editProject.projects.$indexFor(projectId);
        editProject.project = editProject.projects[projectIndex];

        editProject.destroy = function() {
            editProject.projects.$remove(editProject.project).then(function(data) {
                $location.path('/');
            });
        };

        editProject.save = function() {
            editProject.projects.$save(editProject.project).then(function(data) {
               $location.path('/');
            });
        };
    });
