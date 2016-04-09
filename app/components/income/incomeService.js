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

//returns payrate adjusted to 40 hour/week rate
function getAdjustedPayrate(payrate, type){
	switch(type){
		case 'Weekly':
			return payrate; //do nothing payrate is what it is
		case 'Bi-Weekly':
			return payrate / 80; //80 hours in 2 weeks
		case 'Semi-Monthly':
			return payrate / (40*13/6); //86.6666 hours in a semi-month
		case 'Monthly':
			return payrate / (40*13/3); //173.3333 hours in a month
		case 'Yearly':
			return payrate / 2080; ///2080 hours in a year
	}
}

//income service provides methods to add and get incomes
function incomeService($q, deploydService) {
	var incomes = [];
	var types = [];

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
		newIncome.payrate = getAdjustedPayrate(newIncome.payrate, newIncome.type.name);
		newIncome.hours = (!newIncome.hours) ? getHours(newIncome.type.name) : newIncome.hours;

		deploydService.saveIncome(newIncome)
			.then(function(income) {
				incomes.push(self.normalizeIncomes(newIncome)[0]);
			}, function(err) {
				console.log(err)
			});
	};

	//types
	var getAllTypes = function() {
		if(types != 0){
			return $q.when(types);
		}
		return deploydService.getAllTypes()
			.then(function(allTypes) {
				types = allTypes;
				return types;
			});
	};

	var getType = function(id) {
		return deploydService.getType(id)
			.then(function(type) {
				return type;
			});
	};

	this.getAllIncomes = getAllIncomes;
	this.saveIncome = saveIncome;

	this.getAllTypes = getAllTypes;
	this.getType = getType;
}

angular.module('budgettingIsFun')
	.service('incomeService', ['$q', 'deploydService', incomeService]);