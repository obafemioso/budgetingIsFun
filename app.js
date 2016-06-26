angular.module('budgetingIsFun', 
	[
		'angular.filter', 
		'firebase', 
		'firebase.ref', 
		'firebase.auth',
		'firebase.database'
	])
	.controller('BaseController', ["$scope", function($scope) {
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

/* Using Firebase 3.0.3 */

function authService($q, $timeout, Auth, Database) {
	console.log(Auth);

	var user = {};

	var login = function(email, password) {
		Auth.$signInWithEmailAndPassword(email, password);
	};

	var signOut = function() {
		Auth.$signOut();
	};

	//return current user as a promise
	var getUser = function() {
		return user;
	};

	Auth.$onAuthStateChanged(function(authData) {
		if(authData) {
			user.data = authData;
		} else {
			user.data = null;
		}
	});

	var createUser = function(email, pass) {
		Auth.$createUserWithEmailAndPassword(email, pass)
			.then(function() {
				return Auth.$signInWithEmailAndPassword(email, pass);
			})
			.then(createProfile);

		function createProfile(newUser) {
			var ref = Database.ref('users/' + newUser.uid), def = $q.defer();
			console.log(ref);
			ref.set({email: newUser.email, name: firstPartOfEmail(newUser.email), budgets: {}, incomes: {}}, 
				function(err) {
					$timeout(function() {
						if( err ) {
							def.reject(err);
						}
						else {
							def.resolve(ref);
						}
					});
				});
			return def.promise;
		}
	};

	function firstPartOfEmail(email) {
      return ucfirst(email.substr(0, email.indexOf('@'))||'');
    }

    function ucfirst (str) {
      // inspired by: http://kevin.vanzonneveld.net
      str += '';
      var f = str.charAt(0).toUpperCase();
      return f + str.substr(1);
    }
    
	this.createUser = createUser;
	this.login = login;
	this.signOut = signOut;
	this.getUser = getUser;
}

angular.module('budgetingIsFun')
	.service('authService', ['$q', '$timeout', 'Auth', 'Database', authService]);
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

angular.module('budgetingIsFun')
	.service('budgetService', ['$q', 'deploydService', 'incomeService', 'dataService', budgetService]);
/* Firebase 3.0.3 Implementation */

function dataService($q, $timeout, Database, Auth) {
	//Data
	//budgets

}

angular.module('budgetingIsFun')
	.service('dataService', ['$q', '$timeout', 'Database', 'Auth', dataService]);
function firebaseAuth($firebaseAuth, Ref) {
	return $firebaseAuth(Ref.auth());
}

angular.module('firebase.auth', ['firebase', 'firebase.ref'])
	.factory('Auth', ['$firebaseAuth', 'Ref', firebaseAuth]);
angular.module('firebase.config', [])
  .constant('FBPROJ', 'project-5329216778150346102');
function firebaseDatabase(Ref) {
	return Ref.database();
}

angular.module('firebase.database', ['firebase', 'firebase.ref'])
	.factory('Database', ['Ref', firebaseDatabase]);
function firebaseFactory(FBPROJ) {
	var config = {
      apiKey: "AIzaSyCOqxyqJWHbVXQoRe5yeDDckDFaezCWGFQ",
      authDomain: FBPROJ + ".firebaseapp.com",
      databaseURL: "https://" + FBPROJ + ".firebaseio.com",
      storageBucket: "",
    };
    firebase.initializeApp(config);

    return firebase;
}

angular.module('firebase.ref', ['firebase', 'firebase.config'])
	.factory('Ref', ['FBPROJ', firebaseFactory]);
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
	.controller('LoginController', ['loginService', '$scope', function(loginService, $scope) {
		var self = this;

		self.user = loginService.getUser();

		self.createUser = loginService.createUser;
		self.login = loginService.login;
		self.signOut = loginService.signOut;

		$scope.$watch(self.user);
	}]);
function loginService($q, authService) {
	/*Templates

		user
		{
			email : string,
			password : string
		}
	*/

	var createUser = function(newUser) {
		authService.createUser(newUser.email, newUser.password);
	};

	var login = function(user) {
		authService.login(user.email, user.password);
	};

	var signOut = function() {
		authService.signOut();
	};

	this.createUser = createUser;
	this.login = login;
	this.signOut = signOut;
	this.getUser = authService.getUser;
}

angular.module('budgetingIsFun')
	.service('loginService', ['$q', 'authService', loginService]);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5tb2R1bGUuanMiLCJmaWx0ZXJzL2N1c3RvbUZpbHRlcnMuanMiLCJjb21wb25lbnRzL2F1dGgvYXV0aFNlcnZpY2UuanMiLCJjb21wb25lbnRzL2J1ZGdldC9idWRnZXRDb250cm9sbGVyLmpzIiwiY29tcG9uZW50cy9idWRnZXQvYnVkZ2V0U2VydmljZS5qcyIsImNvbXBvbmVudHMvZGF0YUFjY2Vzcy9kYXRhU2VydmljZS5qcyIsImNvbXBvbmVudHMvZmlyZWJhc2UvZmlyZWJhc2UuYXV0aC5qcyIsImNvbXBvbmVudHMvZmlyZWJhc2UvZmlyZWJhc2UuY29uZmlnLmpzIiwiY29tcG9uZW50cy9maXJlYmFzZS9maXJlYmFzZS5kYXRhYmFzZS5qcyIsImNvbXBvbmVudHMvZmlyZWJhc2UvZmlyZWJhc2UucmVmLmpzIiwiY29tcG9uZW50cy9kZXBsb3lkL2RlcGxveWRTZXJ2aWNlLmpzIiwiY29tcG9uZW50cy9pbmNvbWUvaW5jb21lQ29udHJvbGxlci5qcyIsImNvbXBvbmVudHMvaW5jb21lL2luY29tZVNlcnZpY2UuanMiLCJjb21wb25lbnRzL2xvZ2luL2xvZ2luQ29udHJvbGxlci5qcyIsImNvbXBvbmVudHMvbG9naW4vbG9naW5TZXJ2aWNlLmpzIiwiY29tcG9uZW50cy9wcm9qZWN0ZWRCYWxhbmNlL3Byb2plY3RlZEJhbGFuY2VDb250cm9sbGVyLmpzIiwiY29tcG9uZW50cy9wcm9qZWN0ZWRCYWxhbmNlL3Byb2plY3RlZEJhbGFuY2VTZXJ2aWNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFFBQUEsT0FBQTtDQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTs7RUFFQSxXQUFBLDZCQUFBLFNBQUEsUUFBQTtFQUNBLE9BQUEsaUJBQUE7OztBQ1RBLFFBQUEsT0FBQSxpQkFBQTtLQUNBLE9BQUEsVUFBQSxZQUFBO1FBQ0EsT0FBQSxVQUFBLE1BQUEsY0FBQTtZQUNBLElBQUEsUUFBQSxRQUFBLFNBQUEsUUFBQSxTQUFBLGVBQUE7Z0JBQ0EsSUFBQSxVQUFBO2dCQUNBLElBQUEsT0FBQTtnQkFDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsS0FBQSxRQUFBLEtBQUE7b0JBQ0EsSUFBQSxNQUFBLEtBQUEsR0FBQTtvQkFDQSxJQUFBLFFBQUEsWUFBQSxLQUFBLE9BQUE7d0JBQ0EsS0FBQSxPQUFBO3dCQUNBLFFBQUEsS0FBQSxLQUFBOzs7Z0JBR0EsUUFBQSxJQUFBO2dCQUNBLE9BQUE7bUJBQ0E7Z0JBQ0EsT0FBQTs7Ozs7OztBQ2RBLFNBQUEsWUFBQSxJQUFBLFVBQUEsTUFBQSxVQUFBO0NBQ0EsUUFBQSxJQUFBOztDQUVBLElBQUEsT0FBQTs7Q0FFQSxJQUFBLFFBQUEsU0FBQSxPQUFBLFVBQUE7RUFDQSxLQUFBLDRCQUFBLE9BQUE7OztDQUdBLElBQUEsVUFBQSxXQUFBO0VBQ0EsS0FBQTs7OztDQUlBLElBQUEsVUFBQSxXQUFBO0VBQ0EsT0FBQTs7O0NBR0EsS0FBQSxvQkFBQSxTQUFBLFVBQUE7RUFDQSxHQUFBLFVBQUE7R0FDQSxLQUFBLE9BQUE7U0FDQTtHQUNBLEtBQUEsT0FBQTs7OztDQUlBLElBQUEsYUFBQSxTQUFBLE9BQUEsTUFBQTtFQUNBLEtBQUEsZ0NBQUEsT0FBQTtJQUNBLEtBQUEsV0FBQTtJQUNBLE9BQUEsS0FBQSw0QkFBQSxPQUFBOztJQUVBLEtBQUE7O0VBRUEsU0FBQSxjQUFBLFNBQUE7R0FDQSxJQUFBLE1BQUEsU0FBQSxJQUFBLFdBQUEsUUFBQSxNQUFBLE1BQUEsR0FBQTtHQUNBLFFBQUEsSUFBQTtHQUNBLElBQUEsSUFBQSxDQUFBLE9BQUEsUUFBQSxPQUFBLE1BQUEsaUJBQUEsUUFBQSxRQUFBLFNBQUEsSUFBQSxTQUFBO0lBQ0EsU0FBQSxLQUFBO0tBQ0EsU0FBQSxXQUFBO01BQ0EsSUFBQSxNQUFBO09BQ0EsSUFBQSxPQUFBOztXQUVBO09BQ0EsSUFBQSxRQUFBOzs7O0dBSUEsT0FBQSxJQUFBOzs7O0NBSUEsU0FBQSxpQkFBQSxPQUFBO01BQ0EsT0FBQSxRQUFBLE1BQUEsT0FBQSxHQUFBLE1BQUEsUUFBQSxPQUFBOzs7SUFHQSxTQUFBLFNBQUEsS0FBQTs7TUFFQSxPQUFBO01BQ0EsSUFBQSxJQUFBLElBQUEsT0FBQSxHQUFBO01BQ0EsT0FBQSxJQUFBLElBQUEsT0FBQTs7O0NBR0EsS0FBQSxhQUFBO0NBQ0EsS0FBQSxRQUFBO0NBQ0EsS0FBQSxVQUFBO0NBQ0EsS0FBQSxVQUFBOzs7QUFHQSxRQUFBLE9BQUE7RUFDQSxRQUFBLGVBQUEsQ0FBQSxNQUFBLFlBQUEsUUFBQSxZQUFBO0FDdkVBLFFBQUEsT0FBQTtFQUNBLFdBQUEsb0JBQUEsQ0FBQSxpQkFBQSxpQkFBQSxTQUFBLGVBQUEsZUFBQTtFQUNBLElBQUEsT0FBQTs7O0VBR0EsS0FBQSxVQUFBO0VBQ0EsS0FBQSxjQUFBOzs7SUFHQSxjQUFBO01BQ0EsS0FBQSxTQUFBLFNBQUE7TUFDQSxLQUFBLFVBQUE7TUFDQSxjQUFBO1FBQ0EsS0FBQSxTQUFBLE9BQUE7UUFDQSxLQUFBLGNBQUE7VUFDQSxTQUFBLEtBQUE7UUFDQSxRQUFBLElBQUE7O1FBRUEsU0FBQSxLQUFBO01BQ0EsUUFBQSxJQUFBOzs7Ozs7RUFNQSxLQUFBLFlBQUE7O0VBRUEsS0FBQSxhQUFBLFNBQUEsV0FBQTtHQUNBLGNBQUEsV0FBQTtHQUNBLEtBQUEsWUFBQTs7O0VBR0EsS0FBQSxnQkFBQTs7RUFFQSxLQUFBLGlCQUFBLFNBQUEsZUFBQTtHQUNBLGNBQUEsZUFBQTtHQUNBLEtBQUEsZ0JBQUE7OztFQUdBLEtBQUEsWUFBQSxjQUFBO0VBQ0EsS0FBQSxvQkFBQSxjQUFBO0VBQ0EsS0FBQSxnQkFBQSxjQUFBO0VBQ0EsS0FBQSxpQkFBQSxjQUFBO0VBQ0EsS0FBQSxpQkFBQSxjQUFBO0VBQ0EsS0FBQSwyQkFBQSxjQUFBO0VBQ0EsS0FBQSxRQUFBLGNBQUE7Ozs7QUM3Q0EsU0FBQSxjQUFBLElBQUEsZ0JBQUEsZUFBQSxhQUFBO0NBQ0EsSUFBQSxVQUFBO0NBQ0EsSUFBQSxjQUFBOzs7O0NBSUEsSUFBQSxnQkFBQSxXQUFBO0VBQ0EsR0FBQSxRQUFBLFVBQUEsRUFBQTtHQUNBLE9BQUEsR0FBQSxLQUFBOztFQUVBLE9BQUEsZUFBQTtJQUNBLEtBQUEsU0FBQSxZQUFBO0lBQ0EsVUFBQTtJQUNBLE9BQUE7Ozs7Q0FJQSxJQUFBLGFBQUEsU0FBQSxXQUFBO0VBQ0EsZUFBQSxXQUFBO0lBQ0EsS0FBQSxTQUFBLFdBQUE7SUFDQSxRQUFBLEtBQUE7TUFDQSxTQUFBLEtBQUE7SUFDQSxRQUFBLElBQUE7Ozs7Q0FJQSxJQUFBLFlBQUEsU0FBQSxVQUFBO0VBQ0EsZUFBQSxVQUFBO0lBQ0EsS0FBQSxTQUFBLFFBQUE7SUFDQSxPQUFBO01BQ0EsU0FBQSxLQUFBO0lBQ0EsUUFBQSxJQUFBO0lBQ0EsT0FBQTs7Ozs7Q0FLQSxJQUFBLG9CQUFBLFdBQUE7RUFDQSxHQUFBLFlBQUEsVUFBQSxFQUFBO0dBQ0EsT0FBQSxHQUFBLEtBQUE7O0VBRUEsT0FBQSxlQUFBO0lBQ0EsS0FBQSxTQUFBLGdCQUFBO0lBQ0EsY0FBQTtJQUNBLE9BQUE7Ozs7Q0FJQSxJQUFBLGlCQUFBLFNBQUEsZUFBQTtFQUNBLGVBQUEsZUFBQTtJQUNBLEtBQUEsU0FBQSxlQUFBO0lBQ0EsWUFBQSxLQUFBO01BQ0EsU0FBQSxLQUFBO0lBQ0EsUUFBQSxJQUFBOzs7Ozs7Q0FNQSxJQUFBLFFBQUEsU0FBQSxRQUFBO0VBQ0EsT0FBQSxZQUFBLE9BQUEsU0FBQSxNQUFBLE1BQUE7R0FDQSxHQUFBLEtBQUEsWUFBQSxPQUFBO0lBQ0EsT0FBQSxPQUFBLEtBQUE7R0FDQSxPQUFBO0tBQ0E7OztDQUdBLElBQUEsWUFBQSxXQUFBO0VBQ0EsSUFBQSxZQUFBOztFQUVBLFFBQUEsUUFBQSxTQUFBLFNBQUEsUUFBQTtHQUNBLEdBQUEsT0FBQSxRQUFBLFdBQUEsT0FBQSxRQUFBLFFBQUE7SUFDQSxJQUFBLElBQUEsTUFBQTtJQUNBLGFBQUE7Ozs7RUFJQSxPQUFBOzs7Q0FHQSxJQUFBLFdBQUEsV0FBQTtFQUNBLE9BQUEsWUFBQSxPQUFBLFNBQUEsTUFBQSxNQUFBO0dBQ0EsT0FBQSxPQUFBLEtBQUE7S0FDQTs7O0NBR0EsSUFBQSxZQUFBLFNBQUEsUUFBQTtFQUNBLE9BQUEsT0FBQSxtQkFBQSxNQUFBLGNBQUEsTUFBQTs7O0NBR0EsSUFBQSxvQkFBQSxTQUFBLFFBQUE7RUFDQSxPQUFBLE1BQUEsVUFBQSxjQUFBLE1BQUEsV0FBQTs7O0NBR0EsSUFBQSxnQkFBQSxTQUFBLFFBQUE7RUFDQSxPQUFBLFVBQUEsVUFBQSxNQUFBOzs7Q0FHQSxJQUFBLGlCQUFBLFdBQUE7RUFDQSxPQUFBLFFBQUEsT0FBQSxTQUFBLE1BQUEsTUFBQTtHQUNBLE9BQUEsT0FBQSxLQUFBO0tBQ0E7OztDQUdBLElBQUEsaUJBQUEsV0FBQTtFQUNBLElBQUEsY0FBQSxjQUFBLE1BQUE7RUFDQSxJQUFBLFlBQUEsY0FBQSxNQUFBOztFQUVBLE9BQUEsQ0FBQSxjQUFBLGFBQUEsY0FBQTs7O0NBR0EsSUFBQSwyQkFBQSxXQUFBO0VBQ0EsT0FBQSxRQUFBLE9BQUEsU0FBQSxNQUFBLE1BQUE7R0FDQSxPQUFBLE9BQUEsa0JBQUE7S0FDQTs7OztDQUlBLEtBQUEsZ0JBQUE7Q0FDQSxLQUFBLGFBQUE7Q0FDQSxLQUFBLFlBQUE7Q0FDQSxLQUFBLG9CQUFBO0NBQ0EsS0FBQSxpQkFBQTtDQUNBLEtBQUEsUUFBQTtDQUNBLEtBQUEsWUFBQTtDQUNBLEtBQUEsV0FBQTs7Q0FFQSxLQUFBLFlBQUE7Q0FDQSxLQUFBLG9CQUFBO0NBQ0EsS0FBQSxnQkFBQTtDQUNBLEtBQUEsaUJBQUE7Q0FDQSxLQUFBLGlCQUFBO0NBQ0EsS0FBQSwyQkFBQTs7O0FBR0EsUUFBQSxPQUFBO0VBQ0EsUUFBQSxpQkFBQSxDQUFBLE1BQUEsa0JBQUEsaUJBQUEsZUFBQTs7O0FDdElBLFNBQUEsWUFBQSxJQUFBLFVBQUEsVUFBQSxNQUFBOzs7Ozs7QUFNQSxRQUFBLE9BQUE7RUFDQSxRQUFBLGVBQUEsQ0FBQSxNQUFBLFlBQUEsWUFBQSxRQUFBO0FDVEEsU0FBQSxhQUFBLGVBQUEsS0FBQTtDQUNBLE9BQUEsY0FBQSxJQUFBOzs7QUFHQSxRQUFBLE9BQUEsaUJBQUEsQ0FBQSxZQUFBO0VBQ0EsUUFBQSxRQUFBLENBQUEsaUJBQUEsT0FBQTtBQ0xBLFFBQUEsT0FBQSxtQkFBQTtHQUNBLFNBQUEsVUFBQTtBQ0RBLFNBQUEsaUJBQUEsS0FBQTtDQUNBLE9BQUEsSUFBQTs7O0FBR0EsUUFBQSxPQUFBLHFCQUFBLENBQUEsWUFBQTtFQUNBLFFBQUEsWUFBQSxDQUFBLE9BQUE7QUNMQSxTQUFBLGdCQUFBLFFBQUE7Q0FDQSxJQUFBLFNBQUE7TUFDQSxRQUFBO01BQ0EsWUFBQSxTQUFBO01BQ0EsYUFBQSxhQUFBLFNBQUE7TUFDQSxlQUFBOztJQUVBLFNBQUEsY0FBQTs7SUFFQSxPQUFBOzs7QUFHQSxRQUFBLE9BQUEsZ0JBQUEsQ0FBQSxZQUFBO0VBQ0EsUUFBQSxPQUFBLENBQUEsVUFBQTtBQ2JBLFNBQUEsZUFBQSxPQUFBLElBQUEsU0FBQTs7Q0FFQSxJQUFBLFVBQUEsV0FBQTtFQUNBLElBQUEsV0FBQSxHQUFBOztFQUVBLE1BQUEsSUFBQSxVQUFBO0lBQ0EsUUFBQSxTQUFBLFNBQUE7SUFDQSxTQUFBLFFBQUE7TUFDQSxNQUFBLFNBQUEsS0FBQTtJQUNBLFNBQUEsT0FBQTs7O0VBR0EsT0FBQSxTQUFBOzs7Q0FHQSxJQUFBLGFBQUEsU0FBQSxXQUFBO0VBQ0EsSUFBQSxXQUFBLEdBQUE7O0VBRUEsTUFBQSxLQUFBLFVBQUEsWUFBQTtHQUNBLE1BQUEsVUFBQTtHQUNBLGtCQUFBLFVBQUE7S0FDQSxRQUFBLFNBQUEsUUFBQTtHQUNBLFNBQUEsUUFBQTtLQUNBLE1BQUEsU0FBQSxLQUFBO0dBQ0EsU0FBQSxPQUFBOzs7RUFHQSxPQUFBLFNBQUE7OztDQUdBLElBQUEsWUFBQSxTQUFBLFVBQUE7RUFDQSxJQUFBLFdBQUEsR0FBQTs7RUFFQSxNQUFBLElBQUEsVUFBQSxZQUFBO0dBQ0EsSUFBQTtLQUNBLFFBQUEsU0FBQSxPQUFBO0dBQ0EsU0FBQSxRQUFBO0tBQ0EsTUFBQSxTQUFBLEtBQUE7R0FDQSxTQUFBLE9BQUE7OztFQUdBLE9BQUEsU0FBQTs7O0NBR0EsSUFBQSxjQUFBLFdBQUE7RUFDQSxJQUFBLFdBQUEsR0FBQTs7RUFFQSxNQUFBLElBQUEsVUFBQTtJQUNBLFFBQUEsU0FBQSxPQUFBO0lBQ0EsU0FBQSxRQUFBO01BQ0EsTUFBQSxTQUFBLEtBQUE7SUFDQSxRQUFBLElBQUE7OztFQUdBLE9BQUEsU0FBQTs7O0NBR0EsSUFBQSxpQkFBQSxTQUFBLGVBQUE7RUFDQSxJQUFBLFdBQUEsR0FBQTs7RUFFQSxNQUFBLEtBQUEsVUFBQSxpQkFBQTtHQUNBLE1BQUEsY0FBQTtHQUNBLFFBQUEsY0FBQTtHQUNBLFVBQUEsY0FBQSxPQUFBO0tBQ0EsUUFBQSxTQUFBLGVBQUE7R0FDQSxTQUFBLFFBQUE7S0FDQSxNQUFBLFNBQUEsS0FBQTtHQUNBLFNBQUEsT0FBQTs7O0VBR0EsT0FBQSxTQUFBOzs7O0NBSUEsSUFBQSxVQUFBLFdBQUE7RUFDQSxJQUFBLFdBQUEsR0FBQTs7RUFFQSxNQUFBLElBQUEsVUFBQTtJQUNBLFFBQUEsU0FBQSxTQUFBO0lBQ0EsU0FBQSxRQUFBO01BQ0EsTUFBQSxTQUFBLEtBQUE7SUFDQSxTQUFBLE9BQUE7OztFQUdBLE9BQUEsU0FBQTs7O0NBR0EsSUFBQSxhQUFBLFNBQUEsV0FBQTtFQUNBLElBQUEsV0FBQSxHQUFBOztFQUVBLE1BQUEsS0FBQSxVQUFBLG1CQUFBO0dBQ0EsS0FBQSxVQUFBO0dBQ0EsY0FBQSxVQUFBLFdBQUE7R0FDQSxTQUFBLFVBQUE7R0FDQSxPQUFBLFVBQUE7R0FDQSxZQUFBLFVBQUE7S0FDQSxRQUFBLFNBQUEsUUFBQTtHQUNBLFNBQUEsUUFBQTtLQUNBLE1BQUEsU0FBQSxLQUFBO0dBQ0EsU0FBQSxPQUFBOzs7RUFHQSxPQUFBLFNBQUE7Ozs7Q0FJQSxJQUFBLGNBQUEsV0FBQTtFQUNBLElBQUEsV0FBQSxHQUFBOztFQUVBLE1BQUEsSUFBQSxVQUFBO0lBQ0EsUUFBQSxTQUFBLGFBQUE7SUFDQSxTQUFBLFFBQUE7TUFDQSxNQUFBLFNBQUEsS0FBQTtJQUNBLFNBQUEsT0FBQTs7O0VBR0EsT0FBQSxTQUFBOzs7Q0FHQSxJQUFBLGFBQUEsU0FBQSxJQUFBO0VBQ0EsSUFBQSxXQUFBLEdBQUE7O0VBRUEsTUFBQSxJQUFBLFVBQUEsc0JBQUE7SUFDQSxRQUFBLFNBQUEsWUFBQTtJQUNBLFNBQUEsUUFBQTtNQUNBLE1BQUEsU0FBQSxLQUFBO0lBQ0EsUUFBQSxJQUFBOzs7R0FHQSxPQUFBLFNBQUE7OztDQUdBLEtBQUEsZ0JBQUE7Q0FDQSxLQUFBLGFBQUE7Q0FDQSxLQUFBLG9CQUFBO0NBQ0EsS0FBQSxpQkFBQTtDQUNBLEtBQUEsWUFBQTs7Q0FFQSxLQUFBLGdCQUFBO0NBQ0EsS0FBQSxhQUFBOztDQUVBLEtBQUEsb0JBQUE7Q0FDQSxLQUFBLGdCQUFBOzs7QUFHQSxRQUFBLE9BQUE7RUFDQSxTQUFBLFdBQUE7RUFDQSxRQUFBLGtCQUFBLENBQUEsU0FBQSxNQUFBLFdBQUE7QUNuSkEsUUFBQSxPQUFBO0VBQ0EsV0FBQSxvQkFBQSxDQUFBO0VBQ0EsU0FBQSxlQUFBO0dBQ0EsSUFBQSxPQUFBOzs7R0FHQSxLQUFBLFVBQUE7R0FDQSxLQUFBLGNBQUE7OztHQUdBLGNBQUE7S0FDQSxLQUFBLFNBQUEsU0FBQTtLQUNBLEtBQUEsVUFBQTtPQUNBLFNBQUEsS0FBQTtLQUNBLFFBQUEsSUFBQTs7OztHQUlBLGNBQUE7S0FDQSxLQUFBLFNBQUEsYUFBQTtLQUNBLEtBQUEsY0FBQTtPQUNBLFNBQUEsS0FBQTtLQUNBLFFBQUEsSUFBQTs7Ozs7R0FLQSxLQUFBLFlBQUE7O0dBRUEsS0FBQSxhQUFBLFNBQUEsV0FBQTtJQUNBLGNBQUEsV0FBQTtJQUNBLEtBQUEsWUFBQTs7O0dBR0EsS0FBQSxVQUFBO0dBQ0EsS0FBQSxvQkFBQTtHQUNBLEtBQUEsa0JBQUE7O0dBRUEsS0FBQSxtQkFBQSxTQUFBLFNBQUE7SUFDQSxLQUFBLG9CQUFBLGNBQUEsaUJBQUEsUUFBQSxZQUFBLFFBQUEsTUFBQSxRQUFBO0lBQ0EsS0FBQSxrQkFBQSxDQUFBLFFBQUEsU0FBQSxRQUFBLFFBQUE7OztHQUdBLEtBQUEsbUJBQUEsY0FBQTtHQUNBLEtBQUEsaUJBQUEsY0FBQTtHQUNBLEtBQUEsaUJBQUEsY0FBQTtHQUNBLEtBQUEsUUFBQSxjQUFBOzs7O0FDN0NBLFNBQUEsaUJBQUEsU0FBQTtDQUNBLEdBQUEsQ0FBQSxRQUFBLFFBQUE7RUFDQSxVQUFBLENBQUE7O0NBRUEsSUFBQSxvQkFBQTs7Q0FFQSxRQUFBLFFBQUEsU0FBQSxTQUFBLFFBQUE7RUFDQSxJQUFBLGFBQUE7O0VBRUEsV0FBQSxNQUFBLE9BQUE7RUFDQSxXQUFBLFVBQUEsT0FBQTtFQUNBLFdBQUEsUUFBQSxPQUFBO0VBQ0EsV0FBQSxRQUFBLE9BQUEsVUFBQSxPQUFBLFFBQUE7RUFDQSxXQUFBLE1BQUEsT0FBQTtFQUNBLFdBQUEsTUFBQSxXQUFBLFNBQUEsS0FBQSxPQUFBLGFBQUE7RUFDQSxXQUFBLFdBQUEsV0FBQSxNQUFBOztFQUVBLGtCQUFBLEtBQUE7OztDQUdBLE9BQUE7Ozs7QUFJQSxTQUFBLFNBQUEsTUFBQTtDQUNBLE9BQUE7RUFDQSxLQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7R0FDQSxPQUFBO0VBQ0EsS0FBQTtFQUNBLEtBQUE7R0FDQSxRQUFBLEdBQUEsR0FBQTs7Ozs7QUFLQSxTQUFBLGNBQUEsSUFBQSxnQkFBQTtDQUNBLElBQUEsVUFBQTtDQUNBLElBQUEsY0FBQTs7Ozs7Q0FLQSxJQUFBLGdCQUFBLFdBQUE7RUFDQSxHQUFBLFFBQUEsVUFBQSxFQUFBO0dBQ0EsT0FBQSxHQUFBLEtBQUE7O0VBRUEsT0FBQSxlQUFBO0lBQ0EsS0FBQSxTQUFBLFlBQUE7SUFDQSxVQUFBLGlCQUFBO0lBQ0EsT0FBQTs7OztDQUlBLElBQUEsYUFBQSxTQUFBLFVBQUE7RUFDQSxlQUFBLFdBQUE7SUFDQSxLQUFBLFNBQUEsV0FBQTtJQUNBLFFBQUEsS0FBQSxLQUFBLGlCQUFBLFdBQUE7TUFDQSxTQUFBLEtBQUE7SUFDQSxRQUFBLElBQUE7Ozs7O0NBS0EsSUFBQSxvQkFBQSxXQUFBO0VBQ0EsR0FBQSxlQUFBLEVBQUE7R0FDQSxPQUFBLEdBQUEsS0FBQTs7RUFFQSxPQUFBLGVBQUE7SUFDQSxLQUFBLFNBQUEsZ0JBQUE7SUFDQSxjQUFBO0lBQ0EsT0FBQTs7OztDQUlBLElBQUEsZ0JBQUEsU0FBQSxJQUFBO0VBQ0EsT0FBQSxlQUFBLFFBQUE7SUFDQSxLQUFBLFNBQUEsWUFBQTtJQUNBLE9BQUE7Ozs7OztDQU1BLElBQUEsUUFBQSxTQUFBLFVBQUE7RUFDQSxHQUFBLFlBQUEsT0FBQTtHQUNBLE9BQUEsTUFBQSxXQUFBLE1BQUE7O09BRUE7RUFDQSxHQUFBLFFBQUEsU0FBQSxLQUFBLFNBQUEsUUFBQSxHQUFBO0dBQ0EsT0FBQSxRQUFBLE9BQUEsU0FBQSxNQUFBLE1BQUEsRUFBQSxPQUFBLE9BQUEsS0FBQSxjQUFBOzs7O0NBSUEsSUFBQSxjQUFBLFNBQUEsUUFBQTtFQUNBLE9BQUEsT0FBQSxRQUFBOzs7Q0FHQSxJQUFBLFlBQUEsU0FBQSxRQUFBO0VBQ0EsT0FBQSxPQUFBLE1BQUE7OztDQUdBLElBQUEsbUJBQUEsV0FBQTtFQUNBLE9BQUEsUUFBQSxPQUFBLFNBQUEsTUFBQSxNQUFBO0dBQ0EsT0FBQSxPQUFBLFlBQUE7S0FDQTs7O0NBR0EsSUFBQSxpQkFBQSxXQUFBO0VBQ0EsT0FBQSxRQUFBLE9BQUEsU0FBQSxNQUFBLE1BQUE7R0FDQSxPQUFBLE9BQUEsVUFBQTtLQUNBOzs7Q0FHQSxJQUFBLGlCQUFBLFdBQUE7RUFDQSxPQUFBLHFCQUFBOzs7Q0FHQSxJQUFBLG1CQUFBLFNBQUEsaUJBQUEsTUFBQSxNQUFBLE1BQUE7RUFDQSxHQUFBLENBQUE7R0FDQSxRQUFBOztFQUVBLE9BQUEsS0FBQTtHQUNBLEtBQUE7SUFDQSxPQUFBLE9BQUE7R0FDQSxLQUFBO0lBQ0EsT0FBQSxRQUFBLFFBQUE7R0FDQSxLQUFBO0lBQ0EsT0FBQSxRQUFBLFFBQUEsS0FBQTtHQUNBLEtBQUE7SUFDQSxPQUFBLFFBQUEsUUFBQSxLQUFBO0dBQ0EsS0FBQTtJQUNBLE9BQUEsUUFBQSxRQUFBOzs7OztDQUtBLEtBQUEsZ0JBQUE7Q0FDQSxLQUFBLGFBQUE7O0NBRUEsS0FBQSxvQkFBQTtDQUNBLEtBQUEsZ0JBQUE7O0NBRUEsS0FBQSxjQUFBO0NBQ0EsS0FBQSxtQkFBQTtDQUNBLEtBQUEsWUFBQTtDQUNBLEtBQUEsaUJBQUE7Q0FDQSxLQUFBLGlCQUFBO0NBQ0EsS0FBQSxRQUFBOztDQUVBLEtBQUEsbUJBQUE7OztBQUdBLFFBQUEsT0FBQTtFQUNBLFFBQUEsaUJBQUEsQ0FBQSxNQUFBLGtCQUFBO0FDNUpBLFFBQUEsT0FBQTtFQUNBLFdBQUEsbUJBQUEsQ0FBQSxnQkFBQSxVQUFBLFNBQUEsY0FBQSxRQUFBO0VBQ0EsSUFBQSxPQUFBOztFQUVBLEtBQUEsT0FBQSxhQUFBOztFQUVBLEtBQUEsYUFBQSxhQUFBO0VBQ0EsS0FBQSxRQUFBLGFBQUE7RUFDQSxLQUFBLFVBQUEsYUFBQTs7RUFFQSxPQUFBLE9BQUEsS0FBQTs7QUNWQSxTQUFBLGFBQUEsSUFBQSxhQUFBOzs7Ozs7Ozs7O0NBVUEsSUFBQSxhQUFBLFNBQUEsU0FBQTtFQUNBLFlBQUEsV0FBQSxRQUFBLE9BQUEsUUFBQTs7O0NBR0EsSUFBQSxRQUFBLFNBQUEsTUFBQTtFQUNBLFlBQUEsTUFBQSxLQUFBLE9BQUEsS0FBQTs7O0NBR0EsSUFBQSxVQUFBLFdBQUE7RUFDQSxZQUFBOzs7Q0FHQSxLQUFBLGFBQUE7Q0FDQSxLQUFBLFFBQUE7Q0FDQSxLQUFBLFVBQUE7Q0FDQSxLQUFBLFVBQUEsWUFBQTs7O0FBR0EsUUFBQSxPQUFBO0VBQ0EsUUFBQSxnQkFBQSxDQUFBLE1BQUEsZUFBQTtBQzdCQSxRQUFBLE9BQUE7RUFDQSxXQUFBLDhCQUFBLENBQUE7RUFDQSxTQUFBLHlCQUFBO0dBQ0EsSUFBQSxPQUFBOzs7R0FHQSxLQUFBLGFBQUEsd0JBQUE7Ozs7O0dBS0EsS0FBQSxlQUFBLHdCQUFBOzs7OztBQ1ZBLFNBQUEsd0JBQUEsZUFBQSxlQUFBO0NBQ0EsSUFBQSxVQUFBOztDQUVBLElBQUEsYUFBQSxXQUFBO0VBQ0EsT0FBQSxjQUFBLE1BQUEsU0FBQSxjQUFBOzs7Q0FHQSxJQUFBLGVBQUEsU0FBQSxVQUFBOzs7Q0FHQSxLQUFBLGFBQUE7Q0FDQSxLQUFBLGtCQUFBOzs7QUFHQSxRQUFBLE9BQUE7RUFDQSxRQUFBLDJCQUFBLENBQUEsaUJBQUEsaUJBQUEsMEJBQUEiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiYW5ndWxhci5tb2R1bGUoJ2J1ZGdldGluZ0lzRnVuJywgXHJcblx0W1xyXG5cdFx0J2FuZ3VsYXIuZmlsdGVyJywgXHJcblx0XHQnZmlyZWJhc2UnLCBcclxuXHRcdCdmaXJlYmFzZS5yZWYnLCBcclxuXHRcdCdmaXJlYmFzZS5hdXRoJyxcclxuXHRcdCdmaXJlYmFzZS5kYXRhYmFzZSdcclxuXHRdKVxyXG5cdC5jb250cm9sbGVyKCdCYXNlQ29udHJvbGxlcicsIGZ1bmN0aW9uKCRzY29wZSkge1xyXG5cdFx0JHNjb3BlLndlbGNvbWVNZXNzYWdlID0gJ1dlbGNvbWUgU2F2eSBCdWRnZXR0ZXInO1xyXG5cdH0pOyIsImFuZ3VsYXIubW9kdWxlKFwiY3VzdG9tRmlsdGVyc1wiLCBbXSlcclxuICAgIC5maWx0ZXIoXCJ1bmlxdWVcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZGF0YSwgcHJvcGVydHlOYW1lKSB7XHJcbiAgICAgICAgICAgIGlmIChhbmd1bGFyLmlzQXJyYXkoZGF0YSkgJiYgYW5ndWxhci5pc1N0cmluZyhwcm9wZXJ0eU5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgdmFyIGtleXMgPSB7fTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWwgPSBkYXRhW2ldW3Byb3BlcnR5TmFtZV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFuZ3VsYXIuaXNVbmRlZmluZWQoa2V5c1t2YWxdKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBrZXlzW3ZhbF0gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goZGF0YVtpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0cyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH0pO1xyXG4iLCIvKiBVc2luZyBGaXJlYmFzZSAzLjAuMyAqL1xyXG5cclxuZnVuY3Rpb24gYXV0aFNlcnZpY2UoJHEsICR0aW1lb3V0LCBBdXRoLCBEYXRhYmFzZSkge1xyXG5cdGNvbnNvbGUubG9nKEF1dGgpO1xyXG5cclxuXHR2YXIgdXNlciA9IHt9O1xyXG5cclxuXHR2YXIgbG9naW4gPSBmdW5jdGlvbihlbWFpbCwgcGFzc3dvcmQpIHtcclxuXHRcdEF1dGguJHNpZ25JbldpdGhFbWFpbEFuZFBhc3N3b3JkKGVtYWlsLCBwYXNzd29yZCk7XHJcblx0fTtcclxuXHJcblx0dmFyIHNpZ25PdXQgPSBmdW5jdGlvbigpIHtcclxuXHRcdEF1dGguJHNpZ25PdXQoKTtcclxuXHR9O1xyXG5cclxuXHQvL3JldHVybiBjdXJyZW50IHVzZXIgYXMgYSBwcm9taXNlXHJcblx0dmFyIGdldFVzZXIgPSBmdW5jdGlvbigpIHtcclxuXHRcdHJldHVybiB1c2VyO1xyXG5cdH07XHJcblxyXG5cdEF1dGguJG9uQXV0aFN0YXRlQ2hhbmdlZChmdW5jdGlvbihhdXRoRGF0YSkge1xyXG5cdFx0aWYoYXV0aERhdGEpIHtcclxuXHRcdFx0dXNlci5kYXRhID0gYXV0aERhdGE7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR1c2VyLmRhdGEgPSBudWxsO1xyXG5cdFx0fVxyXG5cdH0pO1xyXG5cclxuXHR2YXIgY3JlYXRlVXNlciA9IGZ1bmN0aW9uKGVtYWlsLCBwYXNzKSB7XHJcblx0XHRBdXRoLiRjcmVhdGVVc2VyV2l0aEVtYWlsQW5kUGFzc3dvcmQoZW1haWwsIHBhc3MpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHJldHVybiBBdXRoLiRzaWduSW5XaXRoRW1haWxBbmRQYXNzd29yZChlbWFpbCwgcGFzcyk7XHJcblx0XHRcdH0pXHJcblx0XHRcdC50aGVuKGNyZWF0ZVByb2ZpbGUpO1xyXG5cclxuXHRcdGZ1bmN0aW9uIGNyZWF0ZVByb2ZpbGUobmV3VXNlcikge1xyXG5cdFx0XHR2YXIgcmVmID0gRGF0YWJhc2UucmVmKCd1c2Vycy8nICsgbmV3VXNlci51aWQpLCBkZWYgPSAkcS5kZWZlcigpO1xyXG5cdFx0XHRjb25zb2xlLmxvZyhyZWYpO1xyXG5cdFx0XHRyZWYuc2V0KHtlbWFpbDogbmV3VXNlci5lbWFpbCwgbmFtZTogZmlyc3RQYXJ0T2ZFbWFpbChuZXdVc2VyLmVtYWlsKSwgYnVkZ2V0czoge30sIGluY29tZXM6IHt9fSwgXHJcblx0XHRcdFx0ZnVuY3Rpb24oZXJyKSB7XHJcblx0XHRcdFx0XHQkdGltZW91dChmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0aWYoIGVyciApIHtcclxuXHRcdFx0XHRcdFx0XHRkZWYucmVqZWN0KGVycik7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRcdFx0ZGVmLnJlc29sdmUocmVmKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdHJldHVybiBkZWYucHJvbWlzZTtcclxuXHRcdH1cclxuXHR9O1xyXG5cclxuXHRmdW5jdGlvbiBmaXJzdFBhcnRPZkVtYWlsKGVtYWlsKSB7XHJcbiAgICAgIHJldHVybiB1Y2ZpcnN0KGVtYWlsLnN1YnN0cigwLCBlbWFpbC5pbmRleE9mKCdAJykpfHwnJyk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdWNmaXJzdCAoc3RyKSB7XHJcbiAgICAgIC8vIGluc3BpcmVkIGJ5OiBodHRwOi8va2V2aW4udmFuem9ubmV2ZWxkLm5ldFxyXG4gICAgICBzdHIgKz0gJyc7XHJcbiAgICAgIHZhciBmID0gc3RyLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpO1xyXG4gICAgICByZXR1cm4gZiArIHN0ci5zdWJzdHIoMSk7XHJcbiAgICB9XHJcbiAgICBcclxuXHR0aGlzLmNyZWF0ZVVzZXIgPSBjcmVhdGVVc2VyO1xyXG5cdHRoaXMubG9naW4gPSBsb2dpbjtcclxuXHR0aGlzLnNpZ25PdXQgPSBzaWduT3V0O1xyXG5cdHRoaXMuZ2V0VXNlciA9IGdldFVzZXI7XHJcbn1cclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdidWRnZXRpbmdJc0Z1bicpXHJcblx0LnNlcnZpY2UoJ2F1dGhTZXJ2aWNlJywgWyckcScsICckdGltZW91dCcsICdBdXRoJywgJ0RhdGFiYXNlJywgYXV0aFNlcnZpY2VdKTsiLCJhbmd1bGFyLm1vZHVsZSgnYnVkZ2V0aW5nSXNGdW4nKVxyXG5cdC5jb250cm9sbGVyKCdCdWRnZXRDb250cm9sbGVyJywgWydidWRnZXRTZXJ2aWNlJywgJ2luY29tZVNlcnZpY2UnLCBmdW5jdGlvbihidWRnZXRTZXJ2aWNlLCBpbmNvbWVTZXJ2aWNlKSB7XHJcblx0XHR2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gIFx0XHQvL2luaXQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cdFx0c2VsZi5idWRnZXRzID0gW107XHJcblx0XHRzZWxmLmJ1ZGdldEl0ZW1zID0gW107XHJcbiAgXHRcdFxyXG4gIFx0XHQvL0dldCBidWRnZXRzIGFuZCBidWRnZXQgaXRlbXNcclxuICBcdFx0YnVkZ2V0U2VydmljZS5nZXRBbGxCdWRnZXRzKClcclxuICBcdFx0XHQudGhlbihmdW5jdGlvbihidWRnZXRzKSB7XHJcbiAgXHRcdFx0XHRzZWxmLmJ1ZGdldHMgPSBidWRnZXRzO1xyXG4gIFx0XHRcdFx0YnVkZ2V0U2VydmljZS5nZXRBbGxCdWRnZXRJdGVtcygpXHJcbiAgXHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uKGl0ZW1zKSB7XHJcbiAgXHRcdFx0XHRcdFx0c2VsZi5idWRnZXRJdGVtcyA9IGl0ZW1zO1xyXG4gIFx0XHRcdFx0XHR9LCBmdW5jdGlvbihlcnIpIHtcclxuICBcdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpO1xyXG4gIFx0XHRcdFx0XHR9KTtcclxuICBcdFx0XHR9LCBmdW5jdGlvbihlcnIpIHtcclxuICBcdFx0XHRcdGNvbnNvbGUubG9nKGVycik7XHJcbiAgXHRcdFx0fSk7XHJcblxyXG4gIFx0XHQvL2luaXQgZW5kLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuICBcdFx0Ly9hY3Rpb25zLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHRcdHNlbGYubmV3QnVkZ2V0ID0ge307XHJcblxyXG5cdFx0c2VsZi5zYXZlQnVkZ2V0ID0gZnVuY3Rpb24obmV3QnVkZ2V0KSB7XHJcblx0XHRcdGJ1ZGdldFNlcnZpY2Uuc2F2ZUJ1ZGdldChuZXdCdWRnZXQpO1xyXG5cdFx0XHRzZWxmLm5ld0J1ZGdldCA9IHt9O1xyXG5cdFx0fTtcclxuXHJcblx0XHRzZWxmLm5ld0J1ZGdldEl0ZW0gPSB7fTtcclxuXHJcblx0XHRzZWxmLnNhdmVCdWRnZXRJdGVtID0gZnVuY3Rpb24obmV3QnVkZ2V0SXRlbSkge1xyXG5cdFx0XHRidWRnZXRTZXJ2aWNlLnNhdmVCdWRnZXRJdGVtKG5ld0J1ZGdldEl0ZW0pO1xyXG5cdFx0XHRzZWxmLm5ld0J1ZGdldEl0ZW0gPSB7fTtcclxuXHRcdH07XHJcblxyXG5cdFx0c2VsZi5idWRnZXRDYXAgPSBidWRnZXRTZXJ2aWNlLmJ1ZGdldENhcDtcclxuXHRcdHNlbGYuYnVkZ2V0VXRpbGl6YXRpb24gPSBidWRnZXRTZXJ2aWNlLmJ1ZGdldFV0aWxpemF0aW9uO1xyXG5cdFx0c2VsZi5idWRnZXRCYWxhbmNlID0gYnVkZ2V0U2VydmljZS5idWRnZXRCYWxhbmNlO1xyXG5cdFx0c2VsZi5ndWlkZWxpbmVUb3RhbCA9IGJ1ZGdldFNlcnZpY2UuZ3VpZGVsaW5lVG90YWw7XHJcblx0XHRzZWxmLnRheFV0aWxpemF0aW9uID0gYnVkZ2V0U2VydmljZS50YXhVdGlsaXphdGlvbjtcclxuXHRcdHNlbGYub3ZlcnZpZXdVdGlsaXphdGlvblRvdGFsID0gYnVkZ2V0U2VydmljZS5vdmVydmlld1V0aWxpemF0aW9uVG90YWw7XHJcblx0XHRzZWxmLnRvdGFsID0gYnVkZ2V0U2VydmljZS50b3RhbDtcclxuXHJcblx0XHQvL2FjdGlvbnMgZW5kLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cdH1dKTsiLCJmdW5jdGlvbiBidWRnZXRTZXJ2aWNlKCRxLCBkZXBsb3lkU2VydmljZSwgaW5jb21lU2VydmljZSwgZGF0YVNlcnZpY2UpIHtcclxuXHR2YXIgYnVkZ2V0cyA9IFtdO1xyXG5cdHZhciBidWRnZXRJdGVtcyA9IFtdO1xyXG5cclxuXHQvL0dldHMgYW5kIFNhdmVzLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblx0Ly9idWRnZXRzXHJcblx0dmFyIGdldEFsbEJ1ZGdldHMgPSBmdW5jdGlvbigpIHtcclxuXHRcdGlmKGJ1ZGdldHMubGVuZ3RoICE9IDApe1xyXG5cdFx0XHRyZXR1cm4gJHEud2hlbihidWRnZXRzKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBkZXBsb3lkU2VydmljZS5nZXRBbGxCdWRnZXRzKClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oYWxsQnVkZ2V0cykge1xyXG5cdFx0XHRcdGJ1ZGdldHMgPSBhbGxCdWRnZXRzO1xyXG5cdFx0XHRcdHJldHVybiBidWRnZXRzO1xyXG5cdFx0XHR9KTtcclxuXHR9O1xyXG5cclxuXHR2YXIgc2F2ZUJ1ZGdldCA9IGZ1bmN0aW9uKG5ld0J1ZGdldCkge1xyXG5cdFx0ZGVwbG95ZFNlcnZpY2Uuc2F2ZUJ1ZGdldChuZXdCdWRnZXQpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKG5ld0J1ZGdldCkge1xyXG5cdFx0XHRcdGJ1ZGdldHMucHVzaChuZXdCdWRnZXQpO1xyXG5cdFx0XHR9LCBmdW5jdGlvbihlcnIpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpO1xyXG5cdFx0XHR9KTtcclxuXHR9O1xyXG5cclxuXHR2YXIgZ2V0QnVkZ2V0ID0gZnVuY3Rpb24oYnVkZ2V0SWQpIHtcclxuXHRcdGRlcGxveWRTZXJ2aWNlLmdldEJ1ZGdldChidWRnZXRJZClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oYnVkZ2V0KSB7XHJcblx0XHRcdFx0cmV0dXJuIGJ1ZGdldDtcclxuXHRcdFx0fSwgZnVuY3Rpb24oZXJyKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coZXJyKTtcclxuXHRcdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdFx0fSk7XHJcblx0fTtcclxuXHJcblx0Ly9idWRnZXQtaXRlbXNcclxuXHR2YXIgZ2V0QWxsQnVkZ2V0SXRlbXMgPSBmdW5jdGlvbigpIHtcclxuXHRcdGlmKGJ1ZGdldEl0ZW1zLmxlbmd0aCAhPSAwKXtcclxuXHRcdFx0cmV0dXJuICRxLndoZW4oYnVkZ2V0SXRlbXMpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGRlcGxveWRTZXJ2aWNlLmdldEFsbEJ1ZGdldEl0ZW1zKClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oYWxsQnVkZ2V0SXRlbXMpIHtcclxuXHRcdFx0XHRidWRnZXRJdGVtcyA9IGFsbEJ1ZGdldEl0ZW1zO1xyXG5cdFx0XHRcdHJldHVybiBidWRnZXRJdGVtcztcclxuXHRcdFx0fSk7XHJcblx0fTtcclxuXHJcblx0dmFyIHNhdmVCdWRnZXRJdGVtID0gZnVuY3Rpb24obmV3QnVkZ2V0SXRlbSkge1xyXG5cdFx0ZGVwbG95ZFNlcnZpY2Uuc2F2ZUJ1ZGdldEl0ZW0obmV3QnVkZ2V0SXRlbSlcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24obmV3QnVkZ2V0SXRlbSkge1xyXG5cdFx0XHRcdGJ1ZGdldEl0ZW1zLnB1c2gobmV3QnVkZ2V0SXRlbSk7XHJcblx0XHRcdH0sIGZ1bmN0aW9uKGVycikge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKGVycik7XHJcblx0XHRcdH0pO1xyXG5cdH07XHJcblx0Ly9FbmQgR2V0cyBhbmQgU2F2ZXMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuXHQvL1N0YXRpc3RpY3MgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblx0dmFyIHRvdGFsID0gZnVuY3Rpb24oYnVkZ2V0KSB7XHJcblx0XHRyZXR1cm4gYnVkZ2V0SXRlbXMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cnIpIHtcclxuXHRcdFx0aWYoY3Vyci5idWRnZXRJZCA9PSBidWRnZXQuaWQpXHJcblx0XHRcdFx0cmV0dXJuIHByZXYgKyBjdXJyLmFtb3VudDtcclxuXHRcdFx0cmV0dXJuIHByZXY7XHJcblx0XHR9LCAwKTtcclxuXHR9O1xyXG5cclxuXHR2YXIgdG90YWxDb3JlID0gZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgdG90YWxDb3JlID0gMDtcclxuXHJcblx0XHRhbmd1bGFyLmZvckVhY2goYnVkZ2V0cywgZnVuY3Rpb24oYnVkZ2V0KSB7XHJcblx0XHRcdGlmKGJ1ZGdldC5uYW1lID09ICdGaXhlZCcgfHwgYnVkZ2V0Lm5hbWUgPT0gJ0ZsZXgnKSB7XHJcblx0XHRcdFx0dmFyIHggPSB0b3RhbChidWRnZXQpO1xyXG5cdFx0XHRcdHRvdGFsQ29yZSArPSB4O1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxuXHJcblx0XHRyZXR1cm4gdG90YWxDb3JlO1xyXG5cdH07XHJcblxyXG5cdHZhciB0b3RhbEFsbCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0cmV0dXJuIGJ1ZGdldEl0ZW1zLnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXJyKSB7XHJcblx0XHRcdHJldHVybiBwcmV2ICsgY3Vyci5hbW91bnQ7XHJcblx0XHR9LCAwKTtcclxuXHR9O1xyXG5cclxuXHR2YXIgYnVkZ2V0Q2FwID0gZnVuY3Rpb24oYnVkZ2V0KSB7XHJcblx0XHRyZXR1cm4gYnVkZ2V0LnBlcmNlbnRBbGxvdG1lbnQgLyAxMDAgKiBpbmNvbWVTZXJ2aWNlLnRvdGFsKCduZXQnKTtcclxuXHR9O1xyXG5cclxuXHR2YXIgYnVkZ2V0VXRpbGl6YXRpb24gPSBmdW5jdGlvbihidWRnZXQpIHtcclxuXHRcdHJldHVybiB0b3RhbChidWRnZXQpIC8gaW5jb21lU2VydmljZS50b3RhbCgnZ3Jvc3MnKSAqIDEwMDtcclxuXHR9O1xyXG5cclxuXHR2YXIgYnVkZ2V0QmFsYW5jZSA9IGZ1bmN0aW9uKGJ1ZGdldCkge1xyXG5cdFx0cmV0dXJuIGJ1ZGdldENhcChidWRnZXQpIC0gdG90YWwoYnVkZ2V0KTtcclxuXHR9O1xyXG5cclxuXHR2YXIgZ3VpZGVsaW5lVG90YWwgPSBmdW5jdGlvbigpIHtcclxuXHRcdHJldHVybiBidWRnZXRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXJyKSB7XHJcblx0XHRcdHJldHVybiBwcmV2ICsgY3Vyci5wZXJjZW50QWxsb3RtZW50O1xyXG5cdFx0fSwgMCk7XHJcblx0fTtcclxuXHJcblx0dmFyIHRheFV0aWxpemF0aW9uID0gZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgZ3Jvc3NJbmNvbWUgPSBpbmNvbWVTZXJ2aWNlLnRvdGFsKCdncm9zcycpO1xyXG5cdFx0dmFyIG5ldEluY29tZSA9IGluY29tZVNlcnZpY2UudG90YWwoJ25ldCcpO1xyXG5cclxuXHRcdHJldHVybiAoZ3Jvc3NJbmNvbWUgLSBuZXRJbmNvbWUpIC8gZ3Jvc3NJbmNvbWUgKiAxMDA7XHJcblx0fTtcclxuXHJcblx0dmFyIG92ZXJ2aWV3VXRpbGl6YXRpb25Ub3RhbCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0cmV0dXJuIGJ1ZGdldHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cnIpIHtcclxuXHRcdFx0cmV0dXJuIHByZXYgKyBidWRnZXRVdGlsaXphdGlvbihjdXJyKTtcclxuXHRcdH0sIHRheFV0aWxpemF0aW9uKCkpO1xyXG5cdH07XHJcblx0Ly9FbmQgU3RhdGlzdGljcyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuXHR0aGlzLmdldEFsbEJ1ZGdldHMgPSBnZXRBbGxCdWRnZXRzO1xyXG5cdHRoaXMuc2F2ZUJ1ZGdldCA9IHNhdmVCdWRnZXQ7XHJcblx0dGhpcy5nZXRCdWRnZXQgPSBnZXRCdWRnZXQ7XHJcblx0dGhpcy5nZXRBbGxCdWRnZXRJdGVtcyA9IGdldEFsbEJ1ZGdldEl0ZW1zO1xyXG5cdHRoaXMuc2F2ZUJ1ZGdldEl0ZW0gPSBzYXZlQnVkZ2V0SXRlbTtcclxuXHR0aGlzLnRvdGFsID0gdG90YWw7XHJcblx0dGhpcy50b3RhbENvcmUgPSB0b3RhbENvcmU7XHJcblx0dGhpcy50b3RhbEFsbCA9IHRvdGFsQWxsO1xyXG5cclxuXHR0aGlzLmJ1ZGdldENhcCA9IGJ1ZGdldENhcDtcclxuXHR0aGlzLmJ1ZGdldFV0aWxpemF0aW9uID0gYnVkZ2V0VXRpbGl6YXRpb247XHJcblx0dGhpcy5idWRnZXRCYWxhbmNlID0gYnVkZ2V0QmFsYW5jZTtcclxuXHR0aGlzLmd1aWRlbGluZVRvdGFsID0gZ3VpZGVsaW5lVG90YWw7XHJcblx0dGhpcy50YXhVdGlsaXphdGlvbiA9IHRheFV0aWxpemF0aW9uO1xyXG5cdHRoaXMub3ZlcnZpZXdVdGlsaXphdGlvblRvdGFsID0gb3ZlcnZpZXdVdGlsaXphdGlvblRvdGFsO1xyXG59XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnYnVkZ2V0aW5nSXNGdW4nKVxyXG5cdC5zZXJ2aWNlKCdidWRnZXRTZXJ2aWNlJywgWyckcScsICdkZXBsb3lkU2VydmljZScsICdpbmNvbWVTZXJ2aWNlJywgJ2RhdGFTZXJ2aWNlJywgYnVkZ2V0U2VydmljZV0pOyIsIi8qIEZpcmViYXNlIDMuMC4zIEltcGxlbWVudGF0aW9uICovXHJcblxyXG5mdW5jdGlvbiBkYXRhU2VydmljZSgkcSwgJHRpbWVvdXQsIERhdGFiYXNlLCBBdXRoKSB7XHJcblx0Ly9EYXRhXHJcblx0Ly9idWRnZXRzXHJcblxyXG59XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnYnVkZ2V0aW5nSXNGdW4nKVxyXG5cdC5zZXJ2aWNlKCdkYXRhU2VydmljZScsIFsnJHEnLCAnJHRpbWVvdXQnLCAnRGF0YWJhc2UnLCAnQXV0aCcsIGRhdGFTZXJ2aWNlXSk7IiwiZnVuY3Rpb24gZmlyZWJhc2VBdXRoKCRmaXJlYmFzZUF1dGgsIFJlZikge1xyXG5cdHJldHVybiAkZmlyZWJhc2VBdXRoKFJlZi5hdXRoKCkpO1xyXG59XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnZmlyZWJhc2UuYXV0aCcsIFsnZmlyZWJhc2UnLCAnZmlyZWJhc2UucmVmJ10pXHJcblx0LmZhY3RvcnkoJ0F1dGgnLCBbJyRmaXJlYmFzZUF1dGgnLCAnUmVmJywgZmlyZWJhc2VBdXRoXSk7IiwiYW5ndWxhci5tb2R1bGUoJ2ZpcmViYXNlLmNvbmZpZycsIFtdKVxyXG4gIC5jb25zdGFudCgnRkJQUk9KJywgJ3Byb2plY3QtNTMyOTIxNjc3ODE1MDM0NjEwMicpOyIsImZ1bmN0aW9uIGZpcmViYXNlRGF0YWJhc2UoUmVmKSB7XHJcblx0cmV0dXJuIFJlZi5kYXRhYmFzZSgpO1xyXG59XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnZmlyZWJhc2UuZGF0YWJhc2UnLCBbJ2ZpcmViYXNlJywgJ2ZpcmViYXNlLnJlZiddKVxyXG5cdC5mYWN0b3J5KCdEYXRhYmFzZScsIFsnUmVmJywgZmlyZWJhc2VEYXRhYmFzZV0pOyIsImZ1bmN0aW9uIGZpcmViYXNlRmFjdG9yeShGQlBST0opIHtcclxuXHR2YXIgY29uZmlnID0ge1xyXG4gICAgICBhcGlLZXk6IFwiQUl6YVN5Q09xeHlxSldIYlZYUW9SZTV5ZUREY2tERmFlekNXR0ZRXCIsXHJcbiAgICAgIGF1dGhEb21haW46IEZCUFJPSiArIFwiLmZpcmViYXNlYXBwLmNvbVwiLFxyXG4gICAgICBkYXRhYmFzZVVSTDogXCJodHRwczovL1wiICsgRkJQUk9KICsgXCIuZmlyZWJhc2Vpby5jb21cIixcclxuICAgICAgc3RvcmFnZUJ1Y2tldDogXCJcIixcclxuICAgIH07XHJcbiAgICBmaXJlYmFzZS5pbml0aWFsaXplQXBwKGNvbmZpZyk7XHJcblxyXG4gICAgcmV0dXJuIGZpcmViYXNlO1xyXG59XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnZmlyZWJhc2UucmVmJywgWydmaXJlYmFzZScsICdmaXJlYmFzZS5jb25maWcnXSlcclxuXHQuZmFjdG9yeSgnUmVmJywgWydGQlBST0onLCBmaXJlYmFzZUZhY3RvcnldKTsiLCJmdW5jdGlvbiBkZXBsb3lkU2VydmljZSgkaHR0cCwgJHEsIGRlcGxveWQpIHtcclxuXHQvL2J1ZGdldHNcclxuXHR2YXIgYnVkZ2V0cyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuXHJcblx0XHQkaHR0cC5nZXQoZGVwbG95ZCArICcvYnVkZ2V0cycpXHJcblx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKGJ1ZGdldHMpIHtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKGJ1ZGdldHMpO1xyXG5cdFx0XHR9KS5lcnJvcihmdW5jdGlvbihlcnIpIHtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZWplY3QoZXJyKTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2U7XHJcblx0fTtcclxuXHJcblx0dmFyIHNhdmVCdWRnZXQgPSBmdW5jdGlvbihuZXdCdWRnZXQpIHtcclxuXHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XHJcblxyXG5cdFx0JGh0dHAucG9zdChkZXBsb3lkICsgJy9idWRnZXRzJywge1xyXG5cdFx0XHRuYW1lOiBuZXdCdWRnZXQubmFtZSxcclxuXHRcdFx0cGVyY2VudEFsbG90bWVudDogbmV3QnVkZ2V0LnBlcmNlbnRcclxuXHRcdH0pLnN1Y2Nlc3MoZnVuY3Rpb24oYnVkZ2V0KSB7XHJcblx0XHRcdGRlZmVycmVkLnJlc29sdmUoYnVkZ2V0KTtcclxuXHRcdH0pLmVycm9yKGZ1bmN0aW9uKGVycikge1xyXG5cdFx0XHRkZWZlcnJlZC5yZWplY3QoZXJyKTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xyXG5cdH07XHJcblxyXG5cdHZhciBnZXRCdWRnZXQgPSBmdW5jdGlvbihidWRnZXRJZCkge1xyXG5cdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuXHJcblx0XHQkaHR0cC5nZXQoZGVwbG95ZCArICcvYnVkZ2V0cycsIHtcclxuXHRcdFx0aWQ6IGJ1ZGdldElkXHJcblx0XHR9KS5zdWNjZXNzKGZ1bmN0aW9uKGJ1ZGdldCl7XHJcblx0XHRcdGRlZmVycmVkLnJlc29sdmUoYnVkZ2V0KTtcclxuXHRcdH0pLmVycm9yKGZ1bmN0aW9uKGVycikge1xyXG5cdFx0XHRkZWZlcnJlZC5yZWplY3QoZXJyKTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xyXG5cdH07XHJcblxyXG5cdHZhciBidWRnZXRJdGVtcyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuXHJcblx0XHQkaHR0cC5nZXQoZGVwbG95ZCArICcvYnVkZ2V0LWl0ZW1zJylcclxuXHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24oaXRlbXMpIHtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKGl0ZW1zKTtcclxuXHRcdFx0fSkuZXJyb3IoZnVuY3Rpb24oZXJyKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coZXJyKTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2U7XHJcblx0fTtcclxuXHJcblx0dmFyIHNhdmVCdWRnZXRJdGVtID0gZnVuY3Rpb24obmV3QnVkZ2V0SXRlbSkge1xyXG5cdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuXHJcblx0XHQkaHR0cC5wb3N0KGRlcGxveWQgKyAnL2J1ZGdldC1pdGVtcycsIHtcclxuXHRcdFx0bmFtZTogbmV3QnVkZ2V0SXRlbS5uYW1lLFxyXG5cdFx0XHRhbW91bnQ6IG5ld0J1ZGdldEl0ZW0uYW1vdW50LFxyXG5cdFx0XHRidWRnZXRJZDogbmV3QnVkZ2V0SXRlbS5idWRnZXQuaWRcclxuXHRcdH0pLnN1Y2Nlc3MoZnVuY3Rpb24obmV3QnVkZ2V0SXRlbSkge1xyXG5cdFx0XHRkZWZlcnJlZC5yZXNvbHZlKG5ld0J1ZGdldEl0ZW0pO1xyXG5cdFx0fSkuZXJyb3IoZnVuY3Rpb24oZXJyKSB7XHJcblx0XHRcdGRlZmVycmVkLnJlamVjdChlcnIpO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2U7XHJcblx0fTtcclxuXHJcblx0Ly9pbmNvbWVzXHJcblx0dmFyIGluY29tZXMgPSBmdW5jdGlvbigpIHtcclxuXHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XHJcblxyXG5cdFx0JGh0dHAuZ2V0KGRlcGxveWQgKyAnL2luY29tZS1zb3VyY2VzJylcclxuXHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24oaW5jb21lcykge1xyXG5cdFx0XHRcdGRlZmVycmVkLnJlc29sdmUoaW5jb21lcyk7XHJcblx0XHRcdH0pLmVycm9yKGZ1bmN0aW9uKGVycikge1xyXG5cdFx0XHRcdGRlZmVycmVkLnJlamVjdChlcnIpO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcclxuXHR9O1xyXG5cclxuXHR2YXIgc2F2ZUluY29tZSA9IGZ1bmN0aW9uKG5ld0luY29tZSkge1xyXG5cdFx0dmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcclxuXHJcblx0XHQkaHR0cC5wb3N0KGRlcGxveWQgKyAnL2luY29tZS1zb3VyY2VzJywge1xyXG5cdFx0XHRqb2I6IG5ld0luY29tZS5qb2IsXHJcblx0XHRcdGluY29tZVR5cGVJZDogbmV3SW5jb21lLmluY29tZVR5cGUuaWQsXHJcblx0XHRcdHBheXJhdGU6IG5ld0luY29tZS5wYXlyYXRlLFxyXG5cdFx0XHRob3VyczogbmV3SW5jb21lLmhvdXJzLFxyXG5cdFx0XHR0YXhQZXJjZW50OiBuZXdJbmNvbWUudGF4UGVyY2VudFxyXG5cdFx0fSkuc3VjY2VzcyhmdW5jdGlvbihpbmNvbWUpIHtcclxuXHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShpbmNvbWUpO1xyXG5cdFx0fSkuZXJyb3IoZnVuY3Rpb24oZXJyKSB7XHJcblx0XHRcdGRlZmVycmVkLnJlamVjdChlcnIpO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2U7XHJcblx0fTtcclxuXHJcblx0Ly9pbmNvbWUtdHlwZXNcclxuXHR2YXIgaW5jb21lVHlwZXMgPSBmdW5jdGlvbigpIHtcclxuXHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XHJcblxyXG5cdFx0JGh0dHAuZ2V0KGRlcGxveWQgKyAnL2luY29tZS10eXBlcycpXHJcblx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKGluY29tZVR5cGVzKSB7XHJcblx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShpbmNvbWVUeXBlcyk7XHJcblx0XHRcdH0pLmVycm9yKGZ1bmN0aW9uKGVycikge1xyXG5cdFx0XHRcdGRlZmVycmVkLnJlamVjdChlcnIpO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcclxuXHR9XHJcblxyXG5cdHZhciBpbmNvbWVUeXBlID0gZnVuY3Rpb24oaWQpIHtcclxuXHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XHJcblxyXG5cdFx0JGh0dHAuZ2V0KGRlcGxveWQgKyAnL2luY29tZS10eXBlcz9pZD0nICsgaWQpXHJcblx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKGluY29tZVR5cGUpIHtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKHR5cGUpO1xyXG5cdFx0XHR9KS5lcnJvcihmdW5jdGlvbihlcnIpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xyXG5cdH07XHJcblxyXG5cdHRoaXMuZ2V0QWxsQnVkZ2V0cyA9IGJ1ZGdldHM7XHJcblx0dGhpcy5zYXZlQnVkZ2V0ID0gc2F2ZUJ1ZGdldDtcclxuXHR0aGlzLmdldEFsbEJ1ZGdldEl0ZW1zID0gYnVkZ2V0SXRlbXM7XHJcblx0dGhpcy5zYXZlQnVkZ2V0SXRlbSA9IHNhdmVCdWRnZXRJdGVtO1xyXG5cdHRoaXMuZ2V0QnVkZ2V0ID0gZ2V0QnVkZ2V0O1xyXG5cclxuXHR0aGlzLmdldEFsbEluY29tZXMgPSBpbmNvbWVzO1xyXG5cdHRoaXMuc2F2ZUluY29tZSA9IHNhdmVJbmNvbWU7XHJcblxyXG5cdHRoaXMuZ2V0QWxsSW5jb21lVHlwZXMgPSBpbmNvbWVUeXBlcztcclxuXHR0aGlzLmdldEluY29tZVR5cGUgPSBpbmNvbWVUeXBlO1xyXG59XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnYnVkZ2V0aW5nSXNGdW4nKVxyXG5cdC5jb25zdGFudCgnZGVwbG95ZCcsICdodHRwOi8vbG9jYWxob3N0OjI0MDMnKVxyXG5cdC5zZXJ2aWNlKCdkZXBsb3lkU2VydmljZScsIFsnJGh0dHAnLCAnJHEnLCAnZGVwbG95ZCcsIGRlcGxveWRTZXJ2aWNlXSk7IiwiYW5ndWxhci5tb2R1bGUoJ2J1ZGdldGluZ0lzRnVuJylcclxuXHQuY29udHJvbGxlcignSW5jb21lQ29udHJvbGxlcicsIFsnaW5jb21lU2VydmljZScsIFxyXG5cdFx0ZnVuY3Rpb24oaW5jb21lU2VydmljZSkge1xyXG5cdFx0XHR2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG5cdFx0XHQvL2luaXQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblx0XHRcdHNlbGYuaW5jb21lcyA9IFtdO1xyXG5cdFx0XHRzZWxmLmluY29tZVR5cGVzID0gW107XHJcblxyXG5cdFx0XHQvL0dldCBpbmNvbWVzXHJcblx0XHRcdGluY29tZVNlcnZpY2UuZ2V0QWxsSW5jb21lcygpXHJcblx0XHRcdFx0LnRoZW4oZnVuY3Rpb24oaW5jb21lcykge1xyXG5cdFx0XHRcdFx0c2VsZi5pbmNvbWVzID0gaW5jb21lcztcclxuXHRcdFx0XHR9LCBmdW5jdGlvbihlcnIpIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKGVycik7XHJcblx0XHRcdFx0fSk7XHJcblxyXG5cdFx0XHQvL0dldCBpbmNvbWVUeXBlc1xyXG5cdFx0XHRpbmNvbWVTZXJ2aWNlLmdldEFsbEluY29tZVR5cGVzKClcclxuXHRcdFx0XHQudGhlbihmdW5jdGlvbihpbmNvbWVUeXBlcykge1xyXG5cdFx0XHRcdFx0c2VsZi5pbmNvbWVUeXBlcyA9IGluY29tZVR5cGVzO1xyXG5cdFx0XHRcdH0sIGZ1bmN0aW9uKGVycikge1xyXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coZXJyKTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0Ly9pbml0IGVuZC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuXHRcdFx0Ly9hY3Rpb25zLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cdFx0XHRzZWxmLm5ld0luY29tZSA9IHt9O1xyXG5cclxuXHRcdFx0c2VsZi5zYXZlSW5jb21lID0gZnVuY3Rpb24obmV3SW5jb21lKSB7XHJcblx0XHRcdFx0aW5jb21lU2VydmljZS5zYXZlSW5jb21lKG5ld0luY29tZSk7XHJcblx0XHRcdFx0c2VsZi5uZXdJbmNvbWUgPSB7fTtcclxuXHRcdFx0fTtcclxuXHJcblx0XHRcdHNlbGYucGF5SW5mbyA9IHt9O1xyXG5cdFx0XHRzZWxmLmNhbGN1bGF0ZWRQYXlyYXRlID0gMDtcclxuXHRcdFx0c2VsZi5jYWxjdWxhdGVkSG91cnMgPSAwO1xyXG5cclxuXHRcdFx0c2VsZi5jYWxjdWxhdGVQYXlyYXRlID0gZnVuY3Rpb24ocGF5SW5mbykge1xyXG5cdFx0XHRcdHNlbGYuY2FsY3VsYXRlZFBheXJhdGUgPSBpbmNvbWVTZXJ2aWNlLmNhbGN1bGF0ZVBheXJhdGUocGF5SW5mby5pbmNvbWVUeXBlLCBwYXlJbmZvLndhZ2UsIHBheUluZm8uaG91cnMpO1xyXG5cdFx0XHRcdHNlbGYuY2FsY3VsYXRlZEhvdXJzID0gKHBheUluZm8uaG91cnMpID8gcGF5SW5mby5ob3VycyA6IDQwO1xyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0c2VsZi50b3RhbFllYXJseUdyb3NzID0gaW5jb21lU2VydmljZS50b3RhbFllYXJseUdyb3NzO1xyXG5cdFx0XHRzZWxmLnRvdGFsWWVhcmx5TmV0ID0gaW5jb21lU2VydmljZS50b3RhbFllYXJseU5ldDtcclxuXHRcdFx0c2VsZi50b3RhbFllYXJseVRheCA9IGluY29tZVNlcnZpY2UudG90YWxZZWFybHlUYXg7XHJcblx0XHRcdHNlbGYudG90YWwgPSBpbmNvbWVTZXJ2aWNlLnRvdGFsO1xyXG5cdFx0XHQvL2FjdGlvbnMgZW5kLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblx0fV0pOyIsIi8vbm9ybWFsaXplIGluY29tZSBmbGVzaGluZyBvdXQgZ3Jvc3MgYW5kIG5ldCBudW1iZXJzXHJcbmZ1bmN0aW9uIG5vcm1hbGl6ZUluY29tZXMoaW5jb21lcykge1xyXG5cdGlmKCFhbmd1bGFyLmlzQXJyYXkoaW5jb21lcykpXHJcblx0XHRpbmNvbWVzID0gW2luY29tZXNdO1xyXG5cclxuXHR2YXIgbm9ybWFsaXplZEluY29tZXMgPSBbXTtcclxuXHJcblx0YW5ndWxhci5mb3JFYWNoKGluY29tZXMsIGZ1bmN0aW9uKGluY29tZSkge1xyXG5cdFx0dmFyIG5vcm1JbmNvbWUgPSB7fTtcclxuXHJcblx0XHRub3JtSW5jb21lLmpvYiA9IGluY29tZS5qb2I7XHJcblx0XHRub3JtSW5jb21lLnBheXJhdGUgPSBpbmNvbWUucGF5cmF0ZTtcclxuXHRcdG5vcm1JbmNvbWUuaG91cnMgPSBpbmNvbWUuaG91cnM7XHJcblx0XHRub3JtSW5jb21lLmdyb3NzID0gaW5jb21lLnBheXJhdGUgKiBpbmNvbWUuaG91cnMgKiA0O1xyXG5cdFx0bm9ybUluY29tZS50YXggPSBpbmNvbWUudGF4UGVyY2VudDtcclxuXHRcdG5vcm1JbmNvbWUubmV0ID0gbm9ybUluY29tZS5ncm9zcyAqICgxIC0gKGluY29tZS50YXhQZXJjZW50IC8gMTAwKSk7XHJcblx0XHRub3JtSW5jb21lLmJpd2Vla2x5ID0gbm9ybUluY29tZS5uZXQgLyAyO1xyXG5cclxuXHRcdG5vcm1hbGl6ZWRJbmNvbWVzLnB1c2gobm9ybUluY29tZSk7XHJcblx0fSlcclxuXHJcblx0cmV0dXJuIG5vcm1hbGl6ZWRJbmNvbWVzO1xyXG59XHJcblxyXG4vL3JldHVybiBob3VycyBiYXNlZCBvbiBpbmNvbWUgdHlwZVxyXG5mdW5jdGlvbiBnZXRIb3Vycyh0eXBlKSB7XHJcblx0c3dpdGNoKHR5cGUpe1xyXG5cdFx0Y2FzZSAnV2Vla2x5JzpcclxuXHRcdGNhc2UgJ0JpLVdlZWtseSc6XHJcblx0XHRjYXNlICdZZWFybHknOlxyXG5cdFx0XHRyZXR1cm4gNDA7XHJcblx0XHRjYXNlICdTZW1pLU1vbnRobHknOlxyXG5cdFx0Y2FzZSAnTW9udGhseSc6XHJcblx0XHRcdHJldHVybiAoNDAqMTMvMTIpOyAvLzEzIHdlZWsgbW9udGhzIGluIDEyIG1vbnRocyBiYXNlZCBvbiA1MiB3ZWVrcy95ZWFyXHJcblx0fVxyXG59XHJcblxyXG4vL2luY29tZSBzZXJ2aWNlIHByb3ZpZGVzIG1ldGhvZHMgdG8gYWRkIGFuZCBnZXQgaW5jb21lc1xyXG5mdW5jdGlvbiBpbmNvbWVTZXJ2aWNlKCRxLCBkZXBsb3lkU2VydmljZSkge1xyXG5cdHZhciBpbmNvbWVzID0gW107XHJcblx0dmFyIGluY29tZVR5cGVzID0gW107XHJcblxyXG5cdFxyXG5cdC8vR2V0cyBhbmQgU2F2ZXMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHQvL2luY29tZXNcclxuXHR2YXIgZ2V0QWxsSW5jb21lcyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0aWYoaW5jb21lcy5sZW5ndGggIT0gMCl7XHJcblx0XHRcdHJldHVybiAkcS53aGVuKGluY29tZXMpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGRlcGxveWRTZXJ2aWNlLmdldEFsbEluY29tZXMoKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihhbGxJbmNvbWVzKSB7XHJcblx0XHRcdFx0aW5jb21lcyA9IG5vcm1hbGl6ZUluY29tZXMoYWxsSW5jb21lcyk7XHJcblx0XHRcdFx0cmV0dXJuIGluY29tZXM7XHJcblx0XHRcdH0pO1xyXG5cdH07XHJcblxyXG5cdHZhciBzYXZlSW5jb21lID0gZnVuY3Rpb24obmV3SW5jb21lKXtcclxuXHRcdGRlcGxveWRTZXJ2aWNlLnNhdmVJbmNvbWUobmV3SW5jb21lKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihuZXdJbmNvbWUpIHtcclxuXHRcdFx0XHRpbmNvbWVzLnB1c2goc2VsZi5ub3JtYWxpemVJbmNvbWVzKG5ld0luY29tZSlbMF0pO1xyXG5cdFx0XHR9LCBmdW5jdGlvbihlcnIpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpXHJcblx0XHRcdH0pO1xyXG5cdH07XHJcblxyXG5cdC8vaW5jb21lLXR5cGVzXHJcblx0dmFyIGdldEFsbEluY29tZVR5cGVzID0gZnVuY3Rpb24oKSB7XHJcblx0XHRpZihpbmNvbWVUeXBlcyAhPSAwKXtcclxuXHRcdFx0cmV0dXJuICRxLndoZW4odHlwZXMpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGRlcGxveWRTZXJ2aWNlLmdldEFsbEluY29tZVR5cGVzKClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oYWxsSW5jb21lVHlwZXMpIHtcclxuXHRcdFx0XHRpbmNvbWVUeXBlcyA9IGFsbEluY29tZVR5cGVzO1xyXG5cdFx0XHRcdHJldHVybiBpbmNvbWVUeXBlcztcclxuXHRcdFx0fSk7XHJcblx0fTtcclxuXHJcblx0dmFyIGdldEluY29tZVR5cGUgPSBmdW5jdGlvbihpZCkge1xyXG5cdFx0cmV0dXJuIGRlcGxveWRTZXJ2aWNlLmdldFR5cGUoaWQpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKGluY29tZVR5cGUpIHtcclxuXHRcdFx0XHRyZXR1cm4gaW5jb21lVHlwZTtcclxuXHRcdFx0fSk7XHJcblx0fTtcclxuXHQvL0VuZCBHZXRzIGFuZCBTYXZlcy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5cdC8vU3RhdGlzdGljcyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHR2YXIgdG90YWwgPSBmdW5jdGlvbihwcm9wZXJ0eSkge1xyXG5cdFx0aWYocHJvcGVydHkgPT0gJ3RheCcpIHtcclxuXHRcdFx0cmV0dXJuIHRvdGFsKCdncm9zcycpIC0gdG90YWwoJ25ldCcpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRpZihpbmNvbWVzLmxlbmd0aCA+IDAgJiYgaXNGaW5pdGUoaW5jb21lc1swXVtwcm9wZXJ0eV0pKVxyXG5cdFx0XHRyZXR1cm4gaW5jb21lcy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VycikgeyByZXR1cm4gcHJldiArIGN1cnJbcHJvcGVydHldOyB9LCAwKTtcclxuXHRcdH1cclxuXHR9O1xyXG5cclxuXHR2YXIgeWVhcmx5R3Jvc3MgPSBmdW5jdGlvbihpbmNvbWUpIHtcclxuXHRcdHJldHVybiBpbmNvbWUuZ3Jvc3MgKiAxMzsgLy8xMyB3ZWVrIG1vbnRocyBpbiBhIHllYXIgKDUyIHdlZWtzKVxyXG5cdH07XHJcblxyXG5cdHZhciB5ZWFybHlOZXQgPSBmdW5jdGlvbihpbmNvbWUpIHtcclxuXHRcdHJldHVybiBpbmNvbWUubmV0ICogMTM7XHJcblx0fTtcclxuXHJcblx0dmFyIHRvdGFsWWVhcmx5R3Jvc3MgPSBmdW5jdGlvbigpIHtcclxuXHRcdHJldHVybiBpbmNvbWVzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXJyKSB7XHJcblx0XHRcdHJldHVybiBwcmV2ICsgeWVhcmx5R3Jvc3MoY3Vycik7XHJcblx0XHR9LCAwKTtcclxuXHR9O1xyXG5cclxuXHR2YXIgdG90YWxZZWFybHlOZXQgPSBmdW5jdGlvbigpIHtcclxuXHRcdHJldHVybiBpbmNvbWVzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXJyKSB7XHJcblx0XHRcdHJldHVybiBwcmV2ICsgeWVhcmx5TmV0KGN1cnIpO1xyXG5cdFx0fSwgMCk7XHJcblx0fTtcclxuXHJcblx0dmFyIHRvdGFsWWVhcmx5VGF4ID0gZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4gdG90YWxZZWFybHlHcm9zcygpIC0gdG90YWxZZWFybHlOZXQoKTtcclxuXHR9O1xyXG5cclxuXHR2YXIgY2FsY3VsYXRlUGF5cmF0ZSA9IGZ1bmN0aW9uIGNhbGN1bGF0ZVBheXJhdGUodHlwZSwgd2FnZSwgaG91cnMpe1xyXG5cdFx0aWYoIWhvdXJzKVxyXG5cdFx0XHRob3VycyA9IDQwO1xyXG5cclxuXHRcdHN3aXRjaCh0eXBlLm5hbWUpe1xyXG5cdFx0XHRjYXNlICdXZWVrbHknOlxyXG5cdFx0XHRcdHJldHVybiB3YWdlIC8gaG91cnM7IC8vZG8gbm90aGluZyBwYXlyYXRlIGlzIHdoYXQgaXQgaXNcclxuXHRcdFx0Y2FzZSAnQmktV2Vla2x5JzpcclxuXHRcdFx0XHRyZXR1cm4gd2FnZSAvIChob3VycyAqIDIpOyAvLzgwIGhvdXJzIGluIDIgd2Vla3NcclxuXHRcdFx0Y2FzZSAnU2VtaS1Nb250aGx5JzpcclxuXHRcdFx0XHRyZXR1cm4gd2FnZSAvIChob3VycyAqIDEzIC8gNik7IC8vODYuNjY2NiBob3VycyBpbiBhIHNlbWktbW9udGhcclxuXHRcdFx0Y2FzZSAnTW9udGhseSc6XHJcblx0XHRcdFx0cmV0dXJuIHdhZ2UgLyAoaG91cnMgKiAxMyAvIDMpOyAvLzE3My4zMzMzIGhvdXJzIGluIGEgbW9udGhcclxuXHRcdFx0Y2FzZSAnWWVhcmx5JzpcclxuXHRcdFx0XHRyZXR1cm4gd2FnZSAvIChob3VycyAqIDUyKTsgLy8vMjA4MCBob3VycyBpbiBhIHllYXJcclxuXHRcdH1cclxuXHR9O1xyXG5cdC8vRW5kIFN0YXRpc3RpY3MgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcblx0dGhpcy5nZXRBbGxJbmNvbWVzID0gZ2V0QWxsSW5jb21lcztcclxuXHR0aGlzLnNhdmVJbmNvbWUgPSBzYXZlSW5jb21lO1xyXG5cclxuXHR0aGlzLmdldEFsbEluY29tZVR5cGVzID0gZ2V0QWxsSW5jb21lVHlwZXM7XHJcblx0dGhpcy5nZXRJbmNvbWVUeXBlID0gZ2V0SW5jb21lVHlwZTtcclxuXHJcblx0dGhpcy55ZWFybHlHcm9zcyA9IHllYXJseUdyb3NzO1xyXG5cdHRoaXMudG90YWxZZWFybHlHcm9zcyA9IHRvdGFsWWVhcmx5R3Jvc3M7XHJcblx0dGhpcy55ZWFybHlOZXQgPSB5ZWFybHlOZXQ7XHJcblx0dGhpcy50b3RhbFllYXJseU5ldCA9IHRvdGFsWWVhcmx5TmV0O1xyXG5cdHRoaXMudG90YWxZZWFybHlUYXggPSB0b3RhbFllYXJseVRheDtcclxuXHR0aGlzLnRvdGFsID0gdG90YWw7XHJcblxyXG5cdHRoaXMuY2FsY3VsYXRlUGF5cmF0ZSA9IGNhbGN1bGF0ZVBheXJhdGU7XHJcbn1cclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdidWRnZXRpbmdJc0Z1bicpXHJcblx0LnNlcnZpY2UoJ2luY29tZVNlcnZpY2UnLCBbJyRxJywgJ2RlcGxveWRTZXJ2aWNlJywgaW5jb21lU2VydmljZV0pOyIsImFuZ3VsYXIubW9kdWxlKCdidWRnZXRpbmdJc0Z1bicpXHJcblx0LmNvbnRyb2xsZXIoJ0xvZ2luQ29udHJvbGxlcicsIFsnbG9naW5TZXJ2aWNlJywgJyRzY29wZScsIGZ1bmN0aW9uKGxvZ2luU2VydmljZSwgJHNjb3BlKSB7XHJcblx0XHR2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG5cdFx0c2VsZi51c2VyID0gbG9naW5TZXJ2aWNlLmdldFVzZXIoKTtcclxuXHJcblx0XHRzZWxmLmNyZWF0ZVVzZXIgPSBsb2dpblNlcnZpY2UuY3JlYXRlVXNlcjtcclxuXHRcdHNlbGYubG9naW4gPSBsb2dpblNlcnZpY2UubG9naW47XHJcblx0XHRzZWxmLnNpZ25PdXQgPSBsb2dpblNlcnZpY2Uuc2lnbk91dDtcclxuXHJcblx0XHQkc2NvcGUuJHdhdGNoKHNlbGYudXNlcik7XHJcblx0fV0pOyIsImZ1bmN0aW9uIGxvZ2luU2VydmljZSgkcSwgYXV0aFNlcnZpY2UpIHtcclxuXHQvKlRlbXBsYXRlc1xyXG5cclxuXHRcdHVzZXJcclxuXHRcdHtcclxuXHRcdFx0ZW1haWwgOiBzdHJpbmcsXHJcblx0XHRcdHBhc3N3b3JkIDogc3RyaW5nXHJcblx0XHR9XHJcblx0Ki9cclxuXHJcblx0dmFyIGNyZWF0ZVVzZXIgPSBmdW5jdGlvbihuZXdVc2VyKSB7XHJcblx0XHRhdXRoU2VydmljZS5jcmVhdGVVc2VyKG5ld1VzZXIuZW1haWwsIG5ld1VzZXIucGFzc3dvcmQpO1xyXG5cdH07XHJcblxyXG5cdHZhciBsb2dpbiA9IGZ1bmN0aW9uKHVzZXIpIHtcclxuXHRcdGF1dGhTZXJ2aWNlLmxvZ2luKHVzZXIuZW1haWwsIHVzZXIucGFzc3dvcmQpO1xyXG5cdH07XHJcblxyXG5cdHZhciBzaWduT3V0ID0gZnVuY3Rpb24oKSB7XHJcblx0XHRhdXRoU2VydmljZS5zaWduT3V0KCk7XHJcblx0fTtcclxuXHJcblx0dGhpcy5jcmVhdGVVc2VyID0gY3JlYXRlVXNlcjtcclxuXHR0aGlzLmxvZ2luID0gbG9naW47XHJcblx0dGhpcy5zaWduT3V0ID0gc2lnbk91dDtcclxuXHR0aGlzLmdldFVzZXIgPSBhdXRoU2VydmljZS5nZXRVc2VyO1xyXG59XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnYnVkZ2V0aW5nSXNGdW4nKVxyXG5cdC5zZXJ2aWNlKCdsb2dpblNlcnZpY2UnLCBbJyRxJywgJ2F1dGhTZXJ2aWNlJywgbG9naW5TZXJ2aWNlXSk7IiwiYW5ndWxhci5tb2R1bGUoJ2J1ZGdldGluZ0lzRnVuJylcclxuXHQuY29udHJvbGxlcignUHJvamVjdGVkQmFsYW5jZUNvbnRyb2xsZXInLCBbJ3Byb2plY3RlZEJhbGFuY2VTZXJ2aWNlJywgXHJcblx0XHRmdW5jdGlvbihwcm9qZWN0ZWRCYWxhbmNlU2VydmljZSkge1xyXG5cdFx0XHR2YXIgc2VsZiA9IHRoaXM7IFxyXG5cclxuXHRcdFx0Ly9pbml0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cdFx0XHRzZWxmLmdldEJhbGFuY2UgPSBwcm9qZWN0ZWRCYWxhbmNlU2VydmljZS5nZXRCYWxhbmNlO1xyXG5cclxuXHRcdFx0Ly9pbml0IGVuZC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuXHRcdFx0Ly9hY3Rpb25zLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cdFx0XHRzZWxmLmNvcmVFeHBlbnNlcyA9IHByb2plY3RlZEJhbGFuY2VTZXJ2aWNlLmdldENvcmVFeHBlbnNlcztcclxuXHJcblx0XHRcdC8vYWN0aW9ucyBlbmQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHR9XSk7IiwiLy9wcm9qZWN0ZWQgYmFsYW5jZSBzZXJ2aWNlXHJcbmZ1bmN0aW9uIHByb2plY3RlZEJhbGFuY2VTZXJ2aWNlKGluY29tZVNlcnZpY2UsIGJ1ZGdldFNlcnZpY2UpIHtcclxuXHR2YXIgYmFsYW5jZSA9IDA7XHJcblxyXG5cdHZhciBnZXRCYWxhbmNlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4gaW5jb21lU2VydmljZS50b3RhbCgnbmV0JykgLSBidWRnZXRTZXJ2aWNlLnRvdGFsQWxsKCk7XHJcblx0fTtcclxuXHJcblx0dmFyIGNvcmVFeHBlbnNlcyA9IGZ1bmN0aW9uKG11bHRpcGxlKSB7XHJcblx0fTtcclxuXHJcblx0dGhpcy5nZXRCYWxhbmNlID0gZ2V0QmFsYW5jZTtcclxuXHR0aGlzLmdldENvcmVFeHBlbnNlcyA9IGNvcmVFeHBlbnNlcztcclxufVxyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2J1ZGdldGluZ0lzRnVuJylcclxuXHQuc2VydmljZSgncHJvamVjdGVkQmFsYW5jZVNlcnZpY2UnLCBbJ2luY29tZVNlcnZpY2UnLCAnYnVkZ2V0U2VydmljZScsIHByb2plY3RlZEJhbGFuY2VTZXJ2aWNlXSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
