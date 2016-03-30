function normalizeIncomes(incomes) {
			if(!angular.isArray(incomes))
				incomes = [incomes];

			var normalizedIncomes = [];

			angular.forEach(incomes, function(income) {
				var normIncome = {};

				normIncome.job = income.job;
				normIncome.payrate = income.payrate;
				normIncome.hours = income.hours;
				normIncome.gross = income.payrate * income.hours * 4;
				normIncome.tax = income.taxPercent;
				normIncome.net = normIncome.gross * (1 - (income.taxPercent / 100));
				normIncome.biweekly = normIncome.net / 2;

				normalizedIncomes.push(normIncome);
			})

			return normalizedIncomes;
		};

function deploydService($http, $q, deployd) {

	this.getIncomes = function() {
		var deferred = $q.defer();

		$http.get(deployd + '/income-sources')
			.success(function(incomes) {
				deferred.resolve(normalizeIncomes(incomes));
			}).error(function(err) {
				deferred.reject(err);
			});
		return deferred.promise;
	};
}

angular.module('budgettingIsFun')
	.constant('deployd', 'http://localhost:2403')
	.service('deploydService', ['$http', '$q', 'deployd', deploydService]);