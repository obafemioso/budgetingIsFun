angular.module('budgettingIsFun')
	.controller('IncomeController', ['incomeService', 
		function(incomeService) {
			var self = this;

			//init-------------------------------
			self.incomes = [];
			self.incomeTypes = [];

			//Get incomes
			incomeService.getAllIncomes()
				.then(function(incomes) {
					self.incomes = incomes;
				}, function(err) {
					console.log(err);
				});

			//Get incomeTypes
			incomeService.getAllIncomeTypes()
				.then(function(incomeTypes) {
					self.incomeTypes = incomeTypes;
				}, function(err) {
					console.log(err);
				});
			//init end---------------------------

			//actions----------------------------
			self.newIncome = {};

			self.saveIncome = function(newIncome) {
				incomeService.saveIncome(newIncome);
				self.newIncome = {};
			};

			self.payInfo = {};
			self.calculatedPayrate = 0;
			self.calculatedHours = 0;

			self.calculatePayrate = function(payInfo) {
				self.calculatedPayrate = incomeService.calculatePayrate(payInfo.incomeType, payInfo.wage, payInfo.hours);
				self.calculatedHours = (payInfo.hours) ? payInfo.hours : 40;
			};

			self.totalYearlyGross = incomeService.totalYearlyGross;
			self.totalYearlyNet = incomeService.totalYearlyNet;
			self.totalYearlyTax = incomeService.totalYearlyTax;
			self.total = incomeService.total;
			//actions end------------------------
	}]);