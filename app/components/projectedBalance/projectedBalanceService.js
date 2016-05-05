//projected balance service
function projectedBalanceService(incomeService, budgetService) {
	var balance = 0;

	var getBalance = function() {
		return incomeService.total('net') - budgetService.totalAll();
	};

	var coreExpenses = function(multiple) {
		return (angular.isNumber(multiple)) ? budgetService.totalCore() * multiple : budgetService.totalCore();
	};

	this.getBalance = getBalance;
	this.getCoreExpenses = coreExpenses;
}

angular.module('budgettingIsFun')
	.service('projectedBalanceService', ['incomeService', 'budgetService', projectedBalanceService]);