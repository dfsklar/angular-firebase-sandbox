window.ANGLAPP.directive('lengthyText', function(){
    return {

        require: 'AE',
        templateUrl: 'directives/lengthyText/lengthyText.html',
        scope: {
            proseContent: '=ngModel'               
        }
    }

});
