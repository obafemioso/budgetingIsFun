angular.module('budgetingIsFun')
	.controller('ProjectedBalanceController', ['projectedBalanceService', 
		function(projectedBalanceService) {
			var self = this; 

			//init-------------------------------
			self.getBalance = projectedBalanceService.getBalance;

			//init end---------------------------

			//actions----------------------------
			self.coreExpenses = projectedBalanceService.getCoreExpenses;

			//actions end------------------------
	}]);