/*! cal-heatmap v2.0.1 (Thu Mar 07 2013 15:45:21)
 *  ---------------------------------------------
 *  A module to create calendar heat map to visualise time data series a la github contribution graph
 *  https://github.com/kamisama/cal-heatmap
 *  Licensed under the MIT license
 *  Copyright 2013 Wan Qi Chen
 */

var CalHeatMap = function() {

	"use strict";

	var self = this;

	// Default settings
	this.options = {
		// DOM ID of the container to append the graph to
		id : "cal-heatmap",

		// Threshold for each scale
		scale : [10,20,30,40],

		// Number of domain to display on the graph
		range : 12,

		// Size of each cell, in pixel
		cellsize : 10,

		// Padding between each cell, in pixel
		cellpadding : 2,

		domainGutter : 2,

		format : {
			// Formatting of the date when hovering an subdomain block
			// @default : null, will use the formatting according to domain type
			date : null,

			// Formatting of domain label
			// @default : null, will use the formatting according to domain type
			legend : null
		},

		// Callback when clicking on a time block
		onClick : function(date, itemNb) {},

		// Whether to display the scale
		displayScale : true,

		// Name of the items to represent in the calendar
		itemName : ["item", "items"],

		// Start date of the graph
		// @default now
		start : new Date(),

		// URL, where to fetch the original datas
		data : "",

		// Load remote data on calendar creation
		// When false, the calendar will be left empty
		loadOnInit : true,

		domain : "hour",

		subDomain : "min",

		// Animation duration
		duration : 500,

		// Domain browsing
		// Dynamically change calendar domain by loading
		// next/previous domain
		browsing: false,

		browsingOptions: {
			nextLabel : "Next",
			previousLabel : "Previous"
		},

		// Callback after loading the next domain in the calendar
		afterLoadNextDomain : function(start) {},

		// Callback after loading the previous domain in the calendar
		afterLoadPreviousDomain : function(start) {}
	};



	this._domainType = {
		"min" : {
			row: 10,
			column: function(d) { return 6; },
			position: {
				x : function(d) { return Math.floor(d.getMinutes() / self._domainType.min.row); },
				y : function(d) { return d.getMinutes() % self._domainType.min.row;}
			},
			format: {
				date: "%H:%M, %A %B %-e, %Y",
				legend: "",
				connector: "at"
			},
			extractUnit : function(d) { return d.getMinutes(); }
		},
		"hour" : {
			name: "hour",
			row: 6,
			column: function(d) {
				switch(self.options.domain) {
					case "day" : return 4;
					case "week" : return 28;
					case "month" : return self.getEndOfMonth(d).getDate() * 4;
				}
			},
			position: {
				x : function(d) {
					if (self.options.domain === "month") {
						return Math.floor(d.getHours() / self._domainType.hour.row) + (d.getDate()-1)*4;
					} else if (self.options.domain === "week") {
						return Math.floor(d.getHours() / self._domainType.hour.row) + self.getWeekDay(d)*4;
					}
					return Math.floor(d.getHours() / self._domainType.hour.row);
				},
				y : function(d) { return d.getHours() % self._domainType.hour.row;}
			},
			format: {
				date: "%Hh, %A %B %-e, %Y",
				legend: "%H:00",
				connector: "at"
			},
			extractUnit : function(d) {
				var formatHour = d3.time.format("%H");
				return d.getFullYear() + "" +  self.getDayOfYear(d) + "" + formatHour(d);
			}
		},
		"day" : {
			name: "day",
			row: 7,
			column: function(d) {
				d = new Date(d);
				switch(self.options.domain) {
					case "year" : return 54;
					case "month" : return self.getWeekNumber(new Date(d.getFullYear(), d.getMonth()+1, 0)) - self.getWeekNumber(d) + 1;
					case "week" : return 1;
				}
			},
			position: {
				x : function(d) {
					switch(self.options.domain) {
						case "week" : return 0;
						case "month" :
							return self.getWeekNumber(d) - self.getWeekNumber(new Date(d.getFullYear(), d.getMonth()));
						case "year" : return self.getWeekNumber(d) ;
					}
				},
				y : function(d) { return (d.getDay() === 0 ? 6 : d.getDay()-1);}
			},
			format: {
				date: "%A %B %-e, %Y",
				legend: "%e %b",
				connector: "on"
			},
			extractUnit : function(d) { return d.getFullYear() + "" + self.getDayOfYear(d); }
		},
		"week" : {
			name: "week",
			row: 1,
			column: function(d) {
				d = new Date(d);
				switch(self.options.domain) {
					case "year" : return 54;
					case "month" : return self.getWeekNumber(new Date(d.getFullYear(), d.getMonth()+1, 0)) - self.getWeekNumber(d);
				}
				return 1;
			},
			position: {
				x: function(d) {
					switch(self.options.domain) {
						case "year" : return self.getWeekNumber(d);
						case "month" : return self.getWeekNumber(d) - self.getWeekNumber(new Date(d.getFullYear(), d.getMonth())) - 1;
					}
				},
				y: function(d) {
					return 0;
				}
			},
			format: {
				date: "%B Week #%W",
				legend: "%B Week #%W",
				connector: "on"
			},
			extractUnit : function(d) { return self.getWeekNumber(d); }
		},
		"month" : {
			name: "month",
			row: 1,
			column: function(d) {return 12;},
			position: {
				x : function(d) { return Math.floor(d.getMonth() / self._domainType.month.row); },
				y : function(d) { return d.getMonth() % self._domainType.month.row;}
			},
			format: {
				date: "%B %Y",
				legend: "%B",
				connector: "on"
			},
			extractUnit : function(d) { return d.getMonth(); }
		},
		"year" : {
			name: "year",
			row: 1,
			column: function(d) {return 12;},
			position: {
				x : function(d) { return Math.floor(d.getFullYear() / this._domainType.year.row); },
				y : function(d) { return d.getFullYear() % this._domainType.year.row;}
			},
			format: {
				date: "%Y",
				legend: "%Y",
				connector: "on"
			},
			extractUnit : function(d) { return d.getFullYear(); }
		}
	};

	this.svg = null;

	// Record all the valid domains
	// Each domain value is a timestamp in milliseconds
	this._domains = [];

	// Total width of the graph
	var width = 0;

	// Save domains width
	var domainsWidth = [];

	/**
	 * Display the graph for the first time
	 * @return bool True if the calendar is created
	 */
	var _init = function() {

		self.formatDate = d3.time.format(self.options.format.date);
		self._domains = self.getDomain(self.options.start).map(function(d) { return d.getTime(); });

		if (self.options.browsing) {
			d3.select("#" + self.options.id).append("a")
			.attr("href", "#")
			.attr("rel", "prev")
			.attr("class", "graph-browse-previous")
			.attr("title", "Load previous " + self._domainType[self.options.domain].name)
			.on("click", function(d) { self.loadPreviousDomain(); })
			.html(self.options.browsingOptions.previousLabel);

			d3.select("#" + self.options.id).append("a")
			.attr("href", "#")
			.attr("rel", "next")
			.attr("class", "graph-browse-next")
			.attr("title", "Load next " + self._domainType[self.options.domain].name)
			.on("click", function(d) { self.loadNextDomain(); })
			.html(self.options.browsingOptions.nextLabel);
		}

		d3.select("#" + self.options.id).append("svg")
			.attr("class", "graph");

		self.paint();




		// Display scale if needed
		if (self.options.displayScale) {
			self.displayScale();
		}

		// Fill the graph with some datas
		if (self.options.loadOnInit) {
			self.fill(
				self.getDatas(
					self.options.data,
					new Date(self._domains[0]),
					self.getSubDomain(self._domains[self._domains.length-1]).pop()
				),
				self.svg);
		}

		return true;
	};

	this.loadNextDomain = function() {
		if (d3.event) {
			d3.event.preventDefault();
		}

		self._domains.push(self.getNextDomain().getTime());
		self._domains.shift();

		self.paint();

		self.getDatas(
			self.options.data,
			new Date(self._domains[self._domains.length-1]),
			self.getSubDomain(self._domains[self._domains.length-1]).pop(),
			self.svg
		);

		self.afterLoadNextDomain(new Date(self._domains[self._domains.length-1]));

	};

	this.loadPreviousDomain = function() {
		if (d3.event) {
			d3.event.preventDefault();
		}

		self._domains.unshift(self.getPreviousDomain().getTime());
		self._domains.pop();

		self.paint(true);

		self.getDatas(
			self.options.data,
			new Date(self._domains[0]),
			self.getSubDomain(self._domains[0]).pop(),
			self.svg
		);

		self.afterLoadPreviousDomain(new Date(self._domains[0]));
	};

	this.paint = function(reverse) {

		if (typeof reverse === "undefined") {
			reverse = false;
		}

		var graphLegendHeight = self.options.cellsize*2;

		// Compute the width of the domain block
		// @param int d Domain start timestamp
		var w = function(d) {
			return self.options.cellsize*self._domainType[self.options.subDomain].column(d) + self.options.cellpadding*self._domainType[self.options.subDomain].column(d);
		};

		// Compute the height of the domain block
		var h = self.options.cellsize*self._domainType[self.options.subDomain].row + self.options.cellpadding*self._domainType[self.options.subDomain].row + self.options.cellpadding;

		// Format the domain legend according to the domain type
		var legendFormat = d3.time.format(self.options.format.legend);

		var positionX = function(i) {
			if (width === 0) {
				return domainsWidth[i];
			} else {
				return reverse ? domainsWidth[0] : domainsWidth[i+1];
			}
		};

		var domainPositionXExit = function(d) {
			if (reverse) {
				return width;
			} else {
				return w(d) * -1 - self.options.domainGutter;
			}
		};

		var labelPositionXExit = function(d) {
			if (reverse) {
				return width + w(d)/2;
			} else {
				return (self.options.domainGutter + w(d)/2) * -1;
			}
		};

		// Painting all the domains
		var domainSvg = d3.select("#" + self.options.id + " .graph")
			.attr("height", h + 20)
			.selectAll("svg")
			.data(self._domains, function(d) { return d;});

		var tempWidth = 0;
		var tempLastDomainWidth = 0;


		var svg = domainSvg
			.enter()
			.insert("svg:svg")
			.attr("width", function(d){
				var wd = w(d);

				tempWidth += tempLastDomainWidth = wd+self.options.domainGutter;

				if (width === 0) {
					domainsWidth.push(tempWidth - tempLastDomainWidth);
				} else {
					if (reverse) {
						domainsWidth.unshift(tempLastDomainWidth * -1);
					} else {
						domainsWidth.push(width);
					}

				}

				return wd;
			})
			.attr("height", h + graphLegendHeight)
			.attr("x", function(d, i){ return positionX(i); })
			;


		// Appending a label to each domain
		var label = d3.select("#" + self.options.id + " .graph").selectAll("text")
			.data(self._domains, function(d) { return d;});

		label
			.enter().insert("text")
			.attr("y", h + graphLegendHeight/1.5)
			.attr("x", function(d, i){ return positionX(i) + w(d) / 2; })
			.attr("class", "graph-label")
			.attr("text-anchor", "middle")
			.attr("vertical-align", "middle")
			.text(function(d) { return legendFormat(new Date(d)); });


		// Drawing the sudomain inside each domain
		var rect = domainSvg.selectAll("rect")
			.data(function(d) { return self.getSubDomain(d); })
			.enter().append("svg:rect")
			.attr("class", "graph-rect")
			.attr("width", self.options.cellsize)
			.attr("height", self.options.cellsize)
			.attr("x", function(d) { return self.positionSubDomainX(d); })
			.attr("y", function(d) { return self.positionSubDomainY(d); })
			;

		// Appeding a title to each subdomain
		rect.append("svg:title").text(function(d){ return self.formatDate(d); });


		var exitDomainWidth = reverse ? (width-domainsWidth[domainsWidth.length-1]) : domainsWidth[1];

		if (width !== 0) {
			var i = domainsWidth.length-1;
			while (i >= 0) {
				if (reverse) {
					domainsWidth[i] -= domainsWidth[0];
				} else if (i >= 1) {
					domainsWidth[i] -= domainsWidth[1];
				}

				i--;
			}
			if (reverse) {
				domainsWidth.pop() ;
			} else {
				domainsWidth.shift();
			}
		}

		domainSvg.transition().duration(self.options.duration)
			.attr("x", function(d, i){ return domainsWidth[i]; })
		;

		domainSvg.exit().transition().duration(self.options.duration)
		.attr("x", function(d){ return domainPositionXExit(d); })
		.remove();

		label.transition().duration(self.options.duration)
		.attr("x", function(d, i){ return domainsWidth[i] + w(d) / 2; });

		label.exit().transition().duration(self.options.duration)
			.attr("x", function(d){ return labelPositionXExit(d); })
			.remove();

		if (width === 0) {
			width = tempWidth;
			d3.select("#" + self.options.id + " .graph").attr("width", width);
		} else if (tempLastDomainWidth !== exitDomainWidth) {
			// Compute the new width
			var tw = width + tempLastDomainWidth - exitDomainWidth;

			// If the new width is different, resize the graph
			if (tw !== width) {
				width = tw;
				d3.select("#" + self.options.id + " .graph")
					.transition().duration(self.options.duration)
					.attr("width", width)
				;
			}
		}

		if (self.svg === null) {
			self.svg = svg;
		} else {
			self.svg = d3.select("#" + self.options.id + " .graph").selectAll("svg")
			.data(self._domains, function(d) {return d;});
		}
	};


	this.init = function(settings) {

		// Merge settings with default
		if ( settings !== null && settings !== undefined && settings !== "undefined" ){
				for ( var opt in self.options ) {
					if ( settings[ opt ] !== null &&
						settings[ opt ] !== undefined &&
						settings[ opt ] !== "undefined" ){
							self.options[ opt ] = settings[ opt ];
				}
			}
		}

		if (!this._domainType.hasOwnProperty(self.options.domain) || self.options.domain === "min") {
			console.log("The domain name is not valid");
			return false;
		}

		var domain = self.getDomain(self.options.start);

		if (self.options.format.date === null) {
			self.options.format.date = this._domainType[self.options.subDomain].format.date;
		}

		if (self.options.format.legend === null) {
			self.options.format.legend = this._domainType[self.options.domain].format.legend;
		}

		return _init();

	};

};


