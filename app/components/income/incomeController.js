angular.module('budgettingIsFun')
	.controller('IncomeController', ['incomeService', 
		function(incomeService) {
			var self = this;

			self.incomes = [];
			self.incomeTypes = [];

			//initially get incomes
			incomeService.getAllIncomes()
				.then(function(incomes) {
					self.incomes = incomes;
				}, function(err) {
					console.log(err);
				});


			//initially get incomeTypes
			incomeService.getAllIncomeTypes()
				.then(function(incomeTypes) {
					self.incomeTypes = incomeTypes;
				}, function(err) {
					console.log(err);
				});

			self.newIncome = {};

			self.saveIncome = function(newIncome) {
				incomeService.saveIncome(newIncome);
				self.newIncome = {};
			};
	}]);