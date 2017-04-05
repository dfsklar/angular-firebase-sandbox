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
    DEMO URL ROUTER/DISPATCHER !!
                                           */               



window.ANGLAPP

    .config(function ($routeProvider) {


        // The demo site only has two pages:  a product-list (purely demo, no code of interest to you) and ...
        // ... the ...
        // product description page in which you'll find the embedded areas handled by ProRater!

        $routeProvider

            .when('/product_description/:productID', {
                // The captured :productID will be sent to the controller via $routeParams.
                controller: 'ProRater_Controller_ReviewPrez as reviewlistCTRLR',
                // Are you integrating PRORATER into your catalog site?  If so, this template is the key to your success.
                // Inside the template are clearly marked areas from which you will copy blocks of code into your own templates.
                templateUrl: 'demo_template_productpage.html'
            })

            .when('/demo_lengthy_text', {
                controller: 'DemoLengthyTextController as CTRLR',
                templateUrl: 'demo_lengthy_text.html'
            })

            .when('/product_list', {
                controller: 'DemoProductListController as prodlistCTRLR',
                templateUrl: 'product_list.html'
            })

            .otherwise({
                redirectTo: '/demo_lengthy_text'
            });
    });



