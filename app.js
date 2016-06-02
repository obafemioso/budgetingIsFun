angular.module('budgettingIsFun', ['angular.filter'])
	.controller('BaseController', ['$scope', function($scope) {
		$scope.welcomeMessage = 'Welcome Savy Budgetter';
	}]);

angular.module("customFilters", [])
    .filter("unique", function () {
        return function (data, propertyName) {
            if (angular.isArray(data) && angular.isString(propertyName)) {
                var results = [];
                var keys = {};
                for (var i = 0; i < data.length; i++) {
                    var val = data[i][propertyName];
                    if (angular.isUndefined(keys[val])) {
                        keys[val] = true;
                        results.push(data[i]);
                    }
                }
                console.log(results);
                return results;
            } else {
                return data;
            }
        };
    });

angular.module('budgettingIsFun')
	.controller('BudgetController', ['budgetService', 'incomeService', function(budgetService, incomeService) {
		var self = this;

  		//init-----------------------------------
		self.budgets = [];
		self.budgetItems = [];
  		
  		//Get budgets and budget items
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

  		//init end-------------------------------

  		//actions--------------------------------
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

		self.budgetCap = budgetService.budgetCap;
		self.budgetUtilization = budgetService.budgetUtilization;
		self.budgetBalance = budgetService.budgetBalance;
		self.guidelineTotal = budgetService.guidelineTotal;
		self.taxUtilization = budgetService.taxUtilization;
		self.overviewUtilizationTotal = budgetService.overviewUtilizationTotal;
		self.total = budgetService.total;

		//actions end----------------------------
	}]);
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
		return total(budget) / incomeService.total('gross') * 100;
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

		return (grossIncome - netIncome) / grossIncome * 100;
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
function dataService($q) {
	//budgets
	var budgets = function() {
		var deferred = $q.defer();

		firebase.database().ref('budgets')
			.orderByChild('userId')
			.equalTo('test1')
			.on('value', function(budgets) {
				deferred.resolve(budgets.val());
			});
		
		return deferred.promise;
	};

	this.getBudgets = budgets;
}

angular.module('budgettingIsFun')
	.service('dataService', ['$q', dataService]);
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
//normalize income fleshing out gross and net numbers
function normalizeIncomes(incomes) {
	if(!angular.isArray(incomes))
		incomes = [incomes];

	var normalizedIncomes = [];

	angular.forEach(incomes, function(income) {
		var normIncome = {};

		normIncome.job = income.job;
		normIncome.payrate = income.payrate;
		normIncome.hours = income.hours;
		normIncome.gross = income.payrate * income.hours * 4;
		normIncome.tax = income.taxPercent;
		normIncome.net = normIncome.gross * (1 - (income.taxPercent / 100));
		normIncome.biweekly = normIncome.net / 2;

		normalizedIncomes.push(normIncome);
	})

	return normalizedIncomes;
}

//return hours based on income type
function getHours(type) {
	switch(type){
		case 'Weekly':
		case 'Bi-Weekly':
		case 'Yearly':
			return 40;
		case 'Semi-Monthly':
		case 'Monthly':
			return (40*13/12); //13 week months in 12 months based on 52 weeks/year
	}
}

//income service provides methods to add and get incomes
function incomeService($q, deploydService) {
	var incomes = [];
	var incomeTypes = [];

	
	//Gets and Saves---------------------------------
	//incomes
	var getAllIncomes = function() {
		if(incomes.length != 0){
			return $q.when(incomes);
		}
		return deploydService.getAllIncomes()
			.then(function(allIncomes) {
				incomes = normalizeIncomes(allIncomes);
				return incomes;
			});
	};

	var saveIncome = function(newIncome){
		deploydService.saveIncome(newIncome)
			.then(function(newIncome) {
				incomes.push(self.normalizeIncomes(newIncome)[0]);
			}, function(err) {
				console.log(err)
			});
	};

	//income-types
	var getAllIncomeTypes = function() {
		if(incomeTypes != 0){
			return $q.when(types);
		}
		return deploydService.getAllIncomeTypes()
			.then(function(allIncomeTypes) {
				incomeTypes = allIncomeTypes;
				return incomeTypes;
			});
	};

	var getIncomeType = function(id) {
		return deploydService.getType(id)
			.then(function(incomeType) {
				return incomeType;
			});
	};
	//End Gets and Saves-----------------------------

	//Statistics ------------------------------------
	var total = function(property) {
		if(property == 'tax') {
			return total('gross') - total('net');
		}
		else {
		if(incomes.length > 0 && isFinite(incomes[0][property]))
			return incomes.reduce(function(prev, curr) { return prev + curr[property]; }, 0);
		}
	};

	var yearlyGross = function(income) {
		return income.gross * 13; //13 week months in a year (52 weeks)
	};

	var yearlyNet = function(income) {
		return income.net * 13;
	};

	var totalYearlyGross = function() {
		return incomes.reduce(function(prev, curr) {
			return prev + yearlyGross(curr);
		}, 0);
	};

	var totalYearlyNet = function() {
		return incomes.reduce(function(prev, curr) {
			return prev + yearlyNet(curr);
		}, 0);
	};

	var totalYearlyTax = function() {
		return totalYearlyGross() - totalYearlyNet();
	};

	var calculatePayrate = function calculatePayrate(type, wage, hours){
		if(!hours)
			hours = 40;

		switch(type.name){
			case 'Weekly':
				return wage / hours; //do nothing payrate is what it is
			case 'Bi-Weekly':
				return wage / (hours * 2); //80 hours in 2 weeks
			case 'Semi-Monthly':
				return wage / (hours * 13 / 6); //86.6666 hours in a semi-month
			case 'Monthly':
				return wage / (hours * 13 / 3); //173.3333 hours in a month
			case 'Yearly':
				return wage / (hours * 52); ///2080 hours in a year
		}
	};
	//End Statistics --------------------------------

	this.getAllIncomes = getAllIncomes;
	this.saveIncome = saveIncome;

	this.getAllIncomeTypes = getAllIncomeTypes;
	this.getIncomeType = getIncomeType;

	this.yearlyGross = yearlyGross;
	this.totalYearlyGross = totalYearlyGross;
	this.yearlyNet = yearlyNet;
	this.totalYearlyNet = totalYearlyNet;
	this.totalYearlyTax = totalYearlyTax;
	this.total = total;

	this.calculatePayrate = calculatePayrate;
}

angular.module('budgettingIsFun')
	.service('incomeService', ['$q', 'deploydService', incomeService]);
function deploydService($http, $q, deployd) {
	//budgets
	var budgets = function() {
		var deferred = $q.defer();

		$http.get(deployd + '/budgets')
			.success(function(budgets) {
				deferred.resolve(budgets);
			}).error(function(err) {
				deferred.reject(err);
			});

		return deferred.promise;
	};

	var saveBudget = function(newBudget) {
		var deferred = $q.defer();

		$http.post(deployd + '/budgets', {
			name: newBudget.name,
			percentAllotment: newBudget.percent
		}).success(function(budget) {
			deferred.resolve(budget);
		}).error(function(err) {
			deferred.reject(err);
		});

		return deferred.promise;
	};

	var getBudget = function(budgetId) {
		var deferred = $q.defer();

		$http.get(deployd + '/budgets', {
			id: budgetId
		}).success(function(budget){
			deferred.resolve(budget);
		}).error(function(err) {
			deferred.reject(err);
		});

		return deferred.promise;
	};

	var budgetItems = function() {
		var deferred = $q.defer();

		$http.get(deployd + '/budget-items')
			.success(function(items) {
				deferred.resolve(items);
			}).error(function(err) {
				console.log(err);
			});

		return deferred.promise;
	};

	var saveBudgetItem = function(newBudgetItem) {
		var deferred = $q.defer();

		$http.post(deployd + '/budget-items', {
			name: newBudgetItem.name,
			amount: newBudgetItem.amount,
			budgetId: newBudgetItem.budget.id
		}).success(function(newBudgetItem) {
			deferred.resolve(newBudgetItem);
		}).error(function(err) {
			deferred.reject(err);
		});

		return deferred.promise;
	};

	//incomes
	var incomes = function() {
		var deferred = $q.defer();

		$http.get(deployd + '/income-sources')
			.success(function(incomes) {
				deferred.resolve(incomes);
			}).error(function(err) {
				deferred.reject(err);
			});

		return deferred.promise;
	};

	var saveIncome = function(newIncome) {
		var deferred = $q.defer();

		$http.post(deployd + '/income-sources', {
			job: newIncome.job,
			incomeTypeId: newIncome.incomeType.id,
			payrate: newIncome.payrate,
			hours: newIncome.hours,
			taxPercent: newIncome.taxPercent
		}).success(function(income) {
			deferred.resolve(income);
		}).error(function(err) {
			deferred.reject(err);
		});

		return deferred.promise;
	};

	//income-types
	var incomeTypes = function() {
		var deferred = $q.defer();

		$http.get(deployd + '/income-types')
			.success(function(incomeTypes) {
				deferred.resolve(incomeTypes);
			}).error(function(err) {
				deferred.reject(err);
			});

		return deferred.promise;
	}

	var incomeType = function(id) {
		var deferred = $q.defer();

		$http.get(deployd + '/income-types?id=' + id)
			.success(function(incomeType) {
				deferred.resolve(type);
			}).error(function(err) {
				console.log(err);
			});

			return deferred.promise;
	};

	this.getAllBudgets = budgets;
	this.saveBudget = saveBudget;
	this.getAllBudgetItems = budgetItems;
	this.saveBudgetItem = saveBudgetItem;
	this.getBudget = getBudget;

	this.getAllIncomes = incomes;
	this.saveIncome = saveIncome;

	this.getAllIncomeTypes = incomeTypes;
	this.getIncomeType = incomeType;
}

