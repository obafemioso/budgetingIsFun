angular.module('budgettingIsFun')
	.constant('deployd', 'http://localhost:2403')
	.controller('BudgetController', ['$http', 'deployd', function($http, deployd) {
		var self = this;

		self.budgets = [];
		self.items = [];

		$http.get(deployd + '/budgets')
			.success(function(categories) {
				self.budgets = categories;
				$http.get(deployd + '/budget-items')
					.success(function(items) {
						self.items = items;
					})
					.error(function(err) {
						console.log(err);
					});
			}).error(function(err) {
				console.log(err);
			});

		self.newBudget = {};

		self.saveBudget = function(newBudget) {
			$http.post(deployd + '/budgets', {
				name: newBudget.name,
				percentAllotment: newBudget.percent
			}).success(function(budget) {
				self.newBudget = {};
				self.budgets.push(budget);
			}).error(function(err) {
				console.log(err);
			});
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