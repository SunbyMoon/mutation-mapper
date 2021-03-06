/*
 * Copyright (c) 2016 Memorial Sloan-Kettering Cancer Center.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS
 * FOR A PARTICULAR PURPOSE. The software and documentation provided hereunder
 * is on an "as is" basis, and Memorial Sloan-Kettering Cancer Center has no
 * obligations to provide maintenance, support, updates, enhancements or
 * modifications. In no event shall Memorial Sloan-Kettering Cancer Center be
 * liable to any party for direct, indirect, special, incidental or
 * consequential damages, including lost profits, arising out of the use of this
 * software and its documentation, even if Memorial Sloan-Kettering Cancer
 * Center has been advised of the possibility of such damage.
 */

/*
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var MutationDetailsEvents = require("../controller/MutationDetailsEvents");
var MutationViewsUtil = require("../util/MutationViewsUtil");
var BackboneTemplateCache = require("../util/BackboneTemplateCache");

var Backbone = require("backbone");
var _ = require("underscore");
var $ = require("jquery");

/**
 * Mutation Details Customization Panel View.
 *
 * This view is designed to provide a customization panel for Mutation Details page.
 *
 * options: {el: [target container],
 *           model: {},
 *          }
 *
 * @author Selcuk Onur Sumer
 */
var MutationInfoPanelView = Backbone.View.extend({
	initialize : function (options) {
		this.options = options || {};

		// custom event dispatcher
		this.dispatcher = {};
		_.extend(this.dispatcher, Backbone.Events);

		// initial count by type map
		//this.initialMapByType = this._mapMutationsByType(this.model.mutations);
		this.initialMapByType = this._mapMutationsByMainType(this.model.mutations.getData());
		//this.selectionMap = this.resetSelectionMap();
	},
	render: function()
	{
		var self = this;
		self.updateView(self.model.mutations.getData());
	},
	format: function()
	{
		var self = this;

		self.$el.find(".mutation-type-info-link").on('click', function(evt) {
			evt.preventDefault();
			var mutationType = $(this).attr("alt");

			//if (self.selectionMap[mutationType] != null)
			//{
			//	self.selectionMap[mutationType] += 1;
			//}

			self.dispatcher.trigger(
				MutationDetailsEvents.INFO_PANEL_MUTATION_TYPE_SELECTED,
				mutationType);
		});
	},
	updateView: function(mutations) {
		var self = this;
		//self.currentMapByType = self._mapMutationsByType(mutations);
		self.currentMapByType = self._mapMutationsByMainType(mutations);
		var countByType = self._countMutationsByType(self.currentMapByType);
		var mutationTypeStyle = MutationViewsUtil.getVisualStyleMaps().mutationType;
		var content = [];

		countByType = _.extend(self._generateZeroCountMap(self.initialMapByType), countByType);

		// sort mutation types by priority
		var keys = _.keys(countByType).sort(function(a, b) {
			var priorityA = 1024;
			var priorityB = 1024;

			if (mutationTypeStyle[a] && mutationTypeStyle[a].priority) {
				priorityA = mutationTypeStyle[a].priority;
			}

			if (mutationTypeStyle[b] && mutationTypeStyle[b].priority) {
				priorityB = mutationTypeStyle[b].priority;
			}

			return priorityA - priorityB;
		});

		_.each(keys, function(mutationType) {
			var templateFn = BackboneTemplateCache.getTemplateFn("mutation_info_panel_type_template");

			var text = "Other";
			var textStyle = mutationTypeStyle["other"].style;

			var view = mutationTypeStyle[mutationType];

			if (view && view.mainType)
			{
				view = mutationTypeStyle[view.mainType];
			}

			if (view)
			{
				text = view.longName || text;
				textStyle = view.style || textStyle;
			}

			var count = countByType[mutationType];

			var variables = {
				mutationType: mutationType,
				type: text,
				textStyle: textStyle,
				count: count,
				countStyle: textStyle + "_count"
			};

			var template = templateFn(variables);
			content.push(template);
		});

		// template vars
		var variables = {
			mutationTypeContent: content.join("\n")
		};

		// compile the template using underscore
		var templateFn = BackboneTemplateCache.getTemplateFn("mutation_info_panel_template");
		var template = templateFn(variables);

		// load the compiled HTML into the Backbone "el"
		self.$el.html(template);

		// format after rendering
		self.format();
	},
	_generateZeroCountMap: function(mapByType) {
		var zeroCountMap = {};

		_.each(_.keys(mapByType), function (key) {
			zeroCountMap[key] = 0;
		});

		return zeroCountMap;
	},
	resetSelectionMap: function() {
		var self = this;

		self.selectionMap = self._generateZeroCountMap(self.initialMapByType);
	},
	// TODO move these into a utility class
	_mapMutationsByType: function(mutations) {
		return _.groupBy(mutations, function(mutation) {
			return mutation.get("mutationType").toLowerCase();
		});
	},
	_mapMutationsByMainType: function(mutations) {
		var mutationTypeStyle = MutationViewsUtil.getVisualStyleMaps().mutationType;

		return _.groupBy(mutations, function(mutation) {
			var type = mutation.get("mutationType");
			if (type) {
				type = type.toLowerCase();
			}
			else {
				type = "other";
			}

			var mainType;

			if (mutationTypeStyle[type]) {
				mainType = mutationTypeStyle[type].mainType;
			}
			else {
				mainType = "other";
			}

			return mainType;
		});
	},
	_countMutationsByType: function(mapByType) {
		var countByType = {};

		_.each(_.keys(mapByType), function(type) {
			countByType[type] = _.size(mapByType[type]);
		});

		return countByType;
	}
});

module.exports = MutationInfoPanelView;