angular.module('budgettingIsFun')
	.constant('deployd', 'http://localhost:2403')
	.service('deploydService', ['$http', '$q', 'deployd', deploydService]);
angular.module('budgettingIsFun')
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
//projected balance service
function projectedBalanceService(incomeService, budgetService) {
	var balance = 0;

	var getBalance = function() {
		return incomeService.total('net') - budgetService.totalAll();
	};

	var coreExpenses = function(multiple) {
		return (angular.isNumber(multiple)) ? budgetService.totalCore() * multiple : budgetService.totalCore();
	};

	this.getBalance = getBalance;
	this.getCoreExpenses = coreExpenses;
}

angular.module('budgettingIsFun')
	.service('projectedBalanceService', ['incomeService', 'budgetService', projectedBalanceService]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5tb2R1bGUuanMiLCJmaWx0ZXJzL2N1c3RvbUZpbHRlcnMuanMiLCJjb21wb25lbnRzL2J1ZGdldC9idWRnZXRDb250cm9sbGVyLmpzIiwiY29tcG9uZW50cy9idWRnZXQvYnVkZ2V0U2VydmljZS5qcyIsImNvbXBvbmVudHMvZGF0YUFjY2Vzcy9kYXRhU2VydmljZS5qcyIsImNvbXBvbmVudHMvaW5jb21lL2luY29tZUNvbnRyb2xsZXIuanMiLCJjb21wb25lbnRzL2luY29tZS9pbmNvbWVTZXJ2aWNlLmpzIiwiY29tcG9uZW50cy9kZXBsb3lkL2RlcGxveWRTZXJ2aWNlLmpzIiwiY29tcG9uZW50cy9wcm9qZWN0ZWRCYWxhbmNlL3Byb2plY3RlZEJhbGFuY2VDb250cm9sbGVyLmpzIiwiY29tcG9uZW50cy9wcm9qZWN0ZWRCYWxhbmNlL3Byb2plY3RlZEJhbGFuY2VTZXJ2aWNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFFBQUEsT0FBQSxtQkFBQSxDQUFBO0VBQ0EsV0FBQSxrQkFBQSxDQUFBLFVBQUEsU0FBQSxRQUFBO0VBQ0EsT0FBQSxpQkFBQTs7O0FDRkEsUUFBQSxPQUFBLGlCQUFBO0tBQ0EsT0FBQSxVQUFBLFlBQUE7UUFDQSxPQUFBLFVBQUEsTUFBQSxjQUFBO1lBQ0EsSUFBQSxRQUFBLFFBQUEsU0FBQSxRQUFBLFNBQUEsZUFBQTtnQkFDQSxJQUFBLFVBQUE7Z0JBQ0EsSUFBQSxPQUFBO2dCQUNBLEtBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxLQUFBLFFBQUEsS0FBQTtvQkFDQSxJQUFBLE1BQUEsS0FBQSxHQUFBO29CQUNBLElBQUEsUUFBQSxZQUFBLEtBQUEsT0FBQTt3QkFDQSxLQUFBLE9BQUE7d0JBQ0EsUUFBQSxLQUFBLEtBQUE7OztnQkFHQSxRQUFBLElBQUE7Z0JBQ0EsT0FBQTttQkFDQTtnQkFDQSxPQUFBOzs7OztBQ2hCQSxRQUFBLE9BQUE7RUFDQSxXQUFBLG9CQUFBLENBQUEsaUJBQUEsaUJBQUEsU0FBQSxlQUFBLGVBQUE7RUFDQSxJQUFBLE9BQUE7OztFQUdBLEtBQUEsVUFBQTtFQUNBLEtBQUEsY0FBQTs7O0lBR0EsY0FBQTtNQUNBLEtBQUEsU0FBQSxTQUFBO01BQ0EsS0FBQSxVQUFBO01BQ0EsY0FBQTtRQUNBLEtBQUEsU0FBQSxPQUFBO1FBQ0EsS0FBQSxjQUFBO1VBQ0EsU0FBQSxLQUFBO1FBQ0EsUUFBQSxJQUFBOztRQUVBLFNBQUEsS0FBQTtNQUNBLFFBQUEsSUFBQTs7Ozs7O0VBTUEsS0FBQSxZQUFBOztFQUVBLEtBQUEsYUFBQSxTQUFBLFdBQUE7R0FDQSxjQUFBLFdBQUE7R0FDQSxLQUFBLFlBQUE7OztFQUdBLEtBQUEsZ0JBQUE7O0VBRUEsS0FBQSxpQkFBQSxTQUFBLGVBQUE7R0FDQSxjQUFBLGVBQUE7R0FDQSxLQUFBLGdCQUFBOzs7RUFHQSxLQUFBLFlBQUEsY0FBQTtFQUNBLEtBQUEsb0JBQUEsY0FBQTtFQUNBLEtBQUEsZ0JBQUEsY0FBQTtFQUNBLEtBQUEsaUJBQUEsY0FBQTtFQUNBLEtBQUEsaUJBQUEsY0FBQTtFQUNBLEtBQUEsMkJBQUEsY0FBQTtFQUNBLEtBQUEsUUFBQSxjQUFBOzs7O0FDN0NBLFNBQUEsY0FBQSxJQUFBLGdCQUFBLGVBQUE7Q0FDQSxJQUFBLFVBQUE7Q0FDQSxJQUFBLGNBQUE7Ozs7Q0FJQSxJQUFBLGdCQUFBLFdBQUE7RUFDQSxHQUFBLFFBQUEsVUFBQSxFQUFBO0dBQ0EsT0FBQSxHQUFBLEtBQUE7O0VBRUEsT0FBQSxlQUFBO0lBQ0EsS0FBQSxTQUFBLFlBQUE7SUFDQSxVQUFBO0lBQ0EsT0FBQTs7OztDQUlBLElBQUEsYUFBQSxTQUFBLFdBQUE7RUFDQSxlQUFBLFdBQUE7SUFDQSxLQUFBLFNBQUEsV0FBQTtJQUNBLFFBQUEsS0FBQTtNQUNBLFNBQUEsS0FBQTtJQUNBLFFBQUEsSUFBQTs7OztDQUlBLElBQUEsWUFBQSxTQUFBLFVBQUE7RUFDQSxlQUFBLFVBQUE7SUFDQSxLQUFBLFNBQUEsUUFBQTtJQUNBLE9BQUE7TUFDQSxTQUFBLEtBQUE7SUFDQSxRQUFBLElBQUE7SUFDQSxPQUFBOzs7OztDQUtBLElBQUEsb0JBQUEsV0FBQTtFQUNBLEdBQUEsWUFBQSxVQUFBLEVBQUE7R0FDQSxPQUFBLEdBQUEsS0FBQTs7RUFFQSxPQUFBLGVBQUE7SUFDQSxLQUFBLFNBQUEsZ0JBQUE7SUFDQSxjQUFBO0lBQ0EsT0FBQTs7OztDQUlBLElBQUEsaUJBQUEsU0FBQSxlQUFBO0VBQ0EsZUFBQSxlQUFBO0lBQ0EsS0FBQSxTQUFBLGVBQUE7SUFDQSxZQUFBLEtBQUE7TUFDQSxTQUFBLEtBQUE7SUFDQSxRQUFBLElBQUE7Ozs7OztDQU1BLElBQUEsUUFBQSxTQUFBLFFBQUE7RUFDQSxPQUFBLFlBQUEsT0FBQSxTQUFBLE1BQUEsTUFBQTtHQUNBLEdBQUEsS0FBQSxZQUFBLE9BQUE7SUFDQSxPQUFBLE9BQUEsS0FBQTtHQUNBLE9BQUE7S0FDQTs7O0NBR0EsSUFBQSxZQUFBLFdBQUE7RUFDQSxJQUFBLFlBQUE7O0VBRUEsUUFBQSxRQUFBLFNBQUEsU0FBQSxRQUFBO0dBQ0EsR0FBQSxPQUFBLFFBQUEsV0FBQSxPQUFBLFFBQUEsUUFBQTtJQUNBLElBQUEsSUFBQSxNQUFBO0lBQ0EsYUFBQTs7OztFQUlBLE9BQUE7OztDQUdBLElBQUEsV0FBQSxXQUFBO0VBQ0EsT0FBQSxZQUFBLE9BQUEsU0FBQSxNQUFBLE1BQUE7R0FDQSxPQUFBLE9BQUEsS0FBQTtLQUNBOzs7Q0FHQSxJQUFBLFlBQUEsU0FBQSxRQUFBO0VBQ0EsT0FBQSxPQUFBLG1CQUFBLE1BQUEsY0FBQSxNQUFBOzs7Q0FHQSxJQUFBLG9CQUFBLFNBQUEsUUFBQTtFQUNBLE9BQUEsTUFBQSxVQUFBLGNBQUEsTUFBQSxXQUFBOzs7Q0FHQSxJQUFBLGdCQUFBLFNBQUEsUUFBQTtFQUNBLE9BQUEsVUFBQSxVQUFBLE1BQUE7OztDQUdBLElBQUEsaUJBQUEsV0FBQTtFQUNBLE9BQUEsUUFBQSxPQUFBLFNBQUEsTUFBQSxNQUFBO0dBQ0EsT0FBQSxPQUFBLEtBQUE7S0FDQTs7O0NBR0EsSUFBQSxpQkFBQSxXQUFB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LFVBQUEsRUFBQTtHQUNBLE9BQUEsR0FBQSxLQUFBOztFQUVBLE9BQUEsZUFBQTtJQUNBLEtBQUEsU0FBQSxZQUFBO0lBQ0EsVUFBQSxpQkFBQTtJQUNBLE9BQUE7Ozs7Q0FJQSxJQUFBLGFBQUEsU0FBQSxVQUFBO0VBQ0EsZUFBQSxXQUFBO0lBQ0EsS0FBQSxTQUFBLFdBQUE7SUFDQSxRQUFBLEtBQUEsS0FBQSxpQkFBQSxXQUFBO01BQ0EsU0FBQSxLQUFBO0lBQ0EsUUFBQSxJQUFBOzs7OztDQUtBLElBQUEsb0JBQUEsV0FBQTtFQUNBLEdBQUEsZUFBQSxFQUFBO0dBQ0EsT0FBQSxHQUFBLEtBQUE7O0VBRUEsT0FBQSxlQUFBO0lBQ0EsS0FBQSxTQUFBLGdCQUFBO0lBQ0EsY0FBQTtJQUNBLE9BQUE7Ozs7Q0FJQSxJQUFBLGdCQUFBLFNBQUEsSUFBQTtFQUNBLE9BQUEsZUFBQSxRQUFBO0lBQ0EsS0FBQSxTQUFBLFlBQUE7SUFDQSxPQUFBOzs7Ozs7Q0FNQSxJQUFBLFFBQUEsU0FBQSxVQUFBO0VBQ0EsR0FBQSxZQUFBLE9BQUE7R0FDQSxPQUFBLE1BQUEsV0FBQSxNQUFBOztPQUVBO0VBQ0EsR0FBQSxRQUFBLFNBQUEsS0FBQSxTQUFBLFFBQUEsR0FBQTtHQUNBLE9BQUEsUUFBQSxPQUFBLFNBQUEsTUFBQSxNQUFBLEVBQUEsT0FBQSxPQUFBLEtBQUEsY0FBQTs7OztDQUlBLElBQUEsY0FBQSxTQUFBLFFBQUE7RUFDQSxPQUFBLE9BQUEsUUFBQTs7O0NBR0EsSUFBQSxZQUFBLFNBQUEsUUFBQTtFQUNBLE9BQUEsT0FBQSxNQUFBOzs7Q0FHQSxJQUFBLG1CQUFBLFdBQUE7RUFDQSxPQUFBLFFBQUEsT0FBQSxTQUFBLE1BQUEsTUFBQTtHQUNBLE9BQUEsT0FBQSxZQUFBO0tBQ0E7OztDQUdBLElBQUEsaUJBQUEsV0FBQTtFQUNBLE9BQUEsUUFBQSxPQUFBLFNBQUEsTUFBQSxNQUFBO0dBQ0EsT0FBQSxPQUFBLFVBQUE7S0FDQTs7O0NBR0EsSUFBQSxpQkFBQSxXQUFBO0VBQ0EsT0FBQSxxQkFBQTs7O0NBR0EsSUFBQSxtQkFBQSxTQUFBLGlCQUFBLE1BQUEsTUFBQSxNQUFBO0VBQ0EsR0FBQSxDQUFBO0dBQ0EsUUFBQTs7RUFFQSxPQUFBLEtBQUE7R0FDQSxLQUFBO0lBQ0EsT0FBQSxPQUFBO0dBQ0EsS0FBQTtJQUNBLE9BQUEsUUFBQSxRQUFBO0dBQ0EsS0FBQTtJQUNBLE9BQUEsUUFBQSxRQUFBLEtBQUE7R0FDQSxLQUFBO0lBQ0EsT0FBQSxRQUFBLFFBQUEsS0FBQTtHQUNBLEtBQUE7SUFDQSxPQUFBLFFBQUEsUUFBQTs7Ozs7Q0FLQSxLQUFBLGdCQUFBO0NBQ0EsS0FBQSxhQUFBOztDQUVBLEtBQUEsb0JBQUE7Q0FDQSxLQUFBLGdCQUFBOztDQUVBLEtBQUEsY0FBQTtDQUNBLEtBQUEsbUJBQUE7Q0FDQSxLQUFBLFlBQUE7Q0FDQSxLQUFBLGlCQUFBO0NBQ0EsS0FBQSxpQkFBQTtDQUNBLEtBQUEsUUFBQTs7Q0FFQSxLQUFBLG1CQUFBOzs7QUFHQSxRQUFBLE9BQUE7RUFDQSxRQUFBLGlCQUFBLENBQUEsTUFBQSxrQkFBQTtBQzVKQSxTQUFBLGVBQUEsT0FBQSxJQUFBLFNBQUE7O0NBRUEsSUFBQSxVQUFBLFdBQUE7RUFDQSxJQUFBLFdBQUEsR0FBQTs7RUFFQSxNQUFBLElBQUEsVUFBQTtJQUNBLFFBQUEsU0FBQSxTQUFBO0lBQ0EsU0FBQSxRQUFBO01BQ0EsTUFBQSxTQUFBLEtBQUE7SUFDQSxTQUFBLE9BQUE7OztFQUdBLE9BQUEsU0FBQTs7O0NBR0EsSUFBQSxhQUFBLFNBQUEsV0FBQTtFQUNBLElBQUEsV0FBQSxHQUFBOztFQUVBLE1BQUEsS0FBQSxVQUFBLFlBQUE7R0FDQSxNQUFBLFVBQUE7R0FDQSxrQkFBQSxVQUFBO0tBQ0EsUUFBQSxTQUFBLFFBQUE7R0FDQSxTQUFBLFFBQUE7S0FDQSxNQUFBLFNBQUEsS0FBQTtHQUNBLFNBQUEsT0FBQTs7O0VBR0EsT0FBQSxTQUFBOzs7Q0FHQSxJQUFBLFlBQUEsU0FBQSxVQUFBO0VBQ0EsSUFBQSxXQUFBLEdBQUE7O0VBRUEsTUFBQSxJQUFBLFVBQUEsWUFBQTtHQUNBLElBQUE7S0FDQSxRQUFBLFNBQUEsT0FBQTtHQUNBLFNBQUEsUUFBQTtLQUNBLE1BQUEsU0FBQSxLQUFBO0dBQ0EsU0FBQSxPQUFBOzs7RUFHQSxPQUFBLFNBQUE7OztDQUdBLElBQUEsY0FBQSxXQUFBO0VBQ0EsSUFBQSxXQUFBLEdBQUE7O0VBRUEsTUFBQSxJQUFBLFVBQUE7SUFDQSxRQUFBLFNBQUEsT0FBQTtJQUNBLFNBQUEsUUFBQTtNQUNBLE1BQUEsU0FBQSxLQUFBO0lBQ0EsUUFBQSxJQUFBOzs7RUFHQSxPQUFBLFNBQUE7OztDQUdBLElBQUEsaUJBQUEsU0FBQSxlQUFBO0VBQ0EsSUFBQSxXQUFBLEdBQUE7O0VBRUEsTUFBQSxLQUFBLFVBQUEsaUJBQUE7R0FDQSxNQUFBLGNBQUE7R0FDQSxRQUFBLGNBQUE7R0FDQSxVQUFBLGNBQUEsT0FBQTtLQUNBLFFBQUEsU0FBQSxlQUFBO0dBQ0EsU0FBQSxRQUFBO0tBQ0EsTUFBQSxTQUFBLEtBQUE7R0FDQSxTQUFBLE9BQUE7OztFQUdBLE9BQUEsU0FBQTs7OztDQUlBLElBQUEsVUFBQSxXQUFBO0VBQ0EsSUFBQSxXQUFBLEdBQUE7O0VBRUEsTUFBQSxJQUFBLFVBQUE7SUFDQSxRQUFBLFNBQUEsU0FBQTtJQUNBLFNBQUEsUUFBQTtNQUNBLE1BQUEsU0FBQSxLQUFBO0lBQ0EsU0FBQSxPQUFBOzs7RUFHQSxPQUFBLFNBQUE7OztDQUdBLElBQUEsYUFBQSxTQUFBLFdBQUE7RUFDQSxJQUFBLFdBQUEsR0FBQTs7RUFFQSxNQUFBLEtBQUEsVUFBQSxtQkFBQTtHQUNBLEtBQUEsVUFBQTtHQUNBLGNBQUEsVUFBQSxXQUFBO0dBQ0EsU0FBQSxVQUFBO0dBQ0EsT0FBQSxVQUFBO0dBQ0EsWUFBQSxVQUFBO0tBQ0EsUUFBQSxTQUFBLFFBQUE7R0FDQSxTQUFBLFFBQUE7S0FDQSxNQUFBLFNBQUEsS0FBQTtHQUNBLFNBQUEsT0FBQTs7O0VBR0EsT0FBQSxTQUFBOzs7O0NBSUEsSUFBQSxjQUFBLFdBQUE7RUFDQSxJQUFBLFdBQUEsR0FBQTs7RUFFQSxNQUFBLElBQUEsVUFBQTtJQUNBLFFBQUEsU0FBQSxhQUFBO0lBQ0EsU0FBQSxRQUFBO01BQ0EsTUFBQSxTQUFBLEtBQUE7SUFDQSxTQUFBLE9BQUE7OztFQUdBLE9BQUEsU0FBQTs7O0NBR0EsSUFBQSxhQUFBLFNBQUEsSUFBQTtFQUNBLElBQUEsV0FBQSxHQUFBOztFQUVBLE1BQUEsSUFBQSxVQUFBLHNCQUFBO0lBQ0EsUUFBQSxTQUFBLFlBQUE7SUFDQSxTQUFBLFFBQUE7TUFDQSxNQUFBLFNBQUEsS0FBQTtJQUNBLFFBQUEsSUFBQTs7O0dBR0EsT0FBQSxTQUFBOzs7Q0FHQSxLQUFBLGdCQUFBO0NBQ0EsS0FBQSxhQUFBO0NBQ0EsS0FBQSxvQkFBQTtDQUNBLEtBQUEsaUJBQUE7Q0FDQSxLQUFBLFlBQUE7O0NBRUEsS0FBQSxnQkFBQTtDQUNBLEtBQUEsYUFBQTs7Q0FFQSxLQUFBLG9CQUFBO0NBQ0EsS0FBQSxnQkFBQTs7O0FBR0EsUUFBQSxPQUFBO0VBQ0EsU0FBQSxXQUFBO0VBQ0EsUUFBQSxrQkFBQSxDQUFBLFNBQUEsTUFBQSxXQUFBO0FDbkpBLFFBQUEsT0FBQTtFQUNBLFdBQUEsOEJBQUEsQ0FBQTtFQUNBLFNBQUEseUJBQUE7R0FDQSxJQUFBLE9BQUE7OztHQUdBLEtBQUEsYUFBQSx3QkFBQTs7Ozs7R0FLQSxLQUFBLGVBQUEsd0JBQUE7Ozs7O0FDVkEsU0FBQSx3QkFBQSxlQUFBLGVBQUE7Q0FDQSxJQUFBLFVBQUE7O0NBRUEsSUFBQSxhQUFBLFdBQUE7RUFDQSxPQUFBLGNBQUEsTUFBQSxTQUFBLGNBQUE7OztDQUdBLElBQUEsZUFBQSxTQUFBLFVBQUE7RUFDQSxPQUFBLENBQUEsUUFBQSxTQUFBLGFBQUEsY0FBQSxjQUFBLFdBQUEsY0FBQTs7O0NBR0EsS0FBQSxhQUFBO0NBQ0EsS0FBQSxrQkFBQTs7O0FBR0EsUUFBQSxPQUFBO0VBQ0EsUUFBQSwyQkFBQSxDQUFBLGlCQUFBLGlCQUFBLDBCQUFBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImFuZ3VsYXIubW9kdWxlKCdidWRnZXR0aW5nSXNGdW4nLCBbJ2FuZ3VsYXIuZmlsdGVyJ10pXHJcblx0LmNvbnRyb2xsZXIoJ0Jhc2VDb250cm9sbGVyJywgWyckc2NvcGUnLCBmdW5jdGlvbigkc2NvcGUpIHtcclxuXHRcdCRzY29wZS53ZWxjb21lTWVzc2FnZSA9ICdXZWxjb21lIFNhdnkgQnVkZ2V0dGVyJztcclxuXHR9XSk7IiwiYW5ndWxhci5tb2R1bGUoXCJjdXN0b21GaWx0ZXJzXCIsIFtdKVxyXG4gICAgLmZpbHRlcihcInVuaXF1ZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChkYXRhLCBwcm9wZXJ0eU5hbWUpIHtcclxuICAgICAgICAgICAgaWYgKGFuZ3VsYXIuaXNBcnJheShkYXRhKSAmJiBhbmd1bGFyLmlzU3RyaW5nKHByb3BlcnR5TmFtZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciByZXN1bHRzID0gW107XHJcbiAgICAgICAgICAgICAgICB2YXIga2V5cyA9IHt9O1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbCA9IGRhdGFbaV1bcHJvcGVydHlOYW1lXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYW5ndWxhci5pc1VuZGVmaW5lZChrZXlzW3ZhbF0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleXNbdmFsXSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChkYXRhW2ldKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXN1bHRzKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHRzO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfSk7XHJcbiIsImFuZ3VsYXIubW9kdWxlKCdidWRnZXR0aW5nSXNGdW4nKVxyXG5cdC5jb250cm9sbGVyKCdCdWRnZXRDb250cm9sbGVyJywgWydidWRnZXRTZXJ2aWNlJywgJ2luY29tZVNlcnZpY2UnLCBmdW5jdGlvbihidWRnZXRTZXJ2aWNlLCBpbmNvbWVTZXJ2aWNlKSB7XHJcblx0XHR2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gIFx0XHQvL2luaXQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cdFx0c2VsZi5idWRnZXRzID0gW107XHJcblx0XHRzZWxmLmJ1ZGdldEl0ZW1zID0gW107XHJcbiAgXHRcdFxyXG4gIFx0XHQvL0dldCBidWRnZXRzIGFuZCBidWRnZXQgaXRlbXNcclxuICBcdFx0YnVkZ2V0U2VydmljZS5nZXRBbGxCdWRnZXRzKClcclxuICBcdFx0XHQudGhlbihmdW5jdGlvbihidWRnZXRzKSB7XHJcbiAgXHRcdFx0XHRzZWxmLmJ1ZGdldHMgPSBidWRnZXRzO1xyXG4gIFx0XHRcdFx0YnVkZ2V0U2VydmljZS5nZXRBbGxCdWRnZXRJdGVtcygpXHJcbiAgXHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uKGl0ZW1zKSB7XHJcbiAgXHRcdFx0XHRcdFx0c2VsZi5idWRnZXRJdGVtcyA9IGl0ZW1zO1xyXG4gIFx0XHRcdFx0XHR9LCBmdW5jdGlvbihlcnIpIHtcclxuICBcdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpO1xyXG4gIFx0XHRcdFx0XHR9KTtcclxuICBcdFx0XHR9LCBmdW5jdGlvbihlcnIpIHtcclxuICBcdFx0XHRcdGNvbnNvbGUubG9nKGVycik7XHJcbiAgXHRcdFx0fSk7XHJcblxyXG4gIFx0XHQvL2luaXQgZW5kLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICBcdFx0Ly9hY3Rpb25zLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHRcdHNlbGYubmV3QnVkZ2V0ID0ge307XHJcblxyXG5cdFx0c2VsZi5zYXZlQnVkZ2V0ID0gZnVuY3Rpb24obmV3QnVkZ2V0KSB7XHJcblx0XHRcdGJ1ZGdldFNlcnZpY2Uuc2F2ZUJ1ZGdldChuZXdCdWRnZXQpO1xyXG5cdFx0XHRzZWxmLm5ld0J1ZGdldCA9IHt9O1xyXG5cdFx0fTtcclxuXHJcblx0XHRzZWxmLm5ld0J1ZGdldEl0ZW0gPSB7fTtcclxuXHJcblx0XHRzZWxmLnNhdmVCdWRnZXRJdGVtID0gZnVuY3Rpb24obmV3QnVkZ2V0SXRlbSkge1xyXG5cdFx0XHRidWRnZXRTZXJ2aWNlLnNhdmVCdWRnZXRJdGVtKG5ld0J1ZGdldEl0ZW0pO1xyXG5cdFx0XHRzZWxmLm5ld0J1ZGdldEl0ZW0gPSB7fTtcclxuXHRcdH07XHJcblxyXG5cdFx0c2VsZi5idWRnZXRDYXAgPSBidWRnZXRTZXJ2aWNlLmJ1ZGdldENhcDtcclxuXHRcdHNlbGYuYnVkZ2V0VXRpbGl6YXRpb24gPSBidWRnZXRTZXJ2aWNlLmJ1ZGdldFV0aWxpemF0aW9uO1xyXG5cdFx0c2VsZi5idWRnZXRCYWxhbmNlID0gYnVkZ2V0U2VydmljZS5idWRnZXRCYWxhbmNlO1xyXG5cdFx0c2VsZi5ndWlkZWxpbmVUb3RhbCA9IGJ1ZGdldFNlcnZpY2UuZ3VpZGVsaW5lVG90YWw7XHJcblx0XHRzZWxmLnRheFV0aWxpemF0aW9uID0gYnVkZ2V0U2VydmljZS50YXhVdGlsaXphdGlvbjtcclxuXHRcdHNlbGYub3ZlcnZpZXdVdGlsaXphdGlvblRvdGFsID0gYnVkZ2V0U2VydmljZS5vdmVydmlld1V0aWxpemF0aW9uVG90YWw7XHJcblx0XHRzZWxmLnRvdGFsID0gYnVkZ2V0U2VydmljZS50b3RhbDtcclxuXHJcblx0XHQvL2FjdGlvbnMgZW5kLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cdH1dKTsiLCJmdW5jdGlvbiBidWRnZXRTZXJ2aWNlKCRxLCBkZXBsb3lkU2VydmljZSwgaW5jb21lU2VydmljZSkge1xyXG5cdHZhciBidWRnZXRzID0gW107XHJcblx0dmFyIGJ1ZGdldEl0ZW1zID0gW107XHJcblxyXG5cdC8vR2V0cyBhbmQgU2F2ZXMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHQvL2J1ZGdldHNcclxuXHR2YXIgZ2V0QWxsQnVkZ2V0cyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0aWYoYnVkZ2V0cy5sZW5ndGggIT0gMCl7XHJcblx0XHRcdHJldHVybiAkcS53aGVuKGJ1ZGdldHMpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGRlcGxveWRTZXJ2aWNlLmdldEFsbEJ1ZGdldHMoKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihhbGxCdWRnZXRzKSB7XHJcblx0XHRcdFx0YnVkZ2V0cyA9IGFsbEJ1ZGdldHM7XHJcblx0XHRcdFx0cmV0dXJuIGJ1ZGdldHM7XHJcblx0XHRcdH0pO1xyXG5cdH07XHJcblxyXG5cdHZhciBzYXZlQnVkZ2V0ID0gZnVuY3Rpb24obmV3QnVkZ2V0KSB7XHJcblx0XHRkZXBsb3lkU2VydmljZS5zYXZlQnVkZ2V0KG5ld0J1ZGdldClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24obmV3QnVkZ2V0KSB7XHJcblx0XHRcdFx0YnVkZ2V0cy5wdXNoKG5ld0J1ZGdldCk7XHJcblx0XHRcdH0sIGZ1bmN0aW9uKGVycikge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKGVycik7XHJcblx0XHRcdH0pO1xyXG5cdH07XHJcblxyXG5cdHZhciBnZXRCdWRnZXQgPSBmdW5jdGlvbihidWRnZXRJZCkge1xyXG5cdFx0ZGVwbG95ZFNlcnZpY2UuZ2V0QnVkZ2V0KGJ1ZGdldElkKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihidWRnZXQpIHtcclxuXHRcdFx0XHRyZXR1cm4gYnVkZ2V0O1xyXG5cdFx0XHR9LCBmdW5jdGlvbihlcnIpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpO1xyXG5cdFx0XHRcdHJldHVybiBudWxsO1xyXG5cdFx0XHR9KTtcclxuXHR9O1xyXG5cclxuXHQvL2J1ZGdldC1pdGVtc1xyXG5cdHZhciBnZXRBbGxCdWRnZXRJdGVtcyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0aWYoYnVkZ2V0SXRlbXMubGVuZ3RoICE9IDApe1xyXG5cdFx0XHRyZXR1cm4gJHEud2hlbihidWRnZXRJdGVtcyk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gZGVwbG95ZFNlcnZpY2UuZ2V0QWxsQnVkZ2V0SXRlbXMoKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihhbGxCdWRnZXRJdGVtcykge1xyXG5cdFx0XHRcdGJ1ZGdldEl0ZW1zID0gYWxsQnVkZ2V0SXRlbXM7XHJcblx0XHRcdFx0cmV0dXJuIGJ1ZGdldEl0ZW1zO1xyXG5cdFx0XHR9KTtcclxuXHR9O1xyXG5cclxuXHR2YXIgc2F2ZUJ1ZGdldEl0ZW0gPSBmdW5jdGlvbihuZXdCdWRnZXRJdGVtKSB7XHJcblx0XHRkZXBsb3lkU2VydmljZS5zYXZlQnVkZ2V0SXRlbShuZXdCdWRnZXRJdGVtKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihuZXdCdWRnZXRJdGVtKSB7XHJcblx0XHRcdFx0YnVkZ2V0SXRlbXMucHVzaChuZXdCdWRnZXRJdGVtKTtcclxuXHRcdFx0fSwgZnVuY3Rpb24oZXJyKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coZXJyKTtcclxuXHRcdFx0fSk7XHJcblx0fTtcclxuXHQvL0VuZCBHZXRzIGFuZCBTYXZlcyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5cdC8vU3RhdGlzdGljcyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHR2YXIgdG90YWwgPSBmdW5jdGlvbihidWRnZXQpIHtcclxuXHRcdHJldHVybiBidWRnZXRJdGVtcy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3Vycikge1xyXG5cdFx0XHRpZihjdXJyLmJ1ZGdldElkID09IGJ1ZGdldC5pZClcclxuXHRcdFx0XHRyZXR1cm4gcHJldiArIGN1cnIuYW1vdW50O1xyXG5cdFx0XHRyZXR1cm4gcHJldjtcclxuXHRcdH0sIDApO1xyXG5cdH07XHJcblxyXG5cdHZhciB0b3RhbENvcmUgPSBmdW5jdGlvbigpIHtcclxuXHRcdHZhciB0b3RhbENvcmUgPSAwO1xyXG5cclxuXHRcdGFuZ3VsYXIuZm9yRWFjaChidWRnZXRzLCBmdW5jdGlvbihidWRnZXQpIHtcclxuXHRcdFx0aWYoYnVkZ2V0Lm5hbWUgPT0gJ0ZpeGVkJyB8fCBidWRnZXQubmFtZSA9PSAnRmxleCcpIHtcclxuXHRcdFx0XHR2YXIgeCA9IHRvdGFsKGJ1ZGdldCk7XHJcblx0XHRcdFx0dG90YWxDb3JlICs9IHg7XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cclxuXHRcdHJldHVybiB0b3RhbENvcmU7XHJcblx0fTtcclxuXHJcblx0dmFyIHRvdGFsQWxsID0gZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4gYnVkZ2V0SXRlbXMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cnIpIHtcclxuXHRcdFx0cmV0dXJuIHByZXYgKyBjdXJyLmFtb3VudDtcclxuXHRcdH0sIDApO1xyXG5cdH07XHJcblxyXG5cdHZhciBidWRnZXRDYXAgPSBmdW5jdGlvbihidWRnZXQpIHtcclxuXHRcdHJldHVybiBidWRnZXQucGVyY2VudEFsbG90bWVudCAvIDEwMCAqIGluY29tZVNlcnZpY2UudG90YWwoJ25ldCcpO1xyXG5cdH07XHJcblxyXG5cdHZhciBidWRnZXRVdGlsaXphdGlvbiA9IGZ1bmN0aW9uKGJ1ZGdldCkge1xyXG5cdFx0cmV0dXJuIHRvdGFsKGJ1ZGdldCkgLyBpbmNvbWVTZXJ2aWNlLnRvdGFsKCdncm9zcycpICogMTAwO1xyXG5cdH07XHJcblxyXG5cdHZhciBidWRnZXRCYWxhbmNlID0gZnVuY3Rpb24oYnVkZ2V0KSB7XHJcblx0XHRyZXR1cm4gYnVkZ2V0Q2FwKGJ1ZGdldCkgLSB0b3RhbChidWRnZXQpO1xyXG5cdH07XHJcblxyXG5cdHZhciBndWlkZWxpbmVUb3RhbCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0cmV0dXJuIGJ1ZGdldHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cnIpIHtcclxuXHRcdFx0cmV0dXJuIHByZXYgKyBjdXJyLnBlcmNlbnRBbGxvdG1lbnQ7XHJcblx0XHR9LCAwKTtcclxuXHR9O1xyXG5cclxuXHR2YXIgdGF4VXRpbGl6YXRpb24gPSBmdW5jdGlvbigpIHtcclxuXHRcdHZhciBncm9zc0luY29tZSA9IGluY29tZVNlcnZpY2UudG90YWwoJ2dyb3NzJyk7XHJcblx0XHR2YXIgbmV0SW5jb21lID0gaW5jb21lU2VydmljZS50b3RhbCgnbmV0Jyk7XHJcblxyXG5cdFx0cmV0dXJuIChncm9zc0luY29tZSAtIG5ldEluY29tZSkgLyBncm9zc0luY29tZSAqIDEwMDtcclxuXHR9O1xyXG5cclxuXHR2YXIgb3ZlcnZpZXdVdGlsaXphdGlvblRvdGFsID0gZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4gYnVkZ2V0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3Vycikge1xyXG5cdFx0XHRyZXR1cm4gcHJldiArIGJ1ZGdldFV0aWxpemF0aW9uKGN1cnIpO1xyXG5cdFx0fSwgdGF4VXRpbGl6YXRpb24oKSk7XHJcblx0fTtcclxuXHQvL0VuZCBTdGF0aXN0aWNzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5cdHRoaXMuZ2V0QWxsQnVkZ2V0cyA9IGdldEFsbEJ1ZGdldHM7XHJcblx0dGhpcy5zYXZlQnVkZ2V0ID0gc2F2ZUJ1ZGdldDtcclxuXHR0aGlzLmdldEJ1ZGdldCA9IGdldEJ1ZGdldDtcclxuXHR0aGlzLmdldEFsbEJ1ZGdldEl0ZW1zID0gZ2V0QWxsQnVkZ2V0SXRlbXM7XHJcblx0dGhpcy5zYXZlQnVkZ2V0SXRlbSA9IHNhdmVCdWRnZXRJdGVtO1xyXG5cdHRoaXMudG90YWwgPSB0b3RhbDtcclxuXHR0aGlzLnRvdGFsQ29yZSA9IHRvdGFsQ29yZTtcclxuXHR0aGlzLnRvdGFsQWxsID0gdG90YWxBbGw7XHJcblxyXG5cdHRoaXMuYnVkZ2V0Q2FwID0gYnVkZ2V0Q2FwO1xyXG5cdHRoaXMuYnVkZ2V0VXRpbGl6YXRpb24gPSBidWRnZXRVdGlsaXphdGlvbjtcclxuXHR0aGlzLmJ1ZGdldEJhbGFuY2UgPSBidWRnZXRCYWxhbmNlO1xyXG5cdHRoaXMuZ3VpZGVsaW5lVG90YWwgPSBndWlkZWxpbmVUb3RhbDtcclxuXHR0aGlzLnRheFV0aWxpemF0aW9uID0gdGF4VXRpbGl6YXRpb247XHJcblx0dGhpcy5vdmVydmlld1V0aWxpemF0aW9uVG90YWwgPSBvdmVydmlld1V0aWxpemF0aW9uVG90YWw7XHJcbn1cclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdidWRnZXR0aW5nSXNGdW4nKVxyXG5cdC5zZXJ2aWNlKCdidWRnZXRTZXJ2aWNlJywgWyckcScsICdkZXBsb3lkU2VydmljZScsICdpbmNvbWVTZXJ2aWNlJywgYnVkZ2V0U2VydmljZV0pOyIsImZ1bmN0aW9uIGRhdGFTZXJ2aWNlKCRxKSB7XHJcblx0Ly9idWRnZXRzXHJcblx0dmFyIGJ1ZGdldHMgPSBmdW5jdGlvbigpIHtcclxuXHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XHJcblxyXG5cdFx0ZmlyZWJhc2UuZGF0YWJhc2UoKS5yZWYoJ2J1ZGdldHMnKVxyXG5cdFx0XHQub3JkZXJCeUNoaWxkKCd1c2VySWQnKVxyXG5cdFx0XHQuZXF1YWxUbygndGVzdDEnKVxyXG5cdFx0XHQub24oJ3ZhbHVlJywgZnVuY3Rpb24oYnVkZ2V0cykge1xyXG5cdFx0XHRcdGRlZmVycmVkLnJlc29sdmUoYnVkZ2V0cy52YWwoKSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0XHJcblx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcclxuXHR9O1xyXG5cclxuXHR0aGlzLmdldEJ1ZGdldHMgPSBidWRnZXRzO1xyXG59XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnYnVkZ2V0dGluZ0lzRnVuJylcclxuXHQuc2VydmljZSgnZGF0YVNlcnZpY2UnLCBbJyRxJywgZGF0YVNlcnZpY2VdKTsiLCJhbmd1bGFyLm1vZHVsZSgnYnVkZ2V0dGluZ0lzRnVuJylcclxuXHQuY29udHJvbGxlcignSW5jb21lQ29udHJvbGxlcicsIFsnaW5jb21lU2VydmljZScsIFxyXG5cdFx0ZnVuY3Rpb24oaW5jb21lU2VydmljZSkge1xyXG5cdFx0XHR2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG5cdFx0XHQvL2luaXQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblx0XHRcdHNlbGYuaW5jb21lcyA9IFtdO1xyXG5cdFx0XHRzZWxmLmluY29tZVR5cGVzID0gW107XHJcblxyXG5cdFx0XHQvL0dldCBpbmNvbWVzXHJcblx0XHRcdGluY29tZVNlcnZpY2UuZ2V0QWxsSW5jb21lcygpXHJcblx0XHRcdFx0LnRoZW4oZnVuY3Rpb24oaW5jb21lcykge1xyXG5cdFx0XHRcdFx0c2VsZi5pbmNvbWVzID0gaW5jb21lcztcclxuXHRcdFx0XHR9LCBmdW5jdGlvbihlcnIpIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKGVycik7XHJcblx0XHRcdFx0fSk7XHJcblxyXG5cdFx0XHQvL0dldCBpbmNvbWVUeXBlc1xyXG5cdFx0XHRpbmNvbWVTZXJ2aWNlLmdldEFsbEluY29tZVR5cGVzKClcclxuXHRcdFx0XHQudGhlbihmdW5jdGlvbihpbmNvbWVUeXBlcykge1xyXG5cdFx0XHRcdFx0c2VsZi5pbmNvbWVUeXBlcyA9IGluY29tZVR5cGVzO1xyXG5cdFx0XHRcdH0sIGZ1bmN0aW9uKGVycikge1xyXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coZXJyKTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0Ly9pbml0IGVuZC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuXHRcdFx0Ly9hY3Rpb25zLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cdFx0XHRzZWxmLm5ld0luY29tZSA9IHt9O1xyXG5cclxuXHRcdFx0c2VsZi5zYXZlSW5jb21lID0gZnVuY3Rpb24obmV3SW5jb21lKSB7XHJcblx0XHRcdFx0aW5jb21lU2VydmljZS5zYXZlSW5jb21lKG5ld0luY29tZSk7XHJcblx0XHRcdFx0c2VsZi5uZXdJbmNvbWUgPSB7fTtcclxuXHRcdFx0fTtcclxuXHJcblx0XHRcdHNlbGYucGF5SW5mbyA9IHt9O1xyXG5cdFx0XHRzZWxmLmNhbGN1bGF0ZWRQYXlyYXRlID0gMDtcclxuXHRcdFx0c2VsZi5jYWxjdWxhdGVkSG91cnMgPSAwO1xyXG5cclxuXHRcdFx0c2VsZi5jYWxjdWxhdGVQYXlyYXRlID0gZnVuY3Rpb24ocGF5SW5mbykge1xyXG5cdFx0XHRcdHNlbGYuY2FsY3VsYXRlZFBheXJhdGUgPSBpbmNvbWVTZXJ2aWNlLmNhbGN1bGF0ZVBheXJhdGUocGF5SW5mby5pbmNvbWVUeXBlLCBwYXlJbmZvLndhZ2UsIHBheUluZm8uaG91cnMpO1xyXG5cdFx0XHRcdHNlbGYuY2FsY3VsYXRlZEhvdXJzID0gKHBheUluZm8uaG91cnMpID8gcGF5SW5mby5ob3VycyA6IDQwO1xyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0c2VsZi50b3RhbFllYXJseUdyb3NzID0gaW5jb21lU2VydmljZS50b3RhbFllYXJseUdyb3NzO1xyXG5cdFx0XHRzZWxmLnRvdGFsWWVhcmx5TmV0ID0gaW5jb21lU2VydmljZS50b3RhbFllYXJseU5ldDtcclxuXHRcdFx0c2VsZi50b3RhbFllYXJseVRheCA9IGluY29tZVNlcnZpY2UudG90YWxZZWFybHlUYXg7XHJcblx0XHRcdHNlbGYudG90YWwgPSBpbmNvbWVTZXJ2aWNlLnRvdGFsO1xyXG5cdFx0XHQvL2FjdGlvbnMgZW5kLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblx0fV0pOyIsIi8vbm9ybWFsaXplIGluY29tZSBmbGVzaGluZyBvdXQgZ3Jvc3MgYW5kIG5ldCBudW1iZXJzXHJcbmZ1bmN0aW9uIG5vcm1hbGl6ZUluY29tZXMoaW5jb21lcykge1xyXG5cdGlmKCFhbmd1bGFyLmlzQXJyYXkoaW5jb21lcykpXHJcblx0XHRpbmNvbWVzID0gW2luY29tZXNdO1xyXG5cclxuXHR2YXIgbm9ybWFsaXplZEluY29tZXMgPSBbXTtcclxuXHJcblx0YW5ndWxhci5mb3JFYWNoKGluY29tZXMsIGZ1bmN0aW9uKGluY29tZSkge1xyXG5cdFx0dmFyIG5vcm1JbmNvbWUgPSB7fTtcclxuXHJcblx0XHRub3JtSW5jb21lLmpvYiA9IGluY29tZS5qb2I7XHJcblx0XHRub3JtSW5jb21lLnBheXJhdGUgPSBpbmNvbWUucGF5cmF0ZTtcclxuXHRcdG5vcm1JbmNvbWUuaG91cnMgPSBpbmNvbWUuaG91cnM7XHJcblx0XHRub3JtSW5jb21lLmdyb3NzID0gaW5jb21lLnBheXJhdGUgKiBpbmNvbWUuaG91cnMgKiA0O1xyXG5cdFx0bm9ybUluY29tZS50YXggPSBpbmNvbWUudGF4UGVyY2VudDtcclxuXHRcdG5vcm1JbmNvbWUubmV0ID0gbm9ybUluY29tZS5ncm9zcyAqICgxIC0gKGluY29tZS50YXhQZXJjZW50IC8gMTAwKSk7XHJcblx0XHRub3JtSW5jb21lLmJpd2Vla2x5ID0gbm9ybUluY29tZS5uZXQgLyAyO1xyXG5cclxuXHRcdG5vcm1hbGl6ZWRJbmNvbWVzLnB1c2gobm9ybUluY29tZSk7XHJcblx0fSlcclxuXHJcblx0cmV0dXJuIG5vcm1hbGl6ZWRJbmNvbWVzO1xyXG59XHJcblxyXG4vL3JldHVybiBob3VycyBiYXNlZCBvbiBpbmNvbWUgdHlwZVxyXG5mdW5jdGlvbiBnZXRIb3Vycyh0eXBlKSB7XHJcblx0c3dpdGNoKHR5cGUpe1xyXG5cdFx0Y2FzZSAnV2Vla2x5JzpcclxuXHRcdGNhc2UgJ0JpLVdlZWtseSc6XHJcblx0XHRjYXNlICdZZWFybHknOlxyXG5cdFx0XHRyZXR1cm4gNDA7XHJcblx0XHRjYXNlICdTZW1pLU1vbnRobHknOlxyXG5cdFx0Y2FzZSAnTW9udGhseSc6XHJcblx0XHRcdHJldHVybiAoNDAqMTMvMTIpOyAvLzEzIHdlZWsgbW9udGhzIGluIDEyIG1vbnRocyBiYXNlZCBvbiA1MiB3ZWVrcy95ZWFyXHJcblx0fVxyXG59XHJcblxyXG4vL2luY29tZSBzZXJ2aWNlIHByb3ZpZGVzIG1ldGhvZHMgdG8gYWRkIGFuZCBnZXQgaW5jb21lc1xyXG5mdW5jdGlvbiBpbmNvbWVTZXJ2aWNlKCRxLCBkZXBsb3lkU2VydmljZSkge1xyXG5cdHZhciBpbmNvbWVzID0gW107XHJcblx0dmFyIGluY29tZVR5cGVzID0gW107XHJcblxyXG5cdFxyXG5cdC8vR2V0cyBhbmQgU2F2ZXMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHQvL2luY29tZXNcclxuXHR2YXIgZ2V0QWxsSW5jb21lcyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0aWYoaW5jb21lcy5sZW5ndGggIT0gMCl7XHJcblx0XHRcdHJldHVybiAkcS53aGVuKGluY29tZXMpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGRlcGxveWRTZXJ2aWNlLmdldEFsbEluY29tZXMoKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihhbGxJbmNvbWVzKSB7XHJcblx0XHRcdFx0aW5jb21lcyA9IG5vcm1hbGl6ZUluY29tZXMoYWxsSW5jb21lcyk7XHJcblx0XHRcdFx0cmV0dXJuIGluY29tZXM7XHJcblx0XHRcdH0pO1xyXG5cdH07XHJcblxyXG5cdHZhciBzYXZlSW5jb21lID0gZnVuY3Rpb24obmV3SW5jb21lKXtcclxuXHRcdGRlcGxveWRTZXJ2aWNlLnNhdmVJbmNvbWUobmV3SW5jb21lKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihuZXdJbmNvbWUpIHtcclxuXHRcdFx0XHRpbmNvbWVzLnB1c2goc2VsZi5ub3JtYWxpemVJbmNvbWVzKG5ld0luY29tZSlbMF0pO1xyXG5cdFx0XHR9LCBmdW5jdGlvbihlcnIpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpXHJcblx0XHRcdH0pO1xyXG5cdH07XHJcblxyXG5cdC8vaW5jb21lLXR5cGVzXHJcblx0dmFyIGdldEFsbEluY29tZVR5cGVzID0gZnVuY3Rpb24oKSB7XHJcblx0XHRpZihpbmNvbWVUeXBlcyAhPSAwKXtcclxuXHRcdFx0cmV0dXJuICRxLndoZW4odHlwZXMpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGRlcGxveWRTZXJ2aWNlLmdldEFsbEluY29tZVR5cGVzKClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oYWxsSW5jb21lVHlwZXMpIHtcclxuXHRcdFx0XHRpbmNvbWVUeXBlcyA9IGFsbEluY29tZVR5cGVzO1xyXG5cdFx0XHRcdHJldHVybiBpbmNvbWVUeXBlcztcclxuXHRcdFx0fSk7XHJcblx0fTtcclxuXHJcblx0dmFyIGdldEluY29tZVR5cGUgPSBmdW5jdGlvbihpZCkge1xyXG5cdFx0cmV0dXJuIGRlcGxveWRTZXJ2aWNlLmdldFR5cGUoaWQpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKGluY29tZVR5cGUpIHtcclxuXHRcdFx0XHRyZXR1cm4gaW5jb21lVHlwZTtcclxuXHRcdFx0fSk7XHJcblx0fTtcclxuXHQvL0VuZCBHZXRzIGFuZCBTYXZlcy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5cdC8vU3RhdGlzdGljcyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHR2YXIgdG90YWwgPSBmdW5jdGlvbihwcm9wZXJ0eSkge1xyXG5cdFx0aWYocHJvcGVydHkgPT0gJ3RheCcpIHtcclxuXHRcdFx0cmV0dXJuIHRvdGFsKCdncm9zcycpIC0gdG90YWwoJ25ldCcpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRpZihpbmNvbWVzLmxlbmd0aCA+IDAgJiYgaXNGaW5pdGUoaW5jb21lc1swXVtwcm9wZXJ0eV0pKVxyXG5cdFx0XHRyZXR1cm4gaW5jb21lcy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VycikgeyByZXR1cm4gcHJldiArIGN1cnJbcHJvcGVydHldOyB9LCAwKTtcclxuXHRcdH1cclxuXHR9O1xyXG5cclxuXHR2YXIgeWVhcmx5R3Jvc3MgPSBmdW5jdGlvbihpbmNvbWUpIHtcclxuXHRcdHJldHVybiBpbmNvbWUuZ3Jvc3MgKiAxMzsgLy8xMyB3ZWVrIG1vbnRocyBpbiBhIHllYXIgKDUyIHdlZWtzKVxyXG5cdH07XHJcblxyXG5cdHZhciB5ZWFybHlOZXQgPSBmdW5jdGlvbihpbmNvbWUpIHtcclxuXHRcdHJldHVybiBpbmNvbWUubmV0ICogMTM7XHJcblx0fTtcclxuXHJcblx0dmFyIHRvdGFsWWVhcmx5R3Jvc3MgPSBmdW5jdGlvbigpIHtcclxuXHRcdHJldHVybiBpbmNvbWVzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXJyKSB7XHJcblx0XHRcdHJldHVybiBwcmV2ICsgeWVhcmx5R3Jvc3MoY3Vycik7XHJcblx0XHR9LCAwKTtcclxuXHR9O1xyXG5cclxuXHR2YXIgdG90YWxZZWFybHlOZXQgPSBmdW5jdGlvbigpIHtcclxuXHRcdHJldHVybiBpbmNvbWVzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXJyKSB7XHJcblx0XHRcdHJldHVybiBwcmV2ICsgeWVhcmx5TmV0KGN1cnIpO1xyXG5cdFx0fSwgMCk7XHJcblx0fTtcclxuXHJcblx0dmFyIHRvdGFsWWVhcmx5VGF4ID0gZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4gdG90YWxZZWFybHlHcm9zcygpIC0gdG90YWxZZWFybHlOZXQoKTtcclxuXHR9O1xyXG5cclxuXHR2YXIgY2FsY3VsYXRlUGF5cmF0ZSA9IGZ1bmN0aW9uIGNhbGN1bGF0ZVBheXJhdGUodHlwZSwgd2FnZSwgaG91cnMpe1xyXG5cdFx0aWYoIWhvdXJzKVxyXG5cdFx0XHRob3VycyA9IDQwO1xyXG5cclxuXHRcdHN3aXRjaCh0eXBlLm5hbWUpe1xyXG5cdFx0XHRjYXNlICdXZWVrbHknOlxyXG5cdFx0XHRcdHJldHVybiB3YWdlIC8gaG91cnM7IC8vZG8gbm90aGluZyBwYXlyYXRlIGlzIHdoYXQgaXQgaXNcclxuXHRcdFx0Y2FzZSAnQmktV2Vla2x5JzpcclxuXHRcdFx0XHRyZXR1cm4gd2FnZSAvIChob3VycyAqIDIpOyAvLzgwIGhvdXJzIGluIDIgd2Vla3NcclxuXHRcdFx0Y2FzZSAnU2VtaS1Nb250aGx5JzpcclxuXHRcdFx0XHRyZXR1cm4gd2FnZSAvIChob3VycyAqIDEzIC8gNik7IC8vODYuNjY2NiBob3VycyBpbiBhIHNlbWktbW9udGhcclxuXHRcdFx0Y2FzZSAnTW9udGhseSc6XHJcblx0XHRcdFx0cmV0dXJuIHdhZ2UgLyAoaG91cnMgKiAxMyAvIDMpOyAvLzE3My4zMzMzIGhvdXJzIGluIGEgbW9udGhcclxuXHRcdFx0Y2FzZSAnWWVhcmx5JzpcclxuXHRcdFx0XHRyZXR1cm4gd2FnZSAvIChob3VycyAqIDUyKTsgLy8vMjA4MCBob3VycyBpbiBhIHllYXJcclxuXHRcdH1cclxuXHR9O1xyXG5cdC8vRW5kIFN0YXRpc3RpY3MgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcblx0dGhpcy5nZXRBbGxJbmNvbWVzID0gZ2V0QWxsSW5jb21lcztcclxuXHR0aGlzLnNhdmVJbmNvbWUgPSBzYXZlSW5jb21lO1xyXG5cclxuXHR0aGlzLmdldEFsbEluY29tZVR5cGVzID0gZ2V0QWxsSW5jb21lVHlwZXM7XHJcblx0dGhpcy5nZXRJbmNvbWVUeXBlID0gZ2V0SW5jb21lVHlwZTtcclxuXHJcblx0dGhpcy55ZWFybHlHcm9zcyA9IHllYXJseUdyb3NzO1xyXG5cdHRoaXMudG90YWxZZWFybHlHcm9zcyA9IHRvdGFsWWVhcmx5R3Jvc3M7XHJcblx0dGhpcy55ZWFybHlOZXQgPSB5ZWFybHlOZXQ7XHJcblx0dGhpcy50b3RhbFllYXJseU5ldCA9IHRvdGFsWWVhcmx5TmV0O1xyXG5cdHRoaXMudG90YWxZZWFybHlUYXggPSB0b3RhbFllYXJseVRheDtcclxuXHR0aGlzLnRvdGFsID0gdG90YWw7XHJcblxyXG5cdHRoaXMuY2FsY3VsYXRlUGF5cmF0ZSA9IGNhbGN1bGF0ZVBheXJhdGU7XHJcbn1cclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdidWRnZXR0aW5nSXNGdW4nKVxyXG5cdC5zZXJ2aWNlKCdpbmNvbWVTZXJ2aWNlJywgWyckcScsICdkZXBsb3lkU2VydmljZScsIGluY29tZVNlcnZpY2VdKTsiLCJmdW5jdGlvbiBkZXBsb3lkU2VydmljZSgkaHR0cCwgJHEsIGRlcGxveWQpIHtcclxuXHQvL2J1ZGdldHNcclxuXHR2YXIgYnVkZ2V0cyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuXHJcblx0XHQkaHR0cC5nZXQoZGVwbG95ZCArICcvYnVkZ2V0cycpXHJcblx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKGJ1ZGdldHMpIHtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKGJ1ZGdldHMpO1xyXG5cdFx0XHR9KS5lcnJvcihmdW5jdGlvbihlcnIpIHtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZWplY3QoZXJyKTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2U7XHJcblx0fTtcclxuXHJcblx0dmFyIHNhdmVCdWRnZXQgPSBmdW5jdGlvbihuZXdCdWRnZXQpIHtcclxuXHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XHJcblxyXG5cdFx0JGh0dHAucG9zdChkZXBsb3lkICsgJy9idWRnZXRzJywge1xyXG5cdFx0XHRuYW1lOiBuZXdCdWRnZXQubmFtZSxcclxuXHRcdFx0cGVyY2VudEFsbG90bWVudDogbmV3QnVkZ2V0LnBlcmNlbnRcclxuXHRcdH0pLnN1Y2Nlc3MoZnVuY3Rpb24oYnVkZ2V0KSB7XHJcblx0XHRcdGRlZmVycmVkLnJlc29sdmUoYnVkZ2V0KTtcclxuXHRcdH0pLmVycm9yKGZ1bmN0aW9uKGVycikge1xyXG5cdFx0XHRkZWZlcnJlZC5yZWplY3QoZXJyKTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xyXG5cdH07XHJcblxyXG5cdHZhciBnZXRCdWRnZXQgPSBmdW5jdGlvbihidWRnZXRJZCkge1xyXG5cdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuXHJcblx0XHQkaHR0cC5nZXQoZGVwbG95ZCArICcvYnVkZ2V0cycsIHtcclxuXHRcdFx0aWQ6IGJ1ZGdldElkXHJcblx0XHR9KS5zdWNjZXNzKGZ1bmN0aW9uKGJ1ZGdldCl7XHJcblx0XHRcdGRlZmVycmVkLnJlc29sdmUoYnVkZ2V0KTtcclxuXHRcdH0pLmVycm9yKGZ1bmN0aW9uKGVycikge1xyXG5cdFx0XHRkZWZlcnJlZC5yZWplY3QoZXJyKTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xyXG5cdH07XHJcblxyXG5cdHZhciBidWRnZXRJdGVtcyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuXHJcblx0XHQkaHR0cC5nZXQoZGVwbG95ZCArICcvYnVkZ2V0LWl0ZW1zJylcclxuXHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24oaXRlbXMpIHtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKGl0ZW1zKTtcclxuXHRcdFx0fSkuZXJyb3IoZnVuY3Rpb24oZXJyKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coZXJyKTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2U7XHJcblx0fTtcclxuXHJcblx0dmFyIHNhdmVCdWRnZXRJdGVtID0gZnVuY3Rpb24obmV3QnVkZ2V0SXRlbSkge1xyXG5cdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuXHJcblx0XHQkaHR0cC5wb3N0KGRlcGxveWQgKyAnL2J1ZGdldC1pdGVtcycsIHtcclxuXHRcdFx0bmFtZTogbmV3QnVkZ2V0SXRlbS5uYW1lLFxyXG5cdFx0XHRhbW91bnQ6IG5ld0J1ZGdldEl0ZW0uYW1vdW50LFxyXG5cdFx0XHRidWRnZXRJZDogbmV3QnVkZ2V0SXRlbS5idWRnZXQuaWRcclxuXHRcdH0pLnN1Y2Nlc3MoZnVuY3Rpb24obmV3QnVkZ2V0SXRlbSkge1xyXG5cdFx0XHRkZWZlcnJlZC5yZXNvbHZlKG5ld0J1ZGdldEl0ZW0pO1xyXG5cdFx0fSkuZXJyb3IoZnVuY3Rpb24oZXJyKSB7XHJcblx0XHRcdGRlZmVycmVkLnJlamVjdChlcnIpO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2U7XHJcblx0fTtcclxuXHJcblx0Ly9pbmNvbWVzXHJcblx0dmFyIGluY29tZXMgPSBmdW5jdGlvbigpIHtcclxuXHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XHJcblxyXG5cdFx0JGh0dHAuZ2V0KGRlcGxveWQgKyAnL2luY29tZS1zb3VyY2VzJylcclxuXHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24oaW5jb21lcykge1xyXG5cdFx0XHRcdGRlZmVycmVkLnJlc29sdmUoaW5jb21lcyk7XHJcblx0XHRcdH0pLmVycm9yKGZ1bmN0aW9uKGVycikge1xyXG5cdFx0XHRcdGRlZmVycmVkLnJlamVjdChlcnIpO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcclxuXHR9O1xyXG5cclxuXHR2YXIgc2F2ZUluY29tZSA9IGZ1bmN0aW9uKG5ld0luY29tZSkge1xyXG5cdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuXHJcblx0XHQkaHR0cC5wb3N0KGRlcGxveWQgKyAnL2luY29tZS1zb3VyY2VzJywge1xyXG5cdFx0XHRqb2I6IG5ld0luY29tZS5qb2IsXHJcblx0XHRcdGluY29tZVR5cGVJZDogbmV3SW5jb21lLmluY29tZVR5cGUuaWQsXHJcblx0XHRcdHBheXJhdGU6IG5ld0luY29tZS5wYXlyYXRlLFxyXG5cdFx0XHRob3VyczogbmV3SW5jb21lLmhvdXJzLFxyXG5cdFx0XHR0YXhQZXJjZW50OiBuZXdJbmNvbWUudGF4UGVyY2VudFxyXG5cdFx0fSkuc3VjY2VzcyhmdW5jdGlvbihpbmNvbWUpIHtcclxuXHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShpbmNvbWUpO1xyXG5cdFx0fSkuZXJyb3IoZnVuY3Rpb24oZXJyKSB7XHJcblx0XHRcdGRlZmVycmVkLnJlamVjdChlcnIpO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2U7XHJcblx0fTtcclxuXHJcblx0Ly9pbmNvbWUtdHlwZXNcclxuXHR2YXIgaW5jb21lVHlwZXMgPSBmdW5jdGlvbigpIHtcclxuXHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XHJcblxyXG5cdFx0JGh0dHAuZ2V0KGRlcGxveWQgKyAnL2luY29tZS10eXBlcycpXHJcblx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKGluY29tZVR5cGVzKSB7XHJcblx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShpbmNvbWVUeXBlcyk7XHJcblx0XHRcdH0pLmVycm9yKGZ1bmN0aW9uKGVycikge1xyXG5cdFx0XHRcdGRlZmVycmVkLnJlamVjdChlcnIpO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcclxuXHR9XHJcblxyXG5cdHZhciBpbmNvbWVUeXBlID0gZnVuY3Rpb24oaWQpIHtcclxuXHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XHJcblxyXG5cdFx0JGh0dHAuZ2V0KGRlcGxveWQgKyAnL2luY29tZS10eXBlcz9pZD0nICsgaWQpXHJcblx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKGluY29tZVR5cGUpIHtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKHR5cGUpO1xyXG5cdFx0XHR9KS5lcnJvcihmdW5jdGlvbihlcnIpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xyXG5cdH07XHJcblxyXG5cdHRoaXMuZ2V0QWxsQnVkZ2V0cyA9IGJ1ZGdldHM7XHJcblx0dGhpcy5zYXZlQnVkZ2V0ID0gc2F2ZUJ1ZGdldDtcclxuXHR0aGlzLmdldEFsbEJ1ZGdldEl0ZW1zID0gYnVkZ2V0SXRlbXM7XHJcblx0dGhpcy5zYXZlQnVkZ2V0SXRlbSA9IHNhdmVCdWRnZXRJdGVtO1xyXG5cdHRoaXMuZ2V0QnVkZ2V0ID0gZ2V0QnVkZ2V0O1xyXG5cclxuXHR0aGlzLmdldEFsbEluY29tZXMgPSBpbmNvbWVzO1xyXG5cdHRoaXMuc2F2ZUluY29tZSA9IHNhdmVJbmNvbWU7XHJcblxyXG5cdHRoaXMuZ2V0QWxsSW5jb21lVHlwZXMgPSBpbmNvbWVUeXBlcztcclxuXHR0aGlzLmdldEluY29tZVR5cGUgPSBpbmNvbWVUeXBlO1xyXG59XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnYnVkZ2V0dGluZ0lzRnVuJylcclxuXHQuY29uc3RhbnQoJ2RlcGxveWQnLCAnaHR0cDovL2xvY2FsaG9zdDoyNDAzJylcclxuXHQuc2VydmljZSgnZGVwbG95ZFNlcnZpY2UnLCBbJyRodHRwJywgJyRxJywgJ2RlcGxveWQnLCBkZXBsb3lkU2VydmljZV0pOyIsImFuZ3VsYXIubW9kdWxlKCdidWRnZXR0aW5nSXNGdW4nKVxyXG5cdC5jb250cm9sbGVyKCdQcm9qZWN0ZWRCYWxhbmNlQ29udHJvbGxlcicsIFsncHJvamVjdGVkQmFsYW5jZVNlcnZpY2UnLCBcclxuXHRcdGZ1bmN0aW9uKHByb2plY3RlZEJhbGFuY2VTZXJ2aWNlKSB7XHJcblx0XHRcdHZhciBzZWxmID0gdGhpczsgXHJcblxyXG5cdFx0XHQvL2luaXQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblx0XHRcdHNlbGYuZ2V0QmFsYW5jZSA9IHByb2plY3RlZEJhbGFuY2VTZXJ2aWNlLmdldEJhbGFuY2U7XHJcblxyXG5cdFx0XHQvL2luaXQgZW5kLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5cdFx0XHQvL2FjdGlvbnMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblx0XHRcdHNlbGYuY29yZUV4cGVuc2VzID0gcHJvamVjdGVkQmFsYW5jZVNlcnZpY2UuZ2V0Q29yZUV4cGVuc2VzO1xyXG5cclxuXHRcdFx0Ly9hY3Rpb25zIGVuZC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cdH1dKTsiLCIvL3Byb2plY3RlZCBiYWxhbmNlIHNlcnZpY2VcclxuZnVuY3Rpb24gcHJvamVjdGVkQmFsYW5jZVNlcnZpY2UoaW5jb21lU2VydmljZSwgYnVkZ2V0U2VydmljZSkge1xyXG5cdHZhciBiYWxhbmNlID0gMDtcclxuXHJcblx0dmFyIGdldEJhbGFuY2UgPSBmdW5jdGlvbigpIHtcclxuXHRcdHJldHVybiBpbmNvbWVTZXJ2aWNlLnRvdGFsKCduZXQnKSAtIGJ1ZGdldFNlcnZpY2UudG90YWxBbGwoKTtcclxuXHR9O1xyXG5cclxuXHR2YXIgY29yZUV4cGVuc2VzID0gZnVuY3Rpb24obXVsdGlwbGUpIHtcclxuXHRcdHJldHVybiAoYW5ndWxhci5pc051bWJlcihtdWx0aXBsZSkpID8gYnVkZ2V0U2VydmljZS50b3RhbENvcmUoKSAqIG11bHRpcGxlIDogYnVkZ2V0U2VydmljZS50b3RhbENvcmUoKTtcclxuXHR9O1xyXG5cclxuXHR0aGlzLmdldEJhbGFuY2UgPSBnZXRCYWxhbmNlO1xyXG5cdHRoaXMuZ2V0Q29yZUV4cGVuc2VzID0gY29yZUV4cGVuc2VzO1xyXG59XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnYnVkZ2V0dGluZ0lzRnVuJylcclxuXHQuc2VydmljZSgncHJvamVjdGVkQmFsYW5jZVNlcnZpY2UnLCBbJ2luY29tZVNlcnZpY2UnLCAnYnVkZ2V0U2VydmljZScsIHByb2plY3RlZEJhbGFuY2VTZXJ2aWNlXSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
