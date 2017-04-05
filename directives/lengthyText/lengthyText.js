window.ANGLAPP.directive('lengthyText', function(){
    return {

        // To ensure an ngModelController is available so you can call $setViewValue/$render:
        require: '?ngModel',
        templateUrl: 'directives/lengthyText/lengthyText.html',
        scope: {
            user: '=ngModel'               
        }
    }

});
