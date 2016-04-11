angular.module('budgettingIsFun')
	.controller('BudgetController', ['budgetService', 'incomeService', function(budgetService, incomeService) {
		var self = this;

		self.budgets = [];
		self.budgetItems = [];
  
		self.budgetCap = budgetService.budgetCap;

		self.budgetUtilization = budgetService.budgetUtilization;

		self.budgetBalance = budgetService.budgetBalance;

		self.guidelineTotal = budgetService.guidelineTotal;

		self.taxUtilization = budgetService.taxUtilization;

		self.overviewUtilizationTotal = budgetService.overviewUtilizationTotal;

  		budgetService.getAllBudgets()
  			.then(function(budgets) {
  				self.budgets = budgets;
  				budgetService.getAllBudgetItems()
  					.then(function(items) {
  						self.budgetItems = items;
  					}, function(err) {
  						console.log(err);
  					});
  			}, function(err) {
  				console.log(err);
  			});

		self.newBudget = {};

		self.saveBudget = function(newBudget) {
			budgetService.saveBudget(newBudget);
			self.newBudget = {};
		};

		self.newBudgetItem = {};

		self.saveBudgetItem = function(newBudgetItem) {
			budgetService.saveBudgetItem(newBudgetItem);
			self.newBudgetItem = {};
		};

		self.total = budgetService.total;
	}]);