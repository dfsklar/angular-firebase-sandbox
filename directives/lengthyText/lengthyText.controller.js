window.ANGLAPP.controller('lengthyTextCtrl', 

    function($scope) {

        // These are more like CONSTants configuring the behavior of the engine across all instaces.
        // They are static, never vary between instances/scopes.
        $scope.maxHeightCommentInLines = 7;
        $scope.fallbackGuessedLineHeight = 20;

        // These are instance variables, dynamic.
        $scope.shouldBeCondensed = false;
        $scope.userHasRequestedControl = false;
        $scope.rootElem = null;  // First call to the decide method will record this


        $scope.decideOnCondensation = function(elem) {
            $scope.rootElem = elem;
            if ($scope.userHasRequestedControl) {
                return;
            }

            // Here we use the actual height information to determine whether we want to condense,
            // because the user has not requested control.
        };


        $scope.getClassForLengthyTextNgbind = function() {
            return " "
        };


        $scope.getStyleForLengthyTextNgbind = function(index) {
                var css = {
                    'color': 'red' 
                };
                return css;
            };


        $scope.onViewmoreClick = function(elemViewMoreButton) {
            $(elemViewMoreButton).parent()
                .css({maxHeight: ""})
                .addClass('user-controlled-height')
                .removeClass('height-restricted');
        };

        $scope.scanForLengthyComments = function() {
            var self = this;
            $('.readonly-commentary-ngbind').each(function(idx) {
                var $boundElem = $(this);
                if (!$boundElem.hasClass('user-controlled-height')) {
                    var maxHeight = self.maxHeightCommentInLines * (parseFloat($(this).css('line-height')) || self.fallbackGuessedLineHeight);
                    var $parent = $boundElem.parent();
                    if ($boundElem.height() > maxHeight) {
                        $parent.addClass('height-restricted');
                        $parent.css({maxHeight: maxHeight});
                    } else {
                        $parent.css({maxHeight: ""});
                        $parent.removeClass('height-restricted');
                    }
                }
            });
        };
    }

);


