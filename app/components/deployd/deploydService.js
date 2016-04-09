function deploydService($http, $q, deployd) {
	//budgets
	var budgets = function() {
		var deferred = $q.defer();

		$http.get(deployd + '/budgets')
			.success(function(budgets) {
				deferred.resolve(budgets);
			}).error(function(err) {
				deferred.reject(err);
			});

		return deferred.promise;
	};

	var saveBudget = function(newBudget) {
		var deferred = $q.defer();

		$http.post(deployd + '/budgets', {
			name: newBudget.name,
			percentAllotment: newBudget.percent
		}).success(function(budget) {
			deferred.resolve(budget);
		}).error(function(err) {
			deferred.reject(err);
		});

		return deferred.promise;
	};

	//incomes
	var incomes = function() {
		var deferred = $q.defer();

		$http.get(deployd + '/income-sources')
			.success(function(incomes) {
				deferred.resolve(incomes);
			}).error(function(err) {
				deferred.reject(err);
			});

		return deferred.promise;
	};

	var saveIncome = function(newIncome) {
		var deferred = $q.defer();

		$http.post(deployd + '/income-sources', {
			job: newIncome.job,
			incomeType: newIncome.type.id,
			payrate: newIncome.payrate,
			hours: newIncome.hours,
			taxPercent: newIncome.taxPercent
		}).success(function(income) {
			deferred.resolve(income);
		}).error(function(err) {
			deferred.reject(err);
		});

		return deferred.promise;
	};

	//income-types
	var types = function() {
		var deferred = $q.defer();

		$http.get(deployd + '/income-types')
			.success(function(types) {
				deferred.resolve(types);
			}).error(function(err) {
				deferred.reject(err);
			});

		return deferred.promise;
	}

	var type = function(id) {
		var deferred = $q.defer();

		$http.get(deployd + '/income-types?id=' + id)
			.success(function(type) {
				deferred.resolve(type);
			}).error(function(err) {
				console.log(err);
			});

			return deferred.promise;
	};

	this.getAllBudgets = budgets;
	this.saveBudget = saveBudget;
	
	this.getAllIncomes = incomes;
	this.saveIncome = saveIncome;

	this.getAllTypes = types;
	this.getType = type;
}

angular.module('budgettingIsFun')
	.constant('deployd', 'http://localhost:2403')
	.service('deploydService', ['$http', '$q', 'deployd', deploydService]);