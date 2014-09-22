'use strict';

angular.module('gandhi-component-schedule', ['gandhi-component', 'schemaForm'])

.config(function(GandhiComponentProvider) {
	GandhiComponentProvider.components['schedule'] = {
		title: "Form",
		directives: {
			default: 'gandhi-component-schedule',
			admin: 'gandhi-component-schedule-admin'
		}
	};
})

.directive('gandhiComponentSchedule', function() {
	return {
		scope: false,
		templateUrl: 'assets/bower/gandhi-component-schedule/app/default.html',
		controller: function($scope, $element, $attrs, $rootScope, Restangular, $state) {
			$scope.$watch('context', function(context) {
				if(!context.cycle || !context.project)
					return;

				$scope.stage = context.cycle.flow[context.stage];
				$scope.options = context.cycle.flow[context.stage].component.options;

				$scope.permissions = {
					read: context.role === null || ($scope.options.permissions.read ? $scope.options.permissions.read.indexOf(context.role) !== -1 : false),
					write: context.role === null || ($scope.options.permissions.write ? $scope.options.permissions.write.indexOf(context.role) !== -1 : false)
				}

				$scope.data = context.project.flow[context.stage].data;
				$scope.lock = context.project.flow[context.stage].lock;
				$scope.config = { formDefaults: { readonly: !!$scope.lock } };






				$scope.timezone = $scope.options.timezone;

				$scope.schedule = _($scope.options.slots)
					.map(function(data,id){
						return { begin: new Date(data.begin), end: new Date(data.end), id: id, available: !$scope.options.assignments[id] };
					})
					.sortBy('begin')
					.groupBy(function(o){ return o.begin.getFullYear() + ("0" + (o.begin.getMonth() + 1)).slice(-2) + ("0" + o.begin.getDate()).slice(-2); })
					.valueOf();

				$scope.reserve = function(slot){
					if(slot.available) $scope.data.reservation = slot.id;
				}







				

				$scope.save = function(){
					if(!$scope.permissions.write)
						return alert('Sorry, but you do not have write permissions.');

					if($scope.lock)
						return alert('Sorry, but this stage is locked.');

					var project = {flow:{}};
					project.flow[context.stage] = {
						id: context.stage,
						data: $scope.data,
						// status: 'draft'
					}

					context.project.patch(project).then(function(res){

						// update the project
						$rootScope.$broadcast('projects');

						alert('Changes successfully saved!');
					}, function(err){
						alert('Sorry, but there was an error saving your changes. Pleast contact us.');
					});
				}

				$scope.submit = function(form, model){
					if(!$scope.permissions.write)
						return alert('Sorry, but you do not have write permissions.');

					if($scope.lock)
						return alert('Sorry, but this stage is locked.');

					// validate
					$scope.$broadcast('schemaFormValidate');
					if (!form.$valid)
					  return alert('Sorry, but there are errors the form. Please correct them before submitting.');

					var project = {flow:{}};
					project.flow[context.stage] = {
						id: context.stage,
						data: $scope.data,
						status: 'complete'
					}

					context.project.patch(project).then(function(res){

						// update the project lists
						$rootScope.$broadcast('projects');

						// update the project itself
						angular.extend(context.project, res);

						// redirect to the next stage
						$state.go('portal.projects.show.flow', {project: res.data.id, stage: $scope.options.next});


						alert('Successfully saved!');
					}, function(err){
						alert('Sorry, but there was an error submitting this application. Pleast contact us.');
					});
				}

			});
		}
	}
})

.directive('gandhiComponentScheduleAdmin', function() {
	return {
		scope: false,
		templateUrl: 'assets/bower/gandhi-component-schedule/app/admin.html',
		controller: function($scope, $element, $attrs, $rootScope, Restangular, $state) {


			$scope.$watch('context', function(context) {

				$scope.cycle = context.cycle;

				$scope.stage = context.cycle.flow[context.stage];
				$scope.options = context.cycle.flow[context.stage].component.options;
				$scope.data = angular.copy($scope.options);

				// process the schema
				$scope.$watch('data.schema', function(schema){
					$scope.schema = JSON.stringify(schema || {type: 'object', properties: {}}, null, 2);
				});

				// process the form
				$scope.$watch('data.form', function(form){
					$scope.form = JSON.stringify(form || ['*'], null, 2);
				});

				$scope.save = function(){

					try {
						$scope.data.schema = JSON.parse($scope.schema);
					} catch(e){}

					try {
						$scope.data.form = JSON.parse($scope.form);
					} catch(e){}

					var data = {flow: {}}; data.flow[context.stage] = {component: {options: $scope.data}};
					context.cycle.patch(data).then(function(res){

						// update the local lists
						$rootScope.$broadcast('cycles');

						alert('Changes successfully saved.');

					}, function(err){
						if(err.data && err.data.message)
							alert(err.data.message);
						else
							alert("There was a problem saving your changes.");
					});
				}
			});
			
		}
	}
});
