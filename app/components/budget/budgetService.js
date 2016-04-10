function budgetService($q, deploydService) {
	var budgets = [];
	var budgetItems = [];

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

	var getAllBudgetItems = function() {
		if(budgetItems.length != 0){
			return $q.when(budgetItems);
		}
		return deploydService.getAllBudgetItems()
			.then(function(allBudgetItems) {
				budgetItems = allBudgetItems;
				return budgetItems;
			});
	};

	var saveBudget = function(newBudget) {
		deploydService.saveBudget(newBudget)
			.then(function(newBudget) {
				budgets.push(newBudget);
			}, function(err) {
				console.log(err);
			});
	};

	var saveBudgetItem = function(newBudgetItem) {
		deploydService.saveBudgetItem(newBudgetItem)
			.then(function(newBudgetItem) {
				budgetItems.push(newBudgetItem);
			}, function(err) {
				console.log(err);
			});
	};

	var total = function(budgetId) {
		var total = 0;
		angular.forEach(budgetItems, function(budgetItem) {
			if(budgetItem.budgetId == budgetId)
				total += budgetItem.amount;
		});
		return total;
	};

	this.getAllBudgets = getAllBudgets;
	this.saveBudget = saveBudget;
	this.getAllBudgetItems = getAllBudgetItems;
	this.saveBudgetItem = saveBudgetItem;
	this.total = total;
}

angular.module('budgettingIsFun')
	.service('budgetService', ['$q', 'deploydService', budgetService]);