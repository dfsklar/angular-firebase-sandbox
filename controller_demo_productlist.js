/*
  _____           _____       _            
 |  __ \         |  __ \     | |           
 | |__) | __ ___ | |__) |__ _| |_ ___ _ __ 
 |  ___/ '__/ _ \|  _  // _` | __/ _ \ '__|
 | |   | | | (_) | | \ \ (_| | ||  __/ |   
 |_|   |_|  \___/|_|  \_\__,_|\__\___|_|       v1.0

 (c) David F. Sklar, 2017

 License Forthcoming!


D E M O - o n l y

Hey - this is part of the DEMO reference app.
It is NOT part of the system
that you would bring into your application.

 This is the...
    DEMO PRODUCT-PRESENTATION CONTROLLER !!
                                           */                                  


angular.module('ProRater_Module', ['ngRoute', 'firebase', 'ngMaterial', 'ProRater_DBService'])

    .controller('DemoProductListController',
        function ($scope, $routeParams, $window) {
            // This currently just placed in the scope a set of 3 "products" (Broadway shows in this case).
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
