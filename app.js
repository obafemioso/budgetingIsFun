angular.module('budgetingIsFun', ['angular.filter', 'firebase'])
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

angular.module('budgetingIsFun')
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
function budgetService($q, deploydService, incomeService, dataService) {
	var budgets = [];
	var budgetItems = [];

	//Gets and Saves---------------------------------
	//budgets
	var getAllBudgets = function() {
		if(budgets.length != 0){
			return $q.when(budgets);
		}
		return dataService.getBudgets()
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

angular.module('budgetingIsFun')
	.service('budgetService', ['$q', 'deploydService', 'incomeService', 'dataService', budgetService]);
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

angular.module('budgetingIsFun')
	.constant('deployd', 'http://localhost:2403')
	.service('deploydService', ['$http', '$q', 'deployd', deploydService]);
/* Firebase 3.0.3 Implementation */

function dataService($q, $firebaseAuth) {
	var config = {
      apiKey: "AIzaSyCOqxyqJWHbVXQoRe5yeDDckDFaezCWGFQ",
      authDomain: "project-5329216778150346102.firebaseapp.com",
      databaseURL: "https://project-5329216778150346102.firebaseio.com",
      storageBucket: "",
    };
    firebase.initializeApp(config);

	var ref = firebase.auth();
	var deferred = $q.defer();

	//Auth
	var auth = $firebaseAuth(ref);
	console.log(auth);
	this.currentUser = null;

	var createUser = function(email, password) {
		auth.$createUserWithEmailAndPassword(email, password)
			.then(function(userData) {
				console.log("Created user: ", userData.email);
			}).catch(function(error) {
				var errorCode = error.code;
				var errorMessage = error.message;

				//Log Error
				console.log(error);
			});
	};

	var login = function(email, password) {
		auth.$signInWithEmailAndPassword(email, password)
			.then(function(authData) {
				console.log("Logged in as: " + authData.uid);
			}).catch(function(error) {
				var errorCode = error.code;
				var errorMessage = error.message;

				//Log Error
				console.log(error);
			});
	};

	var signOut = function() {
		console.log('attempting sign out');
		auth.$signOut();

	};

	var getCurrentUser = function() {
		return deferred.promise;
	};

	auth.$onAuthStateChanged(function(authData) {
		console.log('state changed');
		if(authData) {
			console.log(authData);
			deferred.resolve(authData);
		} else {
			deferred.reject('Not authenticated');
		}
	});

	//Data
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

	//Auth
	this.createUser = createUser;
	this.login = login;
	this.signOut = signOut;
	this.getCurrentUser = getCurrentUser;

	//Data
	this.getBudgets = budgets;
}

angular.module('budgetingIsFun')
	.service('dataService', ['$q', '$firebaseAuth', dataService]);
angular.module('budgetingIsFun')
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

angular.module('budgetingIsFun')
	.service('incomeService', ['$q', 'deploydService', incomeService]);
angular.module('budgetingIsFun')
	.controller('LoginController', ['loginService', function(loginService) {
		var self = this;

		self.currentUser = null;

		loginService.getCurrentUser()
			.then(function(user) {
				self.currentUser = user;
			}, function(err) {
				console.log(err);
				self.currentUser = null;
			});

		self.createUser = loginService.createUser;
		self.login = loginService.login;
		self.signOut = loginService.signOut;
	}]);
function loginService($q, dataService) {
	/*Templates

		user
		{
			email : string,
			password : string
		}
	*/
	var currentUser = null;

	var createUser = function(newUser) {
		dataService.createUser(newUser.email, newUser.password);
	};

	var login = function(user) {
		console.log('attempting login');
		console.log(user);
		dataService.login(user.email, user.password);
	};

	var signOut = function() {
		dataService.signOut();
	};

	var getCurrentUser = function() {
		return dataService.getCurrentUser()
			.then(function(user) {
				currentUser = user;
				return  currentUser;
			})
			.catch(function(error) {
				console.log(error);
				currentUser = null;
				return currentUser;
			});
	};

	this.createUser = createUser;
	this.login = login;
	this.signOut = signOut;
	this.getCurrentUser = getCurrentUser;
}

angular.module('budgetingIsFun')
	.service('loginService', ['$q', 'dataService', loginService]);
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
//projected balance service
function projectedBalanceService(incomeService, budgetService) {
	var balance = 0;

	var getBalance = function() {
		return incomeService.total('net') - budgetService.totalAll();
	};

	var coreExpenses = function(multiple) {
	};

	this.getBalance = getBalance;
	this.getCoreExpenses = coreExpenses;
}

angular.module('budgetingIsFun')
	.service('projectedBalanceService', ['incomeService', 'budgetService', projectedBalanceService]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5tb2R1bGUuanMiLCJmaWx0ZXJzL2N1c3RvbUZpbHRlcnMuanMiLCJjb21wb25lbnRzL2J1ZGdldC9idWRnZXRDb250cm9sbGVyLmpzIiwiY29tcG9uZW50cy9idWRnZXQvYnVkZ2V0U2VydmljZS5qcyIsImNvbXBvbmVudHMvZGVwbG95ZC9kZXBsb3lkU2VydmljZS5qcyIsImNvbXBvbmVudHMvZGF0YUFjY2Vzcy9kYXRhU2VydmljZS5qcyIsImNvbXBvbmVudHMvaW5jb21lL2luY29tZUNvbnRyb2xsZXIuanMiLCJjb21wb25lbnRzL2luY29tZS9pbmNvbWVTZXJ2aWNlLmpzIiwiY29tcG9uZW50cy9sb2dpbi9sb2dpbkNvbnRyb2xsZXIuanMiLCJjb21wb25lbnRzL2xvZ2luL2xvZ2luU2VydmljZS5qcyIsImNvbXBvbmVudHMvcHJvamVjdGVkQmFsYW5jZS9wcm9qZWN0ZWRCYWxhbmNlQ29udHJvbGxlci5qcyIsImNvbXBvbmVudHMvcHJvamVjdGVkQmFsYW5jZS9wcm9qZWN0ZWRCYWxhbmNlU2VydmljZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxRQUFBLE9BQUEsa0JBQUEsQ0FBQSxrQkFBQTtFQUNBLFdBQUEsa0JBQUEsQ0FBQSxVQUFBLFNBQUEsUUFBQTtFQUNBLE9BQUEsaUJBQUE7OztBQ0ZBLFFBQUEsT0FBQSxpQkFBQTtLQUNBLE9BQUEsVUFBQSxZQUFBO1FBQ0EsT0FBQSxVQUFBLE1BQUEsY0FBQTtZQUNBLElBQUEsUUFBQSxRQUFBLFNBQUEsUUFBQSxTQUFBLGVBQUE7Z0JBQ0EsSUFBQSxVQUFBO2dCQUNBLElBQUEsT0FBQTtnQkFDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsS0FBQSxRQUFBLEtBQUE7b0JBQ0EsSUFBQSxNQUFBLEtBQUEsR0FBQTtvQkFDQSxJQUFBLFFBQUEsWUFBQSxLQUFBLE9BQUE7d0JBQ0EsS0FBQSxPQUFBO3dCQUNBLFFBQUEsS0FBQSxLQUFBOzs7Z0JBR0EsUUFBQSxJQUFBO2dCQUNBLE9BQUE7bUJBQ0E7Z0JBQ0EsT0FBQTs7Ozs7QUNoQkEsUUFBQSxPQUFBO0VBQ0EsV0FBQSxvQkFBQSxDQUFBLGlCQUFBLGlCQUFBLFNBQUEsZUFBQSxlQUFBO0VBQ0EsSUFBQSxPQUFBOzs7RUFHQSxLQUFBLFVBQUE7RUFDQSxLQUFBLGNBQUE7OztJQUdBLGNBQUE7TUFDQSxLQUFBLFNBQUEsU0FBQTtNQUNBLEtBQUEsVUFBQTtNQUNBLGNBQUE7UUFDQSxLQUFBLFNBQUEsT0FBQTtRQUNBLEtBQUEsY0FBQTtVQUNBLFNBQUEsS0FBQTtRQUNBLFFBQUEsSUFBQTs7UUFFQSxTQUFBLEtBQUE7TUFDQSxRQUFBLElBQUE7Ozs7OztFQU1BLEtBQUEsWUFBQTs7RUFFQSxLQUFBLGFBQUEsU0FBQSxXQUFBO0dBQ0EsY0FBQSxXQUFBO0dBQ0EsS0FBQSxZQUFBOzs7RUFHQSxLQUFBLGdCQUFBOztFQUVBLEtBQUEsaUJBQUEsU0FBQSxlQUFBO0dBQ0EsY0FBQSxlQUFBO0dBQ0EsS0FBQSxnQkFBQTs7O0VBR0EsS0FBQSxZQUFBLGNBQUE7RUFDQSxLQUFBLG9CQUFBLGNBQUE7RUFDQSxLQUFBLGdCQUFBLGNBQUE7RUFDQSxLQUFBLGlCQUFBLGNBQUE7RUFDQSxLQUFBLGlCQUFBLGNBQUE7RUFDQSxLQUFBLDJCQUFBLGNBQUE7RUFDQSxLQUFBLFFBQUEsY0FBQTs7OztBQzdDQSxTQUFBLGNBQUEsSUFBQSxnQkFBQSxlQUFBLGFBQUE7Q0FDQSxJQUFBLFVBQUE7Q0FDQSxJQUFBLGNBQUE7Ozs7Q0FJQSxJQUFBLGdCQUFBLFdBQUE7RUFDQSxHQUFBLFFBQUEsVUFBQSxFQUFBO0dBQ0EsT0FBQSxHQUFBLEtBQUE7O0VBRUEsT0FBQSxZQUFBO0lBQ0EsS0FBQSxTQUFBLFlBQUE7SUFDQSxVQUFBO0lBQ0EsT0FBQTs7OztDQUlBLElBQUEsYUFBQSxTQUFBLFdBQUE7RUFDQSxlQUFBLFdBQUE7SUFDQSxLQUFBLFNBQUEsV0FBQTtJQUNBLFFBQUEsS0FBQTtNQUNBLFNBQUEsS0FBQTtJQUNBLFFBQUEsSUFBQTs7OztDQUlBLElBQUEsWUFBQSxTQUFBLFVBQUE7RUFDQSxlQUFBLFVBQUE7SUFDQSxLQUFBLFNBQUEsUUFBQTtJQUNBLE9BQUE7TUFDQSxTQUFBLEtBQUE7SUFDQSxRQUFBLElBQUE7SUFDQSxPQUFBOzs7OztDQUtBLElBQUEsb0JBQUEsV0FBQTtFQUNBLEdBQUEsWUFBQSxVQUFBLEVBQUE7R0FDQSxPQUFBLEdBQUEsS0FBQTs7RUFFQSxPQUFBLGVBQUE7SUFDQSxLQUFBLFNBQUEsZ0JBQUE7SUFDQSxjQUFBO0lBQ0EsT0FBQTs7OztDQUlBLElBQUEsaUJBQUEsU0FBQSxlQUFBO0VBQ0EsZUFBQSxlQUFBO0lBQ0EsS0FBQSxTQUFBLGVBQUE7SUFDQSxZQUFBLEtBQUE7TUFDQSxTQUFBLEtBQUE7SUFDQSxRQUFBLElBQUE7Ozs7OztDQU1BLElBQUEsUUFBQSxTQUFBLFFBQUE7RUFDQSxPQUFBLFlBQUEsT0FBQSxTQUFBLE1BQUEsTUFBQTtHQUNBLEdBQUEsS0FBQSxZQUFBLE9BQUE7SUFDQSxPQUFBLE9BQUEsS0FBQTtHQUNBLE9BQUE7S0FDQTs7O0NBR0EsSUFBQSxZQUFBLFdBQUE7RUFDQSxJQUFBLFlBQUE7O0VBRUEsUUFBQSxRQUFBLFNBQUEsU0FBQSxRQUFBO0dBQ0EsR0FBQSxPQUFBLFFBQUEsV0FBQSxPQUFBLFFBQUEsUUFBQTtJQUNBLElBQUEsSUFBQSxNQUFBO0lBQ0EsYUFBQTs7OztFQUlBLE9BQUE7OztDQUdBLElBQUEsV0FBQSxXQUFBO0VBQ0EsT0FBQSxZQUFBLE9BQUEsU0FBQSxNQUFBLE1BQUE7R0FDQSxPQUFBLE9BQUEsS0FBQTtLQUNBOzs7Q0FHQSxJQUFBLFlBQUEsU0FBQSxRQUFBO0VBQ0EsT0FBQSxPQUFBLG1CQUFBLE1BQUEsY0FBQSxNQUFBOzs7Q0FHQSxJQUFBLG9CQUFBLFNBQUEsUUFBQTtFQUNBLE9BQUEsTUFBQSxVQUFBLGNBQUEsTUFBQSxXQUFBOzs7Q0FHQSxJQUFBLGdCQUFBLFNBQUEsUUFBQTtFQUNBLE9BQUEsVUFBQSxVQUFBLE1BQUE7OztDQUdBLElBQUEsaUJBQUEsV0FBQTtFQUNBLE9BQUEsUUFBQSxPQUFBLFNBQUEsTUFBQSxNQUFBO0dBQ0EsT0FBQSxPQUFBLEtBQUE7S0FDQTs7O0NBR0EsSUFBQSxpQkFBQSxXQUFBO0VBQ0EsSUFBQSxjQUFBLGNBQUEsTUFBQTtFQUNBLElBQUEsWUFBQSxjQUFBLE1BQUE7O0VBRUEsT0FBQSxDQUFBLGNBQUEsYUFBQSxjQUFBOzs7Q0FHQSxJQUFBLDJCQUFBLFdBQUE7RUFDQSxPQUFBLFFBQUEsT0FBQSxTQUFBLE1BQUEsTUFBQTtHQUNBLE9BQUEsT0FBQSxrQkFBQTtLQUNBOzs7O0NBSUEsS0FBQSxnQkFBQTtDQUNBLEtBQUEsYUFBQTtDQUNBLEtBQUEsWUFBQTtDQUNBLEtBQUEsb0JBQUE7Q0FDQSxLQUFBLGlCQUFBO0NBQ0EsS0FBQSxRQUFBO0NBQ0EsS0FBQSxZQUFBO0NBQ0EsS0FBQSxXQUFBOztDQUVBLEtBQUEsWUFBQTtDQUNBLEtBQUEsb0JBQUE7Q0FDQSxLQUFBLGdCQUFBO0NBQ0EsS0FBQSxpQkFBQTtDQUNBLEtBQUEsaUJBQUE7Q0FDQSxLQUFBLDJCQUFBOzs7QUFHQSxRQUFBLE9BQUE7RUFDQSxRQUFBLGlCQUFBLENBQUEsTUFBQSxrQkFBQSxpQkFBQSxlQUFBO0FDeElBLFNBQUEsZUFBQSxPQUFBLElBQUEsU0FBQTs7Q0FFQSxJQUFBLFVBQUEsV0FBQTtFQUNBLElBQUEsV0FBQSxHQUFBOztFQUVBLE1BQUEsSUFBQSxVQUFBO0lBQ0EsUUFBQSxTQUFBLFNBQUE7SUFDQSxTQUFBLFFBQUE7TUFDQSxNQUFBLFNBQUEsS0FBQTtJQUNBLFNBQUEsT0FBQTs7O0VBR0EsT0FBQSxTQUFBOzs7Q0FHQSxJQUFBLGFBQUEsU0FBQSxXQUFBO0VBQ0EsSUFBQSxXQUFBLEdBQUE7O0VBRUEsTUFBQSxLQUFBLFVBQUEsWUFBQTtHQUNBLE1BQUEsVUFBQTtHQUNBLGtCQUFBLFVBQUE7S0FDQSxRQUFBLFNBQUEsUUFBQTtHQUNBLFNBQUEsUUFBQTtLQUNBLE1BQUEsU0FBQSxLQUFBO0dBQ0EsU0FBQSxPQUFBOzs7RUFHQSxPQUFBLFNBQUE7OztDQUdBLElBQUEsWUFBQSxTQUFBLFVBQUE7RUFDQSxJQUFBLFdBQUEsR0FBQTs7RUFFQSxNQUFBLElBQUEsVUFBQSxZQUFBO0dBQ0EsSUFBQTtLQUNBLFFBQUEsU0FBQSxPQUFBO0dBQ0EsU0FBQSxRQUFBO0tBQ0EsTUFBQSxTQUFBLEtBQUE7R0FDQSxTQUFBLE9BQUE7OztFQUdBLE9BQUEsU0FBQTs7O0NBR0EsSUFBQSxjQUFBLFdBQUE7RUFDQSxJQUFBLFdBQUEsR0FBQTs7RUFFQSxNQUFBLElBQUEsVUFBQTtJQUNBLFFBQUEsU0FBQSxPQUFBO0lBQ0EsU0FBQSxRQUFBO01BQ0EsTUFBQSxTQUFBLEtBQUE7SUFDQSxRQUFBLElBQUE7OztFQUdBLE9BQUEsU0FBQTs7O0NBR0EsSUFBQSxpQkFBQSxTQUFBLGVBQUE7RUFDQSxJQUFBLFdBQUEsR0FBQTs7RUFFQSxNQUFBLEtBQUEsVUFBQSxpQkFBQTtHQUNBLE1BQUEsY0FBQTtHQUNBLFFBQUEsY0FBQTtHQUNBLFVBQUEsY0FBQSxPQUFBO0tBQ0EsUUFBQSxTQUFBLGVBQUE7R0FDQSxTQUFBLFFBQUE7S0FDQSxNQUFBLFNBQUEsS0FBQTtHQUNBLFNBQUEsT0FBQTs7O0VBR0EsT0FBQSxTQUFBOzs7O0NBSUEsSUFBQSxVQUFBLFdBQUE7RUFDQSxJQUFBLFdBQUEsR0FBQTs7RUFFQSxNQUFBLElBQUEsVUFBQTtJQUNBLFFBQUEsU0FBQSxTQUFBO0lBQ0EsU0FBQSxRQUFBO01BQ0EsTUFBQSxTQUFBLEtBQUE7SUFDQSxTQUFBLE9BQUE7OztFQUdBLE9BQUEsU0FBQTs7O0NBR0EsSUFBQSxhQUFBLFNBQUEsV0FBQTtFQUNBLElBQUEsV0FBQSxHQUFBOztFQUVBLE1BQUEsS0FBQSxVQUFBLG1CQUFBO0dBQ0EsS0FBQSxVQUFBO0dBQ0EsY0FBQSxVQUFBLFdBQUE7R0FDQSxTQUFBLFVBQUE7R0FDQSxPQUFBLFVBQUE7R0FDQSxZQUFBLFVBQUE7S0FDQSxRQUFBLFNBQUEsUUFBQTtHQUNBLFNBQUEsUUFBQTtLQUNBLE1BQUEsU0FBQSxLQUFBO0dBQ0EsU0FBQSxPQUFBOzs7RUFHQSxPQUFBLFNBQUE7Ozs7Q0FJQSxJQUFBLGNBQUEsV0FBQTtFQUNBLElBQUEsV0FBQSxHQUFBOztFQUVBLE1BQUEsSUFBQSxVQUFBO0lBQ0EsUUFBQSxTQUFBLGFBQUE7SUFDQSxTQUFBLFFBQUE7TUFDQSxNQUFBLFNBQUEsS0FBQTtJQUNBLFNBQUEsT0FBQTs7O0VBR0EsT0FBQSxTQUFBOzs7Q0FHQSxJQUFBLGFBQUEsU0FBQSxJQUFBO0VBQ0EsSUFBQSxXQUFBLEdBQUE7O0VBRUEsTUFBQSxJQUFBLFVBQUEsc0JBQUE7SUFDQSxRQUFBLFNBQUEsWUFBQTtJQUNBLFNBQUEsUUFBQTtNQUNBLE1BQUEsU0FBQSxLQUFBO0lBQ0EsUUFBQSxJQUFBOzs7R0FHQSxPQUFBLFNBQUE7OztDQUdBLEtBQUEsZ0JBQUE7Q0FDQSxLQUFBLGFBQUE7Q0FDQSxLQUFBLG9CQUFBO0NBQ0EsS0FBQSxpQkFBQTtDQUNBLEtBQUEsWUFBQTs7Q0FFQSxLQUFBLGdCQUFBO0NBQ0EsS0FBQSxhQUFBOztDQUVBLEtBQUEsb0JBQUE7Q0FDQSxLQUFBLGdCQUFBOzs7QUFHQSxRQUFBLE9BQUE7RUFDQSxTQUFBLFdBQUE7RUFDQSxRQUFBLGtCQUFBLENBQUEsU0FBQSxNQUFBLFdBQUE7OztBQ2pKQSxTQUFBLFlBQUEsSUFBQSxlQUFBO0NBQ0EsSUFBQSxTQUFBO01BQ0EsUUFBQTtNQUNBLFlBQUE7TUFDQSxhQUFBO01BQ0EsZUFBQTs7SUFFQSxTQUFBLGNBQUE7O0NBRUEsSUFBQSxNQUFBLFNBQUE7Q0FDQSxJQUFBLFdBQUEsR0FBQTs7O0NBR0EsSUFBQSxPQUFBLGNBQUE7Q0FDQSxRQUFBLElBQUE7Q0FDQSxLQUFBLGNBQUE7O0NBRUEsSUFBQSxhQUFBLFNBQUEsT0FBQSxVQUFBO0VBQ0EsS0FBQSxnQ0FBQSxPQUFBO0lBQ0EsS0FBQSxTQUFBLFVBQUE7SUFDQSxRQUFBLElBQUEsa0JBQUEsU0FBQTtNQUNBLE1BQUEsU0FBQSxPQUFBO0lBQ0EsSUFBQSxZQUFBLE1BQUE7SUFDQSxJQUFBLGVBQUEsTUFBQTs7O0lBR0EsUUFBQSxJQUFBOzs7O0NBSUEsSUFBQSxRQUFBLFNBQUEsT0FBQSxVQUFBO0VBQ0EsS0FBQSw0QkFBQSxPQUFBO0lBQ0EsS0FBQSxTQUFBLFVBQUE7SUFDQSxRQUFBLElBQUEsbUJBQUEsU0FBQTtNQUNBLE1BQUEsU0FBQSxPQUFBO0lBQ0EsSUFBQSxZQUFBLE1BQUE7SUFDQSxJQUFBLGVBQUEsTUFBQTs7O0lBR0EsUUFBQSxJQUFBOzs7O0NBSUEsSUFBQSxVQUFBLFdBQUE7RUFDQSxRQUFBLElBQUE7RUFDQSxLQUFBOzs7O0NBSUEsSUFBQSxpQkFBQSxXQUFBO0VBQ0EsT0FBQSxTQUFBOzs7Q0FHQSxLQUFBLG9CQUFBLFNBQUEsVUFBQTtFQUNBLFFBQUEsSUFBQTtFQUNBLEdBQUEsVUFBQTtHQUNBLFFBQUEsSUFBQTtHQUNBLFNBQUEsUUFBQTtTQUNBO0dBQ0EsU0FBQSxPQUFBOzs7Ozs7Q0FNQSxJQUFBLFVBQUEsV0FBQTtFQUNBLElBQUEsV0FBQSxHQUFBOztFQUVBLFNBQUEsV0FBQSxJQUFBO0lBQ0EsYUFBQTtJQUNBLFFBQUE7SUFDQSxHQUFBLFNBQUEsU0FBQSxTQUFBO0lBQ0EsU0FBQSxRQUFBLFFBQUE7OztFQUdBLE9BQUEsU0FBQTs7OztDQUlBLEtBQUEsYUFBQTtDQUNBLEtBQUEsUUFBQTtDQUNBLEtBQUEsVUFBQTtDQUNBLEtBQUEsaUJBQUE7OztDQUdBLEtBQUEsYUFBQTs7O0FBR0EsUUFBQSxPQUFBO0VBQ0EsUUFBQSxlQUFBLENBQUEsTUFBQSxpQkFBQTtBQzNGQSxRQUFBLE9BQUE7RUFDQSxXQUFBLG9CQUFBLENBQUE7RUFDQSxTQUFBLGVBQUE7R0FDQSxJQUFBLE9BQUE7OztHQUdBLEtBQUEsVUFBQTtHQUNBLEtBQUEsY0FBQTs7O0dBR0EsY0FBQTtLQUNBLEtBQUEsU0FBQSxTQUFBO0tBQ0EsS0FBQSxVQUFBO09BQ0EsU0FBQSxLQUFBO0tBQ0EsUUFBQSxJQUFBOzs7O0dBSUEsY0FBQTtLQUNBLEtBQUEsU0FBQSxhQUFBO0tBQ0EsS0FBQSxjQUFBO09BQ0EsU0FBQSxLQUFBO0tBQ0EsUUFBQSxJQUFBOzs7OztHQUtBLEtBQUEsWUFBQTs7R0FFQSxLQUFBLGFBQUEsU0FBQSxXQUFBO0lBQ0EsY0FBQSxXQUFBO0lBQ0EsS0FBQSxZQUFBOzs7R0FHQSxLQUFBLFVBQUE7R0FDQSxLQUFBLG9CQUFBO0dBQ0EsS0FBQSxrQkFBQTs7R0FFQSxLQUFBLG1CQUFBLFNBQUEsU0FBQTtJQUNBLEtBQUEsb0JBQUEsY0FBQSxpQkFBQSxRQUFBLFlBQUEsUUFBQSxNQUFBLFFBQUE7SUFDQSxLQUFBLGtCQUFBLENBQUEsUUFBQSxTQUFBLFFBQUEsUUFBQTs7O0dBR0EsS0FBQSxtQkFBQSxjQUFBO0dBQ0EsS0FBQSxpQkFBQSxjQUFBO0dBQ0EsS0FBQSxpQkFBQSxjQUFBO0dBQ0EsS0FBQSxRQUFBLGNBQUE7Ozs7QUM3Q0EsU0FBQSxpQkFBQSxTQUFBO0NBQ0EsR0FBQSxDQUFBLFFBQUEsUUFBQTtFQUNBLFVBQUEsQ0FBQTs7Q0FFQSxJQUFBLG9CQUFBOztDQUVBLFFBQUEsUUFBQSxTQUFBLFNBQUEsUUFBQTtFQUNBLElBQUEsYUFBQTs7RUFFQSxXQUFBLE1BQUEsT0FBQTtFQUNBLFdBQUEsVUFBQSxPQUFBO0VBQ0EsV0FBQSxRQUFBLE9BQUE7RUFDQSxXQUFBLFFBQUEsT0FBQSxVQUFBLE9BQUEsUUFBQTtFQUNBLFdBQUEsTUFBQSxPQUFBO0VBQ0EsV0FBQSxNQUFBLFdBQUEsU0FBQSxLQUFBLE9BQUEsYUFBQTtFQUNBLFdBQUEsV0FBQSxXQUFBLE1BQUE7O0VBRUEsa0JBQUEsS0FBQTs7O0NBR0EsT0FBQTs7OztBQUlBLFNBQUEsU0FBQSxNQUFBO0NBQ0EsT0FBQTtFQUNBLEtBQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtHQUNBLE9BQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtHQUNBLFFBQUEsR0FBQSxHQUFBOzs7OztBQUtBLFNBQUEsY0FBQSxJQUFBLGdCQUFBO0NBQ0EsSUFBQSxVQUFBO0NBQ0EsSUFBQSxjQUFBOzs7OztDQUtBLElBQUEsZ0JBQUEsV0FBQTtFQUNBLEdBQUEsUUFBQSxVQUFBLEVBQUE7R0FDQSxPQUFBLEdBQUEsS0FBQTs7RUFFQSxPQUFBLGVBQUE7SUFDQSxLQUFBLFNBQUEsWUFBQTtJQUNBLFVBQUEsaUJBQUE7SUFDQSxPQUFBOzs7O0NBSUEsSUFBQSxhQUFBLFNBQUEsVUFBQTtFQUNBLGVBQUEsV0FBQTtJQUNBLEtBQUEsU0FBQSxXQUFBO0lBQ0EsUUFBQSxLQUFBLEtBQUEsaUJBQUEsV0FBQTtNQUNBLFNBQUEsS0FBQTtJQUNBLFFBQUEsSUFBQTs7Ozs7Q0FLQSxJQUFBLG9CQUFBLFdBQUE7RUFDQSxHQUFBLGVBQUEsRUFBQTtHQUNBLE9BQUEsR0FBQSxLQUFBOztFQUVBLE9BQUEsZUFBQTtJQUNBLEtBQUEsU0FBQSxnQkFBQTtJQUNBLGNBQUE7SUFDQSxPQUFBOzs7O0NBSUEsSUFBQSxnQkFBQSxTQUFBLElBQUE7RUFDQSxPQUFBLGVBQUEsUUFBQTtJQUNBLEtBQUEsU0FBQSxZQUFBO0lBQ0EsT0FBQTs7Ozs7O0NBTUEsSUFBQSxRQUFBLFNBQUEsVUFBQTtFQUNBLEdBQUEsWUFBQSxPQUFBO0dBQ0EsT0FBQSxNQUFBLFdBQUEsTUFBQTs7T0FFQTtFQUNBLEdBQUEsUUFBQSxTQUFBLEtBQUEsU0FBQSxRQUFBLEdBQUE7R0FDQSxPQUFBLFFBQUEsT0FBQSxTQUFBLE1BQUEsTUFBQSxFQUFBLE9BQUEsT0FBQSxLQUFBLGNBQUE7Ozs7Q0FJQSxJQUFBLGNBQUEsU0FBQSxRQUFBO0VBQ0EsT0FBQSxPQUFBLFFBQUE7OztDQUdBLElBQUEsWUFBQSxTQUFBLFFBQUE7RUFDQSxPQUFBLE9BQUEsTUFBQTs7O0NBR0EsSUFBQSxtQkFBQSxXQUFBO0VBQ0EsT0FBQSxRQUFBLE9BQUEsU0FBQSxNQUFBLE1BQUE7R0FDQSxPQUFBLE9BQUEsWUFBQTtLQUNBOzs7Q0FHQSxJQUFBLGlCQUFBLFdBQUE7RUFDQSxPQUFBLFFBQUEsT0FBQSxTQUFBLE1BQUEsTUFBQTtHQUNBLE9BQUEsT0FBQSxVQUFBO0tBQ0E7OztDQUdBLElBQUEsaUJBQUEsV0FBQTtFQUNBLE9BQUEscUJBQUE7OztDQUdBLElBQUEsbUJBQUEsU0FBQSxpQkFBQSxNQUFBLE1BQUEsTUFBQTtFQUNBLEdBQUEsQ0FBQTtHQUNBLFFBQUE7O0VBRUEsT0FBQSxLQUFBO0dBQ0EsS0FBQTtJQUNBLE9BQUEsT0FBQTtHQUNBLEtBQUE7SUFDQSxPQUFBLFFBQUEsUUFBQTtHQUNBLEtBQUE7SUFDQSxPQUFBLFFBQUEsUUFBQSxLQUFBO0dBQ0EsS0FBQTtJQUNBLE9BQUEsUUFBQSxRQUFBLEtBQUE7R0FDQSxLQUFBO0lBQ0EsT0FBQSxRQUFBLFFBQUE7Ozs7O0NBS0EsS0FBQSxnQkFBQTtDQUNBLEtBQUEsYUFBQTs7Q0FFQSxLQUFBLG9CQUFBO0NBQ0EsS0FBQSxnQkFBQTs7Q0FFQSxLQUFBLGNBQUE7Q0FDQSxLQUFBLG1CQUFBO0NBQ0EsS0FBQSxZQUFBO0NBQ0EsS0FBQSxpQkFBQTtDQUNBLEtBQUEsaUJBQUE7Q0FDQSxLQUFBLFFBQUE7O0NBRUEsS0FBQSxtQkFBQTs7O0FBR0EsUUFBQSxPQUFBO0VBQ0EsUUFBQSxpQkFBQSxDQUFBLE1BQUEsa0JBQUE7QUM1SkEsUUFBQSxPQUFBO0VBQ0EsV0FBQSxtQkFBQSxDQUFBLGdCQUFBLFNBQUEsY0FBQTtFQUNBLElBQUEsT0FBQTs7RUFFQSxLQUFBLGNBQUE7O0VBRUEsYUFBQTtJQUNBLEtBQUEsU0FBQSxNQUFBO0lBQ0EsS0FBQSxjQUFBO01BQ0EsU0FBQSxLQUFBO0lBQ0EsUUFBQSxJQUFBO0lBQ0EsS0FBQSxjQUFBOzs7RUFHQSxLQUFBLGFBQUEsYUFBQTtFQUNBLEtBQUEsUUFBQSxhQUFBO0VBQ0EsS0FBQSxVQUFBLGFBQUE7O0FDaEJBLFNBQUEsYUFBQSxJQUFBLGFBQUE7Ozs7Ozs7OztDQVNBLElBQUEsY0FBQTs7Q0FFQSxJQUFBLGFBQUEsU0FBQSxTQUFBO0VBQ0EsWUFBQSxXQUFBLFFBQUEsT0FBQSxRQUFBOzs7Q0FHQSxJQUFBLFFBQUEsU0FBQSxNQUFBO0VBQ0EsUUFBQSxJQUFBO0VBQ0EsUUFBQSxJQUFBO0VBQ0EsWUFBQSxNQUFBLEtBQUEsT0FBQSxLQUFBOzs7Q0FHQSxJQUFBLFVBQUEsV0FBQTtFQUNBLFlBQUE7OztDQUdBLElBQUEsaUJBQUEsV0FBQTtFQUNBLE9BQUEsWUFBQTtJQUNBLEtBQUEsU0FBQSxNQUFBO0lBQ0EsY0FBQTtJQUNBLFFBQUE7O0lBRUEsTUFBQSxTQUFBLE9BQUE7SUFDQSxRQUFBLElBQUE7SUFDQSxjQUFBO0lBQ0EsT0FBQTs7OztDQUlBLEtBQUEsYUFBQTtDQUNBLEtBQUEsUUFBQTtDQUNBLEtBQUEsVUFBQTtDQUNBLEtBQUEsaUJBQUE7OztBQUdBLFFBQUEsT0FBQTtFQUNBLFFBQUEsZ0JBQUEsQ0FBQSxNQUFBLGVBQUE7QUM3Q0EsUUFBQSxPQUFBO0VBQ0EsV0FBQSw4QkFBQSxDQUFBO0VBQ0EsU0FBQSx5QkFBQTtHQUNBLElBQUEsT0FBQTs7O0dBR0EsS0FBQSxhQUFBLHdCQUFBOzs7OztHQUtBLEtBQUEsZUFBQSx3QkFBQTs7Ozs7QUNWQSxTQUFBLHdCQUFBLGVBQUEsZUFBQTtDQUNBLElBQUEsVUFBQTs7Q0FFQSxJQUFBLGFBQUEsV0FBQTtFQUNBLE9BQUEsY0FBQSxNQUFBLFNBQUEsY0FBQTs7O0NBR0EsSUFBQSxlQUFBLFNBQUEsVUFBQTs7O0NBR0EsS0FBQSxhQUFBO0NBQ0EsS0FBQSxrQkFBQTs7O0FBR0EsUUFBQSxPQUFBO0VBQ0EsUUFBQSwyQkFBQSxDQUFBLGlCQUFBLGlCQUFBLDBCQUFBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImFuZ3VsYXIubW9kdWxlKCdidWRnZXRpbmdJc0Z1bicsIFsnYW5ndWxhci5maWx0ZXInLCAnZmlyZWJhc2UnXSlcclxuXHQuY29udHJvbGxlcignQmFzZUNvbnRyb2xsZXInLCBbJyRzY29wZScsIGZ1bmN0aW9uKCRzY29wZSkge1xyXG5cdFx0JHNjb3BlLndlbGNvbWVNZXNzYWdlID0gJ1dlbGNvbWUgU2F2eSBCdWRnZXR0ZXInO1xyXG5cdH1dKTsiLCJhbmd1bGFyLm1vZHVsZShcImN1c3RvbUZpbHRlcnNcIiwgW10pXHJcbiAgICAuZmlsdGVyKFwidW5pcXVlXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGRhdGEsIHByb3BlcnR5TmFtZSkge1xyXG4gICAgICAgICAgICBpZiAoYW5ndWxhci5pc0FycmF5KGRhdGEpICYmIGFuZ3VsYXIuaXNTdHJpbmcocHJvcGVydHlOYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcclxuICAgICAgICAgICAgICAgIHZhciBrZXlzID0ge307XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsID0gZGF0YVtpXVtwcm9wZXJ0eU5hbWVdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhbmd1bGFyLmlzVW5kZWZpbmVkKGtleXNbdmFsXSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAga2V5c1t2YWxdID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGRhdGFbaV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdHMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9KTtcclxuIiwiYW5ndWxhci5tb2R1bGUoJ2J1ZGdldGluZ0lzRnVuJylcclxuXHQuY29udHJvbGxlcignQnVkZ2V0Q29udHJvbGxlcicsIFsnYnVkZ2V0U2VydmljZScsICdpbmNvbWVTZXJ2aWNlJywgZnVuY3Rpb24oYnVkZ2V0U2VydmljZSwgaW5jb21lU2VydmljZSkge1xyXG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICBcdFx0Ly9pbml0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHRcdHNlbGYuYnVkZ2V0cyA9IFtdO1xyXG5cdFx0c2VsZi5idWRnZXRJdGVtcyA9IFtdO1xyXG4gIFx0XHRcclxuICBcdFx0Ly9HZXQgYnVkZ2V0cyBhbmQgYnVkZ2V0IGl0ZW1zXHJcbiAgXHRcdGJ1ZGdldFNlcnZpY2UuZ2V0QWxsQnVkZ2V0cygpXHJcbiAgXHRcdFx0LnRoZW4oZnVuY3Rpb24oYnVkZ2V0cykge1xyXG4gIFx0XHRcdFx0c2VsZi5idWRnZXRzID0gYnVkZ2V0cztcclxuICBcdFx0XHRcdGJ1ZGdldFNlcnZpY2UuZ2V0QWxsQnVkZ2V0SXRlbXMoKVxyXG4gIFx0XHRcdFx0XHQudGhlbihmdW5jdGlvbihpdGVtcykge1xyXG4gIFx0XHRcdFx0XHRcdHNlbGYuYnVkZ2V0SXRlbXMgPSBpdGVtcztcclxuICBcdFx0XHRcdFx0fSwgZnVuY3Rpb24oZXJyKSB7XHJcbiAgXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coZXJyKTtcclxuICBcdFx0XHRcdFx0fSk7XHJcbiAgXHRcdFx0fSwgZnVuY3Rpb24oZXJyKSB7XHJcbiAgXHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpO1xyXG4gIFx0XHRcdH0pO1xyXG5cclxuICBcdFx0Ly9pbml0IGVuZC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgXHRcdC8vYWN0aW9ucy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblx0XHRzZWxmLm5ld0J1ZGdldCA9IHt9O1xyXG5cclxuXHRcdHNlbGYuc2F2ZUJ1ZGdldCA9IGZ1bmN0aW9uKG5ld0J1ZGdldCkge1xyXG5cdFx0XHRidWRnZXRTZXJ2aWNlLnNhdmVCdWRnZXQobmV3QnVkZ2V0KTtcclxuXHRcdFx0c2VsZi5uZXdCdWRnZXQgPSB7fTtcclxuXHRcdH07XHJcblxyXG5cdFx0c2VsZi5uZXdCdWRnZXRJdGVtID0ge307XHJcblxyXG5cdFx0c2VsZi5zYXZlQnVkZ2V0SXRlbSA9IGZ1bmN0aW9uKG5ld0J1ZGdldEl0ZW0pIHtcclxuXHRcdFx0YnVkZ2V0U2VydmljZS5zYXZlQnVkZ2V0SXRlbShuZXdCdWRnZXRJdGVtKTtcclxuXHRcdFx0c2VsZi5uZXdCdWRnZXRJdGVtID0ge307XHJcblx0XHR9O1xyXG5cclxuXHRcdHNlbGYuYnVkZ2V0Q2FwID0gYnVkZ2V0U2VydmljZS5idWRnZXRDYXA7XHJcblx0XHRzZWxmLmJ1ZGdldFV0aWxpemF0aW9uID0gYnVkZ2V0U2VydmljZS5idWRnZXRVdGlsaXphdGlvbjtcclxuXHRcdHNlbGYuYnVkZ2V0QmFsYW5jZSA9IGJ1ZGdldFNlcnZpY2UuYnVkZ2V0QmFsYW5jZTtcclxuXHRcdHNlbGYuZ3VpZGVsaW5lVG90YWwgPSBidWRnZXRTZXJ2aWNlLmd1aWRlbGluZVRvdGFsO1xyXG5cdFx0c2VsZi50YXhVdGlsaXphdGlvbiA9IGJ1ZGdldFNlcnZpY2UudGF4VXRpbGl6YXRpb247XHJcblx0XHRzZWxmLm92ZXJ2aWV3VXRpbGl6YXRpb25Ub3RhbCA9IGJ1ZGdldFNlcnZpY2Uub3ZlcnZpZXdVdGlsaXphdGlvblRvdGFsO1xyXG5cdFx0c2VsZi50b3RhbCA9IGJ1ZGdldFNlcnZpY2UudG90YWw7XHJcblxyXG5cdFx0Ly9hY3Rpb25zIGVuZC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHR9XSk7IiwiZnVuY3Rpb24gYnVkZ2V0U2VydmljZSgkcSwgZGVwbG95ZFNlcnZpY2UsIGluY29tZVNlcnZpY2UsIGRhdGFTZXJ2aWNlKSB7XHJcblx0dmFyIGJ1ZGdldHMgPSBbXTtcclxuXHR2YXIgYnVkZ2V0SXRlbXMgPSBbXTtcclxuXHJcblx0Ly9HZXRzIGFuZCBTYXZlcy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cdC8vYnVkZ2V0c1xyXG5cdHZhciBnZXRBbGxCdWRnZXRzID0gZnVuY3Rpb24oKSB7XHJcblx0XHRpZihidWRnZXRzLmxlbmd0aCAhPSAwKXtcclxuXHRcdFx0cmV0dXJuICRxLndoZW4oYnVkZ2V0cyk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gZGF0YVNlcnZpY2UuZ2V0QnVkZ2V0cygpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKGFsbEJ1ZGdldHMpIHtcclxuXHRcdFx0XHRidWRnZXRzID0gYWxsQnVkZ2V0cztcclxuXHRcdFx0XHRyZXR1cm4gYnVkZ2V0cztcclxuXHRcdFx0fSk7XHJcblx0fTtcclxuXHJcblx0dmFyIHNhdmVCdWRnZXQgPSBmdW5jdGlvbihuZXdCdWRnZXQpIHtcclxuXHRcdGRlcGxveWRTZXJ2aWNlLnNhdmVCdWRnZXQobmV3QnVkZ2V0KVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihuZXdCdWRnZXQpIHtcclxuXHRcdFx0XHRidWRnZXRzLnB1c2gobmV3QnVkZ2V0KTtcclxuXHRcdFx0fSwgZnVuY3Rpb24oZXJyKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coZXJyKTtcclxuXHRcdFx0fSk7XHJcblx0fTtcclxuXHJcblx0dmFyIGdldEJ1ZGdldCA9IGZ1bmN0aW9uKGJ1ZGdldElkKSB7XHJcblx0XHRkZXBsb3lkU2VydmljZS5nZXRCdWRnZXQoYnVkZ2V0SWQpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKGJ1ZGdldCkge1xyXG5cdFx0XHRcdHJldHVybiBidWRnZXQ7XHJcblx0XHRcdH0sIGZ1bmN0aW9uKGVycikge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKGVycik7XHJcblx0XHRcdFx0cmV0dXJuIG51bGw7XHJcblx0XHRcdH0pO1xyXG5cdH07XHJcblxyXG5cdC8vYnVkZ2V0LWl0ZW1zXHJcblx0dmFyIGdldEFsbEJ1ZGdldEl0ZW1zID0gZnVuY3Rpb24oKSB7XHJcblx0XHRpZihidWRnZXRJdGVtcy5sZW5ndGggIT0gMCl7XHJcblx0XHRcdHJldHVybiAkcS53aGVuKGJ1ZGdldEl0ZW1zKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBkZXBsb3lkU2VydmljZS5nZXRBbGxCdWRnZXRJdGVtcygpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKGFsbEJ1ZGdldEl0ZW1zKSB7XHJcblx0XHRcdFx0YnVkZ2V0SXRlbXMgPSBhbGxCdWRnZXRJdGVtcztcclxuXHRcdFx0XHRyZXR1cm4gYnVkZ2V0SXRlbXM7XHJcblx0XHRcdH0pO1xyXG5cdH07XHJcblxyXG5cdHZhciBzYXZlQnVkZ2V0SXRlbSA9IGZ1bmN0aW9uKG5ld0J1ZGdldEl0ZW0pIHtcclxuXHRcdGRlcGxveWRTZXJ2aWNlLnNhdmVCdWRnZXRJdGVtKG5ld0J1ZGdldEl0ZW0pXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKG5ld0J1ZGdldEl0ZW0pIHtcclxuXHRcdFx0XHRidWRnZXRJdGVtcy5wdXNoKG5ld0J1ZGdldEl0ZW0pO1xyXG5cdFx0XHR9LCBmdW5jdGlvbihlcnIpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpO1xyXG5cdFx0XHR9KTtcclxuXHR9O1xyXG5cdC8vRW5kIEdldHMgYW5kIFNhdmVzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcblx0Ly9TdGF0aXN0aWNzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cdHZhciB0b3RhbCA9IGZ1bmN0aW9uKGJ1ZGdldCkge1xyXG5cdFx0cmV0dXJuIGJ1ZGdldEl0ZW1zLnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXJyKSB7XHJcblx0XHRcdGlmKGN1cnIuYnVkZ2V0SWQgPT0gYnVkZ2V0LmlkKVxyXG5cdFx0XHRcdHJldHVybiBwcmV2ICsgY3Vyci5hbW91bnQ7XHJcblx0XHRcdHJldHVybiBwcmV2O1xyXG5cdFx0fSwgMCk7XHJcblx0fTtcclxuXHJcblx0dmFyIHRvdGFsQ29yZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIHRvdGFsQ29yZSA9IDA7XHJcblxyXG5cdFx0YW5ndWxhci5mb3JFYWNoKGJ1ZGdldHMsIGZ1bmN0aW9uKGJ1ZGdldCkge1xyXG5cdFx0XHRpZihidWRnZXQubmFtZSA9PSAnRml4ZWQnIHx8IGJ1ZGdldC5uYW1lID09ICdGbGV4Jykge1xyXG5cdFx0XHRcdHZhciB4ID0gdG90YWwoYnVkZ2V0KTtcclxuXHRcdFx0XHR0b3RhbENvcmUgKz0geDtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblxyXG5cdFx0cmV0dXJuIHRvdGFsQ29yZTtcclxuXHR9O1xyXG5cclxuXHR2YXIgdG90YWxBbGwgPSBmdW5jdGlvbigpIHtcclxuXHRcdHJldHVybiBidWRnZXRJdGVtcy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3Vycikge1xyXG5cdFx0XHRyZXR1cm4gcHJldiArIGN1cnIuYW1vdW50O1xyXG5cdFx0fSwgMCk7XHJcblx0fTtcclxuXHJcblx0dmFyIGJ1ZGdldENhcCA9IGZ1bmN0aW9uKGJ1ZGdldCkge1xyXG5cdFx0cmV0dXJuIGJ1ZGdldC5wZXJjZW50QWxsb3RtZW50IC8gMTAwICogaW5jb21lU2VydmljZS50b3RhbCgnbmV0Jyk7XHJcblx0fTtcclxuXHJcblx0dmFyIGJ1ZGdldFV0aWxpemF0aW9uID0gZnVuY3Rpb24oYnVkZ2V0KSB7XHJcblx0XHRyZXR1cm4gdG90YWwoYnVkZ2V0KSAvIGluY29tZVNlcnZpY2UudG90YWwoJ2dyb3NzJykgKiAxMDA7XHJcblx0fTtcclxuXHJcblx0dmFyIGJ1ZGdldEJhbGFuY2UgPSBmdW5jdGlvbihidWRnZXQpIHtcclxuXHRcdHJldHVybiBidWRnZXRDYXAoYnVkZ2V0KSAtIHRvdGFsKGJ1ZGdldCk7XHJcblx0fTtcclxuXHJcblx0dmFyIGd1aWRlbGluZVRvdGFsID0gZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4gYnVkZ2V0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3Vycikge1xyXG5cdFx0XHRyZXR1cm4gcHJldiArIGN1cnIucGVyY2VudEFsbG90bWVudDtcclxuXHRcdH0sIDApO1xyXG5cdH07XHJcblxyXG5cdHZhciB0YXhVdGlsaXphdGlvbiA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIGdyb3NzSW5jb21lID0gaW5jb21lU2VydmljZS50b3RhbCgnZ3Jvc3MnKTtcclxuXHRcdHZhciBuZXRJbmNvbWUgPSBpbmNvbWVTZXJ2aWNlLnRvdGFsKCduZXQnKTtcclxuXHJcblx0XHRyZXR1cm4gKGdyb3NzSW5jb21lIC0gbmV0SW5jb21lKSAvIGdyb3NzSW5jb21lICogMTAwO1xyXG5cdH07XHJcblxyXG5cdHZhciBvdmVydmlld1V0aWxpemF0aW9uVG90YWwgPSBmdW5jdGlvbigpIHtcclxuXHRcdHJldHVybiBidWRnZXRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXJyKSB7XHJcblx0XHRcdHJldHVybiBwcmV2ICsgYnVkZ2V0VXRpbGl6YXRpb24oY3Vycik7XHJcblx0XHR9LCB0YXhVdGlsaXphdGlvbigpKTtcclxuXHR9O1xyXG5cdC8vRW5kIFN0YXRpc3RpY3MgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcblx0dGhpcy5nZXRBbGxCdWRnZXRzID0gZ2V0QWxsQnVkZ2V0cztcclxuXHR0aGlzLnNhdmVCdWRnZXQgPSBzYXZlQnVkZ2V0O1xyXG5cdHRoaXMuZ2V0QnVkZ2V0ID0gZ2V0QnVkZ2V0O1xyXG5cdHRoaXMuZ2V0QWxsQnVkZ2V0SXRlbXMgPSBnZXRBbGxCdWRnZXRJdGVtcztcclxuXHR0aGlzLnNhdmVCdWRnZXRJdGVtID0gc2F2ZUJ1ZGdldEl0ZW07XHJcblx0dGhpcy50b3RhbCA9IHRvdGFsO1xyXG5cdHRoaXMudG90YWxDb3JlID0gdG90YWxDb3JlO1xyXG5cdHRoaXMudG90YWxBbGwgPSB0b3RhbEFsbDtcclxuXHJcblx0dGhpcy5idWRnZXRDYXAgPSBidWRnZXRDYXA7XHJcblx0dGhpcy5idWRnZXRVdGlsaXphdGlvbiA9IGJ1ZGdldFV0aWxpemF0aW9uO1xyXG5cdHRoaXMuYnVkZ2V0QmFsYW5jZSA9IGJ1ZGdldEJhbGFuY2U7XHJcblx0dGhpcy5ndWlkZWxpbmVUb3RhbCA9IGd1aWRlbGluZVRvdGFsO1xyXG5cdHRoaXMudGF4VXRpbGl6YXRpb24gPSB0YXhVdGlsaXphdGlvbjtcclxuXHR0aGlzLm92ZXJ2aWV3VXRpbGl6YXRpb25Ub3RhbCA9IG92ZXJ2aWV3VXRpbGl6YXRpb25Ub3RhbDtcclxufVxyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2J1ZGdldGluZ0lzRnVuJylcclxuXHQuc2VydmljZSgnYnVkZ2V0U2VydmljZScsIFsnJHEnLCAnZGVwbG95ZFNlcnZpY2UnLCAnaW5jb21lU2VydmljZScsICdkYXRhU2VydmljZScsIGJ1ZGdldFNlcnZpY2VdKTsiLCJmdW5jdGlvbiBkZXBsb3lkU2VydmljZSgkaHR0cCwgJHEsIGRlcGxveWQpIHtcclxuXHQvL2J1ZGdldHNcclxuXHR2YXIgYnVkZ2V0cyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuXHJcblx0XHQkaHR0cC5nZXQoZGVwbG95ZCArICcvYnVkZ2V0cycpXHJcblx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKGJ1ZGdldHMpIHtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKGJ1ZGdldHMpO1xyXG5cdFx0XHR9KS5lcnJvcihmdW5jdGlvbihlcnIpIHtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZWplY3QoZXJyKTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2U7XHJcblx0fTtcclxuXHJcblx0dmFyIHNhdmVCdWRnZXQgPSBmdW5jdGlvbihuZXdCdWRnZXQpIHtcclxuXHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XHJcblxyXG5cdFx0JGh0dHAucG9zdChkZXBsb3lkICsgJy9idWRnZXRzJywge1xyXG5cdFx0XHRuYW1lOiBuZXdCdWRnZXQubmFtZSxcclxuXHRcdFx0cGVyY2VudEFsbG90bWVudDogbmV3QnVkZ2V0LnBlcmNlbnRcclxuXHRcdH0pLnN1Y2Nlc3MoZnVuY3Rpb24oYnVkZ2V0KSB7XHJcblx0XHRcdGRlZmVycmVkLnJlc29sdmUoYnVkZ2V0KTtcclxuXHRcdH0pLmVycm9yKGZ1bmN0aW9uKGVycikge1xyXG5cdFx0XHRkZWZlcnJlZC5yZWplY3QoZXJyKTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xyXG5cdH07XHJcblxyXG5cdHZhciBnZXRCdWRnZXQgPSBmdW5jdGlvbihidWRnZXRJZCkge1xyXG5cdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuXHJcblx0XHQkaHR0cC5nZXQoZGVwbG95ZCArICcvYnVkZ2V0cycsIHtcclxuXHRcdFx0aWQ6IGJ1ZGdldElkXHJcblx0XHR9KS5zdWNjZXNzKGZ1bmN0aW9uKGJ1ZGdldCl7XHJcblx0XHRcdGRlZmVycmVkLnJlc29sdmUoYnVkZ2V0KTtcclxuXHRcdH0pLmVycm9yKGZ1bmN0aW9uKGVycikge1xyXG5cdFx0XHRkZWZlcnJlZC5yZWplY3QoZXJyKTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xyXG5cdH07XHJcblxyXG5cdHZhciBidWRnZXRJdGVtcyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuXHJcblx0XHQkaHR0cC5nZXQoZGVwbG95ZCArICcvYnVkZ2V0LWl0ZW1zJylcclxuXHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24oaXRlbXMpIHtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKGl0ZW1zKTtcclxuXHRcdFx0fSkuZXJyb3IoZnVuY3Rpb24oZXJyKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coZXJyKTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2U7XHJcblx0fTtcclxuXHJcblx0dmFyIHNhdmVCdWRnZXRJdGVtID0gZnVuY3Rpb24obmV3QnVkZ2V0SXRlbSkge1xyXG5cdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuXHJcblx0XHQkaHR0cC5wb3N0KGRlcGxveWQgKyAnL2J1ZGdldC1pdGVtcycsIHtcclxuXHRcdFx0bmFtZTogbmV3QnVkZ2V0SXRlbS5uYW1lLFxyXG5cdFx0XHRhbW91bnQ6IG5ld0J1ZGdldEl0ZW0uYW1vdW50LFxyXG5cdFx0XHRidWRnZXRJZDogbmV3QnVkZ2V0SXRlbS5idWRnZXQuaWRcclxuXHRcdH0pLnN1Y2Nlc3MoZnVuY3Rpb24obmV3QnVkZ2V0SXRlbSkge1xyXG5cdFx0XHRkZWZlcnJlZC5yZXNvbHZlKG5ld0J1ZGdldEl0ZW0pO1xyXG5cdFx0fSkuZXJyb3IoZnVuY3Rpb24oZXJyKSB7XHJcblx0XHRcdGRlZmVycmVkLnJlamVjdChlcnIpO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2U7XHJcblx0fTtcclxuXHJcblx0Ly9pbmNvbWVzXHJcblx0dmFyIGluY29tZXMgPSBmdW5jdGlvbigpIHtcclxuXHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XHJcblxyXG5cdFx0JGh0dHAuZ2V0KGRlcGxveWQgKyAnL2luY29tZS1zb3VyY2VzJylcclxuXHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24oaW5jb21lcykge1xyXG5cdFx0XHRcdGRlZmVycmVkLnJlc29sdmUoaW5jb21lcyk7XHJcblx0XHRcdH0pLmVycm9yKGZ1bmN0aW9uKGVycikge1xyXG5cdFx0XHRcdGRlZmVycmVkLnJlamVjdChlcnIpO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcclxuXHR9O1xyXG5cclxuXHR2YXIgc2F2ZUluY29tZSA9IGZ1bmN0aW9uKG5ld0luY29tZSkge1xyXG5cdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuXHJcblx0XHQkaHR0cC5wb3N0KGRlcGxveWQgKyAnL2luY29tZS1zb3VyY2VzJywge1xyXG5cdFx0XHRqb2I6IG5ld0luY29tZS5qb2IsXHJcblx0XHRcdGluY29tZVR5cGVJZDogbmV3SW5jb21lLmluY29tZVR5cGUuaWQsXHJcblx0XHRcdHBheXJhdGU6IG5ld0luY29tZS5wYXlyYXRlLFxyXG5cdFx0XHRob3VyczogbmV3SW5jb21lLmhvdXJzLFxyXG5cdFx0XHR0YXhQZXJjZW50OiBuZXdJbmNvbWUudGF4UGVyY2VudFxyXG5cdFx0fSkuc3VjY2VzcyhmdW5jdGlvbihpbmNvbWUpIHtcclxuXHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShpbmNvbWUpO1xyXG5cdFx0fSkuZXJyb3IoZnVuY3Rpb24oZXJyKSB7XHJcblx0XHRcdGRlZmVycmVkLnJlamVjdChlcnIpO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2U7XHJcblx0fTtcclxuXHJcblx0Ly9pbmNvbWUtdHlwZXNcclxuXHR2YXIgaW5jb21lVHlwZXMgPSBmdW5jdGlvbigpIHtcclxuXHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XHJcblxyXG5cdFx0JGh0dHAuZ2V0KGRlcGxveWQgKyAnL2luY29tZS10eXBlcycpXHJcblx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKGluY29tZVR5cGVzKSB7XHJcblx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShpbmNvbWVUeXBlcyk7XHJcblx0XHRcdH0pLmVycm9yKGZ1bmN0aW9uKGVycikge1xyXG5cdFx0XHRcdGRlZmVycmVkLnJlamVjdChlcnIpO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcclxuXHR9XHJcblxyXG5cdHZhciBpbmNvbWVUeXBlID0gZnVuY3Rpb24oaWQpIHtcclxuXHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XHJcblxyXG5cdFx0JGh0dHAuZ2V0KGRlcGxveWQgKyAnL2luY29tZS10eXBlcz9pZD0nICsgaWQpXHJcblx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKGluY29tZVR5cGUpIHtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKHR5cGUpO1xyXG5cdFx0XHR9KS5lcnJvcihmdW5jdGlvbihlcnIpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xyXG5cdH07XHJcblxyXG5cdHRoaXMuZ2V0QWxsQnVkZ2V0cyA9IGJ1ZGdldHM7XHJcblx0dGhpcy5zYXZlQnVkZ2V0ID0gc2F2ZUJ1ZGdldDtcclxuXHR0aGlzLmdldEFsbEJ1ZGdldEl0ZW1zID0gYnVkZ2V0SXRlbXM7XHJcblx0dGhpcy5zYXZlQnVkZ2V0SXRlbSA9IHNhdmVCdWRnZXRJdGVtO1xyXG5cdHRoaXMuZ2V0QnVkZ2V0ID0gZ2V0QnVkZ2V0O1xyXG5cclxuXHR0aGlzLmdldEFsbEluY29tZXMgPSBpbmNvbWVzO1xyXG5cdHRoaXMuc2F2ZUluY29tZSA9IHNhdmVJbmNvbWU7XHJcblxyXG5cdHRoaXMuZ2V0QWxsSW5jb21lVHlwZXMgPSBpbmNvbWVUeXBlcztcclxuXHR0aGlzLmdldEluY29tZVR5cGUgPSBpbmNvbWVUeXBlO1xyXG59XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnYnVkZ2V0aW5nSXNGdW4nKVxyXG5cdC5jb25zdGFudCgnZGVwbG95ZCcsICdodHRwOi8vbG9jYWxob3N0OjI0MDMnKVxyXG5cdC5zZXJ2aWNlKCdkZXBsb3lkU2VydmljZScsIFsnJGh0dHAnLCAnJHEnLCAnZGVwbG95ZCcsIGRlcGxveWRTZXJ2aWNlXSk7IiwiLyogRmlyZWJhc2UgMy4wLjMgSW1wbGVtZW50YXRpb24gKi9cclxuXHJcbmZ1bmN0aW9uIGRhdGFTZXJ2aWNlKCRxLCAkZmlyZWJhc2VBdXRoKSB7XHJcblx0dmFyIGNvbmZpZyA9IHtcclxuICAgICAgYXBpS2V5OiBcIkFJemFTeUNPcXh5cUpXSGJWWFFvUmU1eWVERGNrREZhZXpDV0dGUVwiLFxyXG4gICAgICBhdXRoRG9tYWluOiBcInByb2plY3QtNTMyOTIxNjc3ODE1MDM0NjEwMi5maXJlYmFzZWFwcC5jb21cIixcclxuICAgICAgZGF0YWJhc2VVUkw6IFwiaHR0cHM6Ly9wcm9qZWN0LTUzMjkyMTY3NzgxNTAzNDYxMDIuZmlyZWJhc2Vpby5jb21cIixcclxuICAgICAgc3RvcmFnZUJ1Y2tldDogXCJcIixcclxuICAgIH07XHJcbiAgICBmaXJlYmFzZS5pbml0aWFsaXplQXBwKGNvbmZpZyk7XHJcblxyXG5cdHZhciByZWYgPSBmaXJlYmFzZS5hdXRoKCk7XHJcblx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuXHJcblx0Ly9BdXRoXHJcblx0dmFyIGF1dGggPSAkZmlyZWJhc2VBdXRoKHJlZik7XHJcblx0Y29uc29sZS5sb2coYXV0aCk7XHJcblx0dGhpcy5jdXJyZW50VXNlciA9IG51bGw7XHJcblxyXG5cdHZhciBjcmVhdGVVc2VyID0gZnVuY3Rpb24oZW1haWwsIHBhc3N3b3JkKSB7XHJcblx0XHRhdXRoLiRjcmVhdGVVc2VyV2l0aEVtYWlsQW5kUGFzc3dvcmQoZW1haWwsIHBhc3N3b3JkKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbih1c2VyRGF0YSkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKFwiQ3JlYXRlZCB1c2VyOiBcIiwgdXNlckRhdGEuZW1haWwpO1xyXG5cdFx0XHR9KS5jYXRjaChmdW5jdGlvbihlcnJvcikge1xyXG5cdFx0XHRcdHZhciBlcnJvckNvZGUgPSBlcnJvci5jb2RlO1xyXG5cdFx0XHRcdHZhciBlcnJvck1lc3NhZ2UgPSBlcnJvci5tZXNzYWdlO1xyXG5cclxuXHRcdFx0XHQvL0xvZyBFcnJvclxyXG5cdFx0XHRcdGNvbnNvbGUubG9nKGVycm9yKTtcclxuXHRcdFx0fSk7XHJcblx0fTtcclxuXHJcblx0dmFyIGxvZ2luID0gZnVuY3Rpb24oZW1haWwsIHBhc3N3b3JkKSB7XHJcblx0XHRhdXRoLiRzaWduSW5XaXRoRW1haWxBbmRQYXNzd29yZChlbWFpbCwgcGFzc3dvcmQpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKGF1dGhEYXRhKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coXCJMb2dnZWQgaW4gYXM6IFwiICsgYXV0aERhdGEudWlkKTtcclxuXHRcdFx0fSkuY2F0Y2goZnVuY3Rpb24oZXJyb3IpIHtcclxuXHRcdFx0XHR2YXIgZXJyb3JDb2RlID0gZXJyb3IuY29kZTtcclxuXHRcdFx0XHR2YXIgZXJyb3JNZXNzYWdlID0gZXJyb3IubWVzc2FnZTtcclxuXHJcblx0XHRcdFx0Ly9Mb2cgRXJyb3JcclxuXHRcdFx0XHRjb25zb2xlLmxvZyhlcnJvcik7XHJcblx0XHRcdH0pO1xyXG5cdH07XHJcblxyXG5cdHZhciBzaWduT3V0ID0gZnVuY3Rpb24oKSB7XHJcblx0XHRjb25zb2xlLmxvZygnYXR0ZW1wdGluZyBzaWduIG91dCcpO1xyXG5cdFx0YXV0aC4kc2lnbk91dCgpO1xyXG5cclxuXHR9O1xyXG5cclxuXHR2YXIgZ2V0Q3VycmVudFVzZXIgPSBmdW5jdGlvbigpIHtcclxuXHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xyXG5cdH07XHJcblxyXG5cdGF1dGguJG9uQXV0aFN0YXRlQ2hhbmdlZChmdW5jdGlvbihhdXRoRGF0YSkge1xyXG5cdFx0Y29uc29sZS5sb2coJ3N0YXRlIGNoYW5nZWQnKTtcclxuXHRcdGlmKGF1dGhEYXRhKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKGF1dGhEYXRhKTtcclxuXHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShhdXRoRGF0YSk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRkZWZlcnJlZC5yZWplY3QoJ05vdCBhdXRoZW50aWNhdGVkJyk7XHJcblx0XHR9XHJcblx0fSk7XHJcblxyXG5cdC8vRGF0YVxyXG5cdC8vYnVkZ2V0c1xyXG5cdHZhciBidWRnZXRzID0gZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xyXG5cclxuXHRcdGZpcmViYXNlLmRhdGFiYXNlKCkucmVmKCdidWRnZXRzJylcclxuXHRcdFx0Lm9yZGVyQnlDaGlsZCgndXNlcklkJylcclxuXHRcdFx0LmVxdWFsVG8oJ3Rlc3QxJylcclxuXHRcdFx0Lm9uKCd2YWx1ZScsIGZ1bmN0aW9uKGJ1ZGdldHMpIHtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKGJ1ZGdldHMudmFsKCkpO1xyXG5cdFx0XHR9KTtcclxuXHRcdFxyXG5cdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2U7XHJcblx0fTtcclxuXHJcblx0Ly9BdXRoXHJcblx0dGhpcy5jcmVhdGVVc2VyID0gY3JlYXRlVXNlcjtcclxuXHR0aGlzLmxvZ2luID0gbG9naW47XHJcblx0dGhpcy5zaWduT3V0ID0gc2lnbk91dDtcclxuXHR0aGlzLmdldEN1cnJlbnRVc2VyID0gZ2V0Q3VycmVudFVzZXI7XHJcblxyXG5cdC8vRGF0YVxyXG5cdHRoaXMuZ2V0QnVkZ2V0cyA9IGJ1ZGdldHM7XHJcbn1cclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdidWRnZXRpbmdJc0Z1bicpXHJcblx0LnNlcnZpY2UoJ2RhdGFTZXJ2aWNlJywgWyckcScsICckZmlyZWJhc2VBdXRoJywgZGF0YVNlcnZpY2VdKTsiLCJhbmd1bGFyLm1vZHVsZSgnYnVkZ2V0aW5nSXNGdW4nKVxyXG5cdC5jb250cm9sbGVyKCdJbmNvbWVDb250cm9sbGVyJywgWydpbmNvbWVTZXJ2aWNlJywgXHJcblx0XHRmdW5jdGlvbihpbmNvbWVTZXJ2aWNlKSB7XHJcblx0XHRcdHZhciBzZWxmID0gdGhpcztcclxuXHJcblx0XHRcdC8vaW5pdC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHRcdFx0c2VsZi5pbmNvbWVzID0gW107XHJcblx0XHRcdHNlbGYuaW5jb21lVHlwZXMgPSBbXTtcclxuXHJcblx0XHRcdC8vR2V0IGluY29tZXNcclxuXHRcdFx0aW5jb21lU2VydmljZS5nZXRBbGxJbmNvbWVzKClcclxuXHRcdFx0XHQudGhlbihmdW5jdGlvbihpbmNvbWVzKSB7XHJcblx0XHRcdFx0XHRzZWxmLmluY29tZXMgPSBpbmNvbWVzO1xyXG5cdFx0XHRcdH0sIGZ1bmN0aW9uKGVycikge1xyXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coZXJyKTtcclxuXHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdC8vR2V0IGluY29tZVR5cGVzXHJcblx0XHRcdGluY29tZVNlcnZpY2UuZ2V0QWxsSW5jb21lVHlwZXMoKVxyXG5cdFx0XHRcdC50aGVuKGZ1bmN0aW9uKGluY29tZVR5cGVzKSB7XHJcblx0XHRcdFx0XHRzZWxmLmluY29tZVR5cGVzID0gaW5jb21lVHlwZXM7XHJcblx0XHRcdFx0fSwgZnVuY3Rpb24oZXJyKSB7XHJcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHQvL2luaXQgZW5kLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5cdFx0XHQvL2FjdGlvbnMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblx0XHRcdHNlbGYubmV3SW5jb21lID0ge307XHJcblxyXG5cdFx0XHRzZWxmLnNhdmVJbmNvbWUgPSBmdW5jdGlvbihuZXdJbmNvbWUpIHtcclxuXHRcdFx0XHRpbmNvbWVTZXJ2aWNlLnNhdmVJbmNvbWUobmV3SW5jb21lKTtcclxuXHRcdFx0XHRzZWxmLm5ld0luY29tZSA9IHt9O1xyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0c2VsZi5wYXlJbmZvID0ge307XHJcblx0XHRcdHNlbGYuY2FsY3VsYXRlZFBheXJhdGUgPSAwO1xyXG5cdFx0XHRzZWxmLmNhbGN1bGF0ZWRIb3VycyA9IDA7XHJcblxyXG5cdFx0XHRzZWxmLmNhbGN1bGF0ZVBheXJhdGUgPSBmdW5jdGlvbihwYXlJbmZvKSB7XHJcblx0XHRcdFx0c2VsZi5jYWxjdWxhdGVkUGF5cmF0ZSA9IGluY29tZVNlcnZpY2UuY2FsY3VsYXRlUGF5cmF0ZShwYXlJbmZvLmluY29tZVR5cGUsIHBheUluZm8ud2FnZSwgcGF5SW5mby5ob3Vycyk7XHJcblx0XHRcdFx0c2VsZi5jYWxjdWxhdGVkSG91cnMgPSAocGF5SW5mby5ob3VycykgPyBwYXlJbmZvLmhvdXJzIDogNDA7XHJcblx0XHRcdH07XHJcblxyXG5cdFx0XHRzZWxmLnRvdGFsWWVhcmx5R3Jvc3MgPSBpbmNvbWVTZXJ2aWNlLnRvdGFsWWVhcmx5R3Jvc3M7XHJcblx0XHRcdHNlbGYudG90YWxZZWFybHlOZXQgPSBpbmNvbWVTZXJ2aWNlLnRvdGFsWWVhcmx5TmV0O1xyXG5cdFx0XHRzZWxmLnRvdGFsWWVhcmx5VGF4ID0gaW5jb21lU2VydmljZS50b3RhbFllYXJseVRheDtcclxuXHRcdFx0c2VsZi50b3RhbCA9IGluY29tZVNlcnZpY2UudG90YWw7XHJcblx0XHRcdC8vYWN0aW9ucyBlbmQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHR9XSk7IiwiLy9ub3JtYWxpemUgaW5jb21lIGZsZXNoaW5nIG91dCBncm9zcyBhbmQgbmV0IG51bWJlcnNcclxuZnVuY3Rpb24gbm9ybWFsaXplSW5jb21lcyhpbmNvbWVzKSB7XHJcblx0aWYoIWFuZ3VsYXIuaXNBcnJheShpbmNvbWVzKSlcclxuXHRcdGluY29tZXMgPSBbaW5jb21lc107XHJcblxyXG5cdHZhciBub3JtYWxpemVkSW5jb21lcyA9IFtdO1xyXG5cclxuXHRhbmd1bGFyLmZvckVhY2goaW5jb21lcywgZnVuY3Rpb24oaW5jb21lKSB7XHJcblx0XHR2YXIgbm9ybUluY29tZSA9IHt9O1xyXG5cclxuXHRcdG5vcm1JbmNvbWUuam9iID0gaW5jb21lLmpvYjtcclxuXHRcdG5vcm1JbmNvbWUucGF5cmF0ZSA9IGluY29tZS5wYXlyYXRlO1xyXG5cdFx0bm9ybUluY29tZS5ob3VycyA9IGluY29tZS5ob3VycztcclxuXHRcdG5vcm1JbmNvbWUuZ3Jvc3MgPSBpbmNvbWUucGF5cmF0ZSAqIGluY29tZS5ob3VycyAqIDQ7XHJcblx0XHRub3JtSW5jb21lLnRheCA9IGluY29tZS50YXhQZXJjZW50O1xyXG5cdFx0bm9ybUluY29tZS5uZXQgPSBub3JtSW5jb21lLmdyb3NzICogKDEgLSAoaW5jb21lLnRheFBlcmNlbnQgLyAxMDApKTtcclxuXHRcdG5vcm1JbmNvbWUuYml3ZWVrbHkgPSBub3JtSW5jb21lLm5ldCAvIDI7XHJcblxyXG5cdFx0bm9ybWFsaXplZEluY29tZXMucHVzaChub3JtSW5jb21lKTtcclxuXHR9KVxyXG5cclxuXHRyZXR1cm4gbm9ybWFsaXplZEluY29tZXM7XHJcbn1cclxuXHJcbi8vcmV0dXJuIGhvdXJzIGJhc2VkIG9uIGluY29tZSB0eXBlXHJcbmZ1bmN0aW9uIGdldEhvdXJzKHR5cGUpIHtcclxuXHRzd2l0Y2godHlwZSl7XHJcblx0XHRjYXNlICdXZWVrbHknOlxyXG5cdFx0Y2FzZSAnQmktV2Vla2x5JzpcclxuXHRcdGNhc2UgJ1llYXJseSc6XHJcblx0XHRcdHJldHVybiA0MDtcclxuXHRcdGNhc2UgJ1NlbWktTW9udGhseSc6XHJcblx0XHRjYXNlICdNb250aGx5JzpcclxuXHRcdFx0cmV0dXJuICg0MCoxMy8xMik7IC8vMTMgd2VlayBtb250aHMgaW4gMTIgbW9udGhzIGJhc2VkIG9uIDUyIHdlZWtzL3llYXJcclxuXHR9XHJcbn1cclxuXHJcbi8vaW5jb21lIHNlcnZpY2UgcHJvdmlkZXMgbWV0aG9kcyB0byBhZGQgYW5kIGdldCBpbmNvbWVzXHJcbmZ1bmN0aW9uIGluY29tZVNlcnZpY2UoJHEsIGRlcGxveWRTZXJ2aWNlKSB7XHJcblx0dmFyIGluY29tZXMgPSBbXTtcclxuXHR2YXIgaW5jb21lVHlwZXMgPSBbXTtcclxuXHJcblx0XHJcblx0Ly9HZXRzIGFuZCBTYXZlcy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cdC8vaW5jb21lc1xyXG5cdHZhciBnZXRBbGxJbmNvbWVzID0gZnVuY3Rpb24oKSB7XHJcblx0XHRpZihpbmNvbWVzLmxlbmd0aCAhPSAwKXtcclxuXHRcdFx0cmV0dXJuICRxLndoZW4oaW5jb21lcyk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gZGVwbG95ZFNlcnZpY2UuZ2V0QWxsSW5jb21lcygpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKGFsbEluY29tZXMpIHtcclxuXHRcdFx0XHRpbmNvbWVzID0gbm9ybWFsaXplSW5jb21lcyhhbGxJbmNvbWVzKTtcclxuXHRcdFx0XHRyZXR1cm4gaW5jb21lcztcclxuXHRcdFx0fSk7XHJcblx0fTtcclxuXHJcblx0dmFyIHNhdmVJbmNvbWUgPSBmdW5jdGlvbihuZXdJbmNvbWUpe1xyXG5cdFx0ZGVwbG95ZFNlcnZpY2Uuc2F2ZUluY29tZShuZXdJbmNvbWUpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKG5ld0luY29tZSkge1xyXG5cdFx0XHRcdGluY29tZXMucHVzaChzZWxmLm5vcm1hbGl6ZUluY29tZXMobmV3SW5jb21lKVswXSk7XHJcblx0XHRcdH0sIGZ1bmN0aW9uKGVycikge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKGVycilcclxuXHRcdFx0fSk7XHJcblx0fTtcclxuXHJcblx0Ly9pbmNvbWUtdHlwZXNcclxuXHR2YXIgZ2V0QWxsSW5jb21lVHlwZXMgPSBmdW5jdGlvbigpIHtcclxuXHRcdGlmKGluY29tZVR5cGVzICE9IDApe1xyXG5cdFx0XHRyZXR1cm4gJHEud2hlbih0eXBlcyk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gZGVwbG95ZFNlcnZpY2UuZ2V0QWxsSW5jb21lVHlwZXMoKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihhbGxJbmNvbWVUeXBlcykge1xyXG5cdFx0XHRcdGluY29tZVR5cGVzID0gYWxsSW5jb21lVHlwZXM7XHJcblx0XHRcdFx0cmV0dXJuIGluY29tZVR5cGVzO1xyXG5cdFx0XHR9KTtcclxuXHR9O1xyXG5cclxuXHR2YXIgZ2V0SW5jb21lVHlwZSA9IGZ1bmN0aW9uKGlkKSB7XHJcblx0XHRyZXR1cm4gZGVwbG95ZFNlcnZpY2UuZ2V0VHlwZShpZClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oaW5jb21lVHlwZSkge1xyXG5cdFx0XHRcdHJldHVybiBpbmNvbWVUeXBlO1xyXG5cdFx0XHR9KTtcclxuXHR9O1xyXG5cdC8vRW5kIEdldHMgYW5kIFNhdmVzLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcblx0Ly9TdGF0aXN0aWNzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cdHZhciB0b3RhbCA9IGZ1bmN0aW9uKHByb3BlcnR5KSB7XHJcblx0XHRpZihwcm9wZXJ0eSA9PSAndGF4Jykge1xyXG5cdFx0XHRyZXR1cm4gdG90YWwoJ2dyb3NzJykgLSB0b3RhbCgnbmV0Jyk7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdGlmKGluY29tZXMubGVuZ3RoID4gMCAmJiBpc0Zpbml0ZShpbmNvbWVzWzBdW3Byb3BlcnR5XSkpXHJcblx0XHRcdHJldHVybiBpbmNvbWVzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXJyKSB7IHJldHVybiBwcmV2ICsgY3Vycltwcm9wZXJ0eV07IH0sIDApO1xyXG5cdFx0fVxyXG5cdH07XHJcblxyXG5cdHZhciB5ZWFybHlHcm9zcyA9IGZ1bmN0aW9uKGluY29tZSkge1xyXG5cdFx0cmV0dXJuIGluY29tZS5ncm9zcyAqIDEzOyAvLzEzIHdlZWsgbW9udGhzIGluIGEgeWVhciAoNTIgd2Vla3MpXHJcblx0fTtcclxuXHJcblx0dmFyIHllYXJseU5ldCA9IGZ1bmN0aW9uKGluY29tZSkge1xyXG5cdFx0cmV0dXJuIGluY29tZS5uZXQgKiAxMztcclxuXHR9O1xyXG5cclxuXHR2YXIgdG90YWxZZWFybHlHcm9zcyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0cmV0dXJuIGluY29tZXMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cnIpIHtcclxuXHRcdFx0cmV0dXJuIHByZXYgKyB5ZWFybHlHcm9zcyhjdXJyKTtcclxuXHRcdH0sIDApO1xyXG5cdH07XHJcblxyXG5cdHZhciB0b3RhbFllYXJseU5ldCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0cmV0dXJuIGluY29tZXMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cnIpIHtcclxuXHRcdFx0cmV0dXJuIHByZXYgKyB5ZWFybHlOZXQoY3Vycik7XHJcblx0XHR9LCAwKTtcclxuXHR9O1xyXG5cclxuXHR2YXIgdG90YWxZZWFybHlUYXggPSBmdW5jdGlvbigpIHtcclxuXHRcdHJldHVybiB0b3RhbFllYXJseUdyb3NzKCkgLSB0b3RhbFllYXJseU5ldCgpO1xyXG5cdH07XHJcblxyXG5cdHZhciBjYWxjdWxhdGVQYXlyYXRlID0gZnVuY3Rpb24gY2FsY3VsYXRlUGF5cmF0ZSh0eXBlLCB3YWdlLCBob3Vycyl7XHJcblx0XHRpZighaG91cnMpXHJcblx0XHRcdGhvdXJzID0gNDA7XHJcblxyXG5cdFx0c3dpdGNoKHR5cGUubmFtZSl7XHJcblx0XHRcdGNhc2UgJ1dlZWtseSc6XHJcblx0XHRcdFx0cmV0dXJuIHdhZ2UgLyBob3VyczsgLy9kbyBub3RoaW5nIHBheXJhdGUgaXMgd2hhdCBpdCBpc1xyXG5cdFx0XHRjYXNlICdCaS1XZWVrbHknOlxyXG5cdFx0XHRcdHJldHVybiB3YWdlIC8gKGhvdXJzICogMik7IC8vODAgaG91cnMgaW4gMiB3ZWVrc1xyXG5cdFx0XHRjYXNlICdTZW1pLU1vbnRobHknOlxyXG5cdFx0XHRcdHJldHVybiB3YWdlIC8gKGhvdXJzICogMTMgLyA2KTsgLy84Ni42NjY2IGhvdXJzIGluIGEgc2VtaS1tb250aFxyXG5cdFx0XHRjYXNlICdNb250aGx5JzpcclxuXHRcdFx0XHRyZXR1cm4gd2FnZSAvIChob3VycyAqIDEzIC8gMyk7IC8vMTczLjMzMzMgaG91cnMgaW4gYSBtb250aFxyXG5cdFx0XHRjYXNlICdZZWFybHknOlxyXG5cdFx0XHRcdHJldHVybiB3YWdlIC8gKGhvdXJzICogNTIpOyAvLy8yMDgwIGhvdXJzIGluIGEgeWVhclxyXG5cdFx0fVxyXG5cdH07XHJcblx0Ly9FbmQgU3RhdGlzdGljcyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuXHR0aGlzLmdldEFsbEluY29tZXMgPSBnZXRBbGxJbmNvbWVzO1xyXG5cdHRoaXMuc2F2ZUluY29tZSA9IHNhdmVJbmNvbWU7XHJcblxyXG5cdHRoaXMuZ2V0QWxsSW5jb21lVHlwZXMgPSBnZXRBbGxJbmNvbWVUeXBlcztcclxuXHR0aGlzLmdldEluY29tZVR5cGUgPSBnZXRJbmNvbWVUeXBlO1xyXG5cclxuXHR0aGlzLnllYXJseUdyb3NzID0geWVhcmx5R3Jvc3M7XHJcblx0dGhpcy50b3RhbFllYXJseUdyb3NzID0gdG90YWxZZWFybHlHcm9zcztcclxuXHR0aGlzLnllYXJseU5ldCA9IHllYXJseU5ldDtcclxuXHR0aGlzLnRvdGFsWWVhcmx5TmV0ID0gdG90YWxZZWFybHlOZXQ7XHJcblx0dGhpcy50b3RhbFllYXJseVRheCA9IHRvdGFsWWVhcmx5VGF4O1xyXG5cdHRoaXMudG90YWwgPSB0b3RhbDtcclxuXHJcblx0dGhpcy5jYWxjdWxhdGVQYXlyYXRlID0gY2FsY3VsYXRlUGF5cmF0ZTtcclxufVxyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2J1ZGdldGluZ0lzRnVuJylcclxuXHQuc2VydmljZSgnaW5jb21lU2VydmljZScsIFsnJHEnLCAnZGVwbG95ZFNlcnZpY2UnLCBpbmNvbWVTZXJ2aWNlXSk7IiwiYW5ndWxhci5tb2R1bGUoJ2J1ZGdldGluZ0lzRnVuJylcclxuXHQuY29udHJvbGxlcignTG9naW5Db250cm9sbGVyJywgWydsb2dpblNlcnZpY2UnLCBmdW5jdGlvbihsb2dpblNlcnZpY2UpIHtcclxuXHRcdHZhciBzZWxmID0gdGhpcztcclxuXHJcblx0XHRzZWxmLmN1cnJlbnRVc2VyID0gbnVsbDtcclxuXHJcblx0XHRsb2dpblNlcnZpY2UuZ2V0Q3VycmVudFVzZXIoKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbih1c2VyKSB7XHJcblx0XHRcdFx0c2VsZi5jdXJyZW50VXNlciA9IHVzZXI7XHJcblx0XHRcdH0sIGZ1bmN0aW9uKGVycikge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKGVycik7XHJcblx0XHRcdFx0c2VsZi5jdXJyZW50VXNlciA9IG51bGw7XHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdHNlbGYuY3JlYXRlVXNlciA9IGxvZ2luU2VydmljZS5jcmVhdGVVc2VyO1xyXG5cdFx0c2VsZi5sb2dpbiA9IGxvZ2luU2VydmljZS5sb2dpbjtcclxuXHRcdHNlbGYuc2lnbk91dCA9IGxvZ2luU2VydmljZS5zaWduT3V0O1xyXG5cdH1dKTsiLCJmdW5jdGlvbiBsb2dpblNlcnZpY2UoJHEsIGRhdGFTZXJ2aWNlKSB7XHJcblx0LypUZW1wbGF0ZXNcclxuXHJcblx0XHR1c2VyXHJcblx0XHR7XHJcblx0XHRcdGVtYWlsIDogc3RyaW5nLFxyXG5cdFx0XHRwYXNzd29yZCA6IHN0cmluZ1xyXG5cdFx0fVxyXG5cdCovXHJcblx0dmFyIGN1cnJlbnRVc2VyID0gbnVsbDtcclxuXHJcblx0dmFyIGNyZWF0ZVVzZXIgPSBmdW5jdGlvbihuZXdVc2VyKSB7XHJcblx0XHRkYXRhU2VydmljZS5jcmVhdGVVc2VyKG5ld1VzZXIuZW1haWwsIG5ld1VzZXIucGFzc3dvcmQpO1xyXG5cdH07XHJcblxyXG5cdHZhciBsb2dpbiA9IGZ1bmN0aW9uKHVzZXIpIHtcclxuXHRcdGNvbnNvbGUubG9nKCdhdHRlbXB0aW5nIGxvZ2luJyk7XHJcblx0XHRjb25zb2xlLmxvZyh1c2VyKTtcclxuXHRcdGRhdGFTZXJ2aWNlLmxvZ2luKHVzZXIuZW1haWwsIHVzZXIucGFzc3dvcmQpO1xyXG5cdH07XHJcblxyXG5cdHZhciBzaWduT3V0ID0gZnVuY3Rpb24oKSB7XHJcblx0XHRkYXRhU2VydmljZS5zaWduT3V0KCk7XHJcblx0fTtcclxuXHJcblx0dmFyIGdldEN1cnJlbnRVc2VyID0gZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4gZGF0YVNlcnZpY2UuZ2V0Q3VycmVudFVzZXIoKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbih1c2VyKSB7XHJcblx0XHRcdFx0Y3VycmVudFVzZXIgPSB1c2VyO1xyXG5cdFx0XHRcdHJldHVybiAgY3VycmVudFVzZXI7XHJcblx0XHRcdH0pXHJcblx0XHRcdC5jYXRjaChmdW5jdGlvbihlcnJvcikge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKGVycm9yKTtcclxuXHRcdFx0XHRjdXJyZW50VXNlciA9IG51bGw7XHJcblx0XHRcdFx0cmV0dXJuIGN1cnJlbnRVc2VyO1xyXG5cdFx0XHR9KTtcclxuXHR9O1xyXG5cclxuXHR0aGlzLmNyZWF0ZVVzZXIgPSBjcmVhdGVVc2VyO1xyXG5cdHRoaXMubG9naW4gPSBsb2dpbjtcclxuXHR0aGlzLnNpZ25PdXQgPSBzaWduT3V0O1xyXG5cdHRoaXMuZ2V0Q3VycmVudFVzZXIgPSBnZXRDdXJyZW50VXNlcjtcclxufVxyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2J1ZGdldGluZ0lzRnVuJylcclxuXHQuc2VydmljZSgnbG9naW5TZXJ2aWNlJywgWyckcScsICdkYXRhU2VydmljZScsIGxvZ2luU2VydmljZV0pOyIsImFuZ3VsYXIubW9kdWxlKCdidWRnZXRpbmdJc0Z1bicpXHJcblx0LmNvbnRyb2xsZXIoJ1Byb2plY3RlZEJhbGFuY2VDb250cm9sbGVyJywgWydwcm9qZWN0ZWRCYWxhbmNlU2VydmljZScsIFxyXG5cdFx0ZnVuY3Rpb24ocHJvamVjdGVkQmFsYW5jZVNlcnZpY2UpIHtcclxuXHRcdFx0dmFyIHNlbGYgPSB0aGlzOyBcclxuXHJcblx0XHRcdC8vaW5pdC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHRcdFx0c2VsZi5nZXRCYWxhbmNlID0gcHJvamVjdGVkQmFsYW5jZVNlcnZpY2UuZ2V0QmFsYW5jZTtcclxuXHJcblx0XHRcdC8vaW5pdCBlbmQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcblx0XHRcdC8vYWN0aW9ucy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHRcdFx0c2VsZi5jb3JlRXhwZW5zZXMgPSBwcm9qZWN0ZWRCYWxhbmNlU2VydmljZS5nZXRDb3JlRXhwZW5zZXM7XHJcblxyXG5cdFx0XHQvL2FjdGlvbnMgZW5kLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblx0fV0pOyIsIi8vcHJvamVjdGVkIGJhbGFuY2Ugc2VydmljZVxyXG5mdW5jdGlvbiBwcm9qZWN0ZWRCYWxhbmNlU2VydmljZShpbmNvbWVTZXJ2aWNlLCBidWRnZXRTZXJ2aWNlKSB7XHJcblx0dmFyIGJhbGFuY2UgPSAwO1xyXG5cclxuXHR2YXIgZ2V0QmFsYW5jZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0cmV0dXJuIGluY29tZVNlcnZpY2UudG90YWwoJ25ldCcpIC0gYnVkZ2V0U2VydmljZS50b3RhbEFsbCgpO1xyXG5cdH07XHJcblxyXG5cdHZhciBjb3JlRXhwZW5zZXMgPSBmdW5jdGlvbihtdWx0aXBsZSkge1xyXG5cdH07XHJcblxyXG5cdHRoaXMuZ2V0QmFsYW5jZSA9IGdldEJhbGFuY2U7XHJcblx0dGhpcy5nZXRDb3JlRXhwZW5zZXMgPSBjb3JlRXhwZW5zZXM7XHJcbn1cclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdidWRnZXRpbmdJc0Z1bicpXHJcblx0LnNlcnZpY2UoJ3Byb2plY3RlZEJhbGFuY2VTZXJ2aWNlJywgWydpbmNvbWVTZXJ2aWNlJywgJ2J1ZGdldFNlcnZpY2UnLCBwcm9qZWN0ZWRCYWxhbmNlU2VydmljZV0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
