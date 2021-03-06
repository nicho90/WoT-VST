var app = angular.module("gwot-vst");


/**
 * Navbar Controller
 */
app.controller("NavController", function($scope, $rootScope, $translate, $location, config, $loginService, $thresholdService) {


    /**
     * Highlight Menu Button if View is Active
     */
    $scope.isActive = function(viewLocation){
        return viewLocation===$location.path();
    };


    /**
     * Sign up
     */
    $scope.signUp = function(){
        $location.url("/new/user");
    };


    /**
     * Show Settings
     */
    $scope.showSettings = function(){
        if($rootScope.authenticated_user){
            $location.url("/users/" + $rootScope.authenticated_user.username);
        }
    };


    /**
     * User Authentication
     */
    $scope.resetAuthentication = function(){
        delete $rootScope.authenticated_user;
        delete $scope.authenticated_user;

        // Update all Controllers
        $rootScope.$broadcast('update');
    };


    /**
     * Load App Configuration and check user authentication
     */
    $scope.config = config;
    if($scope.authenticated_user) {
        $scope.user = $scope.authenticated_user;
    } else {
        $scope.user = {
            username : "demo",
            password : "demo2016"
        };
    }


    /**
     * Login (Authentication)
     */
    $scope.login = function(){

        var validation;
        if($scope.user.username.length !== 0){
            validation = true;
        } else {
            validation = false;
        }

        if($scope.user.password.length !== 0){
            validation = (validation && true);
        } else {
            validation = (validation && false);
        }

        if(validation){
            $loginService.authenticate($scope.user).success(function(response){
                $scope.authenticated_user = response;
                $rootScope.authenticated_user = response;

                // Load thresholds
                $scope.load_thresholds();

                // Throw Alert
                $rootScope.alert = {
                    status: 1,
                    info: "",
                    message: "Hi " + $scope.authenticated_user.first_name + " " + $scope.authenticated_user.last_name // TODO: translate
                };
                $rootScope.$broadcast('alert');

            }).error(function(err){

                $rootScope.alert = {
                    status: 2,
                    info: "Error ",
                    message: err.message
                };
                $rootScope.$broadcast('alert');

            });
        } else {

            $rootScope.alert = {
                status: 2,
                info: "Error ",  // TODO: translate
                message: "Please insert a username and a password!"  // TODO: translate
            };
            $rootScope.$broadcast('alert');

        }
    };


    /**
     * Load thresholds
     */
    $scope.load_thresholds = function(){

        $thresholdService.list($rootScope.authenticated_user.token, $rootScope.authenticated_user.username).success(function(response){

            $scope.authenticated_user.thresholds = response;
            $rootScope.authenticated_user.thresholds = response;

            // Select first threshold as currentThreshold
            if($rootScope.authenticated_user.thresholds.length !== 0){
                $scope.authenticated_user.currentThreshold = $rootScope.authenticated_user.thresholds[0];
                $rootScope.authenticated_user.currentThreshold = $rootScope.authenticated_user.thresholds[0];
            } else {
                $rootScope.authenticated_user.currentThreshold = {
                    threshold_id: 0
                };
            }

            // Update all Controllers again
            $rootScope.$broadcast('update');

        }).error(function(err){
            $scope.err = err;

            $rootScope.alert = {
                status: 2,
                info: "Error ",
                message: err.message
            };
            $rootScope.$broadcast('alert');
        });
    };


    /**
     * Update thresholds
     */
    $rootScope.$on('updateThresholds', function(){
        $scope.load_thresholds();
    });


    /**
     * Update User
     */
    $rootScope.$on('updateUser', function(){
        $scope.authenticated_user = $rootScope.authenticated_user;

        // Load thresholds
        $scope.load_thresholds();
    });


    /**
     * Reset User
     */
    $rootScope.$on('resetUser', function(){
        delete $scope.authenticated_user;
    });


    /**
     * Logout
     */
    $scope.logout = function(){
        $scope.resetAuthentication();
    };


    /**
     * Close Alert
     */
    $scope.alertClose = function(){
        $scope.isAlert = false;
    };


    /**
     * Set new current Threshold
     */
    $scope.updateCurrentThreshold = function(threshold){

        $scope.authenticated_user.currentThreshold = threshold;

        // Update all Controllers
        $rootScope.$broadcast('update');
    };
});
