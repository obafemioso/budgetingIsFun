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