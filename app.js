function budgetService(e,t,n){var o=[],r=[],u=function(){return 0!=o.length?e.when(o):t.getAllBudgets().then(function(e){return o=e})},i=function(e){t.saveBudget(e).then(function(e){o.push(e)},function(e){console.log(e)})},c=function(){return 0!=r.length?e.when(r):t.getAllBudgetItems().then(function(e){return r=e})},s=function(e){t.saveBudgetItem(e).then(function(e){r.push(e)},function(e){console.log(e)})},l=function(e){return r.reduce(function(t,n){return n.budgetId==e.id?t+n.amount:t},0)},a=function(e){return e.percentAllotment/100*n.total("net")},g=function(e){return l(e)/n.total("net")*100},d=function(e){return a(e)-l(e)},f=function(){return o.reduce(function(e,t){return e+t.percentAllotment},0)},m=function(){var e=n.total("gross"),t=n.total("net");return(e-t)/e},h=function(){return o.reduce(function(e,t){return e+g(t)},m())};this.getAllBudgets=u,this.saveBudget=i,this.getAllBudgetItems=c,this.saveBudgetItem=s,this.total=l,this.budgetCap=a,this.budgetUtilization=g,this.budgetBalance=d,this.guidelineTotal=f,this.taxUtilization=m,this.overviewUtilizationTotal=h}function deploydService(e,t,n){var o=function(){var o=t.defer();return e.get(n+"/budgets").success(function(e){o.resolve(e)}).error(function(e){o.reject(e)}),o.promise},r=function(o){var r=t.defer();return e.post(n+"/budgets",{name:o.name,percentAllotment:o.percent}).success(function(e){r.resolve(e)}).error(function(e){r.reject(e)}),r.promise},u=function(){var o=t.defer();return e.get(n+"/budget-items").success(function(e){o.resolve(e)}).error(function(e){console.log(e)}),o.promise},i=function(o){var r=t.defer();return e.post(n+"/budget-items",{name:o.name,amount:o.amount,budgetId:o.budget.id}).success(function(e){r.resolve(e)}).error(function(e){r.reject(e)}),r.promise},c=function(){var o=t.defer();return e.get(n+"/income-sources").success(function(e){o.resolve(e)}).error(function(e){o.reject(e)}),o.promise},s=function(o){var r=t.defer();return e.post(n+"/income-sources",{job:o.job,incomeTypeId:o.incomeType.id,payrate:o.payrate,hours:o.hours,taxPercent:o.taxPercent}).success(function(e){r.resolve(e)}).error(function(e){r.reject(e)}),r.promise},l=function(){var o=t.defer();return e.get(n+"/income-types").success(function(e){o.resolve(e)}).error(function(e){o.reject(e)}),o.promise},a=function(o){var r=t.defer();return e.get(n+"/income-types?id="+o).success(function(e){r.resolve(type)}).error(function(e){console.log(e)}),r.promise};this.getAllBudgets=o,this.saveBudget=r,this.getAllBudgetItems=u,this.saveBudgetItem=i,this.getAllIncomes=c,this.saveIncome=s,this.getAllIncomeTypes=l,this.getIncomeType=a}function normalizeIncomes(e){angular.isArray(e)||(e=[e]);var t=[];return angular.forEach(e,function(e){var n={};n.job=e.job,n.payrate=e.payrate,n.hours=e.hours,n.gross=e.payrate*e.hours*4,n.tax=e.taxPercent,n.net=n.gross*(1-e.taxPercent/100),n.biweekly=n.net/2,t.push(n)}),t}function getHours(e){switch(e){case"Weekly":case"Bi-Weekly":case"Yearly":return 40;case"Semi-Monthly":case"Monthly":return 520/12}}function getAdjustedPayrate(e,t){switch(t){case"Weekly":return e;case"Bi-Weekly":return e/80;case"Semi-Monthly":return e/(520/6);case"Monthly":return e/(520/3);case"Yearly":return e/2080}}function incomeService(e,t){var n=[],o=[],r=function(){return 0!=n.length?e.when(n):t.getAllIncomes().then(function(e){return n=normalizeIncomes(e)})},u=function(e){e.payrate=getAdjustedPayrate(e.payrate,e.incomeType.name),e.hours=e.hours?e.hours:getHours(e.incomeType.name),t.saveIncome(e).then(function(e){n.push(self.normalizeIncomes(e)[0])},function(e){console.log(e)})},i=function(){return 0!=o?e.when(types):t.getAllIncomeTypes().then(function(e){return o=e})},c=function(e){return t.getType(e).then(function(e){return e})},s=function(e){return n.length>0&&isFinite(n[0][e])?n.reduce(function(t,n){return t+n[e]},0):void 0},l=function(e){return 13*e.gross},a=function(e){return 13*e.net},g=function(){return n.reduce(function(e,t){return e+l(t)},0)},d=function(){return n.reduce(function(e,t){return e+a(t)},0)};this.getAllIncomes=r,this.saveIncome=u,this.getAllIncomeTypes=i,this.getIncomeType=c,this.yearlyGross=l,this.totalYearlyGross=g,this.yearlyNet=a,this.totalYearlyNet=d,this.total=s}angular.module("budgettingIsFun",["angular.filter"]).controller("BaseController",["$scope",function(e){e.welcomeMessage="Welcome Savy Budgetter"}]),angular.module("customFilters",[]).filter("unique",function(){return function(e,t){if(angular.isArray(e)&&angular.isString(t)){for(var n=[],o={},r=0;r<e.length;r++){var u=e[r][t];angular.isUndefined(o[u])&&(o[u]=!0,n.push(e[r]))}return console.log(n),n}return e}}),angular.module("budgettingIsFun").controller("BudgetController",["budgetService","incomeService",function(e,t){var n=this;n.budgets=[],n.budgetItems=[],n.budgetCap=e.budgetCap,n.budgetUtilization=e.budgetUtilization,n.budgetBalance=e.budgetBalance,n.guidelineTotal=e.guidelineTotal,n.taxUtilization=e.taxUtilization,n.overviewUtilizationTotal=e.overviewUtilizationTotal,e.getAllBudgets().then(function(t){n.budgets=t,e.getAllBudgetItems().then(function(e){n.budgetItems=e},function(e){console.log(e)})},function(e){console.log(e)}),n.newBudget={},n.saveBudget=function(t){e.saveBudget(t),n.newBudget={}},n.newBudgetItem={},n.saveBudgetItem=function(t){e.saveBudgetItem(t),n.newBudgetItem={}},n.total=e.total}]),angular.module("budgettingIsFun").service("budgetService",["$q","deploydService","incomeService",budgetService]),angular.module("budgettingIsFun").constant("deployd","http://localhost:2403").service("deploydService",["$http","$q","deployd",deploydService]),angular.module("budgettingIsFun").controller("IncomeController",["incomeService",function(e){var t=this;t.incomes=[],t.incomeTypes=[],t.totalYearlyGross=e.totalYearlyGross,t.totalYearlyNet=e.totalYearlyNet,e.getAllIncomes().then(function(e){t.incomes=e},function(e){console.log(e)}),e.getAllIncomeTypes().then(function(e){t.incomeTypes=e},function(e){console.log(e)}),t.newIncome={},t.saveIncome=function(n){e.saveIncome(n),t.newIncome={}},t.total=e.total}]),angular.module("budgettingIsFun").service("incomeService",["$q","deploydService",incomeService]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbXBvbmVudHMvYnVkZ2V0L2J1ZGdldFNlcnZpY2UuanMiLCJjb21wb25lbnRzL2RlcGxveWQvZGVwbG95ZFNlcnZpY2UuanMiLCJjb21wb25lbnRzL2luY29tZS9pbmNvbWVTZXJ2aWNlLmpzIiwiYXBwLm1vZHVsZS5qcyIsImZpbHRlcnMvY3VzdG9tRmlsdGVycy5qcyIsImNvbXBvbmVudHMvYnVkZ2V0L2J1ZGdldENvbnRyb2xsZXIuanMiLCJjb21wb25lbnRzL2luY29tZS9pbmNvbWVDb250cm9sbGVyLmpzIl0sIm5hbWVzIjpbImJ1ZGdldFNlcnZpY2UiLCIkcSIsImRlcGxveWRTZXJ2aWNlIiwiaW5jb21lU2VydmljZSIsImJ1ZGdldHMiLCJidWRnZXRJdGVtcyIsImdldEFsbEJ1ZGdldHMiLCJsZW5ndGgiLCJ3aGVuIiwidGhlbiIsImFsbEJ1ZGdldHMiLCJzYXZlQnVkZ2V0IiwibmV3QnVkZ2V0IiwicHVzaCIsImVyciIsImNvbnNvbGUiLCJsb2ciLCJnZXRBbGxCdWRnZXRJdGVtcyIsImFsbEJ1ZGdldEl0ZW1zIiwic2F2ZUJ1ZGdldEl0ZW0iLCJuZXdCdWRnZXRJdGVtIiwidG90YWwiLCJidWRnZXQiLCJyZWR1Y2UiLCJwcmV2IiwiY3VyciIsImJ1ZGdldElkIiwiaWQiLCJhbW91bnQiLCJidWRnZXRDYXAiLCJwZXJjZW50QWxsb3RtZW50IiwiYnVkZ2V0VXRpbGl6YXRpb24iLCJidWRnZXRCYWxhbmNlIiwiZ3VpZGVsaW5lVG90YWwiLCJ0YXhVdGlsaXphdGlvbiIsImdyb3NzSW5jb21lIiwibmV0SW5jb21lIiwib3ZlcnZpZXdVdGlsaXphdGlvblRvdGFsIiwidGhpcyIsIiRodHRwIiwiZGVwbG95ZCIsImRlZmVycmVkIiwiZGVmZXIiLCJnZXQiLCJzdWNjZXNzIiwicmVzb2x2ZSIsImVycm9yIiwicmVqZWN0IiwicHJvbWlzZSIsInBvc3QiLCJuYW1lIiwicGVyY2VudCIsIml0ZW1zIiwiaW5jb21lcyIsInNhdmVJbmNvbWUiLCJuZXdJbmNvbWUiLCJqb2IiLCJpbmNvbWVUeXBlSWQiLCJpbmNvbWVUeXBlIiwicGF5cmF0ZSIsImhvdXJzIiwidGF4UGVyY2VudCIsImluY29tZSIsImluY29tZVR5cGVzIiwidHlwZSIsImdldEFsbEluY29tZXMiLCJnZXRBbGxJbmNvbWVUeXBlcyIsImdldEluY29tZVR5cGUiLCJub3JtYWxpemVJbmNvbWVzIiwiYW5ndWxhciIsImlzQXJyYXkiLCJub3JtYWxpemVkSW5jb21lcyIsImZvckVhY2giLCJub3JtSW5jb21lIiwiZ3Jvc3MiLCJ0YXgiLCJuZXQiLCJiaXdlZWtseSIsImdldEhvdXJzIiwiZ2V0QWRqdXN0ZWRQYXlyYXRlIiwiYWxsSW5jb21lcyIsInNlbGYiLCJ0eXBlcyIsImFsbEluY29tZVR5cGVzIiwiZ2V0VHlwZSIsInByb3BlcnR5IiwiaXNGaW5pdGUiLCJ5ZWFybHlHcm9zcyIsInllYXJseU5ldCIsInRvdGFsWWVhcmx5R3Jvc3MiLCJ0b3RhbFllYXJseU5ldCIsIm1vZHVsZSIsImNvbnRyb2xsZXIiLCIkc2NvcGUiLCJ3ZWxjb21lTWVzc2FnZSIsImZpbHRlciIsImRhdGEiLCJwcm9wZXJ0eU5hbWUiLCJpc1N0cmluZyIsInJlc3VsdHMiLCJrZXlzIiwiaSIsInZhbCIsImlzVW5kZWZpbmVkIiwic2VydmljZSIsImNvbnN0YW50Il0sIm1hcHBpbmdzIjoiQUFBQSxRQUFBQSxlQUFBQyxFQUFBQyxFQUFBQyxHQUNBLEdBQUFDLE1BQ0FDLEtBSUFDLEVBQUEsV0FDQSxNQUFBLElBQUFGLEVBQUFHLE9BQ0FOLEVBQUFPLEtBQUFKLEdBRUFGLEVBQUFJLGdCQUNBRyxLQUFBLFNBQUFDLEdBRUEsTUFEQU4sR0FBQU0sS0FLQUMsRUFBQSxTQUFBQyxHQUNBVixFQUFBUyxXQUFBQyxHQUNBSCxLQUFBLFNBQUFHLEdBQ0FSLEVBQUFTLEtBQUFELElBQ0EsU0FBQUUsR0FDQUMsUUFBQUMsSUFBQUYsTUFJQUcsRUFBQSxXQUNBLE1BQUEsSUFBQVosRUFBQUUsT0FDQU4sRUFBQU8sS0FBQUgsR0FF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QSxRQUFBLEtBQUEsVUFBQXRHLGlCS3BJQW1FLFFBQUFzQixPQUFBLG1CQUNBQyxXQUFBLG9CQUFBLGdCQUNBLFNBQUF6RixHQUNBLEdBQUE4RSxHQUFBM0MsSUFFQTJDLEdBQUE1QixXQUNBNEIsRUFBQWxCLGVBRUFrQixFQUFBUSxpQkFBQXRGLEVBQUFzRixpQkFDQVIsRUFBQVMsZUFBQXZGLEVBQUF1RixlQUVBdkYsRUFBQThELGdCQUNBeEQsS0FBQSxTQUFBNEMsR0FDQTRCLEVBQUE1QixRQUFBQSxHQUNBLFNBQUF2QyxHQUNBQyxRQUFBQyxJQUFBRixLQUlBWCxFQUFBK0Qsb0JBQ0F6RCxLQUFBLFNBQUFzRCxHQUNBa0IsRUFBQWxCLFlBQUFBLEdBQ0EsU0FBQWpELEdBQ0FDLFFBQUFDLElBQUFGLEtBR0FtRSxFQUFBMUIsYUFFQTBCLEVBQUEzQixXQUFBLFNBQUFDLEdBQ0FwRCxFQUFBbUQsV0FBQUMsR0FDQTBCLEVBQUExQixjQUdBMEIsRUFBQTVELE1BQUFsQixFQUFBa0IsU0orR0FnRCxRQUFBc0IsT0FBQSxtQkFDQWEsUUFBQSxpQkFBQSxLQUFBLGlCQUFBckciLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiZnVuY3Rpb24gYnVkZ2V0U2VydmljZSgkcSwgZGVwbG95ZFNlcnZpY2UsIGluY29tZVNlcnZpY2UpIHtcclxuXHR2YXIgYnVkZ2V0cyA9IFtdO1xyXG5cdHZhciBidWRnZXRJdGVtcyA9IFtdO1xyXG5cclxuXHQvL0dldHMgYW5kIFNhdmVzLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblx0Ly9idWRnZXRzXHJcblx0dmFyIGdldEFsbEJ1ZGdldHMgPSBmdW5jdGlvbigpIHtcclxuXHRcdGlmKGJ1ZGdldHMubGVuZ3RoICE9IDApe1xyXG5cdFx0XHRyZXR1cm4gJHEud2hlbihidWRnZXRzKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBkZXBsb3lkU2VydmljZS5nZXRBbGxCdWRnZXRzKClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oYWxsQnVkZ2V0cykge1xyXG5cdFx0XHRcdGJ1ZGdldHMgPSBhbGxCdWRnZXRzO1xyXG5cdFx0XHRcdHJldHVybiBidWRnZXRzO1xyXG5cdFx0XHR9KTtcclxuXHR9O1xyXG5cclxuXHR2YXIgc2F2ZUJ1ZGdldCA9IGZ1bmN0aW9uKG5ld0J1ZGdldCkge1xyXG5cdFx0ZGVwbG95ZFNlcnZpY2Uuc2F2ZUJ1ZGdldChuZXdCdWRnZXQpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKG5ld0J1ZGdldCkge1xyXG5cdFx0XHRcdGJ1ZGdldHMucHVzaChuZXdCdWRnZXQpO1xyXG5cdFx0XHR9LCBmdW5jdGlvbihlcnIpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpO1xyXG5cdFx0XHR9KTtcclxuXHR9O1xyXG5cdC8vYnVkZ2V0LWl0ZW1zXHJcblx0dmFyIGdldEFsbEJ1ZGdldEl0ZW1zID0gZnVuY3Rpb24oKSB7XHJcblx0XHRpZihidWRnZXRJdGVtcy5sZW5ndGggIT0gMCl7XHJcblx0XHRcdHJldHVybiAkcS53aGVuKGJ1ZGdldEl0ZW1zKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBkZXBsb3lkU2VydmljZS5nZXRBbGxCdWRnZXRJdGVtcygpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKGFsbEJ1ZGdldEl0ZW1zKSB7XHJcblx0XHRcdFx0YnVkZ2V0SXRlbXMgPSBhbGxCdWRnZXRJdGVtcztcclxuXHRcdFx0XHRyZXR1cm4gYnVkZ2V0SXRlbXM7XHJcblx0XHRcdH0pO1xyXG5cdH07XHJcblxyXG5cdHZhciBzYXZlQnVkZ2V0SXRlbSA9IGZ1bmN0aW9uKG5ld0J1ZGdldEl0ZW0pIHtcclxuXHRcdGRlcGxveWRTZXJ2aWNlLnNhdmVCdWRnZXRJdGVtKG5ld0J1ZGdldEl0ZW0pXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKG5ld0J1ZGdldEl0ZW0pIHtcclxuXHRcdFx0XHRidWRnZXRJdGVtcy5wdXNoKG5ld0J1ZGdldEl0ZW0pO1xyXG5cdFx0XHR9LCBmdW5jdGlvbihlcnIpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpO1xyXG5cdFx0XHR9KTtcclxuXHR9O1xyXG5cdC8vRW5kIEdldHMgYW5kIFNhdmVzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcblx0Ly9TdGF0aXN0aWNzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cdHZhciB0b3RhbCA9IGZ1bmN0aW9uKGJ1ZGdldCkge1xyXG5cdFx0cmV0dXJuIGJ1ZGdldEl0ZW1zLnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXJyKSB7XHJcblx0XHRcdGlmKGN1cnIuYnVkZ2V0SWQgPT0gYnVkZ2V0LmlkKVxyXG5cdFx0XHRcdHJldHVybiBwcmV2ICsgY3Vyci5hbW91bnQ7XHJcblx0XHRcdHJldHVybiBwcmV2O1xyXG5cdFx0fSwgMCk7XHJcblx0fTtcclxuXHJcblx0dmFyIGJ1ZGdldENhcCA9IGZ1bmN0aW9uKGJ1ZGdldCkge1xyXG5cdFx0cmV0dXJuIGJ1ZGdldC5wZXJjZW50QWxsb3RtZW50IC8gMTAwICogaW5jb21lU2VydmljZS50b3RhbCgnbmV0Jyk7XHJcblx0fTtcclxuXHJcblx0dmFyIGJ1ZGdldFV0aWxpemF0aW9uID0gZnVuY3Rpb24oYnVkZ2V0KSB7XHJcblx0XHRyZXR1cm4gdG90YWwoYnVkZ2V0KSAvIGluY29tZVNlcnZpY2UudG90YWwoJ25ldCcpICogMTAwO1xyXG5cdH07XHJcblxyXG5cdHZhciBidWRnZXRCYWxhbmNlID0gZnVuY3Rpb24oYnVkZ2V0KSB7XHJcblx0XHRyZXR1cm4gYnVkZ2V0Q2FwKGJ1ZGdldCkgLSB0b3RhbChidWRnZXQpO1xyXG5cdH07XHJcblxyXG5cdHZhciBndWlkZWxpbmVUb3RhbCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0cmV0dXJuIGJ1ZGdldHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cnIpIHtcclxuXHRcdFx0cmV0dXJuIHByZXYgKyBjdXJyLnBlcmNlbnRBbGxvdG1lbnQ7XHJcblx0XHR9LCAwKTtcclxuXHR9O1xyXG5cclxuXHR2YXIgdGF4VXRpbGl6YXRpb24gPSBmdW5jdGlvbigpIHtcclxuXHRcdHZhciBncm9zc0luY29tZSA9IGluY29tZVNlcnZpY2UudG90YWwoJ2dyb3NzJyk7XHJcblx0XHR2YXIgbmV0SW5jb21lID0gaW5jb21lU2VydmljZS50b3RhbCgnbmV0Jyk7XHJcblxyXG5cdFx0cmV0dXJuIChncm9zc0luY29tZSAtIG5ldEluY29tZSkgLyBncm9zc0luY29tZTtcclxuXHR9O1xyXG5cclxuXHR2YXIgb3ZlcnZpZXdVdGlsaXphdGlvblRvdGFsID0gZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4gYnVkZ2V0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3Vycikge1xyXG5cdFx0XHRyZXR1cm4gcHJldiArIGJ1ZGdldFV0aWxpemF0aW9uKGN1cnIpO1xyXG5cdFx0fSwgdGF4VXRpbGl6YXRpb24oKSk7XHJcblx0fTtcclxuXHQvL0VuZCBTdGF0aXN0aWNzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblxyXG5cdHRoaXMuZ2V0QWxsQnVkZ2V0cyA9IGdldEFsbEJ1ZGdldHM7XHJcblx0dGhpcy5zYXZlQnVkZ2V0ID0gc2F2ZUJ1ZGdldDtcclxuXHR0aGlzLmdldEFsbEJ1ZGdldEl0ZW1zID0gZ2V0QWxsQnVkZ2V0SXRlbXM7XHJcblx0dGhpcy5zYXZlQnVkZ2V0SXRlbSA9IHNhdmVCdWRnZXRJdGVtO1xyXG5cdHRoaXMudG90YWwgPSB0b3RhbDtcclxuXHJcblx0dGhpcy5idWRnZXRDYXAgPSBidWRnZXRDYXA7XHJcblx0dGhpcy5idWRnZXRVdGlsaXphdGlvbiA9IGJ1ZGdldFV0aWxpemF0aW9uO1xyXG5cdHRoaXMuYnVkZ2V0QmFsYW5jZSA9IGJ1ZGdldEJhbGFuY2U7XHJcblx0dGhpcy5ndWlkZWxpbmVUb3RhbCA9IGd1aWRlbGluZVRvdGFsO1xyXG5cdHRoaXMudGF4VXRpbGl6YXRpb24gPSB0YXhVdGlsaXphdGlvbjtcclxuXHR0aGlzLm92ZXJ2aWV3VXRpbGl6YXRpb25Ub3RhbCA9IG92ZXJ2aWV3VXRpbGl6YXRpb25Ub3RhbDtcclxufVxyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2J1ZGdldHRpbmdJc0Z1bicpXHJcblx0LnNlcnZpY2UoJ2J1ZGdldFNlcnZpY2UnLCBbJyRxJywgJ2RlcGxveWRTZXJ2aWNlJywgJ2luY29tZVNlcnZpY2UnLCBidWRnZXRTZXJ2aWNlXSk7IiwiZnVuY3Rpb24gZGVwbG95ZFNlcnZpY2UoJGh0dHAsICRxLCBkZXBsb3lkKSB7XHJcblx0Ly9idWRnZXRzXHJcblx0dmFyIGJ1ZGdldHMgPSBmdW5jdGlvbigpIHtcclxuXHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XHJcblxyXG5cdFx0JGh0dHAuZ2V0KGRlcGxveWQgKyAnL2J1ZGdldHMnKVxyXG5cdFx0XHQuc3VjY2VzcyhmdW5jdGlvbihidWRnZXRzKSB7XHJcblx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShidWRnZXRzKTtcclxuXHRcdFx0fSkuZXJyb3IoZnVuY3Rpb24oZXJyKSB7XHJcblx0XHRcdFx0ZGVmZXJyZWQucmVqZWN0KGVycik7XHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xyXG5cdH07XHJcblxyXG5cdHZhciBzYXZlQnVkZ2V0ID0gZnVuY3Rpb24obmV3QnVkZ2V0KSB7XHJcblx0XHR2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xyXG5cclxuXHRcdCRodHRwLnBvc3QoZGVwbG95ZCArICcvYnVkZ2V0cycsIHtcclxuXHRcdFx0bmFtZTogbmV3QnVkZ2V0Lm5hbWUsXHJcblx0XHRcdHBlcmNlbnRBbGxvdG1lbnQ6IG5ld0J1ZGdldC5wZXJjZW50XHJcblx0XHR9KS5zdWNjZXNzKGZ1bmN0aW9uKGJ1ZGdldCkge1xyXG5cdFx0XHRkZWZlcnJlZC5yZXNvbHZlKGJ1ZGdldCk7XHJcblx0XHR9KS5lcnJvcihmdW5jdGlvbihlcnIpIHtcclxuXHRcdFx0ZGVmZXJyZWQucmVqZWN0KGVycik7XHJcblx0XHR9KTtcclxuXHJcblx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcclxuXHR9O1xyXG5cclxuXHR2YXIgYnVkZ2V0SXRlbXMgPSBmdW5jdGlvbigpIHtcclxuXHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XHJcblxyXG5cdFx0JGh0dHAuZ2V0KGRlcGxveWQgKyAnL2J1ZGdldC1pdGVtcycpXHJcblx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKGl0ZW1zKSB7XHJcblx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShpdGVtcyk7XHJcblx0XHRcdH0pLmVycm9yKGZ1bmN0aW9uKGVycikge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKGVycik7XHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xyXG5cdH07XHJcblxyXG5cdHZhciBzYXZlQnVkZ2V0SXRlbSA9IGZ1bmN0aW9uKG5ld0J1ZGdldEl0ZW0pIHtcclxuXHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XHJcblxyXG5cdFx0JGh0dHAucG9zdChkZXBsb3lkICsgJy9idWRnZXQtaXRlbXMnLCB7XHJcblx0XHRcdG5hbWU6IG5ld0J1ZGdldEl0ZW0ubmFtZSxcclxuXHRcdFx0YW1vdW50OiBuZXdCdWRnZXRJdGVtLmFtb3VudCxcclxuXHRcdFx0YnVkZ2V0SWQ6IG5ld0J1ZGdldEl0ZW0uYnVkZ2V0LmlkXHJcblx0XHR9KS5zdWNjZXNzKGZ1bmN0aW9uKG5ld0J1ZGdldEl0ZW0pIHtcclxuXHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShuZXdCdWRnZXRJdGVtKTtcclxuXHRcdH0pLmVycm9yKGZ1bmN0aW9uKGVycikge1xyXG5cdFx0XHRkZWZlcnJlZC5yZWplY3QoZXJyKTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xyXG5cdH07XHJcblxyXG5cdC8vaW5jb21lc1xyXG5cdHZhciBpbmNvbWVzID0gZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xyXG5cclxuXHRcdCRodHRwLmdldChkZXBsb3lkICsgJy9pbmNvbWUtc291cmNlcycpXHJcblx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKGluY29tZXMpIHtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKGluY29tZXMpO1xyXG5cdFx0XHR9KS5lcnJvcihmdW5jdGlvbihlcnIpIHtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZWplY3QoZXJyKTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2U7XHJcblx0fTtcclxuXHJcblx0dmFyIHNhdmVJbmNvbWUgPSBmdW5jdGlvbihuZXdJbmNvbWUpIHtcclxuXHRcdHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XHJcblxyXG5cdFx0JGh0dHAucG9zdChkZXBsb3lkICsgJy9pbmNvbWUtc291cmNlcycsIHtcclxuXHRcdFx0am9iOiBuZXdJbmNvbWUuam9iLFxyXG5cdFx0XHRpbmNvbWVUeXBlSWQ6IG5ld0luY29tZS5pbmNvbWVUeXBlLmlkLFxyXG5cdFx0XHRwYXlyYXRlOiBuZXdJbmNvbWUucGF5cmF0ZSxcclxuXHRcdFx0aG91cnM6IG5ld0luY29tZS5ob3VycyxcclxuXHRcdFx0dGF4UGVyY2VudDogbmV3SW5jb21lLnRheFBlcmNlbnRcclxuXHRcdH0pLnN1Y2Nlc3MoZnVuY3Rpb24oaW5jb21lKSB7XHJcblx0XHRcdGRlZmVycmVkLnJlc29sdmUoaW5jb21lKTtcclxuXHRcdH0pLmVycm9yKGZ1bmN0aW9uKGVycikge1xyXG5cdFx0XHRkZWZlcnJlZC5yZWplY3QoZXJyKTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xyXG5cdH07XHJcblxyXG5cdC8vaW5jb21lLXR5cGVzXHJcblx0dmFyIGluY29tZVR5cGVzID0gZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xyXG5cclxuXHRcdCRodHRwLmdldChkZXBsb3lkICsgJy9pbmNvbWUtdHlwZXMnKVxyXG5cdFx0XHQuc3VjY2VzcyhmdW5jdGlvbihpbmNvbWVUeXBlcykge1xyXG5cdFx0XHRcdGRlZmVycmVkLnJlc29sdmUoaW5jb21lVHlwZXMpO1xyXG5cdFx0XHR9KS5lcnJvcihmdW5jdGlvbihlcnIpIHtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZWplY3QoZXJyKTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2U7XHJcblx0fVxyXG5cclxuXHR2YXIgaW5jb21lVHlwZSA9IGZ1bmN0aW9uKGlkKSB7XHJcblx0XHR2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xyXG5cclxuXHRcdCRodHRwLmdldChkZXBsb3lkICsgJy9pbmNvbWUtdHlwZXM/aWQ9JyArIGlkKVxyXG5cdFx0XHQuc3VjY2VzcyhmdW5jdGlvbihpbmNvbWVUeXBlKSB7XHJcblx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZSh0eXBlKTtcclxuXHRcdFx0fSkuZXJyb3IoZnVuY3Rpb24oZXJyKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coZXJyKTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcclxuXHR9O1xyXG5cclxuXHR0aGlzLmdldEFsbEJ1ZGdldHMgPSBidWRnZXRzO1xyXG5cdHRoaXMuc2F2ZUJ1ZGdldCA9IHNhdmVCdWRnZXQ7XHJcblx0dGhpcy5nZXRBbGxCdWRnZXRJdGVtcyA9IGJ1ZGdldEl0ZW1zO1xyXG5cdHRoaXMuc2F2ZUJ1ZGdldEl0ZW0gPSBzYXZlQnVkZ2V0SXRlbTtcclxuXHJcblx0dGhpcy5nZXRBbGxJbmNvbWVzID0gaW5jb21lcztcclxuXHR0aGlzLnNhdmVJbmNvbWUgPSBzYXZlSW5jb21lO1xyXG5cclxuXHR0aGlzLmdldEFsbEluY29tZVR5cGVzID0gaW5jb21lVHlwZXM7XHJcblx0dGhpcy5nZXRJbmNvbWVUeXBlID0gaW5jb21lVHlwZTtcclxufVxyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2J1ZGdldHRpbmdJc0Z1bicpXHJcblx0LmNvbnN0YW50KCdkZXBsb3lkJywgJ2h0dHA6Ly9sb2NhbGhvc3Q6MjQwMycpXHJcblx0LnNlcnZpY2UoJ2RlcGxveWRTZXJ2aWNlJywgWyckaHR0cCcsICckcScsICdkZXBsb3lkJywgZGVwbG95ZFNlcnZpY2VdKTsiLCIvL25vcm1hbGl6ZSBpbmNvbWUgZmxlc2hpbmcgb3V0IGdyb3NzIGFuZCBuZXQgbnVtYmVyc1xyXG5mdW5jdGlvbiBub3JtYWxpemVJbmNvbWVzKGluY29tZXMpIHtcclxuXHRpZighYW5ndWxhci5pc0FycmF5KGluY29tZXMpKVxyXG5cdFx0aW5jb21lcyA9IFtpbmNvbWVzXTtcclxuXHJcblx0dmFyIG5vcm1hbGl6ZWRJbmNvbWVzID0gW107XHJcblxyXG5cdGFuZ3VsYXIuZm9yRWFjaChpbmNvbWVzLCBmdW5jdGlvbihpbmNvbWUpIHtcclxuXHRcdHZhciBub3JtSW5jb21lID0ge307XHJcblxyXG5cdFx0bm9ybUluY29tZS5qb2IgPSBpbmNvbWUuam9iO1xyXG5cdFx0bm9ybUluY29tZS5wYXlyYXRlID0gaW5jb21lLnBheXJhdGU7XHJcblx0XHRub3JtSW5jb21lLmhvdXJzID0gaW5jb21lLmhvdXJzO1xyXG5cdFx0bm9ybUluY29tZS5ncm9zcyA9IGluY29tZS5wYXlyYXRlICogaW5jb21lLmhvdXJzICogNDtcclxuXHRcdG5vcm1JbmNvbWUudGF4ID0gaW5jb21lLnRheFBlcmNlbnQ7XHJcblx0XHRub3JtSW5jb21lLm5ldCA9IG5vcm1JbmNvbWUuZ3Jvc3MgKiAoMSAtIChpbmNvbWUudGF4UGVyY2VudCAvIDEwMCkpO1xyXG5cdFx0bm9ybUluY29tZS5iaXdlZWtseSA9IG5vcm1JbmNvbWUubmV0IC8gMjtcclxuXHJcblx0XHRub3JtYWxpemVkSW5jb21lcy5wdXNoKG5vcm1JbmNvbWUpO1xyXG5cdH0pXHJcblxyXG5cdHJldHVybiBub3JtYWxpemVkSW5jb21lcztcclxufVxyXG5cclxuLy9yZXR1cm4gaG91cnMgYmFzZWQgb24gaW5jb21lIHR5cGVcclxuZnVuY3Rpb24gZ2V0SG91cnModHlwZSkge1xyXG5cdHN3aXRjaCh0eXBlKXtcclxuXHRcdGNhc2UgJ1dlZWtseSc6XHJcblx0XHRjYXNlICdCaS1XZWVrbHknOlxyXG5cdFx0Y2FzZSAnWWVhcmx5JzpcclxuXHRcdFx0cmV0dXJuIDQwO1xyXG5cdFx0Y2FzZSAnU2VtaS1Nb250aGx5JzpcclxuXHRcdGNhc2UgJ01vbnRobHknOlxyXG5cdFx0XHRyZXR1cm4gKDQwKjEzLzEyKTsgLy8xMyB3ZWVrIG1vbnRocyBpbiAxMiBtb250aHMgYmFzZWQgb24gNTIgd2Vla3MveWVhclxyXG5cdH1cclxufVxyXG5cclxuLy9yZXR1cm5zIHBheXJhdGUgYWRqdXN0ZWQgdG8gNDAgaG91ci93ZWVrIHJhdGVcclxuZnVuY3Rpb24gZ2V0QWRqdXN0ZWRQYXlyYXRlKHBheXJhdGUsIHR5cGUpe1xyXG5cdHN3aXRjaCh0eXBlKXtcclxuXHRcdGNhc2UgJ1dlZWtseSc6XHJcblx0XHRcdHJldHVybiBwYXlyYXRlOyAvL2RvIG5vdGhpbmcgcGF5cmF0ZSBpcyB3aGF0IGl0IGlzXHJcblx0XHRjYXNlICdCaS1XZWVrbHknOlxyXG5cdFx0XHRyZXR1cm4gcGF5cmF0ZSAvIDgwOyAvLzgwIGhvdXJzIGluIDIgd2Vla3NcclxuXHRcdGNhc2UgJ1NlbWktTW9udGhseSc6XHJcblx0XHRcdHJldHVybiBwYXlyYXRlIC8gKDQwKjEzLzYpOyAvLzg2LjY2NjYgaG91cnMgaW4gYSBzZW1pLW1vbnRoXHJcblx0XHRjYXNlICdNb250aGx5JzpcclxuXHRcdFx0cmV0dXJuIHBheXJhdGUgLyAoNDAqMTMvMyk7IC8vMTczLjMzMzMgaG91cnMgaW4gYSBtb250aFxyXG5cdFx0Y2FzZSAnWWVhcmx5JzpcclxuXHRcdFx0cmV0dXJuIHBheXJhdGUgLyAyMDgwOyAvLy8yMDgwIGhvdXJzIGluIGEgeWVhclxyXG5cdH1cclxufVxyXG5cclxuLy9pbmNvbWUgc2VydmljZSBwcm92aWRlcyBtZXRob2RzIHRvIGFkZCBhbmQgZ2V0IGluY29tZXNcclxuZnVuY3Rpb24gaW5jb21lU2VydmljZSgkcSwgZGVwbG95ZFNlcnZpY2UpIHtcclxuXHR2YXIgaW5jb21lcyA9IFtdO1xyXG5cdHZhciBpbmNvbWVUeXBlcyA9IFtdO1xyXG5cclxuXHRcclxuXHQvL0dldHMgYW5kIFNhdmVzLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblx0Ly9pbmNvbWVzXHJcblx0dmFyIGdldEFsbEluY29tZXMgPSBmdW5jdGlvbigpIHtcclxuXHRcdGlmKGluY29tZXMubGVuZ3RoICE9IDApe1xyXG5cdFx0XHRyZXR1cm4gJHEud2hlbihpbmNvbWVzKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBkZXBsb3lkU2VydmljZS5nZXRBbGxJbmNvbWVzKClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oYWxsSW5jb21lcykge1xyXG5cdFx0XHRcdGluY29tZXMgPSBub3JtYWxpemVJbmNvbWVzKGFsbEluY29tZXMpO1xyXG5cdFx0XHRcdHJldHVybiBpbmNvbWVzO1xyXG5cdFx0XHR9KTtcclxuXHR9O1xyXG5cclxuXHR2YXIgc2F2ZUluY29tZSA9IGZ1bmN0aW9uKG5ld0luY29tZSl7XHJcblx0XHRuZXdJbmNvbWUucGF5cmF0ZSA9IGdldEFkanVzdGVkUGF5cmF0ZShuZXdJbmNvbWUucGF5cmF0ZSwgbmV3SW5jb21lLmluY29tZVR5cGUubmFtZSk7XHJcblx0XHRuZXdJbmNvbWUuaG91cnMgPSAoIW5ld0luY29tZS5ob3VycykgPyBnZXRIb3VycyhuZXdJbmNvbWUuaW5jb21lVHlwZS5uYW1lKSA6IG5ld0luY29tZS5ob3VycztcclxuXHJcblx0XHRkZXBsb3lkU2VydmljZS5zYXZlSW5jb21lKG5ld0luY29tZSlcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24obmV3SW5jb21lKSB7XHJcblx0XHRcdFx0aW5jb21lcy5wdXNoKHNlbGYubm9ybWFsaXplSW5jb21lcyhuZXdJbmNvbWUpWzBdKTtcclxuXHRcdFx0fSwgZnVuY3Rpb24oZXJyKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coZXJyKVxyXG5cdFx0XHR9KTtcclxuXHR9O1xyXG5cclxuXHQvL2luY29tZS10eXBlc1xyXG5cdHZhciBnZXRBbGxJbmNvbWVUeXBlcyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0aWYoaW5jb21lVHlwZXMgIT0gMCl7XHJcblx0XHRcdHJldHVybiAkcS53aGVuKHR5cGVzKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBkZXBsb3lkU2VydmljZS5nZXRBbGxJbmNvbWVUeXBlcygpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKGFsbEluY29tZVR5cGVzKSB7XHJcblx0XHRcdFx0aW5jb21lVHlwZXMgPSBhbGxJbmNvbWVUeXBlcztcclxuXHRcdFx0XHRyZXR1cm4gaW5jb21lVHlwZXM7XHJcblx0XHRcdH0pO1xyXG5cdH07XHJcblxyXG5cdHZhciBnZXRJbmNvbWVUeXBlID0gZnVuY3Rpb24oaWQpIHtcclxuXHRcdHJldHVybiBkZXBsb3lkU2VydmljZS5nZXRUeXBlKGlkKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihpbmNvbWVUeXBlKSB7XHJcblx0XHRcdFx0cmV0dXJuIGluY29tZVR5cGU7XHJcblx0XHRcdH0pO1xyXG5cdH07XHJcblx0Ly9FbmQgR2V0cyBhbmQgU2F2ZXMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuXHQvL1N0YXRpc3RpY3MgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcblx0dmFyIHRvdGFsID0gZnVuY3Rpb24ocHJvcGVydHkpIHtcclxuXHRcdGlmKGluY29tZXMubGVuZ3RoID4gMCAmJiBpc0Zpbml0ZShpbmNvbWVzWzBdW3Byb3BlcnR5XSkpXHJcblx0XHRcdHJldHVybiBpbmNvbWVzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXJyKSB7IHJldHVybiBwcmV2ICsgY3Vycltwcm9wZXJ0eV07IH0sIDApO1xyXG5cdH07XHJcblxyXG5cdHZhciB5ZWFybHlHcm9zcyA9IGZ1bmN0aW9uKGluY29tZSkge1xyXG5cdFx0cmV0dXJuIGluY29tZS5ncm9zcyAqIDEzOyAvLzEzIHdlZWsgbW9udGhzIGluIGEgeWVhciAoNTIgd2Vla3MpXHJcblx0fTtcclxuXHJcblx0dmFyIHllYXJseU5ldCA9IGZ1bmN0aW9uKGluY29tZSkge1xyXG5cdFx0cmV0dXJuIGluY29tZS5uZXQgKiAxMztcclxuXHR9O1xyXG5cclxuXHR2YXIgdG90YWxZZWFybHlHcm9zcyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0cmV0dXJuIGluY29tZXMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cnIpIHtcclxuXHRcdFx0cmV0dXJuIHByZXYgKyB5ZWFybHlHcm9zcyhjdXJyKTtcclxuXHRcdH0sIDApO1xyXG5cdH07XHJcblxyXG5cdHZhciB0b3RhbFllYXJseU5ldCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0cmV0dXJuIGluY29tZXMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cnIpIHtcclxuXHRcdFx0cmV0dXJuIHByZXYgKyB5ZWFybHlOZXQoY3Vycik7XHJcblx0XHR9LCAwKTtcclxuXHR9O1xyXG5cdC8vRW5kIFN0YXRpc3RpY3MgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcblx0dGhpcy5nZXRBbGxJbmNvbWVzID0gZ2V0QWxsSW5jb21lcztcclxuXHR0aGlzLnNhdmVJbmNvbWUgPSBzYXZlSW5jb21lO1xyXG5cclxuXHR0aGlzLmdldEFsbEluY29tZVR5cGVzID0gZ2V0QWxsSW5jb21lVHlwZXM7XHJcblx0dGhpcy5nZXRJbmNvbWVUeXBlID0gZ2V0SW5jb21lVHlwZTtcclxuXHJcblx0dGhpcy55ZWFybHlHcm9zcyA9IHllYXJseUdyb3NzO1xyXG5cdHRoaXMudG90YWxZZWFybHlHcm9zcyA9IHRvdGFsWWVhcmx5R3Jvc3M7XHJcblx0dGhpcy55ZWFybHlOZXQgPSB5ZWFybHlOZXQ7XHJcblx0dGhpcy50b3RhbFllYXJseU5ldCA9IHRvdGFsWWVhcmx5TmV0O1xyXG5cdHRoaXMudG90YWwgPSB0b3RhbDtcclxufVxyXG5cclxuYW5ndWxhci5tb2R1bGUoJ2J1ZGdldHRpbmdJc0Z1bicpXHJcblx0LnNlcnZpY2UoJ2luY29tZVNlcnZpY2UnLCBbJyRxJywgJ2RlcGxveWRTZXJ2aWNlJywgaW5jb21lU2VydmljZV0pOyIsImFuZ3VsYXIubW9kdWxlKCdidWRnZXR0aW5nSXNGdW4nLCBbJ2FuZ3VsYXIuZmlsdGVyJ10pXHJcblx0LmNvbnRyb2xsZXIoJ0Jhc2VDb250cm9sbGVyJywgWyckc2NvcGUnLCBmdW5jdGlvbigkc2NvcGUpIHtcclxuXHRcdCRzY29wZS53ZWxjb21lTWVzc2FnZSA9ICdXZWxjb21lIFNhdnkgQnVkZ2V0dGVyJztcclxuXHR9XSk7IiwiYW5ndWxhci5tb2R1bGUoXCJjdXN0b21GaWx0ZXJzXCIsIFtdKVxyXG4gICAgLmZpbHRlcihcInVuaXF1ZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChkYXRhLCBwcm9wZXJ0eU5hbWUpIHtcclxuICAgICAgICAgICAgaWYgKGFuZ3VsYXIuaXNBcnJheShkYXRhKSAmJiBhbmd1bGFyLmlzU3RyaW5nKHByb3BlcnR5TmFtZSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciByZXN1bHRzID0gW107XHJcbiAgICAgICAgICAgICAgICB2YXIga2V5cyA9IHt9O1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbCA9IGRhdGFbaV1bcHJvcGVydHlOYW1lXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYW5ndWxhci5pc1VuZGVmaW5lZChrZXlzW3ZhbF0pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleXNbdmFsXSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChkYXRhW2ldKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXN1bHRzKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHRzO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfSk7XHJcbiIsImFuZ3VsYXIubW9kdWxlKCdidWRnZXR0aW5nSXNGdW4nKVxyXG5cdC5jb250cm9sbGVyKCdCdWRnZXRDb250cm9sbGVyJywgWydidWRnZXRTZXJ2aWNlJywgJ2luY29tZVNlcnZpY2UnLCBmdW5jdGlvbihidWRnZXRTZXJ2aWNlLCBpbmNvbWVTZXJ2aWNlKSB7XHJcblx0XHR2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG5cdFx0c2VsZi5idWRnZXRzID0gW107XHJcblx0XHRzZWxmLmJ1ZGdldEl0ZW1zID0gW107XHJcbiAgXHJcblx0XHRzZWxmLmJ1ZGdldENhcCA9IGJ1ZGdldFNlcnZpY2UuYnVkZ2V0Q2FwO1xyXG5cclxuXHRcdHNlbGYuYnVkZ2V0VXRpbGl6YXRpb24gPSBidWRnZXRTZXJ2aWNlLmJ1ZGdldFV0aWxpemF0aW9uO1xyXG5cclxuXHRcdHNlbGYuYnVkZ2V0QmFsYW5jZSA9IGJ1ZGdldFNlcnZpY2UuYnVkZ2V0QmFsYW5jZTtcclxuXHJcblx0XHRzZWxmLmd1aWRlbGluZVRvdGFsID0gYnVkZ2V0U2VydmljZS5ndWlkZWxpbmVUb3RhbDtcclxuXHJcblx0XHRzZWxmLnRheFV0aWxpemF0aW9uID0gYnVkZ2V0U2VydmljZS50YXhVdGlsaXphdGlvbjtcclxuXHJcblx0XHRzZWxmLm92ZXJ2aWV3VXRpbGl6YXRpb25Ub3RhbCA9IGJ1ZGdldFNlcnZpY2Uub3ZlcnZpZXdVdGlsaXphdGlvblRvdGFsO1xyXG5cclxuICBcdFx0YnVkZ2V0U2VydmljZS5nZXRBbGxCdWRnZXRzKClcclxuICBcdFx0XHQudGhlbihmdW5jdGlvbihidWRnZXRzKSB7XHJcbiAgXHRcdFx0XHRzZWxmLmJ1ZGdldHMgPSBidWRnZXRzO1xyXG4gIFx0XHRcdFx0YnVkZ2V0U2VydmljZS5nZXRBbGxCdWRnZXRJdGVtcygpXHJcbiAgXHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uKGl0ZW1zKSB7XHJcbiAgXHRcdFx0XHRcdFx0c2VsZi5idWRnZXRJdGVtcyA9IGl0ZW1zO1xyXG4gIFx0XHRcdFx0XHR9LCBmdW5jdGlvbihlcnIpIHtcclxuICBcdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpO1xyXG4gIFx0XHRcdFx0XHR9KTtcclxuICBcdFx0XHR9LCBmdW5jdGlvbihlcnIpIHtcclxuICBcdFx0XHRcdGNvbnNvbGUubG9nKGVycik7XHJcbiAgXHRcdFx0fSk7XHJcblxyXG5cdFx0c2VsZi5uZXdCdWRnZXQgPSB7fTtcclxuXHJcblx0XHRzZWxmLnNhdmVCdWRnZXQgPSBmdW5jdGlvbihuZXdCdWRnZXQpIHtcclxuXHRcdFx0YnVkZ2V0U2VydmljZS5zYXZlQnVkZ2V0KG5ld0J1ZGdldCk7XHJcblx0XHRcdHNlbGYubmV3QnVkZ2V0ID0ge307XHJcblx0XHR9O1xyXG5cclxuXHRcdHNlbGYubmV3QnVkZ2V0SXRlbSA9IHt9O1xyXG5cclxuXHRcdHNlbGYuc2F2ZUJ1ZGdldEl0ZW0gPSBmdW5jdGlvbihuZXdCdWRnZXRJdGVtKSB7XHJcblx0XHRcdGJ1ZGdldFNlcnZpY2Uuc2F2ZUJ1ZGdldEl0ZW0obmV3QnVkZ2V0SXRlbSk7XHJcblx0XHRcdHNlbGYubmV3QnVkZ2V0SXRlbSA9IHt9O1xyXG5cdFx0fTtcclxuXHJcblx0XHRzZWxmLnRvdGFsID0gYnVkZ2V0U2VydmljZS50b3RhbDtcclxuXHR9XSk7IiwiYW5ndWxhci5tb2R1bGUoJ2J1ZGdldHRpbmdJc0Z1bicpXHJcblx0LmNvbnRyb2xsZXIoJ0luY29tZUNvbnRyb2xsZXInLCBbJ2luY29tZVNlcnZpY2UnLCBcclxuXHRcdGZ1bmN0aW9uKGluY29tZVNlcnZpY2UpIHtcclxuXHRcdFx0dmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuXHRcdFx0c2VsZi5pbmNvbWVzID0gW107XHJcblx0XHRcdHNlbGYuaW5jb21lVHlwZXMgPSBbXTtcclxuXHJcblx0XHRcdHNlbGYudG90YWxZZWFybHlHcm9zcyA9IGluY29tZVNlcnZpY2UudG90YWxZZWFybHlHcm9zcztcclxuXHRcdFx0c2VsZi50b3RhbFllYXJseU5ldCA9IGluY29tZVNlcnZpY2UudG90YWxZZWFybHlOZXQ7XHJcblx0XHRcdC8vaW5pdGlhbGx5IGdldCBpbmNvbWVzXHJcblx0XHRcdGluY29tZVNlcnZpY2UuZ2V0QWxsSW5jb21lcygpXHJcblx0XHRcdFx0LnRoZW4oZnVuY3Rpb24oaW5jb21lcykge1xyXG5cdFx0XHRcdFx0c2VsZi5pbmNvbWVzID0gaW5jb21lcztcclxuXHRcdFx0XHR9LCBmdW5jdGlvbihlcnIpIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKGVycik7XHJcblx0XHRcdFx0fSk7XHJcblxyXG5cdFx0XHQvL2luaXRpYWxseSBnZXQgaW5jb21lVHlwZXNcclxuXHRcdFx0aW5jb21lU2VydmljZS5nZXRBbGxJbmNvbWVUeXBlcygpXHJcblx0XHRcdFx0LnRoZW4oZnVuY3Rpb24oaW5jb21lVHlwZXMpIHtcclxuXHRcdFx0XHRcdHNlbGYuaW5jb21lVHlwZXMgPSBpbmNvbWVUeXBlcztcclxuXHRcdFx0XHR9LCBmdW5jdGlvbihlcnIpIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKGVycik7XHJcblx0XHRcdFx0fSk7XHJcblxyXG5cdFx0XHRzZWxmLm5ld0luY29tZSA9IHt9O1xyXG5cclxuXHRcdFx0c2VsZi5zYXZlSW5jb21lID0gZnVuY3Rpb24obmV3SW5jb21lKSB7XHJcblx0XHRcdFx0aW5jb21lU2VydmljZS5zYXZlSW5jb21lKG5ld0luY29tZSk7XHJcblx0XHRcdFx0c2VsZi5uZXdJbmNvbWUgPSB7fTtcclxuXHRcdFx0fTtcclxuXHJcblx0XHRcdHNlbGYudG90YWwgPSBpbmNvbWVTZXJ2aWNlLnRvdGFsO1xyXG5cdH1dKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
