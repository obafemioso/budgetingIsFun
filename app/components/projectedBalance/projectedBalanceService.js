//projected balance service
function projectedBalanceService(incomeService, budgetService) {
	var balance = 0;

	var getBalance = function() {
		return incomeService.total('net') - budgetService.totalAll();
	};

	var coreExpenses = function(multiple) {
	};

	this.getBalance = getBalance;
	this.getCoreExpenses = coreExpenses;
}

angular.module('budgetingIsFun')
	.service('projectedBalanceService', ['incomeService', 'budgetService', projectedBalanceService]);