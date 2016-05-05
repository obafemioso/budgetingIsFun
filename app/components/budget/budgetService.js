function budgetService($q, deploydService, incomeService) {
	var budgets = [];
	var budgetItems = [];

	//Gets and Saves---------------------------------
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
			.then(function(newBudget) {
				budgets.push(newBudget);
			}, function(err) {
				console.log(err);
			});
	};

	var getBudget = function(budgetId) {
		deploydService.getBudget(budgetId)
			.then(function(budget) {
				return budget;
			}, function(err) {
				console.log(err);
				return null;
			});
	};

	//budget-items
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

	var saveBudgetItem = function(newBudgetItem) {
		deploydService.saveBudgetItem(newBudgetItem)
			.then(function(newBudgetItem) {
				budgetItems.push(newBudgetItem);
			}, function(err) {
				console.log(err);
			});
	};
	//End Gets and Saves ----------------------------

	//Statistics ------------------------------------
	var total = function(budget) {
		return budgetItems.reduce(function(prev, curr) {
			if(curr.budgetId == budget.id)
				return prev + curr.amount;
			return prev;
		}, 0);
	};

	var totalCore = function() {
		var totalCore = 0;

		angular.forEach(budgets, function(budget) {
			if(budget.name == 'Fixed' || budget.name == 'Flex') {
				var x = total(budget);
				totalCore += x;
			}
		});

		return totalCore;
	};

	var totalAll = function() {
		return budgetItems.reduce(function(prev, curr) {
			return prev + curr.amount;
		}, 0);
	};

	var budgetCap = function(budget) {
		return budget.percentAllotment / 100 * incomeService.total('net');
	};

	var budgetUtilization = function(budget) {
		return total(budget) / incomeService.total('net') * 100;
	};

	var budgetBalance = function(budget) {
		return budgetCap(budget) - total(budget);
	};

	var guidelineTotal = function() {
		return budgets.reduce(function(prev, curr) {
			return prev + curr.percentAllotment;
		}, 0);
	};

	var taxUtilization = function() {
		var grossIncome = incomeService.total('gross');
		var netIncome = incomeService.total('net');

		return (grossIncome - netIncome) / grossIncome;
	};

	var overviewUtilizationTotal = function() {
		return budgets.reduce(function(prev, curr) {
			return prev + budgetUtilization(curr);
		}, taxUtilization());
	};
	//End Statistics --------------------------------

	this.getAllBudgets = getAllBudgets;
	this.saveBudget = saveBudget;
	this.getBudget = getBudget;
	this.getAllBudgetItems = getAllBudgetItems;
	this.saveBudgetItem = saveBudgetItem;
	this.total = total;
	this.totalCore = totalCore;
	this.totalAll = totalAll;

	this.budgetCap = budgetCap;
	this.budgetUtilization = budgetUtilization;
	this.budgetBalance = budgetBalance;
	this.guidelineTotal = guidelineTotal;
	this.taxUtilization = taxUtilization;
	this.overviewUtilizationTotal = overviewUtilizationTotal;
}

angular.module('budgettingIsFun')
	.service('budgetService', ['$q', 'deploydService', 'incomeService', budgetService]);