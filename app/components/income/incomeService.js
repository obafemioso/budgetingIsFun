function incomeService($http, $q, deploydService) {

	this.message = "we still made it!?";
	var incomes;

	this.getIncomes = function() {
		if(angular.isDefined(incomes)){
			return $q.when(incomes);
		}
		return deploydService.getIncomes()
			.then(function(data) {
				incomes = data;
				return incomes;
			});
	};

}

angular.module('budgettingIsFun')
	.service('incomeService', ['$http', '$q', 'deploydService', incomeService]);