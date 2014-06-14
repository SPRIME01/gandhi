angular.module('gandhi')

.controller('Components.Start', function($scope, $state, Restangular) {

	// the model
	$scope.projectStart = $scope.project ? angular.copy($scope.project) : {};

	$scope.save = function() {

		// if we're updating an existing project
		if($scope.project){

			// just take the edits directly for now...
			var project = $scope.projectStart;

			if(!project.flow.stages[$scope.stage])
				project.flow.stages[$scope.stage] = {};

			project.flow.stages[$scope.stage].status = 'submitted';

			$scope.project.patch(project).then(function(res){

				// update the local project
				angular.extend($scope.project, res);

				// redirect to the next stage
				$state.go('portal.projects.stage', {project: res.id, stage: res.flow.active})
			}, function(err){
				alert('Sorry, but there was an error submitting this application. Pleast contact us.');
			});

		}

		// we're creating a new project
		else {
			// create the base project
			var project = {
				title: $scope.projectStart.title,
				cycle_id: $scope.cycle.id,
				users: {},
				flow: {
					stages: {}
				}
			};

			// add user
			project.users[$scope.currentUser.id] = {
				id: $scope.currentUser.id,
				role: 'applicant'
			};

			// this stage has been submitted
			project.flow.stages[$scope.stage] = {
				status: 'submitted',
				data: {}
			};

			// set the active stage to the next stage
			project.flow.active = $scope.cycle.flow.default[1];

			$scope.projects.post(project).then(function(res){

				// update the local projects list
				$scope.projects.push(res);

				// redirect to the next stage
				$state.go('portal.projects.stage', {project: res.id, stage: res.flow.active})
			}, function(err){
				alert('Sorry, but there was an error submitting this application. Pleast contact us.');
			});
		}

	};
});