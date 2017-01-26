angular.module('Sklangular').controller(
    'ratingStarstripCtrl',

    // The function can be given services/objects it needs to know its context or acquire external info.
    // These are "INJECTED" automatically so the naming convention is important.
    // E.g. authService will be injected successfully only because it was established in ?????
    // Also, $rootScope hopefully will give us the ability to get access to the product's ID (the root is hopefully the product page!)
    function($scope, $rootScope, authService, productReviewService, $log) {


        /*

        $log.log('ENTERING RatingStarstripController');
        $log.log($scope);
        $log.log($rootScope);
        $log.log(authService);
        $log.log(productReviewService);

        // For example, we can acquire the user's info, e.g. to get info needed to find *this* user's ratings for this item.
        authService.getUser()
            .then(function(user) {
                $scope.user = user;
            });


      $scope.retrieve_value = function(product_id) {
        console.log("RETRIEVE VALUE");
         console.log($scope.user.uid);
         console.log(product_id);
         return 2;
      };

	    $scope.record_new_value = function () {
            // The new value is now safely in:  $scope.value
            console.log($scope.value);
	    }
	    */

    });
