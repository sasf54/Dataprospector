/**
 * Bootstrap Dataprospector (https://dataprospector.net/)
 *
 * Apache License, Version 2.0:
 * Copyright (c) 2018 Ferenc Sandor
 *
 * CC BY-SA
 *
 * https://creativecommons.org/licenses/by-sa/4.0/
 * https://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 * Extension: By using this code, you are agreeing, that you allowing the contributors free use of any
 * product / service it's used in.
 *
 * This license lets others remix, tweak, and build upon your work even for commercial purposes,
 * as long as they credit you and license their new creations under the identical terms.
 * This license is often compared to “copyleft” free and open source software licenses.
 * All new works based on yours will carry the same license, so any derivatives will also allow commercial use.
 * This is the license used by Wikipedia, and is recommended for materials that would benefit from
 * incorporating content from Wikipedia and similarly licensed projects.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 * OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
(function(root, factory) {
    // check to see if 'knockout' AMD module is specified if using requirejs
    if (typeof define === 'function' && define.amd &&
        typeof require === 'function' && typeof require.specified === 'function' && require.specified('knockout')) {

        // AMD. Register as an anonymous module.
        define(['jquery', 'knockout'], factory);
    } else {
        // Browser globals
        factory(root.jQuery, root.ko);
    }
})(this, function($, ko) {
    "use strict";// jshint ;
});

function Dataprospector(select, options) {
    var minime = this;
    var tmp_select = $(select[0]);
    if ($(options).hasOwnProperty("data") && (!$(options).hasOwnProperty("clone_data") || options.clone_data === false)) {
        var tmp_data = options.data;
        options.data = false;
        this.options = this.mergeOptions($.extend({}, options, $(tmp_select).data()));
        this.options.data = tmp_data;
    } else {
        this.options = this.mergeOptions($.extend({}, options, $(tmp_select).data()));
    }
    this.dom = {
        root: false,
        tableRoot: false,
        tableHead: false,
        tableBody: false,
        pagination_root: false,
        pagination_scrollablex: false,
        filter_root: false,
        filter_page_simple: false,
        root_wrapper: false,
        item_details_placeholder_element: false,
        filter_sorters: {},
        download_href_placeholder: false,
        context_menu: false,
        header_context_menu: false,
        plot: false,
        plot_graph: false
    };
    this.filtering = {
        string: {},
        slider: {},
        options: {},
        array_string: {},
        array_slider: {},
        advanced: {}
    };
    this.enums = [];
    this.textSearch = [];
    this.unique_id = this.generateRandomString(8);
    this.dom.root = tmp_select;

    //selected is an existing table
    if (this.options.import_first_line_headers || (!this.options.data || this.options.data.length == 0 && tmp_select[0].tagName.toLowerCase() == "table")) {
        var data = [], i, j, headers = [];
        var header_line = false;
        // no progress shown, because the browser is only re-renders on function finish :( ...

        if (this.dom.root.find("thead").length > 0) {
            header_line = this.dom.root.find("thead th, thead td");
        }
        if (!header_line > 0 && this.dom.root.find("th").length > 0) {
            header_line = $(this.dom.root.find("th")[0]).parent();
        }
        if (!header_line) {
            header_line = $($(this.dom.root.find("tr")[0]).find("td"));
        }
        for (i = 0; i < header_line.length; i++) {
            headers.push($(header_line[i]).text());
        }
        $(header_line[0]).parent().detach();

        // processing data:
        var items = this.dom.root.find("tr");
        for (i = 0; i < items.length; i++) {
            var cells = $(items[i]).find("td");
            var item = {};
            for (j = 0; j < cells.length; j++) {
                item[headers[j]] = $(cells[j]).text();
            }
            data.push(item);
        }
        this.options.data = data;
        var new_div = $("<div>");

        $.each(this.dom.root[0].attributes, function() {
            new_div.attr(this.name, this.value);
        });

        new_div.insertBefore(this.dom.root);
        this.dom.root.detach();
        this.dom.root = new_div;
    }
    // selected is a file source (input type=file)
    if ((!this.options.data || this.options.data.length == 0) && tmp_select[0].tagName.toLowerCase() == "input" && $(tmp_select[0]).attr("type").toLowerCase() == "file") {
        var data = [], i, j, headers = [];
        var header_line = false;
        var reader = new FileReader();
        reader.readAsText(tmp_select[0].files[0], "UTF-8");
        reader.onload = function(result) {
            minime.fileLoad(result, tmp_select[0].files[0].type);
        };
        return;
    }
    if (this.options.selection) {
        var i;
        for (i = 0; i < this.options.data.length; i++) {
            this.options.data[i]['selected'] = false;
        }
    }
    this.renderHTML();
}

Dataprospector.prototype = {
    numberFormatter: new Intl.NumberFormat('en-US'),
    dom: {
        root: false,
        tableRoot: false,
        tableHead: false,
        tableBody: false,
        pagination_root: false,
        pagination_scrollablex: false,
        filter_root: false,
        filter_page_simple: false,
        filter_page_advanced: false,
        root_wrapper: false,
        item_details_placeholder_element: false,
        filter_advanced_toggle_show: false,
        filter_toggle_show: false,
        filter_sorters: {},
        document_subroot: false

    },
    filtering: {
        string: {},
        slider: {},
        options: {},
        array_string: {},
        array_slider: {},
        advanced: {}
    },
    unique_id: false,
    enums: [],
    textSearch: [],
    pagination_element: false,
    rendered_item_pages: 0,
    current_page: 0,
    filters_show: false,
    advanced_filters_show: false,
    context_menu_row: false,
    context_menu_column: false,
    defaults: {
        data: [],    // content of data (data[i]['name'] format)
        clone_data: true, // will create a duplicate from the data object,
                          // setting it false will result in smaller memory usage,
                          // but it will modify your original data array!
        headers: [], // list of headers (String[]) // internal use
        header_names: [],
        header_types: {}, // list of header types (header_types['name']['string']
                          // string, range, array_string, array_slider, boolean
        filters: [],      // what filters should be rendered
        external_filters: false, // external filters (can be setup trough functions and context menu)
        advanced_filters: false, // what advanced filters should be rendered
        header_shown: [], // list of strings [0]='name',[1]='price'
        filters_opened: false,
        filter_animation_time: 1000,
        units: {}, // the units of the data (W, m, GB, Mhz...)
        items_per_page: 25,
        sort_by: false,
        sort_reverse: false,
        item_details_attribute_per_row: 2,
        selection: false,
        import_first_line_headers: false, // if importing from a table, the first line is header
        context_menu: false,
        context_menu_download: false,
        no_details: false,
        plot: {
            plotter: false,
            xaxis: false,
            yaxis: false,
            mode: false,
            visible: false
        },
        plot_id: false,
        templates: {
            data_wrapper: "<div class=\"dataprospector-wrapper\"></div>",
            pagination_root: "<div class=\"row pagination justify-content-center\"></div>",
            pagination_next_prev: '<div class="page-item col-2 "><div class="page-link">%direction%</div></div>',

            table_root: "<table class=\"table table-striped table-bordered data-item_list\"></table>",
            table_head: "<thead></thead>",
            table_body: "<tbody></tbody>",

            header_row: "<tr>",
            header_row_end: "</tr>", // should be autoclosed
            header_column: "<th class=\"item_%header_column%\">%header_column%<div class=\"form-inline\">",
            header_column_end: "</div></th>", // should be autoclosed
            header_column_sort: "<span class=\"%sortSelected% lh-half oi oi-arrow-circle-bottom\"></span>",
            header_column_sort_reverse: "<span class=\"%sortSelectedReverse% lh-half oi oi-arrow-circle-top\"></span>",
            //  sortName, sortFunctionName, sortSelected, sortSelectedReverse
            header_column_selected: "io-grey ",
            header_content_selection: "<input type=\"checkbox\" name=\"%item_id%\" %checked%/>",

            table_row: "<tr>",
            table_row_end: "</tr>",
            table_column: '<td class="item_%header_name%">%value% %unit%</td>',
            item_details_placeholder: "<div class=\"card item_details\"></div>",
            item_details_wrapper: "<div class=\"card-body\"><table class=\"\">",
            item_details_wrapper_end: "</table></div>",
            item_details_row: "<tr>",
            item_details_row_end: "</tr>",
            item_details_attribute: '<td class="font-weight-bold">%header%</td><td class="text-right">%value% %unit%</td>',
            download_href_placeholder: "<a href=\"download_%unique_id%\" style=\"display:none;\"></a>",

            filter_row: "<div class=\"row w-100\">",
            filter_row_end: "</div>",
            filter_root: "<div class=\" dataprospectors-filters\"></div>",
            filter_root_wrapper: "<div class=\"dataprospectors-filters-wrapper\"></div>",
            filter_page_simple: "<div class=\" dataprospectors-filters-page\"><h4>Filters</h4></div>",
            filter_page_advanced: "<div class=\" dataprospectors-filters-page-advanced\"><h4>Advanced filters</h4></div>",
            filter_toggle_show: "<div class=\"dataprospectors-filter_toggle_show btn-primary oi oi-caret-left\"></div>",
            filter_toggle_active_class: "btn-primary",
            filter_toggle_inactive_class: "btn-outline-primary",
            filter_advanced_toggle_show: "<div class=\"dataprospectors-filter_advanced_toggle_show btn-primary oi oi-caret-left\"></div>",
            filter_element_root: "<div class='w-100 mr-2' ></div>",
            filter_element_label: "<div class=\"label label_%header%\">%header%</div>",
            filter_element_sort_up: "<span class=\"lh-half oi %sort_selected% oi-arrow-circle-bottom\"></span>",
            filter_element_sort_down: "<span class=\"lh-half oi %sort_selected% oi-arrow-circle-top\"></span>",
            filter_element_sort_selected: "io-grey ",
            filter_element_input_wrapper: "<div class=\"filter_element_ input-group filter_%type%\"></div>",
            filter_element_input_string: "<input type=\"text\" class=\"form-control\" aria-describedby=\"basic-addon1\" name=\"%header%\"/><span class=\"input-group-addon oi oi-magnifying-glass\" id=\"basic-addon1\"></span>",
            filter_element_input_range: "<div class=\"d-block w-100\"><input data-slider-id='filter_%unique_id%_%header%' type=\"text\" data-slider-min=\"%min_value%\" data-slider-max=\"%max_value%\" data-slider-value=\"[%min_value%,%max_value%]\" value=\"%min_value%,%max_value%\"/></div><div class=\"w-100 d-block pr-3\" ><div class=\"text-left w-50 float-left\">%min_value_formatted% %unit%</div><div class=\"text-right w-50 float-right\">%max_value_formatted% %unit%</div></div>",
            filter_element_input_enum: "<select name='filter_%unique_id%_%header%' multiple></select>",
            filter_element_input_enum_option: "<option value=\"%value%\">%value%</option>",

            context_menu: '<div id="context_%unique_id%" class="context-menu"><ul><li data-action="filter_like">Filter like these</li><li data-action="filter_manual_reset">Reset manual filters</li><li data-action="filter_all_reset">Reset all filters</li>%context_select_remaining%%context_menu_download%</ul></div>',
            context_select_remaining: '<li data-action="unselect_all">Unselect any item</li><li data-action="select_unfiltered">Select all remaining element</li>',
            context_download: '<li class="separator"></li><li data-action="download_JSON" class="download">Download selected as JSON</li><li data-action="download_CSV" class="download">Download selected as CSV</li><li data-action="download_TXT" class="download">Download selected as TXT</li><li data-action="download_XML1" class="download">Download selected as XML (atributes)</li><li data-action="download_XML2" class="download">Download selected as XML (tags)</li><li data-action="download_SQL" class="download">Download selected as SQL</li>',
            header_context_menu: '<div id="header_context_%unique_id%" class="context-menu"><ul><li data-action="plot">Plot selected results</li><li data-action="plot_all">Plot all</li></ul></div>',
            plot: '<div class="full_plot draggable"><div class="label w-100 draggable-handle">Graph: (drag me)<div class="oi oi-circle-x float-right close_plot">&nbsp;</div></div>' +
            '<div class="label w-100">' +
            '<div class="button w-25 d-inline-block"><input type="checkbox" name="selected_items"/>Selected items</div>' +
            '<div class="button w-25 d-inline-block"><label>Select Y axis: </label><select class="yaxis" name="select_yaxis"></select></div>' +
            '<div class="button w-25 d-inline-block"><label>Select X axis: </label><select class="xaxis" name="select_xaxis"></select></div>' +
            '<div class="button w-25 d-inline-block"><button class="reset-zoom" >Reset zoom</button></div>' +
            '</div><div id="plot_%unique_id%" ></div></div>',
            plot_column_option: '<option value="%column%">%name%</option>'
        }
    },
    constructor: Dataprospector,
    fileLoad: function(content, type) {
        if (type == "application/json") {
            this.options.data = JSON.parse(content.target.result);
            this.options.selection = true;
            //this.options.context_menu = true;
            //this.options.context_menu_download = true;
            this.renderHTML();
        }
        if (type == "text/csv") {
            this.options.selection = true;
            var data = $.csv.toArrays(content.target.result);
            this.options.header_names = data[0];
            data.splice(0, 1);
            var i, j;
            this.options.data = [];
            for (i = 0; i < data.length; i++) {
                this.options.data[i] = [];
                for (j = 0; j < this.options.header_names.length; j++) {
                    this.options.data[i][this.options.header_names[j]] = data[i][j];
                }
            }
            this.options.header_names.splice(this.options.header_names.indexOf("selected"), 1);
            this.renderHTML();
        }

        var new_div = $("<div>");

        $.each(this.dom.root[0].attributes, function() {
            new_div.attr(this.name, this.value);
        });

        new_div.insertBefore(this.dom.root);
        this.dom.root.detach();
        this.dom.root = new_div;

        this.renderHTML();
    },
    renderHTML: function() {
        var minime = this;
        // we need this to position the item details correctly
        var parent = $(this.dom.root);
        while (parent.parent()[0].tagName != "BODY" && parent.css("position") != 'relative') {
            parent = parent.parent();
        }
        this.dom.document_subroot = parent;


        if (this.options.filters || this.options.advanced_filters) {
            this.dom.filter_root = $(this.options.templates.filter_root);
            this.dom.filter_root_wrapper = $(this.options.templates.filter_root_wrapper);
            this.dom.filter_root_wrapper.appendTo(this.dom.filter_root);
            this.dom.filter_root.appendTo(this.dom.root);
            this.dom.filter_page_simple = $(this.options.templates.filter_page_simple);
            this.dom.filter_page_simple.appendTo(this.dom.filter_root_wrapper);
        } else {
            // no filters -> table is wider -> no margin-right
        }
        this.dom.root_wrapper = $(this.options.templates.data_wrapper);
        this.dom.root_wrapper.appendTo(this.dom.root);

        this.dom.pagination_root = $(this.options.templates.pagination_root);
        this.dom.pagination_root.appendTo(this.dom.root_wrapper);
        this.rendered_item_pages = Math.ceil(this.options.data.length / this.options.items_per_page);
        if (this.options.filters) {
            this.dom.filter_toggle_show = $(this.options.templates.filter_toggle_show);
            this.dom.filter_toggle_show.on("click", $.proxy(function(event) {
                minime.toggleShowFilters();
            }));
            this.dom.filter_toggle_show.appendTo(this.dom.pagination_root);
        }

        this.renderPagination();


        this.dom.tableRoot = $(this.options.templates.table_root);
        this.dom.tableRoot.appendTo(this.dom.root_wrapper);

        this.dom.tableHead = $(this.options.templates.table_head);
        this.dom.tableHead.appendTo(this.dom.tableRoot);

        this.dom.tableBody = $(this.options.templates.table_body);
        this.dom.tableBody.appendTo(this.dom.tableRoot);

        if (!this.options.no_details) {
            this.dom.item_details_placeholder_element = $(this.options.templates.item_details_placeholder);
            this.dom.item_details_placeholder_element.appendTo(this.dom.root_wrapper);
        }

        this.dom.download_href_placeholder = $(this.options.templates.download_href_placeholder.replace("%unique_id%", this.unique_id));
        this.dom.download_href_placeholder.appendTo(this.dom.root_wrapper);

        if (this.options.context_menu) {
            var context_menu = this.options.templates.context_menu.replace("%unique_id%", this.unique_id);
            if (this.options.selection && this.options.context_menu_download) {
                context_menu = context_menu.replace("%context_select_remaining%", this.options.templates.context_select_remaining);
                context_menu = context_menu.replace("%context_menu_download%", this.options.templates.context_download);
            } else {
                context_menu = context_menu.replace("%context_select_remaining%", "");
                context_menu = context_menu.replace("%context_menu_download%", "");
            }
            this.dom.context_menu = $(context_menu);
            this.dom.context_menu.on("mouseleave", function(event) {
                minime.contextMenuClose();
            });
            this.dom.context_menu.on("click", function(event) {
                minime.contextMenuEvent(event);
            });
            this.dom.context_menu.appendTo(this.dom.root_wrapper);
        }
        // if options.filters = ['name','domain'] filter for 'name' and 'domain'

        this.getHeaders();
        this.getColumnTypes();
        if (!this.options.hasOwnProperty("sort_by") || !this.options.sort_by) {
            if (this.options.header_shown && this.options.header_shown.length)
                this.options.sort_by = this.options.header_shown[0];
            else
                this.options.sort_by = this.options.headers[0];
        } else {
            this.sortBy("");
        }
        // creating pagination.
        this.renderHeaders();
        this.renderListPaginated();

        if (this.options.filters && Array.isArray(this.options.filters)) {
            if (this.options.filters.length == 0)
                this.options.filters = this.options.headers;
            this.renderFilters();
        }
        if (this.options.advanced_filters && this.options.advanced_filters.length > 0) {
            this.renderAdvancedFilters();
        }
        if (this.options.filters_opened) {
            var lastTime = this.options.filter_animation_time;
            this.options.filter_animation_time = 0;
            this.toggleShowFilters(this);
            setTimeout(function() {
                minime.options.filter_animation_time = lastTime;
            }, 100);
        }

        // get real height of display: none elements
        var previousCss = this.dom.root.attr("style");
        this.dom.root
            .css({
                position: 'absolute', // Optional if #myDiv is already absolute
                visibility: 'hidden',
                display: 'block'
            });
        // setting up some height
        var min_height = this.dom.filter_root_wrapper.height();
        this.dom.filter_root.css("min-height", this.dom.filter_root_wrapper.height() + 5);
        // resetting root's css back
        this.dom.root.attr("style", previousCss ? previousCss : "");
        this.dom.root_wrapper.css("min-height", min_height + 5);
        this.renderPlotHTML();

    },
    renderPlotHTML: function() {
        // header context menu render
        if (this.options.plot_id !== false) {
            var minime = this;
            var header_context_menu = this.options.templates.header_context_menu.replace("%unique_id%", this.unique_id);
            this.dom.header_context_menu = $(header_context_menu);
            this.dom.header_context_menu.on("mouseleave", function(event) {
                minime.headerContextMenuClose();
            });
            this.dom.header_context_menu.on("click", function(event) {
                minime.headerContextMenuEvent(event);
            });
            this.dom.header_context_menu.appendTo(this.dom.root_wrapper);
            this.dom.plot = $(this.options.templates.plot.replace("%unique_id%", this.unique_id));

            this.dom.plot.appendTo(this.dom.root_wrapper);
            this.dom.plot.draggable({handle: ".draggable-handle"});
            var i;
            // xaxis
            var currentAxis = this.dom.plot.find("select.xaxis");
            currentAxis.on("change", function() {
                minime.plotUpdateFromSelects();
            });
            $(this.options.templates.plot_column_option.replace("%column%", "0").replace("%name%", " - row number - ")).appendTo(currentAxis);
            for (i = 0; i < this.options.filters.length; i++) {
                var header_name = this.options.filters[i];
                if (this.options.header_names && this.options.header_names.hasOwnProperty(this.options.filters[i])) {
                    header_name = this.options.header_names[this.options.filters[i]];
                }


                if (this.options.header_types[this.options.filters[i]] == "range") {

                    var option = this.options.templates.plot_column_option.replace("%column%", this.options.filters[i]).replace("%name%", header_name);
                    $(option).appendTo(currentAxis);
                }
            }
            currentAxis = this.dom.plot.find("select.yaxis");
            currentAxis.on("change", function() {
                minime.plotUpdateFromSelects();
            });


            $(this.options.templates.plot_column_option.replace("%column%", "0").replace("%name%", " - row number - ")).appendTo(currentAxis);
            for (i = 0; i < this.options.filters.length; i++) {
                var header_name = this.options.filters[i];
                if (this.options.header_names && this.options.header_names.hasOwnProperty(this.options.filters[i])) {
                    header_name = this.options.header_names[this.options.filters[i]];
                }


                if (this.options.header_types[this.options.filters[i]] == "range") {
                    var option = this.options.templates.plot_column_option.replace("%column%", this.options.filters[i]).replace("%name%", header_name);
                    $(option).appendTo(currentAxis);
                }
            }
            this.dom.plot_graph = this.dom.plot.find("#plot_" + this.unique_id);
            this.dom.plot.find(".close_plot").on("click", function(event) {
                minime.plotClose();
            });
            this.dom.plot.find("button.reset-zoom").on("click", function(event) {
                minime.plotFilterReset();
            });
            this.dom.plot.hide();
        }

    },
    /**
     * Merges the given options with the default options.
     *
     * @param {Array} options
     * @returns {Array}
     */
    mergeOptions: function(options) {
        return $.extend(true, {}, this.defaults, this.options, options);
    },
    filterByString: function(attribute, value) {
        var name_filter = value.toLowerCase();
        var i, j;
        if (name_filter != null && name_filter != "") {
            var name_filters = name_filter.split(" ");
            for (i = 0; i < name_filters.length; i++) {
                name_filters[i] = new RegExp(name_filters[i]);
            }
            for (i = 0; i < this.options.data.length; i++) {
                for (j = 0; j < name_filters.length; j++) {
                    var f = true;
                    if (!this.options.data[i][attribute].toLowerCase().match(name_filters[j])) {
                        f = false;
                    }
                    if (!f) {
                        this.options.data[i].filtered_out = true;
                    }
                }
            }
        }
    },
    filterBySlider: function(attribute, slider_item) {
        var range_min = slider_item.slider("getValue")[0];
        var range_max = slider_item.slider("getValue")[1];
        this.filterByRange(attribute, range_min, range_max);
    },
    filterByRange: function(attribute, range_min, range_max) {
        var i;
        for (i = 0; i < this.options.data.length; i++) {
            if (this.options.data[i][attribute] < range_min || this.options.data[i][attribute] > range_max) {
                this.options.data[i].filtered_out = true;
            }
        }
    },
    filterByArraySlider: function(attribute, slider_item) {
        var range_min = slider_item.getValue()[0];
        var range_max = slider_item.getValue()[1];
        this.filterByArrayRange(attribute, range_min, range_max);
    },
    filterByArrayRange: function(attribute, range_min, range_max) {
        var i, j, filtered_out;
        for (i = 0; i < this.options.data.length; i++) {
            filtered_out = true;
            var item_split = this.options.data[i][attribute].split(",");
            var f = false;
            for (j = 0; j < item_split.length; j++) {
                var item_value = parseFloat(item_split[j].trim());
                if (!isNaN(item_value) && item_value >= range_min && item_value <= range_max) {
                    f = true;
                }
            }
            if (!f)
                this.options.data[i].filtered_out = true;
        }
    },
    filterByArraySelect: function(attribute, select) {
        if (select != null && select.val() != null) {
            var select_item = select.val();
            this.filterByString(attribute, select_item);
        }

    },
    filterByArrayString: function(attribute, select_item) {
        var i, j, k;
        for (i = 0; i < this.options.data.length; i++) {
            var f = true;
            for (j = 0; j < select_item.length; j++) {
                var item_split = this.options.data[i][attribute].split(",");
                for (k = 0; k < item_split.length; k++) {
                    item_split[k] = item_split[k].trim();
                    if (item_split[k] == select_item[j]) {
                        f = false;
                    }
                }
            }
            if (f) {
                this.options.data[i].filtered_out = true;
            }
        }

    },
    filterByOptions: function(attribute, select) {
        if (select != null && select.val() != null) {
            var select_item = select.val();
            this.filterByEnums(attribute, select_item);
        }
    },
    filterByEnums: function(attribute, select_item) {
        var filters = new Array();
        var i, j;
        for (i = 0; i < select_item.length; i++) {
            filters[i] = new RegExp(select_item[i].replace("(", "\\(").replace(")", "\\)").replace("+", "\\+"));
        }
        for (i = 0; i < this.options.data.length; i++) {
            var f = true;
            for (j = 0; j < select_item.length; j++) {
                if (this.options.data[i][attribute].match(filters[j])) {
                    f = false;
                }
            }
            if (f) {
                this.options.data[i].filtered_out = true;
            }
        }
    },
    getMinMax: function(attribute) {
        var i, low = Number.POSITIVE_INFINITY, high = Number.NEGATIVE_INFINITY;
        for (i = 0; i < this.options.data.length; i++) {
            var tmp = Number.parseFloat(this.options.data[i][attribute]);
            if (tmp < low) low = tmp;
            if (tmp > high) high = tmp;
        }
        return [low, high];
    },
    getOptions: function(attribute) {
        var i, j, result = [];
        var found;
        for (i = 0; i < this.options.data.length; i++) {
            found = false;
            for (j = 0; j < result.length; j++) {
                if (this.options.data[i][attribute] == result[j])
                    found = true;
            }
            if (!found) {
                result[result.length] = this.options.data[i][attribute];
            }
        }
        result.sort();
        return result;

    },

    renderHeaders: function() {
        $(this.dom.tableHead).find("*").remove(); // not dynamic :(
        // var parent = this.tableRootElement;
        var $header_html = $(this.options.templates.header_row);
        $header_html.appendTo(this.tableRootElement);
        var i;
        // if headers_shown is not set, show all be default
        if (!this.options.header_shown || this.options.header_shown.length == 0) {
            if (this.options.selection) {
                this.options.header_shown = [];
                this.options.header_shown.push('selected');
                this.options.header_shown.push(this.options.headers);
            } else {
                this.options.header_shown = this.options.headers;
            }
        }
        var sorted_header_found = false;
        for (i = 0; i < this.options.header_shown.length; i++) {
            if (this.options.sort_by == this.options.header_shown[i])
                sorted_header_found = true;
        }

        // the last will be the sorted header, if not already shown
        this.tmp_header_shown = [];
        if (!sorted_header_found && this.options.selection && this.options.sort_by == 'selected')
            sorted_header_found = true;
        for (i = 0; i < this.options.header_shown.length; i++)
            this.tmp_header_shown.push(this.options.header_shown[i]);
        if (!sorted_header_found && this.options.sort_by) {
            this.tmp_header_shown.push(this.options.sort_by);
        }
        // rendering headers

        if (this.options.selection) {
            var $header = $(this.options.templates.header_column.replace("%header_column%", "selected").replace("%header_column%", "selected"));
            var $sort_up, $sort_down;
            if (this.options.sort_by == "selected" && !this.options.sort_reverse) {
                $sort_down = $(this.options.templates.header_column_sort_reverse.replace("%sortSelectedReverse%", this.options.templates.header_column_selected));
            } else {
                $sort_down = $(this.options.templates.header_column_sort_reverse.replace("%sortSelectedReverse%", ''));
            }
            if (this.options.sort_by == "selected" && this.options.sort_reverse) {
                $sort_up = $(this.options.templates.header_column_sort.replace("%sortSelected%", this.options.templates.header_column_selected));
            } else {
                $sort_up = $(this.options.templates.header_column_sort.replace("%sortSelected%", ''));
            }
            // $sort_up.attr("data-sort-by", this.tmp_header_shown[i]);
            var sort_by = "selected";
            var minime = this;
            $sort_up.attr("data-sort-by", sort_by);
            $sort_up.attr("data-sort-reverse", "true");
            $sort_up.on("click", function(event) {
                minime.sortBy(event);
            });
            // $sort_down.attr("data-sort-by", this.tmp_header_shown[i]);
            $sort_down.attr("data-sort-by", sort_by);
            $sort_down.attr("data-sort-reverse", "false");
            $sort_down.on("click", function(event) {
                minime.sortBy(event);
            });
            $sort_down.appendTo($header);
            $sort_up.appendTo($header);
            $header.on('contextmenu', function(event) {
                minime.headerContextMenu(event);
            });

            $header.appendTo(this.dom.tableHead);
        }

        for (i = 0; i < this.tmp_header_shown.length; i++) {
            var header_name = this.tmp_header_shown[i];
            if (this.options.header_names && this.options.header_names.hasOwnProperty(this.tmp_header_shown[i])) {
                header_name = this.options.header_names[this.tmp_header_shown[i]];
            }


            var $header = $(this.options.templates.header_column.replace("%header_column%", header_name).replace("%header_column%", header_name));
            var $sort_up, $sort_down;
            if (this.options.sort_by == header_name && !this.options.sort_reverse) {
                $sort_down = $(this.options.templates.header_column_sort_reverse.replace("%sortSelectedReverse%", this.options.templates.header_column_selected));
            } else {
                $sort_down = $(this.options.templates.header_column_sort_reverse.replace("%sortSelectedReverse%", ''));
            }
            if (this.options.sort_by == header_name && this.options.sort_reverse) {
                $sort_up = $(this.options.templates.header_column_sort.replace("%sortSelected%", this.options.templates.header_column_selected));
            } else {
                $sort_up = $(this.options.templates.header_column_sort.replace("%sortSelected%", ''));
            }
            // $sort_up.attr("data-sort-by", this.tmp_header_shown[i]);
            var sort_by = this.tmp_header_shown[i];
            var minime = this;
            $sort_up.attr("data-sort-by", sort_by);
            $sort_up.attr("data-sort-reverse", "true");
            $sort_up.on("click", function(event) {
                minime.sortBy(event);
            });
            // $sort_down.attr("data-sort-by", this.tmp_header_shown[i]);
            $sort_down.attr("data-sort-by", sort_by);
            $sort_down.attr("data-sort-reverse", "false");
            $sort_down.on("click", function(event) {
                minime.sortBy(event);
            });
            $sort_down.appendTo($header);
            $sort_up.appendTo($header);
            if (this.options.plot_id)
                $header.on('contextmenu', function(event) {
                    minime.headerContextMenu(event);
                });

            $header.appendTo(this.dom.tableHead);

        }

    },
    sortBy: function(event) {
        if (event && event.hasOwnProperty("currentTarget")) {
            this.options.sort_by = $(event.currentTarget).attr("data-sort-by");
            this.options.sort_reverse = $(event.currentTarget).attr("data-sort-reverse") == 'true';
        }
        var type = this.options.header_types[this.options.sort_by];
        var minime = this;
        var hasAdvanced = false;
        if (this.filtering.advanced) {
            var i, advanced_filter_keys = Object.keys(this.filtering.advanced);
            for (i = 0; i < advanced_filter_keys.length; i++) {
                if (advanced_filter_keys[i] == this.options.sort_by)
                    hasAdvanced = true;
            }
        }
        if (type == "range" || hasAdvanced) {
            if (this.options.sort_reverse) {
                // this.options.data.sort(this.compareInt);
                this.options.data.sort(function(a, b) {
                    return (b[minime.options.sort_by]) - (a[minime.options.sort_by]);
                });
            } else {
                this.options.data.sort(function(a, b) {
                    return (a[minime.options.sort_by]) - (b[minime.options.sort_by]);
                });
            }
        }
        if (type == "string" || type == "options" || type == "array_string") {
            if (this.options.sort_reverse) {
                this.options.data.sort(function(a, b) {
                    return (b[minime.options.sort_by].toLowerCase()).localeCompare(a[minime.options.sort_by].toLowerCase());
                });
            } else {
                this.options.data.sort(function(a, b) {
                    return (a[minime.options.sort_by].toLowerCase()).localeCompare(b[minime.options.sort_by].toLowerCase());
                });
            }
        }
        if (type == 'boolean') {
            if (this.options.sort_reverse) {
                this.options.data.sort(function(a, b) {
                    return (b[minime.options.sort_by] === a[minime.options.sort_by]) ? 0 : (b[minime.options.sort_by]) ? -1 : 1;
                });
            } else {
                this.options.data.sort(function(a, b) {
                    return (a[minime.options.sort_by] === b[minime.options.sort_by]) ? 0 : (a[minime.options.sort_by]) ? -1 : 1;
                });
            }

        }
        this.renderHeaders();
        this.renderListPaginated();
        if (this.options.plot.visible) {
            this.plotTimeoutCount++;
            setTimeout(this.plotTimeout(), 200);
        }

        var i;
        // marking the current sorting arrow
        if (this.filtering.advanced) {
            var advanced_filter_keys = Object.keys(this.filtering.advanced);
            for (i = 0; i < advanced_filter_keys.length; i++) {
                this.dom.filter_sorters[advanced_filter_keys[i]].up.removeClass(this.options.templates.header_column_selected);
                this.dom.filter_sorters[advanced_filter_keys[i]].down.removeClass(this.options.templates.header_column_selected);
            }
            if (this.options.sort_reverse) {
                if (this.dom.filter_sorters.hasOwnProperty(this.options.sort_by))
                    this.dom.filter_sorters[this.options.sort_by].up.addClass(this.options.templates.header_column_selected);
            } else {
                if (this.dom.filter_sorters.hasOwnProperty(this.options.sort_by))
                    this.dom.filter_sorters[this.options.sort_by].down.addClass(this.options.templates.header_column_selected);
            }
        }
        for (i = 0; i < this.options.filters.length; i++) {
            this.dom.filter_sorters[this.options.filters[i]].up.removeClass(this.options.templates.header_column_selected);
            this.dom.filter_sorters[this.options.filters[i]].down.removeClass(this.options.templates.header_column_selected);
        }
        if (this.options.sort_reverse) {
            if (this.dom.filter_sorters.hasOwnProperty(this.options.sort_by))
                this.dom.filter_sorters[this.options.sort_by].up.addClass(this.options.templates.header_column_selected);
        } else {
            if (this.dom.filter_sorters.hasOwnProperty(this.options.sort_by))
                this.dom.filter_sorters[this.options.sort_by].down.addClass(this.options.templates.header_column_selected);
        }
    },
    disableUnavailableOptions: function(attribute, multiselect) {
        var multiselect_inputs = multiselect.parent().parent().find("ul.multiselect-container li input");
        var unfiltered_options = [], i, j, k;
        j = 0;
        for (i = 0; i < this.options.data.length; i++) {
            if (!this.options.data[i].filtered_out)
                unfiltered_options[j++] = {name: this.options.data[i][attribute]};
        }
        //disabling all
        for (i = 2; i < multiselect_inputs.length; i++) {
            $(multiselect_inputs[i]).parent('label').parent('a').parent('li').addClass('unavailable');
        }
        // re-enabling valid options
        for (i = 0; i < unfiltered_options.length; i++) {
            for (j = 0; j < multiselect_inputs.length; j++) {
                if (multiselect_inputs[j].value == unfiltered_options[i]['name']) {
                    $(multiselect_inputs[j]).parent('label').parent('a').parent('li').removeClass('unavailable');
                }
            }
        }
    },
    renderPagination: function() {
        var pagination = this.dom.pagination_root;
        pagination.children().not(".dataprospectors-filter_toggle_show").detach();
        var i;
        var minime = this;
        var $prev = $(this.options.templates.pagination_next_prev.replace("%direction%", "Previous"));
        $prev.on('click',
            function(event) {
                minime.gotoPage(event);
            });
        $prev.appendTo(pagination);
        this.dom.pagination_scrollablex = $('<div class="scrollablex col-7">');
        this.pagination_dragging = false;
        this.dom.pagination_scrollablex.on({
            mousemove: function(e) {
                if (minime.pagination_drag && Math.abs(e.pageX - minime.pagination_mx) > 5) {
                    minime.pagination_dragging = true;
                    var mx2 = e.pageX - this.offsetLeft;
                    if (mx) this.scrollLeft = this.sx + mx - mx2;
                }
            },
            mousedown: function(e) {
                minime.pagination_mx = e.pageX;
                minime.pagination_my = e.pageY;
                minime.pagination_drag = true;
                this.sx = this.scrollLeft;
                mx = e.pageX - this.offsetLeft;
            },
            mouseup: function(e) {
                setTimeout(function() {
                    minime.pagination_drag = false;
                    minime.pagination_dragging = false;
                }, 10);
            }
        });

        for (i = 0; i < this.rendered_item_pages; i++) {
            var page = '<div class="page-item';
            if (i == 0)
                page += ' active';
            page += '"><div class="page-link">' + (i + 1) + '</div></div>';
            var $page = $(page);
            $page.on('click',
                function(event) {
                    if (!minime.pagination_dragging)
                        minime.gotoPage(event);
                });
            $page.appendTo(this.dom.pagination_scrollablex);
        }
        this.dom.pagination_scrollablex.appendTo(pagination);
        var $next = $(this.options.templates.pagination_next_prev.replace("%direction%", "Next"));
        $next.on('click',
            function(event) {
                minime.gotoPage(event);
            });
        $next.appendTo(pagination);
        $next.after(this.dom.filter_toggle_show);
    },
    gotoPage: function(event) {
        var el = event.currentTarget;
        var page = parseInt($(el).text());
        var parent;
        var minime = this;

        if (isNaN(page)) {
            parent = $(el).parent().parent().find(".scrollablex");
            if ($(el).text() == 'Previous' && this.current_page > 0) {
                this.current_page--;
                parent.finish().animate({scrollLeft: (Math.round(parent.find(".page-item").get(minime.current_page).offsetLeft - parent.width() / 2))}, 800);
            }
            if ($(el).text() == 'Next' && this.current_page < this.rendered_item_pages - 1) {
                this.current_page++;
                parent.finish().animate({scrollLeft: (Math.round(parent.find(".page-item").get(minime.current_page).offsetLeft - parent.width() / 2))}, 800);
            }
            this.dom.pagination_root.find("div").removeClass("active");
            $(this.dom.pagination_scrollablex.find(">div")[this.current_page]).addClass("active");
        } else {
            parent = $(el).parent().parent().find(".scrollablex");
            this.current_page = page - 1;
            parent.finish().animate({scrollLeft: (Math.round(parent.find(".page-item").get(minime.current_page).offsetLeft - parent.width() / 2))}, 1000);
            this.dom.pagination_root.find("div").removeClass("active");
            $(el).addClass("active");
        }
        this.renderListPaginated();
    },
    renderListPaginated: function() {
        var skipped = 0;
        var rendered = 0;
        var i;
        this.dom.tableBody.find("*").remove();
        var parent = this.dom.tableBody;
        for (i = 0; i < this.options.data.length; i++) {
            if (!this.options.data[i].filtered_out) {
                if (skipped < this.options.items_per_page * this.current_page) {
                    skipped++;
                    continue;
                }
                if (rendered++ >= this.options.items_per_page) {
                    return;
                }
                this.renderItem(i).appendTo(parent).appendTo(this.dom.tableBody);
            }
        }

    },
    renderItem: function(i) {
        var j;
        var html = this.options.templates.table_row.replace(">", ' data-item_list_id="' + i + '">');
        var content;
        if (this.options.selection) {
            var select_html = this.options.templates.header_content_selection.replace("%item_id%", i);
            if (this.options.data[i]['selected']) {
                select_html = select_html.replace("%checked%", "checked");
            } else {
                select_html = select_html.replace("%checked%", "");
            }
            content = this.options.templates.table_column.replace("%header_name%", "selected").replace("%value%", select_html).replace("%unit%", "");
            html += content;
        }
        for (j = 0; j < this.tmp_header_shown.length; j++) {
            if (this.options.header_types[this.tmp_header_shown[j]] == 'range' ||
                this.options.header_types[this.tmp_header_shown[j]] == 'advanced') {
                content = this.numberFormatter.format(this.options.data[i][this.tmp_header_shown[j]]);
            } else {
                content = this.options.data[i][this.tmp_header_shown[j]];
            }
            content = this.options.templates.table_column.replace("%header_name%", this.tmp_header_shown[j]).replace("%value%", content);
            if (this.options.units.hasOwnProperty(this.tmp_header_shown[j])) {
                content = content.replace("%unit%", this.options.units[this.tmp_header_shown[j]]);
            } else {
                content = content.replace("%unit%", "");
            }
            html += content;
        }
        html += this.options.templates.table_row_end;
        var $listItem = $(html);
        var minime = this;
        if (!this.options.no_details) {
            $listItem.on("mouseenter", function(event) {
                minime.renderItemDetails(event, i);
            });

            $listItem.on("mouseleave", function() {
                minime.dom.item_details_placeholder_element.hide();
            });
        }
        if (this.options.context_menu) {
            $listItem.on('contextmenu', function(event) {
                minime.contextMenu(event);
            });
        }

        if (this.options.selection) {
            $listItem.find("input[name=" + i + "]").on("click", function(event) {
                minime.toggleItemSelected(event);
            });
        }

        return $listItem;
    },
    renderItemDetails: function(event, i) {
        var content;
        var cnt;
        content = this.options.templates.item_details_wrapper;
        for (cnt = 0; cnt < this.options.headers.length; cnt++) {
            var header_name = this.options.headers[cnt];
            if (this.options.header_names && this.options.header_names.hasOwnProperty(this.options.headers[cnt])) {
                header_name = this.options.header_names[this.options.headers[cnt]];
            }
            if (cnt % 2 == 0) {
                content += this.options.templates.item_details_row;
            }
            var value;
            if (this.options.header_types[this.options.headers[cnt]] == 'range') {
                value = this.numberFormatter.format(this.options.data[i][this.options.headers[cnt]])
            } else {
                value = this.options.data[i][this.options.headers[cnt]];
            }
            var attribute = this.options.templates.item_details_attribute.replace("%header%", header_name).replace("%value%", value);
            if (this.options.units.hasOwnProperty(this.options.headers[cnt])) {
                attribute = attribute.replace("%unit%", this.options.units[this.options.headers[cnt]]);
            } else {
                attribute = attribute.replace("%unit%", "");
            }
            content += attribute;
            if (cnt % this.options.item_details_attribute_per_row == this.options.item_details_attribute_per_row - 1) {
                content += this.options.templates.item_details_row_end;
            }
        }
        content += this.options.templates.item_details_wrapper_end;
        this.dom.item_details_placeholder_element.html(content);
        //this.dom.item_details_placeholder_element.css('display', "block").css('top', event.pageY - this.dom.root.parent().offset().top + 5).css("left", event.pageX - this.dom.root.offset().left);


        var relX = event.pageX - this.dom.document_subroot.offset().left;
        var relY = event.pageY - this.dom.document_subroot.offset().top;
        this.dom.item_details_placeholder_element.css('display', "block").css("left", relX).css('top', relY + 5);
    },
    getHeaders: function() {
        var i, j, found;
        var headers = [], headers_new;
        if (this.options.selection) {
            headers.push('selected');
            this.options.header_types['selected'] = 'boolean';
        }
        for (i = 0; i < this.options.data.length; i++) {
            found = false;
            headers_new = Object.keys(this.options.data[i]);
            for (j = 0; j < headers_new.length; j++) {
                if (headers.indexOf(headers_new[j]) == -1)
                    headers.push(headers_new[j]);
            }
        }
        if (this.options.selection && headers.indexOf("selected")) {
            headers.splice(headers.indexOf("selected"), 1);
        }
        this.options.headers = headers;
    },
    getColumnTypes: function() {
        var i;
        var length = this.options.data.length;
        for (i = 0; i < this.options.headers.length; i++) {
            if (!this.options.header_types.hasOwnProperty(this.options.headers[i])) {
                if (this.isBooleanColumn(this.options.headers[i])) {
                    this.options.header_types[this.options.headers[i]] = "boolean";
                } else {
                    if (this.isNumericalColumn(this.options.headers[i])) {
                        this.options.header_types[this.options.headers[i]] = "range";
                    } else {
                        var elements = this.getOptions(this.options.headers[i]);
                        if (elements.length < length / 5 && elements.length < 100) {
                            this.options.header_types[this.options.headers[i]] = "options";
                        } else {
                            this.options.header_types[this.options.headers[i]] = "string";
                        }
                    }
                }
            }
        }
    },
    isBooleanColumn: function(attribute) {
        var i;
        for (i = 0; i < this.options.data.length; i++) {
            if (!(this.options.data[i][attribute] === true || this.options.data[i][attribute] === false ||
                this.options.data[i][attribute] === 'true' || this.options.data[i][attribute] === 'false'))
                return false;
        }
        return true;
    },
    isNumericalColumn: function(attribute) {
        var i;
        for (i = 0; i < this.options.data.length; i++) {
            if (isNaN(this.options.data[i][attribute]))
                return false;
        }
        return true;
    },
    renderFilters: function() {
        var i;
        var minime = this;
        this.dom.filter_page_simple.html("");
        for (i = 0; i < this.options.filters.length; i++) {
            var row = $(this.options.templates.filter_row);
            var wrapper = $(this.options.templates.filter_element_root);
            var header_name = this.options.filters[i];
            if (this.options.header_names && this.options.header_names.hasOwnProperty(this.options.filters[i])) {
                header_name = this.options.header_names[this.options.filters[i]];
            }

            var label = $(this.options.templates.filter_element_label.replace("%header%", header_name).replace("%header%", header_name));

            var sort_down;
            var sort_up;
            if (this.options.sort_by == this.options.filters[i] && this.options.sort_reverse == false)
                sort_down = $(this.options.templates.filter_element_sort_down.replace("%sort_selected%", this.options.templates.filter_element_sort_selected));
            else
                sort_down = $(this.options.templates.filter_element_sort_down.replace("%sort_selected%", ""));
            if (this.options.sort_by == this.options.filters[i] && this.options.sort_reverse == true)
                sort_up = $(this.options.templates.filter_element_sort_up.replace("%sort_selected%", this.options.templates.filter_element_sort_selected));
            else
                sort_up = $(this.options.templates.filter_element_sort_up.replace("%sort_selected%", ""));
            var sort_by = this.options.filters[i];
            sort_up.attr("data-sort-by", sort_by);
            sort_up.attr("data-sort-reverse", "true");
            sort_up.on("click", function(event) {
                minime.sortBy(event);
            });
            sort_down.attr("data-sort-by", sort_by);
            sort_down.attr("data-sort-reverse", "false");
            sort_down.on("click", function(event) {
                minime.sortBy(event);
            });
            sort_down.appendTo(label);
            sort_up.appendTo(label);
            this.dom.filter_sorters[this.options.filters[i]] = {};
            this.dom.filter_sorters[this.options.filters[i]].up = sort_up;
            this.dom.filter_sorters[this.options.filters[i]].down = sort_down;

            label.appendTo(wrapper);
            var filter_type = this.options.header_types[this.options.filters[i]];
            var $input = $(this.options.templates.filter_element_input_wrapper.replace("%type%", filter_type));
            if (filter_type == "string") {
                var input_string = $(this.options.templates.filter_element_input_string.replace("%header%", this.options.filters[i]));
                this.filtering.string[this.options.filters[i]] = input_string;
                input_string.on("change", function(event) {
                    minime.filterItems();
                });
                input_string.on("keyup", function(event) {
                    minime.filterItems();
                });
                input_string.appendTo($input);
                $input.appendTo(wrapper);
                wrapper.appendTo(row);
                row.appendTo(this.dom.filter_page_simple);
            }
            if (filter_type == "range") {
                var min_max = this.getMinMax(this.options.filters[i]);
                min_max[0] = 0;
                var input_range_html = this.options.templates.filter_element_input_range;
                input_range_html = input_range_html.replace("%header%", this.options.filters[i]);
                input_range_html = input_range_html.replace("%min_value%", min_max[0]).replace("%min_value%", min_max[0]).replace("%min_value%", min_max[0]);
                input_range_html = input_range_html.replace("%max_value%", min_max[1]).replace("%max_value%", min_max[1]).replace("%max_value%", min_max[1]);
                input_range_html = input_range_html.replace("%min_value_formatted%", this.numberFormatter.format(min_max[0]));
                input_range_html = input_range_html.replace("%max_value_formatted%", this.numberFormatter.format(min_max[1]));
                input_range_html = input_range_html.replace("%unique_id%", this.unique_id);
                if (this.options.units.hasOwnProperty(this.options.filters[i])) {
                    input_range_html = input_range_html.replace("%unit%", this.options.units[this.options.filters[i]]).replace("%unit%", this.options.units[this.options.filters[i]]);
                } else {
                    input_range_html = input_range_html.replace("%unit%", "").replace("%unit%", "");
                }
                var input_range = $(input_range_html);
                input_range.appendTo($input);
                $input.appendTo(wrapper);
                wrapper.appendTo(row);
                row.appendTo(this.dom.filter_page_simple);
                // old, not so good init  todo: remove me
                // this.filtering.slider[this.options.filters[i]] = new Slider(input_range.find("input")[0]);
                this.filtering.slider[this.options.filters[i]] = $(input_range.find("input")[0]).slider();
                this.filtering.slider[this.options.filters[i]].on("slide", function(event) {
                    minime.filterItems();
                });
            }
            if (filter_type == "options") {
                var items = this.getOptions(this.options.filters[i]);
                var j,
                    select = $(this.options.templates.filter_element_input_enum.replace("%unique_id%", this.unique_id).replace("%header%", this.options.filters[i]));
                var unit = "";
                if (this.options.units.hasOwnProperty(this.options.filters[i])) {
                    unit = this.options.units[this.options.filters[i]];
                }
                for (j = 0; j < items.length; j++) {
                    var option = $(this.options.templates.filter_element_input_enum_option.replace("%value%", items[j]).replace("%value%", items[j]));
                    option.appendTo(select);
                }
                select.on("change", function() {
                    minime.filterItems()
                });
                select.appendTo($input);
                $input.appendTo(wrapper);
                wrapper.appendTo(row);
                row.appendTo(this.dom.filter_page_simple);
                this.filtering.options[this.options.filters[i]] = select.multiselect({
                    enableFiltering: true,
                    includeSelectAllOption: true,
                    maxHeight: 400,
                    numberDisplayed: 2,
                    enableCaseInsensitiveFiltering: true,
                    onChange: function(event) {
                        minime.filterItems()
                        setTimeout(function() {
                            minime.correctFilterHeight();
                        }, 50);
                    }
                });
            }
            if (filter_type == "array_string") {
                var items = [], j, k, l;
                for (k = 0; k < this.options.data.length; k++) {
                    var option_split = this.options.data[k][this.options.filters[i]].split(",");
                    l = 0;
                    for (j = 0; j < option_split.length; j++) {
                        option_split[j] = option_split[j].trim()
                    }
                    for (j = 0; j < option_split.length; j++) {
                        if (items.indexOf(option_split[j]) == -1)
                            items.push(option_split[j]);
                    }
                }
                items.sort(function(a, b) {
                    return (a.toLowerCase()).localeCompare(b.toLowerCase());
                });
                var select = $(this.options.templates.filter_element_input_enum.replace("%unique_id%", this.unique_id).replace("%header%", this.options.filters[i]));
                var unit = "";
                if (this.options.units.hasOwnProperty(this.options.filters[i])) {
                    unit = this.options.units[this.options.filters[i]];
                }
                for (j = 0; j < items.length; j++) {
                    var option = $(this.options.templates.filter_element_input_enum_option.replace("%value%", items[j]).replace("%value%", items[j]));
                    option.appendTo(select);
                }
                select.appendTo($input);
                $input.appendTo(wrapper);
                wrapper.appendTo(row);
                row.appendTo(this.dom.filter_page_simple);
                this.filtering.array_string[this.options.filters[i]] = select.multiselect({
                    enableFiltering: true,
                    includeSelectAllOption: true,
                    maxHeight: 400,
                    numberDisplayed: 2,
                    enableCaseInsensitiveFiltering: true,
                    onChange: function(event) {
                        minime.filterItems()
                    }
                });
            }
            if (filter_type == "array_slider") {
                var items = [], k, l, max_val = -Infinity;
                for (k = 0; k < this.options.data.length; k++) {
                    var option_list = new Array();
                    var option_split = this.options.data[k][this.options.filters[i]].split(",");
                    l = 0;
                    for (j = 0; j < option_split.length; j++) {

                        if (!isNaN(parseInt(option_split[j].trim()))) {
                            option_list[l++] = parseInt(option_split[j].trim());
                        }
                    }

                    this.options.data[k][this.options.filters[i] + '_list'] = option_list;
                    for (j = 0; j < option_list.length; j++) {
                        if (items.indexOf(option_list[j]) == -1)
                            items.push(option_list[j]);
                    }
                    this.options.data[k][this.options.filters[i] + '_max'] = Math.max(...option_list
                )
                    ;
                    max_val = Math.max(this.options.data[k][this.options.filters[i] + '_max'], max_val);
                }
                items.sort(function(a, b) {
                    return a - b;
                });
                var input_array_range = this.options.templates.filter_element_input_range;
                input_array_range = input_array_range.replace("%header%", this.options.filters[i]);
                input_array_range = input_array_range.replace("%min_value%", 0).replace("%min_value%", 0).replace("%min_value%", 0);
                input_array_range = input_array_range.replace("%max_value%", max_val).replace("%max_value%", max_val).replace("%max_value%", max_val);
                input_array_range = input_array_range.replace("%min_value_formatted%", this.numberFormatter.format(0));
                input_array_range = input_array_range.replace("%max_value_formatted%", this.numberFormatter.format(max_val));
                input_array_range = input_array_range.replace("%unique_id%", this.unique_id);
                if (this.options.units.hasOwnProperty(this.options.filters[i])) {
                    input_array_range = input_array_range.replace("%unit%", this.options.units[this.options.filters[i]]).replace("%unit%", this.options.units[this.options.filters[i]]);
                } else {
                    input_array_range = input_array_range.replace("%unit%", "").replace("%unit%", "");

                }
                var input_range = $(input_array_range);
                input_range.appendTo($input);
                $input.appendTo(wrapper);
                wrapper.appendTo(row);
                row.appendTo(this.dom.filter_page_simple);
                this.filtering.array_slider[this.options.filters[i]] = new Slider(row.find("input")[0]);
                this.filtering.array_slider[this.options.filters[i]].on("slide", function(event) {
                    minime.filterItems();
                });
            }
        }
    },
    // all advanced filters will be slider!
    renderAdvancedFilters: function() {
        var minime = this;
        this.dom.filter_page_advanced = $(this.options.templates.filter_page_advanced);
        this.dom.filter_advanced_toggle_show = $(this.options.templates.filter_advanced_toggle_show);
        this.dom.filter_page_advanced.appendTo(this.dom.filter_root_wrapper);
        this.dom.filter_advanced_toggle_show.appendTo(this.dom.filter_root);
        this.dom.filter_advanced_toggle_show.on("click", function(event) {
            minime.toggleAdvancedFilter();
        });
        var i, j, k;
        for (i = 0; i < this.options.advanced_filters.length; i++) {
            if (!this.options.advanced_filters[i]['formula'])
                this.options.advanced_filters[i]['formula'] = this.options.advanced_filters[i]['name'];
            for (j = 0; j < this.options.data.length; j++) {
                var eval_me = this.options.advanced_filters[i]['formula'];
                for (k = 0; k < this.options.headers.length; k++) {
                    // in case of array - array data structure
                    if (!isNaN(parseInt(this.options.headers[k]))) {
                        eval_me = eval_me.replace(new RegExp("col_" + this.options.headers[k] + "_", 'gi'), this.options.data[j][this.options.headers[k]]);
                    } else {
                        eval_me = eval_me.replace(new RegExp(this.options.headers[k], 'gi'), this.options.data[j][this.options.headers[k]]);
                    }
                }
                this.options.data[j][this.options.advanced_filters[i]['name']] = eval(eval_me);
            }
            var row = $(this.options.templates.filter_row);
            var wrapper = $(this.options.templates.filter_element_root);
            var label = $(this.options.templates.filter_element_label.replace("%header%", this.options.advanced_filters[i]['name']).replace("%header%", this.options.advanced_filters[i]['name']));
            var sort_down;
            var sort_up;
            if (this.options.sort_by == this.options.advanced_filters[i] && this.options.sort_reverse == false)
                sort_down = $(this.options.templates.filter_element_sort_down.replace("%sort_selected%", this.options.templates.filter_element_sort_selected));
            else
                sort_down = $(this.options.templates.filter_element_sort_down.replace("%sort_selected%", ""));

            if (this.options.sort_by == this.options.advanced_filters[i] && this.options.sort_reverse == true)
                sort_up = $(this.options.templates.filter_element_sort_up.replace("%sort_selected%", this.options.templates.filter_element_sort_selected));
            else
                sort_up = $(this.options.templates.filter_element_sort_up.replace("%sort_selected%", ""));
            var sort_by = this.options.advanced_filters[i]['name'];
            sort_up.attr("data-sort-by", sort_by);
            sort_up.attr("data-sort-reverse", "true");
            sort_up.on("click", function(event) {
                minime.sortBy(event);
            });
            sort_down.attr("data-sort-by", sort_by);
            sort_down.attr("data-sort-reverse", "false");
            sort_down.on("click", function(event) {
                minime.sortBy(event);
            });
            sort_down.appendTo(label);
            sort_up.appendTo(label);
            this.dom.filter_sorters[this.options.advanced_filters[i]['name']] = {};
            this.dom.filter_sorters[this.options.advanced_filters[i]['name']].up = sort_up;
            this.dom.filter_sorters[this.options.advanced_filters[i]['name']].down = sort_down;
            label.appendTo(wrapper);
            var $input = $(this.options.templates.filter_element_input_wrapper.replace("%type%", 'advanced'));
            var min_max = this.getMinMax(this.options.advanced_filters[i]['name']);
            min_max[0] = 0;
            min_max[1] *= 1.05;
            var input_range_html = this.options.templates.filter_element_input_range;
            input_range_html = input_range_html.replace("%header%", this.options.advanced_filters[i]['name']);
            input_range_html = input_range_html.replace("%min_value%", min_max[0]).replace("%min_value%", min_max[0]).replace("%min_value%", min_max[0]);
            input_range_html = input_range_html.replace("%max_value%", min_max[1]).replace("%max_value%", min_max[1]).replace("%max_value%", min_max[1]);
            input_range_html = input_range_html.replace("%min_value_formatted%", this.numberFormatter.format(min_max[0]));
            input_range_html = input_range_html.replace("%max_value_formatted%", this.numberFormatter.format(min_max[1]));
            input_range_html = input_range_html.replace("%unique_id%", this.unique_id);
            if (this.options.advanced_filters[i].hasOwnProperty('units')) {
                input_range_html = input_range_html.replace("%unit%", this.options.advanced_filters[i]['unit']).replace("%unit%", this.options.advanced_filters[i]['unit']);
            } else {
                input_range_html = input_range_html.replace("%unit%", "").replace("%unit%", "");
            }
            var input_range = $(input_range_html);

            input_range.appendTo($input);
            $input.appendTo(wrapper);
            wrapper.appendTo(row);
            row.appendTo(this.dom.filter_page_advanced);
            // this.filtering.advanced[this.options.advanced_filters[i]['name']] = new Slider(row.find("input")[0]);
            this.filtering.advanced[this.options.advanced_filters[i]['name']] = $(row.find("input")[0]).slider();
            this.filtering.advanced[this.options.advanced_filters[i]['name']].on("slide", function(event) {
                minime.filterItems();
            });
            this.options.header_types[this.options.advanced_filters[i]['name']] = 'advanced';
        }
    },
    toggleAdvancedFilter: function() {
        var animation_time = 1000;
        var minime = this;
        if (!this.advanced_filters_show) {
            this.dom.filter_root_wrapper.animate({left: -250}, animation_time);
            this.dom.filter_advanced_toggle_show.removeClass(this.options.templates.filter_toggle_active_class);
            this.dom.filter_advanced_toggle_show.addClass(this.options.templates.filter_toggle_inactive_class);
            setTimeout(function() {
                minime.dom.filter_advanced_toggle_show.removeClass("oi-caret-left");
                minime.dom.filter_advanced_toggle_show.addClass("oi-caret-right");
                minime.dom.filter_advanced_toggle_show.addClass(minime.options.templates.filter_toggle_active_class);
                minime.dom.filter_advanced_toggle_show.removeClass(minime.options.templates.filter_toggle_inactive_class);
            }, animation_time);
            this.advanced_filters_show = true;
        } else {
            this.dom.filter_root_wrapper.animate({left: 0}, animation_time);
            this.dom.filter_advanced_toggle_show.removeClass(this.options.templates.filter_toggle_active_class);
            this.dom.filter_advanced_toggle_show.addClass(this.options.templates.filter_toggle_inactive_class);
            setTimeout(function() {
                minime.dom.filter_advanced_toggle_show.addClass("oi-caret-left");
                minime.dom.filter_advanced_toggle_show.removeClass("oi-caret-right");
                minime.dom.filter_advanced_toggle_show.addClass(minime.options.templates.filter_toggle_active_class);
                minime.dom.filter_advanced_toggle_show.removeClass(minime.options.templates.filter_toggle_inactive_class);
            }, animation_time);
            this.advanced_filters_show = false;
        }
    },
    filterItems: function() {
        var i, rendered;
        for (i = 0; i < this.options.data.length; i++) {
            this.options.data[i].filtered_out = false;
        }
        var keys = Object.keys(this.filtering.string);
        for (i = 0; i < keys.length; i++) {
            this.filterByString(keys[i], this.filtering.string[keys[i]].val());
        }
        keys = Object.keys(this.filtering.slider);
        for (i = 0; i < keys.length; i++) {
            this.filterBySlider(keys[i], this.filtering.slider[keys[i]]);
        }
        keys = Object.keys(this.filtering.options);
        for (i = 0; i < keys.length; i++) {
            this.filterByOptions(keys[i], this.filtering.options[keys[i]]);
        }
        keys = Object.keys(this.filtering.array_string);
        for (i = 0; i < keys.length; i++) {
            this.filterByArraySelect(keys[i], this.filtering.array_string[keys[i]]);
        }
        keys = Object.keys(this.filtering.array_slider);
        for (i = 0; i < keys.length; i++) {
            this.filterByArraySlider(keys[i], this.filtering.array_slider[keys[i]]);
        }
        keys = Object.keys(this.filtering.advanced);
        for (i = 0; i < keys.length; i++) {
            this.filterBySlider(keys[i], this.filtering.advanced[keys[i]]);
        }
        if (this.options.hasOwnProperty("external_filters") && this.options.external_filters) {
            keys = Object.keys(this.options.external_filters);
            for (i = 0; i < keys.length; i++) {
                if (this.options.external_filters[keys[i]]['type'] == 'range') {
                    this.filterByRange(this.options.external_filters[keys[i]]['name'], this.options.external_filters[keys[i]]['min'], this.options.external_filters[keys[i]]['max']);
                }
                if (this.options.external_filters[keys[i]]['type'] == 'string') {
                    this.filterByString(this.options.external_filters[keys[i]]['name'], this.options.external_filters[keys[i]]['string']);
                }
                if (this.options.external_filters[keys[i]]['type'] == 'array_range') {
                    this.filterByArrayRange(this.options.external_filters[keys[i]]['name'], this.options.external_filters[keys[i]]['min'], this.options.external_filters[keys[i]]['max']);
                }
                if (this.options.external_filters[keys[i]]['type'] == 'array_string' || this.options.external_filters[keys[i]]['type'] == 'enum') {
                    this.filterByArrayString(this.options.external_filters[keys[i]]['name'], this.options.external_filters[keys[i]]['enums']);
                }
            }
        }

        rendered = this.countRendered();
        this.rendered_item_pages = Math.max(1, Math.ceil(rendered / this.options.items_per_page));
        this.current_page = 0;
        this.renderPagination();
        this.renderListPaginated();
        var keys = Object.keys(this.filtering.options);
        for (i = 0; i < keys.length; i++)
            this.disableUnavailableOptions(keys[i], this.filtering.options[keys[i]]);
        if (this.options.plot.visible) {
            this.plotTimeoutCount++;
            setTimeout(this.plotTimeout(), 200);
        }

    },
    // for unique form name / ID
    generateRandomString: function(length) {
        var text = "";
        var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < length; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    },
    countRendered: function() {
        var i, rendered = 0;
        for (i = 0; i < this.options.data.length; i++) {
            if (!this.options.data[i].filtered_out)
                rendered++;
        }
        return rendered;
    },
    correctFilterHeight: function() {
        this.dom.filter_root.animate({"min-height": Math.max(this.dom.filter_root_wrapper.height(), this.dom.filter_page_advanced.height()) + 10}, this.options.filter_animation_time);
    },
    toggleShowFilters: function() {
        var animationTime = this.options.filter_animation_time;
        var minime = this;
        // open
        if (!this.filters_show) {
            // this.dom.root.css("min-height", this.dom.root_wrapper.height());
            this.dom.root_wrapper.css("min-height", 0);

            this.dom.root_wrapper.animate({
                "min-height": this.dom.filter_root_wrapper.height()
            }, animationTime / 2);
            setTimeout(function() {
                minime.dom.filter_root.animate({
                    width: "250px"
                }, animationTime);
                minime.dom.root_wrapper.animate({
                    "margin-right": "250px"
                }, animationTime);
                minime.dom.filter_toggle_show.removeClass(minime.options.templates.filter_toggle_active_class);
                minime.dom.filter_toggle_show.addClass(minime.options.templates.filter_toggle_inactive_class);
                setTimeout(function() {
                    minime.dom.filter_toggle_show.removeClass("oi-caret-left");
                    minime.dom.filter_toggle_show.addClass("oi-caret-right");
                    minime.dom.filter_toggle_show.addClass(minime.options.templates.filter_toggle_active_class);
                    minime.dom.filter_toggle_show.removeClass(minime.options.templates.filter_toggle_inactive_class);
                }, animationTime * 1.1);
            }, animationTime / 1.7);
            this.filters_show = true;
            // close
        } else {
            this.dom.filter_root.animate({
                width: "0"
            }, animationTime);
            this.dom.root_wrapper.animate({
                "margin-right": "0"
            }, animationTime);
            this.dom.filter_toggle_show.removeClass(this.options.templates.filter_toggle_active_class);
            this.dom.filter_toggle_show.addClass(this.options.templates.filter_toggle_inactive_class);
            setTimeout(function() {
                minime.dom.filter_toggle_show.addClass("oi-caret-left");
                minime.dom.filter_toggle_show.removeClass("oi-caret-right");
                minime.dom.filter_toggle_show.addClass(minime.options.templates.filter_toggle_active_class);
                minime.dom.filter_toggle_show.removeClass(minime.options.templates.filter_toggle_inactive_class);
            }, animationTime / 2);
            setTimeout(function() {
                // minime.dom.root.animate({
                //     "min-height": 0
                // }, animationTime / 2);
                minime.dom.root_wrapper.animate({
                    "min-height": 0
                }, animationTime / 2);
            }, animationTime / 1.5);
            this.filters_show = false;
        }
    },
    toggleItemSelected: function(event) {
        var i = $(event.currentTarget).attr("name");
        var selected = !this.options.data[i]['selected'];
        this.options.data[i]['selected'] = selected;
        $(event.currentTarget).prop("checked", selected);
    },
    listSelectedAttribute: function(attribute) {
        var i, result = [];

        for (i = 0; i < this.options.data.length; i++) {
            if (this.options.data[i]['selected'])
                result.push(this.options.data[i][attribute]);
        }
        return result;
    },
    listSelectedElements: function() {
        var i, result = [];

        for (i = 0; i < this.options.data.length; i++) {
            if (this.options.data[i]['selected'])
                result.push(this.options.data[i]);
        }
        return result;
    },
    externalFilter: function(filters) {
        this.options.external_filters = filters;
        this.filterItems();

    },
    downloadSelected: function(format) {
        var selected_elements = this.listSelectedElements();
        var dataStr = "Invalid format";
        this.dom.download_href_placeholder.attr("download", "selected.txt");
        if (format == "JSON") {
            dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selected_elements));
            this.dom.download_href_placeholder.attr("download", "selected.json");
        }
        if (format == "CSV") {
            dataStr = "data:text/csv;charset=utf-8,";
            var str = "";
            var i;
            var export_headers = this.options.headers.slice(0);
            export_headers.push("selected");
            str += export_headers.join(",") + "\r\n";
            for (i = 0; i < selected_elements.length; i++) {
                var line = [];
                for (j = 0; j < export_headers.length; j++) {
                    line.push('"' + selected_elements[i][export_headers[j]] + '"');
                }
                str += line.join(",") + "\r\n";
            }
            dataStr += encodeURIComponent(str);
            this.dom.download_href_placeholder.attr("download", "selected.csv");
        }
        if (format == "TXT") {
            dataStr = "data:text/text;charset=utf-8,";
            for (i = 0; i < selected_elements.length; i++) {
                var line = [];
                for (j = 0; j < this.options.headers.length; j++) {
                    line.push(selected_elements[i][this.options.headers[j]]);
                }
                dataStr += line.join(" ") + "\r\n";
            }
            this.dom.download_href_placeholder.attr("download", "selected.txt");
        }
        if (format == "XML1") {
            dataStr = "data:text/xml;charset=utf-8," + "<?xml version=\"1.0\" encoding=\"utf-8\"?><tabledata>";
            for (i = 0; i < selected_elements.length; i++) {
                dataStr += "<row";
                for (j = 0; j < this.options.headers.length; j++) {
                    dataStr += " \"" + this.options.headers[j] + "\"=\"";
                    dataStr += selected_elements[i][this.options.headers[j]];
                    dataStr += "\"";
                }
                dataStr += "/>\r\n";
            }
            dataStr += "</tabledata>\r\n";
            this.dom.download_href_placeholder.attr("download", "selected.xml");
        }
        if (format == "XML2") {
            dataStr = "data:text/xml;charset=utf-8," + "<?xml version=\"1.0\" encoding=\"utf-8\"?><tabledata>";
            for (i = 0; i < selected_elements.length; i++) {
                dataStr += "<row>";
                for (j = 0; j < this.options.headers.length; j++) {
                    dataStr += "<" + this.options.headers[j] + ">";
                    dataStr += selected_elements[i][this.options.headers[j]];
                    dataStr += "</" + this.options.headers[j] + ">";
                }
                dataStr += "</row>\r\n";
            }
            dataStr += "</tabledata>\r\n";
            this.dom.download_href_placeholder.attr("download", "selected.xml");
        }
        if (format == "SQL") {
            dataStr = "data:text/sql;charset=utf-8," + "INSERT INTO `Table` (";
            var tmp_headers = this.options.headers;

            if (!isNaN(parseInt(this.options.headers[0]))) {
                tmp_headers = this.options.header_names;
            }
            dataStr += "'" + tmp_headers.join("', '") + "'";
            dataStr += "), values";
            var values = [];
            for (i = 0; i < selected_elements.length; i++) {
                var value = [];
                for (j = 0; j < this.options.headers.length; j++) {
                    value.push(selected_elements[i][this.options.headers[j]]);
                }
                values.push("'" + value.join("', '") + "'");
            }
            dataStr += "(" + values.join("), (") + ")";
            dataStr += ";";
            this.dom.download_href_placeholder.attr("download", "selected.sql");
        }
        this.dom.download_href_placeholder.attr("href", dataStr);
        this.dom.download_href_placeholder[0].click();
    },
    headerContextMenu: function(event) {
        var relX = event.pageX - this.dom.document_subroot.offset().left;
        var relY = event.pageY - this.dom.document_subroot.offset().top;
        this.header_context_menu_column = $(event.target).attr("class").replace("item_", "");
        this.dom.header_context_menu.finish().toggle().css("left", relX - 10).css('top', relY - 10);
        event.preventDefault();
    },
    headerContextMenuClose: function() {
        this.dom.header_context_menu.hide();
    },
    headerContextMenuEvent: function(event) {
        if ($(event.target)[0] == this.dom.header_context_menu[0])
            return;
        var i;
        var selected_menu = $(event.target).attr("data-action");

        if (this.options.header_names && this.options.header_names[this.header_context_menu_column])
            yaxisName = this.options.header_names[this.header_context_menu_column];

        if (selected_menu == 'plot') {
            this.options.plot.mode = "selected";
            this.options.plot.xaxis = false;
            this.options.plot.yaxis = this.header_context_menu_column;

        }
        if (selected_menu == 'plot_all') {
            this.options.plot.mode = "all";
            this.options.plot.xaxis = false;
            this.options.plot.yaxis = this.header_context_menu_column;
        }
        this.options.plot.visible = true;
        this.renderPlot();
        // sticking the plot div right under the mouse, wherever it is
        this.dom.plot.css("top", event.screenY - event.view.screenTop);
        this.headerContextMenuClose();
        this.plotUpdateSelects();


    },
    renderPlot: function() {
        var selected_list = [];
        var i;
        var xaxisUnit = this.options.units[this.options.plot.xaxis];
        var yaxisUnit = this.options.units[this.options.plot.yaxis];
        var yaxisName = this.options.header_names[this.options.plot.yaxis];
        var xaxisName = this.options.header_names[this.options.plot.xaxis];
        var highlighterYvalues = 3;
        var highlighterFormatString = '%s %s,<br/>%s';

        if (!yaxisName)
            this.options.plot.yaxis;
        if (!xaxisUnit)
            xaxisUnit = '';
        if (!yaxisUnit)
            yaxisUnit = '';


        if (this.options.plot.mode == 'selected') {
            var selected = 0;
            if (this.options.plot.xaxis) {
                for (i = 0; i < this.options.data.length; i++) {
                    if (this.options.data[i].selected) {
                        selected++;
                        selected_list.push([this.options.data[i][this.options.plot.xaxis], this.options.data[i][this.options.plot.yaxis], yaxisUnit, this.options.data[i][this.options.plot.xaxis], xaxisUnit, this.options.data[i][this.options.plot_id]]);
                    }
                }
                highlighterYvalues = 5;
                highlighterFormatString = '%s %s,<br/>%s %s,<br/>%s';

            } else {
                for (i = 0; i < this.options.data.length; i++) {
                    if (this.options.data[i].selected) {
                        selected++;
                        selected_list.push([i, this.options.data[i][this.options.plot.yaxis], yaxisUnit, this.options.data[i][this.options.plot_id]]);
                    }
                }
            }
        }
        if (selected == 0 || this.options.plot.mode == 'all') {
            selected_list = [];
            if (this.options.plot.xaxis) {
                for (i = 0; i < this.options.data.length; i++) {
                    if (!this.options.data[i].filtered_out)
                        selected_list.push([this.options.data[i][this.options.plot.xaxis], this.options.data[i][this.options.plot.yaxis], yaxisUnit, this.options.data[i][this.options.plot.xaxis], xaxisUnit, this.options.data[i][this.options.plot_id]]);

                    // selected_list.push([this.options.data[i][this.options.plot.xaxis], this.options.data[i][this.options.plot.yaxis], yaxisUnit, this.options.data[i][this.options.plot_id]]);
                }
                highlighterYvalues = 5;
                highlighterFormatString = '%s %s,<br/>%s %s,<br/>%s';

            } else {
                for (i = 0; i < this.options.data.length; i++) {
                    if (!this.options.data[i].filtered_out)
                        selected_list.push([i, this.options.data[i][this.options.plot.yaxis], yaxisUnit, this.options.data[i][this.options.plot_id]]);
                }

            }
        }
        this.dom.plot_graph.html("");
        this.dom.plot.show();
        this.dom.plot.css("width", this.dom.root_wrapper.css("width"));
        $.jqplot.config.enablePlugins = true;
        if (selected_list.length > 0)
            this.options.plot.plotter = $(this.dom.plot_graph).jqplot([selected_list], {
                axes: {
                    xaxis: {
                        label: xaxisName,
                        numberTicks: 10,
                        tickOptions: {
                            suffix: ' ' + xaxisUnit
                        }

                    },
                    yaxis: {
                        label: yaxisName,
                        tickOptions: {
                            suffix: ' ' + yaxisUnit
                        }
                    }
                },
                highlighter: {
                    show: true,
                    sizeAdjust: 10,
                    tooltipLocation: 's',
                    tooltipAxes: 'y',
                    yvalues: highlighterYvalues,
                    formatString: highlighterFormatString
                },
                cursor: {
                    show: true,
                    zoom: true,
                    looseZoom: false,
                    constrainOutsideZoom: false,
                    tooltip: false
                },
                seriesDefaults: {
                    showLine: false
                }
            });
        var minime = this;
        this.options.plot.plotter.data().jqplot.postDrawHooks.add(function(event) {
            if (this.plugins.cursor._zoom.zooming)
                minime.plotFilterFromZoom();
        });

        this.dom.plot.find(".jqplot-event-canvas").on("dblclick", function(event) {
            // event.preventDefault();
            minime.plotFilterReset();
        });


        this.options.plot.visible = true;
    },
    plotClose: function() {
        this.dom.plot.hide();
        this.options.plot.visible = false;
    },
    plotUpdateSelects: function() {
        this.dom.plot.find("select.xaxis").val(this.options.plot.xaxis);
        this.dom.plot.find("select.yaxis").val(this.options.plot.yaxis);
        this.dom.plot.find("input[name='selected_items']").prop('checked', this.options.plot.mode == "selected");
    }
    ,
    plotUpdateFromSelects: function() {
        this.options.plot.xaxis = this.dom.plot.find("select.xaxis").val();
        this.options.plot.yaxis = this.dom.plot.find("select.yaxis").val();
        if (this.options.plot.xaxis == 0)
            this.options.plot.xaxis = false;
        if (this.options.plot.yaxis == 0)
            this.options.plot.yaxis = false;

        if (this.dom.plot.find("input[name='selected_items']:checked").size() > 0) {
            this.options.plot.mode = "selected";
        } else {
            this.options.plot.mode = "all";
        }
        this.renderPlot();
    },
    plotFilterFromZoom: function() {
        if (this.options.plot.xaxis) {
            this.filtering.slider[this.options.plot.xaxis].slider("setValue",
                [this.options.plot.plotter.data().jqplot.axes.xaxis.min,
                    this.options.plot.plotter.data().jqplot.axes.xaxis.max]);
        }
        if (this.options.plot.yaxis)
            this.filtering.slider[this.options.plot.yaxis].slider("setValue",
                [this.options.plot.plotter.data().jqplot.axes.yaxis.min,
                    this.options.plot.plotter.data().jqplot.axes.yaxis.max]);

        this.filterItems();
    },
    plotFilterReset: function() {
        if (this.options.plot.xaxis) {
            this.filtering.slider[this.options.plot.xaxis].slider("setValue",
                [this.filtering.slider[this.options.plot.xaxis].data().sliderMin,
                    this.filtering.slider[this.options.plot.xaxis].data().sliderMax]);
        }
        if (this.options.plot.yaxis)
            this.filtering.slider[this.options.plot.yaxis].slider("setValue",
                [this.filtering.slider[this.options.plot.yaxis].data().sliderMin,
                    this.filtering.slider[this.options.plot.yaxis].data().sliderMax]);

        this.filterItems();

    }
    ,
    contextMenu: function(event) {

        var relX = event.pageX - this.dom.document_subroot.offset().left;
        var relY = event.pageY - this.dom.document_subroot.offset().top;
        this.dom.context_menu.finish().toggle().css("left", relX - 10).css('top', relY - 10);
        this.context_menu_column = $(event.target).attr("class").replace("item_", "");
        this.context_menu_row = $(event.target).parent().attr("data-item_list_id");
        if (!this.options.no_details) {
            this.dom.item_details_placeholder_element.css("display", "none");
        }
        event.preventDefault();
    }
    ,
    contextMenuClose: function() {
        this.dom.context_menu.hide();
    }
    ,
    contextMenuEvent: function(event) {
        if ($(event.target)[0] == this.dom.context_menu[0])
            return;
        var i;
        var selected_menu = $(event.target).attr("data-action");
        if (selected_menu == 'select_unfiltered') {
            for (i = 0; i < this.options.data.length; i++) {
                this.options.data[i].selected = !this.options.data[i].filtered_out;
            }
            this.renderListPaginated();
        }
        if (selected_menu == 'unselect_all') {
            for (i = 0; i < this.options.data.length; i++) {
                this.options.data[i].selected = false;
            }
            this.renderListPaginated();
        }
        if (selected_menu == 'filter_like') {
            if (this.options.header_types[this.context_menu_column] == 'range') {
                this.filtering.slider[this.context_menu_column].slider("setValue", [this.options.data[this.context_menu_row][this.context_menu_column], this.options.data[this.context_menu_row][this.context_menu_column]])
            }
            if (this.options.header_types[this.context_menu_column] == 'string') {
                this.filtering.string[this.context_menu_column].val(this.options.data[this.context_menu_row][this.context_menu_column]);
            }

            if (this.options.header_types[this.context_menu_column] == 'options') {
                this.filtering.options[this.context_menu_column].multiselect('deselectAll', false);
                this.filtering.options[this.context_menu_column].multiselect("select", this.options.data[this.context_menu_row][this.context_menu_column]);
            }
            this.filterItems();


        }
        if (selected_menu == 'filter_manual_reset') {
            this.options.external_filters = false;
            this.filterItems();
        }
        if (selected_menu == 'filter_all_reset') {
            keys = Object.keys(this.filtering.string);
            for (i = 0; i < keys.length; i++) {
                this.filtering.string[keys[i]].val("");
                ;
            }
            keys = Object.keys(this.filtering.slider);
            for (i = 0; i < keys.length; i++) {
                this.filtering.slider[keys[i]].setValue(this.filtering.slider[keys[i]].options.value);
            }
            keys = Object.keys(this.filtering.options);
            for (i = 0; i < keys.length; i++) {
                this.filtering.options[keys[i]].find("option").prop("selected", false);
                this.filtering.options[keys[i]].multiselect("refresh");
            }
            keys = Object.keys(this.filtering.array_string);
            for (i = 0; i < keys.length; i++) {
                this.filtering.options[keys[i]].find("option").prop("selected", false);
                this.filtering.options[keys[i]].multiselect("refresh");
            }
            keys = Object.keys(this.filtering.array_slider);
            for (i = 0; i < keys.length; i++) {
                this.filtering.slider[keys[i]].setValue(this.filtering.slider[keys[i]].options.value);
            }
            keys = Object.keys(this.filtering.advanced);
            for (i = 0; i < keys.length; i++) {
                this.filtering.advanced[keys[i]].setValue(this.filtering.advanced[keys[i]].options.value);
            }
            this.options.external_filters = false;

            this.filterItems();
        }
        if (selected_menu.indexOf("download_") != -1) {
            var format = selected_menu.replace("download_", "");
            this.downloadSelected(format);
        }
        this.contextMenuClose();

    }
    ,
    plotTimeoutCount: 0,
    plotTimeout: function() {
        if (--this.plotTimeoutCount == 0) {
            this.renderPlot();
        }
    }
}
;
/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 */

$.fn.dataprospector = function(option) {
    var data = $(this).data('dataprospector');
    if (!data) {
        data = new Dataprospector(this, option);
        $(this).data('dataprospector', data);
    }
    // return new Dataprospector(this, option);
};

$.fn.dataprospector.Constructor = Dataprospector;

/**
 * ------------------------------------------------------------------------
 * Data Api implementation
 * ------------------------------------------------------------------------
 */


