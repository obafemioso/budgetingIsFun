angular.module('budgettingIsFun')
	.constant('deployd', 'http://localhost:2403')
	.controller('BudgetController', ['$http', 'deployd', 'budgetService', function($http, deployd, budgetService) {
		var self = this;

		self.budgets;
		self.items = [];
  
  		budgetService.getAllBudgets()
  			.then(function(budgets) {
  				self.budgets = budgets;
  			}, function(err) {
  				console.log(err);
  			});

		self.newBudget = {};

		self.saveBudget = function(newBudget) {
			budgetService.saveBudget(newBudget);
			self.newBudget = {};
		};

		self.newItem = {};

		self.addItem = function(newItem) {
			$http.post(deployd + '/budget-items', {
				name: newItem.name,
				amount: newItem.amount,
				budgetId: newItem.budgetId
			}).success(function(item){
				self.newItem = {};
				self.items.push(item);
			}).error(function(err) {
				console.log(err);
			});
		};

		self.total = function(budgetId) {
			var total = 0;
			angular.forEach(self.items, function(item) {
				if(item.budgetId == budgetId)
					total += item.amount;
			});
			return total;
		};

		var getBudget = function(id) {
			for(i = 0; i < self.budgets.length; i++) {
				if(self.budgets[i].id == id)
					return self.budgets[i];
			}
		};
	}]);