CalHeatMap.prototype = {


	// =========================================================================//
	// CALLBACK																	//
	// =========================================================================//

	/**
	 * Callback when clicking on a subdomain cell
	 * @param  Date		d		Date of the subdomain block
	 * @param  int		itemNb	Number of items in that date
	 */
	onClick : function(d, itemNb) {
		return this.options.onClick(d, itemNb);
	},

	/**
	 * Callback after shifting the calendar one domain back
	 * @param  Date		start	Domain start date
	 * @param  Date		end		Domain end date
	 */
	afterLoadPreviousDomain: function(start) {
		var subDomain = this.getSubDomain(start);
		return this.options.afterLoadPreviousDomain(subDomain.shift(), subDomain.pop());
	},

	/**
	 * Callback after shifting the calendar one domain above
	 * @param  Date		start	Domain start date
	 * @param  Date		end		Domain end date
	 */
	afterLoadNextDomain: function(start) {
		var subDomain = this.getSubDomain(start);
		return this.options.afterLoadNextDomain(subDomain.shift(), subDomain.pop());
	},



	formatNumber: d3.format(",d"),

	// =========================================================================//
	// PAINTING : SCALE															//
	// =========================================================================//

	displayScale: function() {

		var parent = this;

		var scale = d3.select("#" + this.options.id)
			.append("svg:svg")
			.attr("class", "graph-scale")
			.attr("height", this.options.cellsize + (this.options.cellpadding*2))
			.selectAll().data(d3.range(0, this.options.scale.length+1));

		var scaleItem = scale
			.enter()
			.append("svg:rect")
			.attr("width", this.options.cellsize)
			.attr("height", this.options.cellsize)
			.attr("class", function(d){ return "graph-rect q" + (d+1); })
			.attr("transform", function(d) { return "translate(" + (d * (parent.options.cellsize + parent.options.cellpadding))  + ", " + parent.options.cellpadding + ")"; })
			.attr("fill-opacity", 0)
			;

		scaleItem.transition().delay(function(d, i) { return parent.options.duration * i/10;}).attr("fill-opacity", 1);

		scaleItem
			.append("svg:title")
			.text(function(d) {
				var nextThreshold = parent.options.scale[d+1];
				if (d === 0) {
					return "less than " + parent.options.scale[d] + " " + parent.options.itemName[1];
				} else if (d === parent.options.scale.length) {
					return "more than " + parent.options.scale[d-1] + " " + parent.options.itemName[1];
				} else {
					return "between " + parent.options.scale[d-1] + " and " + parent.options.scale[d] + " " + parent.options.itemName[1];
				}
			})
		;
	},

	// =========================================================================//
	// PAINTING : SUBDOMAIN FILLING												//
	// =========================================================================//

	/**
	 * Colorize all rectangles according to their items count
	 *
	 * @param  {[type]} data  [description]
	 */
	display: function(data, domain) {
		var parent = this;
		domain.each(function(domainUnit) {

			if (data.hasOwnProperty(domainUnit)) {
				d3.select(this).selectAll("rect")
					.attr("class", function(d) {
						var subDomainUnit = parent._domainType[parent.options.subDomain].extractUnit(d);

						return "graph-rect" +
						(data[domainUnit].hasOwnProperty(subDomainUnit) ?
							(" " + parent.scale(data[domainUnit][subDomainUnit])) : ""
						);
					})
					.on("click", function(d) {
						var subDomainUnit = parent._domainType[parent.options.subDomain].extractUnit(d);
						return parent.onClick(
							d,
							(data[domainUnit].hasOwnProperty(subDomainUnit) ? data[domainUnit][subDomainUnit] : 0)
						);
					})
					.select("title")
					.text(function(d) {
						var subDomainUnit = parent._domainType[parent.options.subDomain].extractUnit(d);

						return (
						(data[domainUnit].hasOwnProperty(subDomainUnit) ?
							(parent.formatNumber(data[domainUnit][subDomainUnit]) + " " + parent.options.itemName[(data[domainUnit][subDomainUnit] > 1 ? 1 : 0)] + " " + parent._domainType[parent.options.subDomain].format.connector + " ") :
							""
							) + parent.formatDate(d));
					});
				}
			}
		);
	},

	// =========================================================================//
	// POSITIONNING																//
	// =========================================================================//

	positionSubDomainX: function(d) {
		var index = this._domainType[this.options.subDomain].position.x(d);
		return index * this.options.cellsize + index * this.options.cellpadding;
	},

	positionSubDomainY: function(d) {
		var index = this._domainType[this.options.subDomain].position.y(d);
		return index * this.options.cellsize + index * this.options.cellpadding;
	},

	// =========================================================================//
	// DOMAIN COMPUTATION														//
	// =========================================================================//

	/**
	 * Return the day of the year for the date
	 * @param	Date
	 * @return  int Day of the year [1,366]
	 */
	getDayOfYear : d3.time.format("%j"),

	/**
	 * Return the week number of the year
	 * Monday as the first day of the week
	 * @return int	Week number [0-53]
	 */
	getWeekNumber : d3.time.format("%W"),


	getWeekDay : function(d) {
		if (d.getDay() === 0) {
			return 6;
		}
		return d.getDay()-1;
	},


	/**
	 * Get the last day of the month
	 * @param  Date|int	d	Date or timestamp in milliseconds
	 * @return Date			Last day of the month
	 */
	getEndOfMonth : function(d) {
		if (typeof d === "number") {
			d = new Date(d);
		}
		return new Date(d.getFullYear(), d.getMonth()+1, 0);
	},

	/**
	 * Return a range if week number
	 * @param  number|Date	d	A date, or timestamp in milliseconds
	 * @return Date				The start of the hour
	 */
	getWeekDomain: function (d, range) {
		var monday;
		if (d.getDay() === 1) {
			monday = new Date(d.getFullYear(), d.getMonth(), d.getDate());
		} else if (d.getDay() === 0) {
			monday = new Date(d.getFullYear(), d.getMonth(), d.getDate());
			monday.setDate(monday.getDate() - 6);
		} else {
			monday = new Date(d.getFullYear(), d.getMonth(), d.getDate()-d.getDay()+1);
		}
		var endDate = new Date(monday);

		var stop = new Date(endDate.setDate(endDate.getDate() + range * 7));

		return d3.time.mondays(Math.min(monday, stop), Math.max(monday, stop));
	},

	getYearDomain: function(d, range){
		var start = new Date(d.getFullYear(), 0);
		var stop = new Date(d.getFullYear()+range, 0);

		return d3.time.years(Math.min(start, stop), Math.max(start, stop));
	},

	/**
	 * Return all the minutes between from the same hour
	 * @param  number|Date	d	A date, or timestamp in milliseconds
	 * @return Date				The start of the hour
	 */
	getMinuteDomain: function (d, range) {
		var start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours());
		var stop = new Date(start.getTime() + 60 * 1000 * range);

		return d3.time.minutes(Math.min(start, stop), Math.max(start, stop));
	},

	/**
	 * Return the start of an hour
	 * @param  number|Date	d	A date, or timestamp in milliseconds
	 * @return Date				The start of the hour
	 */
	getHourDomain: function (d, range) {
		var start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours());
		var stop = range;
		if (typeof range === "number") {
			stop = new Date(start.getTime() + 3600 * 1000 * range);
		}

		return d3.time.hours(Math.min(start, stop), Math.max(start, stop));
	},

	/**
	 * Return the start of an hour
	 * @param  number|Date	d		A date, or timestamp in milliseconds
	 * @param  int			range	Number of days in the range
	 * @return Date					The start of the hour
	 */
	getDayDomain: function (d, range) {
		var start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
		var stop = new Date(start);
		stop = new Date(stop.setDate(stop.getDate() + parseInt(range, 10)));

		return d3.time.days(Math.min(start, stop), Math.max(start, stop));
	},

	/**
	 * Return the month domain for the current date
	 * @param  Date		d	A date
	 * @return Array
	 */
	getMonthDomain: function (d, range) {
		var start = new Date(d.getFullYear(), d.getMonth());
		var stop = new Date(start);
		stop = stop.setMonth(stop.getMonth()+range);

		return d3.time.months(Math.min(start, stop), Math.max(start, stop));
	},

	getDomain: function(date, range) {
		if (typeof date === "number") {
			date = new Date(date);
		}

		if (typeof range === "undefined") {
			range = this.options.range;
		}

		switch(this.options.domain) {
			case "hour"  : return this.getHourDomain(date, range);
			case "day"   : return this.getDayDomain(date, range);
			case "week"  : return this.getWeekDomain(date, range);
			case "month" : return this.getMonthDomain(date, range);
			case "year"  : return this.getYearDomain(date, range);
		}
	},

	getSubDomain: function(date) {
		if (typeof date === "number") {
			date = new Date(date);
		}

		var parent = this;

		var computeDaySubDomainSize = function(date, domain) {
			if (domain === "year") {
				return parent.getDayOfYear(new Date(date.getFullYear()+1, 0, 0));
			} else if (domain === "month") {
				var lastDayOfMonth = new Date(date.getFullYear(), date.getMonth()+1, 0);
				return lastDayOfMonth.getDate();
			} else if (domain === "week") {
				return 7;
			}
		};

		var computeMinSubDomainSize = function(date, domain) {
			if (domain === "day") {
				return 1440;
			} else if (domain === "hour") {
				return 60;
			} else if (domain === "week") {
				return 25200;
			}
		};

		var computeHourSubDomainSize = function(date, domain) {
			if (domain === "day") {
				return 24;
			} else if (domain === "week") {
				return 168;
			} else if (domain === "month") {
				var endOfMonth = new Date(date.getFullYear(), date.getMonth()+1, 0);
				return endOfMonth.getDate() * 24;
			}
		};

		var computeWeekSubDomainSize = function(date, domain) {
			if (domain === "month") {
				var endOfMonth = new Date(date.getFullYear(), date.getMonth()+1, 0);
				var endWeekNb = parent.getWeekNumber(endOfMonth);
				var startWeekNb = parent.getWeekNumber(new Date(date.getFullYear(), date.getMonth()));

				if (startWeekNb > endWeekNb) {
					startWeekNb = 0;
					endWeekNb++;
				}

				return endWeekNb - startWeekNb + 1;
			} else if (domain === "year") {
				return parent.getWeekNumber(new Date(date.getFullYear(), 11, 31));
			}
		};


		switch(this.options.subDomain) {
			case "min"   : return this.getMinuteDomain(date, computeMinSubDomainSize(date, this.options.domain));
			case "hour"  : return this.getHourDomain(date, computeHourSubDomainSize(date, this.options.domain));
			case "day"   : return this.getDayDomain(date, computeDaySubDomainSize(date, this.options.domain));
			case "week"  : return this.getWeekDomain(date, computeWeekSubDomainSize(date, this.options.domain));
			case "month" : return this.getMonthDomain(date, 12);
		}
	},

	getNextDomain: function() {
		return this.getDomain(this._domains[this._domains.length-1], 2).pop();
	},

	getPreviousDomain: function() {
		return this.getDomain(this._domains[0], -1)[0];
	},

	/**
	 * Return the classname on the scale for the specified value
	 *
	 * @param  Item count n Number of items for that perdiod of time
	 * @return string		Classname according to the scale
	 */
	scale: function(n) {
		for (var i = 0, total = this.options.scale.length-1; i < total; i++) {

			if (n === 0 && this.options.scale[0] > 0) {
				return "";
			} else if (this.options.scale[0] > 0 && n < 0) {
				return "qi";
			}

			if (n <= this.options.scale[i]) {
				return "q" + (i+1);
			}
		}
		return "q" + this.options.scale.length;
	},

	// =========================================================================//
	// DATAS																	//
	// =========================================================================//

	fill: function(datas, domain) {
		if (datas !== false) {
			this.display(this.parseDatas(datas), domain);
		}
	},

	getDatas: function(source, startDate, endDate, domain) {
		var parent = this;

		if (typeof domain === "undefined") {
			domain = parent.svg;
		}

		switch(typeof source) {
			case "string" :
				if (source === "") {
					return false;
				} else {
					d3.json(this.parseURI(source, startDate, endDate), function(data) {
						parent.fill(data, domain);
					});
					return true;
				}
				break;
			case "object" :
				// @todo Check that it's a valid JSON object
				return source;
		}

		return false;
	},

	/**
	 * Convert a JSON result into the expected format
	 *
	 * @param  {[type]} data [description]
	 * @return {[type]}      [description]
	 */
	parseDatas: function(data) {
		var stats = {};

		for (var d in data) {
			var date = new Date(d*1000);
			var domainUnit = this.getDomain(date)[0].getTime();

			// Don't record datas not relevant to the current domain
			if (this._domains.indexOf(domainUnit) < 0) {
				continue;
			}

			var subDomainUnit = this._domainType[this.options.subDomain].extractUnit(date);
			if (typeof stats[domainUnit] === "undefined") {
				stats[domainUnit] = {};
			}

			if (typeof stats[domainUnit][subDomainUnit] !== "undefined") {
				stats[domainUnit][subDomainUnit] += data[d];
			} else {
				stats[domainUnit][subDomainUnit] = data[d];
			}
		}

		return stats;
	},

	parseURI: function(str, startDate, endDate) {
		// Use a timestamp in seconds
		str = str.replace(/\{\{t:start\}\}/g, startDate.getTime()/1000);
		str = str.replace(/\{\{t:end\}\}/g, endDate.getTime()/1000);

		// Use a string date, following the ISO-8601
		str = str.replace(/\{\{d:start\}\}/g, startDate.toISOString());
		str = str.replace(/\{\{d:end\}\}/g, endDate.toISOString());

		return str;
	}
};


/**
 * AMD Loader
 */
if (typeof define === "function" && define.amd) {
	define(["d3"], function(d3) {
		return CalHeatMap;
	});
}