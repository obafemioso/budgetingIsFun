angular.module('budgettingIsFun')
	.constant('deployd', 'http://localhost:2403')
	.constant('partTime', '23ab7985d307dab2')
	.constant('fullTime', 'deb0980f74cd6b33')
	.constant('semiMonthly', '6eddc802d96c18f2')
	.constant('biWeekly', 'c585919ae006086c')
	.constant('yearly', 'a5b60c5bbd52295d')
	.controller('IncomeController', ['$http', 'deployd', 'partTime', 'fullTime', 'semiMonthly', 'biWeekly', 'yearly', 'incomeService', function($http, deployd, partTime, fullTime, semiMonthly, biWeekly, yearly, incomeService) {
		var self = this;

		self.message = incomeService.message;

		incomeService.getIncomes()
			.then(function(data) {
				self.incomes = data;
			}, function(err) {
				console.log(err);
			});

		self.types = [];

		$http.get(deployd + '/income-types')
			.success(function(types) {
				self.types = types;
			}).error(function(err) {
				console.log(err);
			});

		self.newIncome = {};

		//if income type is part time/empty enable hours field
		//else disable and set hours field to equivalent hours in  week
		//for the income type (i.e. full time hours)
		self.modifyHours = function() {
			if(self.newIncome.type && self.newIncome.type.id != partTime) {
				if(self.newIncome.type.id == fullTime) {
					//number of hours in a week based on fullTime
					self.newIncome.hours = 40;
				}else if(self.newIncome.type.id == semiMonthly) {
					//number of hours in a week based on semiMonthly
					self.newIncome.hours = 43.3333;
				}else if(self.newIncome.type.id == biWeekly) {
					//number of hours in a week based on biWeekly
					self.newIncome.hours = 40;
				}else if(self.newIncome.type.id == yearly) {
					//number of hours in a week based on yearly
					self.newIncome.hours = 40;
				}
			}
		};

		self.addIncome = function(newIncome) {
			if(newIncome.type.id == partTime) {
				//payrate doesn't need adjusting
			}else if(newIncome.type.id == fullTime) {
				//payrate doesn't need adjusting
			}else if(newIncome.type.id == semiMonthly) {
				//divide payrate by 86.6666 = number of hours in a semi month
				newIncome.payrate = newIncome.payrate / 86.6666;
			}else if(newIncome.type.id == biWeekly) {
				//divide payrate by 80 = number of hours in a biWeek
				newIncome.payrate = newIncome.payrate / 80;
			}else if(newIncome.type.id == yearly) {
				//divide payrate by 2080 = number of hours in a year
				newIncome.payrate = newIncome.payrate / 2080;
			}
			else{
				console.log('all failed');
			}
			$http.post(deployd + '/income-sources', {
				job: newIncome.job,
				incomeType: newIncome.type.id,
				payrate: newIncome.payrate,
				hours: newIncome.hours,
				taxPercent: newIncome.taxPercent
			}).success(function(income) {
				self.newIncome = {};
				self.incomes.push(self.normalizedIncomes(income)[0]);
			}).error(function(err) {
				console.log(err);
			});
		};
	}]);