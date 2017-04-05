window.ANGLAPP.directive('lengthyText', function(){
    return {

        restrict: 'AE',
        templateUrl: 'directives/lengthyText/lengthyText.html',
        controller: 'lengthyTextCtrl',
        scope: {
            proseContent: '=ngModel'               
        },
        link: function(scope, elem) {
            scope.decideOnCondensation(elem);
        }
    }

});
