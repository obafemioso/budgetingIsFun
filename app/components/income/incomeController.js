angular.module('budgettingIsFun')
	.controller('IncomeController', ['incomeService', 
		function(incomeService) {
			var self = this;

			self.incomes;
			self.types;
			
			//initially get incomes
			incomeService.getAllIncomes()
				.then(function(incomes) {
					self.incomes = incomes;
				}, function(err) {
					console.log(err);
				});


			//initially get types
			incomeService.getAllTypes()
				.then(function(types) {
					self.types = types;
				}, function(err) {
					console.log(err);
				});

			self.newIncome;

			self.saveIncome = function(newIncome) {
				incomeService.saveIncome(newIncome);
				self.newIncome = {};
			};
	}]);