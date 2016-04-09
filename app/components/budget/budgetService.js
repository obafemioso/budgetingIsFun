function budgetService($q, deploydService) {
	var budgets = [];

	//budgets
	var getAllBudgets = function() {
		if(budgets.length != 0){
			return $q.when(budgets);
		}
		return deploydService.getAllBudgets()
			.then(function(allBudgets) {
				budgets = allBudgets;
				return budgets;
			});
	};

	var saveBudget = function(newBudget) {
		deploydService.saveBudget(newBudget)
			.then(function(budget) {
				budgets.push(budget);
			}, function(err) {
				console.log(err);
			});
	};

	this.getAllBudgets = getAllBudgets;
	this.saveBudget = saveBudget;
}

angular.module('budgettingIsFun')
	.service('budgetService', ['$q', 'deploydService', budgetService]);