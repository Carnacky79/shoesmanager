

/*! DataTables 2.1.2
 * © SpryMedia Ltd - datatables.net/license
 */

/**
 * @summary     DataTables
 * @description Paginate, search and order HTML tables
 * @version     2.1.2
 * @author      SpryMedia Ltd
 * @contact     www.datatables.net
 * @copyright   SpryMedia Ltd.
 *
 * This source file is free software, available under the following license:
 *   MIT license - https://datatables.net/license
 *
 * This source file is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
 *
 * For details please refer to: https://www.datatables.net
 */

(function( factory ) {
    "use strict";

    if ( typeof define === 'function' && define.amd ) {
        // AMD
        define( ['jquery'], function ( $ ) {
            return factory( $, window, document );
        } );
    }
    else if ( typeof exports === 'object' ) {
        // CommonJS
        // jQuery's factory checks for a global window - if it isn't present then it
        // returns a factory function that expects the window object
        var jq = require('jquery');

        if (typeof window === 'undefined') {
            module.exports = function (root, $) {
                if ( ! root ) {
                    // CommonJS environments without a window global must pass a
                    // root. This will give an error otherwise
                    root = window;
                }

                if ( ! $ ) {
                    $ = jq( root );
                }

                return factory( $, root, root.document );
            };
        }
        else {
            module.exports = factory( jq, window, window.document );
        }
    }
    else {
        // Browser
        window.DataTable = factory( jQuery, window, document );
    }
}(function( $, window, document ) {
    "use strict";


    var DataTable = function ( selector, options )
    {
        // Check if called with a window or jQuery object for DOM less applications
        // This is for backwards compatibility
        if (DataTable.factory(selector, options)) {
            return DataTable;
        }

        // When creating with `new`, create a new DataTable, returning the API instance
        if (this instanceof DataTable) {
            return $(selector).DataTable(options);
        }
        else {
            // Argument switching
            options = selector;
        }

        var _that = this;
        var emptyInit = options === undefined;
        var len = this.length;

        if ( emptyInit ) {
            options = {};
        }

        // Method to get DT API instance from jQuery object
        this.api = function ()
        {
            return new _Api( this );
        };

        this.each(function() {
            // For each initialisation we want to give it a clean initialisation
            // object that can be bashed around
            var o = {};
            var oInit = len > 1 ? // optimisation for single table case
                _fnExtend( o, options, true ) :
                options;


            var i=0, iLen;
            var sId = this.getAttribute( 'id' );
            var defaults = DataTable.defaults;
            var $this = $(this);


            /* Sanity check */
            if ( this.nodeName.toLowerCase() != 'table' )
            {
                _fnLog( null, 0, 'Non-table node initialisation ('+this.nodeName+')', 2 );
                return;
            }

            $(this).trigger( 'options.dt', oInit );

            /* Backwards compatibility for the defaults */
            _fnCompatOpts( defaults );
            _fnCompatCols( defaults.column );

            /* Convert the camel-case defaults to Hungarian */
            _fnCamelToHungarian( defaults, defaults, true );
            _fnCamelToHungarian( defaults.column, defaults.column, true );

            /* Setting up the initialisation object */
            _fnCamelToHungarian( defaults, $.extend( oInit, $this.data() ), true );



            /* Check to see if we are re-initialising a table */
            var allSettings = DataTable.settings;
            for ( i=0, iLen=allSettings.length ; i<iLen ; i++ )
            {
                var s = allSettings[i];

                /* Base check on table node */
                if (
                    s.nTable == this ||
                    (s.nTHead && s.nTHead.parentNode == this) ||
                    (s.nTFoot && s.nTFoot.parentNode == this)
                ) {
                    var bRetrieve = oInit.bRetrieve !== undefined ? oInit.bRetrieve : defaults.bRetrieve;
                    var bDestroy = oInit.bDestroy !== undefined ? oInit.bDestroy : defaults.bDestroy;

                    if ( emptyInit || bRetrieve )
                    {
                        return s.oInstance;
                    }
                    else if ( bDestroy )
                    {
                        new DataTable.Api(s).destroy();
                        break;
                    }
                    else
                    {
                        _fnLog( s, 0, 'Cannot reinitialise DataTable', 3 );
                        return;
                    }
                }

                /* If the element we are initialising has the same ID as a table which was previously
				 * initialised, but the table nodes don't match (from before) then we destroy the old
				 * instance by simply deleting it. This is under the assumption that the table has been
				 * destroyed by other methods. Anyone using non-id selectors will need to do this manually
				 */
                if ( s.sTableId == this.id )
                {
                    allSettings.splice( i, 1 );
                    break;
                }
            }

            /* Ensure the table has an ID - required for accessibility */
            if ( sId === null || sId === "" )
            {
                sId = "DataTables_Table_"+(DataTable.ext._unique++);
                this.id = sId;
            }

            /* Create the settings object for this table and set some of the default parameters */
            var oSettings = $.extend( true, {}, DataTable.models.oSettings, {
                "sDestroyWidth": $this[0].style.width,
                "sInstance":     sId,
                "sTableId":      sId,
                colgroup: $('<colgroup>').prependTo(this),
                fastData: function (row, column, type) {
                    return _fnGetCellData(oSettings, row, column, type);
                }
            } );
            oSettings.nTable = this;
            oSettings.oInit  = oInit;

            allSettings.push( oSettings );

            // Make a single API instance available for internal handling
            oSettings.api = new _Api( oSettings );

            // Need to add the instance after the instance after the settings object has been added
            // to the settings array, so we can self reference the table instance if more than one
            oSettings.oInstance = (_that.length===1) ? _that : $this.dataTable();

            // Backwards compatibility, before we apply all the defaults
            _fnCompatOpts( oInit );

            // If the length menu is given, but the init display length is not, use the length menu
            if ( oInit.aLengthMenu && ! oInit.iDisplayLength )
            {
                oInit.iDisplayLength = Array.isArray(oInit.aLengthMenu[0])
                    ? oInit.aLengthMenu[0][0]
                    : $.isPlainObject( oInit.aLengthMenu[0] )
                        ? oInit.aLengthMenu[0].value
                        : oInit.aLengthMenu[0];
            }

            // Apply the defaults and init options to make a single init object will all
            // options defined from defaults and instance options.
            oInit = _fnExtend( $.extend( true, {}, defaults ), oInit );


            // Map the initialisation options onto the settings object
            _fnMap( oSettings.oFeatures, oInit, [
                "bPaginate",
                "bLengthChange",
                "bFilter",
                "bSort",
                "bSortMulti",
                "bInfo",
                "bProcessing",
                "bAutoWidth",
                "bSortClasses",
                "bServerSide",
                "bDeferRender"
            ] );
            _fnMap( oSettings, oInit, [
                "ajax",
                "fnFormatNumber",
                "sServerMethod",
                "aaSorting",
                "aaSortingFixed",
                "aLengthMenu",
                "sPaginationType",
                "iStateDuration",
                "bSortCellsTop",
                "iTabIndex",
                "sDom",
                "fnStateLoadCallback",
                "fnStateSaveCallback",
                "renderer",
                "searchDelay",
                "rowId",
                "caption",
                "layout",
                "orderDescReverse",
                [ "iCookieDuration", "iStateDuration" ], // backwards compat
                [ "oSearch", "oPreviousSearch" ],
                [ "aoSearchCols", "aoPreSearchCols" ],
                [ "iDisplayLength", "_iDisplayLength" ]
            ] );
            _fnMap( oSettings.oScroll, oInit, [
                [ "sScrollX", "sX" ],
                [ "sScrollXInner", "sXInner" ],
                [ "sScrollY", "sY" ],
                [ "bScrollCollapse", "bCollapse" ]
            ] );
            _fnMap( oSettings.oLanguage, oInit, "fnInfoCallback" );

            /* Callback functions which are array driven */
            _fnCallbackReg( oSettings, 'aoDrawCallback',       oInit.fnDrawCallback );
            _fnCallbackReg( oSettings, 'aoStateSaveParams',    oInit.fnStateSaveParams );
            _fnCallbackReg( oSettings, 'aoStateLoadParams',    oInit.fnStateLoadParams );
            _fnCallbackReg( oSettings, 'aoStateLoaded',        oInit.fnStateLoaded );
            _fnCallbackReg( oSettings, 'aoRowCallback',        oInit.fnRowCallback );
            _fnCallbackReg( oSettings, 'aoRowCreatedCallback', oInit.fnCreatedRow );
            _fnCallbackReg( oSettings, 'aoHeaderCallback',     oInit.fnHeaderCallback );
            _fnCallbackReg( oSettings, 'aoFooterCallback',     oInit.fnFooterCallback );
            _fnCallbackReg( oSettings, 'aoInitComplete',       oInit.fnInitComplete );
            _fnCallbackReg( oSettings, 'aoPreDrawCallback',    oInit.fnPreDrawCallback );

            oSettings.rowIdFn = _fnGetObjectDataFn( oInit.rowId );

            /* Browser support detection */
            _fnBrowserDetect( oSettings );

            var oClasses = oSettings.oClasses;

            $.extend( oClasses, DataTable.ext.classes, oInit.oClasses );
            $this.addClass( oClasses.table );

            if (! oSettings.oFeatures.bPaginate) {
                oInit.iDisplayStart = 0;
            }

            if ( oSettings.iInitDisplayStart === undefined )
            {
                /* Display start point, taking into account the save saving */
                oSettings.iInitDisplayStart = oInit.iDisplayStart;
                oSettings._iDisplayStart = oInit.iDisplayStart;
            }

            var defer = oInit.iDeferLoading;
            if ( defer !== null )
            {
                oSettings.deferLoading = true;

                var tmp = Array.isArray(defer);
                oSettings._iRecordsDisplay = tmp ? defer[0] : defer;
                oSettings._iRecordsTotal = tmp ? defer[1] : defer;
            }

            /*
			 * Columns
			 * See if we should load columns automatically or use defined ones
			 */
            var columnsInit = [];
            var thead = this.getElementsByTagName('thead');
            var initHeaderLayout = _fnDetectHeader( oSettings, thead[0] );

            // If we don't have a columns array, then generate one with nulls
            if ( oInit.aoColumns ) {
                columnsInit = oInit.aoColumns;
            }
            else if ( initHeaderLayout.length ) {
                for ( i=0, iLen=initHeaderLayout[0].length ; i<iLen ; i++ ) {
                    columnsInit.push( null );
                }
            }

            // Add the columns
            for ( i=0, iLen=columnsInit.length ; i<iLen ; i++ ) {
                _fnAddColumn( oSettings );
            }

            // Apply the column definitions
            _fnApplyColumnDefs( oSettings, oInit.aoColumnDefs, columnsInit, initHeaderLayout, function (iCol, oDef) {
                _fnColumnOptions( oSettings, iCol, oDef );
            } );

            /* HTML5 attribute detection - build an mData object automatically if the
			 * attributes are found
			 */
            var rowOne = $this.children('tbody').find('tr').eq(0);

            if ( rowOne.length ) {
                var a = function ( cell, name ) {
                    return cell.getAttribute( 'data-'+name ) !== null ? name : null;
                };

                $( rowOne[0] ).children('th, td').each( function (i, cell) {
                    var col = oSettings.aoColumns[i];

                    if (! col) {
                        _fnLog( oSettings, 0, 'Incorrect column count', 18 );
                    }

                    if ( col.mData === i ) {
                        var sort = a( cell, 'sort' ) || a( cell, 'order' );
                        var filter = a( cell, 'filter' ) || a( cell, 'search' );

                        if ( sort !== null || filter !== null ) {
                            col.mData = {
                                _:      i+'.display',
                                sort:   sort !== null   ? i+'.@data-'+sort   : undefined,
                                type:   sort !== null   ? i+'.@data-'+sort   : undefined,
                                filter: filter !== null ? i+'.@data-'+filter : undefined
                            };
                            col._isArrayHost = true;

                            _fnColumnOptions( oSettings, i );
                        }
                    }
                } );
            }

            // Must be done after everything which can be overridden by the state saving!
            _fnCallbackReg( oSettings, 'aoDrawCallback', _fnSaveState );

            var features = oSettings.oFeatures;
            if ( oInit.bStateSave )
            {
                features.bStateSave = true;
            }

            // If aaSorting is not defined, then we use the first indicator in asSorting
            // in case that has been altered, so the default sort reflects that option
            if ( oInit.aaSorting === undefined ) {
                var sorting = oSettings.aaSorting;
                for ( i=0, iLen=sorting.length ; i<iLen ; i++ ) {
                    sorting[i][1] = oSettings.aoColumns[ i ].asSorting[0];
                }
            }

            // Do a first pass on the sorting classes (allows any size changes to be taken into
            // account, and also will apply sorting disabled classes if disabled
            _fnSortingClasses( oSettings );

            _fnCallbackReg( oSettings, 'aoDrawCallback', function () {
                if ( oSettings.bSorted || _fnDataSource( oSettings ) === 'ssp' || features.bDeferRender ) {
                    _fnSortingClasses( oSettings );
                }
            } );


            /*
			 * Table HTML init
			 * Cache the header, body and footer as required, creating them if needed
			 */
            var caption = $this.children('caption');

            if ( oSettings.caption ) {
                if ( caption.length === 0 ) {
                    caption = $('<caption/>').appendTo( $this );
                }

                caption.html( oSettings.caption );
            }

            // Store the caption side, so we can remove the element from the document
            // when creating the element
            if (caption.length) {
                caption[0]._captionSide = caption.css('caption-side');
                oSettings.captionNode = caption[0];
            }

            if ( thead.length === 0 ) {
                thead = $('<thead/>').appendTo($this);
            }
            oSettings.nTHead = thead[0];
            $('tr', thead).addClass(oClasses.thead.row);

            var tbody = $this.children('tbody');
            if ( tbody.length === 0 ) {
                tbody = $('<tbody/>').insertAfter(thead);
            }
            oSettings.nTBody = tbody[0];

            var tfoot = $this.children('tfoot');
            if ( tfoot.length === 0 ) {
                // If we are a scrolling table, and no footer has been given, then we need to create
                // a tfoot element for the caption element to be appended to
                tfoot = $('<tfoot/>').appendTo($this);
            }
            oSettings.nTFoot = tfoot[0];
            $('tr', tfoot).addClass(oClasses.tfoot.row);

            // Copy the data index array
            oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();

            // Initialisation complete - table can be drawn
            oSettings.bInitialised = true;

            // Language definitions
            var oLanguage = oSettings.oLanguage;
            $.extend( true, oLanguage, oInit.oLanguage );

            if ( oLanguage.sUrl ) {
                // Get the language definitions from a file
                $.ajax( {
                    dataType: 'json',
                    url: oLanguage.sUrl,
                    success: function ( json ) {
                        _fnCamelToHungarian( defaults.oLanguage, json );
                        $.extend( true, oLanguage, json, oSettings.oInit.oLanguage );

                        _fnCallbackFire( oSettings, null, 'i18n', [oSettings], true);
                        _fnInitialise( oSettings );
                    },
                    error: function () {
                        // Error occurred loading language file
                        _fnLog( oSettings, 0, 'i18n file loading error', 21 );

                        // Continue on as best we can
                        _fnInitialise( oSettings );
                    }
                } );
            }
            else {
                _fnCallbackFire( oSettings, null, 'i18n', [oSettings]);
                _fnInitialise( oSettings );
            }
        } );
        _that = null;
        return this;
    };



    /**
     * DataTables extensions
     *
     * This namespace acts as a collection area for plug-ins that can be used to
     * extend DataTables capabilities. Indeed many of the build in methods
     * use this method to provide their own capabilities (sorting methods for
     * example).
     *
     * Note that this namespace is aliased to `jQuery.fn.dataTableExt` for legacy
     * reasons
     *
     *  @namespace
     */
    DataTable.ext = _ext = {
        /**
         * Buttons. For use with the Buttons extension for DataTables. This is
         * defined here so other extensions can define buttons regardless of load
         * order. It is _not_ used by DataTables core.
         *
         *  @type object
         *  @default {}
         */
        buttons: {},


        /**
         * Element class names
         *
         *  @type object
         *  @default {}
         */
        classes: {},


        /**
         * DataTables build type (expanded by the download builder)
         *
         *  @type string
         */
        builder: "-source-",


        /**
         * Error reporting.
         *
         * How should DataTables report an error. Can take the value 'alert',
         * 'throw', 'none' or a function.
         *
         *  @type string|function
         *  @default alert
         */
        errMode: "alert",


        /**
         * Legacy so v1 plug-ins don't throw js errors on load
         */
        feature: [],

        /**
         * Feature plug-ins.
         *
         * This is an object of callbacks which provide the features for DataTables
         * to be initialised via the `layout` option.
         */
        features: {},


        /**
         * Row searching.
         *
         * This method of searching is complimentary to the default type based
         * searching, and a lot more comprehensive as it allows you complete control
         * over the searching logic. Each element in this array is a function
         * (parameters described below) that is called for every row in the table,
         * and your logic decides if it should be included in the searching data set
         * or not.
         *
         * Searching functions have the following input parameters:
         *
         * 1. `{object}` DataTables settings object: see
         *    {@link DataTable.models.oSettings}
         * 2. `{array|object}` Data for the row to be processed (same as the
         *    original format that was passed in as the data source, or an array
         *    from a DOM data source
         * 3. `{int}` Row index ({@link DataTable.models.oSettings.aoData}), which
         *    can be useful to retrieve the `TR` element if you need DOM interaction.
         *
         * And the following return is expected:
         *
         * * {boolean} Include the row in the searched result set (true) or not
         *   (false)
         *
         * Note that as with the main search ability in DataTables, technically this
         * is "filtering", since it is subtractive. However, for consistency in
         * naming we call it searching here.
         *
         *  @type array
         *  @default []
         *
         *  @example
         *    // The following example shows custom search being applied to the
         *    // fourth column (i.e. the data[3] index) based on two input values
         *    // from the end-user, matching the data in a certain range.
         *    $.fn.dataTable.ext.search.push(
         *      function( settings, data, dataIndex ) {
         *        var min = document.getElementById('min').value * 1;
         *        var max = document.getElementById('max').value * 1;
         *        var version = data[3] == "-" ? 0 : data[3]*1;
         *
         *        if ( min == "" && max == "" ) {
         *          return true;
         *        }
         *        else if ( min == "" && version < max ) {
         *          return true;
         *        }
         *        else if ( min < version && "" == max ) {
         *          return true;
         *        }
         *        else if ( min < version && version < max ) {
         *          return true;
         *        }
         *        return false;
         *      }
         *    );
         */
        search: [],


        /**
         * Selector extensions
         *
         * The `selector` option can be used to extend the options available for the
         * selector modifier options (`selector-modifier` object data type) that
         * each of the three built in selector types offer (row, column and cell +
         * their plural counterparts). For example the Select extension uses this
         * mechanism to provide an option to select only rows, columns and cells
         * that have been marked as selected by the end user (`{selected: true}`),
         * which can be used in conjunction with the existing built in selector
         * options.
         *
         * Each property is an array to which functions can be pushed. The functions
         * take three attributes:
         *
         * * Settings object for the host table
         * * Options object (`selector-modifier` object type)
         * * Array of selected item indexes
         *
         * The return is an array of the resulting item indexes after the custom
         * selector has been applied.
         *
         *  @type object
         */
        selector: {
            cell: [],
            column: [],
            row: []
        },


        /**
         * Legacy configuration options. Enable and disable legacy options that
         * are available in DataTables.
         *
         *  @type object
         */
        legacy: {
            /**
             * Enable / disable DataTables 1.9 compatible server-side processing
             * requests
             *
             *  @type boolean
             *  @default null
             */
            ajax: null
        },


        /**
         * Pagination plug-in methods.
         *
         * Each entry in this object is a function and defines which buttons should
         * be shown by the pagination rendering method that is used for the table:
         * {@link DataTable.ext.renderer.pageButton}. The renderer addresses how the
         * buttons are displayed in the document, while the functions here tell it
         * what buttons to display. This is done by returning an array of button
         * descriptions (what each button will do).
         *
         * Pagination types (the four built in options and any additional plug-in
         * options defined here) can be used through the `paginationType`
         * initialisation parameter.
         *
         * The functions defined take two parameters:
         *
         * 1. `{int} page` The current page index
         * 2. `{int} pages` The number of pages in the table
         *
         * Each function is expected to return an array where each element of the
         * array can be one of:
         *
         * * `first` - Jump to first page when activated
         * * `last` - Jump to last page when activated
         * * `previous` - Show previous page when activated
         * * `next` - Show next page when activated
         * * `{int}` - Show page of the index given
         * * `{array}` - A nested array containing the above elements to add a
         *   containing 'DIV' element (might be useful for styling).
         *
         * Note that DataTables v1.9- used this object slightly differently whereby
         * an object with two functions would be defined for each plug-in. That
         * ability is still supported by DataTables 1.10+ to provide backwards
         * compatibility, but this option of use is now decremented and no longer
         * documented in DataTables 1.10+.
         *
         *  @type object
         *  @default {}
         *
         *  @example
         *    // Show previous, next and current page buttons only
         *    $.fn.dataTableExt.oPagination.current = function ( page, pages ) {
         *      return [ 'previous', page, 'next' ];
         *    };
         */
        pager: {},


        renderer: {
            pageButton: {},
            header: {}
        },


        /**
         * Ordering plug-ins - custom data source
         *
         * The extension options for ordering of data available here is complimentary
         * to the default type based ordering that DataTables typically uses. It
         * allows much greater control over the the data that is being used to
         * order a column, but is necessarily therefore more complex.
         *
         * This type of ordering is useful if you want to do ordering based on data
         * live from the DOM (for example the contents of an 'input' element) rather
         * than just the static string that DataTables knows of.
         *
         * The way these plug-ins work is that you create an array of the values you
         * wish to be ordering for the column in question and then return that
         * array. The data in the array much be in the index order of the rows in
         * the table (not the currently ordering order!). Which order data gathering
         * function is run here depends on the `dt-init columns.orderDataType`
         * parameter that is used for the column (if any).
         *
         * The functions defined take two parameters:
         *
         * 1. `{object}` DataTables settings object: see
         *    {@link DataTable.models.oSettings}
         * 2. `{int}` Target column index
         *
         * Each function is expected to return an array:
         *
         * * `{array}` Data for the column to be ordering upon
         *
         *  @type array
         *
         *  @example
         *    // Ordering using `input` node values
         *    $.fn.dataTable.ext.order['dom-text'] = function  ( settings, col )
         *    {
         *      return this.api().column( col, {order:'index'} ).nodes().map( function ( td, i ) {
         *        return $('input', td).val();
         *      } );
         *    }
         */
        order: {},


        /**
         * Type based plug-ins.
         *
         * Each column in DataTables has a type assigned to it, either by automatic
         * detection or by direct assignment using the `type` option for the column.
         * The type of a column will effect how it is ordering and search (plug-ins
         * can also make use of the column type if required).
         *
         * @namespace
         */
        type: {
            /**
             * Automatic column class assignment
             */
            className: {},

            /**
             * Type detection functions.
             *
             * The functions defined in this object are used to automatically detect
             * a column's type, making initialisation of DataTables super easy, even
             * when complex data is in the table.
             *
             * The functions defined take two parameters:
             *
             *  1. `{*}` Data from the column cell to be analysed
             *  2. `{settings}` DataTables settings object. This can be used to
             *     perform context specific type detection - for example detection
             *     based on language settings such as using a comma for a decimal
             *     place. Generally speaking the options from the settings will not
             *     be required
             *
             * Each function is expected to return:
             *
             * * `{string|null}` Data type detected, or null if unknown (and thus
             *   pass it on to the other type detection functions.
             *
             *  @type array
             *
             *  @example
             *    // Currency type detection plug-in:
             *    $.fn.dataTable.ext.type.detect.push(
             *      function ( data, settings ) {
             *        // Check the numeric part
             *        if ( ! data.substring(1).match(/[0-9]/) ) {
             *          return null;
             *        }
             *
             *        // Check prefixed by currency
             *        if ( data.charAt(0) == '$' || data.charAt(0) == '&pound;' ) {
             *          return 'currency';
             *        }
             *        return null;
             *      }
             *    );
             */
            detect: [],

            /**
             * Automatic renderer assignment
             */
            render: {},


            /**
             * Type based search formatting.
             *
             * The type based searching functions can be used to pre-format the
             * data to be search on. For example, it can be used to strip HTML
             * tags or to de-format telephone numbers for numeric only searching.
             *
             * Note that is a search is not defined for a column of a given type,
             * no search formatting will be performed.
             *
             * Pre-processing of searching data plug-ins - When you assign the sType
             * for a column (or have it automatically detected for you by DataTables
             * or a type detection plug-in), you will typically be using this for
             * custom sorting, but it can also be used to provide custom searching
             * by allowing you to pre-processing the data and returning the data in
             * the format that should be searched upon. This is done by adding
             * functions this object with a parameter name which matches the sType
             * for that target column. This is the corollary of <i>afnSortData</i>
             * for searching data.
             *
             * The functions defined take a single parameter:
             *
             *  1. `{*}` Data from the column cell to be prepared for searching
             *
             * Each function is expected to return:
             *
             * * `{string|null}` Formatted string that will be used for the searching.
             *
             *  @type object
             *  @default {}
             *
             *  @example
             *    $.fn.dataTable.ext.type.search['title-numeric'] = function ( d ) {
             *      return d.replace(/\n/g," ").replace( /<.*?>/g, "" );
             *    }
             */
            search: {},


            /**
             * Type based ordering.
             *
             * The column type tells DataTables what ordering to apply to the table
             * when a column is sorted upon. The order for each type that is defined,
             * is defined by the functions available in this object.
             *
             * Each ordering option can be described by three properties added to
             * this object:
             *
             * * `{type}-pre` - Pre-formatting function
             * * `{type}-asc` - Ascending order function
             * * `{type}-desc` - Descending order function
             *
             * All three can be used together, only `{type}-pre` or only
             * `{type}-asc` and `{type}-desc` together. It is generally recommended
             * that only `{type}-pre` is used, as this provides the optimal
             * implementation in terms of speed, although the others are provided
             * for compatibility with existing Javascript sort functions.
             *
             * `{type}-pre`: Functions defined take a single parameter:
             *
             *  1. `{*}` Data from the column cell to be prepared for ordering
             *
             * And return:
             *
             * * `{*}` Data to be sorted upon
             *
             * `{type}-asc` and `{type}-desc`: Functions are typical Javascript sort
             * functions, taking two parameters:
             *
             *  1. `{*}` Data to compare to the second parameter
             *  2. `{*}` Data to compare to the first parameter
             *
             * And returning:
             *
             * * `{*}` Ordering match: <0 if first parameter should be sorted lower
             *   than the second parameter, ===0 if the two parameters are equal and
             *   >0 if the first parameter should be sorted height than the second
             *   parameter.
             *
             *  @type object
             *  @default {}
             *
             *  @example
             *    // Numeric ordering of formatted numbers with a pre-formatter
             *    $.extend( $.fn.dataTable.ext.type.order, {
             *      "string-pre": function(x) {
             *        a = (a === "-" || a === "") ? 0 : a.replace( /[^\d\-\.]/g, "" );
             *        return parseFloat( a );
             *      }
             *    } );
             *
             *  @example
             *    // Case-sensitive string ordering, with no pre-formatting method
             *    $.extend( $.fn.dataTable.ext.order, {
             *      "string-case-asc": function(x,y) {
             *        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
             *      },
             *      "string-case-desc": function(x,y) {
             *        return ((x < y) ? 1 : ((x > y) ? -1 : 0));
             *      }
             *    } );
             */
            order: {}
        },

        /**
         * Unique DataTables instance counter
         *
         * @type int
         * @private
         */
        _unique: 0,


        //
        // Depreciated
        // The following properties are retained for backwards compatibility only.
        // The should not be used in new projects and will be removed in a future
        // version
        //

        /**
         * Version check function.
         *  @type function
         *  @depreciated Since 1.10
         */
        fnVersionCheck: DataTable.fnVersionCheck,


        /**
         * Index for what 'this' index API functions should use
         *  @type int
         *  @deprecated Since v1.10
         */
        iApiIndex: 0,


        /**
         * Software version
         *  @type string
         *  @deprecated Since v1.10
         */
        sVersion: DataTable.version
    };


    //
    // Backwards compatibility. Alias to pre 1.10 Hungarian notation counter parts
    //
    $.extend( _ext, {
        afnFiltering: _ext.search,
        aTypes:       _ext.type.detect,
        ofnSearch:    _ext.type.search,
        oSort:        _ext.type.order,
        afnSortData:  _ext.order,
        aoFeatures:   _ext.feature,
        oStdClasses:  _ext.classes,
        oPagination:  _ext.pager
    } );


    $.extend( DataTable.ext.classes, {
        container: 'dt-container',
        empty: {
            row: 'dt-empty'
        },
        info: {
            container: 'dt-info'
        },
        layout: {
            row: 'dt-layout-row',
            cell: 'dt-layout-cell',
            tableRow: 'dt-layout-table',
            tableCell: '',
            start: 'dt-layout-start',
            end: 'dt-layout-end',
            full: 'dt-layout-full'
        },
        length: {
            container: 'dt-length',
            select: 'dt-input'
        },
        order: {
            canAsc: 'dt-orderable-asc',
            canDesc: 'dt-orderable-desc',
            isAsc: 'dt-ordering-asc',
            isDesc: 'dt-ordering-desc',
            none: 'dt-orderable-none',
            position: 'sorting_'
        },
        processing: {
            container: 'dt-processing'
        },
        scrolling: {
            body: 'dt-scroll-body',
            container: 'dt-scroll',
            footer: {
                self: 'dt-scroll-foot',
                inner: 'dt-scroll-footInner'
            },
            header: {
                self: 'dt-scroll-head',
                inner: 'dt-scroll-headInner'
            }
        },
        search: {
            container: 'dt-search',
            input: 'dt-input'
        },
        table: 'dataTable',
        tbody: {
            cell: '',
            row: ''
        },
        thead: {
            cell: '',
            row: ''
        },
        tfoot: {
            cell: '',
            row: ''
        },
        paging: {
            active: 'current',
            button: 'dt-paging-button',
            container: 'dt-paging',
            disabled: 'disabled'
        }
    } );


    /*
	 * It is useful to have variables which are scoped locally so only the
	 * DataTables functions can access them and they don't leak into global space.
	 * At the same time these functions are often useful over multiple files in the
	 * core and API, so we list, or at least document, all variables which are used
	 * by DataTables as private variables here. This also ensures that there is no
	 * clashing of variable names and that they can easily referenced for reuse.
	 */


    // Defined else where
    //  _selector_run
    //  _selector_opts
    //  _selector_row_indexes

    var _ext; // DataTable.ext
    var _Api; // DataTable.Api
    var _api_register; // DataTable.Api.register
    var _api_registerPlural; // DataTable.Api.registerPlural

    var _re_dic = {};
    var _re_new_lines = /[\r\n\u2028]/g;
    var _re_html = /<([^>]*>)/g;
    var _max_str_len = Math.pow(2, 28);

    // This is not strict ISO8601 - Date.parse() is quite lax, although
    // implementations differ between browsers.
    var _re_date = /^\d{2,4}[./-]\d{1,2}[./-]\d{1,2}([T ]{1}\d{1,2}[:.]\d{2}([.:]\d{2})?)?$/;

    // Escape regular expression special characters
    var _re_escape_regex = new RegExp( '(\\' + [ '/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\', '$', '^', '-' ].join('|\\') + ')', 'g' );

    // https://en.wikipedia.org/wiki/Foreign_exchange_market
    // - \u20BD - Russian ruble.
    // - \u20a9 - South Korean Won
    // - \u20BA - Turkish Lira
    // - \u20B9 - Indian Rupee
    // - R - Brazil (R$) and South Africa
    // - fr - Swiss Franc
    // - kr - Swedish krona, Norwegian krone and Danish krone
    // - \u2009 is thin space and \u202F is narrow no-break space, both used in many
    // - Ƀ - Bitcoin
    // - Ξ - Ethereum
    //   standards as thousands separators.
    var _re_formatted_numeric = /['\u00A0,$£€¥%\u2009\u202F\u20BD\u20a9\u20BArfkɃΞ]/gi;


    var _empty = function ( d ) {
        return !d || d === true || d === '-' ? true : false;
    };


    var _intVal = function ( s ) {
        var integer = parseInt( s, 10 );
        return !isNaN(integer) && isFinite(s) ? integer : null;
    };

    // Convert from a formatted number with characters other than `.` as the
    // decimal place, to a Javascript number
    var _numToDecimal = function ( num, decimalPoint ) {
        // Cache created regular expressions for speed as this function is called often
        if ( ! _re_dic[ decimalPoint ] ) {
            _re_dic[ decimalPoint ] = new RegExp( _fnEscapeRegex( decimalPoint ), 'g' );
        }
        return typeof num === 'string' && decimalPoint !== '.' ?
            num.replace( /\./g, '' ).replace( _re_dic[ decimalPoint ], '.' ) :
            num;
    };


    var _isNumber = function ( d, decimalPoint, formatted, allowEmpty ) {
        var type = typeof d;
        var strType = type === 'string';

        if ( type === 'number' || type === 'bigint') {
            return true;
        }

        // If empty return immediately so there must be a number if it is a
        // formatted string (this stops the string "k", or "kr", etc being detected
        // as a formatted number for currency
        if ( allowEmpty && _empty( d ) ) {
            return true;
        }

        if ( decimalPoint && strType ) {
            d = _numToDecimal( d, decimalPoint );
        }

        if ( formatted && strType ) {
            d = d.replace( _re_formatted_numeric, '' );
        }

        return !isNaN( parseFloat(d) ) && isFinite( d );
    };


    // A string without HTML in it can be considered to be HTML still
    var _isHtml = function ( d ) {
        return _empty( d ) || typeof d === 'string';
    };

    // Is a string a number surrounded by HTML?
    var _htmlNumeric = function ( d, decimalPoint, formatted, allowEmpty ) {
        if ( allowEmpty && _empty( d ) ) {
            return true;
        }

        // input and select strings mean that this isn't just a number
        if (typeof d === 'string' && d.match(/<(input|select)/i)) {
            return null;
        }

        var html = _isHtml( d );
        return ! html ?
            null :
            _isNumber( _stripHtml( d ), decimalPoint, formatted, allowEmpty ) ?
                true :
                null;
    };


    var _pluck = function ( a, prop, prop2 ) {
        var out = [];
        var i=0, ien=a.length;

        // Could have the test in the loop for slightly smaller code, but speed
        // is essential here
        if ( prop2 !== undefined ) {
            for ( ; i<ien ; i++ ) {
                if ( a[i] && a[i][ prop ] ) {
                    out.push( a[i][ prop ][ prop2 ] );
                }
            }
        }
        else {
            for ( ; i<ien ; i++ ) {
                if ( a[i] ) {
                    out.push( a[i][ prop ] );
                }
            }
        }

        return out;
    };


    // Basically the same as _pluck, but rather than looping over `a` we use `order`
    // as the indexes to pick from `a`
    var _pluck_order = function ( a, order, prop, prop2 )
    {
        var out = [];
        var i=0, ien=order.length;

        // Could have the test in the loop for slightly smaller code, but speed
        // is essential here
        if ( prop2 !== undefined ) {
            for ( ; i<ien ; i++ ) {
                if ( a[ order[i] ][ prop ] ) {
                    out.push( a[ order[i] ][ prop ][ prop2 ] );
                }
            }
        }
        else {
            for ( ; i<ien ; i++ ) {
                if ( a[ order[i] ] ) {
                    out.push( a[ order[i] ][ prop ] );
                }
            }
        }

        return out;
    };


    var _range = function ( len, start )
    {
        var out = [];
        var end;

        if ( start === undefined ) {
            start = 0;
            end = len;
        }
        else {
            end = start;
            start = len;
        }

        for ( var i=start ; i<end ; i++ ) {
            out.push( i );
        }

        return out;
    };


    var _removeEmpty = function ( a )
    {
        var out = [];

        for ( var i=0, ien=a.length ; i<ien ; i++ ) {
            if ( a[i] ) { // careful - will remove all falsy values!
                out.push( a[i] );
            }
        }

        return out;
    };

    // Replaceable function in api.util
    var _stripHtml = function (input) {
        if (! input) {
            return input;
        }

        // Irrelevant check to workaround CodeQL's false positive on the regex
        if (input.length > _max_str_len) {
            throw new Error('Exceeded max str len');
        }

        var previous;

        input = input.replace(_re_html, ''); // Complete tags

        // Safety for incomplete script tag - use do / while to ensure that
        // we get all instances
        do {
            previous = input;
            input = input.replace(/<script/i, '');
        } while (input !== previous);

        return previous;
    };

    // Replaceable function in api.util
    var _escapeHtml = function ( d ) {
        if (Array.isArray(d)) {
            d = d.join(',');
        }

        return typeof d === 'string' ?
            d
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;') :
            d;
    };

    // Remove diacritics from a string by decomposing it and then removing
    // non-ascii characters
    var _normalize = function (str, both) {
        if (typeof str !== 'string') {
            return str;
        }

        // It is faster to just run `normalize` than it is to check if
        // we need to with a regex!
        var res = str.normalize("NFD");

        // Equally, here we check if a regex is needed or not
        return res.length !== str.length
            ? (both === true ? str + ' ' : '' ) + res.replace(/[\u0300-\u036f]/g, "")
            : res;
    }

    /**
     * Determine if all values in the array are unique. This means we can short
     * cut the _unique method at the cost of a single loop. A sorted array is used
     * to easily check the values.
     *
     * @param  {array} src Source array
     * @return {boolean} true if all unique, false otherwise
     * @ignore
     */
    var _areAllUnique = function ( src ) {
        if ( src.length < 2 ) {
            return true;
        }

        var sorted = src.slice().sort();
        var last = sorted[0];

        for ( var i=1, ien=sorted.length ; i<ien ; i++ ) {
            if ( sorted[i] === last ) {
                return false;
            }

            last = sorted[i];
        }

        return true;
    };


    /**
     * Find the unique elements in a source array.
     *
     * @param  {array} src Source array
     * @return {array} Array of unique items
     * @ignore
     */
    var _unique = function ( src )
    {
        if (Array.from && Set) {
            return Array.from(new Set(src));
        }

        if ( _areAllUnique( src ) ) {
            return src.slice();
        }

        // A faster unique method is to use object keys to identify used values,
        // but this doesn't work with arrays or objects, which we must also
        // consider. See jsperf.app/compare-array-unique-versions/4 for more
        // information.
        var
            out = [],
            val,
            i, ien=src.length,
            j, k=0;

        again: for ( i=0 ; i<ien ; i++ ) {
            val = src[i];

            for ( j=0 ; j<k ; j++ ) {
                if ( out[j] === val ) {
                    continue again;
                }
            }

            out.push( val );
            k++;
        }

        return out;
    };

    // Surprisingly this is faster than [].concat.apply
    // https://jsperf.com/flatten-an-array-loop-vs-reduce/2
    var _flatten = function (out, val) {
        if (Array.isArray(val)) {
            for (var i=0 ; i<val.length ; i++) {
                _flatten(out, val[i]);
            }
        }
        else {
            out.push(val);
        }

        return out;
    }

    // Similar to jQuery's addClass, but use classList.add
    function _addClass(el, name) {
        if (name) {
            name.split(' ').forEach(function (n) {
                if (n) {
                    // `add` does deduplication, so no need to check `contains`
                    el.classList.add(n);
                }
            });
        }
    }

    /**
     * DataTables utility methods
     *
     * This namespace provides helper methods that DataTables uses internally to
     * create a DataTable, but which are not exclusively used only for DataTables.
     * These methods can be used by extension authors to save the duplication of
     * code.
     *
     *  @namespace
     */
    DataTable.util = {
        /**
         * Return a string with diacritic characters decomposed
         * @param {*} mixed Function or string to normalize
         * @param {*} both Return original string and the normalized string
         * @returns String or undefined
         */
        diacritics: function (mixed, both) {
            var type = typeof mixed;

            if (type !== 'function') {
                return _normalize(mixed, both);
            }
            _normalize = mixed;
        },

        /**
         * Debounce a function
         *
         * @param {function} fn Function to be called
         * @param {integer} freq Call frequency in mS
         * @return {function} Wrapped function
         */
        debounce: function ( fn, timeout ) {
            var timer;

            return function () {
                var that = this;
                var args = arguments;

                clearTimeout(timer);

                timer = setTimeout( function () {
                    fn.apply(that, args);
                }, timeout || 250 );
            };
        },

        /**
         * Throttle the calls to a function. Arguments and context are maintained
         * for the throttled function.
         *
         * @param {function} fn Function to be called
         * @param {integer} freq Call frequency in mS
         * @return {function} Wrapped function
         */
        throttle: function ( fn, freq ) {
            var
                frequency = freq !== undefined ? freq : 200,
                last,
                timer;

            return function () {
                var
                    that = this,
                    now  = +new Date(),
                    args = arguments;

                if ( last && now < last + frequency ) {
                    clearTimeout( timer );

                    timer = setTimeout( function () {
                        last = undefined;
                        fn.apply( that, args );
                    }, frequency );
                }
                else {
                    last = now;
                    fn.apply( that, args );
                }
            };
        },

        /**
         * Escape a string such that it can be used in a regular expression
         *
         *  @param {string} val string to escape
         *  @returns {string} escaped string
         */
        escapeRegex: function ( val ) {
            return val.replace( _re_escape_regex, '\\$1' );
        },

        /**
         * Create a function that will write to a nested object or array
         * @param {*} source JSON notation string
         * @returns Write function
         */
        set: function ( source ) {
            if ( $.isPlainObject( source ) ) {
                /* Unlike get, only the underscore (global) option is used for for
				 * setting data since we don't know the type here. This is why an object
				 * option is not documented for `mData` (which is read/write), but it is
				 * for `mRender` which is read only.
				 */
                return DataTable.util.set( source._ );
            }
            else if ( source === null ) {
                // Nothing to do when the data source is null
                return function () {};
            }
            else if ( typeof source === 'function' ) {
                return function (data, val, meta) {
                    source( data, 'set', val, meta );
                };
            }
            else if (
                typeof source === 'string' && (source.indexOf('.') !== -1 ||
                    source.indexOf('[') !== -1 || source.indexOf('(') !== -1)
            ) {
                // Like the get, we need to get data from a nested object
                var setData = function (data, val, src) {
                    var a = _fnSplitObjNotation( src ), b;
                    var aLast = a[a.length-1];
                    var arrayNotation, funcNotation, o, innerSrc;

                    for ( var i=0, iLen=a.length-1 ; i<iLen ; i++ ) {
                        // Protect against prototype pollution
                        if (a[i] === '__proto__' || a[i] === 'constructor') {
                            throw new Error('Cannot set prototype values');
                        }

                        // Check if we are dealing with an array notation request
                        arrayNotation = a[i].match(__reArray);
                        funcNotation = a[i].match(__reFn);

                        if ( arrayNotation ) {
                            a[i] = a[i].replace(__reArray, '');
                            data[ a[i] ] = [];

                            // Get the remainder of the nested object to set so we can recurse
                            b = a.slice();
                            b.splice( 0, i+1 );
                            innerSrc = b.join('.');

                            // Traverse each entry in the array setting the properties requested
                            if ( Array.isArray( val ) ) {
                                for ( var j=0, jLen=val.length ; j<jLen ; j++ ) {
                                    o = {};
                                    setData( o, val[j], innerSrc );
                                    data[ a[i] ].push( o );
                                }
                            }
                            else {
                                // We've been asked to save data to an array, but it
                                // isn't array data to be saved. Best that can be done
                                // is to just save the value.
                                data[ a[i] ] = val;
                            }

                            // The inner call to setData has already traversed through the remainder
                            // of the source and has set the data, thus we can exit here
                            return;
                        }
                        else if ( funcNotation ) {
                            // Function call
                            a[i] = a[i].replace(__reFn, '');
                            data = data[ a[i] ]( val );
                        }

                        // If the nested object doesn't currently exist - since we are
                        // trying to set the value - create it
                        if ( data[ a[i] ] === null || data[ a[i] ] === undefined ) {
                            data[ a[i] ] = {};
                        }
                        data = data[ a[i] ];
                    }

                    // Last item in the input - i.e, the actual set
                    if ( aLast.match(__reFn ) ) {
                        // Function call
                        data = data[ aLast.replace(__reFn, '') ]( val );
                    }
                    else {
                        // If array notation is used, we just want to strip it and use the property name
                        // and assign the value. If it isn't used, then we get the result we want anyway
                        data[ aLast.replace(__reArray, '') ] = val;
                    }
                };

                return function (data, val) { // meta is also passed in, but not used
                    return setData( data, val, source );
                };
            }
            else {
                // Array or flat object mapping
                return function (data, val) { // meta is also passed in, but not used
                    data[source] = val;
                };
            }
        },

        /**
         * Create a function that will read nested objects from arrays, based on JSON notation
         * @param {*} source JSON notation string
         * @returns Value read
         */
        get: function ( source ) {
            if ( $.isPlainObject( source ) ) {
                // Build an object of get functions, and wrap them in a single call
                var o = {};
                $.each( source, function (key, val) {
                    if ( val ) {
                        o[key] = DataTable.util.get( val );
                    }
                } );

                return function (data, type, row, meta) {
                    var t = o[type] || o._;
                    return t !== undefined ?
                        t(data, type, row, meta) :
                        data;
                };
            }
            else if ( source === null ) {
                // Give an empty string for rendering / sorting etc
                return function (data) { // type, row and meta also passed, but not used
                    return data;
                };
            }
            else if ( typeof source === 'function' ) {
                return function (data, type, row, meta) {
                    return source( data, type, row, meta );
                };
            }
            else if (
                typeof source === 'string' && (source.indexOf('.') !== -1 ||
                    source.indexOf('[') !== -1 || source.indexOf('(') !== -1)
            ) {
                /* If there is a . in the source string then the data source is in a
				 * nested object so we loop over the data for each level to get the next
				 * level down. On each loop we test for undefined, and if found immediately
				 * return. This allows entire objects to be missing and sDefaultContent to
				 * be used if defined, rather than throwing an error
				 */
                var fetchData = function (data, type, src) {
                    var arrayNotation, funcNotation, out, innerSrc;

                    if ( src !== "" ) {
                        var a = _fnSplitObjNotation( src );

                        for ( var i=0, iLen=a.length ; i<iLen ; i++ ) {
                            // Check if we are dealing with special notation
                            arrayNotation = a[i].match(__reArray);
                            funcNotation = a[i].match(__reFn);

                            if ( arrayNotation ) {
                                // Array notation
                                a[i] = a[i].replace(__reArray, '');

                                // Condition allows simply [] to be passed in
                                if ( a[i] !== "" ) {
                                    data = data[ a[i] ];
                                }
                                out = [];

                                // Get the remainder of the nested object to get
                                a.splice( 0, i+1 );
                                innerSrc = a.join('.');

                                // Traverse each entry in the array getting the properties requested
                                if ( Array.isArray( data ) ) {
                                    for ( var j=0, jLen=data.length ; j<jLen ; j++ ) {
                                        out.push( fetchData( data[j], type, innerSrc ) );
                                    }
                                }

                                // If a string is given in between the array notation indicators, that
                                // is used to join the strings together, otherwise an array is returned
                                var join = arrayNotation[0].substring(1, arrayNotation[0].length-1);
                                data = (join==="") ? out : out.join(join);

                                // The inner call to fetchData has already traversed through the remainder
                                // of the source requested, so we exit from the loop
                                break;
                            }
                            else if ( funcNotation ) {
                                // Function call
                                a[i] = a[i].replace(__reFn, '');
                                data = data[ a[i] ]();
                                continue;
                            }

                            if (data === null || data[ a[i] ] === null) {
                                return null;
                            }
                            else if ( data === undefined || data[ a[i] ] === undefined ) {
                                return undefined;
                            }

                            data = data[ a[i] ];
                        }
                    }

                    return data;
                };

                return function (data, type) { // row and meta also passed, but not used
                    return fetchData( data, type, source );
                };
            }
            else {
                // Array or flat object mapping
                return function (data) { // row and meta also passed, but not used
                    return data[source];
                };
            }
        },

        stripHtml: function (mixed) {
            var type = typeof mixed;

            if (type === 'function') {
                _stripHtml = mixed;
                return;
            }
            else if (type === 'string') {
                return _stripHtml(mixed);
            }
            return mixed;
        },

        escapeHtml: function (mixed) {
            var type = typeof mixed;

            if (type === 'function') {
                _escapeHtml = mixed;
                return;
            }
            else if (type === 'string' || Array.isArray(mixed)) {
                return _escapeHtml(mixed);
            }
            return mixed;
        },

        unique: _unique
    };



    /**
     * Create a mapping object that allows camel case parameters to be looked up
     * for their Hungarian counterparts. The mapping is stored in a private
     * parameter called `_hungarianMap` which can be accessed on the source object.
     *  @param {object} o
     *  @memberof DataTable#oApi
     */
    function _fnHungarianMap ( o )
    {
        var
            hungarian = 'a aa ai ao as b fn i m o s ',
            match,
            newKey,
            map = {};

        $.each( o, function (key) {
            match = key.match(/^([^A-Z]+?)([A-Z])/);

            if ( match && hungarian.indexOf(match[1]+' ') !== -1 )
            {
                newKey = key.replace( match[0], match[2].toLowerCase() );
                map[ newKey ] = key;

                if ( match[1] === 'o' )
                {
                    _fnHungarianMap( o[key] );
                }
            }
        } );

        o._hungarianMap = map;
    }


    /**
     * Convert from camel case parameters to Hungarian, based on a Hungarian map
     * created by _fnHungarianMap.
     *  @param {object} src The model object which holds all parameters that can be
     *    mapped.
     *  @param {object} user The object to convert from camel case to Hungarian.
     *  @param {boolean} force When set to `true`, properties which already have a
     *    Hungarian value in the `user` object will be overwritten. Otherwise they
     *    won't be.
     *  @memberof DataTable#oApi
     */
    function _fnCamelToHungarian ( src, user, force )
    {
        if ( ! src._hungarianMap ) {
            _fnHungarianMap( src );
        }

        var hungarianKey;

        $.each( user, function (key) {
            hungarianKey = src._hungarianMap[ key ];

            if ( hungarianKey !== undefined && (force || user[hungarianKey] === undefined) )
            {
                // For objects, we need to buzz down into the object to copy parameters
                if ( hungarianKey.charAt(0) === 'o' )
                {
                    // Copy the camelCase options over to the hungarian
                    if ( ! user[ hungarianKey ] ) {
                        user[ hungarianKey ] = {};
                    }
                    $.extend( true, user[hungarianKey], user[key] );

                    _fnCamelToHungarian( src[hungarianKey], user[hungarianKey], force );
                }
                else {
                    user[hungarianKey] = user[ key ];
                }
            }
        } );
    }

    /**
     * Map one parameter onto another
     *  @param {object} o Object to map
     *  @param {*} knew The new parameter name
     *  @param {*} old The old parameter name
     */
    var _fnCompatMap = function ( o, knew, old ) {
        if ( o[ knew ] !== undefined ) {
            o[ old ] = o[ knew ];
        }
    };


    /**
     * Provide backwards compatibility for the main DT options. Note that the new
     * options are mapped onto the old parameters, so this is an external interface
     * change only.
     *  @param {object} init Object to map
     */
    function _fnCompatOpts ( init )
    {
        _fnCompatMap( init, 'ordering',      'bSort' );
        _fnCompatMap( init, 'orderMulti',    'bSortMulti' );
        _fnCompatMap( init, 'orderClasses',  'bSortClasses' );
        _fnCompatMap( init, 'orderCellsTop', 'bSortCellsTop' );
        _fnCompatMap( init, 'order',         'aaSorting' );
        _fnCompatMap( init, 'orderFixed',    'aaSortingFixed' );
        _fnCompatMap( init, 'paging',        'bPaginate' );
        _fnCompatMap( init, 'pagingType',    'sPaginationType' );
        _fnCompatMap( init, 'pageLength',    'iDisplayLength' );
        _fnCompatMap( init, 'searching',     'bFilter' );

        // Boolean initialisation of x-scrolling
        if ( typeof init.sScrollX === 'boolean' ) {
            init.sScrollX = init.sScrollX ? '100%' : '';
        }
        if ( typeof init.scrollX === 'boolean' ) {
            init.scrollX = init.scrollX ? '100%' : '';
        }

        // Column search objects are in an array, so it needs to be converted
        // element by element
        var searchCols = init.aoSearchCols;

        if ( searchCols ) {
            for ( var i=0, ien=searchCols.length ; i<ien ; i++ ) {
                if ( searchCols[i] ) {
                    _fnCamelToHungarian( DataTable.models.oSearch, searchCols[i] );
                }
            }
        }

        // Enable search delay if server-side processing is enabled
        if (init.serverSide && ! init.searchDelay) {
            init.searchDelay = 400;
        }
    }


    /**
     * Provide backwards compatibility for column options. Note that the new options
     * are mapped onto the old parameters, so this is an external interface change
     * only.
     *  @param {object} init Object to map
     */
    function _fnCompatCols ( init )
    {
        _fnCompatMap( init, 'orderable',     'bSortable' );
        _fnCompatMap( init, 'orderData',     'aDataSort' );
        _fnCompatMap( init, 'orderSequence', 'asSorting' );
        _fnCompatMap( init, 'orderDataType', 'sortDataType' );

        // orderData can be given as an integer
        var dataSort = init.aDataSort;
        if ( typeof dataSort === 'number' && ! Array.isArray( dataSort ) ) {
            init.aDataSort = [ dataSort ];
        }
    }


    /**
     * Browser feature detection for capabilities, quirks
     *  @param {object} settings dataTables settings object
     *  @memberof DataTable#oApi
     */
    function _fnBrowserDetect( settings )
    {
        // We don't need to do this every time DataTables is constructed, the values
        // calculated are specific to the browser and OS configuration which we
        // don't expect to change between initialisations
        if ( ! DataTable.__browser ) {
            var browser = {};
            DataTable.__browser = browser;

            // Scrolling feature / quirks detection
            var n = $('<div/>')
                .css( {
                    position: 'fixed',
                    top: 0,
                    left: -1 * window.pageXOffset, // allow for scrolling
                    height: 1,
                    width: 1,
                    overflow: 'hidden'
                } )
                .append(
                    $('<div/>')
                        .css( {
                            position: 'absolute',
                            top: 1,
                            left: 1,
                            width: 100,
                            overflow: 'scroll'
                        } )
                        .append(
                            $('<div/>')
                                .css( {
                                    width: '100%',
                                    height: 10
                                } )
                        )
                )
                .appendTo( 'body' );

            var outer = n.children();
            var inner = outer.children();

            // Get scrollbar width
            browser.barWidth = outer[0].offsetWidth - outer[0].clientWidth;

            // In rtl text layout, some browsers (most, but not all) will place the
            // scrollbar on the left, rather than the right.
            browser.bScrollbarLeft = Math.round( inner.offset().left ) !== 1;

            n.remove();
        }

        $.extend( settings.oBrowser, DataTable.__browser );
        settings.oScroll.iBarWidth = DataTable.__browser.barWidth;
    }

    /**
     * Add a column to the list used for the table with default values
     *  @param {object} oSettings dataTables settings object
     *  @memberof DataTable#oApi
     */
    function _fnAddColumn( oSettings )
    {
        // Add column to aoColumns array
        var oDefaults = DataTable.defaults.column;
        var iCol = oSettings.aoColumns.length;
        var oCol = $.extend( {}, DataTable.models.oColumn, oDefaults, {
            "aDataSort": oDefaults.aDataSort ? oDefaults.aDataSort : [iCol],
            "mData": oDefaults.mData ? oDefaults.mData : iCol,
            idx: iCol,
            searchFixed: {},
            colEl: $('<col>').attr('data-dt-column', iCol)
        } );
        oSettings.aoColumns.push( oCol );

        // Add search object for column specific search. Note that the `searchCols[ iCol ]`
        // passed into extend can be undefined. This allows the user to give a default
        // with only some of the parameters defined, and also not give a default
        var searchCols = oSettings.aoPreSearchCols;
        searchCols[ iCol ] = $.extend( {}, DataTable.models.oSearch, searchCols[ iCol ] );
    }


    /**
     * Apply options for a column
     *  @param {object} oSettings dataTables settings object
     *  @param {int} iCol column index to consider
     *  @param {object} oOptions object with sType, bVisible and bSearchable etc
     *  @memberof DataTable#oApi
     */
    function _fnColumnOptions( oSettings, iCol, oOptions )
    {
        var oCol = oSettings.aoColumns[ iCol ];

        /* User specified column options */
        if ( oOptions !== undefined && oOptions !== null )
        {
            // Backwards compatibility
            _fnCompatCols( oOptions );

            // Map camel case parameters to their Hungarian counterparts
            _fnCamelToHungarian( DataTable.defaults.column, oOptions, true );

            /* Backwards compatibility for mDataProp */
            if ( oOptions.mDataProp !== undefined && !oOptions.mData )
            {
                oOptions.mData = oOptions.mDataProp;
            }

            if ( oOptions.sType )
            {
                oCol._sManualType = oOptions.sType;
            }

            // `class` is a reserved word in Javascript, so we need to provide
            // the ability to use a valid name for the camel case input
            if ( oOptions.className && ! oOptions.sClass )
            {
                oOptions.sClass = oOptions.className;
            }

            var origClass = oCol.sClass;

            $.extend( oCol, oOptions );
            _fnMap( oCol, oOptions, "sWidth", "sWidthOrig" );

            // Merge class from previously defined classes with this one, rather than just
            // overwriting it in the extend above
            if (origClass !== oCol.sClass) {
                oCol.sClass = origClass + ' ' + oCol.sClass;
            }

            /* iDataSort to be applied (backwards compatibility), but aDataSort will take
			 * priority if defined
			 */
            if ( oOptions.iDataSort !== undefined )
            {
                oCol.aDataSort = [ oOptions.iDataSort ];
            }
            _fnMap( oCol, oOptions, "aDataSort" );
        }

        /* Cache the data get and set functions for speed */
        var mDataSrc = oCol.mData;
        var mData = _fnGetObjectDataFn( mDataSrc );

        // The `render` option can be given as an array to access the helper rendering methods.
        // The first element is the rendering method to use, the rest are the parameters to pass
        if ( oCol.mRender && Array.isArray( oCol.mRender ) ) {
            var copy = oCol.mRender.slice();
            var name = copy.shift();

            oCol.mRender = DataTable.render[name].apply(window, copy);
        }

        oCol._render = oCol.mRender ? _fnGetObjectDataFn( oCol.mRender ) : null;

        var attrTest = function( src ) {
            return typeof src === 'string' && src.indexOf('@') !== -1;
        };
        oCol._bAttrSrc = $.isPlainObject( mDataSrc ) && (
            attrTest(mDataSrc.sort) || attrTest(mDataSrc.type) || attrTest(mDataSrc.filter)
        );
        oCol._setter = null;

        oCol.fnGetData = function (rowData, type, meta) {
            var innerData = mData( rowData, type, undefined, meta );

            return oCol._render && type ?
                oCol._render( innerData, type, rowData, meta ) :
                innerData;
        };
        oCol.fnSetData = function ( rowData, val, meta ) {
            return _fnSetObjectDataFn( mDataSrc )( rowData, val, meta );
        };

        // Indicate if DataTables should read DOM data as an object or array
        // Used in _fnGetRowElements
        if ( typeof mDataSrc !== 'number' && ! oCol._isArrayHost ) {
            oSettings._rowReadObject = true;
        }

        /* Feature sorting overrides column specific when off */
        if ( !oSettings.oFeatures.bSort )
        {
            oCol.bSortable = false;
        }
    }


    /**
     * Adjust the table column widths for new data. Note: you would probably want to
     * do a redraw after calling this function!
     *  @param {object} settings dataTables settings object
     *  @memberof DataTable#oApi
     */
    function _fnAdjustColumnSizing ( settings )
    {
        _fnCalculateColumnWidths( settings );
        _fnColumnSizes( settings );

        var scroll = settings.oScroll;
        if ( scroll.sY !== '' || scroll.sX !== '') {
            _fnScrollDraw( settings );
        }

        _fnCallbackFire( settings, null, 'column-sizing', [settings] );
    }

    /**
     * Apply column sizes
     *
     * @param {*} settings DataTables settings object
     */
    function _fnColumnSizes ( settings )
    {
        var cols = settings.aoColumns;

        for (var i=0 ; i<cols.length ; i++) {
            var width = _fnColumnsSumWidth(settings, [i], false, false);

            cols[i].colEl.css('width', width);
        }
    }


    /**
     * Convert the index of a visible column to the index in the data array (take account
     * of hidden columns)
     *  @param {object} oSettings dataTables settings object
     *  @param {int} iMatch Visible column index to lookup
     *  @returns {int} i the data index
     *  @memberof DataTable#oApi
     */
    function _fnVisibleToColumnIndex( oSettings, iMatch )
    {
        var aiVis = _fnGetColumns( oSettings, 'bVisible' );

        return typeof aiVis[iMatch] === 'number' ?
            aiVis[iMatch] :
            null;
    }


    /**
     * Convert the index of an index in the data array and convert it to the visible
     *   column index (take account of hidden columns)
     *  @param {int} iMatch Column index to lookup
     *  @param {object} oSettings dataTables settings object
     *  @returns {int} i the data index
     *  @memberof DataTable#oApi
     */
    function _fnColumnIndexToVisible( oSettings, iMatch )
    {
        var aiVis = _fnGetColumns( oSettings, 'bVisible' );
        var iPos = aiVis.indexOf(iMatch);

        return iPos !== -1 ? iPos : null;
    }


    /**
     * Get the number of visible columns
     *  @param {object} oSettings dataTables settings object
     *  @returns {int} i the number of visible columns
     *  @memberof DataTable#oApi
     */
    function _fnVisbleColumns( settings )
    {
        var layout = settings.aoHeader;
        var columns = settings.aoColumns;
        var vis = 0;

        if ( layout.length ) {
            for ( var i=0, ien=layout[0].length ; i<ien ; i++ ) {
                if ( columns[i].bVisible && $(layout[0][i].cell).css('display') !== 'none' ) {
                    vis++;
                }
            }
        }

        return vis;
    }


    /**
     * Get an array of column indexes that match a given property
     *  @param {object} oSettings dataTables settings object
     *  @param {string} sParam Parameter in aoColumns to look for - typically
     *    bVisible or bSearchable
     *  @returns {array} Array of indexes with matched properties
     *  @memberof DataTable#oApi
     */
    function _fnGetColumns( oSettings, sParam )
    {
        var a = [];

        oSettings.aoColumns.map( function(val, i) {
            if ( val[sParam] ) {
                a.push( i );
            }
        } );

        return a;
    }

    /**
     * Allow the result from a type detection function to be `true` while
     * translating that into a string. Old type detection functions will
     * return the type name if it passes. An obect store would be better,
     * but not backwards compatible.
     *
     * @param {*} typeDetect Object or function for type detection
     * @param {*} res Result from the type detection function
     * @returns Type name or false
     */
    function _typeResult (typeDetect, res) {
        return res === true
            ? typeDetect.name
            : res;
    }

    /**
     * Calculate the 'type' of a column
     *  @param {object} settings dataTables settings object
     *  @memberof DataTable#oApi
     */
    function _fnColumnTypes ( settings )
    {
        var columns = settings.aoColumns;
        var data = settings.aoData;
        var types = DataTable.ext.type.detect;
        var i, ien, j, jen, k, ken;
        var col, detectedType, cache;

        // If SSP then we don't have the full data set, so any type detection would be
        // unreliable and error prone
        if (_fnDataSource( settings ) === 'ssp') {
            return;
        }

        // For each column, spin over the data type detection functions, seeing if one matches
        for ( i=0, ien=columns.length ; i<ien ; i++ ) {
            col = columns[i];
            cache = [];

            if ( ! col.sType && col._sManualType ) {
                col.sType = col._sManualType;
            }
            else if ( ! col.sType ) {
                for ( j=0, jen=types.length ; j<jen ; j++ ) {
                    var typeDetect = types[j];

                    // There can be either one, or three type detection functions
                    var oneOf = typeDetect.oneOf;
                    var allOf = typeDetect.allOf || typeDetect;
                    var init = typeDetect.init;
                    var one = false;

                    detectedType = null;

                    // Fast detect based on column assignment
                    if (init) {
                        detectedType = _typeResult(typeDetect, init(settings, col, i));

                        if (detectedType) {
                            col.sType = detectedType;
                            break;
                        }
                    }

                    for ( k=0, ken=data.length ; k<ken ; k++ ) {
                        if (! data[k]) {
                            continue;
                        }

                        // Use a cache array so we only need to get the type data
                        // from the formatter once (when using multiple detectors)
                        if ( cache[k] === undefined ) {
                            cache[k] = _fnGetCellData( settings, k, i, 'type' );
                        }

                        // Only one data point in the column needs to match this function
                        if (oneOf && ! one) {
                            one = _typeResult(typeDetect, oneOf( cache[k], settings ));
                        }

                        // All data points need to match this function
                        detectedType = _typeResult(typeDetect, allOf( cache[k], settings ));

                        // If null, then this type can't apply to this column, so
                        // rather than testing all cells, break out. There is an
                        // exception for the last type which is `html`. We need to
                        // scan all rows since it is possible to mix string and HTML
                        // types
                        if ( ! detectedType && j !== types.length-3 ) {
                            break;
                        }

                        // Only a single match is needed for html type since it is
                        // bottom of the pile and very similar to string - but it
                        // must not be empty
                        if ( detectedType === 'html' && ! _empty(cache[k]) ) {
                            break;
                        }
                    }

                    // Type is valid for all data points in the column - use this
                    // type
                    if ( (oneOf && one && detectedType) || (!oneOf && detectedType) ) {
                        col.sType = detectedType;
                        break;
                    }
                }

                // Fall back - if no type was detected, always use string
                if ( ! col.sType ) {
                    col.sType = 'string';
                }
            }

            // Set class names for header / footer for auto type classes
            var autoClass = _ext.type.className[col.sType];

            if (autoClass) {
                _columnAutoClass(settings.aoHeader, i, autoClass);
                _columnAutoClass(settings.aoFooter, i, autoClass);
            }

            var renderer = _ext.type.render[col.sType];

            // This can only happen once! There is no way to remove
            // a renderer. After the first time the renderer has
            // already been set so createTr will run the renderer itself.
            if (renderer && ! col._render) {
                col._render = DataTable.util.get(renderer);

                _columnAutoRender(settings, i);
            }
        }
    }

    /**
     * Apply an auto detected renderer to data which doesn't yet have
     * a renderer
     */
    function _columnAutoRender(settings, colIdx) {
        var data = settings.aoData;

        for (var i=0 ; i<data.length ; i++) {
            if (data[i].nTr) {
                // We have to update the display here since there is no
                // invalidation check for the data
                var display = _fnGetCellData( settings, i, colIdx, 'display' );

                data[i].displayData[colIdx] = display;
                _fnWriteCell(data[i].anCells[colIdx], display);

                // No need to update sort / filter data since it has
                // been invalidated and will be re-read with the
                // renderer now applied
            }
        }
    }

    /**
     * Apply a class name to a column's header cells
     */
    function _columnAutoClass(container, colIdx, className) {
        container.forEach(function (row) {
            if (row[colIdx] && row[colIdx].unique) {
                _addClass(row[colIdx].cell, className);
            }
        });
    }

    /**
     * Take the column definitions and static columns arrays and calculate how
     * they relate to column indexes. The callback function will then apply the
     * definition found for a column to a suitable configuration object.
     *  @param {object} oSettings dataTables settings object
     *  @param {array} aoColDefs The aoColumnDefs array that is to be applied
     *  @param {array} aoCols The aoColumns array that defines columns individually
     *  @param {array} headerLayout Layout for header as it was loaded
     *  @param {function} fn Callback function - takes two parameters, the calculated
     *    column index and the definition for that column.
     *  @memberof DataTable#oApi
     */
    function _fnApplyColumnDefs( oSettings, aoColDefs, aoCols, headerLayout, fn )
    {
        var i, iLen, j, jLen, k, kLen, def;
        var columns = oSettings.aoColumns;

        if ( aoCols ) {
            for ( i=0, iLen=aoCols.length ; i<iLen ; i++ ) {
                if (aoCols[i] && aoCols[i].name) {
                    columns[i].sName = aoCols[i].name;
                }
            }
        }

        // Column definitions with aTargets
        if ( aoColDefs )
        {
            /* Loop over the definitions array - loop in reverse so first instance has priority */
            for ( i=aoColDefs.length-1 ; i>=0 ; i-- )
            {
                def = aoColDefs[i];

                /* Each definition can target multiple columns, as it is an array */
                var aTargets = def.target !== undefined
                    ? def.target
                    : def.targets !== undefined
                        ? def.targets
                        : def.aTargets;

                if ( ! Array.isArray( aTargets ) )
                {
                    aTargets = [ aTargets ];
                }

                for ( j=0, jLen=aTargets.length ; j<jLen ; j++ )
                {
                    var target = aTargets[j];

                    if ( typeof target === 'number' && target >= 0 )
                    {
                        /* Add columns that we don't yet know about */
                        while( columns.length <= target )
                        {
                            _fnAddColumn( oSettings );
                        }

                        /* Integer, basic index */
                        fn( target, def );
                    }
                    else if ( typeof target === 'number' && target < 0 )
                    {
                        /* Negative integer, right to left column counting */
                        fn( columns.length+target, def );
                    }
                    else if ( typeof target === 'string' )
                    {
                        for ( k=0, kLen=columns.length ; k<kLen ; k++ ) {
                            if (target === '_all') {
                                // Apply to all columns
                                fn( k, def );
                            }
                            else if (target.indexOf(':name') !== -1) {
                                // Column selector
                                if (columns[k].sName === target.replace(':name', '')) {
                                    fn( k, def );
                                }
                            }
                            else {
                                // Cell selector
                                headerLayout.forEach(function (row) {
                                    if (row[k]) {
                                        var cell = $(row[k].cell);

                                        // Legacy support. Note that it means that we don't support
                                        // an element name selector only, since they are treated as
                                        // class names for 1.x compat.
                                        if (target.match(/^[a-z][\w-]*$/i)) {
                                            target = '.' + target;
                                        }

                                        if (cell.is( target )) {
                                            fn( k, def );
                                        }
                                    }
                                });
                            }
                        }
                    }
                }
            }
        }

        // Statically defined columns array
        if ( aoCols ) {
            for ( i=0, iLen=aoCols.length ; i<iLen ; i++ ) {
                fn( i, aoCols[i] );
            }
        }
    }


    /**
     * Get the width for a given set of columns
     *
     * @param {*} settings DataTables settings object
     * @param {*} targets Columns - comma separated string or array of numbers
     * @param {*} original Use the original width (true) or calculated (false)
     * @param {*} incVisible Include visible columns (true) or not (false)
     * @returns Combined CSS value
     */
    function _fnColumnsSumWidth( settings, targets, original, incVisible ) {
        if ( ! Array.isArray( targets ) ) {
            targets = _fnColumnsFromHeader( targets );
        }

        var sum = 0;
        var unit;
        var columns = settings.aoColumns;

        for ( var i=0, ien=targets.length ; i<ien ; i++ ) {
            var column = columns[ targets[i] ];
            var definedWidth = original ?
                column.sWidthOrig :
                column.sWidth;

            if ( ! incVisible && column.bVisible === false ) {
                continue;
            }

            if ( definedWidth === null || definedWidth === undefined ) {
                return null; // can't determine a defined width - browser defined
            }
            else if ( typeof definedWidth === 'number' ) {
                unit = 'px';
                sum += definedWidth;
            }
            else {
                var matched = definedWidth.match(/([\d\.]+)([^\d]*)/);

                if ( matched ) {
                    sum += matched[1] * 1;
                    unit = matched.length === 3 ?
                        matched[2] :
                        'px';
                }
            }
        }

        return sum + unit;
    }

    function _fnColumnsFromHeader( cell )
    {
        var attr = $(cell).closest('[data-dt-column]').attr('data-dt-column');

        if ( ! attr ) {
            return [];
        }

        return attr.split(',').map( function (val) {
            return val * 1;
        } );
    }
    /**
     * Add a data array to the table, creating DOM node etc. This is the parallel to
     * _fnGatherData, but for adding rows from a Javascript source, rather than a
     * DOM source.
     *  @param {object} settings dataTables settings object
     *  @param {array} data data array to be added
     *  @param {node} [tr] TR element to add to the table - optional. If not given,
     *    DataTables will create a row automatically
     *  @param {array} [tds] Array of TD|TH elements for the row - must be given
     *    if nTr is.
     *  @returns {int} >=0 if successful (index of new aoData entry), -1 if failed
     *  @memberof DataTable#oApi
     */
    function _fnAddData ( settings, dataIn, tr, tds )
    {
        /* Create the object for storing information about this new row */
        var rowIdx = settings.aoData.length;
        var rowModel = $.extend( true, {}, DataTable.models.oRow, {
            src: tr ? 'dom' : 'data',
            idx: rowIdx
        } );

        rowModel._aData = dataIn;
        settings.aoData.push( rowModel );

        var columns = settings.aoColumns;

        for ( var i=0, iLen=columns.length ; i<iLen ; i++ )
        {
            // Invalidate the column types as the new data needs to be revalidated
            columns[i].sType = null;
        }

        /* Add to the display array */
        settings.aiDisplayMaster.push( rowIdx );

        var id = settings.rowIdFn( dataIn );
        if ( id !== undefined ) {
            settings.aIds[ id ] = rowModel;
        }

        /* Create the DOM information, or register it if already present */
        if ( tr || ! settings.oFeatures.bDeferRender )
        {
            _fnCreateTr( settings, rowIdx, tr, tds );
        }

        return rowIdx;
    }


    /**
     * Add one or more TR elements to the table. Generally we'd expect to
     * use this for reading data from a DOM sourced table, but it could be
     * used for an TR element. Note that if a TR is given, it is used (i.e.
     * it is not cloned).
     *  @param {object} settings dataTables settings object
     *  @param {array|node|jQuery} trs The TR element(s) to add to the table
     *  @returns {array} Array of indexes for the added rows
     *  @memberof DataTable#oApi
     */
    function _fnAddTr( settings, trs )
    {
        var row;

        // Allow an individual node to be passed in
        if ( ! (trs instanceof $) ) {
            trs = $(trs);
        }

        return trs.map( function (i, el) {
            row = _fnGetRowElements( settings, el );
            return _fnAddData( settings, row.data, el, row.cells );
        } );
    }


    /**
     * Get the data for a given cell from the internal cache, taking into account data mapping
     *  @param {object} settings dataTables settings object
     *  @param {int} rowIdx aoData row id
     *  @param {int} colIdx Column index
     *  @param {string} type data get type ('display', 'type' 'filter|search' 'sort|order')
     *  @returns {*} Cell data
     *  @memberof DataTable#oApi
     */
    function _fnGetCellData( settings, rowIdx, colIdx, type )
    {
        if (type === 'search') {
            type = 'filter';
        }
        else if (type === 'order') {
            type = 'sort';
        }

        var row = settings.aoData[rowIdx];

        if (! row) {
            return undefined;
        }

        var draw           = settings.iDraw;
        var col            = settings.aoColumns[colIdx];
        var rowData        = row._aData;
        var defaultContent = col.sDefaultContent;
        var cellData       = col.fnGetData( rowData, type, {
            settings: settings,
            row:      rowIdx,
            col:      colIdx
        } );

        // Allow for a node being returned for non-display types
        if (type !== 'display' && cellData && typeof cellData === 'object' && cellData.nodeName) {
            cellData = cellData.innerHTML;
        }

        if ( cellData === undefined ) {
            if ( settings.iDrawError != draw && defaultContent === null ) {
                _fnLog( settings, 0, "Requested unknown parameter "+
                    (typeof col.mData=='function' ? '{function}' : "'"+col.mData+"'")+
                    " for row "+rowIdx+", column "+colIdx, 4 );
                settings.iDrawError = draw;
            }
            return defaultContent;
        }

        // When the data source is null and a specific data type is requested (i.e.
        // not the original data), we can use default column data
        if ( (cellData === rowData || cellData === null) && defaultContent !== null && type !== undefined ) {
            cellData = defaultContent;
        }
        else if ( typeof cellData === 'function' ) {
            // If the data source is a function, then we run it and use the return,
            // executing in the scope of the data object (for instances)
            return cellData.call( rowData );
        }

        if ( cellData === null && type === 'display' ) {
            return '';
        }

        if ( type === 'filter' ) {
            var fomatters = DataTable.ext.type.search;

            if ( fomatters[ col.sType ] ) {
                cellData = fomatters[ col.sType ]( cellData );
            }
        }

        return cellData;
    }


    /**
     * Set the value for a specific cell, into the internal data cache
     *  @param {object} settings dataTables settings object
     *  @param {int} rowIdx aoData row id
     *  @param {int} colIdx Column index
     *  @param {*} val Value to set
     *  @memberof DataTable#oApi
     */
    function _fnSetCellData( settings, rowIdx, colIdx, val )
    {
        var col     = settings.aoColumns[colIdx];
        var rowData = settings.aoData[rowIdx]._aData;

        col.fnSetData( rowData, val, {
            settings: settings,
            row:      rowIdx,
            col:      colIdx
        }  );
    }

    /**
     * Write a value to a cell
     * @param {*} td Cell
     * @param {*} val Value
     */
    function _fnWriteCell(td, val)
    {
        if (val && typeof val === 'object' && val.nodeName) {
            $(td)
                .empty()
                .append(val);
        }
        else {
            td.innerHTML = val;
        }
    }


    // Private variable that is used to match action syntax in the data property object
    var __reArray = /\[.*?\]$/;
    var __reFn = /\(\)$/;

    /**
     * Split string on periods, taking into account escaped periods
     * @param  {string} str String to split
     * @return {array} Split string
     */
    function _fnSplitObjNotation( str )
    {
        var parts = str.match(/(\\.|[^.])+/g) || [''];

        return parts.map( function ( s ) {
            return s.replace(/\\\./g, '.');
        } );
    }


    /**
     * Return a function that can be used to get data from a source object, taking
     * into account the ability to use nested objects as a source
     *  @param {string|int|function} mSource The data source for the object
     *  @returns {function} Data get function
     *  @memberof DataTable#oApi
     */
    var _fnGetObjectDataFn = DataTable.util.get;


    /**
     * Return a function that can be used to set data from a source object, taking
     * into account the ability to use nested objects as a source
     *  @param {string|int|function} mSource The data source for the object
     *  @returns {function} Data set function
     *  @memberof DataTable#oApi
     */
    var _fnSetObjectDataFn = DataTable.util.set;


    /**
     * Return an array with the full table data
     *  @param {object} oSettings dataTables settings object
     *  @returns array {array} aData Master data array
     *  @memberof DataTable#oApi
     */
    function _fnGetDataMaster ( settings )
    {
        return _pluck( settings.aoData, '_aData' );
    }


    /**
     * Nuke the table
     *  @param {object} oSettings dataTables settings object
     *  @memberof DataTable#oApi
     */
    function _fnClearTable( settings )
    {
        settings.aoData.length = 0;
        settings.aiDisplayMaster.length = 0;
        settings.aiDisplay.length = 0;
        settings.aIds = {};
    }


    /**
     * Mark cached data as invalid such that a re-read of the data will occur when
     * the cached data is next requested. Also update from the data source object.
     *
     * @param {object} settings DataTables settings object
     * @param {int}    rowIdx   Row index to invalidate
     * @param {string} [src]    Source to invalidate from: undefined, 'auto', 'dom'
     *     or 'data'
     * @param {int}    [colIdx] Column index to invalidate. If undefined the whole
     *     row will be invalidated
     * @memberof DataTable#oApi
     *
     * @todo For the modularisation of v1.11 this will need to become a callback, so
     *   the sort and filter methods can subscribe to it. That will required
     *   initialisation options for sorting, which is why it is not already baked in
     */
    function _fnInvalidate( settings, rowIdx, src, colIdx )
    {
        var row = settings.aoData[ rowIdx ];
        var i, ien;

        // Remove the cached data for the row
        row._aSortData = null;
        row._aFilterData = null;
        row.displayData = null;

        // Are we reading last data from DOM or the data object?
        if ( src === 'dom' || ((! src || src === 'auto') && row.src === 'dom') ) {
            // Read the data from the DOM
            row._aData = _fnGetRowElements(
                settings, row, colIdx, colIdx === undefined ? undefined : row._aData
            )
                .data;
        }
        else {
            // Reading from data object, update the DOM
            var cells = row.anCells;
            var display = _fnGetRowDisplay(settings, rowIdx);

            if ( cells ) {
                if ( colIdx !== undefined ) {
                    _fnWriteCell(cells[colIdx], display[colIdx]);
                }
                else {
                    for ( i=0, ien=cells.length ; i<ien ; i++ ) {
                        _fnWriteCell(cells[i], display[i]);
                    }
                }
            }
        }

        // Column specific invalidation
        var cols = settings.aoColumns;
        if ( colIdx !== undefined ) {
            // Type - the data might have changed
            cols[ colIdx ].sType = null;

            // Max length string. Its a fairly cheep recalculation, so not worth
            // something more complicated
            cols[ colIdx ].maxLenString = null;
        }
        else {
            for ( i=0, ien=cols.length ; i<ien ; i++ ) {
                cols[i].sType = null;
                cols[i].maxLenString = null;
            }

            // Update DataTables special `DT_*` attributes for the row
            _fnRowAttributes( settings, row );
        }
    }


    /**
     * Build a data source object from an HTML row, reading the contents of the
     * cells that are in the row.
     *
     * @param {object} settings DataTables settings object
     * @param {node|object} TR element from which to read data or existing row
     *   object from which to re-read the data from the cells
     * @param {int} [colIdx] Optional column index
     * @param {array|object} [d] Data source object. If `colIdx` is given then this
     *   parameter should also be given and will be used to write the data into.
     *   Only the column in question will be written
     * @returns {object} Object with two parameters: `data` the data read, in
     *   document order, and `cells` and array of nodes (they can be useful to the
     *   caller, so rather than needing a second traversal to get them, just return
     *   them from here).
     * @memberof DataTable#oApi
     */
    function _fnGetRowElements( settings, row, colIdx, d )
    {
        var
            tds = [],
            td = row.firstChild,
            name, col, i=0, contents,
            columns = settings.aoColumns,
            objectRead = settings._rowReadObject;

        // Allow the data object to be passed in, or construct
        d = d !== undefined ?
            d :
            objectRead ?
                {} :
                [];

        var attr = function ( str, td  ) {
            if ( typeof str === 'string' ) {
                var idx = str.indexOf('@');

                if ( idx !== -1 ) {
                    var attr = str.substring( idx+1 );
                    var setter = _fnSetObjectDataFn( str );
                    setter( d, td.getAttribute( attr ) );
                }
            }
        };

        // Read data from a cell and store into the data object
        var cellProcess = function ( cell ) {
            if ( colIdx === undefined || colIdx === i ) {
                col = columns[i];
                contents = (cell.innerHTML).trim();

                if ( col && col._bAttrSrc ) {
                    var setter = _fnSetObjectDataFn( col.mData._ );
                    setter( d, contents );

                    attr( col.mData.sort, cell );
                    attr( col.mData.type, cell );
                    attr( col.mData.filter, cell );
                }
                else {
                    // Depending on the `data` option for the columns the data can
                    // be read to either an object or an array.
                    if ( objectRead ) {
                        if ( ! col._setter ) {
                            // Cache the setter function
                            col._setter = _fnSetObjectDataFn( col.mData );
                        }
                        col._setter( d, contents );
                    }
                    else {
                        d[i] = contents;
                    }
                }
            }

            i++;
        };

        if ( td ) {
            // `tr` element was passed in
            while ( td ) {
                name = td.nodeName.toUpperCase();

                if ( name == "TD" || name == "TH" ) {
                    cellProcess( td );
                    tds.push( td );
                }

                td = td.nextSibling;
            }
        }
        else {
            // Existing row object passed in
            tds = row.anCells;

            for ( var j=0, jen=tds.length ; j<jen ; j++ ) {
                cellProcess( tds[j] );
            }
        }

        // Read the ID from the DOM if present
        var rowNode = row.firstChild ? row : row.nTr;

        if ( rowNode ) {
            var id = rowNode.getAttribute( 'id' );

            if ( id ) {
                _fnSetObjectDataFn( settings.rowId )( d, id );
            }
        }

        return {
            data: d,
            cells: tds
        };
    }

    /**
     * Render and cache a row's display data for the columns, if required
     * @returns
     */
    function _fnGetRowDisplay (settings, rowIdx) {
        let rowModal = settings.aoData[rowIdx];
        let columns = settings.aoColumns;

        if (! rowModal.displayData) {
            // Need to render and cache
            rowModal.displayData = [];

            for ( var colIdx=0, len=columns.length ; colIdx<len ; colIdx++ ) {
                rowModal.displayData.push(
                    _fnGetCellData( settings, rowIdx, colIdx, 'display' )
                );
            }
        }

        return rowModal.displayData;
    }

    /**
     * Create a new TR element (and it's TD children) for a row
     *  @param {object} oSettings dataTables settings object
     *  @param {int} iRow Row to consider
     *  @param {node} [nTrIn] TR element to add to the table - optional. If not given,
     *    DataTables will create a row automatically
     *  @param {array} [anTds] Array of TD|TH elements for the row - must be given
     *    if nTr is.
     *  @memberof DataTable#oApi
     */
    function _fnCreateTr ( oSettings, iRow, nTrIn, anTds )
    {
        var
            row = oSettings.aoData[iRow],
            rowData = row._aData,
            cells = [],
            nTr, nTd, oCol,
            i, iLen, create,
            trClass = oSettings.oClasses.tbody.row;

        if ( row.nTr === null )
        {
            nTr = nTrIn || document.createElement('tr');

            row.nTr = nTr;
            row.anCells = cells;

            _addClass(nTr, trClass);

            /* Use a private property on the node to allow reserve mapping from the node
			 * to the aoData array for fast look up
			 */
            nTr._DT_RowIndex = iRow;

            /* Special parameters can be given by the data source to be used on the row */
            _fnRowAttributes( oSettings, row );

            /* Process each column */
            for ( i=0, iLen=oSettings.aoColumns.length ; i<iLen ; i++ )
            {
                oCol = oSettings.aoColumns[i];
                create = nTrIn && anTds[i] ? false : true;

                nTd = create ? document.createElement( oCol.sCellType ) : anTds[i];

                if (! nTd) {
                    _fnLog( oSettings, 0, 'Incorrect column count', 18 );
                }

                nTd._DT_CellIndex = {
                    row: iRow,
                    column: i
                };

                cells.push( nTd );

                var display = _fnGetRowDisplay(oSettings, iRow);

                // Need to create the HTML if new, or if a rendering function is defined
                if (
                    create ||
                    (
                        (oCol.mRender || oCol.mData !== i) &&
                        (!$.isPlainObject(oCol.mData) || oCol.mData._ !== i+'.display')
                    )
                ) {
                    _fnWriteCell(nTd, display[i]);
                }

                // Visibility - add or remove as required
                if ( oCol.bVisible && create )
                {
                    nTr.appendChild( nTd );
                }
                else if ( ! oCol.bVisible && ! create )
                {
                    nTd.parentNode.removeChild( nTd );
                }

                if ( oCol.fnCreatedCell )
                {
                    oCol.fnCreatedCell.call( oSettings.oInstance,
                        nTd, _fnGetCellData( oSettings, iRow, i ), rowData, iRow, i
                    );
                }
            }

            _fnCallbackFire( oSettings, 'aoRowCreatedCallback', 'row-created', [nTr, rowData, iRow, cells] );
        }
        else {
            _addClass(row.nTr, trClass);
        }
    }


    /**
     * Add attributes to a row based on the special `DT_*` parameters in a data
     * source object.
     *  @param {object} settings DataTables settings object
     *  @param {object} DataTables row object for the row to be modified
     *  @memberof DataTable#oApi
     */
    function _fnRowAttributes( settings, row )
    {
        var tr = row.nTr;
        var data = row._aData;

        if ( tr ) {
            var id = settings.rowIdFn( data );

            if ( id ) {
                tr.id = id;
            }

            if ( data.DT_RowClass ) {
                // Remove any classes added by DT_RowClass before
                var a = data.DT_RowClass.split(' ');
                row.__rowc = row.__rowc ?
                    _unique( row.__rowc.concat( a ) ) :
                    a;

                $(tr)
                    .removeClass( row.__rowc.join(' ') )
                    .addClass( data.DT_RowClass );
            }

            if ( data.DT_RowAttr ) {
                $(tr).attr( data.DT_RowAttr );
            }

            if ( data.DT_RowData ) {
                $(tr).data( data.DT_RowData );
            }
        }
    }


    /**
     * Create the HTML header for the table
     *  @param {object} oSettings dataTables settings object
     *  @memberof DataTable#oApi
     */
    function _fnBuildHead( settings, side )
    {
        var classes = settings.oClasses;
        var columns = settings.aoColumns;
        var i, ien, row;
        var target = side === 'header'
            ? settings.nTHead
            : settings.nTFoot;
        var titleProp = side === 'header' ? 'sTitle' : side;

        // Footer might be defined
        if (! target) {
            return;
        }

        // If no cells yet and we have content for them, then create
        if (side === 'header' || _pluck(settings.aoColumns, titleProp).join('')) {
            row = $('tr', target);

            // Add a row if needed
            if (! row.length) {
                row = $('<tr/>').appendTo(target)
            }

            // Add the number of cells needed to make up to the number of columns
            if (row.length === 1) {
                var cells = $('td, th', row);

                for ( i=cells.length, ien=columns.length ; i<ien ; i++ ) {
                    $('<th/>')
                        .html( columns[i][titleProp] || '' )
                        .appendTo( row );
                }
            }
        }

        var detected = _fnDetectHeader( settings, target, true );

        if (side === 'header') {
            settings.aoHeader = detected;
        }
        else {
            settings.aoFooter = detected;
        }

        // ARIA role for the rows
        $(target).children('tr').attr('role', 'row');

        // Every cell needs to be passed through the renderer
        $(target).children('tr').children('th, td')
            .each( function () {
                _fnRenderer( settings, side )(
                    settings, $(this), classes
                );
            } );
    }

    /**
     * Build a layout structure for a header or footer
     *
     * @param {*} settings DataTables settings
     * @param {*} source Source layout array
     * @param {*} incColumns What columns should be included
     * @returns Layout array
     */
    function _fnHeaderLayout( settings, source, incColumns )
    {
        var row, column, cell;
        var local = [];
        var structure = [];
        var columns = settings.aoColumns;
        var columnCount = columns.length;
        var rowspan, colspan;

        if ( ! source ) {
            return;
        }

        // Default is to work on only visible columns
        if ( ! incColumns ) {
            incColumns = _range(columnCount)
                .filter(function (idx) {
                    return columns[idx].bVisible;
                });
        }

        // Make a copy of the master layout array, but with only the columns we want
        for ( row=0 ; row<source.length ; row++ ) {
            // Remove any columns we haven't selected
            local[row] = source[row].slice().filter(function (cell, i) {
                return incColumns.includes(i);
            });

            // Prep the structure array - it needs an element for each row
            structure.push( [] );
        }

        for ( row=0 ; row<local.length ; row++ ) {
            for ( column=0 ; column<local[row].length ; column++ ) {
                rowspan = 1;
                colspan = 1;

                // Check to see if there is already a cell (row/colspan) covering our target
                // insert point. If there is, then there is nothing to do.
                if ( structure[row][column] === undefined ) {
                    cell = local[row][column].cell;

                    // Expand for rowspan
                    while (
                        local[row+rowspan] !== undefined &&
                        local[row][column].cell == local[row+rowspan][column].cell
                        ) {
                        structure[row+rowspan][column] = null;
                        rowspan++;
                    }

                    // And for colspan
                    while (
                        local[row][column+colspan] !== undefined &&
                        local[row][column].cell == local[row][column+colspan].cell
                        ) {
                        // Which also needs to go over rows
                        for ( var k=0 ; k<rowspan ; k++ ) {
                            structure[row+k][column+colspan] = null;
                        }

                        colspan++;
                    }

                    var titleSpan = $('span.dt-column-title', cell);

                    structure[row][column] = {
                        cell: cell,
                        colspan: colspan,
                        rowspan: rowspan,
                        title: titleSpan.length
                            ? titleSpan.html()
                            : $(cell).html()
                    };
                }
            }
        }

        return structure;
    }


    /**
     * Draw the header (or footer) element based on the column visibility states.
     *
     *  @param object oSettings dataTables settings object
     *  @param array aoSource Layout array from _fnDetectHeader
     *  @memberof DataTable#oApi
     */
    function _fnDrawHead( settings, source )
    {
        var layout = _fnHeaderLayout(settings, source);
        var tr, n;

        for ( var row=0 ; row<source.length ; row++ ) {
            tr = source[row].row;

            // All cells are going to be replaced, so empty out the row
            // Can't use $().empty() as that kills event handlers
            if (tr) {
                while( (n = tr.firstChild) ) {
                    tr.removeChild( n );
                }
            }

            for ( var column=0 ; column<layout[row].length ; column++ ) {
                var point = layout[row][column];

                if (point) {
                    $(point.cell)
                        .appendTo(tr)
                        .attr('rowspan', point.rowspan)
                        .attr('colspan', point.colspan);
                }
            }
        }
    }


    /**
     * Insert the required TR nodes into the table for display
     *  @param {object} oSettings dataTables settings object
     *  @param ajaxComplete true after ajax call to complete rendering
     *  @memberof DataTable#oApi
     */
    function _fnDraw( oSettings, ajaxComplete )
    {
        // Allow for state saving and a custom start position
        _fnStart( oSettings );

        /* Provide a pre-callback function which can be used to cancel the draw is false is returned */
        var aPreDraw = _fnCallbackFire( oSettings, 'aoPreDrawCallback', 'preDraw', [oSettings] );
        if ( aPreDraw.indexOf(false) !== -1 )
        {
            _fnProcessingDisplay( oSettings, false );
            return;
        }

        var anRows = [];
        var iRowCount = 0;
        var bServerSide = _fnDataSource( oSettings ) == 'ssp';
        var aiDisplay = oSettings.aiDisplay;
        var iDisplayStart = oSettings._iDisplayStart;
        var iDisplayEnd = oSettings.fnDisplayEnd();
        var columns = oSettings.aoColumns;
        var body = $(oSettings.nTBody);

        oSettings.bDrawing = true;

        /* Server-side processing draw intercept */
        if ( oSettings.deferLoading )
        {
            oSettings.deferLoading = false;
            oSettings.iDraw++;
            _fnProcessingDisplay( oSettings, false );
        }
        else if ( !bServerSide )
        {
            oSettings.iDraw++;
        }
        else if ( !oSettings.bDestroying && !ajaxComplete)
        {
            // Show loading message for server-side processing
            if (oSettings.iDraw === 0) {
                body.empty().append(_emptyRow(oSettings));
            }

            _fnAjaxUpdate( oSettings );
            return;
        }

        if ( aiDisplay.length !== 0 )
        {
            var iStart = bServerSide ? 0 : iDisplayStart;
            var iEnd = bServerSide ? oSettings.aoData.length : iDisplayEnd;

            for ( var j=iStart ; j<iEnd ; j++ )
            {
                var iDataIndex = aiDisplay[j];
                var aoData = oSettings.aoData[ iDataIndex ];
                if ( aoData.nTr === null )
                {
                    _fnCreateTr( oSettings, iDataIndex );
                }

                var nRow = aoData.nTr;

                // Add various classes as needed
                for (var i=0 ; i<columns.length ; i++) {
                    var col = columns[i];
                    var td = aoData.anCells[i];

                    _addClass(td, _ext.type.className[col.sType]); // auto class
                    _addClass(td, col.sClass); // column class
                    _addClass(td, oSettings.oClasses.tbody.cell); // all cells
                }

                // Row callback functions - might want to manipulate the row
                // iRowCount and j are not currently documented. Are they at all
                // useful?
                _fnCallbackFire( oSettings, 'aoRowCallback', null,
                    [nRow, aoData._aData, iRowCount, j, iDataIndex] );

                anRows.push( nRow );
                iRowCount++;
            }
        }
        else
        {
            anRows[ 0 ] = _emptyRow(oSettings);
        }

        /* Header and footer callbacks */
        _fnCallbackFire( oSettings, 'aoHeaderCallback', 'header', [ $(oSettings.nTHead).children('tr')[0],
            _fnGetDataMaster( oSettings ), iDisplayStart, iDisplayEnd, aiDisplay ] );

        _fnCallbackFire( oSettings, 'aoFooterCallback', 'footer', [ $(oSettings.nTFoot).children('tr')[0],
            _fnGetDataMaster( oSettings ), iDisplayStart, iDisplayEnd, aiDisplay ] );

        // replaceChildren is faster, but only became widespread in 2020,
        // so a fall back in jQuery is provided for older browsers.
        if (body[0].replaceChildren) {
            body[0].replaceChildren.apply(body[0], anRows);
        }
        else {
            body.children().detach();
            body.append( $(anRows) );
        }

        // Empty table needs a specific class
        $(oSettings.nTableWrapper).toggleClass('dt-empty-footer', $('tr', oSettings.nTFoot).length === 0);

        /* Call all required callback functions for the end of a draw */
        _fnCallbackFire( oSettings, 'aoDrawCallback', 'draw', [oSettings], true );

        /* Draw is complete, sorting and filtering must be as well */
        oSettings.bSorted = false;
        oSettings.bFiltered = false;
        oSettings.bDrawing = false;
    }


    /**
     * Redraw the table - taking account of the various features which are enabled
     *  @param {object} oSettings dataTables settings object
     *  @param {boolean} [holdPosition] Keep the current paging position. By default
     *    the paging is reset to the first page
     *  @memberof DataTable#oApi
     */
    function _fnReDraw( settings, holdPosition, recompute )
    {
        var
            features = settings.oFeatures,
            sort     = features.bSort,
            filter   = features.bFilter;

        if (recompute === undefined || recompute === true) {
            // Resolve any column types that are unknown due to addition or invalidation
            _fnColumnTypes( settings );

            if ( sort ) {
                _fnSort( settings );
            }

            if ( filter ) {
                _fnFilterComplete( settings, settings.oPreviousSearch );
            }
            else {
                // No filtering, so we want to just use the display master
                settings.aiDisplay = settings.aiDisplayMaster.slice();
            }
        }

        if ( holdPosition !== true ) {
            settings._iDisplayStart = 0;
        }

        // Let any modules know about the draw hold position state (used by
        // scrolling internally)
        settings._drawHold = holdPosition;

        _fnDraw( settings );

        settings._drawHold = false;
    }


    /*
	 * Table is empty - create a row with an empty message in it
	 */
    function _emptyRow ( settings ) {
        var oLang = settings.oLanguage;
        var zero = oLang.sZeroRecords;
        var dataSrc = _fnDataSource( settings );

        if (
            (settings.iDraw < 1 && dataSrc === 'ssp') ||
            (settings.iDraw <= 1 && dataSrc === 'ajax')
        ) {
            zero = oLang.sLoadingRecords;
        }
        else if ( oLang.sEmptyTable && settings.fnRecordsTotal() === 0 )
        {
            zero = oLang.sEmptyTable;
        }

        return $( '<tr/>' )
            .append( $('<td />', {
                'colSpan': _fnVisbleColumns( settings ),
                'class':   settings.oClasses.empty.row
            } ).html( zero ) )[0];
    }


    /**
     * Expand the layout items into an object for the rendering function
     */
    function _layoutItems (row, align, items) {
        if ( Array.isArray(items)) {
            for (var i=0 ; i<items.length ; i++) {
                _layoutItems(row, align, items[i]);
            }

            return;
        }

        var rowCell = row[align];

        // If it is an object, then there can be multiple features contained in it
        if ( $.isPlainObject( items ) ) {
            // A feature plugin cannot be named "features" due to this check
            if (items.features) {
                if (items.rowId) {
                    row.id = items.rowId;
                }
                if (items.rowClass) {
                    row.className = items.rowClass;
                }

                rowCell.id = items.id;
                rowCell.className = items.className;

                _layoutItems(row, align, items.features);
            }
            else {
                Object.keys(items).map(function (key) {
                    rowCell.contents.push( {
                        feature: key,
                        opts: items[key]
                    });
                });
            }
        }
        else {
            rowCell.contents.push(items);
        }
    }

    /**
     * Find, or create a layout row
     */
    function _layoutGetRow(rows, rowNum, align) {
        var row;

        // Find existing rows
        for (var i=0; i<rows.length; i++) {
            row = rows[i];

            if (row.rowNum === rowNum) {
                // full is on its own, but start and end share a row
                if (
                    (align === 'full' && row.full) ||
                    ((align === 'start' || align === 'end') && (row.start || row.end))
                ) {
                    if (! row[align]) {
                        row[align] = {
                            contents: []
                        };
                    }

                    return row;
                }
            }
        }

        // If we get this far, then there was no match, create a new row
        row = {
            rowNum: rowNum
        };

        row[align] = {
            contents: []
        };

        rows.push(row);

        return row;
    }

    /**
     * Convert a `layout` object given by a user to the object structure needed
     * for the renderer. This is done twice, once for above and once for below
     * the table. Ordering must also be considered.
     *
     * @param {*} settings DataTables settings object
     * @param {*} layout Layout object to convert
     * @param {string} side `top` or `bottom`
     * @returns Converted array structure - one item for each row.
     */
    function _layoutArray ( settings, layout, side ) {
        var rows = [];

        // Split out into an array
        $.each( layout, function ( pos, items ) {
            if (items === null) {
                return;
            }

            var parts = pos.match(/^([a-z]+)([0-9]*)([A-Za-z]*)$/);
            var rowNum = parts[2]
                ? parts[2] * 1
                : 0;
            var align = parts[3]
                ? parts[3].toLowerCase()
                : 'full';

            // Filter out the side we aren't interested in
            if (parts[1] !== side) {
                return;
            }

            // Get or create the row we should attach to
            var row = _layoutGetRow(rows, rowNum, align);

            _layoutItems(row, align, items);
        });

        // Order by item identifier
        rows.sort( function ( a, b ) {
            var order1 = a.rowNum;
            var order2 = b.rowNum;

            // If both in the same row, then the row with `full` comes first
            if (order1 === order2) {
                var ret = a.full && ! b.full ? -1 : 1;

                return side === 'bottom'
                    ? ret * -1
                    : ret;
            }

            return order2 - order1;
        } );

        // Invert for below the table
        if ( side === 'bottom' ) {
            rows.reverse();
        }

        for (var row = 0; row<rows.length; row++) {
            delete rows[row].rowNum;

            _layoutResolve(settings, rows[row]);
        }

        return rows;
    }


    /**
     * Convert the contents of a row's layout object to nodes that can be inserted
     * into the document by a renderer. Execute functions, look up plug-ins, etc.
     *
     * @param {*} settings DataTables settings object
     * @param {*} row Layout object for this row
     */
    function _layoutResolve( settings, row ) {
        var getFeature = function (feature, opts) {
            if ( ! _ext.features[ feature ] ) {
                _fnLog( settings, 0, 'Unknown feature: '+ feature );
            }

            return _ext.features[ feature ].apply( this, [settings, opts] );
        };

        var resolve = function ( item ) {
            if (! row[ item ]) {
                return;
            }

            var line = row[ item ].contents;

            for ( var i=0, ien=line.length ; i<ien ; i++ ) {
                if ( ! line[i] ) {
                    continue;
                }
                else if ( typeof line[i] === 'string' ) {
                    line[i] = getFeature( line[i], null );
                }
                else if ( $.isPlainObject(line[i]) ) {
                    // If it's an object, it just has feature and opts properties from
                    // the transform in _layoutArray
                    line[i] = getFeature(line[i].feature, line[i].opts);
                }
                else if ( typeof line[i].node === 'function' ) {
                    line[i] = line[i].node( settings );
                }
                else if ( typeof line[i] === 'function' ) {
                    var inst = line[i]( settings );

                    line[i] = typeof inst.node === 'function' ?
                        inst.node() :
                        inst;
                }
            }
        };

        resolve('start');
        resolve('end');
        resolve('full');
    }


    /**
     * Add the options to the page HTML for the table
     *  @param {object} settings DataTables settings object
     *  @memberof DataTable#oApi
     */
    function _fnAddOptionsHtml ( settings )
    {
        var classes = settings.oClasses;
        var table = $(settings.nTable);

        // Wrapper div around everything DataTables controls
        var insert = $('<div/>')
            .attr({
                id:      settings.sTableId+'_wrapper',
                'class': classes.container
            })
            .insertBefore(table);

        settings.nTableWrapper = insert[0];

        if (settings.sDom) {
            // Legacy
            _fnLayoutDom(settings, settings.sDom, insert);
        }
        else {
            var top = _layoutArray( settings, settings.layout, 'top' );
            var bottom = _layoutArray( settings, settings.layout, 'bottom' );
            var renderer = _fnRenderer( settings, 'layout' );

            // Everything above - the renderer will actually insert the contents into the document
            top.forEach(function (item) {
                renderer( settings, insert, item );
            });

            // The table - always the center of attention
            renderer( settings, insert, {
                full: {
                    table: true,
                    contents: [ _fnFeatureHtmlTable(settings) ]
                }
            } );

            // Everything below
            bottom.forEach(function (item) {
                renderer( settings, insert, item );
            });
        }

        // Processing floats on top, so it isn't an inserted feature
        _processingHtml( settings );
    }

    /**
     * Draw the table with the legacy DOM property
     * @param {*} settings DT settings object
     * @param {*} dom DOM string
     * @param {*} insert Insert point
     */
    function _fnLayoutDom( settings, dom, insert )
    {
        var parts = dom.match(/(".*?")|('.*?')|./g);
        var featureNode, option, newNode, next, attr;

        for ( var i=0 ; i<parts.length ; i++ ) {
            featureNode = null;
            option = parts[i];

            if ( option == '<' ) {
                // New container div
                newNode = $('<div/>');

                // Check to see if we should append an id and/or a class name to the container
                next = parts[i+1];

                if ( next[0] == "'" || next[0] == '"' ) {
                    attr = next.replace(/['"]/g, '');

                    var id = '', className;

                    /* The attribute can be in the format of "#id.class", "#id" or "class" This logic
					 * breaks the string into parts and applies them as needed
					 */
                    if ( attr.indexOf('.') != -1 ) {
                        var split = attr.split('.');

                        id = split[0];
                        className = split[1];
                    }
                    else if ( attr[0] == "#" ) {
                        id = attr;
                    }
                    else {
                        className = attr;
                    }

                    newNode
                        .attr('id', id.substring(1))
                        .addClass(className);

                    i++; // Move along the position array
                }

                insert.append( newNode );
                insert = newNode;
            }
            else if ( option == '>' ) {
                // End container div
                insert = insert.parent();
            }
            else if ( option == 't' ) {
                // Table
                featureNode = _fnFeatureHtmlTable( settings );
            }
            else
            {
                DataTable.ext.feature.forEach(function(feature) {
                    if ( option == feature.cFeature ) {
                        featureNode = feature.fnInit( settings );
                    }
                });
            }

            // Add to the display
            if ( featureNode ) {
                insert.append( featureNode );
            }
        }
    }


    /**
     * Use the DOM source to create up an array of header cells. The idea here is to
     * create a layout grid (array) of rows x columns, which contains a reference
     * to the cell that that point in the grid (regardless of col/rowspan), such that
     * any column / row could be removed and the new grid constructed
     *  @param {node} thead The header/footer element for the table
     *  @returns {array} Calculated layout array
     *  @memberof DataTable#oApi
     */
    function _fnDetectHeader ( settings, thead, write )
    {
        var columns = settings.aoColumns;
        var rows = $(thead).children('tr');
        var row, cell;
        var i, k, l, iLen, shifted, column, colspan, rowspan;
        var isHeader = thead && thead.nodeName.toLowerCase() === 'thead';
        var layout = [];
        var unique;
        var shift = function ( a, i, j ) {
            var k = a[i];
            while ( k[j] ) {
                j++;
            }
            return j;
        };

        // We know how many rows there are in the layout - so prep it
        for ( i=0, iLen=rows.length ; i<iLen ; i++ ) {
            layout.push( [] );
        }

        for ( i=0, iLen=rows.length ; i<iLen ; i++ ) {
            row = rows[i];
            column = 0;

            // For every cell in the row..
            cell = row.firstChild;
            while ( cell ) {
                if (
                    cell.nodeName.toUpperCase() == 'TD' ||
                    cell.nodeName.toUpperCase() == 'TH'
                ) {
                    var cols = [];

                    // Get the col and rowspan attributes from the DOM and sanitise them
                    colspan = cell.getAttribute('colspan') * 1;
                    rowspan = cell.getAttribute('rowspan') * 1;
                    colspan = (!colspan || colspan===0 || colspan===1) ? 1 : colspan;
                    rowspan = (!rowspan || rowspan===0 || rowspan===1) ? 1 : rowspan;

                    // There might be colspan cells already in this row, so shift our target
                    // accordingly
                    shifted = shift( layout, i, column );

                    // Cache calculation for unique columns
                    unique = colspan === 1 ?
                        true :
                        false;

                    // Perform header setup
                    if ( write ) {
                        if (unique) {
                            // Allow column options to be set from HTML attributes
                            _fnColumnOptions( settings, shifted, $(cell).data() );

                            // Get the width for the column. This can be defined from the
                            // width attribute, style attribute or `columns.width` option
                            var columnDef = columns[shifted];
                            var width = cell.getAttribute('width') || null;
                            var t = cell.style.width.match(/width:\s*(\d+[pxem%]+)/);
                            if ( t ) {
                                width = t[1];
                            }

                            columnDef.sWidthOrig = columnDef.sWidth || width;

                            if (isHeader) {
                                // Column title handling - can be user set, or read from the DOM
                                // This happens before the render, so the original is still in place
                                if ( columnDef.sTitle !== null && ! columnDef.autoTitle ) {
                                    cell.innerHTML = columnDef.sTitle;
                                }

                                if (! columnDef.sTitle && unique) {
                                    columnDef.sTitle = _stripHtml(cell.innerHTML);
                                    columnDef.autoTitle = true;
                                }
                            }
                            else {
                                // Footer specific operations
                                if (columnDef.footer) {
                                    cell.innerHTML = columnDef.footer;
                                }
                            }

                            // Fall back to the aria-label attribute on the table header if no ariaTitle is
                            // provided.
                            if (! columnDef.ariaTitle) {
                                columnDef.ariaTitle = $(cell).attr("aria-label") || columnDef.sTitle;
                            }

                            // Column specific class names
                            if ( columnDef.className ) {
                                $(cell).addClass( columnDef.className );
                            }
                        }

                        // Wrap the column title so we can write to it in future
                        if ( $('span.dt-column-title', cell).length === 0) {
                            $('<span>')
                                .addClass('dt-column-title')
                                .append(cell.childNodes)
                                .appendTo(cell);
                        }

                        if ( isHeader && $('span.dt-column-order', cell).length === 0) {
                            $('<span>')
                                .addClass('dt-column-order')
                                .appendTo(cell);
                        }
                    }

                    // If there is col / rowspan, copy the information into the layout grid
                    for ( l=0 ; l<colspan ; l++ ) {
                        for ( k=0 ; k<rowspan ; k++ ) {
                            layout[i+k][shifted+l] = {
                                cell: cell,
                                unique: unique
                            };

                            layout[i+k].row = row;
                        }

                        cols.push( shifted+l );
                    }

                    // Assign an attribute so spanning cells can still be identified
                    // as belonging to a column
                    cell.setAttribute('data-dt-column', _unique(cols).join(','));
                }

                cell = cell.nextSibling;
            }
        }

        return layout;
    }

    /**
     * Set the start position for draw
     *  @param {object} oSettings dataTables settings object
     */
    function _fnStart( oSettings )
    {
        var bServerSide = _fnDataSource( oSettings ) == 'ssp';
        var iInitDisplayStart = oSettings.iInitDisplayStart;

        // Check and see if we have an initial draw position from state saving
        if ( iInitDisplayStart !== undefined && iInitDisplayStart !== -1 )
        {
            oSettings._iDisplayStart = bServerSide ?
                iInitDisplayStart :
                iInitDisplayStart >= oSettings.fnRecordsDisplay() ?
                    0 :
                    iInitDisplayStart;

            oSettings.iInitDisplayStart = -1;
        }
    }

    /**
     * Create an Ajax call based on the table's settings, taking into account that
     * parameters can have multiple forms, and backwards compatibility.
     *
     * @param {object} oSettings dataTables settings object
     * @param {array} data Data to send to the server, required by
     *     DataTables - may be augmented by developer callbacks
     * @param {function} fn Callback function to run when data is obtained
     */
    function _fnBuildAjax( oSettings, data, fn )
    {
        var ajaxData;
        var ajax = oSettings.ajax;
        var instance = oSettings.oInstance;
        var callback = function ( json ) {
            var status = oSettings.jqXHR
                ? oSettings.jqXHR.status
                : null;

            if ( json === null || (typeof status === 'number' && status == 204 ) ) {
                json = {};
                _fnAjaxDataSrc( oSettings, json, [] );
            }

            var error = json.error || json.sError;
            if ( error ) {
                _fnLog( oSettings, 0, error );
            }

            // Microsoft often wrap JSON as a string in another JSON object
            // Let's handle that automatically
            if (json.d && typeof json.d === 'string') {
                try {
                    json = JSON.parse(json.d);
                }
                catch (e) {
                    // noop
                }
            }

            oSettings.json = json;

            _fnCallbackFire( oSettings, null, 'xhr', [oSettings, json, oSettings.jqXHR], true );
            fn( json );
        };

        if ( $.isPlainObject( ajax ) && ajax.data )
        {
            ajaxData = ajax.data;

            var newData = typeof ajaxData === 'function' ?
                ajaxData( data, oSettings ) :  // fn can manipulate data or return
                ajaxData;                      // an object object or array to merge

            // If the function returned something, use that alone
            data = typeof ajaxData === 'function' && newData ?
                newData :
                $.extend( true, data, newData );

            // Remove the data property as we've resolved it already and don't want
            // jQuery to do it again (it is restored at the end of the function)
            delete ajax.data;
        }

        var baseAjax = {
            "url": typeof ajax === 'string' ?
                ajax :
                '',
            "data": data,
            "success": callback,
            "dataType": "json",
            "cache": false,
            "type": oSettings.sServerMethod,
            "error": function (xhr, error) {
                var ret = _fnCallbackFire( oSettings, null, 'xhr', [oSettings, null, oSettings.jqXHR], true );

                if ( ret.indexOf(true) === -1 ) {
                    if ( error == "parsererror" ) {
                        _fnLog( oSettings, 0, 'Invalid JSON response', 1 );
                    }
                    else if ( xhr.readyState === 4 ) {
                        _fnLog( oSettings, 0, 'Ajax error', 7 );
                    }
                }

                _fnProcessingDisplay( oSettings, false );
            }
        };

        // If `ajax` option is an object, extend and override our default base
        if ( $.isPlainObject( ajax ) ) {
            $.extend( baseAjax, ajax )
        }

        // Store the data submitted for the API
        oSettings.oAjaxData = data;

        // Allow plug-ins and external processes to modify the data
        _fnCallbackFire( oSettings, null, 'preXhr', [oSettings, data, baseAjax], true );

        if ( typeof ajax === 'function' )
        {
            // Is a function - let the caller define what needs to be done
            oSettings.jqXHR = ajax.call( instance, data, callback, oSettings );
        }
        else if (ajax.url === '') {
            // No url, so don't load any data. Just apply an empty data array
            // to the object for the callback.
            var empty = {};

            DataTable.util.set(ajax.dataSrc)(empty, []);
            callback(empty);
        }
        else {
            // Object to extend the base settings
            oSettings.jqXHR = $.ajax( baseAjax );
        }

        // Restore for next time around
        if ( ajaxData ) {
            ajax.data = ajaxData;
        }
    }


    /**
     * Update the table using an Ajax call
     *  @param {object} settings dataTables settings object
     *  @returns {boolean} Block the table drawing or not
     *  @memberof DataTable#oApi
     */
    function _fnAjaxUpdate( settings )
    {
        settings.iDraw++;
        _fnProcessingDisplay( settings, true );

        _fnBuildAjax(
            settings,
            _fnAjaxParameters( settings ),
            function(json) {
                _fnAjaxUpdateDraw( settings, json );
            }
        );
    }


    /**
     * Build up the parameters in an object needed for a server-side processing
     * request.
     *  @param {object} oSettings dataTables settings object
     *  @returns {bool} block the table drawing or not
     *  @memberof DataTable#oApi
     */
    function _fnAjaxParameters( settings )
    {
        var
            columns = settings.aoColumns,
            features = settings.oFeatures,
            preSearch = settings.oPreviousSearch,
            preColSearch = settings.aoPreSearchCols,
            colData = function ( idx, prop ) {
                return typeof columns[idx][prop] === 'function' ?
                    'function' :
                    columns[idx][prop];
            };

        return {
            draw: settings.iDraw,
            columns: columns.map( function ( column, i ) {
                return {
                    data: colData(i, 'mData'),
                    name: column.sName,
                    searchable: column.bSearchable,
                    orderable: column.bSortable,
                    search: {
                        value: preColSearch[i].search,
                        regex: preColSearch[i].regex,
                        fixed: Object.keys(column.searchFixed).map( function(name) {
                            return {
                                name: name,
                                term: column.searchFixed[name].toString()
                            }
                        })
                    }
                };
            } ),
            order: _fnSortFlatten( settings ).map( function ( val ) {
                return {
                    column: val.col,
                    dir: val.dir,
                    name: colData(val.col, 'sName')
                };
            } ),
            start: settings._iDisplayStart,
            length: features.bPaginate ?
                settings._iDisplayLength :
                -1,
            search: {
                value: preSearch.search,
                regex: preSearch.regex,
                fixed: Object.keys(settings.searchFixed).map( function(name) {
                    return {
                        name: name,
                        term: settings.searchFixed[name].toString()
                    }
                })
            }
        };
    }


    /**
     * Data the data from the server (nuking the old) and redraw the table
     *  @param {object} oSettings dataTables settings object
     *  @param {object} json json data return from the server.
     *  @param {string} json.sEcho Tracking flag for DataTables to match requests
     *  @param {int} json.iTotalRecords Number of records in the data set, not accounting for filtering
     *  @param {int} json.iTotalDisplayRecords Number of records in the data set, accounting for filtering
     *  @param {array} json.aaData The data to display on this page
     *  @param {string} [json.sColumns] Column ordering (sName, comma separated)
     *  @memberof DataTable#oApi
     */
    function _fnAjaxUpdateDraw ( settings, json )
    {
        var data = _fnAjaxDataSrc(settings, json);
        var draw = _fnAjaxDataSrcParam(settings, 'draw', json);
        var recordsTotal = _fnAjaxDataSrcParam(settings, 'recordsTotal', json);
        var recordsFiltered = _fnAjaxDataSrcParam(settings, 'recordsFiltered', json);

        if ( draw !== undefined ) {
            // Protect against out of sequence returns
            if ( draw*1 < settings.iDraw ) {
                return;
            }
            settings.iDraw = draw * 1;
        }

        // No data in returned object, so rather than an array, we show an empty table
        if ( ! data ) {
            data = [];
        }

        _fnClearTable( settings );
        settings._iRecordsTotal   = parseInt(recordsTotal, 10);
        settings._iRecordsDisplay = parseInt(recordsFiltered, 10);

        for ( var i=0, ien=data.length ; i<ien ; i++ ) {
            _fnAddData( settings, data[i] );
        }
        settings.aiDisplay = settings.aiDisplayMaster.slice();

        _fnDraw( settings, true );
        _fnInitComplete( settings );
        _fnProcessingDisplay( settings, false );
    }


    /**
     * Get the data from the JSON data source to use for drawing a table. Using
     * `_fnGetObjectDataFn` allows the data to be sourced from a property of the
     * source object, or from a processing function.
     *  @param {object} settings dataTables settings object
     *  @param  {object} json Data source object / array from the server
     *  @return {array} Array of data to use
     */
    function _fnAjaxDataSrc ( settings, json, write )
    {
        var dataProp = 'data';

        if ($.isPlainObject( settings.ajax ) && settings.ajax.dataSrc !== undefined) {
            // Could in inside a `dataSrc` object, or not!
            var dataSrc = settings.ajax.dataSrc;

            // string, function and object are valid types
            if (typeof dataSrc === 'string' || typeof dataSrc === 'function') {
                dataProp = dataSrc;
            }
            else if (dataSrc.data !== undefined) {
                dataProp = dataSrc.data;
            }
        }

        if ( ! write ) {
            if ( dataProp === 'data' ) {
                // If the default, then we still want to support the old style, and safely ignore
                // it if possible
                return json.aaData || json[dataProp];
            }

            return dataProp !== "" ?
                _fnGetObjectDataFn( dataProp )( json ) :
                json;
        }

        // set
        _fnSetObjectDataFn( dataProp )( json, write );
    }

    /**
     * Very similar to _fnAjaxDataSrc, but for the other SSP properties
     * @param {*} settings DataTables settings object
     * @param {*} param Target parameter
     * @param {*} json JSON data
     * @returns Resolved value
     */
    function _fnAjaxDataSrcParam (settings, param, json) {
        var dataSrc = $.isPlainObject( settings.ajax )
            ? settings.ajax.dataSrc
            : null;

        if (dataSrc && dataSrc[param]) {
            // Get from custom location
            return _fnGetObjectDataFn( dataSrc[param] )( json );
        }

        // else - Default behaviour
        var old = '';

        // Legacy support
        if (param === 'draw') {
            old = 'sEcho';
        }
        else if (param === 'recordsTotal') {
            old = 'iTotalRecords';
        }
        else if (param === 'recordsFiltered') {
            old = 'iTotalDisplayRecords';
        }

        return json[old] !== undefined
            ? json[old]
            : json[param];
    }


    /**
     * Filter the table using both the global filter and column based filtering
     *  @param {object} settings dataTables settings object
     *  @param {object} input search information
     *  @memberof DataTable#oApi
     */
    function _fnFilterComplete ( settings, input )
    {
        var columnsSearch = settings.aoPreSearchCols;

        // In server-side processing all filtering is done by the server, so no point hanging around here
        if ( _fnDataSource( settings ) != 'ssp' )
        {
            // Check if any of the rows were invalidated
            _fnFilterData( settings );

            // Start from the full data set
            settings.aiDisplay = settings.aiDisplayMaster.slice();

            // Global filter first
            _fnFilter( settings.aiDisplay, settings, input.search, input );

            $.each(settings.searchFixed, function (name, term) {
                _fnFilter(settings.aiDisplay, settings, term, {});
            });

            // Then individual column filters
            for ( var i=0 ; i<columnsSearch.length ; i++ )
            {
                var col = columnsSearch[i];

                _fnFilter(
                    settings.aiDisplay,
                    settings,
                    col.search,
                    col,
                    i
                );

                $.each(settings.aoColumns[i].searchFixed, function (name, term) {
                    _fnFilter(settings.aiDisplay, settings, term, {}, i);
                });
            }

            // And finally global filtering
            _fnFilterCustom( settings );
        }

        // Tell the draw function we have been filtering
        settings.bFiltered = true;

        _fnCallbackFire( settings, null, 'search', [settings] );
    }


    /**
     * Apply custom filtering functions
     *
     * This is legacy now that we have named functions, but it is widely used
     * from 1.x, so it is not yet deprecated.
     *  @param {object} oSettings dataTables settings object
     *  @memberof DataTable#oApi
     */
    function _fnFilterCustom( settings )
    {
        var filters = DataTable.ext.search;
        var displayRows = settings.aiDisplay;
        var row, rowIdx;

        for ( var i=0, ien=filters.length ; i<ien ; i++ ) {
            var rows = [];

            // Loop over each row and see if it should be included
            for ( var j=0, jen=displayRows.length ; j<jen ; j++ ) {
                rowIdx = displayRows[ j ];
                row = settings.aoData[ rowIdx ];

                if ( filters[i]( settings, row._aFilterData, rowIdx, row._aData, j ) ) {
                    rows.push( rowIdx );
                }
            }

            // So the array reference doesn't break set the results into the
            // existing array
            displayRows.length = 0;
            displayRows.push.apply(displayRows, rows);
        }
    }


    /**
     * Filter the data table based on user input and draw the table
     */
    function _fnFilter( searchRows, settings, input, options, column )
    {
        if ( input === '' ) {
            return;
        }

        var i = 0;
        var matched = [];

        // Search term can be a function, regex or string - if a string we apply our
        // smart filtering regex (assuming the options require that)
        var searchFunc = typeof input === 'function' ? input : null;
        var rpSearch = input instanceof RegExp
            ? input
            : searchFunc
                ? null
                : _fnFilterCreateSearch( input, options );

        // Then for each row, does the test pass. If not, lop the row from the array
        for (i=0 ; i<searchRows.length ; i++) {
            var row = settings.aoData[ searchRows[i] ];
            var data = column === undefined
                ? row._sFilterRow
                : row._aFilterData[ column ];

            if ( (searchFunc && searchFunc(data, row._aData, searchRows[i], column)) || (rpSearch && rpSearch.test(data)) ) {
                matched.push(searchRows[i]);
            }
        }

        // Mutate the searchRows array
        searchRows.length = matched.length;

        for (i=0 ; i<matched.length ; i++) {
            searchRows[i] = matched[i];
        }
    }


    /**
     * Build a regular expression object suitable for searching a table
     *  @param {string} sSearch string to search for
     *  @param {bool} bRegex treat as a regular expression or not
     *  @param {bool} bSmart perform smart filtering or not
     *  @param {bool} bCaseInsensitive Do case insensitive matching or not
     *  @returns {RegExp} constructed object
     *  @memberof DataTable#oApi
     */
    function _fnFilterCreateSearch( search, inOpts )
    {
        var not = [];
        var options = $.extend({}, {
            boundary: false,
            caseInsensitive: true,
            exact: false,
            regex: false,
            smart: true
        }, inOpts);

        if (typeof search !== 'string') {
            search = search.toString();
        }

        // Remove diacritics if normalize is set up to do so
        search = _normalize(search);

        if (options.exact) {
            return new RegExp(
                '^'+_fnEscapeRegex(search)+'$',
                options.caseInsensitive ? 'i' : ''
            );
        }

        search = options.regex ?
            search :
            _fnEscapeRegex( search );

        if ( options.smart ) {
            /* For smart filtering we want to allow the search to work regardless of
			 * word order. We also want double quoted text to be preserved, so word
			 * order is important - a la google. And a negative look around for
			 * finding rows which don't contain a given string.
			 *
			 * So this is the sort of thing we want to generate:
			 *
			 * ^(?=.*?\bone\b)(?=.*?\btwo three\b)(?=.*?\bfour\b).*$
			 */
            var parts = search.match( /!?["\u201C][^"\u201D]+["\u201D]|[^ ]+/g ) || [''];
            var a = parts.map( function ( word ) {
                var negative = false;
                var m;

                // Determine if it is a "does not include"
                if ( word.charAt(0) === '!' ) {
                    negative = true;
                    word = word.substring(1);
                }

                // Strip the quotes from around matched phrases
                if ( word.charAt(0) === '"' ) {
                    m = word.match( /^"(.*)"$/ );
                    word = m ? m[1] : word;
                }
                else if ( word.charAt(0) === '\u201C' ) {
                    // Smart quote match (iPhone users)
                    m = word.match( /^\u201C(.*)\u201D$/ );
                    word = m ? m[1] : word;
                }

                // For our "not" case, we need to modify the string that is
                // allowed to match at the end of the expression.
                if (negative) {
                    if (word.length > 1) {
                        not.push('(?!'+word+')');
                    }

                    word = '';
                }

                return word.replace(/"/g, '');
            } );

            var match = not.length
                ? not.join('')
                : '';

            var boundary = options.boundary
                ? '\\b'
                : '';

            search = '^(?=.*?'+boundary+a.join( ')(?=.*?'+boundary )+')('+match+'.)*$';
        }

        return new RegExp( search, options.caseInsensitive ? 'i' : '' );
    }


    /**
     * Escape a string such that it can be used in a regular expression
     *  @param {string} sVal string to escape
     *  @returns {string} escaped string
     *  @memberof DataTable#oApi
     */
    var _fnEscapeRegex = DataTable.util.escapeRegex;

    var __filter_div = $('<div>')[0];
    var __filter_div_textContent = __filter_div.textContent !== undefined;

    // Update the filtering data for each row if needed (by invalidation or first run)
    function _fnFilterData ( settings )
    {
        var columns = settings.aoColumns;
        var data = settings.aoData;
        var column;
        var j, jen, filterData, cellData, row;
        var wasInvalidated = false;

        for ( var rowIdx=0 ; rowIdx<data.length ; rowIdx++ ) {
            if (! data[rowIdx]) {
                continue;
            }

            row = data[rowIdx];

            if ( ! row._aFilterData ) {
                filterData = [];

                for ( j=0, jen=columns.length ; j<jen ; j++ ) {
                    column = columns[j];

                    if ( column.bSearchable ) {
                        cellData = _fnGetCellData( settings, rowIdx, j, 'filter' );

                        // Search in DataTables is string based
                        if ( cellData === null ) {
                            cellData = '';
                        }

                        if ( typeof cellData !== 'string' && cellData.toString ) {
                            cellData = cellData.toString();
                        }
                    }
                    else {
                        cellData = '';
                    }

                    // If it looks like there is an HTML entity in the string,
                    // attempt to decode it so sorting works as expected. Note that
                    // we could use a single line of jQuery to do this, but the DOM
                    // method used here is much faster https://jsperf.com/html-decode
                    if ( cellData.indexOf && cellData.indexOf('&') !== -1 ) {
                        __filter_div.innerHTML = cellData;
                        cellData = __filter_div_textContent ?
                            __filter_div.textContent :
                            __filter_div.innerText;
                    }

                    if ( cellData.replace ) {
                        cellData = cellData.replace(/[\r\n\u2028]/g, '');
                    }

                    filterData.push( cellData );
                }

                row._aFilterData = filterData;
                row._sFilterRow = filterData.join('  ');
                wasInvalidated = true;
            }
        }

        return wasInvalidated;
    }


    /**
     * Draw the table for the first time, adding all required features
     *  @param {object} settings dataTables settings object
     *  @memberof DataTable#oApi
     */
    function _fnInitialise ( settings )
    {
        var i, iAjaxStart=settings.iInitDisplayStart;
        var init = settings.oInit;
        var deferLoading = settings.deferLoading;
        var dataSrc = _fnDataSource( settings );

        // Ensure that the table data is fully initialised
        if ( ! settings.bInitialised ) {
            setTimeout( function(){ _fnInitialise( settings ); }, 200 );
            return;
        }

        // Build the header / footer for the table
        _fnBuildHead( settings, 'header' );
        _fnBuildHead( settings, 'footer' );

        // Load the table's state (if needed) and then render around it and draw
        _fnLoadState( settings, init, function () {
            // Then draw the header / footer
            _fnDrawHead( settings, settings.aoHeader );
            _fnDrawHead( settings, settings.aoFooter );

            // Local data load
            // Check if there is data passing into the constructor
            if ( init.aaData ) {
                for ( i=0 ; i<init.aaData.length ; i++ ) {
                    _fnAddData( settings, init.aaData[ i ] );
                }
            }
            else if ( deferLoading || dataSrc == 'dom' ) {
                // Grab the data from the page
                _fnAddTr( settings, $(settings.nTBody).children('tr') );
            }

            // Filter not yet applied - copy the display master
            settings.aiDisplay = settings.aiDisplayMaster.slice();

            // Enable features
            _fnAddOptionsHtml( settings );
            _fnSortInit( settings );

            _colGroup( settings );

            /* Okay to show that something is going on now */
            _fnProcessingDisplay( settings, true );

            _fnCallbackFire( settings, null, 'preInit', [settings], true );

            // If there is default sorting required - let's do it. The sort function
            // will do the drawing for us. Otherwise we draw the table regardless of the
            // Ajax source - this allows the table to look initialised for Ajax sourcing
            // data (show 'loading' message possibly)
            _fnReDraw( settings );

            // Server-side processing init complete is done by _fnAjaxUpdateDraw
            if ( dataSrc != 'ssp' || deferLoading ) {
                // if there is an ajax source load the data
                if ( dataSrc == 'ajax' ) {
                    _fnBuildAjax( settings, {}, function(json) {
                        var aData = _fnAjaxDataSrc( settings, json );

                        // Got the data - add it to the table
                        for ( i=0 ; i<aData.length ; i++ ) {
                            _fnAddData( settings, aData[i] );
                        }

                        // Reset the init display for cookie saving. We've already done
                        // a filter, and therefore cleared it before. So we need to make
                        // it appear 'fresh'
                        settings.iInitDisplayStart = iAjaxStart;

                        _fnReDraw( settings );
                        _fnProcessingDisplay( settings, false );
                        _fnInitComplete( settings );
                    }, settings );
                }
                else {
                    _fnInitComplete( settings );
                    _fnProcessingDisplay( settings, false );
                }
            }
        } );
    }


    /**
     * Draw the table for the first time, adding all required features
     *  @param {object} settings dataTables settings object
     *  @memberof DataTable#oApi
     */
    function _fnInitComplete ( settings )
    {
        if (settings._bInitComplete) {
            return;
        }

        var args = [settings, settings.json];

        settings._bInitComplete = true;

        // Table is fully set up and we have data, so calculate the
        // column widths
        _fnAdjustColumnSizing( settings );

        _fnCallbackFire( settings, null, 'plugin-init', args, true );
        _fnCallbackFire( settings, 'aoInitComplete', 'init', args, true );
    }

    function _fnLengthChange ( settings, val )
    {
        var len = parseInt( val, 10 );
        settings._iDisplayLength = len;

        _fnLengthOverflow( settings );

        // Fire length change event
        _fnCallbackFire( settings, null, 'length', [settings, len] );
    }

    /**
     * Alter the display settings to change the page
     *  @param {object} settings DataTables settings object
     *  @param {string|int} action Paging action to take: "first", "previous",
     *    "next" or "last" or page number to jump to (integer)
     *  @param [bool] redraw Automatically draw the update or not
     *  @returns {bool} true page has changed, false - no change
     *  @memberof DataTable#oApi
     */
    function _fnPageChange ( settings, action, redraw )
    {
        var
            start     = settings._iDisplayStart,
            len       = settings._iDisplayLength,
            records   = settings.fnRecordsDisplay();

        if ( records === 0 || len === -1 )
        {
            start = 0;
        }
        else if ( typeof action === "number" )
        {
            start = action * len;

            if ( start > records )
            {
                start = 0;
            }
        }
        else if ( action == "first" )
        {
            start = 0;
        }
        else if ( action == "previous" )
        {
            start = len >= 0 ?
                start - len :
                0;

            if ( start < 0 )
            {
                start = 0;
            }
        }
        else if ( action == "next" )
        {
            if ( start + len < records )
            {
                start += len;
            }
        }
        else if ( action == "last" )
        {
            start = Math.floor( (records-1) / len) * len;
        }
        else if ( action === 'ellipsis' )
        {
            return;
        }
        else
        {
            _fnLog( settings, 0, "Unknown paging action: "+action, 5 );
        }

        var changed = settings._iDisplayStart !== start;
        settings._iDisplayStart = start;

        _fnCallbackFire( settings, null, changed ? 'page' : 'page-nc', [settings] );

        if ( changed && redraw ) {
            _fnDraw( settings );
        }

        return changed;
    }


    /**
     * Generate the node required for the processing node
     *  @param {object} settings DataTables settings object
     */
    function _processingHtml ( settings )
    {
        var table = settings.nTable;
        var scrolling = settings.oScroll.sX !== '' || settings.oScroll.sY !== '';

        if ( settings.oFeatures.bProcessing ) {
            var n = $('<div/>', {
                'id': settings.sTableId + '_processing',
                'class': settings.oClasses.processing.container,
                'role': 'status'
            } )
                .html( settings.oLanguage.sProcessing )
                .append('<div><div></div><div></div><div></div><div></div></div>');

            // Different positioning depending on if scrolling is enabled or not
            if (scrolling) {
                n.prependTo( $('div.dt-scroll', settings.nTableWrapper) );
            }
            else {
                n.insertBefore( table );
            }

            $(table).on( 'processing.dt.DT', function (e, s, show) {
                n.css( 'display', show ? 'block' : 'none' );
            } );
        }
    }


    /**
     * Display or hide the processing indicator
     *  @param {object} settings DataTables settings object
     *  @param {bool} show Show the processing indicator (true) or not (false)
     */
    function _fnProcessingDisplay ( settings, show )
    {
        _fnCallbackFire( settings, null, 'processing', [settings, show] );
    }

    /**
     * Show the processing element if an action takes longer than a given time
     *
     * @param {*} settings DataTables settings object
     * @param {*} enable Do (true) or not (false) async processing (local feature enablement)
     * @param {*} run Function to run
     */
    function _fnProcessingRun( settings, enable, run ) {
        if (! enable) {
            // Immediate execution, synchronous
            run();
        }
        else {
            _fnProcessingDisplay(settings, true);

            // Allow the processing display to show if needed
            setTimeout(function () {
                run();

                _fnProcessingDisplay(settings, false);
            }, 0);
        }
    }
    /**
     * Add any control elements for the table - specifically scrolling
     *  @param {object} settings dataTables settings object
     *  @returns {node} Node to add to the DOM
     *  @memberof DataTable#oApi
     */
    function _fnFeatureHtmlTable ( settings )
    {
        var table = $(settings.nTable);

        // Scrolling from here on in
        var scroll = settings.oScroll;

        if ( scroll.sX === '' && scroll.sY === '' ) {
            return settings.nTable;
        }

        var scrollX = scroll.sX;
        var scrollY = scroll.sY;
        var classes = settings.oClasses.scrolling;
        var caption = settings.captionNode;
        var captionSide = caption ? caption._captionSide : null;
        var headerClone = $( table[0].cloneNode(false) );
        var footerClone = $( table[0].cloneNode(false) );
        var footer = table.children('tfoot');
        var _div = '<div/>';
        var size = function ( s ) {
            return !s ? null : _fnStringToCss( s );
        };

        if ( ! footer.length ) {
            footer = null;
        }

        /*
		 * The HTML structure that we want to generate in this function is:
		 *  div - scroller
		 *    div - scroll head
		 *      div - scroll head inner
		 *        table - scroll head table
		 *          thead - thead
		 *    div - scroll body
		 *      table - table (master table)
		 *        thead - thead clone for sizing
		 *        tbody - tbody
		 *    div - scroll foot
		 *      div - scroll foot inner
		 *        table - scroll foot table
		 *          tfoot - tfoot
		 */
        var scroller = $( _div, { 'class': classes.container } )
            .append(
                $(_div, { 'class': classes.header.self } )
                    .css( {
                        overflow: 'hidden',
                        position: 'relative',
                        border: 0,
                        width: scrollX ? size(scrollX) : '100%'
                    } )
                    .append(
                        $(_div, { 'class': classes.header.inner } )
                            .css( {
                                'box-sizing': 'content-box',
                                width: scroll.sXInner || '100%'
                            } )
                            .append(
                                headerClone
                                    .removeAttr('id')
                                    .css( 'margin-left', 0 )
                                    .append( captionSide === 'top' ? caption : null )
                                    .append(
                                        table.children('thead')
                                    )
                            )
                    )
            )
            .append(
                $(_div, { 'class': classes.body } )
                    .css( {
                        position: 'relative',
                        overflow: 'auto',
                        width: size( scrollX )
                    } )
                    .append( table )
            );

        if ( footer ) {
            scroller.append(
                $(_div, { 'class': classes.footer.self } )
                    .css( {
                        overflow: 'hidden',
                        border: 0,
                        width: scrollX ? size(scrollX) : '100%'
                    } )
                    .append(
                        $(_div, { 'class': classes.footer.inner } )
                            .append(
                                footerClone
                                    .removeAttr('id')
                                    .css( 'margin-left', 0 )
                                    .append( captionSide === 'bottom' ? caption : null )
                                    .append(
                                        table.children('tfoot')
                                    )
                            )
                    )
            );
        }

        var children = scroller.children();
        var scrollHead = children[0];
        var scrollBody = children[1];
        var scrollFoot = footer ? children[2] : null;

        // When the body is scrolled, then we also want to scroll the headers
        $(scrollBody).on( 'scroll.DT', function () {
            var scrollLeft = this.scrollLeft;

            scrollHead.scrollLeft = scrollLeft;

            if ( footer ) {
                scrollFoot.scrollLeft = scrollLeft;
            }
        } );

        // When focus is put on the header cells, we might need to scroll the body
        $('th, td', scrollHead).on('focus', function () {
            var scrollLeft = scrollHead.scrollLeft;

            scrollBody.scrollLeft = scrollLeft;

            if ( footer ) {
                scrollBody.scrollLeft = scrollLeft;
            }
        });

        $(scrollBody).css('max-height', scrollY);
        if (! scroll.bCollapse) {
            $(scrollBody).css('height', scrollY);
        }

        settings.nScrollHead = scrollHead;
        settings.nScrollBody = scrollBody;
        settings.nScrollFoot = scrollFoot;

        // On redraw - align columns
        settings.aoDrawCallback.push(_fnScrollDraw);

        return scroller[0];
    }



    /**
     * Update the header, footer and body tables for resizing - i.e. column
     * alignment.
     *
     * Welcome to the most horrible function DataTables. The process that this
     * function follows is basically:
     *   1. Re-create the table inside the scrolling div
     *   2. Correct colgroup > col values if needed
     *   3. Copy colgroup > col over to header and footer
     *   4. Clean up
     *
     *  @param {object} settings dataTables settings object
     *  @memberof DataTable#oApi
     */
    function _fnScrollDraw ( settings )
    {
        // Given that this is such a monster function, a lot of variables are use
        // to try and keep the minimised size as small as possible
        var
            scroll         = settings.oScroll,
            barWidth       = scroll.iBarWidth,
            divHeader      = $(settings.nScrollHead),
            divHeaderInner = divHeader.children('div'),
            divHeaderTable = divHeaderInner.children('table'),
            divBodyEl      = settings.nScrollBody,
            divBody        = $(divBodyEl),
            divFooter      = $(settings.nScrollFoot),
            divFooterInner = divFooter.children('div'),
            divFooterTable = divFooterInner.children('table'),
            header         = $(settings.nTHead),
            table          = $(settings.nTable),
            footer         = settings.nTFoot && $('th, td', settings.nTFoot).length ? $(settings.nTFoot) : null,
            browser        = settings.oBrowser,
            headerCopy, footerCopy;

        // If the scrollbar visibility has changed from the last draw, we need to
        // adjust the column sizes as the table width will have changed to account
        // for the scrollbar
        var scrollBarVis = divBodyEl.scrollHeight > divBodyEl.clientHeight;

        if ( settings.scrollBarVis !== scrollBarVis && settings.scrollBarVis !== undefined ) {
            settings.scrollBarVis = scrollBarVis;
            _fnAdjustColumnSizing( settings );
            return; // adjust column sizing will call this function again
        }
        else {
            settings.scrollBarVis = scrollBarVis;
        }

        // 1. Re-create the table inside the scrolling div
        // Remove the old minimised thead and tfoot elements in the inner table
        table.children('thead, tfoot').remove();

        // Clone the current header and footer elements and then place it into the inner table
        headerCopy = header.clone().prependTo( table );
        headerCopy.find('th, td').removeAttr('tabindex');
        headerCopy.find('[id]').removeAttr('id');

        if ( footer ) {
            footerCopy = footer.clone().prependTo( table );
            footerCopy.find('[id]').removeAttr('id');
        }

        // 2. Correct colgroup > col values if needed
        // It is possible that the cell sizes are smaller than the content, so we need to
        // correct colgroup>col for such cases. This can happen if the auto width detection
        // uses a cell which has a longer string, but isn't the widest! For example
        // "Chief Executive Officer (CEO)" is the longest string in the demo, but
        // "Systems Administrator" is actually the widest string since it doesn't collapse.
        // Note the use of translating into a column index to get the `col` element. This
        // is because of Responsive which might remove `col` elements, knocking the alignment
        // of the indexes out.
        if (settings.aiDisplay.length) {
            // Get the column sizes from the first row in the table
            var colSizes = table.children('tbody').eq(0).children('tr').eq(0).children('th, td').map(function (vis) {
                return {
                    idx: _fnVisibleToColumnIndex(settings, vis),
                    width: $(this).outerWidth()
                }
            });

            // Check against what the colgroup > col is set to and correct if needed
            for (var i=0 ; i<colSizes.length ; i++) {
                var colEl = settings.aoColumns[ colSizes[i].idx ].colEl[0];
                var colWidth = colEl.style.width.replace('px', '');

                if (colWidth !== colSizes[i].width) {
                    colEl.style.width = colSizes[i].width + 'px';
                }
            }
        }

        // 3. Copy the colgroup over to the header and footer
        divHeaderTable
            .find('colgroup')
            .remove();

        divHeaderTable.append(settings.colgroup.clone());

        if ( footer ) {
            divFooterTable
                .find('colgroup')
                .remove();

            divFooterTable.append(settings.colgroup.clone());
        }

        // "Hide" the header and footer that we used for the sizing. We need to keep
        // the content of the cell so that the width applied to the header and body
        // both match, but we want to hide it completely.
        $('th, td', headerCopy).each(function () {
            $(this.childNodes).wrapAll('<div class="dt-scroll-sizing">');
        });

        if ( footer ) {
            $('th, td', footerCopy).each(function () {
                $(this.childNodes).wrapAll('<div class="dt-scroll-sizing">');
            });
        }

        // 4. Clean up
        // Figure out if there are scrollbar present - if so then we need a the header and footer to
        // provide a bit more space to allow "overflow" scrolling (i.e. past the scrollbar)
        var isScrolling = Math.floor(table.height()) > divBodyEl.clientHeight || divBody.css('overflow-y') == "scroll";
        var paddingSide = 'padding' + (browser.bScrollbarLeft ? 'Left' : 'Right' );

        // Set the width's of the header and footer tables
        var outerWidth = table.outerWidth();

        divHeaderTable.css('width', _fnStringToCss( outerWidth ));
        divHeaderInner
            .css('width', _fnStringToCss( outerWidth ))
            .css(paddingSide, isScrolling ? barWidth+"px" : "0px");

        if ( footer ) {
            divFooterTable.css('width', _fnStringToCss( outerWidth ));
            divFooterInner
                .css('width', _fnStringToCss( outerWidth ))
                .css(paddingSide, isScrolling ? barWidth+"px" : "0px");
        }

        // Correct DOM ordering for colgroup - comes before the thead
        table.children('colgroup').prependTo(table);

        // Adjust the position of the header in case we loose the y-scrollbar
        divBody.trigger('scroll');

        // If sorting or filtering has occurred, jump the scrolling back to the top
        // only if we aren't holding the position
        if ( (settings.bSorted || settings.bFiltered) && ! settings._drawHold ) {
            divBodyEl.scrollTop = 0;
        }
    }

    /**
     * Calculate the width of columns for the table
     *  @param {object} settings dataTables settings object
     *  @memberof DataTable#oApi
     */
    function _fnCalculateColumnWidths ( settings )
    {
        // Not interested in doing column width calculation if auto-width is disabled
        if (! settings.oFeatures.bAutoWidth) {
            return;
        }

        var
            table = settings.nTable,
            columns = settings.aoColumns,
            scroll = settings.oScroll,
            scrollY = scroll.sY,
            scrollX = scroll.sX,
            scrollXInner = scroll.sXInner,
            visibleColumns = _fnGetColumns( settings, 'bVisible' ),
            tableWidthAttr = table.getAttribute('width'), // from DOM element
            tableContainer = table.parentNode,
            i, column, columnIdx;

        var styleWidth = table.style.width;

        // If there is no width applied as a CSS style or as an attribute, we assume that
        // the width is intended to be 100%, which is usually is in CSS, but it is very
        // difficult to correctly parse the rules to get the final result.
        if ( ! styleWidth && ! tableWidthAttr) {
            table.style.width = '100%';
            styleWidth = '100%';
        }

        if ( styleWidth && styleWidth.indexOf('%') !== -1 ) {
            tableWidthAttr = styleWidth;
        }

        // Let plug-ins know that we are doing a recalc, in case they have changed any of the
        // visible columns their own way (e.g. Responsive uses display:none).
        _fnCallbackFire(
            settings,
            null,
            'column-calc',
            {visible: visibleColumns},
            false
        );

        // Construct a single row, worst case, table with the widest
        // node in the data, assign any user defined widths, then insert it into
        // the DOM and allow the browser to do all the hard work of calculating
        // table widths
        var tmpTable = $(table.cloneNode())
            .css( 'visibility', 'hidden' )
            .removeAttr( 'id' );

        // Clean up the table body
        tmpTable.append('<tbody>')
        var tr = $('<tr/>').appendTo( tmpTable.find('tbody') );

        // Clone the table header and footer - we can't use the header / footer
        // from the cloned table, since if scrolling is active, the table's
        // real header and footer are contained in different table tags
        tmpTable
            .append( $(settings.nTHead).clone() )
            .append( $(settings.nTFoot).clone() );

        // Remove any assigned widths from the footer (from scrolling)
        tmpTable.find('tfoot th, tfoot td').css('width', '');

        // Apply custom sizing to the cloned header
        tmpTable.find('thead th, thead td').each( function () {
            // Get the `width` from the header layout
            var width = _fnColumnsSumWidth( settings, this, true, false );

            if ( width ) {
                this.style.width = width;

                // For scrollX we need to force the column width otherwise the
                // browser will collapse it. If this width is smaller than the
                // width the column requires, then it will have no effect
                if ( scrollX ) {
                    $( this ).append( $('<div/>').css( {
                        width: width,
                        margin: 0,
                        padding: 0,
                        border: 0,
                        height: 1
                    } ) );
                }
            }
            else {
                this.style.width = '';
            }
        } );

        // Find the widest piece of data for each column and put it into the table
        for ( i=0 ; i<visibleColumns.length ; i++ ) {
            columnIdx = visibleColumns[i];
            column = columns[ columnIdx ];

            var longest = _fnGetMaxLenString(settings, columnIdx);
            var autoClass = _ext.type.className[column.sType];
            var text = longest + column.sContentPadding;
            var insert = longest.indexOf('<') === -1
                ? document.createTextNode(text)
                : text

            $('<td/>')
                .addClass(autoClass)
                .addClass(column.sClass)
                .append(insert)
                .appendTo(tr);
        }

        // Tidy the temporary table - remove name attributes so there aren't
        // duplicated in the dom (radio elements for example)
        $('[name]', tmpTable).removeAttr('name');

        // Table has been built, attach to the document so we can work with it.
        // A holding element is used, positioned at the top of the container
        // with minimal height, so it has no effect on if the container scrolls
        // or not. Otherwise it might trigger scrolling when it actually isn't
        // needed
        var holder = $('<div/>').css( scrollX || scrollY ?
            {
                position: 'absolute',
                top: 0,
                left: 0,
                height: 1,
                right: 0,
                overflow: 'hidden'
            } :
            {}
        )
            .append( tmpTable )
            .appendTo( tableContainer );

        // When scrolling (X or Y) we want to set the width of the table as
        // appropriate. However, when not scrolling leave the table width as it
        // is. This results in slightly different, but I think correct behaviour
        if ( scrollX && scrollXInner ) {
            tmpTable.width( scrollXInner );
        }
        else if ( scrollX ) {
            tmpTable.css( 'width', 'auto' );
            tmpTable.removeAttr('width');

            // If there is no width attribute or style, then allow the table to
            // collapse
            if ( tmpTable.width() < tableContainer.clientWidth && tableWidthAttr ) {
                tmpTable.width( tableContainer.clientWidth );
            }
        }
        else if ( scrollY ) {
            tmpTable.width( tableContainer.clientWidth );
        }
        else if ( tableWidthAttr ) {
            tmpTable.width( tableWidthAttr );
        }

        // Get the width of each column in the constructed table
        var total = 0;
        var bodyCells = tmpTable.find('tbody tr').eq(0).children();

        for ( i=0 ; i<visibleColumns.length ; i++ ) {
            // Use getBounding for sub-pixel accuracy, which we then want to round up!
            var bounding = bodyCells[i].getBoundingClientRect().width;

            // Total is tracked to remove any sub-pixel errors as the outerWidth
            // of the table might not equal the total given here
            total += bounding;

            // Width for each column to use
            columns[ visibleColumns[i] ].sWidth = _fnStringToCss( bounding );
        }

        table.style.width = _fnStringToCss( total );

        // Finished with the table - ditch it
        holder.remove();

        // If there is a width attr, we want to attach an event listener which
        // allows the table sizing to automatically adjust when the window is
        // resized. Use the width attr rather than CSS, since we can't know if the
        // CSS is a relative value or absolute - DOM read is always px.
        if ( tableWidthAttr ) {
            table.style.width = _fnStringToCss( tableWidthAttr );
        }

        if ( (tableWidthAttr || scrollX) && ! settings._reszEvt ) {
            var bindResize = function () {
                $(window).on('resize.DT-'+settings.sInstance, DataTable.util.throttle( function () {
                    if (! settings.bDestroying) {
                        _fnAdjustColumnSizing( settings );
                    }
                } ) );
            };

            bindResize();

            settings._reszEvt = true;
        }
    }


    /**
     * Get the maximum strlen for each data column
     *  @param {object} settings dataTables settings object
     *  @param {int} colIdx column of interest
     *  @returns {string} string of the max length
     *  @memberof DataTable#oApi
     */
    function _fnGetMaxLenString( settings, colIdx )
    {
        var column = settings.aoColumns[colIdx];

        if (! column.maxLenString) {
            var s, max='', maxLen = -1;

            for ( var i=0, ien=settings.aiDisplayMaster.length ; i<ien ; i++ ) {
                var rowIdx = settings.aiDisplayMaster[i];
                var data = _fnGetRowDisplay(settings, rowIdx)[colIdx];

                var cellString = data && typeof data === 'object' && data.nodeType
                    ? data.innerHTML
                    : data+'';

                // Remove id / name attributes from elements so they
                // don't interfere with existing elements
                cellString = cellString
                    .replace(/id=".*?"/g, '')
                    .replace(/name=".*?"/g, '');

                s = _stripHtml(cellString)
                    .replace( /&nbsp;/g, ' ' );

                if ( s.length > maxLen ) {
                    // We want the HTML in the string, but the length that
                    // is important is the stripped string
                    max = cellString;
                    maxLen = s.length;
                }
            }

            column.maxLenString = max;
        }

        return column.maxLenString;
    }


    /**
     * Append a CSS unit (only if required) to a string
     *  @param {string} value to css-ify
     *  @returns {string} value with css unit
     *  @memberof DataTable#oApi
     */
    function _fnStringToCss( s )
    {
        if ( s === null ) {
            return '0px';
        }

        if ( typeof s == 'number' ) {
            return s < 0 ?
                '0px' :
                s+'px';
        }

        // Check it has a unit character already
        return s.match(/\d$/) ?
            s+'px' :
            s;
    }

    /**
     * Re-insert the `col` elements for current visibility
     *
     * @param {*} settings DT settings
     */
    function _colGroup( settings ) {
        var cols = settings.aoColumns;

        settings.colgroup.empty();

        for (i=0 ; i<cols.length ; i++) {
            if (cols[i].bVisible) {
                settings.colgroup.append(cols[i].colEl);
            }
        }
    }


    function _fnSortInit( settings ) {
        var target = settings.nTHead;
        var headerRows = target.querySelectorAll('tr');
        var legacyTop = settings.bSortCellsTop;
        var notSelector = ':not([data-dt-order="disable"]):not([data-dt-order="icon-only"])';

        // Legacy support for `orderCellsTop`
        if (legacyTop === true) {
            target = headerRows[0];
        }
        else if (legacyTop === false) {
            target = headerRows[ headerRows.length - 1 ];
        }

        _fnSortAttachListener(
            settings,
            target,
            target === settings.nTHead
                ? 'tr'+notSelector+' th'+notSelector+', tr'+notSelector+' td'+notSelector
                : 'th'+notSelector+', td'+notSelector
        );

        // Need to resolve the user input array into our internal structure
        var order = [];
        _fnSortResolve( settings, order, settings.aaSorting );

        settings.aaSorting = order;
    }


    function _fnSortAttachListener(settings, node, selector, column, callback) {
        _fnBindAction( node, selector, function (e) {
            var run = false;
            var columns = column === undefined
                ? _fnColumnsFromHeader( e.target )
                : [column];

            if ( columns.length ) {
                for ( var i=0, ien=columns.length ; i<ien ; i++ ) {
                    var ret = _fnSortAdd( settings, columns[i], i, e.shiftKey );

                    if (ret !== false) {
                        run = true;
                    }

                    // If the first entry is no sort, then subsequent
                    // sort columns are ignored
                    if (settings.aaSorting.length === 1 && settings.aaSorting[0][1] === '') {
                        break;
                    }
                }

                if (run) {
                    _fnProcessingRun(settings, true, function () {
                        _fnSort( settings );
                        _fnSortDisplay( settings, settings.aiDisplay );

                        _fnReDraw( settings, false, false );

                        if (callback) {
                            callback();
                        }
                    });
                }
            }
        } );
    }

    /**
     * Sort the display array to match the master's order
     * @param {*} settings
     */
    function _fnSortDisplay(settings, display) {
        if (display.length < 2) {
            return;
        }

        var master = settings.aiDisplayMaster;
        var masterMap = {};
        var map = {};
        var i;

        // Rather than needing an `indexOf` on master array, we can create a map
        for (i=0 ; i<master.length ; i++) {
            masterMap[master[i]] = i;
        }

        // And then cache what would be the indexOf fom the display
        for (i=0 ; i<display.length ; i++) {
            map[display[i]] = masterMap[display[i]];
        }

        display.sort(function(a, b){
            // Short version of this function is simply `master.indexOf(a) - master.indexOf(b);`
            return map[a] - map[b];
        });
    }


    function _fnSortResolve (settings, nestedSort, sort) {
        var push = function ( a ) {
            if ($.isPlainObject(a)) {
                if (a.idx !== undefined) {
                    // Index based ordering
                    nestedSort.push([a.idx, a.dir]);
                }
                else if (a.name) {
                    // Name based ordering
                    var cols = _pluck( settings.aoColumns, 'sName');
                    var idx = cols.indexOf(a.name);

                    if (idx !== -1) {
                        nestedSort.push([idx, a.dir]);
                    }
                }
            }
            else {
                // Plain column index and direction pair
                nestedSort.push(a);
            }
        };

        if ( $.isPlainObject(sort) ) {
            // Object
            push(sort);
        }
        else if ( sort.length && typeof sort[0] === 'number' ) {
            // 1D array
            push(sort);
        }
        else if ( sort.length ) {
            // 2D array
            for (var z=0; z<sort.length; z++) {
                push(sort[z]); // Object or array
            }
        }
    }


    function _fnSortFlatten ( settings )
    {
        var
            i, k, kLen,
            aSort = [],
            extSort = DataTable.ext.type.order,
            aoColumns = settings.aoColumns,
            aDataSort, iCol, sType, srcCol,
            fixed = settings.aaSortingFixed,
            fixedObj = $.isPlainObject( fixed ),
            nestedSort = [];

        if ( ! settings.oFeatures.bSort ) {
            return aSort;
        }

        // Build the sort array, with pre-fix and post-fix options if they have been
        // specified
        if ( Array.isArray( fixed ) ) {
            _fnSortResolve( settings, nestedSort, fixed );
        }

        if ( fixedObj && fixed.pre ) {
            _fnSortResolve( settings, nestedSort, fixed.pre );
        }

        _fnSortResolve( settings, nestedSort, settings.aaSorting );

        if (fixedObj && fixed.post ) {
            _fnSortResolve( settings, nestedSort, fixed.post );
        }

        for ( i=0 ; i<nestedSort.length ; i++ )
        {
            srcCol = nestedSort[i][0];

            if ( aoColumns[ srcCol ] ) {
                aDataSort = aoColumns[ srcCol ].aDataSort;

                for ( k=0, kLen=aDataSort.length ; k<kLen ; k++ )
                {
                    iCol = aDataSort[k];
                    sType = aoColumns[ iCol ].sType || 'string';

                    if ( nestedSort[i]._idx === undefined ) {
                        nestedSort[i]._idx = aoColumns[iCol].asSorting.indexOf(nestedSort[i][1]);
                    }

                    if ( nestedSort[i][1] ) {
                        aSort.push( {
                            src:       srcCol,
                            col:       iCol,
                            dir:       nestedSort[i][1],
                            index:     nestedSort[i]._idx,
                            type:      sType,
                            formatter: extSort[ sType+"-pre" ],
                            sorter:    extSort[ sType+"-"+nestedSort[i][1] ]
                        } );
                    }
                }
            }
        }

        return aSort;
    }

    /**
     * Change the order of the table
     *  @param {object} oSettings dataTables settings object
     *  @memberof DataTable#oApi
     */
    function _fnSort ( oSettings, col, dir )
    {
        var
            i, ien, iLen,
            aiOrig = [],
            extSort = DataTable.ext.type.order,
            aoData = oSettings.aoData,
            sortCol,
            displayMaster = oSettings.aiDisplayMaster,
            aSort;

        // Allow a specific column to be sorted, which will _not_ alter the display
        // master
        if (col !== undefined) {
            var srcCol = oSettings.aoColumns[col];
            aSort = [{
                src:       col,
                col:       col,
                dir:       dir,
                index:     0,
                type:      srcCol.sType,
                formatter: extSort[ srcCol.sType+"-pre" ],
                sorter:    extSort[ srcCol.sType+"-"+dir ]
            }];
            displayMaster = displayMaster.slice();
        }
        else {
            aSort = _fnSortFlatten( oSettings );
        }

        for ( i=0, ien=aSort.length ; i<ien ; i++ ) {
            sortCol = aSort[i];

            // Load the data needed for the sort, for each cell
            _fnSortData( oSettings, sortCol.col );
        }

        /* No sorting required if server-side or no sorting array */
        if ( _fnDataSource( oSettings ) != 'ssp' && aSort.length !== 0 )
        {
            // Reset the initial positions on each pass so we get a stable sort
            for ( i=0, iLen=displayMaster.length ; i<iLen ; i++ ) {
                aiOrig[ i ] = i;
            }

            // If the first sort is desc, then reverse the array to preserve original
            // order, just in reverse
            if (aSort.length && aSort[0].dir === 'desc' && oSettings.orderDescReverse) {
                aiOrig.reverse();
            }

            /* Do the sort - here we want multi-column sorting based on a given data source (column)
			 * and sorting function (from oSort) in a certain direction. It's reasonably complex to
			 * follow on it's own, but this is what we want (example two column sorting):
			 *  fnLocalSorting = function(a,b){
			 *    var test;
			 *    test = oSort['string-asc']('data11', 'data12');
			 *      if (test !== 0)
			 *        return test;
			 *    test = oSort['numeric-desc']('data21', 'data22');
			 *    if (test !== 0)
			 *      return test;
			 *    return oSort['numeric-asc']( aiOrig[a], aiOrig[b] );
			 *  }
			 * Basically we have a test for each sorting column, if the data in that column is equal,
			 * test the next column. If all columns match, then we use a numeric sort on the row
			 * positions in the original data array to provide a stable sort.
			 */
            displayMaster.sort( function ( a, b ) {
                var
                    x, y, k, test, sort,
                    len=aSort.length,
                    dataA = aoData[a]._aSortData,
                    dataB = aoData[b]._aSortData;

                for ( k=0 ; k<len ; k++ ) {
                    sort = aSort[k];

                    // Data, which may have already been through a `-pre` function
                    x = dataA[ sort.col ];
                    y = dataB[ sort.col ];

                    if (sort.sorter) {
                        // If there is a custom sorter (`-asc` or `-desc`) for this
                        // data type, use it
                        test = sort.sorter(x, y);

                        if ( test !== 0 ) {
                            return test;
                        }
                    }
                    else {
                        // Otherwise, use generic sorting
                        test = x<y ? -1 : x>y ? 1 : 0;

                        if ( test !== 0 ) {
                            return sort.dir === 'asc' ? test : -test;
                        }
                    }
                }

                x = aiOrig[a];
                y = aiOrig[b];

                return x<y ? -1 : x>y ? 1 : 0;
            } );
        }
        else if ( aSort.length === 0 ) {
            // Apply index order
            displayMaster.sort(function (x, y) {
                return x<y ? -1 : x>y ? 1 : 0;
            });
        }

        if (col === undefined) {
            // Tell the draw function that we have sorted the data
            oSettings.bSorted = true;
            oSettings.sortDetails = aSort;

            _fnCallbackFire( oSettings, null, 'order', [oSettings, aSort] );
        }

        return displayMaster;
    }


    /**
     * Function to run on user sort request
     *  @param {object} settings dataTables settings object
     *  @param {node} attachTo node to attach the handler to
     *  @param {int} colIdx column sorting index
     *  @param {int} addIndex Counter
     *  @param {boolean} [shift=false] Shift click add
     *  @param {function} [callback] callback function
     *  @memberof DataTable#oApi
     */
    function _fnSortAdd ( settings, colIdx, addIndex, shift )
    {
        var col = settings.aoColumns[ colIdx ];
        var sorting = settings.aaSorting;
        var asSorting = col.asSorting;
        var nextSortIdx;
        var next = function ( a, overflow ) {
            var idx = a._idx;
            if ( idx === undefined ) {
                idx = asSorting.indexOf(a[1]);
            }

            return idx+1 < asSorting.length ?
                idx+1 :
                overflow ?
                    null :
                    0;
        };

        if ( ! col.bSortable ) {
            return false;
        }

        // Convert to 2D array if needed
        if ( typeof sorting[0] === 'number' ) {
            sorting = settings.aaSorting = [ sorting ];
        }

        // If appending the sort then we are multi-column sorting
        if ( (shift || addIndex) && settings.oFeatures.bSortMulti ) {
            // Are we already doing some kind of sort on this column?
            var sortIdx = _pluck(sorting, '0').indexOf(colIdx);

            if ( sortIdx !== -1 ) {
                // Yes, modify the sort
                nextSortIdx = next( sorting[sortIdx], true );

                if ( nextSortIdx === null && sorting.length === 1 ) {
                    nextSortIdx = 0; // can't remove sorting completely
                }

                if ( nextSortIdx === null ) {
                    sorting.splice( sortIdx, 1 );
                }
                else {
                    sorting[sortIdx][1] = asSorting[ nextSortIdx ];
                    sorting[sortIdx]._idx = nextSortIdx;
                }
            }
            else if (shift) {
                // No sort on this column yet, being added by shift click
                // add it as itself
                sorting.push( [ colIdx, asSorting[0], 0 ] );
                sorting[sorting.length-1]._idx = 0;
            }
            else {
                // No sort on this column yet, being added from a colspan
                // so add with same direction as first column
                sorting.push( [ colIdx, sorting[0][1], 0 ] );
                sorting[sorting.length-1]._idx = 0;
            }
        }
        else if ( sorting.length && sorting[0][0] == colIdx ) {
            // Single column - already sorting on this column, modify the sort
            nextSortIdx = next( sorting[0] );

            sorting.length = 1;
            sorting[0][1] = asSorting[ nextSortIdx ];
            sorting[0]._idx = nextSortIdx;
        }
        else {
            // Single column - sort only on this column
            sorting.length = 0;
            sorting.push( [ colIdx, asSorting[0] ] );
            sorting[0]._idx = 0;
        }
    }


    /**
     * Set the sorting classes on table's body, Note: it is safe to call this function
     * when bSort and bSortClasses are false
     *  @param {object} oSettings dataTables settings object
     *  @memberof DataTable#oApi
     */
    function _fnSortingClasses( settings )
    {
        var oldSort = settings.aLastSort;
        var sortClass = settings.oClasses.order.position;
        var sort = _fnSortFlatten( settings );
        var features = settings.oFeatures;
        var i, ien, colIdx;

        if ( features.bSort && features.bSortClasses ) {
            // Remove old sorting classes
            for ( i=0, ien=oldSort.length ; i<ien ; i++ ) {
                colIdx = oldSort[i].src;

                // Remove column sorting
                $( _pluck( settings.aoData, 'anCells', colIdx ) )
                    .removeClass( sortClass + (i<2 ? i+1 : 3) );
            }

            // Add new column sorting
            for ( i=0, ien=sort.length ; i<ien ; i++ ) {
                colIdx = sort[i].src;

                $( _pluck( settings.aoData, 'anCells', colIdx ) )
                    .addClass( sortClass + (i<2 ? i+1 : 3) );
            }
        }

        settings.aLastSort = sort;
    }


    // Get the data to sort a column, be it from cache, fresh (populating the
    // cache), or from a sort formatter
    function _fnSortData( settings, colIdx )
    {
        // Custom sorting function - provided by the sort data type
        var column = settings.aoColumns[ colIdx ];
        var customSort = DataTable.ext.order[ column.sSortDataType ];
        var customData;

        if ( customSort ) {
            customData = customSort.call( settings.oInstance, settings, colIdx,
                _fnColumnIndexToVisible( settings, colIdx )
            );
        }

        // Use / populate cache
        var row, cellData;
        var formatter = DataTable.ext.type.order[ column.sType+"-pre" ];
        var data = settings.aoData;

        for ( var rowIdx=0 ; rowIdx<data.length ; rowIdx++ ) {
            // Sparse array
            if (! data[rowIdx]) {
                continue;
            }

            row = data[rowIdx];

            if ( ! row._aSortData ) {
                row._aSortData = [];
            }

            if ( ! row._aSortData[colIdx] || customSort ) {
                cellData = customSort ?
                    customData[rowIdx] : // If there was a custom sort function, use data from there
                    _fnGetCellData( settings, rowIdx, colIdx, 'sort' );

                row._aSortData[ colIdx ] = formatter ?
                    formatter( cellData, settings ) :
                    cellData;
            }
        }
    }


    /**
     * State information for a table
     *
     * @param {*} settings
     * @returns State object
     */
    function _fnSaveState ( settings )
    {
        if (settings._bLoadingState) {
            return;
        }

        /* Store the interesting variables */
        var state = {
            time:    +new Date(),
            start:   settings._iDisplayStart,
            length:  settings._iDisplayLength,
            order:   $.extend( true, [], settings.aaSorting ),
            search:  $.extend({}, settings.oPreviousSearch),
            columns: settings.aoColumns.map( function ( col, i ) {
                return {
                    visible: col.bVisible,
                    search: $.extend({}, settings.aoPreSearchCols[i])
                };
            } )
        };

        settings.oSavedState = state;
        _fnCallbackFire( settings, "aoStateSaveParams", 'stateSaveParams', [settings, state] );

        if ( settings.oFeatures.bStateSave && !settings.bDestroying )
        {
            settings.fnStateSaveCallback.call( settings.oInstance, settings, state );
        }
    }


    /**
     * Attempt to load a saved table state
     *  @param {object} oSettings dataTables settings object
     *  @param {object} oInit DataTables init object so we can override settings
     *  @param {function} callback Callback to execute when the state has been loaded
     *  @memberof DataTable#oApi
     */
    function _fnLoadState ( settings, init, callback )
    {
        if ( ! settings.oFeatures.bStateSave ) {
            callback();
            return;
        }

        var loaded = function(state) {
            _fnImplementState(settings, state, callback);
        }

        var state = settings.fnStateLoadCallback.call( settings.oInstance, settings, loaded );

        if ( state !== undefined ) {
            _fnImplementState( settings, state, callback );
        }
        // otherwise, wait for the loaded callback to be executed

        return true;
    }

    function _fnImplementState ( settings, s, callback) {
        var i, ien;
        var columns = settings.aoColumns;
        settings._bLoadingState = true;

        // When StateRestore was introduced the state could now be implemented at any time
        // Not just initialisation. To do this an api instance is required in some places
        var api = settings._bInitComplete ? new DataTable.Api(settings) : null;

        if ( ! s || ! s.time ) {
            settings._bLoadingState = false;
            callback();
            return;
        }

        // Reject old data
        var duration = settings.iStateDuration;
        if ( duration > 0 && s.time < +new Date() - (duration*1000) ) {
            settings._bLoadingState = false;
            callback();
            return;
        }

        // Allow custom and plug-in manipulation functions to alter the saved data set and
        // cancelling of loading by returning false
        var abStateLoad = _fnCallbackFire( settings, 'aoStateLoadParams', 'stateLoadParams', [settings, s] );
        if ( abStateLoad.indexOf(false) !== -1 ) {
            settings._bLoadingState = false;
            callback();
            return;
        }

        // Number of columns have changed - all bets are off, no restore of settings
        if ( s.columns && columns.length !== s.columns.length ) {
            settings._bLoadingState = false;
            callback();
            return;
        }

        // Store the saved state so it might be accessed at any time
        settings.oLoadedState = $.extend( true, {}, s );

        // This is needed for ColReorder, which has to happen first to allow all
        // the stored indexes to be usable. It is not publicly documented.
        _fnCallbackFire( settings, null, 'stateLoadInit', [settings, s], true );

        // Page Length
        if ( s.length !== undefined ) {
            // If already initialised just set the value directly so that the select element is also updated
            if (api) {
                api.page.len(s.length)
            }
            else {
                settings._iDisplayLength   = s.length;
            }
        }

        // Restore key features - todo - for 1.11 this needs to be done by
        // subscribed events
        if ( s.start !== undefined ) {
            if(api === null) {
                settings._iDisplayStart    = s.start;
                settings.iInitDisplayStart = s.start;
            }
            else {
                _fnPageChange(settings, s.start/settings._iDisplayLength);
            }
        }

        // Order
        if ( s.order !== undefined ) {
            settings.aaSorting = [];
            $.each( s.order, function ( i, col ) {
                settings.aaSorting.push( col[0] >= columns.length ?
                    [ 0, col[1] ] :
                    col
                );
            } );
        }

        // Search
        if ( s.search !== undefined ) {
            $.extend( settings.oPreviousSearch, s.search );
        }

        // Columns
        if ( s.columns ) {
            for ( i=0, ien=s.columns.length ; i<ien ; i++ ) {
                var col = s.columns[i];

                // Visibility
                if ( col.visible !== undefined ) {
                    // If the api is defined, the table has been initialised so we need to use it rather than internal settings
                    if (api) {
                        // Don't redraw the columns on every iteration of this loop, we will do this at the end instead
                        api.column(i).visible(col.visible, false);
                    }
                    else {
                        columns[i].bVisible = col.visible;
                    }
                }

                // Search
                if ( col.search !== undefined ) {
                    $.extend( settings.aoPreSearchCols[i], col.search );
                }
            }

            // If the api is defined then we need to adjust the columns once the visibility has been changed
            if (api) {
                api.columns.adjust();
            }
        }

        settings._bLoadingState = false;
        _fnCallbackFire( settings, 'aoStateLoaded', 'stateLoaded', [settings, s] );
        callback();
    }

    /**
     * Log an error message
     *  @param {object} settings dataTables settings object
     *  @param {int} level log error messages, or display them to the user
     *  @param {string} msg error message
     *  @param {int} tn Technical note id to get more information about the error.
     *  @memberof DataTable#oApi
     */
    function _fnLog( settings, level, msg, tn )
    {
        msg = 'DataTables warning: '+
            (settings ? 'table id='+settings.sTableId+' - ' : '')+msg;

        if ( tn ) {
            msg += '. For more information about this error, please see '+
                'https://datatables.net/tn/'+tn;
        }

        if ( ! level  ) {
            // Backwards compatibility pre 1.10
            var ext = DataTable.ext;
            var type = ext.sErrMode || ext.errMode;

            if ( settings ) {
                _fnCallbackFire( settings, null, 'dt-error', [ settings, tn, msg ], true );
            }

            if ( type == 'alert' ) {
                alert( msg );
            }
            else if ( type == 'throw' ) {
                throw new Error(msg);
            }
            else if ( typeof type == 'function' ) {
                type( settings, tn, msg );
            }
        }
        else if ( window.console && console.log ) {
            console.log( msg );
        }
    }


    /**
     * See if a property is defined on one object, if so assign it to the other object
     *  @param {object} ret target object
     *  @param {object} src source object
     *  @param {string} name property
     *  @param {string} [mappedName] name to map too - optional, name used if not given
     *  @memberof DataTable#oApi
     */
    function _fnMap( ret, src, name, mappedName )
    {
        if ( Array.isArray( name ) ) {
            $.each( name, function (i, val) {
                if ( Array.isArray( val ) ) {
                    _fnMap( ret, src, val[0], val[1] );
                }
                else {
                    _fnMap( ret, src, val );
                }
            } );

            return;
        }

        if ( mappedName === undefined ) {
            mappedName = name;
        }

        if ( src[name] !== undefined ) {
            ret[mappedName] = src[name];
        }
    }


    /**
     * Extend objects - very similar to jQuery.extend, but deep copy objects, and
     * shallow copy arrays. The reason we need to do this, is that we don't want to
     * deep copy array init values (such as aaSorting) since the dev wouldn't be
     * able to override them, but we do want to deep copy arrays.
     *  @param {object} out Object to extend
     *  @param {object} extender Object from which the properties will be applied to
     *      out
     *  @param {boolean} breakRefs If true, then arrays will be sliced to take an
     *      independent copy with the exception of the `data` or `aaData` parameters
     *      if they are present. This is so you can pass in a collection to
     *      DataTables and have that used as your data source without breaking the
     *      references
     *  @returns {object} out Reference, just for convenience - out === the return.
     *  @memberof DataTable#oApi
     *  @todo This doesn't take account of arrays inside the deep copied objects.
     */
    function _fnExtend( out, extender, breakRefs )
    {
        var val;

        for ( var prop in extender ) {
            if ( Object.prototype.hasOwnProperty.call(extender, prop) ) {
                val = extender[prop];

                if ( $.isPlainObject( val ) ) {
                    if ( ! $.isPlainObject( out[prop] ) ) {
                        out[prop] = {};
                    }
                    $.extend( true, out[prop], val );
                }
                else if ( breakRefs && prop !== 'data' && prop !== 'aaData' && Array.isArray(val) ) {
                    out[prop] = val.slice();
                }
                else {
                    out[prop] = val;
                }
            }
        }

        return out;
    }


    /**
     * Bind an event handers to allow a click or return key to activate the callback.
     * This is good for accessibility since a return on the keyboard will have the
     * same effect as a click, if the element has focus.
     *  @param {element} n Element to bind the action to
     *  @param {object|string} selector Selector (for delegated events) or data object
     *   to pass to the triggered function
     *  @param {function} fn Callback function for when the event is triggered
     *  @memberof DataTable#oApi
     */
    function _fnBindAction( n, selector, fn )
    {
        $(n)
            .on( 'click.DT', selector, function (e) {
                fn(e);
            } )
            .on( 'keypress.DT', selector, function (e){
                if ( e.which === 13 ) {
                    e.preventDefault();
                    fn(e);
                }
            } )
            .on( 'selectstart.DT', selector, function () {
                // Don't want a double click resulting in text selection
                return false;
            } );
    }


    /**
     * Register a callback function. Easily allows a callback function to be added to
     * an array store of callback functions that can then all be called together.
     *  @param {object} settings dataTables settings object
     *  @param {string} store Name of the array storage for the callbacks in oSettings
     *  @param {function} fn Function to be called back
     *  @memberof DataTable#oApi
     */
    function _fnCallbackReg( settings, store, fn )
    {
        if ( fn ) {
            settings[store].push(fn);
        }
    }


    /**
     * Fire callback functions and trigger events. Note that the loop over the
     * callback array store is done backwards! Further note that you do not want to
     * fire off triggers in time sensitive applications (for example cell creation)
     * as its slow.
     *  @param {object} settings dataTables settings object
     *  @param {string} callbackArr Name of the array storage for the callbacks in
     *      oSettings
     *  @param {string} eventName Name of the jQuery custom event to trigger. If
     *      null no trigger is fired
     *  @param {array} args Array of arguments to pass to the callback function /
     *      trigger
     *  @param {boolean} [bubbles] True if the event should bubble
     *  @memberof DataTable#oApi
     */
    function _fnCallbackFire( settings, callbackArr, eventName, args, bubbles )
    {
        var ret = [];

        if ( callbackArr ) {
            ret = settings[callbackArr].slice().reverse().map( function (val) {
                return val.apply( settings.oInstance, args );
            } );
        }

        if ( eventName !== null) {
            var e = $.Event( eventName+'.dt' );
            var table = $(settings.nTable);

            // Expose the DataTables API on the event object for easy access
            e.dt = settings.api;

            table[bubbles ?  'trigger' : 'triggerHandler']( e, args );

            // If not yet attached to the document, trigger the event
            // on the body directly to sort of simulate the bubble
            if (bubbles && table.parents('body').length === 0) {
                $('body').trigger( e, args );
            }

            ret.push( e.result );
        }

        return ret;
    }


    function _fnLengthOverflow ( settings )
    {
        var
            start = settings._iDisplayStart,
            end = settings.fnDisplayEnd(),
            len = settings._iDisplayLength;

        /* If we have space to show extra rows (backing up from the end point - then do so */
        if ( start >= end )
        {
            start = end - len;
        }

        // Keep the start record on the current page
        start -= (start % len);

        if ( len === -1 || start < 0 )
        {
            start = 0;
        }

        settings._iDisplayStart = start;
    }


    function _fnRenderer( settings, type )
    {
        var renderer = settings.renderer;
        var host = DataTable.ext.renderer[type];

        if ( $.isPlainObject( renderer ) && renderer[type] ) {
            // Specific renderer for this type. If available use it, otherwise use
            // the default.
            return host[renderer[type]] || host._;
        }
        else if ( typeof renderer === 'string' ) {
            // Common renderer - if there is one available for this type use it,
            // otherwise use the default
            return host[renderer] || host._;
        }

        // Use the default
        return host._;
    }


    /**
     * Detect the data source being used for the table. Used to simplify the code
     * a little (ajax) and to make it compress a little smaller.
     *
     *  @param {object} settings dataTables settings object
     *  @returns {string} Data source
     *  @memberof DataTable#oApi
     */
    function _fnDataSource ( settings )
    {
        if ( settings.oFeatures.bServerSide ) {
            return 'ssp';
        }
        else if ( settings.ajax ) {
            return 'ajax';
        }
        return 'dom';
    }

    /**
     * Common replacement for language strings
     *
     * @param {*} settings DT settings object
     * @param {*} str String with values to replace
     * @param {*} entries Plural number for _ENTRIES_ - can be undefined
     * @returns String
     */
    function _fnMacros ( settings, str, entries )
    {
        // When infinite scrolling, we are always starting at 1. _iDisplayStart is
        // used only internally
        var
            formatter  = settings.fnFormatNumber,
            start      = settings._iDisplayStart+1,
            len        = settings._iDisplayLength,
            vis        = settings.fnRecordsDisplay(),
            max        = settings.fnRecordsTotal(),
            all        = len === -1;

        return str.
        replace(/_START_/g, formatter.call( settings, start ) ).
        replace(/_END_/g,   formatter.call( settings, settings.fnDisplayEnd() ) ).
        replace(/_MAX_/g,   formatter.call( settings, max ) ).
        replace(/_TOTAL_/g, formatter.call( settings, vis ) ).
        replace(/_PAGE_/g,  formatter.call( settings, all ? 1 : Math.ceil( start / len ) ) ).
        replace(/_PAGES_/g, formatter.call( settings, all ? 1 : Math.ceil( vis / len ) ) ).
        replace(/_ENTRIES_/g, settings.api.i18n('entries', '', entries) ).
        replace(/_ENTRIES-MAX_/g, settings.api.i18n('entries', '', max) ).
        replace(/_ENTRIES-TOTAL_/g, settings.api.i18n('entries', '', vis) );
    }



    /**
     * Computed structure of the DataTables API, defined by the options passed to
     * `DataTable.Api.register()` when building the API.
     *
     * The structure is built in order to speed creation and extension of the Api
     * objects since the extensions are effectively pre-parsed.
     *
     * The array is an array of objects with the following structure, where this
     * base array represents the Api prototype base:
     *
     *     [
     *       {
     *         name:      'data'                -- string   - Property name
     *         val:       function () {},       -- function - Api method (or undefined if just an object
     *         methodExt: [ ... ],              -- array    - Array of Api object definitions to extend the method result
     *         propExt:   [ ... ]               -- array    - Array of Api object definitions to extend the property
     *       },
     *       {
     *         name:     'row'
     *         val:       {},
     *         methodExt: [ ... ],
     *         propExt:   [
     *           {
     *             name:      'data'
     *             val:       function () {},
     *             methodExt: [ ... ],
     *             propExt:   [ ... ]
     *           },
     *           ...
     *         ]
     *       }
     *     ]
     *
     * @type {Array}
     * @ignore
     */
    var __apiStruct = [];


    /**
     * `Array.prototype` reference.
     *
     * @type object
     * @ignore
     */
    var __arrayProto = Array.prototype;


    /**
     * Abstraction for `context` parameter of the `Api` constructor to allow it to
     * take several different forms for ease of use.
     *
     * Each of the input parameter types will be converted to a DataTables settings
     * object where possible.
     *
     * @param  {string|node|jQuery|object} mixed DataTable identifier. Can be one
     *   of:
     *
     *   * `string` - jQuery selector. Any DataTables' matching the given selector
     *     with be found and used.
     *   * `node` - `TABLE` node which has already been formed into a DataTable.
     *   * `jQuery` - A jQuery object of `TABLE` nodes.
     *   * `object` - DataTables settings object
     *   * `DataTables.Api` - API instance
     * @return {array|null} Matching DataTables settings objects. `null` or
     *   `undefined` is returned if no matching DataTable is found.
     * @ignore
     */
    var _toSettings = function ( mixed )
    {
        var idx, jq;
        var settings = DataTable.settings;
        var tables = _pluck(settings, 'nTable');

        if ( ! mixed ) {
            return [];
        }
        else if ( mixed.nTable && mixed.oFeatures ) {
            // DataTables settings object
            return [ mixed ];
        }
        else if ( mixed.nodeName && mixed.nodeName.toLowerCase() === 'table' ) {
            // Table node
            idx = tables.indexOf(mixed);
            return idx !== -1 ? [ settings[idx] ] : null;
        }
        else if ( mixed && typeof mixed.settings === 'function' ) {
            return mixed.settings().toArray();
        }
        else if ( typeof mixed === 'string' ) {
            // jQuery selector
            jq = $(mixed).get();
        }
        else if ( mixed instanceof $ ) {
            // jQuery object (also DataTables instance)
            jq = mixed.get();
        }

        if ( jq ) {
            return settings.filter(function (v, idx) {
                return jq.includes(tables[idx]);
            });
        }
    };


    /**
     * DataTables API class - used to control and interface with  one or more
     * DataTables enhanced tables.
     *
     * The API class is heavily based on jQuery, presenting a chainable interface
     * that you can use to interact with tables. Each instance of the API class has
     * a "context" - i.e. the tables that it will operate on. This could be a single
     * table, all tables on a page or a sub-set thereof.
     *
     * Additionally the API is designed to allow you to easily work with the data in
     * the tables, retrieving and manipulating it as required. This is done by
     * presenting the API class as an array like interface. The contents of the
     * array depend upon the actions requested by each method (for example
     * `rows().nodes()` will return an array of nodes, while `rows().data()` will
     * return an array of objects or arrays depending upon your table's
     * configuration). The API object has a number of array like methods (`push`,
     * `pop`, `reverse` etc) as well as additional helper methods (`each`, `pluck`,
     * `unique` etc) to assist your working with the data held in a table.
     *
     * Most methods (those which return an Api instance) are chainable, which means
     * the return from a method call also has all of the methods available that the
     * top level object had. For example, these two calls are equivalent:
     *
     *     // Not chained
     *     api.row.add( {...} );
     *     api.draw();
     *
     *     // Chained
     *     api.row.add( {...} ).draw();
     *
     * @class DataTable.Api
     * @param {array|object|string|jQuery} context DataTable identifier. This is
     *   used to define which DataTables enhanced tables this API will operate on.
     *   Can be one of:
     *
     *   * `string` - jQuery selector. Any DataTables' matching the given selector
     *     with be found and used.
     *   * `node` - `TABLE` node which has already been formed into a DataTable.
     *   * `jQuery` - A jQuery object of `TABLE` nodes.
     *   * `object` - DataTables settings object
     * @param {array} [data] Data to initialise the Api instance with.
     *
     * @example
     *   // Direct initialisation during DataTables construction
     *   var api = $('#example').DataTable();
     *
     * @example
     *   // Initialisation using a DataTables jQuery object
     *   var api = $('#example').dataTable().api();
     *
     * @example
     *   // Initialisation as a constructor
     *   var api = new DataTable.Api( 'table.dataTable' );
     */
    _Api = function ( context, data )
    {
        if ( ! (this instanceof _Api) ) {
            return new _Api( context, data );
        }

        var settings = [];
        var ctxSettings = function ( o ) {
            var a = _toSettings( o );
            if ( a ) {
                settings.push.apply( settings, a );
            }
        };

        if ( Array.isArray( context ) ) {
            for ( var i=0, ien=context.length ; i<ien ; i++ ) {
                ctxSettings( context[i] );
            }
        }
        else {
            ctxSettings( context );
        }

        // Remove duplicates
        this.context = settings.length > 1
            ? _unique( settings )
            : settings;

        // Initial data
        if ( data ) {
            this.push.apply(this, data);
        }

        // selector
        this.selector = {
            rows: null,
            cols: null,
            opts: null
        };

        _Api.extend( this, this, __apiStruct );
    };

    DataTable.Api = _Api;

    // Don't destroy the existing prototype, just extend it. Required for jQuery 2's
    // isPlainObject.
    $.extend( _Api.prototype, {
        any: function ()
        {
            return this.count() !== 0;
        },

        context: [], // array of table settings objects

        count: function ()
        {
            return this.flatten().length;
        },

        each: function ( fn )
        {
            for ( var i=0, ien=this.length ; i<ien; i++ ) {
                fn.call( this, this[i], i, this );
            }

            return this;
        },

        eq: function ( idx )
        {
            var ctx = this.context;

            return ctx.length > idx ?
                new _Api( ctx[idx], this[idx] ) :
                null;
        },

        filter: function ( fn )
        {
            var a = __arrayProto.filter.call( this, fn, this );

            return new _Api( this.context, a );
        },

        flatten: function ()
        {
            var a = [];

            return new _Api( this.context, a.concat.apply( a, this.toArray() ) );
        },

        get: function ( idx )
        {
            return this[ idx ];
        },

        join:    __arrayProto.join,

        includes: function ( find ) {
            return this.indexOf( find ) === -1 ? false : true;
        },

        indexOf: __arrayProto.indexOf,

        iterator: function ( flatten, type, fn, alwaysNew ) {
            var
                a = [], ret,
                i, ien, j, jen,
                context = this.context,
                rows, items, item,
                selector = this.selector;

            // Argument shifting
            if ( typeof flatten === 'string' ) {
                alwaysNew = fn;
                fn = type;
                type = flatten;
                flatten = false;
            }

            for ( i=0, ien=context.length ; i<ien ; i++ ) {
                var apiInst = new _Api( context[i] );

                if ( type === 'table' ) {
                    ret = fn.call( apiInst, context[i], i );

                    if ( ret !== undefined ) {
                        a.push( ret );
                    }
                }
                else if ( type === 'columns' || type === 'rows' ) {
                    // this has same length as context - one entry for each table
                    ret = fn.call( apiInst, context[i], this[i], i );

                    if ( ret !== undefined ) {
                        a.push( ret );
                    }
                }
                else if ( type === 'every' || type === 'column' || type === 'column-rows' || type === 'row' || type === 'cell' ) {
                    // columns and rows share the same structure.
                    // 'this' is an array of column indexes for each context
                    items = this[i];

                    if ( type === 'column-rows' ) {
                        rows = _selector_row_indexes( context[i], selector.opts );
                    }

                    for ( j=0, jen=items.length ; j<jen ; j++ ) {
                        item = items[j];

                        if ( type === 'cell' ) {
                            ret = fn.call( apiInst, context[i], item.row, item.column, i, j );
                        }
                        else {
                            ret = fn.call( apiInst, context[i], item, i, j, rows );
                        }

                        if ( ret !== undefined ) {
                            a.push( ret );
                        }
                    }
                }
            }

            if ( a.length || alwaysNew ) {
                var api = new _Api( context, flatten ? a.concat.apply( [], a ) : a );
                var apiSelector = api.selector;
                apiSelector.rows = selector.rows;
                apiSelector.cols = selector.cols;
                apiSelector.opts = selector.opts;
                return api;
            }
            return this;
        },

        lastIndexOf: __arrayProto.lastIndexOf,

        length:  0,

        map: function ( fn )
        {
            var a = __arrayProto.map.call( this, fn, this );

            return new _Api( this.context, a );
        },

        pluck: function ( prop )
        {
            var fn = DataTable.util.get(prop);

            return this.map( function ( el ) {
                return fn(el);
            } );
        },

        pop:     __arrayProto.pop,

        push:    __arrayProto.push,

        reduce: __arrayProto.reduce,

        reduceRight: __arrayProto.reduceRight,

        reverse: __arrayProto.reverse,

        // Object with rows, columns and opts
        selector: null,

        shift:   __arrayProto.shift,

        slice: function () {
            return new _Api( this.context, this );
        },

        sort:    __arrayProto.sort,

        splice:  __arrayProto.splice,

        toArray: function ()
        {
            return __arrayProto.slice.call( this );
        },

        to$: function ()
        {
            return $( this );
        },

        toJQuery: function ()
        {
            return $( this );
        },

        unique: function ()
        {
            return new _Api( this.context, _unique(this.toArray()) );
        },

        unshift: __arrayProto.unshift
    } );


    function _api_scope( scope, fn, struc ) {
        return function () {
            var ret = fn.apply( scope || this, arguments );

            // Method extension
            _Api.extend( ret, ret, struc.methodExt );
            return ret;
        };
    }

    function _api_find( src, name ) {
        for ( var i=0, ien=src.length ; i<ien ; i++ ) {
            if ( src[i].name === name ) {
                return src[i];
            }
        }
        return null;
    }

    window.__apiStruct = __apiStruct;

    _Api.extend = function ( scope, obj, ext )
    {
        // Only extend API instances and static properties of the API
        if ( ! ext.length || ! obj || ( ! (obj instanceof _Api) && ! obj.__dt_wrapper ) ) {
            return;
        }

        var
            i, ien,
            struct;

        for ( i=0, ien=ext.length ; i<ien ; i++ ) {
            struct = ext[i];

            if (struct.name === '__proto__') {
                continue;
            }

            // Value
            obj[ struct.name ] = struct.type === 'function' ?
                _api_scope( scope, struct.val, struct ) :
                struct.type === 'object' ?
                    {} :
                    struct.val;

            obj[ struct.name ].__dt_wrapper = true;

            // Property extension
            _Api.extend( scope, obj[ struct.name ], struct.propExt );
        }
    };

    //     [
    //       {
    //         name:      'data'                -- string   - Property name
    //         val:       function () {},       -- function - Api method (or undefined if just an object
    //         methodExt: [ ... ],              -- array    - Array of Api object definitions to extend the method result
    //         propExt:   [ ... ]               -- array    - Array of Api object definitions to extend the property
    //       },
    //       {
    //         name:     'row'
    //         val:       {},
    //         methodExt: [ ... ],
    //         propExt:   [
    //           {
    //             name:      'data'
    //             val:       function () {},
    //             methodExt: [ ... ],
    //             propExt:   [ ... ]
    //           },
    //           ...
    //         ]
    //       }
    //     ]


    _Api.register = _api_register = function ( name, val )
    {
        if ( Array.isArray( name ) ) {
            for ( var j=0, jen=name.length ; j<jen ; j++ ) {
                _Api.register( name[j], val );
            }
            return;
        }

        var
            i, ien,
            heir = name.split('.'),
            struct = __apiStruct,
            key, method;

        for ( i=0, ien=heir.length ; i<ien ; i++ ) {
            method = heir[i].indexOf('()') !== -1;
            key = method ?
                heir[i].replace('()', '') :
                heir[i];

            var src = _api_find( struct, key );
            if ( ! src ) {
                src = {
                    name:      key,
                    val:       {},
                    methodExt: [],
                    propExt:   [],
                    type:      'object'
                };
                struct.push( src );
            }

            if ( i === ien-1 ) {
                src.val = val;
                src.type = typeof val === 'function' ?
                    'function' :
                    $.isPlainObject( val ) ?
                        'object' :
                        'other';
            }
            else {
                struct = method ?
                    src.methodExt :
                    src.propExt;
            }
        }
    };

    _Api.registerPlural = _api_registerPlural = function ( pluralName, singularName, val ) {
        _Api.register( pluralName, val );

        _Api.register( singularName, function () {
            var ret = val.apply( this, arguments );

            if ( ret === this ) {
                // Returned item is the API instance that was passed in, return it
                return this;
            }
            else if ( ret instanceof _Api ) {
                // New API instance returned, want the value from the first item
                // in the returned array for the singular result.
                return ret.length ?
                    Array.isArray( ret[0] ) ?
                        new _Api( ret.context, ret[0] ) : // Array results are 'enhanced'
                        ret[0] :
                    undefined;
            }

            // Non-API return - just fire it back
            return ret;
        } );
    };


    /**
     * Selector for HTML tables. Apply the given selector to the give array of
     * DataTables settings objects.
     *
     * @param {string|integer} [selector] jQuery selector string or integer
     * @param  {array} Array of DataTables settings objects to be filtered
     * @return {array}
     * @ignore
     */
    var __table_selector = function ( selector, a )
    {
        if ( Array.isArray(selector) ) {
            var result = [];

            selector.forEach(function (sel) {
                var inner = __table_selector(sel, a);

                result.push.apply(result, inner);
            });

            return result.filter( function (item) {
                return item;
            });
        }

        // Integer is used to pick out a table by index
        if ( typeof selector === 'number' ) {
            return [ a[ selector ] ];
        }

        // Perform a jQuery selector on the table nodes
        var nodes = a.map( function (el) {
            return el.nTable;
        } );

        return $(nodes)
            .filter( selector )
            .map( function () {
                // Need to translate back from the table node to the settings
                var idx = nodes.indexOf(this);
                return a[ idx ];
            } )
            .toArray();
    };



    /**
     * Context selector for the API's context (i.e. the tables the API instance
     * refers to.
     *
     * @name    DataTable.Api#tables
     * @param {string|integer} [selector] Selector to pick which tables the iterator
     *   should operate on. If not given, all tables in the current context are
     *   used. This can be given as a jQuery selector (for example `':gt(0)'`) to
     *   select multiple tables or as an integer to select a single table.
     * @returns {DataTable.Api} Returns a new API instance if a selector is given.
     */
    _api_register( 'tables()', function ( selector ) {
        // A new instance is created if there was a selector specified
        return selector !== undefined && selector !== null ?
            new _Api( __table_selector( selector, this.context ) ) :
            this;
    } );


    _api_register( 'table()', function ( selector ) {
        var tables = this.tables( selector );
        var ctx = tables.context;

        // Truncate to the first matched table
        return ctx.length ?
            new _Api( ctx[0] ) :
            tables;
    } );

    // Common methods, combined to reduce size
    [
        ['nodes', 'node', 'nTable'],
        ['body', 'body', 'nTBody'],
        ['header', 'header', 'nTHead'],
        ['footer', 'footer', 'nTFoot'],
    ].forEach(function (item) {
        _api_registerPlural(
            'tables().' + item[0] + '()',
            'table().' + item[1] + '()' ,
            function () {
                return this.iterator( 'table', function ( ctx ) {
                    return ctx[item[2]];
                }, 1 );
            }
        );
    });

    // Structure methods
    [
        ['header', 'aoHeader'],
        ['footer', 'aoFooter'],
    ].forEach(function (item) {
        _api_register( 'table().' + item[0] + '.structure()' , function (selector) {
            var indexes = this.columns(selector).indexes().flatten();
            var ctx = this.context[0];

            return _fnHeaderLayout(ctx, ctx[item[1]], indexes);
        } );
    })


    _api_registerPlural( 'tables().containers()', 'table().container()' , function () {
        return this.iterator( 'table', function ( ctx ) {
            return ctx.nTableWrapper;
        }, 1 );
    } );

    _api_register( 'tables().every()', function ( fn ) {
        var that = this;

        return this.iterator('table', function (s, i) {
            fn.call(that.table(i), i);
        });
    });

    _api_register( 'caption()', function ( value, side ) {
        var context = this.context;

        // Getter - return existing node's content
        if ( value === undefined ) {
            var caption = context[0].captionNode;

            return caption && context.length ?
                caption.innerHTML :
                null;
        }

        return this.iterator( 'table', function ( ctx ) {
            var table = $(ctx.nTable);
            var caption = $(ctx.captionNode);
            var container = $(ctx.nTableWrapper);

            // Create the node if it doesn't exist yet
            if ( ! caption.length ) {
                caption = $('<caption/>').html( value );
                ctx.captionNode = caption[0];

                // If side isn't set, we need to insert into the document to let the
                // CSS decide so we can read it back, otherwise there is no way to
                // know if the CSS would put it top or bottom for scrolling
                if (! side) {
                    table.prepend(caption);

                    side = caption.css('caption-side');
                }
            }

            caption.html( value );

            if ( side ) {
                caption.css( 'caption-side', side );
                caption[0]._captionSide = side;
            }

            if (container.find('div.dataTables_scroll').length) {
                var selector = (side === 'top' ? 'Head' : 'Foot');

                container.find('div.dataTables_scroll'+ selector +' table').prepend(caption);
            }
            else {
                table.prepend(caption);
            }
        }, 1 );
    } );

    _api_register( 'caption.node()', function () {
        var ctx = this.context;

        return ctx.length ? ctx[0].captionNode : null;
    } );


    /**
     * Redraw the tables in the current context.
     */
    _api_register( 'draw()', function ( paging ) {
        return this.iterator( 'table', function ( settings ) {
            if ( paging === 'page' ) {
                _fnDraw( settings );
            }
            else {
                if ( typeof paging === 'string' ) {
                    paging = paging === 'full-hold' ?
                        false :
                        true;
                }

                _fnReDraw( settings, paging===false );
            }
        } );
    } );



    /**
     * Get the current page index.
     *
     * @return {integer} Current page index (zero based)
     *//**
     * Set the current page.
     *
     * Note that if you attempt to show a page which does not exist, DataTables will
     * not throw an error, but rather reset the paging.
     *
     * @param {integer|string} action The paging action to take. This can be one of:
     *  * `integer` - The page index to jump to
     *  * `string` - An action to take:
     *    * `first` - Jump to first page.
     *    * `next` - Jump to the next page
     *    * `previous` - Jump to previous page
     *    * `last` - Jump to the last page.
     * @returns {DataTables.Api} this
     */
    _api_register( 'page()', function ( action ) {
        if ( action === undefined ) {
            return this.page.info().page; // not an expensive call
        }

        // else, have an action to take on all tables
        return this.iterator( 'table', function ( settings ) {
            _fnPageChange( settings, action );
        } );
    } );


    /**
     * Paging information for the first table in the current context.
     *
     * If you require paging information for another table, use the `table()` method
     * with a suitable selector.
     *
     * @return {object} Object with the following properties set:
     *  * `page` - Current page index (zero based - i.e. the first page is `0`)
     *  * `pages` - Total number of pages
     *  * `start` - Display index for the first record shown on the current page
     *  * `end` - Display index for the last record shown on the current page
     *  * `length` - Display length (number of records). Note that generally `start
     *    + length = end`, but this is not always true, for example if there are
     *    only 2 records to show on the final page, with a length of 10.
     *  * `recordsTotal` - Full data set length
     *  * `recordsDisplay` - Data set length once the current filtering criterion
     *    are applied.
     */
    _api_register( 'page.info()', function () {
        if ( this.context.length === 0 ) {
            return undefined;
        }

        var
            settings   = this.context[0],
            start      = settings._iDisplayStart,
            len        = settings.oFeatures.bPaginate ? settings._iDisplayLength : -1,
            visRecords = settings.fnRecordsDisplay(),
            all        = len === -1;

        return {
            "page":           all ? 0 : Math.floor( start / len ),
            "pages":          all ? 1 : Math.ceil( visRecords / len ),
            "start":          start,
            "end":            settings.fnDisplayEnd(),
            "length":         len,
            "recordsTotal":   settings.fnRecordsTotal(),
            "recordsDisplay": visRecords,
            "serverSide":     _fnDataSource( settings ) === 'ssp'
        };
    } );


    /**
     * Get the current page length.
     *
     * @return {integer} Current page length. Note `-1` indicates that all records
     *   are to be shown.
     *//**
     * Set the current page length.
     *
     * @param {integer} Page length to set. Use `-1` to show all records.
     * @returns {DataTables.Api} this
     */
    _api_register( 'page.len()', function ( len ) {
        // Note that we can't call this function 'length()' because `length`
        // is a Javascript property of functions which defines how many arguments
        // the function expects.
        if ( len === undefined ) {
            return this.context.length !== 0 ?
                this.context[0]._iDisplayLength :
                undefined;
        }

        // else, set the page length
        return this.iterator( 'table', function ( settings ) {
            _fnLengthChange( settings, len );
        } );
    } );



    var __reload = function ( settings, holdPosition, callback ) {
        // Use the draw event to trigger a callback
        if ( callback ) {
            var api = new _Api( settings );

            api.one( 'draw', function () {
                callback( api.ajax.json() );
            } );
        }

        if ( _fnDataSource( settings ) == 'ssp' ) {
            _fnReDraw( settings, holdPosition );
        }
        else {
            _fnProcessingDisplay( settings, true );

            // Cancel an existing request
            var xhr = settings.jqXHR;
            if ( xhr && xhr.readyState !== 4 ) {
                xhr.abort();
            }

            // Trigger xhr
            _fnBuildAjax( settings, {}, function( json ) {
                _fnClearTable( settings );

                var data = _fnAjaxDataSrc( settings, json );
                for ( var i=0, ien=data.length ; i<ien ; i++ ) {
                    _fnAddData( settings, data[i] );
                }

                _fnReDraw( settings, holdPosition );
                _fnInitComplete( settings );
                _fnProcessingDisplay( settings, false );
            } );
        }
    };


    /**
     * Get the JSON response from the last Ajax request that DataTables made to the
     * server. Note that this returns the JSON from the first table in the current
     * context.
     *
     * @return {object} JSON received from the server.
     */
    _api_register( 'ajax.json()', function () {
        var ctx = this.context;

        if ( ctx.length > 0 ) {
            return ctx[0].json;
        }

        // else return undefined;
    } );


    /**
     * Get the data submitted in the last Ajax request
     */
    _api_register( 'ajax.params()', function () {
        var ctx = this.context;

        if ( ctx.length > 0 ) {
            return ctx[0].oAjaxData;
        }

        // else return undefined;
    } );


    /**
     * Reload tables from the Ajax data source. Note that this function will
     * automatically re-draw the table when the remote data has been loaded.
     *
     * @param {boolean} [reset=true] Reset (default) or hold the current paging
     *   position. A full re-sort and re-filter is performed when this method is
     *   called, which is why the pagination reset is the default action.
     * @returns {DataTables.Api} this
     */
    _api_register( 'ajax.reload()', function ( callback, resetPaging ) {
        return this.iterator( 'table', function (settings) {
            __reload( settings, resetPaging===false, callback );
        } );
    } );


    /**
     * Get the current Ajax URL. Note that this returns the URL from the first
     * table in the current context.
     *
     * @return {string} Current Ajax source URL
     *//**
     * Set the Ajax URL. Note that this will set the URL for all tables in the
     * current context.
     *
     * @param {string} url URL to set.
     * @returns {DataTables.Api} this
     */
    _api_register( 'ajax.url()', function ( url ) {
        var ctx = this.context;

        if ( url === undefined ) {
            // get
            if ( ctx.length === 0 ) {
                return undefined;
            }
            ctx = ctx[0];

            return $.isPlainObject( ctx.ajax ) ?
                ctx.ajax.url :
                ctx.ajax;
        }

        // set
        return this.iterator( 'table', function ( settings ) {
            if ( $.isPlainObject( settings.ajax ) ) {
                settings.ajax.url = url;
            }
            else {
                settings.ajax = url;
            }
        } );
    } );


    /**
     * Load data from the newly set Ajax URL. Note that this method is only
     * available when `ajax.url()` is used to set a URL. Additionally, this method
     * has the same effect as calling `ajax.reload()` but is provided for
     * convenience when setting a new URL. Like `ajax.reload()` it will
     * automatically redraw the table once the remote data has been loaded.
     *
     * @returns {DataTables.Api} this
     */
    _api_register( 'ajax.url().load()', function ( callback, resetPaging ) {
        // Same as a reload, but makes sense to present it for easy access after a
        // url change
        return this.iterator( 'table', function ( ctx ) {
            __reload( ctx, resetPaging===false, callback );
        } );
    } );




    var _selector_run = function ( type, selector, selectFn, settings, opts )
    {
        var
            out = [], res,
            a, i, ien, j, jen,
            selectorType = typeof selector;

        // Can't just check for isArray here, as an API or jQuery instance might be
        // given with their array like look
        if ( ! selector || selectorType === 'string' || selectorType === 'function' || selector.length === undefined ) {
            selector = [ selector ];
        }

        for ( i=0, ien=selector.length ; i<ien ; i++ ) {
            // Only split on simple strings - complex expressions will be jQuery selectors
            a = selector[i] && selector[i].split && ! selector[i].match(/[[(:]/) ?
                selector[i].split(',') :
                [ selector[i] ];

            for ( j=0, jen=a.length ; j<jen ; j++ ) {
                res = selectFn( typeof a[j] === 'string' ? (a[j]).trim() : a[j] );

                // Remove empty items
                res = res.filter( function (item) {
                    return item !== null && item !== undefined;
                });

                if ( res && res.length ) {
                    out = out.concat( res );
                }
            }
        }

        // selector extensions
        var ext = _ext.selector[ type ];
        if ( ext.length ) {
            for ( i=0, ien=ext.length ; i<ien ; i++ ) {
                out = ext[i]( settings, opts, out );
            }
        }

        return _unique( out );
    };


    var _selector_opts = function ( opts )
    {
        if ( ! opts ) {
            opts = {};
        }

        // Backwards compatibility for 1.9- which used the terminology filter rather
        // than search
        if ( opts.filter && opts.search === undefined ) {
            opts.search = opts.filter;
        }

        return $.extend( {
            search: 'none',
            order: 'current',
            page: 'all'
        }, opts );
    };


    // Reduce the API instance to the first item found
    var _selector_first = function ( old )
    {
        let inst = new _Api(old.context[0]);

        // Use a push rather than passing to the constructor, since it will
        // merge arrays down automatically, which isn't what is wanted here
        if (old.length) {
            inst.push( old[0] );
        }

        inst.selector = old.selector;

        // Limit to a single row / column / cell
        if (inst.length && inst[0].length > 1) {
            inst[0].splice(1);
        }

        return inst;
    };


    var _selector_row_indexes = function ( settings, opts )
    {
        var
            i, ien, tmp, a=[],
            displayFiltered = settings.aiDisplay,
            displayMaster = settings.aiDisplayMaster;

        var
            search = opts.search,  // none, applied, removed
            order  = opts.order,   // applied, current, index (original - compatibility with 1.9)
            page   = opts.page;    // all, current

        if ( _fnDataSource( settings ) == 'ssp' ) {
            // In server-side processing mode, most options are irrelevant since
            // rows not shown don't exist and the index order is the applied order
            // Removed is a special case - for consistency just return an empty
            // array
            return search === 'removed' ?
                [] :
                _range( 0, displayMaster.length );
        }

        if ( page == 'current' ) {
            // Current page implies that order=current and filter=applied, since it is
            // fairly senseless otherwise, regardless of what order and search actually
            // are
            for ( i=settings._iDisplayStart, ien=settings.fnDisplayEnd() ; i<ien ; i++ ) {
                a.push( displayFiltered[i] );
            }
        }
        else if ( order == 'current' || order == 'applied' ) {
            if ( search == 'none') {
                a = displayMaster.slice();
            }
            else if ( search == 'applied' ) {
                a = displayFiltered.slice();
            }
            else if ( search == 'removed' ) {
                // O(n+m) solution by creating a hash map
                var displayFilteredMap = {};

                for ( i=0, ien=displayFiltered.length ; i<ien ; i++ ) {
                    displayFilteredMap[displayFiltered[i]] = null;
                }

                displayMaster.forEach(function (item) {
                    if (! Object.prototype.hasOwnProperty.call(displayFilteredMap, item)) {
                        a.push(item);
                    }
                });
            }
        }
        else if ( order == 'index' || order == 'original' ) {
            for ( i=0, ien=settings.aoData.length ; i<ien ; i++ ) {
                if (! settings.aoData[i]) {
                    continue;
                }

                if ( search == 'none' ) {
                    a.push( i );
                }
                else { // applied | removed
                    tmp = displayFiltered.indexOf(i);

                    if ((tmp === -1 && search == 'removed') ||
                        (tmp >= 0   && search == 'applied') )
                    {
                        a.push( i );
                    }
                }
            }
        }
        else if ( typeof order === 'number' ) {
            // Order the rows by the given column
            var ordered = _fnSort(settings, order, 'asc');

            if (search === 'none') {
                a = ordered;
            }
            else { // applied | removed
                for (i=0; i<ordered.length; i++) {
                    tmp = displayFiltered.indexOf(ordered[i]);

                    if ((tmp === -1 && search == 'removed') ||
                        (tmp >= 0   && search == 'applied') )
                    {
                        a.push( ordered[i] );
                    }
                }
            }
        }

        return a;
    };


    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Rows
	 *
	 * {}          - no selector - use all available rows
	 * {integer}   - row aoData index
	 * {node}      - TR node
	 * {string}    - jQuery selector to apply to the TR elements
	 * {array}     - jQuery array of nodes, or simply an array of TR nodes
	 *
	 */
    var __row_selector = function ( settings, selector, opts )
    {
        var rows;
        var run = function ( sel ) {
            var selInt = _intVal( sel );
            var aoData = settings.aoData;

            // Short cut - selector is a number and no options provided (default is
            // all records, so no need to check if the index is in there, since it
            // must be - dev error if the index doesn't exist).
            if ( selInt !== null && ! opts ) {
                return [ selInt ];
            }

            if ( ! rows ) {
                rows = _selector_row_indexes( settings, opts );
            }

            if ( selInt !== null && rows.indexOf(selInt) !== -1 ) {
                // Selector - integer
                return [ selInt ];
            }
            else if ( sel === null || sel === undefined || sel === '' ) {
                // Selector - none
                return rows;
            }

            // Selector - function
            if ( typeof sel === 'function' ) {
                return rows.map( function (idx) {
                    var row = aoData[ idx ];
                    return sel( idx, row._aData, row.nTr ) ? idx : null;
                } );
            }

            // Selector - node
            if ( sel.nodeName ) {
                var rowIdx = sel._DT_RowIndex;  // Property added by DT for fast lookup
                var cellIdx = sel._DT_CellIndex;

                if ( rowIdx !== undefined ) {
                    // Make sure that the row is actually still present in the table
                    return aoData[ rowIdx ] && aoData[ rowIdx ].nTr === sel ?
                        [ rowIdx ] :
                        [];
                }
                else if ( cellIdx ) {
                    return aoData[ cellIdx.row ] && aoData[ cellIdx.row ].nTr === sel.parentNode ?
                        [ cellIdx.row ] :
                        [];
                }
                else {
                    var host = $(sel).closest('*[data-dt-row]');
                    return host.length ?
                        [ host.data('dt-row') ] :
                        [];
                }
            }

            // ID selector. Want to always be able to select rows by id, regardless
            // of if the tr element has been created or not, so can't rely upon
            // jQuery here - hence a custom implementation. This does not match
            // Sizzle's fast selector or HTML4 - in HTML5 the ID can be anything,
            // but to select it using a CSS selector engine (like Sizzle or
            // querySelect) it would need to need to be escaped for some characters.
            // DataTables simplifies this for row selectors since you can select
            // only a row. A # indicates an id any anything that follows is the id -
            // unescaped.
            if ( typeof sel === 'string' && sel.charAt(0) === '#' ) {
                // get row index from id
                var rowObj = settings.aIds[ sel.replace( /^#/, '' ) ];
                if ( rowObj !== undefined ) {
                    return [ rowObj.idx ];
                }

                // need to fall through to jQuery in case there is DOM id that
                // matches
            }

            // Get nodes in the order from the `rows` array with null values removed
            var nodes = _removeEmpty(
                _pluck_order( settings.aoData, rows, 'nTr' )
            );

            // Selector - jQuery selector string, array of nodes or jQuery object/
            // As jQuery's .filter() allows jQuery objects to be passed in filter,
            // it also allows arrays, so this will cope with all three options
            return $(nodes)
                .filter( sel )
                .map( function () {
                    return this._DT_RowIndex;
                } )
                .toArray();
        };

        var matched = _selector_run( 'row', selector, run, settings, opts );

        if (opts.order === 'current' || opts.order === 'applied') {
            _fnSortDisplay(settings, matched);
        }

        return matched;
    };


    _api_register( 'rows()', function ( selector, opts ) {
        // argument shifting
        if ( selector === undefined ) {
            selector = '';
        }
        else if ( $.isPlainObject( selector ) ) {
            opts = selector;
            selector = '';
        }

        opts = _selector_opts( opts );

        var inst = this.iterator( 'table', function ( settings ) {
            return __row_selector( settings, selector, opts );
        }, 1 );

        // Want argument shifting here and in __row_selector?
        inst.selector.rows = selector;
        inst.selector.opts = opts;

        return inst;
    } );

    _api_register( 'rows().nodes()', function () {
        return this.iterator( 'row', function ( settings, row ) {
            return settings.aoData[ row ].nTr || undefined;
        }, 1 );
    } );

    _api_register( 'rows().data()', function () {
        return this.iterator( true, 'rows', function ( settings, rows ) {
            return _pluck_order( settings.aoData, rows, '_aData' );
        }, 1 );
    } );

    _api_registerPlural( 'rows().cache()', 'row().cache()', function ( type ) {
        return this.iterator( 'row', function ( settings, row ) {
            var r = settings.aoData[ row ];
            return type === 'search' ? r._aFilterData : r._aSortData;
        }, 1 );
    } );

    _api_registerPlural( 'rows().invalidate()', 'row().invalidate()', function ( src ) {
        return this.iterator( 'row', function ( settings, row ) {
            _fnInvalidate( settings, row, src );
        } );
    } );

    _api_registerPlural( 'rows().indexes()', 'row().index()', function () {
        return this.iterator( 'row', function ( settings, row ) {
            return row;
        }, 1 );
    } );

    _api_registerPlural( 'rows().ids()', 'row().id()', function ( hash ) {
        var a = [];
        var context = this.context;

        // `iterator` will drop undefined values, but in this case we want them
        for ( var i=0, ien=context.length ; i<ien ; i++ ) {
            for ( var j=0, jen=this[i].length ; j<jen ; j++ ) {
                var id = context[i].rowIdFn( context[i].aoData[ this[i][j] ]._aData );
                a.push( (hash === true ? '#' : '' )+ id );
            }
        }

        return new _Api( context, a );
    } );

    _api_registerPlural( 'rows().remove()', 'row().remove()', function () {
        this.iterator( 'row', function ( settings, row ) {
            var data = settings.aoData;
            var rowData = data[ row ];

            // Delete from the display arrays
            var idx = settings.aiDisplayMaster.indexOf(row);
            if (idx !== -1) {
                settings.aiDisplayMaster.splice(idx, 1);
            }

            // For server-side processing tables - subtract the deleted row from the count
            if ( settings._iRecordsDisplay > 0 ) {
                settings._iRecordsDisplay--;
            }

            // Check for an 'overflow' they case for displaying the table
            _fnLengthOverflow( settings );

            // Remove the row's ID reference if there is one
            var id = settings.rowIdFn( rowData._aData );
            if ( id !== undefined ) {
                delete settings.aIds[ id ];
            }

            data[row] = null;
        } );

        return this;
    } );


    _api_register( 'rows.add()', function ( rows ) {
        var newRows = this.iterator( 'table', function ( settings ) {
            var row, i, ien;
            var out = [];

            for ( i=0, ien=rows.length ; i<ien ; i++ ) {
                row = rows[i];

                if ( row.nodeName && row.nodeName.toUpperCase() === 'TR' ) {
                    out.push( _fnAddTr( settings, row )[0] );
                }
                else {
                    out.push( _fnAddData( settings, row ) );
                }
            }

            return out;
        }, 1 );

        // Return an Api.rows() extended instance, so rows().nodes() etc can be used
        var modRows = this.rows( -1 );
        modRows.pop();
        modRows.push.apply(modRows, newRows);

        return modRows;
    } );





    /**
     *
     */
    _api_register( 'row()', function ( selector, opts ) {
        return _selector_first( this.rows( selector, opts ) );
    } );


    _api_register( 'row().data()', function ( data ) {
        var ctx = this.context;

        if ( data === undefined ) {
            // Get
            return ctx.length && this.length && this[0].length ?
                ctx[0].aoData[ this[0] ]._aData :
                undefined;
        }

        // Set
        var row = ctx[0].aoData[ this[0] ];
        row._aData = data;

        // If the DOM has an id, and the data source is an array
        if ( Array.isArray( data ) && row.nTr && row.nTr.id ) {
            _fnSetObjectDataFn( ctx[0].rowId )( data, row.nTr.id );
        }

        // Automatically invalidate
        _fnInvalidate( ctx[0], this[0], 'data' );

        return this;
    } );


    _api_register( 'row().node()', function () {
        var ctx = this.context;

        if (ctx.length && this.length && this[0].length) {
            var row = ctx[0].aoData[ this[0] ];

            if (row && row.nTr) {
                return row.nTr;
            }
        }

        return null;
    } );


    _api_register( 'row.add()', function ( row ) {
        // Allow a jQuery object to be passed in - only a single row is added from
        // it though - the first element in the set
        if ( row instanceof $ && row.length ) {
            row = row[0];
        }

        var rows = this.iterator( 'table', function ( settings ) {
            if ( row.nodeName && row.nodeName.toUpperCase() === 'TR' ) {
                return _fnAddTr( settings, row )[0];
            }
            return _fnAddData( settings, row );
        } );

        // Return an Api.rows() extended instance, with the newly added row selected
        return this.row( rows[0] );
    } );


    $(document).on('plugin-init.dt', function (e, context) {
        var api = new _Api( context );

        api.on( 'stateSaveParams.DT', function ( e, settings, d ) {
            // This could be more compact with the API, but it is a lot faster as a simple
            // internal loop
            var idFn = settings.rowIdFn;
            var rows = settings.aiDisplayMaster;
            var ids = [];

            for (var i=0 ; i<rows.length ; i++) {
                var rowIdx = rows[i];
                var data = settings.aoData[rowIdx];

                if (data._detailsShow) {
                    ids.push( '#' + idFn(data._aData) );
                }
            }

            d.childRows = ids;
        });

        // For future state loads (e.g. with StateRestore)
        api.on( 'stateLoaded.DT', function (e, settings, state) {
            __details_state_load( api, state );
        });

        // And the initial load state
        __details_state_load( api, api.state.loaded() );
    });

    var __details_state_load = function (api, state)
    {
        if ( state && state.childRows ) {
            api
                .rows( state.childRows.map(function (id) {
                    // Escape any `:` characters from the row id. Accounts for
                    // already escaped characters.
                    return id.replace(/([^:\\]*(?:\\.[^:\\]*)*):/g, "$1\\:");
                }) )
                .every( function () {
                    _fnCallbackFire( api.settings()[0], null, 'requestChild', [ this ] )
                });
        }
    }

    var __details_add = function ( ctx, row, data, klass )
    {
        // Convert to array of TR elements
        var rows = [];
        var addRow = function ( r, k ) {
            // Recursion to allow for arrays of jQuery objects
            if ( Array.isArray( r ) || r instanceof $ ) {
                for ( var i=0, ien=r.length ; i<ien ; i++ ) {
                    addRow( r[i], k );
                }
                return;
            }

            // If we get a TR element, then just add it directly - up to the dev
            // to add the correct number of columns etc
            if ( r.nodeName && r.nodeName.toLowerCase() === 'tr' ) {
                r.setAttribute( 'data-dt-row', row.idx );
                rows.push( r );
            }
            else {
                // Otherwise create a row with a wrapper
                var created = $('<tr><td></td></tr>')
                    .attr( 'data-dt-row', row.idx )
                    .addClass( k );

                $('td', created)
                    .addClass( k )
                    .html( r )[0].colSpan = _fnVisbleColumns( ctx );

                rows.push( created[0] );
            }
        };

        addRow( data, klass );

        if ( row._details ) {
            row._details.detach();
        }

        row._details = $(rows);

        // If the children were already shown, that state should be retained
        if ( row._detailsShow ) {
            row._details.insertAfter( row.nTr );
        }
    };


    // Make state saving of child row details async to allow them to be batch processed
    var __details_state = DataTable.util.throttle(
        function (ctx) {
            _fnSaveState( ctx[0] )
        },
        500
    );


    var __details_remove = function ( api, idx )
    {
        var ctx = api.context;

        if ( ctx.length ) {
            var row = ctx[0].aoData[ idx !== undefined ? idx : api[0] ];

            if ( row && row._details ) {
                row._details.remove();

                row._detailsShow = undefined;
                row._details = undefined;
                $( row.nTr ).removeClass( 'dt-hasChild' );
                __details_state( ctx );
            }
        }
    };


    var __details_display = function ( api, show ) {
        var ctx = api.context;

        if ( ctx.length && api.length ) {
            var row = ctx[0].aoData[ api[0] ];

            if ( row._details ) {
                row._detailsShow = show;

                if ( show ) {
                    row._details.insertAfter( row.nTr );
                    $( row.nTr ).addClass( 'dt-hasChild' );
                }
                else {
                    row._details.detach();
                    $( row.nTr ).removeClass( 'dt-hasChild' );
                }

                _fnCallbackFire( ctx[0], null, 'childRow', [ show, api.row( api[0] ) ] )

                __details_events( ctx[0] );
                __details_state( ctx );
            }
        }
    };


    var __details_events = function ( settings )
    {
        var api = new _Api( settings );
        var namespace = '.dt.DT_details';
        var drawEvent = 'draw'+namespace;
        var colvisEvent = 'column-sizing'+namespace;
        var destroyEvent = 'destroy'+namespace;
        var data = settings.aoData;

        api.off( drawEvent +' '+ colvisEvent +' '+ destroyEvent );

        if ( _pluck( data, '_details' ).length > 0 ) {
            // On each draw, insert the required elements into the document
            api.on( drawEvent, function ( e, ctx ) {
                if ( settings !== ctx ) {
                    return;
                }

                api.rows( {page:'current'} ).eq(0).each( function (idx) {
                    // Internal data grab
                    var row = data[ idx ];

                    if ( row._detailsShow ) {
                        row._details.insertAfter( row.nTr );
                    }
                } );
            } );

            // Column visibility change - update the colspan
            api.on( colvisEvent, function ( e, ctx ) {
                if ( settings !== ctx ) {
                    return;
                }

                // Update the colspan for the details rows (note, only if it already has
                // a colspan)
                var row, visible = _fnVisbleColumns( ctx );

                for ( var i=0, ien=data.length ; i<ien ; i++ ) {
                    row = data[i];

                    if ( row && row._details ) {
                        row._details.each(function () {
                            var el = $(this).children('td');

                            if (el.length == 1) {
                                el.attr('colspan', visible);
                            }
                        });
                    }
                }
            } );

            // Table destroyed - nuke any child rows
            api.on( destroyEvent, function ( e, ctx ) {
                if ( settings !== ctx ) {
                    return;
                }

                for ( var i=0, ien=data.length ; i<ien ; i++ ) {
                    if ( data[i] && data[i]._details ) {
                        __details_remove( api, i );
                    }
                }
            } );
        }
    };

    // Strings for the method names to help minification
    var _emp = '';
    var _child_obj = _emp+'row().child';
    var _child_mth = _child_obj+'()';

    // data can be:
    //  tr
    //  string
    //  jQuery or array of any of the above
    _api_register( _child_mth, function ( data, klass ) {
        var ctx = this.context;

        if ( data === undefined ) {
            // get
            return ctx.length && this.length && ctx[0].aoData[ this[0] ]
                ? ctx[0].aoData[ this[0] ]._details
                : undefined;
        }
        else if ( data === true ) {
            // show
            this.child.show();
        }
        else if ( data === false ) {
            // remove
            __details_remove( this );
        }
        else if ( ctx.length && this.length ) {
            // set
            __details_add( ctx[0], ctx[0].aoData[ this[0] ], data, klass );
        }

        return this;
    } );


    _api_register( [
        _child_obj+'.show()',
        _child_mth+'.show()' // only when `child()` was called with parameters (without
    ], function () {         // it returns an object and this method is not executed)
        __details_display( this, true );
        return this;
    } );


    _api_register( [
        _child_obj+'.hide()',
        _child_mth+'.hide()' // only when `child()` was called with parameters (without
    ], function () {         // it returns an object and this method is not executed)
        __details_display( this, false );
        return this;
    } );


    _api_register( [
        _child_obj+'.remove()',
        _child_mth+'.remove()' // only when `child()` was called with parameters (without
    ], function () {           // it returns an object and this method is not executed)
        __details_remove( this );
        return this;
    } );


    _api_register( _child_obj+'.isShown()', function () {
        var ctx = this.context;

        if ( ctx.length && this.length && ctx[0].aoData[ this[0] ] ) {
            // _detailsShown as false or undefined will fall through to return false
            return ctx[0].aoData[ this[0] ]._detailsShow || false;
        }
        return false;
    } );



    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Columns
	 *
	 * {integer}           - column index (>=0 count from left, <0 count from right)
	 * "{integer}:visIdx"  - visible column index (i.e. translate to column index)  (>=0 count from left, <0 count from right)
	 * "{integer}:visible" - alias for {integer}:visIdx  (>=0 count from left, <0 count from right)
	 * "{string}:name"     - column name
	 * "{string}"          - jQuery selector on column header nodes
	 *
	 */

    // can be an array of these items, comma separated list, or an array of comma
    // separated lists

    var __re_column_selector = /^([^:]+)?:(name|title|visIdx|visible)$/;


    // r1 and r2 are redundant - but it means that the parameters match for the
    // iterator callback in columns().data()
    var __columnData = function ( settings, column, r1, r2, rows, type ) {
        var a = [];
        for ( var row=0, ien=rows.length ; row<ien ; row++ ) {
            a.push( _fnGetCellData( settings, rows[row], column, type ) );
        }
        return a;
    };


    var __column_header = function ( settings, column, row ) {
        var header = settings.aoHeader;
        var target = row !== undefined
            ? row
            : settings.bSortCellsTop // legacy support
                ? 0
                : header.length - 1;

        return header[target][column].cell;
    };

    var __column_selector = function ( settings, selector, opts )
    {
        var
            columns = settings.aoColumns,
            names = _pluck( columns, 'sName' ),
            titles = _pluck( columns, 'sTitle' ),
            cells = DataTable.util.get('[].[].cell')(settings.aoHeader),
            nodes = _unique( _flatten([], cells) );

        var run = function ( s ) {
            var selInt = _intVal( s );

            // Selector - all
            if ( s === '' ) {
                return _range( columns.length );
            }

            // Selector - index
            if ( selInt !== null ) {
                return [ selInt >= 0 ?
                    selInt : // Count from left
                    columns.length + selInt // Count from right (+ because its a negative value)
                ];
            }

            // Selector = function
            if ( typeof s === 'function' ) {
                var rows = _selector_row_indexes( settings, opts );

                return columns.map(function (col, idx) {
                    return s(
                        idx,
                        __columnData( settings, idx, 0, 0, rows ),
                        __column_header( settings, idx )
                    ) ? idx : null;
                });
            }

            // jQuery or string selector
            var match = typeof s === 'string' ?
                s.match( __re_column_selector ) :
                '';

            if ( match ) {
                switch( match[2] ) {
                    case 'visIdx':
                    case 'visible':
                        if (match[1]) {
                            var idx = parseInt( match[1], 10 );
                            // Visible index given, convert to column index
                            if ( idx < 0 ) {
                                // Counting from the right
                                var visColumns = columns.map( function (col,i) {
                                    return col.bVisible ? i : null;
                                } );
                                return [ visColumns[ visColumns.length + idx ] ];
                            }
                            // Counting from the left
                            return [ _fnVisibleToColumnIndex( settings, idx ) ];
                        }

                        // `:visible` on its own
                        return columns.map( function (col, i) {
                            return col.bVisible ? i : null;
                        } );

                    case 'name':
                        // match by name. `names` is column index complete and in order
                        return names.map( function (name, i) {
                            return name === match[1] ? i : null;
                        } );

                    case 'title':
                        // match by column title
                        return titles.map( function (title, i) {
                            return title === match[1] ? i : null;
                        } );

                    default:
                        return [];
                }
            }

            // Cell in the table body
            if ( s.nodeName && s._DT_CellIndex ) {
                return [ s._DT_CellIndex.column ];
            }

            // jQuery selector on the TH elements for the columns
            var jqResult = $( nodes )
                .filter( s )
                .map( function () {
                    return _fnColumnsFromHeader( this ); // `nodes` is column index complete and in order
                } )
                .toArray();

            if ( jqResult.length || ! s.nodeName ) {
                return jqResult;
            }

            // Otherwise a node which might have a `dt-column` data attribute, or be
            // a child or such an element
            var host = $(s).closest('*[data-dt-column]');
            return host.length ?
                [ host.data('dt-column') ] :
                [];
        };

        return _selector_run( 'column', selector, run, settings, opts );
    };


    var __setColumnVis = function ( settings, column, vis ) {
        var
            cols = settings.aoColumns,
            col  = cols[ column ],
            data = settings.aoData,
            cells, i, ien, tr;

        // Get
        if ( vis === undefined ) {
            return col.bVisible;
        }

        // Set
        // No change
        if ( col.bVisible === vis ) {
            return false;
        }

        if ( vis ) {
            // Insert column
            // Need to decide if we should use appendChild or insertBefore
            var insertBefore = _pluck(cols, 'bVisible').indexOf(true, column+1);

            for ( i=0, ien=data.length ; i<ien ; i++ ) {
                if (data[i]) {
                    tr = data[i].nTr;
                    cells = data[i].anCells;

                    if ( tr ) {
                        // insertBefore can act like appendChild if 2nd arg is null
                        tr.insertBefore( cells[ column ], cells[ insertBefore ] || null );
                    }
                }
            }
        }
        else {
            // Remove column
            $( _pluck( settings.aoData, 'anCells', column ) ).detach();
        }

        // Common actions
        col.bVisible = vis;

        _colGroup(settings);

        return true;
    };


    _api_register( 'columns()', function ( selector, opts ) {
        // argument shifting
        if ( selector === undefined ) {
            selector = '';
        }
        else if ( $.isPlainObject( selector ) ) {
            opts = selector;
            selector = '';
        }

        opts = _selector_opts( opts );

        var inst = this.iterator( 'table', function ( settings ) {
            return __column_selector( settings, selector, opts );
        }, 1 );

        // Want argument shifting here and in _row_selector?
        inst.selector.cols = selector;
        inst.selector.opts = opts;

        return inst;
    } );

    _api_registerPlural( 'columns().header()', 'column().header()', function ( row ) {
        return this.iterator( 'column', function (settings, column) {
            return __column_header(settings, column, row);
        }, 1 );
    } );

    _api_registerPlural( 'columns().footer()', 'column().footer()', function ( row ) {
        return this.iterator( 'column', function ( settings, column ) {
            var footer = settings.aoFooter;

            if (! footer.length) {
                return null;
            }

            return settings.aoFooter[row !== undefined ? row : 0][column].cell;
        }, 1 );
    } );

    _api_registerPlural( 'columns().data()', 'column().data()', function () {
        return this.iterator( 'column-rows', __columnData, 1 );
    } );

    _api_registerPlural( 'columns().render()', 'column().render()', function ( type ) {
        return this.iterator( 'column-rows', function ( settings, column, i, j, rows ) {
            return __columnData( settings, column, i, j, rows, type );
        }, 1 );
    } );

    _api_registerPlural( 'columns().dataSrc()', 'column().dataSrc()', function () {
        return this.iterator( 'column', function ( settings, column ) {
            return settings.aoColumns[column].mData;
        }, 1 );
    } );

    _api_registerPlural( 'columns().cache()', 'column().cache()', function ( type ) {
        return this.iterator( 'column-rows', function ( settings, column, i, j, rows ) {
            return _pluck_order( settings.aoData, rows,
                type === 'search' ? '_aFilterData' : '_aSortData', column
            );
        }, 1 );
    } );

    _api_registerPlural( 'columns().init()', 'column().init()', function () {
        return this.iterator( 'column', function ( settings, column ) {
            return settings.aoColumns[column];
        }, 1 );
    } );

    _api_registerPlural( 'columns().nodes()', 'column().nodes()', function () {
        return this.iterator( 'column-rows', function ( settings, column, i, j, rows ) {
            return _pluck_order( settings.aoData, rows, 'anCells', column ) ;
        }, 1 );
    } );

    _api_registerPlural( 'columns().titles()', 'column().title()', function (title, row) {
        return this.iterator( 'column', function ( settings, column ) {
            // Argument shifting
            if (typeof title === 'number') {
                row = title;
                title = undefined;
            }

            var span = $('span.dt-column-title', this.column(column).header(row));

            if (title !== undefined) {
                span.html(title);
                return this;
            }

            return span.html();
        }, 1 );
    } );

    _api_registerPlural( 'columns().types()', 'column().type()', function () {
        return this.iterator( 'column', function ( settings, column ) {
            var type = settings.aoColumns[column].sType;

            // If the type was invalidated, then resolve it. This actually does
            // all columns at the moment. Would only happen once if getting all
            // column's data types.
            if (! type) {
                _fnColumnTypes(settings);
            }

            return type;
        }, 1 );
    } );

    _api_registerPlural( 'columns().visible()', 'column().visible()', function ( vis, calc ) {
        var that = this;
        var changed = [];
        var ret = this.iterator( 'column', function ( settings, column ) {
            if ( vis === undefined ) {
                return settings.aoColumns[ column ].bVisible;
            } // else

            if (__setColumnVis( settings, column, vis )) {
                changed.push(column);
            }
        } );

        // Group the column visibility changes
        if ( vis !== undefined ) {
            this.iterator( 'table', function ( settings ) {
                // Redraw the header after changes
                _fnDrawHead( settings, settings.aoHeader );
                _fnDrawHead( settings, settings.aoFooter );

                // Update colspan for no records display. Child rows and extensions will use their own
                // listeners to do this - only need to update the empty table item here
                if ( ! settings.aiDisplay.length ) {
                    $(settings.nTBody).find('td[colspan]').attr('colspan', _fnVisbleColumns(settings));
                }

                _fnSaveState( settings );

                // Second loop once the first is done for events
                that.iterator( 'column', function ( settings, column ) {
                    if (changed.includes(column)) {
                        _fnCallbackFire( settings, null, 'column-visibility', [settings, column, vis, calc] );
                    }
                } );

                if ( changed.length && (calc === undefined || calc) ) {
                    that.columns.adjust();
                }
            });
        }

        return ret;
    } );

    _api_registerPlural( 'columns().widths()', 'column().width()', function () {
        // Injects a fake row into the table for just a moment so the widths can
        // be read, regardless of colspan in the header and rows being present in
        // the body
        var columns = this.columns(':visible').count();
        var row = $('<tr>').html('<td>' + Array(columns).join('</td><td>') + '</td>');

        $(this.table().body()).append(row);

        var widths = row.children().map(function () {
            return $(this).outerWidth();
        });

        row.remove();

        return this.iterator( 'column', function ( settings, column ) {
            var visIdx = _fnColumnIndexToVisible( settings, column );

            return visIdx !== null ? widths[visIdx] : 0;
        }, 1);
    } );

    _api_registerPlural( 'columns().indexes()', 'column().index()', function ( type ) {
        return this.iterator( 'column', function ( settings, column ) {
            return type === 'visible' ?
                _fnColumnIndexToVisible( settings, column ) :
                column;
        }, 1 );
    } );

    _api_register( 'columns.adjust()', function () {
        return this.iterator( 'table', function ( settings ) {
            _fnAdjustColumnSizing( settings );
        }, 1 );
    } );

    _api_register( 'column.index()', function ( type, idx ) {
        if ( this.context.length !== 0 ) {
            var ctx = this.context[0];

            if ( type === 'fromVisible' || type === 'toData' ) {
                return _fnVisibleToColumnIndex( ctx, idx );
            }
            else if ( type === 'fromData' || type === 'toVisible' ) {
                return _fnColumnIndexToVisible( ctx, idx );
            }
        }
    } );

    _api_register( 'column()', function ( selector, opts ) {
        return _selector_first( this.columns( selector, opts ) );
    } );

    var __cell_selector = function ( settings, selector, opts )
    {
        var data = settings.aoData;
        var rows = _selector_row_indexes( settings, opts );
        var cells = _removeEmpty( _pluck_order( data, rows, 'anCells' ) );
        var allCells = $(_flatten( [], cells ));
        var row;
        var columns = settings.aoColumns.length;
        var a, i, ien, j, o, host;

        var run = function ( s ) {
            var fnSelector = typeof s === 'function';

            if ( s === null || s === undefined || fnSelector ) {
                // All cells and function selectors
                a = [];

                for ( i=0, ien=rows.length ; i<ien ; i++ ) {
                    row = rows[i];

                    for ( j=0 ; j<columns ; j++ ) {
                        o = {
                            row: row,
                            column: j
                        };

                        if ( fnSelector ) {
                            // Selector - function
                            host = data[ row ];

                            if ( s( o, _fnGetCellData(settings, row, j), host.anCells ? host.anCells[j] : null ) ) {
                                a.push( o );
                            }
                        }
                        else {
                            // Selector - all
                            a.push( o );
                        }
                    }
                }

                return a;
            }

            // Selector - index
            if ( $.isPlainObject( s ) ) {
                // Valid cell index and its in the array of selectable rows
                return s.column !== undefined && s.row !== undefined && rows.indexOf(s.row) !== -1 ?
                    [s] :
                    [];
            }

            // Selector - jQuery filtered cells
            var jqResult = allCells
                .filter( s )
                .map( function (i, el) {
                    return { // use a new object, in case someone changes the values
                        row:    el._DT_CellIndex.row,
                        column: el._DT_CellIndex.column
                    };
                } )
                .toArray();

            if ( jqResult.length || ! s.nodeName ) {
                return jqResult;
            }

            // Otherwise the selector is a node, and there is one last option - the
            // element might be a child of an element which has dt-row and dt-column
            // data attributes
            host = $(s).closest('*[data-dt-row]');
            return host.length ?
                [ {
                    row: host.data('dt-row'),
                    column: host.data('dt-column')
                } ] :
                [];
        };

        return _selector_run( 'cell', selector, run, settings, opts );
    };




    _api_register( 'cells()', function ( rowSelector, columnSelector, opts ) {
        // Argument shifting
        if ( $.isPlainObject( rowSelector ) ) {
            // Indexes
            if ( rowSelector.row === undefined ) {
                // Selector options in first parameter
                opts = rowSelector;
                rowSelector = null;
            }
            else {
                // Cell index objects in first parameter
                opts = columnSelector;
                columnSelector = null;
            }
        }
        if ( $.isPlainObject( columnSelector ) ) {
            opts = columnSelector;
            columnSelector = null;
        }

        // Cell selector
        if ( columnSelector === null || columnSelector === undefined ) {
            return this.iterator( 'table', function ( settings ) {
                return __cell_selector( settings, rowSelector, _selector_opts( opts ) );
            } );
        }

        // The default built in options need to apply to row and columns
        var internalOpts = opts ? {
            page: opts.page,
            order: opts.order,
            search: opts.search
        } : {};

        // Row + column selector
        var columns = this.columns( columnSelector, internalOpts );
        var rows = this.rows( rowSelector, internalOpts );
        var i, ien, j, jen;

        var cellsNoOpts = this.iterator( 'table', function ( settings, idx ) {
            var a = [];

            for ( i=0, ien=rows[idx].length ; i<ien ; i++ ) {
                for ( j=0, jen=columns[idx].length ; j<jen ; j++ ) {
                    a.push( {
                        row:    rows[idx][i],
                        column: columns[idx][j]
                    } );
                }
            }

            return a;
        }, 1 );

        // There is currently only one extension which uses a cell selector extension
        // It is a _major_ performance drag to run this if it isn't needed, so this is
        // an extension specific check at the moment
        var cells = opts && opts.selected ?
            this.cells( cellsNoOpts, opts ) :
            cellsNoOpts;

        $.extend( cells.selector, {
            cols: columnSelector,
            rows: rowSelector,
            opts: opts
        } );

        return cells;
    } );


    _api_registerPlural( 'cells().nodes()', 'cell().node()', function () {
        return this.iterator( 'cell', function ( settings, row, column ) {
            var data = settings.aoData[ row ];

            return data && data.anCells ?
                data.anCells[ column ] :
                undefined;
        }, 1 );
    } );


    _api_register( 'cells().data()', function () {
        return this.iterator( 'cell', function ( settings, row, column ) {
            return _fnGetCellData( settings, row, column );
        }, 1 );
    } );


    _api_registerPlural( 'cells().cache()', 'cell().cache()', function ( type ) {
        type = type === 'search' ? '_aFilterData' : '_aSortData';

        return this.iterator( 'cell', function ( settings, row, column ) {
            return settings.aoData[ row ][ type ][ column ];
        }, 1 );
    } );


    _api_registerPlural( 'cells().render()', 'cell().render()', function ( type ) {
        return this.iterator( 'cell', function ( settings, row, column ) {
            return _fnGetCellData( settings, row, column, type );
        }, 1 );
    } );


    _api_registerPlural( 'cells().indexes()', 'cell().index()', function () {
        return this.iterator( 'cell', function ( settings, row, column ) {
            return {
                row: row,
                column: column,
                columnVisible: _fnColumnIndexToVisible( settings, column )
            };
        }, 1 );
    } );


    _api_registerPlural( 'cells().invalidate()', 'cell().invalidate()', function ( src ) {
        return this.iterator( 'cell', function ( settings, row, column ) {
            _fnInvalidate( settings, row, src, column );
        } );
    } );



    _api_register( 'cell()', function ( rowSelector, columnSelector, opts ) {
        return _selector_first( this.cells( rowSelector, columnSelector, opts ) );
    } );


    _api_register( 'cell().data()', function ( data ) {
        var ctx = this.context;
        var cell = this[0];

        if ( data === undefined ) {
            // Get
            return ctx.length && cell.length ?
                _fnGetCellData( ctx[0], cell[0].row, cell[0].column ) :
                undefined;
        }

        // Set
        _fnSetCellData( ctx[0], cell[0].row, cell[0].column, data );
        _fnInvalidate( ctx[0], cell[0].row, 'data', cell[0].column );

        return this;
    } );



    /**
     * Get current ordering (sorting) that has been applied to the table.
     *
     * @returns {array} 2D array containing the sorting information for the first
     *   table in the current context. Each element in the parent array represents
     *   a column being sorted upon (i.e. multi-sorting with two columns would have
     *   2 inner arrays). The inner arrays may have 2 or 3 elements. The first is
     *   the column index that the sorting condition applies to, the second is the
     *   direction of the sort (`desc` or `asc`) and, optionally, the third is the
     *   index of the sorting order from the `column.sorting` initialisation array.
     *//**
     * Set the ordering for the table.
     *
     * @param {integer} order Column index to sort upon.
     * @param {string} direction Direction of the sort to be applied (`asc` or `desc`)
     * @returns {DataTables.Api} this
     *//**
     * Set the ordering for the table.
     *
     * @param {array} order 1D array of sorting information to be applied.
     * @param {array} [...] Optional additional sorting conditions
     * @returns {DataTables.Api} this
     *//**
     * Set the ordering for the table.
     *
     * @param {array} order 2D array of sorting information to be applied.
     * @returns {DataTables.Api} this
     */
    _api_register( 'order()', function ( order, dir ) {
        var ctx = this.context;
        var args = Array.prototype.slice.call( arguments );

        if ( order === undefined ) {
            // get
            return ctx.length !== 0 ?
                ctx[0].aaSorting :
                undefined;
        }

        // set
        if ( typeof order === 'number' ) {
            // Simple column / direction passed in
            order = [ [ order, dir ] ];
        }
        else if ( args.length > 1 ) {
            // Arguments passed in (list of 1D arrays)
            order = args;
        }
        // otherwise a 2D array was passed in

        return this.iterator( 'table', function ( settings ) {
            settings.aaSorting = Array.isArray(order) ? order.slice() : order;
        } );
    } );


    /**
     * Attach a sort listener to an element for a given column
     *
     * @param {node|jQuery|string} node Identifier for the element(s) to attach the
     *   listener to. This can take the form of a single DOM node, a jQuery
     *   collection of nodes or a jQuery selector which will identify the node(s).
     * @param {integer} column the column that a click on this node will sort on
     * @param {function} [callback] callback function when sort is run
     * @returns {DataTables.Api} this
     */
    _api_register( 'order.listener()', function ( node, column, callback ) {
        return this.iterator( 'table', function ( settings ) {
            _fnSortAttachListener(settings, node, {}, column, callback);
        } );
    } );


    _api_register( 'order.fixed()', function ( set ) {
        if ( ! set ) {
            var ctx = this.context;
            var fixed = ctx.length ?
                ctx[0].aaSortingFixed :
                undefined;

            return Array.isArray( fixed ) ?
                { pre: fixed } :
                fixed;
        }

        return this.iterator( 'table', function ( settings ) {
            settings.aaSortingFixed = $.extend( true, {}, set );
        } );
    } );


    // Order by the selected column(s)
    _api_register( [
        'columns().order()',
        'column().order()'
    ], function ( dir ) {
        var that = this;

        if ( ! dir ) {
            return this.iterator( 'column', function ( settings, idx ) {
                var sort = _fnSortFlatten( settings );

                for ( var i=0, ien=sort.length ; i<ien ; i++ ) {
                    if ( sort[i].col === idx ) {
                        return sort[i].dir;
                    }
                }

                return null;
            }, 1 );
        }
        else {
            return this.iterator( 'table', function ( settings, i ) {
                settings.aaSorting = that[i].map( function (col) {
                    return [ col, dir ];
                } );
            } );
        }
    } );

    _api_registerPlural('columns().orderable()', 'column().orderable()', function ( directions ) {
        return this.iterator( 'column', function ( settings, idx ) {
            var col = settings.aoColumns[idx];

            return directions ?
                col.asSorting :
                col.bSortable;
        }, 1 );
    } );


    _api_register( 'processing()', function ( show ) {
        return this.iterator( 'table', function ( ctx ) {
            _fnProcessingDisplay( ctx, show );
        } );
    } );


    _api_register( 'search()', function ( input, regex, smart, caseInsen ) {
        var ctx = this.context;

        if ( input === undefined ) {
            // get
            return ctx.length !== 0 ?
                ctx[0].oPreviousSearch.search :
                undefined;
        }

        // set
        return this.iterator( 'table', function ( settings ) {
            if ( ! settings.oFeatures.bFilter ) {
                return;
            }

            if (typeof regex === 'object') {
                // New style options to pass to the search builder
                _fnFilterComplete( settings, $.extend( settings.oPreviousSearch, regex, {
                    search: input
                } ) );
            }
            else {
                // Compat for the old options
                _fnFilterComplete( settings, $.extend( settings.oPreviousSearch, {
                    search: input,
                    regex:  regex === null ? false : regex,
                    smart:  smart === null ? true  : smart,
                    caseInsensitive: caseInsen === null ? true : caseInsen
                } ) );
            }
        } );
    } );

    _api_register( 'search.fixed()', function ( name, search ) {
        var ret = this.iterator( true, 'table', function ( settings ) {
            var fixed = settings.searchFixed;

            if (! name) {
                return Object.keys(fixed)
            }
            else if (search === undefined) {
                return fixed[name];
            }
            else if (search === null) {
                delete fixed[name];
            }
            else {
                fixed[name] = search;
            }

            return this;
        } );

        return name !== undefined && search === undefined
            ? ret[0]
            : ret;
    } );

    _api_registerPlural(
        'columns().search()',
        'column().search()',
        function ( input, regex, smart, caseInsen ) {
            return this.iterator( 'column', function ( settings, column ) {
                var preSearch = settings.aoPreSearchCols;

                if ( input === undefined ) {
                    // get
                    return preSearch[ column ].search;
                }

                // set
                if ( ! settings.oFeatures.bFilter ) {
                    return;
                }

                if (typeof regex === 'object') {
                    // New style options to pass to the search builder
                    $.extend( preSearch[ column ], regex, {
                        search: input
                    } );
                }
                else {
                    // Old style (with not all options available)
                    $.extend( preSearch[ column ], {
                        search: input,
                        regex:  regex === null ? false : regex,
                        smart:  smart === null ? true  : smart,
                        caseInsensitive: caseInsen === null ? true : caseInsen
                    } );
                }

                _fnFilterComplete( settings, settings.oPreviousSearch );
            } );
        }
    );

    _api_register([
            'columns().search.fixed()',
            'column().search.fixed()'
        ],
        function ( name, search ) {
            var ret = this.iterator( true, 'column', function ( settings, colIdx ) {
                var fixed = settings.aoColumns[colIdx].searchFixed;

                if (! name) {
                    return Object.keys(fixed)
                }
                else if (search === undefined) {
                    return fixed[name];
                }
                else if (search === null) {
                    delete fixed[name];
                }
                else {
                    fixed[name] = search;
                }

                return this;
            } );

            return name !== undefined && search === undefined
                ? ret[0]
                : ret;
        }
    );
    /*
	 * State API methods
	 */

    _api_register( 'state()', function ( set, ignoreTime ) {
        // getter
        if ( ! set ) {
            return this.context.length ?
                this.context[0].oSavedState :
                null;
        }

        var setMutate = $.extend( true, {}, set );

        // setter
        return this.iterator( 'table', function ( settings ) {
            if ( ignoreTime !== false ) {
                setMutate.time = +new Date() + 100;
            }

            _fnImplementState( settings, setMutate, function(){} );
        } );
    } );


    _api_register( 'state.clear()', function () {
        return this.iterator( 'table', function ( settings ) {
            // Save an empty object
            settings.fnStateSaveCallback.call( settings.oInstance, settings, {} );
        } );
    } );


    _api_register( 'state.loaded()', function () {
        return this.context.length ?
            this.context[0].oLoadedState :
            null;
    } );


    _api_register( 'state.save()', function () {
        return this.iterator( 'table', function ( settings ) {
            _fnSaveState( settings );
        } );
    } );

    /**
     * Set the libraries that DataTables uses, or the global objects.
     * Note that the arguments can be either way around (legacy support)
     * and the second is optional. See docs.
     */
    DataTable.use = function (arg1, arg2) {
        // Reverse arguments for legacy support
        var module = typeof arg1 === 'string'
            ? arg2
            : arg1;
        var type = typeof arg2 === 'string'
            ? arg2
            : arg1;

        // Getter
        if (module === undefined && typeof type === 'string') {
            switch (type) {
                case 'lib':
                case 'jq':
                    return $;

                case 'win':
                    return window;

                case 'datetime':
                    return DataTable.DateTime;

                case 'luxon':
                    return __luxon;

                case 'moment':
                    return __moment;

                default:
                    return null;
            }
        }

        // Setter
        if (type === 'lib' || type === 'jq' || (module && module.fn && module.fn.jquery)) {
            $ = module;
        }
        else if (type == 'win' || (module && module.document)) {
            window = module;
            document = module.document;
        }
        else if (type === 'datetime' || (module && module.type === 'DateTime')) {
            DataTable.DateTime = module;
        }
        else if (type === 'luxon' || (module && module.FixedOffsetZone)) {
            __luxon = module;
        }
        else if (type === 'moment' || (module && module.isMoment)) {
            __moment = module;
        }
    }

    /**
     * CommonJS factory function pass through. This will check if the arguments
     * given are a window object or a jQuery object. If so they are set
     * accordingly.
     * @param {*} root Window
     * @param {*} jq jQUery
     * @returns {boolean} Indicator
     */
    DataTable.factory = function (root, jq) {
        var is = false;

        // Test if the first parameter is a window object
        if (root && root.document) {
            window = root;
            document = root.document;
        }

        // Test if the second parameter is a jQuery object
        if (jq && jq.fn && jq.fn.jquery) {
            $ = jq;
            is = true;
        }

        return is;
    }

    /**
     * Provide a common method for plug-ins to check the version of DataTables being
     * used, in order to ensure compatibility.
     *
     *  @param {string} version Version string to check for, in the format "X.Y.Z".
     *    Note that the formats "X" and "X.Y" are also acceptable.
     *  @param {string} [version2=current DataTables version] As above, but optional.
     *   If not given the current DataTables version will be used.
     *  @returns {boolean} true if this version of DataTables is greater or equal to
     *    the required version, or false if this version of DataTales is not
     *    suitable
     *  @static
     *  @dtopt API-Static
     *
     *  @example
     *    alert( $.fn.dataTable.versionCheck( '1.9.0' ) );
     */
    DataTable.versionCheck = function( version, version2 )
    {
        var aThis = version2 ?
            version2.split('.') :
            DataTable.version.split('.');
        var aThat = version.split('.');
        var iThis, iThat;

        for ( var i=0, iLen=aThat.length ; i<iLen ; i++ ) {
            iThis = parseInt( aThis[i], 10 ) || 0;
            iThat = parseInt( aThat[i], 10 ) || 0;

            // Parts are the same, keep comparing
            if (iThis === iThat) {
                continue;
            }

            // Parts are different, return immediately
            return iThis > iThat;
        }

        return true;
    };


    /**
     * Check if a `<table>` node is a DataTable table already or not.
     *
     *  @param {node|jquery|string} table Table node, jQuery object or jQuery
     *      selector for the table to test. Note that if more than more than one
     *      table is passed on, only the first will be checked
     *  @returns {boolean} true the table given is a DataTable, or false otherwise
     *  @static
     *  @dtopt API-Static
     *
     *  @example
     *    if ( ! $.fn.DataTable.isDataTable( '#example' ) ) {
     *      $('#example').dataTable();
     *    }
     */
    DataTable.isDataTable = function ( table )
    {
        var t = $(table).get(0);
        var is = false;

        if ( table instanceof DataTable.Api ) {
            return true;
        }

        $.each( DataTable.settings, function (i, o) {
            var head = o.nScrollHead ? $('table', o.nScrollHead)[0] : null;
            var foot = o.nScrollFoot ? $('table', o.nScrollFoot)[0] : null;

            if ( o.nTable === t || head === t || foot === t ) {
                is = true;
            }
        } );

        return is;
    };


    /**
     * Get all DataTable tables that have been initialised - optionally you can
     * select to get only currently visible tables.
     *
     *  @param {boolean} [visible=false] Flag to indicate if you want all (default)
     *    or visible tables only.
     *  @returns {array} Array of `table` nodes (not DataTable instances) which are
     *    DataTables
     *  @static
     *  @dtopt API-Static
     *
     *  @example
     *    $.each( $.fn.dataTable.tables(true), function () {
     *      $(table).DataTable().columns.adjust();
     *    } );
     */
    DataTable.tables = function ( visible )
    {
        var api = false;

        if ( $.isPlainObject( visible ) ) {
            api = visible.api;
            visible = visible.visible;
        }

        var a = DataTable.settings
            .filter( function (o) {
                return !visible || (visible && $(o.nTable).is(':visible'))
                    ? true
                    : false;
            } )
            .map( function (o) {
                return o.nTable;
            });

        return api ?
            new _Api( a ) :
            a;
    };


    /**
     * Convert from camel case parameters to Hungarian notation. This is made public
     * for the extensions to provide the same ability as DataTables core to accept
     * either the 1.9 style Hungarian notation, or the 1.10+ style camelCase
     * parameters.
     *
     *  @param {object} src The model object which holds all parameters that can be
     *    mapped.
     *  @param {object} user The object to convert from camel case to Hungarian.
     *  @param {boolean} force When set to `true`, properties which already have a
     *    Hungarian value in the `user` object will be overwritten. Otherwise they
     *    won't be.
     */
    DataTable.camelToHungarian = _fnCamelToHungarian;



    /**
     *
     */
    _api_register( '$()', function ( selector, opts ) {
        var
            rows   = this.rows( opts ).nodes(), // Get all rows
            jqRows = $(rows);

        return $( [].concat(
            jqRows.filter( selector ).toArray(),
            jqRows.find( selector ).toArray()
        ) );
    } );


    // jQuery functions to operate on the tables
    $.each( [ 'on', 'one', 'off' ], function (i, key) {
        _api_register( key+'()', function ( /* event, handler */ ) {
            var args = Array.prototype.slice.call(arguments);

            // Add the `dt` namespace automatically if it isn't already present
            args[0] = args[0].split( /\s/ ).map( function ( e ) {
                return ! e.match(/\.dt\b/) ?
                    e+'.dt' :
                    e;
            } ).join( ' ' );

            var inst = $( this.tables().nodes() );
            inst[key].apply( inst, args );
            return this;
        } );
    } );


    _api_register( 'clear()', function () {
        return this.iterator( 'table', function ( settings ) {
            _fnClearTable( settings );
        } );
    } );


    _api_register( 'error()', function (msg) {
        return this.iterator( 'table', function ( settings ) {
            _fnLog( settings, 0, msg );
        } );
    } );


    _api_register( 'settings()', function () {
        return new _Api( this.context, this.context );
    } );


    _api_register( 'init()', function () {
        var ctx = this.context;
        return ctx.length ? ctx[0].oInit : null;
    } );


    _api_register( 'data()', function () {
        return this.iterator( 'table', function ( settings ) {
            return _pluck( settings.aoData, '_aData' );
        } ).flatten();
    } );


    _api_register( 'trigger()', function ( name, args, bubbles ) {
        return this.iterator( 'table', function ( settings ) {
            return _fnCallbackFire( settings, null, name, args, bubbles );
        } ).flatten();
    } );


    _api_register( 'ready()', function ( fn ) {
        var ctx = this.context;

        // Get status of first table
        if (! fn) {
            return ctx.length
                ? (ctx[0]._bInitComplete || false)
                : null;
        }

        // Function to run either once the table becomes ready or
        // immediately if it is already ready.
        return this.tables().every(function () {
            if (this.context[0]._bInitComplete) {
                fn.call(this);
            }
            else {
                this.on('init', function () {
                    fn.call(this);
                });
            }
        } );
    } );


    _api_register( 'destroy()', function ( remove ) {
        remove = remove || false;

        return this.iterator( 'table', function ( settings ) {
            var classes   = settings.oClasses;
            var table     = settings.nTable;
            var tbody     = settings.nTBody;
            var thead     = settings.nTHead;
            var tfoot     = settings.nTFoot;
            var jqTable   = $(table);
            var jqTbody   = $(tbody);
            var jqWrapper = $(settings.nTableWrapper);
            var rows      = settings.aoData.map( function (r) { return r ? r.nTr : null; } );
            var orderClasses = classes.order;

            // Flag to note that the table is currently being destroyed - no action
            // should be taken
            settings.bDestroying = true;

            // Fire off the destroy callbacks for plug-ins etc
            _fnCallbackFire( settings, "aoDestroyCallback", "destroy", [settings], true );

            // If not being removed from the document, make all columns visible
            if ( ! remove ) {
                new _Api( settings ).columns().visible( true );
            }

            // Blitz all `DT` namespaced events (these are internal events, the
            // lowercase, `dt` events are user subscribed and they are responsible
            // for removing them
            jqWrapper.off('.DT').find(':not(tbody *)').off('.DT');
            $(window).off('.DT-'+settings.sInstance);

            // When scrolling we had to break the table up - restore it
            if ( table != thead.parentNode ) {
                jqTable.children('thead').detach();
                jqTable.append( thead );
            }

            if ( tfoot && table != tfoot.parentNode ) {
                jqTable.children('tfoot').detach();
                jqTable.append( tfoot );
            }

            settings.colgroup.remove();

            settings.aaSorting = [];
            settings.aaSortingFixed = [];
            _fnSortingClasses( settings );

            $('th, td', thead)
                .removeClass(
                    orderClasses.canAsc + ' ' +
                    orderClasses.canDesc + ' ' +
                    orderClasses.isAsc + ' ' +
                    orderClasses.isDesc
                )
                .css('width', '');

            // Add the TR elements back into the table in their original order
            jqTbody.children().detach();
            jqTbody.append( rows );

            var orig = settings.nTableWrapper.parentNode;
            var insertBefore = settings.nTableWrapper.nextSibling;

            // Remove the DataTables generated nodes, events and classes
            var removedMethod = remove ? 'remove' : 'detach';
            jqTable[ removedMethod ]();
            jqWrapper[ removedMethod ]();

            // If we need to reattach the table to the document
            if ( ! remove && orig ) {
                // insertBefore acts like appendChild if !arg[1]
                orig.insertBefore( table, insertBefore );

                // Restore the width of the original table - was read from the style property,
                // so we can restore directly to that
                jqTable
                    .css( 'width', settings.sDestroyWidth )
                    .removeClass( classes.table );
            }

            /* Remove the settings object from the settings array */
            var idx = DataTable.settings.indexOf(settings);
            if ( idx !== -1 ) {
                DataTable.settings.splice( idx, 1 );
            }
        } );
    } );


    // Add the `every()` method for rows, columns and cells in a compact form
    $.each( [ 'column', 'row', 'cell' ], function ( i, type ) {
        _api_register( type+'s().every()', function ( fn ) {
            var opts = this.selector.opts;
            var api = this;
            var inst;
            var counter = 0;

            return this.iterator( 'every', function ( settings, selectedIdx, tableIdx ) {
                inst = api[ type ](selectedIdx, opts);

                if (type === 'cell') {
                    fn.call(inst, inst[0][0].row, inst[0][0].column, tableIdx, counter);
                }
                else {
                    fn.call(inst, selectedIdx, tableIdx, counter);
                }

                counter++;
            } );
        } );
    } );


    // i18n method for extensions to be able to use the language object from the
    // DataTable
    _api_register( 'i18n()', function ( token, def, plural ) {
        var ctx = this.context[0];
        var resolved = _fnGetObjectDataFn( token )( ctx.oLanguage );

        if ( resolved === undefined ) {
            resolved = def;
        }

        if ( $.isPlainObject( resolved ) ) {
            resolved = plural !== undefined && resolved[ plural ] !== undefined ?
                resolved[ plural ] :
                resolved._;
        }

        return typeof resolved === 'string'
            ? resolved.replace( '%d', plural ) // nb: plural might be undefined,
            : resolved;
    } );

    /**
     * Version string for plug-ins to check compatibility. Allowed format is
     * `a.b.c-d` where: a:int, b:int, c:int, d:string(dev|beta|alpha). `d` is used
     * only for non-release builds. See https://semver.org/ for more information.
     *  @member
     *  @type string
     *  @default Version number
     */
    DataTable.version = "2.1.2";

    /**
     * Private data store, containing all of the settings objects that are
     * created for the tables on a given page.
     *
     * Note that the `DataTable.settings` object is aliased to
     * `jQuery.fn.dataTableExt` through which it may be accessed and
     * manipulated, or `jQuery.fn.dataTable.settings`.
     *  @member
     *  @type array
     *  @default []
     *  @private
     */
    DataTable.settings = [];

    /**
     * Object models container, for the various models that DataTables has
     * available to it. These models define the objects that are used to hold
     * the active state and configuration of the table.
     *  @namespace
     */
    DataTable.models = {};



    /**
     * Template object for the way in which DataTables holds information about
     * search information for the global filter and individual column filters.
     *  @namespace
     */
    DataTable.models.oSearch = {
        /**
         * Flag to indicate if the filtering should be case insensitive or not
         */
        "caseInsensitive": true,

        /**
         * Applied search term
         */
        "search": "",

        /**
         * Flag to indicate if the search term should be interpreted as a
         * regular expression (true) or not (false) and therefore and special
         * regex characters escaped.
         */
        "regex": false,

        /**
         * Flag to indicate if DataTables is to use its smart filtering or not.
         */
        "smart": true,

        /**
         * Flag to indicate if DataTables should only trigger a search when
         * the return key is pressed.
         */
        "return": false
    };




    /**
     * Template object for the way in which DataTables holds information about
     * each individual row. This is the object format used for the settings
     * aoData array.
     *  @namespace
     */
    DataTable.models.oRow = {
        /**
         * TR element for the row
         */
        "nTr": null,

        /**
         * Array of TD elements for each row. This is null until the row has been
         * created.
         */
        "anCells": null,

        /**
         * Data object from the original data source for the row. This is either
         * an array if using the traditional form of DataTables, or an object if
         * using mData options. The exact type will depend on the passed in
         * data from the data source, or will be an array if using DOM a data
         * source.
         */
        "_aData": [],

        /**
         * Sorting data cache - this array is ostensibly the same length as the
         * number of columns (although each index is generated only as it is
         * needed), and holds the data that is used for sorting each column in the
         * row. We do this cache generation at the start of the sort in order that
         * the formatting of the sort data need be done only once for each cell
         * per sort. This array should not be read from or written to by anything
         * other than the master sorting methods.
         */
        "_aSortData": null,

        /**
         * Per cell filtering data cache. As per the sort data cache, used to
         * increase the performance of the filtering in DataTables
         */
        "_aFilterData": null,

        /**
         * Filtering data cache. This is the same as the cell filtering cache, but
         * in this case a string rather than an array. This is easily computed with
         * a join on `_aFilterData`, but is provided as a cache so the join isn't
         * needed on every search (memory traded for performance)
         */
        "_sFilterRow": null,

        /**
         * Denote if the original data source was from the DOM, or the data source
         * object. This is used for invalidating data, so DataTables can
         * automatically read data from the original source, unless uninstructed
         * otherwise.
         */
        "src": null,

        /**
         * Index in the aoData array. This saves an indexOf lookup when we have the
         * object, but want to know the index
         */
        "idx": -1,

        /**
         * Cached display value
         */
        displayData: null
    };


    /**
     * Template object for the column information object in DataTables. This object
     * is held in the settings aoColumns array and contains all the information that
     * DataTables needs about each individual column.
     *
     * Note that this object is related to {@link DataTable.defaults.column}
     * but this one is the internal data store for DataTables's cache of columns.
     * It should NOT be manipulated outside of DataTables. Any configuration should
     * be done through the initialisation options.
     *  @namespace
     */
    DataTable.models.oColumn = {
        /**
         * Column index.
         */
        "idx": null,

        /**
         * A list of the columns that sorting should occur on when this column
         * is sorted. That this property is an array allows multi-column sorting
         * to be defined for a column (for example first name / last name columns
         * would benefit from this). The values are integers pointing to the
         * columns to be sorted on (typically it will be a single integer pointing
         * at itself, but that doesn't need to be the case).
         */
        "aDataSort": null,

        /**
         * Define the sorting directions that are applied to the column, in sequence
         * as the column is repeatedly sorted upon - i.e. the first value is used
         * as the sorting direction when the column if first sorted (clicked on).
         * Sort it again (click again) and it will move on to the next index.
         * Repeat until loop.
         */
        "asSorting": null,

        /**
         * Flag to indicate if the column is searchable, and thus should be included
         * in the filtering or not.
         */
        "bSearchable": null,

        /**
         * Flag to indicate if the column is sortable or not.
         */
        "bSortable": null,

        /**
         * Flag to indicate if the column is currently visible in the table or not
         */
        "bVisible": null,

        /**
         * Store for manual type assignment using the `column.type` option. This
         * is held in store so we can manipulate the column's `sType` property.
         */
        "_sManualType": null,

        /**
         * Flag to indicate if HTML5 data attributes should be used as the data
         * source for filtering or sorting. True is either are.
         */
        "_bAttrSrc": false,

        /**
         * Developer definable function that is called whenever a cell is created (Ajax source,
         * etc) or processed for input (DOM source). This can be used as a compliment to mRender
         * allowing you to modify the DOM element (add background colour for example) when the
         * element is available.
         */
        "fnCreatedCell": null,

        /**
         * Function to get data from a cell in a column. You should <b>never</b>
         * access data directly through _aData internally in DataTables - always use
         * the method attached to this property. It allows mData to function as
         * required. This function is automatically assigned by the column
         * initialisation method
         */
        "fnGetData": null,

        /**
         * Function to set data for a cell in the column. You should <b>never</b>
         * set the data directly to _aData internally in DataTables - always use
         * this method. It allows mData to function as required. This function
         * is automatically assigned by the column initialisation method
         */
        "fnSetData": null,

        /**
         * Property to read the value for the cells in the column from the data
         * source array / object. If null, then the default content is used, if a
         * function is given then the return from the function is used.
         */
        "mData": null,

        /**
         * Partner property to mData which is used (only when defined) to get
         * the data - i.e. it is basically the same as mData, but without the
         * 'set' option, and also the data fed to it is the result from mData.
         * This is the rendering method to match the data method of mData.
         */
        "mRender": null,

        /**
         * The class to apply to all TD elements in the table's TBODY for the column
         */
        "sClass": null,

        /**
         * When DataTables calculates the column widths to assign to each column,
         * it finds the longest string in each column and then constructs a
         * temporary table and reads the widths from that. The problem with this
         * is that "mmm" is much wider then "iiii", but the latter is a longer
         * string - thus the calculation can go wrong (doing it properly and putting
         * it into an DOM object and measuring that is horribly(!) slow). Thus as
         * a "work around" we provide this option. It will append its value to the
         * text that is found to be the longest string for the column - i.e. padding.
         */
        "sContentPadding": null,

        /**
         * Allows a default value to be given for a column's data, and will be used
         * whenever a null data source is encountered (this can be because mData
         * is set to null, or because the data source itself is null).
         */
        "sDefaultContent": null,

        /**
         * Name for the column, allowing reference to the column by name as well as
         * by index (needs a lookup to work by name).
         */
        "sName": null,

        /**
         * Custom sorting data type - defines which of the available plug-ins in
         * afnSortData the custom sorting will use - if any is defined.
         */
        "sSortDataType": 'std',

        /**
         * Class to be applied to the header element when sorting on this column
         */
        "sSortingClass": null,

        /**
         * Title of the column - what is seen in the TH element (nTh).
         */
        "sTitle": null,

        /**
         * Column sorting and filtering type
         */
        "sType": null,

        /**
         * Width of the column
         */
        "sWidth": null,

        /**
         * Width of the column when it was first "encountered"
         */
        "sWidthOrig": null,

        /** Cached string which is the longest in the column */
        maxLenString: null,

        /**
         * Store for named searches
         */
        searchFixed: null
    };


    /*
	 * Developer note: The properties of the object below are given in Hungarian
	 * notation, that was used as the interface for DataTables prior to v1.10, however
	 * from v1.10 onwards the primary interface is camel case. In order to avoid
	 * breaking backwards compatibility utterly with this change, the Hungarian
	 * version is still, internally the primary interface, but is is not documented
	 * - hence the @name tags in each doc comment. This allows a Javascript function
	 * to create a map from Hungarian notation to camel case (going the other direction
	 * would require each property to be listed, which would add around 3K to the size
	 * of DataTables, while this method is about a 0.5K hit).
	 *
	 * Ultimately this does pave the way for Hungarian notation to be dropped
	 * completely, but that is a massive amount of work and will break current
	 * installs (therefore is on-hold until v2).
	 */

    /**
     * Initialisation options that can be given to DataTables at initialisation
     * time.
     *  @namespace
     */
    DataTable.defaults = {
        /**
         * An array of data to use for the table, passed in at initialisation which
         * will be used in preference to any data which is already in the DOM. This is
         * particularly useful for constructing tables purely in Javascript, for
         * example with a custom Ajax call.
         */
        "aaData": null,


        /**
         * If ordering is enabled, then DataTables will perform a first pass sort on
         * initialisation. You can define which column(s) the sort is performed
         * upon, and the sorting direction, with this variable. The `sorting` array
         * should contain an array for each column to be sorted initially containing
         * the column's index and a direction string ('asc' or 'desc').
         */
        "aaSorting": [[0,'asc']],


        /**
         * This parameter is basically identical to the `sorting` parameter, but
         * cannot be overridden by user interaction with the table. What this means
         * is that you could have a column (visible or hidden) which the sorting
         * will always be forced on first - any sorting after that (from the user)
         * will then be performed as required. This can be useful for grouping rows
         * together.
         */
        "aaSortingFixed": [],


        /**
         * DataTables can be instructed to load data to display in the table from a
         * Ajax source. This option defines how that Ajax call is made and where to.
         *
         * The `ajax` property has three different modes of operation, depending on
         * how it is defined. These are:
         *
         * * `string` - Set the URL from where the data should be loaded from.
         * * `object` - Define properties for `jQuery.ajax`.
         * * `function` - Custom data get function
         *
         * `string`
         * --------
         *
         * As a string, the `ajax` property simply defines the URL from which
         * DataTables will load data.
         *
         * `object`
         * --------
         *
         * As an object, the parameters in the object are passed to
         * [jQuery.ajax](https://api.jquery.com/jQuery.ajax/) allowing fine control
         * of the Ajax request. DataTables has a number of default parameters which
         * you can override using this option. Please refer to the jQuery
         * documentation for a full description of the options available, although
         * the following parameters provide additional options in DataTables or
         * require special consideration:
         *
         * * `data` - As with jQuery, `data` can be provided as an object, but it
         *   can also be used as a function to manipulate the data DataTables sends
         *   to the server. The function takes a single parameter, an object of
         *   parameters with the values that DataTables has readied for sending. An
         *   object may be returned which will be merged into the DataTables
         *   defaults, or you can add the items to the object that was passed in and
         *   not return anything from the function. This supersedes `fnServerParams`
         *   from DataTables 1.9-.
         *
         * * `dataSrc` - By default DataTables will look for the property `data` (or
         *   `aaData` for compatibility with DataTables 1.9-) when obtaining data
         *   from an Ajax source or for server-side processing - this parameter
         *   allows that property to be changed. You can use Javascript dotted
         *   object notation to get a data source for multiple levels of nesting, or
         *   it my be used as a function. As a function it takes a single parameter,
         *   the JSON returned from the server, which can be manipulated as
         *   required, with the returned value being that used by DataTables as the
         *   data source for the table.
         *
         * * `success` - Should not be overridden it is used internally in
         *   DataTables. To manipulate / transform the data returned by the server
         *   use `ajax.dataSrc`, or use `ajax` as a function (see below).
         *
         * `function`
         * ----------
         *
         * As a function, making the Ajax call is left up to yourself allowing
         * complete control of the Ajax request. Indeed, if desired, a method other
         * than Ajax could be used to obtain the required data, such as Web storage
         * or an AIR database.
         *
         * The function is given four parameters and no return is required. The
         * parameters are:
         *
         * 1. _object_ - Data to send to the server
         * 2. _function_ - Callback function that must be executed when the required
         *    data has been obtained. That data should be passed into the callback
         *    as the only parameter
         * 3. _object_ - DataTables settings object for the table
         */
        "ajax": null,


        /**
         * This parameter allows you to readily specify the entries in the length drop
         * down menu that DataTables shows when pagination is enabled. It can be
         * either a 1D array of options which will be used for both the displayed
         * option and the value, or a 2D array which will use the array in the first
         * position as the value, and the array in the second position as the
         * displayed options (useful for language strings such as 'All').
         *
         * Note that the `pageLength` property will be automatically set to the
         * first value given in this array, unless `pageLength` is also provided.
         */
        "aLengthMenu": [ 10, 25, 50, 100 ],


        /**
         * The `columns` option in the initialisation parameter allows you to define
         * details about the way individual columns behave. For a full list of
         * column options that can be set, please see
         * {@link DataTable.defaults.column}. Note that if you use `columns` to
         * define your columns, you must have an entry in the array for every single
         * column that you have in your table (these can be null if you don't which
         * to specify any options).
         */
        "aoColumns": null,

        /**
         * Very similar to `columns`, `columnDefs` allows you to target a specific
         * column, multiple columns, or all columns, using the `targets` property of
         * each object in the array. This allows great flexibility when creating
         * tables, as the `columnDefs` arrays can be of any length, targeting the
         * columns you specifically want. `columnDefs` may use any of the column
         * options available: {@link DataTable.defaults.column}, but it _must_
         * have `targets` defined in each object in the array. Values in the `targets`
         * array may be:
         *   <ul>
         *     <li>a string - class name will be matched on the TH for the column</li>
         *     <li>0 or a positive integer - column index counting from the left</li>
         *     <li>a negative integer - column index counting from the right</li>
         *     <li>the string "_all" - all columns (i.e. assign a default)</li>
         *   </ul>
         */
        "aoColumnDefs": null,


        /**
         * Basically the same as `search`, this parameter defines the individual column
         * filtering state at initialisation time. The array must be of the same size
         * as the number of columns, and each element be an object with the parameters
         * `search` and `escapeRegex` (the latter is optional). 'null' is also
         * accepted and the default will be used.
         */
        "aoSearchCols": [],


        /**
         * Enable or disable automatic column width calculation. This can be disabled
         * as an optimisation (it takes some time to calculate the widths) if the
         * tables widths are passed in using `columns`.
         */
        "bAutoWidth": true,


        /**
         * Deferred rendering can provide DataTables with a huge speed boost when you
         * are using an Ajax or JS data source for the table. This option, when set to
         * true, will cause DataTables to defer the creation of the table elements for
         * each row until they are needed for a draw - saving a significant amount of
         * time.
         */
        "bDeferRender": true,


        /**
         * Replace a DataTable which matches the given selector and replace it with
         * one which has the properties of the new initialisation object passed. If no
         * table matches the selector, then the new DataTable will be constructed as
         * per normal.
         */
        "bDestroy": false,


        /**
         * Enable or disable filtering of data. Filtering in DataTables is "smart" in
         * that it allows the end user to input multiple words (space separated) and
         * will match a row containing those words, even if not in the order that was
         * specified (this allow matching across multiple columns). Note that if you
         * wish to use filtering in DataTables this must remain 'true' - to remove the
         * default filtering input box and retain filtering abilities, please use
         * {@link DataTable.defaults.dom}.
         */
        "bFilter": true,

        /**
         * Used only for compatiblity with DT1
         * @deprecated
         */
        "bInfo": true,

        /**
         * Used only for compatiblity with DT1
         * @deprecated
         */
        "bLengthChange": true,

        /**
         * Enable or disable pagination.
         */
        "bPaginate": true,


        /**
         * Enable or disable the display of a 'processing' indicator when the table is
         * being processed (e.g. a sort). This is particularly useful for tables with
         * large amounts of data where it can take a noticeable amount of time to sort
         * the entries.
         */
        "bProcessing": false,


        /**
         * Retrieve the DataTables object for the given selector. Note that if the
         * table has already been initialised, this parameter will cause DataTables
         * to simply return the object that has already been set up - it will not take
         * account of any changes you might have made to the initialisation object
         * passed to DataTables (setting this parameter to true is an acknowledgement
         * that you understand this). `destroy` can be used to reinitialise a table if
         * you need.
         */
        "bRetrieve": false,


        /**
         * When vertical (y) scrolling is enabled, DataTables will force the height of
         * the table's viewport to the given height at all times (useful for layout).
         * However, this can look odd when filtering data down to a small data set,
         * and the footer is left "floating" further down. This parameter (when
         * enabled) will cause DataTables to collapse the table's viewport down when
         * the result set will fit within the given Y height.
         */
        "bScrollCollapse": false,


        /**
         * Configure DataTables to use server-side processing. Note that the
         * `ajax` parameter must also be given in order to give DataTables a
         * source to obtain the required data for each draw.
         */
        "bServerSide": false,


        /**
         * Enable or disable sorting of columns. Sorting of individual columns can be
         * disabled by the `sortable` option for each column.
         */
        "bSort": true,


        /**
         * Enable or display DataTables' ability to sort multiple columns at the
         * same time (activated by shift-click by the user).
         */
        "bSortMulti": true,


        /**
         * Allows control over whether DataTables should use the top (true) unique
         * cell that is found for a single column, or the bottom (false - default).
         * This is useful when using complex headers.
         */
        "bSortCellsTop": null,


        /**
         * Enable or disable the addition of the classes `sorting\_1`, `sorting\_2` and
         * `sorting\_3` to the columns which are currently being sorted on. This is
         * presented as a feature switch as it can increase processing time (while
         * classes are removed and added) so for large data sets you might want to
         * turn this off.
         */
        "bSortClasses": true,


        /**
         * Enable or disable state saving. When enabled HTML5 `localStorage` will be
         * used to save table display information such as pagination information,
         * display length, filtering and sorting. As such when the end user reloads
         * the page the display display will match what thy had previously set up.
         */
        "bStateSave": false,


        /**
         * This function is called when a TR element is created (and all TD child
         * elements have been inserted), or registered if using a DOM source, allowing
         * manipulation of the TR element (adding classes etc).
         */
        "fnCreatedRow": null,


        /**
         * This function is called on every 'draw' event, and allows you to
         * dynamically modify any aspect you want about the created DOM.
         */
        "fnDrawCallback": null,


        /**
         * Identical to fnHeaderCallback() but for the table footer this function
         * allows you to modify the table footer on every 'draw' event.
         */
        "fnFooterCallback": null,


        /**
         * When rendering large numbers in the information element for the table
         * (i.e. "Showing 1 to 10 of 57 entries") DataTables will render large numbers
         * to have a comma separator for the 'thousands' units (e.g. 1 million is
         * rendered as "1,000,000") to help readability for the end user. This
         * function will override the default method DataTables uses.
         */
        "fnFormatNumber": function ( toFormat ) {
            return toFormat.toString().replace(
                /\B(?=(\d{3})+(?!\d))/g,
                this.oLanguage.sThousands
            );
        },


        /**
         * This function is called on every 'draw' event, and allows you to
         * dynamically modify the header row. This can be used to calculate and
         * display useful information about the table.
         */
        "fnHeaderCallback": null,


        /**
         * The information element can be used to convey information about the current
         * state of the table. Although the internationalisation options presented by
         * DataTables are quite capable of dealing with most customisations, there may
         * be times where you wish to customise the string further. This callback
         * allows you to do exactly that.
         */
        "fnInfoCallback": null,


        /**
         * Called when the table has been initialised. Normally DataTables will
         * initialise sequentially and there will be no need for this function,
         * however, this does not hold true when using external language information
         * since that is obtained using an async XHR call.
         */
        "fnInitComplete": null,


        /**
         * Called at the very start of each table draw and can be used to cancel the
         * draw by returning false, any other return (including undefined) results in
         * the full draw occurring).
         */
        "fnPreDrawCallback": null,


        /**
         * This function allows you to 'post process' each row after it have been
         * generated for each table draw, but before it is rendered on screen. This
         * function might be used for setting the row class name etc.
         */
        "fnRowCallback": null,


        /**
         * Load the table state. With this function you can define from where, and how, the
         * state of a table is loaded. By default DataTables will load from `localStorage`
         * but you might wish to use a server-side database or cookies.
         */
        "fnStateLoadCallback": function ( settings ) {
            try {
                return JSON.parse(
                    (settings.iStateDuration === -1 ? sessionStorage : localStorage).getItem(
                        'DataTables_'+settings.sInstance+'_'+location.pathname
                    )
                );
            } catch (e) {
                return {};
            }
        },


        /**
         * Callback which allows modification of the saved state prior to loading that state.
         * This callback is called when the table is loading state from the stored data, but
         * prior to the settings object being modified by the saved state. Note that for
         * plug-in authors, you should use the `stateLoadParams` event to load parameters for
         * a plug-in.
         */
        "fnStateLoadParams": null,


        /**
         * Callback that is called when the state has been loaded from the state saving method
         * and the DataTables settings object has been modified as a result of the loaded state.
         */
        "fnStateLoaded": null,


        /**
         * Save the table state. This function allows you to define where and how the state
         * information for the table is stored By default DataTables will use `localStorage`
         * but you might wish to use a server-side database or cookies.
         */
        "fnStateSaveCallback": function ( settings, data ) {
            try {
                (settings.iStateDuration === -1 ? sessionStorage : localStorage).setItem(
                    'DataTables_'+settings.sInstance+'_'+location.pathname,
                    JSON.stringify( data )
                );
            } catch (e) {
                // noop
            }
        },


        /**
         * Callback which allows modification of the state to be saved. Called when the table
         * has changed state a new state save is required. This method allows modification of
         * the state saving object prior to actually doing the save, including addition or
         * other state properties or modification. Note that for plug-in authors, you should
         * use the `stateSaveParams` event to save parameters for a plug-in.
         */
        "fnStateSaveParams": null,


        /**
         * Duration for which the saved state information is considered valid. After this period
         * has elapsed the state will be returned to the default.
         * Value is given in seconds.
         */
        "iStateDuration": 7200,


        /**
         * Number of rows to display on a single page when using pagination. If
         * feature enabled (`lengthChange`) then the end user will be able to override
         * this to a custom setting using a pop-up menu.
         */
        "iDisplayLength": 10,


        /**
         * Define the starting point for data display when using DataTables with
         * pagination. Note that this parameter is the number of records, rather than
         * the page number, so if you have 10 records per page and want to start on
         * the third page, it should be "20".
         */
        "iDisplayStart": 0,


        /**
         * By default DataTables allows keyboard navigation of the table (sorting, paging,
         * and filtering) by adding a `tabindex` attribute to the required elements. This
         * allows you to tab through the controls and press the enter key to activate them.
         * The tabindex is default 0, meaning that the tab follows the flow of the document.
         * You can overrule this using this parameter if you wish. Use a value of -1 to
         * disable built-in keyboard navigation.
         */
        "iTabIndex": 0,


        /**
         * Classes that DataTables assigns to the various components and features
         * that it adds to the HTML table. This allows classes to be configured
         * during initialisation in addition to through the static
         * {@link DataTable.ext.oStdClasses} object).
         */
        "oClasses": {},


        /**
         * All strings that DataTables uses in the user interface that it creates
         * are defined in this object, allowing you to modified them individually or
         * completely replace them all as required.
         */
        "oLanguage": {
            /**
             * Strings that are used for WAI-ARIA labels and controls only (these are not
             * actually visible on the page, but will be read by screenreaders, and thus
             * must be internationalised as well).
             */
            "oAria": {
                /**
                 * ARIA label that is added to the table headers when the column may be sorted
                 */
                "orderable": ": Activate to sort",

                /**
                 * ARIA label that is added to the table headers when the column is currently being sorted
                 */
                "orderableReverse": ": Activate to invert sorting",

                /**
                 * ARIA label that is added to the table headers when the column is currently being
                 * sorted and next step is to remove sorting
                 */
                "orderableRemove": ": Activate to remove sorting",

                paginate: {
                    first: 'First',
                    last: 'Last',
                    next: 'Next',
                    previous: 'Previous',
                    number: ''
                }
            },

            /**
             * Pagination string used by DataTables for the built-in pagination
             * control types.
             */
            "oPaginate": {
                /**
                 * Label and character for first page button («)
                 */
                "sFirst": "\u00AB",

                /**
                 * Last page button (»)
                 */
                "sLast": "\u00BB",

                /**
                 * Next page button (›)
                 */
                "sNext": "\u203A",

                /**
                 * Previous page button (‹)
                 */
                "sPrevious": "\u2039",
            },

            /**
             * Plural object for the data type the table is showing
             */
            entries: {
                _: "entries",
                1: "entry"
            },

            /**
             * This string is shown in preference to `zeroRecords` when the table is
             * empty of data (regardless of filtering). Note that this is an optional
             * parameter - if it is not given, the value of `zeroRecords` will be used
             * instead (either the default or given value).
             */
            "sEmptyTable": "No data available in table",


            /**
             * This string gives information to the end user about the information
             * that is current on display on the page. The following tokens can be
             * used in the string and will be dynamically replaced as the table
             * display updates. This tokens can be placed anywhere in the string, or
             * removed as needed by the language requires:
             *
             * * `\_START\_` - Display index of the first record on the current page
             * * `\_END\_` - Display index of the last record on the current page
             * * `\_TOTAL\_` - Number of records in the table after filtering
             * * `\_MAX\_` - Number of records in the table without filtering
             * * `\_PAGE\_` - Current page number
             * * `\_PAGES\_` - Total number of pages of data in the table
             */
            "sInfo": "Showing _START_ to _END_ of _TOTAL_ _ENTRIES-TOTAL_",


            /**
             * Display information string for when the table is empty. Typically the
             * format of this string should match `info`.
             */
            "sInfoEmpty": "Showing 0 to 0 of 0 _ENTRIES-TOTAL_",


            /**
             * When a user filters the information in a table, this string is appended
             * to the information (`info`) to give an idea of how strong the filtering
             * is. The variable _MAX_ is dynamically updated.
             */
            "sInfoFiltered": "(filtered from _MAX_ total _ENTRIES-MAX_)",


            /**
             * If can be useful to append extra information to the info string at times,
             * and this variable does exactly that. This information will be appended to
             * the `info` (`infoEmpty` and `infoFiltered` in whatever combination they are
             * being used) at all times.
             */
            "sInfoPostFix": "",


            /**
             * This decimal place operator is a little different from the other
             * language options since DataTables doesn't output floating point
             * numbers, so it won't ever use this for display of a number. Rather,
             * what this parameter does is modify the sort methods of the table so
             * that numbers which are in a format which has a character other than
             * a period (`.`) as a decimal place will be sorted numerically.
             *
             * Note that numbers with different decimal places cannot be shown in
             * the same table and still be sortable, the table must be consistent.
             * However, multiple different tables on the page can use different
             * decimal place characters.
             */
            "sDecimal": "",


            /**
             * DataTables has a build in number formatter (`formatNumber`) which is
             * used to format large numbers that are used in the table information.
             * By default a comma is used, but this can be trivially changed to any
             * character you wish with this parameter.
             */
            "sThousands": ",",


            /**
             * Detail the action that will be taken when the drop down menu for the
             * pagination length option is changed. The '_MENU_' variable is replaced
             * with a default select list of 10, 25, 50 and 100, and can be replaced
             * with a custom select box if required.
             */
            "sLengthMenu": "_MENU_ _ENTRIES_ per page",


            /**
             * When using Ajax sourced data and during the first draw when DataTables is
             * gathering the data, this message is shown in an empty row in the table to
             * indicate to the end user the the data is being loaded. Note that this
             * parameter is not used when loading data by server-side processing, just
             * Ajax sourced data with client-side processing.
             */
            "sLoadingRecords": "Loading...",


            /**
             * Text which is displayed when the table is processing a user action
             * (usually a sort command or similar).
             */
            "sProcessing": "",


            /**
             * Details the actions that will be taken when the user types into the
             * filtering input text box. The variable "_INPUT_", if used in the string,
             * is replaced with the HTML text box for the filtering input allowing
             * control over where it appears in the string. If "_INPUT_" is not given
             * then the input box is appended to the string automatically.
             */
            "sSearch": "Search:",


            /**
             * Assign a `placeholder` attribute to the search `input` element
             *  @type string
             *  @default
             *
             *  @dtopt Language
             *  @name DataTable.defaults.language.searchPlaceholder
             */
            "sSearchPlaceholder": "",


            /**
             * All of the language information can be stored in a file on the
             * server-side, which DataTables will look up if this parameter is passed.
             * It must store the URL of the language file, which is in a JSON format,
             * and the object has the same properties as the oLanguage object in the
             * initialiser object (i.e. the above parameters). Please refer to one of
             * the example language files to see how this works in action.
             */
            "sUrl": "",


            /**
             * Text shown inside the table records when the is no information to be
             * displayed after filtering. `emptyTable` is shown when there is simply no
             * information in the table at all (regardless of filtering).
             */
            "sZeroRecords": "No matching records found"
        },


        /** The initial data order is reversed when `desc` ordering */
        orderDescReverse: true,


        /**
         * This parameter allows you to have define the global filtering state at
         * initialisation time. As an object the `search` parameter must be
         * defined, but all other parameters are optional. When `regex` is true,
         * the search string will be treated as a regular expression, when false
         * (default) it will be treated as a straight string. When `smart`
         * DataTables will use it's smart filtering methods (to word match at
         * any point in the data), when false this will not be done.
         */
        "oSearch": $.extend( {}, DataTable.models.oSearch ),


        /**
         * Table and control layout. This replaces the legacy `dom` option.
         */
        layout: {
            topStart: 'pageLength',
            topEnd: 'search',
            bottomStart: 'info',
            bottomEnd: 'paging'
        },


        /**
         * Legacy DOM layout option
         */
        "sDom": null,


        /**
         * Search delay option. This will throttle full table searches that use the
         * DataTables provided search input element (it does not effect calls to
         * `dt-api search()`, providing a delay before the search is made.
         */
        "searchDelay": null,


        /**
         * DataTables features six different built-in options for the buttons to
         * display for pagination control:
         *
         * * `numbers` - Page number buttons only
         * * `simple` - 'Previous' and 'Next' buttons only
         * * 'simple_numbers` - 'Previous' and 'Next' buttons, plus page numbers
         * * `full` - 'First', 'Previous', 'Next' and 'Last' buttons
         * * `full_numbers` - 'First', 'Previous', 'Next' and 'Last' buttons, plus page numbers
         * * `first_last_numbers` - 'First' and 'Last' buttons, plus page numbers
         */
        "sPaginationType": "",


        /**
         * Enable horizontal scrolling. When a table is too wide to fit into a
         * certain layout, or you have a large number of columns in the table, you
         * can enable x-scrolling to show the table in a viewport, which can be
         * scrolled. This property can be `true` which will allow the table to
         * scroll horizontally when needed, or any CSS unit, or a number (in which
         * case it will be treated as a pixel measurement). Setting as simply `true`
         * is recommended.
         */
        "sScrollX": "",


        /**
         * This property can be used to force a DataTable to use more width than it
         * might otherwise do when x-scrolling is enabled. For example if you have a
         * table which requires to be well spaced, this parameter is useful for
         * "over-sizing" the table, and thus forcing scrolling. This property can by
         * any CSS unit, or a number (in which case it will be treated as a pixel
         * measurement).
         */
        "sScrollXInner": "",


        /**
         * Enable vertical scrolling. Vertical scrolling will constrain the DataTable
         * to the given height, and enable scrolling for any data which overflows the
         * current viewport. This can be used as an alternative to paging to display
         * a lot of data in a small area (although paging and scrolling can both be
         * enabled at the same time). This property can be any CSS unit, or a number
         * (in which case it will be treated as a pixel measurement).
         */
        "sScrollY": "",


        /**
         * __Deprecated__ The functionality provided by this parameter has now been
         * superseded by that provided through `ajax`, which should be used instead.
         *
         * Set the HTTP method that is used to make the Ajax call for server-side
         * processing or Ajax sourced data.
         */
        "sServerMethod": "GET",


        /**
         * DataTables makes use of renderers when displaying HTML elements for
         * a table. These renderers can be added or modified by plug-ins to
         * generate suitable mark-up for a site. For example the Bootstrap
         * integration plug-in for DataTables uses a paging button renderer to
         * display pagination buttons in the mark-up required by Bootstrap.
         *
         * For further information about the renderers available see
         * DataTable.ext.renderer
         */
        "renderer": null,


        /**
         * Set the data property name that DataTables should use to get a row's id
         * to set as the `id` property in the node.
         */
        "rowId": "DT_RowId",


        /**
         * Caption value
         */
        "caption": null,


        /**
         * For server-side processing - use the data from the DOM for the first draw
         */
        iDeferLoading: null
    };

    _fnHungarianMap( DataTable.defaults );



    /*
	 * Developer note - See note in model.defaults.js about the use of Hungarian
	 * notation and camel case.
	 */

    /**
     * Column options that can be given to DataTables at initialisation time.
     *  @namespace
     */
    DataTable.defaults.column = {
        /**
         * Define which column(s) an order will occur on for this column. This
         * allows a column's ordering to take multiple columns into account when
         * doing a sort or use the data from a different column. For example first
         * name / last name columns make sense to do a multi-column sort over the
         * two columns.
         */
        "aDataSort": null,
        "iDataSort": -1,

        ariaTitle: '',


        /**
         * You can control the default ordering direction, and even alter the
         * behaviour of the sort handler (i.e. only allow ascending ordering etc)
         * using this parameter.
         */
        "asSorting": [ 'asc', 'desc', '' ],


        /**
         * Enable or disable filtering on the data in this column.
         */
        "bSearchable": true,


        /**
         * Enable or disable ordering on this column.
         */
        "bSortable": true,


        /**
         * Enable or disable the display of this column.
         */
        "bVisible": true,


        /**
         * Developer definable function that is called whenever a cell is created (Ajax source,
         * etc) or processed for input (DOM source). This can be used as a compliment to mRender
         * allowing you to modify the DOM element (add background colour for example) when the
         * element is available.
         */
        "fnCreatedCell": null,


        /**
         * This property can be used to read data from any data source property,
         * including deeply nested objects / properties. `data` can be given in a
         * number of different ways which effect its behaviour:
         *
         * * `integer` - treated as an array index for the data source. This is the
         *   default that DataTables uses (incrementally increased for each column).
         * * `string` - read an object property from the data source. There are
         *   three 'special' options that can be used in the string to alter how
         *   DataTables reads the data from the source object:
         *    * `.` - Dotted Javascript notation. Just as you use a `.` in
         *      Javascript to read from nested objects, so to can the options
         *      specified in `data`. For example: `browser.version` or
         *      `browser.name`. If your object parameter name contains a period, use
         *      `\\` to escape it - i.e. `first\\.name`.
         *    * `[]` - Array notation. DataTables can automatically combine data
         *      from and array source, joining the data with the characters provided
         *      between the two brackets. For example: `name[, ]` would provide a
         *      comma-space separated list from the source array. If no characters
         *      are provided between the brackets, the original array source is
         *      returned.
         *    * `()` - Function notation. Adding `()` to the end of a parameter will
         *      execute a function of the name given. For example: `browser()` for a
         *      simple function on the data source, `browser.version()` for a
         *      function in a nested property or even `browser().version` to get an
         *      object property if the function called returns an object. Note that
         *      function notation is recommended for use in `render` rather than
         *      `data` as it is much simpler to use as a renderer.
         * * `null` - use the original data source for the row rather than plucking
         *   data directly from it. This action has effects on two other
         *   initialisation options:
         *    * `defaultContent` - When null is given as the `data` option and
         *      `defaultContent` is specified for the column, the value defined by
         *      `defaultContent` will be used for the cell.
         *    * `render` - When null is used for the `data` option and the `render`
         *      option is specified for the column, the whole data source for the
         *      row is used for the renderer.
         * * `function` - the function given will be executed whenever DataTables
         *   needs to set or get the data for a cell in the column. The function
         *   takes three parameters:
         *    * Parameters:
         *      * `{array|object}` The data source for the row
         *      * `{string}` The type call data requested - this will be 'set' when
         *        setting data or 'filter', 'display', 'type', 'sort' or undefined
         *        when gathering data. Note that when `undefined` is given for the
         *        type DataTables expects to get the raw data for the object back<
         *      * `{*}` Data to set when the second parameter is 'set'.
         *    * Return:
         *      * The return value from the function is not required when 'set' is
         *        the type of call, but otherwise the return is what will be used
         *        for the data requested.
         *
         * Note that `data` is a getter and setter option. If you just require
         * formatting of data for output, you will likely want to use `render` which
         * is simply a getter and thus simpler to use.
         *
         * Note that prior to DataTables 1.9.2 `data` was called `mDataProp`. The
         * name change reflects the flexibility of this property and is consistent
         * with the naming of mRender. If 'mDataProp' is given, then it will still
         * be used by DataTables, as it automatically maps the old name to the new
         * if required.
         */
        "mData": null,


        /**
         * This property is the rendering partner to `data` and it is suggested that
         * when you want to manipulate data for display (including filtering,
         * sorting etc) without altering the underlying data for the table, use this
         * property. `render` can be considered to be the the read only companion to
         * `data` which is read / write (then as such more complex). Like `data`
         * this option can be given in a number of different ways to effect its
         * behaviour:
         *
         * * `integer` - treated as an array index for the data source. This is the
         *   default that DataTables uses (incrementally increased for each column).
         * * `string` - read an object property from the data source. There are
         *   three 'special' options that can be used in the string to alter how
         *   DataTables reads the data from the source object:
         *    * `.` - Dotted Javascript notation. Just as you use a `.` in
         *      Javascript to read from nested objects, so to can the options
         *      specified in `data`. For example: `browser.version` or
         *      `browser.name`. If your object parameter name contains a period, use
         *      `\\` to escape it - i.e. `first\\.name`.
         *    * `[]` - Array notation. DataTables can automatically combine data
         *      from and array source, joining the data with the characters provided
         *      between the two brackets. For example: `name[, ]` would provide a
         *      comma-space separated list from the source array. If no characters
         *      are provided between the brackets, the original array source is
         *      returned.
         *    * `()` - Function notation. Adding `()` to the end of a parameter will
         *      execute a function of the name given. For example: `browser()` for a
         *      simple function on the data source, `browser.version()` for a
         *      function in a nested property or even `browser().version` to get an
         *      object property if the function called returns an object.
         * * `object` - use different data for the different data types requested by
         *   DataTables ('filter', 'display', 'type' or 'sort'). The property names
         *   of the object is the data type the property refers to and the value can
         *   defined using an integer, string or function using the same rules as
         *   `render` normally does. Note that an `_` option _must_ be specified.
         *   This is the default value to use if you haven't specified a value for
         *   the data type requested by DataTables.
         * * `function` - the function given will be executed whenever DataTables
         *   needs to set or get the data for a cell in the column. The function
         *   takes three parameters:
         *    * Parameters:
         *      * {array|object} The data source for the row (based on `data`)
         *      * {string} The type call data requested - this will be 'filter',
         *        'display', 'type' or 'sort'.
         *      * {array|object} The full data source for the row (not based on
         *        `data`)
         *    * Return:
         *      * The return value from the function is what will be used for the
         *        data requested.
         */
        "mRender": null,


        /**
         * Change the cell type created for the column - either TD cells or TH cells. This
         * can be useful as TH cells have semantic meaning in the table body, allowing them
         * to act as a header for a row (you may wish to add scope='row' to the TH elements).
         */
        "sCellType": "td",


        /**
         * Class to give to each cell in this column.
         */
        "sClass": "",

        /**
         * When DataTables calculates the column widths to assign to each column,
         * it finds the longest string in each column and then constructs a
         * temporary table and reads the widths from that. The problem with this
         * is that "mmm" is much wider then "iiii", but the latter is a longer
         * string - thus the calculation can go wrong (doing it properly and putting
         * it into an DOM object and measuring that is horribly(!) slow). Thus as
         * a "work around" we provide this option. It will append its value to the
         * text that is found to be the longest string for the column - i.e. padding.
         * Generally you shouldn't need this!
         */
        "sContentPadding": "",


        /**
         * Allows a default value to be given for a column's data, and will be used
         * whenever a null data source is encountered (this can be because `data`
         * is set to null, or because the data source itself is null).
         */
        "sDefaultContent": null,


        /**
         * This parameter is only used in DataTables' server-side processing. It can
         * be exceptionally useful to know what columns are being displayed on the
         * client side, and to map these to database fields. When defined, the names
         * also allow DataTables to reorder information from the server if it comes
         * back in an unexpected order (i.e. if you switch your columns around on the
         * client-side, your server-side code does not also need updating).
         */
        "sName": "",


        /**
         * Defines a data source type for the ordering which can be used to read
         * real-time information from the table (updating the internally cached
         * version) prior to ordering. This allows ordering to occur on user
         * editable elements such as form inputs.
         */
        "sSortDataType": "std",


        /**
         * The title of this column.
         */
        "sTitle": null,


        /**
         * The type allows you to specify how the data for this column will be
         * ordered. Four types (string, numeric, date and html (which will strip
         * HTML tags before ordering)) are currently available. Note that only date
         * formats understood by Javascript's Date() object will be accepted as type
         * date. For example: "Mar 26, 2008 5:03 PM". May take the values: 'string',
         * 'numeric', 'date' or 'html' (by default). Further types can be adding
         * through plug-ins.
         */
        "sType": null,


        /**
         * Defining the width of the column, this parameter may take any CSS value
         * (3em, 20px etc). DataTables applies 'smart' widths to columns which have not
         * been given a specific width through this interface ensuring that the table
         * remains readable.
         */
        "sWidth": null
    };

    _fnHungarianMap( DataTable.defaults.column );



    /**
     * DataTables settings object - this holds all the information needed for a
     * given table, including configuration, data and current application of the
     * table options. DataTables does not have a single instance for each DataTable
     * with the settings attached to that instance, but rather instances of the
     * DataTable "class" are created on-the-fly as needed (typically by a
     * $().dataTable() call) and the settings object is then applied to that
     * instance.
     *
     * Note that this object is related to {@link DataTable.defaults} but this
     * one is the internal data store for DataTables's cache of columns. It should
     * NOT be manipulated outside of DataTables. Any configuration should be done
     * through the initialisation options.
     */
    DataTable.models.oSettings = {
        /**
         * Primary features of DataTables and their enablement state.
         */
        "oFeatures": {

            /**
             * Flag to say if DataTables should automatically try to calculate the
             * optimum table and columns widths (true) or not (false).
             * Note that this parameter will be set by the initialisation routine. To
             * set a default use {@link DataTable.defaults}.
             */
            "bAutoWidth": null,

            /**
             * Delay the creation of TR and TD elements until they are actually
             * needed by a driven page draw. This can give a significant speed
             * increase for Ajax source and Javascript source data, but makes no
             * difference at all for DOM and server-side processing tables.
             * Note that this parameter will be set by the initialisation routine. To
             * set a default use {@link DataTable.defaults}.
             */
            "bDeferRender": null,

            /**
             * Enable filtering on the table or not. Note that if this is disabled
             * then there is no filtering at all on the table, including fnFilter.
             * To just remove the filtering input use sDom and remove the 'f' option.
             * Note that this parameter will be set by the initialisation routine. To
             * set a default use {@link DataTable.defaults}.
             */
            "bFilter": null,

            /**
             * Used only for compatiblity with DT1
             * @deprecated
             */
            "bInfo": true,

            /**
             * Used only for compatiblity with DT1
             * @deprecated
             */
            "bLengthChange": true,

            /**
             * Pagination enabled or not. Note that if this is disabled then length
             * changing must also be disabled.
             * Note that this parameter will be set by the initialisation routine. To
             * set a default use {@link DataTable.defaults}.
             */
            "bPaginate": null,

            /**
             * Processing indicator enable flag whenever DataTables is enacting a
             * user request - typically an Ajax request for server-side processing.
             * Note that this parameter will be set by the initialisation routine. To
             * set a default use {@link DataTable.defaults}.
             */
            "bProcessing": null,

            /**
             * Server-side processing enabled flag - when enabled DataTables will
             * get all data from the server for every draw - there is no filtering,
             * sorting or paging done on the client-side.
             * Note that this parameter will be set by the initialisation routine. To
             * set a default use {@link DataTable.defaults}.
             */
            "bServerSide": null,

            /**
             * Sorting enablement flag.
             * Note that this parameter will be set by the initialisation routine. To
             * set a default use {@link DataTable.defaults}.
             */
            "bSort": null,

            /**
             * Multi-column sorting
             * Note that this parameter will be set by the initialisation routine. To
             * set a default use {@link DataTable.defaults}.
             */
            "bSortMulti": null,

            /**
             * Apply a class to the columns which are being sorted to provide a
             * visual highlight or not. This can slow things down when enabled since
             * there is a lot of DOM interaction.
             * Note that this parameter will be set by the initialisation routine. To
             * set a default use {@link DataTable.defaults}.
             */
            "bSortClasses": null,

            /**
             * State saving enablement flag.
             * Note that this parameter will be set by the initialisation routine. To
             * set a default use {@link DataTable.defaults}.
             */
            "bStateSave": null
        },


        /**
         * Scrolling settings for a table.
         */
        "oScroll": {
            /**
             * When the table is shorter in height than sScrollY, collapse the
             * table container down to the height of the table (when true).
             * Note that this parameter will be set by the initialisation routine. To
             * set a default use {@link DataTable.defaults}.
             */
            "bCollapse": null,

            /**
             * Width of the scrollbar for the web-browser's platform. Calculated
             * during table initialisation.
             */
            "iBarWidth": 0,

            /**
             * Viewport width for horizontal scrolling. Horizontal scrolling is
             * disabled if an empty string.
             * Note that this parameter will be set by the initialisation routine. To
             * set a default use {@link DataTable.defaults}.
             */
            "sX": null,

            /**
             * Width to expand the table to when using x-scrolling. Typically you
             * should not need to use this.
             * Note that this parameter will be set by the initialisation routine. To
             * set a default use {@link DataTable.defaults}.
             *  @deprecated
             */
            "sXInner": null,

            /**
             * Viewport height for vertical scrolling. Vertical scrolling is disabled
             * if an empty string.
             * Note that this parameter will be set by the initialisation routine. To
             * set a default use {@link DataTable.defaults}.
             */
            "sY": null
        },

        /**
         * Language information for the table.
         */
        "oLanguage": {
            /**
             * Information callback function. See
             * {@link DataTable.defaults.fnInfoCallback}
             */
            "fnInfoCallback": null
        },

        /**
         * Browser support parameters
         */
        "oBrowser": {
            /**
             * Determine if the vertical scrollbar is on the right or left of the
             * scrolling container - needed for rtl language layout, although not
             * all browsers move the scrollbar (Safari).
             */
            "bScrollbarLeft": false,

            /**
             * Browser scrollbar width
             */
            "barWidth": 0
        },


        "ajax": null,


        /**
         * Array referencing the nodes which are used for the features. The
         * parameters of this object match what is allowed by sDom - i.e.
         *   <ul>
         *     <li>'l' - Length changing</li>
         *     <li>'f' - Filtering input</li>
         *     <li>'t' - The table!</li>
         *     <li>'i' - Information</li>
         *     <li>'p' - Pagination</li>
         *     <li>'r' - pRocessing</li>
         *   </ul>
         */
        "aanFeatures": [],

        /**
         * Store data information - see {@link DataTable.models.oRow} for detailed
         * information.
         */
        "aoData": [],

        /**
         * Array of indexes which are in the current display (after filtering etc)
         */
        "aiDisplay": [],

        /**
         * Array of indexes for display - no filtering
         */
        "aiDisplayMaster": [],

        /**
         * Map of row ids to data indexes
         */
        "aIds": {},

        /**
         * Store information about each column that is in use
         */
        "aoColumns": [],

        /**
         * Store information about the table's header
         */
        "aoHeader": [],

        /**
         * Store information about the table's footer
         */
        "aoFooter": [],

        /**
         * Store the applied global search information in case we want to force a
         * research or compare the old search to a new one.
         * Note that this parameter will be set by the initialisation routine. To
         * set a default use {@link DataTable.defaults}.
         */
        "oPreviousSearch": {},

        /**
         * Store for named searches
         */
        searchFixed: {},

        /**
         * Store the applied search for each column - see
         * {@link DataTable.models.oSearch} for the format that is used for the
         * filtering information for each column.
         */
        "aoPreSearchCols": [],

        /**
         * Sorting that is applied to the table. Note that the inner arrays are
         * used in the following manner:
         * <ul>
         *   <li>Index 0 - column number</li>
         *   <li>Index 1 - current sorting direction</li>
         * </ul>
         * Note that this parameter will be set by the initialisation routine. To
         * set a default use {@link DataTable.defaults}.
         */
        "aaSorting": null,

        /**
         * Sorting that is always applied to the table (i.e. prefixed in front of
         * aaSorting).
         * Note that this parameter will be set by the initialisation routine. To
         * set a default use {@link DataTable.defaults}.
         */
        "aaSortingFixed": [],

        /**
         * If restoring a table - we should restore its width
         */
        "sDestroyWidth": 0,

        /**
         * Callback functions array for every time a row is inserted (i.e. on a draw).
         */
        "aoRowCallback": [],

        /**
         * Callback functions for the header on each draw.
         */
        "aoHeaderCallback": [],

        /**
         * Callback function for the footer on each draw.
         */
        "aoFooterCallback": [],

        /**
         * Array of callback functions for draw callback functions
         */
        "aoDrawCallback": [],

        /**
         * Array of callback functions for row created function
         */
        "aoRowCreatedCallback": [],

        /**
         * Callback functions for just before the table is redrawn. A return of
         * false will be used to cancel the draw.
         */
        "aoPreDrawCallback": [],

        /**
         * Callback functions for when the table has been initialised.
         */
        "aoInitComplete": [],


        /**
         * Callbacks for modifying the settings to be stored for state saving, prior to
         * saving state.
         */
        "aoStateSaveParams": [],

        /**
         * Callbacks for modifying the settings that have been stored for state saving
         * prior to using the stored values to restore the state.
         */
        "aoStateLoadParams": [],

        /**
         * Callbacks for operating on the settings object once the saved state has been
         * loaded
         */
        "aoStateLoaded": [],

        /**
         * Cache the table ID for quick access
         */
        "sTableId": "",

        /**
         * The TABLE node for the main table
         */
        "nTable": null,

        /**
         * Permanent ref to the thead element
         */
        "nTHead": null,

        /**
         * Permanent ref to the tfoot element - if it exists
         */
        "nTFoot": null,

        /**
         * Permanent ref to the tbody element
         */
        "nTBody": null,

        /**
         * Cache the wrapper node (contains all DataTables controlled elements)
         */
        "nTableWrapper": null,

        /**
         * Indicate if all required information has been read in
         */
        "bInitialised": false,

        /**
         * Information about open rows. Each object in the array has the parameters
         * 'nTr' and 'nParent'
         */
        "aoOpenRows": [],

        /**
         * Dictate the positioning of DataTables' control elements - see
         * {@link DataTable.model.oInit.sDom}.
         * Note that this parameter will be set by the initialisation routine. To
         * set a default use {@link DataTable.defaults}.
         */
        "sDom": null,

        /**
         * Search delay (in mS)
         */
        "searchDelay": null,

        /**
         * Which type of pagination should be used.
         * Note that this parameter will be set by the initialisation routine. To
         * set a default use {@link DataTable.defaults}.
         */
        "sPaginationType": "two_button",

        /**
         * Number of paging controls on the page. Only used for backwards compatibility
         */
        pagingControls: 0,

        /**
         * The state duration (for `stateSave`) in seconds.
         * Note that this parameter will be set by the initialisation routine. To
         * set a default use {@link DataTable.defaults}.
         */
        "iStateDuration": 0,

        /**
         * Array of callback functions for state saving. Each array element is an
         * object with the following parameters:
         *   <ul>
         *     <li>function:fn - function to call. Takes two parameters, oSettings
         *       and the JSON string to save that has been thus far created. Returns
         *       a JSON string to be inserted into a json object
         *       (i.e. '"param": [ 0, 1, 2]')</li>
         *     <li>string:sName - name of callback</li>
         *   </ul>
         */
        "aoStateSave": [],

        /**
         * Array of callback functions for state loading. Each array element is an
         * object with the following parameters:
         *   <ul>
         *     <li>function:fn - function to call. Takes two parameters, oSettings
         *       and the object stored. May return false to cancel state loading</li>
         *     <li>string:sName - name of callback</li>
         *   </ul>
         */
        "aoStateLoad": [],

        /**
         * State that was saved. Useful for back reference
         */
        "oSavedState": null,

        /**
         * State that was loaded. Useful for back reference
         */
        "oLoadedState": null,

        /**
         * Note if draw should be blocked while getting data
         */
        "bAjaxDataGet": true,

        /**
         * The last jQuery XHR object that was used for server-side data gathering.
         * This can be used for working with the XHR information in one of the
         * callbacks
         */
        "jqXHR": null,

        /**
         * JSON returned from the server in the last Ajax request
         */
        "json": undefined,

        /**
         * Data submitted as part of the last Ajax request
         */
        "oAjaxData": undefined,

        /**
         * Send the XHR HTTP method - GET or POST (could be PUT or DELETE if
         * required).
         * Note that this parameter will be set by the initialisation routine. To
         * set a default use {@link DataTable.defaults}.
         */
        "sServerMethod": null,

        /**
         * Format numbers for display.
         * Note that this parameter will be set by the initialisation routine. To
         * set a default use {@link DataTable.defaults}.
         */
        "fnFormatNumber": null,

        /**
         * List of options that can be used for the user selectable length menu.
         * Note that this parameter will be set by the initialisation routine. To
         * set a default use {@link DataTable.defaults}.
         */
        "aLengthMenu": null,

        /**
         * Counter for the draws that the table does. Also used as a tracker for
         * server-side processing
         */
        "iDraw": 0,

        /**
         * Indicate if a redraw is being done - useful for Ajax
         */
        "bDrawing": false,

        /**
         * Draw index (iDraw) of the last error when parsing the returned data
         */
        "iDrawError": -1,

        /**
         * Paging display length
         */
        "_iDisplayLength": 10,

        /**
         * Paging start point - aiDisplay index
         */
        "_iDisplayStart": 0,

        /**
         * Server-side processing - number of records in the result set
         * (i.e. before filtering), Use fnRecordsTotal rather than
         * this property to get the value of the number of records, regardless of
         * the server-side processing setting.
         */
        "_iRecordsTotal": 0,

        /**
         * Server-side processing - number of records in the current display set
         * (i.e. after filtering). Use fnRecordsDisplay rather than
         * this property to get the value of the number of records, regardless of
         * the server-side processing setting.
         */
        "_iRecordsDisplay": 0,

        /**
         * The classes to use for the table
         */
        "oClasses": {},

        /**
         * Flag attached to the settings object so you can check in the draw
         * callback if filtering has been done in the draw. Deprecated in favour of
         * events.
         *  @deprecated
         */
        "bFiltered": false,

        /**
         * Flag attached to the settings object so you can check in the draw
         * callback if sorting has been done in the draw. Deprecated in favour of
         * events.
         *  @deprecated
         */
        "bSorted": false,

        /**
         * Indicate that if multiple rows are in the header and there is more than
         * one unique cell per column, if the top one (true) or bottom one (false)
         * should be used for sorting / title by DataTables.
         * Note that this parameter will be set by the initialisation routine. To
         * set a default use {@link DataTable.defaults}.
         */
        "bSortCellsTop": null,

        /**
         * Initialisation object that is used for the table
         */
        "oInit": null,

        /**
         * Destroy callback functions - for plug-ins to attach themselves to the
         * destroy so they can clean up markup and events.
         */
        "aoDestroyCallback": [],


        /**
         * Get the number of records in the current record set, before filtering
         */
        "fnRecordsTotal": function ()
        {
            return _fnDataSource( this ) == 'ssp' ?
                this._iRecordsTotal * 1 :
                this.aiDisplayMaster.length;
        },

        /**
         * Get the number of records in the current record set, after filtering
         */
        "fnRecordsDisplay": function ()
        {
            return _fnDataSource( this ) == 'ssp' ?
                this._iRecordsDisplay * 1 :
                this.aiDisplay.length;
        },

        /**
         * Get the display end point - aiDisplay index
         */
        "fnDisplayEnd": function ()
        {
            var
                len      = this._iDisplayLength,
                start    = this._iDisplayStart,
                calc     = start + len,
                records  = this.aiDisplay.length,
                features = this.oFeatures,
                paginate = features.bPaginate;

            if ( features.bServerSide ) {
                return paginate === false || len === -1 ?
                    start + records :
                    Math.min( start+len, this._iRecordsDisplay );
            }
            else {
                return ! paginate || calc>records || len===-1 ?
                    records :
                    calc;
            }
        },

        /**
         * The DataTables object for this table
         */
        "oInstance": null,

        /**
         * Unique identifier for each instance of the DataTables object. If there
         * is an ID on the table node, then it takes that value, otherwise an
         * incrementing internal counter is used.
         */
        "sInstance": null,

        /**
         * tabindex attribute value that is added to DataTables control elements, allowing
         * keyboard navigation of the table and its controls.
         */
        "iTabIndex": 0,

        /**
         * DIV container for the footer scrolling table if scrolling
         */
        "nScrollHead": null,

        /**
         * DIV container for the footer scrolling table if scrolling
         */
        "nScrollFoot": null,

        /**
         * Last applied sort
         */
        "aLastSort": [],

        /**
         * Stored plug-in instances
         */
        "oPlugins": {},

        /**
         * Function used to get a row's id from the row's data
         */
        "rowIdFn": null,

        /**
         * Data location where to store a row's id
         */
        "rowId": null,

        caption: '',

        captionNode: null,

        colgroup: null,

        /** Delay loading of data */
        deferLoading: null
    };

    /**
     * Extension object for DataTables that is used to provide all extension
     * options.
     *
     * Note that the `DataTable.ext` object is available through
     * `jQuery.fn.dataTable.ext` where it may be accessed and manipulated. It is
     * also aliased to `jQuery.fn.dataTableExt` for historic reasons.
     *  @namespace
     *  @extends DataTable.models.ext
     */


    var extPagination = DataTable.ext.pager;

    // Paging buttons configuration
    $.extend( extPagination, {
        simple: function () {
            return [ 'previous', 'next' ];
        },

        full: function () {
            return [ 'first', 'previous', 'next', 'last' ];
        },

        numbers: function () {
            return [ 'numbers' ];
        },

        simple_numbers: function () {
            return [ 'previous', 'numbers', 'next' ];
        },

        full_numbers: function () {
            return [ 'first', 'previous', 'numbers', 'next', 'last' ];
        },

        first_last: function () {
            return ['first', 'last'];
        },

        first_last_numbers: function () {
            return ['first', 'numbers', 'last'];
        },

        // For testing and plug-ins to use
        _numbers: _pagingNumbers,

        // Number of number buttons - legacy, use `numbers` option for paging feature
        numbers_length: 7
    } );


    $.extend( true, DataTable.ext.renderer, {
        pagingButton: {
            _: function (settings, buttonType, content, active, disabled) {
                var classes = settings.oClasses.paging;
                var btnClasses = [classes.button];
                var btn;

                if (active) {
                    btnClasses.push(classes.active);
                }

                if (disabled) {
                    btnClasses.push(classes.disabled)
                }

                if (buttonType === 'ellipsis') {
                    btn = $('<span class="ellipsis"></span>').html(content)[0];
                }
                else {
                    btn = $('<button>', {
                        class: btnClasses.join(' '),
                        role: 'link',
                        type: 'button'
                    }).html(content);
                }

                return {
                    display: btn,
                    clicker: btn
                }
            }
        },

        pagingContainer: {
            _: function (settings, buttons) {
                // No wrapping element - just append directly to the host
                return buttons;
            }
        }
    } );

    // Common function to remove new lines, strip HTML and diacritic control
    var _filterString = function (stripHtml, normalize) {
        return function (str) {
            if (_empty(str) || typeof str !== 'string') {
                return str;
            }

            str = str.replace( _re_new_lines, " " );

            if (stripHtml) {
                str = _stripHtml(str);
            }

            if (normalize) {
                str = _normalize(str, false);
            }

            return str;
        };
    }

    /*
	 * Public helper functions. These aren't used internally by DataTables, or
	 * called by any of the options passed into DataTables, but they can be used
	 * externally by developers working with DataTables. They are helper functions
	 * to make working with DataTables a little bit easier.
	 */

    /**
     * Common logic for moment, luxon or a date action.
     *
     * Happens after __mldObj, so don't need to call `resolveWindowsLibs` again
     */
    function __mld( dtLib, momentFn, luxonFn, dateFn, arg1 ) {
        if (__moment) {
            return dtLib[momentFn]( arg1 );
        }
        else if (__luxon) {
            return dtLib[luxonFn]( arg1 );
        }

        return dateFn ? dtLib[dateFn]( arg1 ) : dtLib;
    }


    var __mlWarning = false;
    var __luxon; // Can be assigned in DateTeble.use()
    var __moment; // Can be assigned in DateTeble.use()

    /**
     *
     */
    function resolveWindowLibs() {
        if (window.luxon && ! __luxon) {
            __luxon = window.luxon;
        }

        if (window.moment && ! __moment) {
            __moment = window.moment;
        }
    }

    function __mldObj (d, format, locale) {
        var dt;

        resolveWindowLibs();

        if (__moment) {
            dt = __moment.utc( d, format, locale, true );

            if (! dt.isValid()) {
                return null;
            }
        }
        else if (__luxon) {
            dt = format && typeof d === 'string'
                ? __luxon.DateTime.fromFormat( d, format )
                : __luxon.DateTime.fromISO( d );

            if (! dt.isValid) {
                return null;
            }

            dt.setLocale(locale);
        }
        else if (! format) {
            // No format given, must be ISO
            dt = new Date(d);
        }
        else {
            if (! __mlWarning) {
                alert('DataTables warning: Formatted date without Moment.js or Luxon - https://datatables.net/tn/17');
            }

            __mlWarning = true;
        }

        return dt;
    }

    // Wrapper for date, datetime and time which all operate the same way with the exception of
    // the output string for auto locale support
    function __mlHelper (localeString) {
        return function ( from, to, locale, def ) {
            // Luxon and Moment support
            // Argument shifting
            if ( arguments.length === 0 ) {
                locale = 'en';
                to = null; // means toLocaleString
                from = null; // means iso8601
            }
            else if ( arguments.length === 1 ) {
                locale = 'en';
                to = from;
                from = null;
            }
            else if ( arguments.length === 2 ) {
                locale = to;
                to = from;
                from = null;
            }

            var typeName = 'datetime' + (to ? '-' + to : '');

            // Add type detection and sorting specific to this date format - we need to be able to identify
            // date type columns as such, rather than as numbers in extensions. Hence the need for this.
            if (! DataTable.ext.type.order[typeName]) {
                DataTable.type(typeName, {
                    detect: function (d) {
                        // The renderer will give the value to type detect as the type!
                        return d === typeName ? typeName : false;
                    },
                    order: {
                        pre: function (d) {
                            // The renderer gives us Moment, Luxon or Date obects for the sorting, all of which have a
                            // `valueOf` which gives milliseconds epoch
                            return d.valueOf();
                        }
                    },
                    className: 'dt-right'
                });
            }

            return function ( d, type ) {
                // Allow for a default value
                if (d === null || d === undefined) {
                    if (def === '--now') {
                        // We treat everything as UTC further down, so no changes are
                        // made, as such need to get the local date / time as if it were
                        // UTC
                        var local = new Date();
                        d = new Date( Date.UTC(
                            local.getFullYear(), local.getMonth(), local.getDate(),
                            local.getHours(), local.getMinutes(), local.getSeconds()
                        ) );
                    }
                    else {
                        d = '';
                    }
                }

                if (type === 'type') {
                    // Typing uses the type name for fast matching
                    return typeName;
                }

                if (d === '') {
                    return type !== 'sort'
                        ? ''
                        : __mldObj('0000-01-01 00:00:00', null, locale);
                }

                // Shortcut. If `from` and `to` are the same, we are using the renderer to
                // format for ordering, not display - its already in the display format.
                if ( to !== null && from === to && type !== 'sort' && type !== 'type' && ! (d instanceof Date) ) {
                    return d;
                }

                var dt = __mldObj(d, from, locale);

                if (dt === null) {
                    return d;
                }

                if (type === 'sort') {
                    return dt;
                }

                var formatted = to === null
                    ? __mld(dt, 'toDate', 'toJSDate', '')[localeString]()
                    : __mld(dt, 'format', 'toFormat', 'toISOString', to);

                // XSS protection
                return type === 'display' ?
                    _escapeHtml( formatted ) :
                    formatted;
            };
        }
    }

    // Based on locale, determine standard number formatting
    // Fallback for legacy browsers is US English
    var __thousands = ',';
    var __decimal = '.';

    if (window.Intl !== undefined) {
        try {
            var num = new Intl.NumberFormat().formatToParts(100000.1);

            for (var i=0 ; i<num.length ; i++) {
                if (num[i].type === 'group') {
                    __thousands = num[i].value;
                }
                else if (num[i].type === 'decimal') {
                    __decimal = num[i].value;
                }
            }
        }
        catch (e) {
            // noop
        }
    }

    // Formatted date time detection - use by declaring the formats you are going to use
    DataTable.datetime = function ( format, locale ) {
        var typeName = 'datetime-' + format;

        if (! locale) {
            locale = 'en';
        }

        if (! DataTable.ext.type.order[typeName]) {
            DataTable.type(typeName, {
                detect: function (d) {
                    var dt = __mldObj(d, format, locale);
                    return d === '' || dt ? typeName : false;
                },
                order: {
                    pre: function (d) {
                        return __mldObj(d, format, locale) || 0;
                    }
                },
                className: 'dt-right'
            });
        }
    }

    /**
     * Helpers for `columns.render`.
     *
     * The options defined here can be used with the `columns.render` initialisation
     * option to provide a display renderer. The following functions are defined:
     *
     * * `moment` - Uses the MomentJS library to convert from a given format into another.
     * This renderer has three overloads:
     *   * 1 parameter:
     *     * `string` - Format to convert to (assumes input is ISO8601 and locale is `en`)
     *   * 2 parameters:
     *     * `string` - Format to convert from
     *     * `string` - Format to convert to. Assumes `en` locale
     *   * 3 parameters:
     *     * `string` - Format to convert from
     *     * `string` - Format to convert to
     *     * `string` - Locale
     * * `number` - Will format numeric data (defined by `columns.data`) for
     *   display, retaining the original unformatted data for sorting and filtering.
     *   It takes 5 parameters:
     *   * `string` - Thousands grouping separator
     *   * `string` - Decimal point indicator
     *   * `integer` - Number of decimal points to show
     *   * `string` (optional) - Prefix.
     *   * `string` (optional) - Postfix (/suffix).
     * * `text` - Escape HTML to help prevent XSS attacks. It has no optional
     *   parameters.
     *
     * @example
     *   // Column definition using the number renderer
     *   {
     *     data: "salary",
     *     render: $.fn.dataTable.render.number( '\'', '.', 0, '$' )
     *   }
     *
     * @namespace
     */
    DataTable.render = {
        date: __mlHelper('toLocaleDateString'),
        datetime: __mlHelper('toLocaleString'),
        time: __mlHelper('toLocaleTimeString'),
        number: function ( thousands, decimal, precision, prefix, postfix ) {
            // Auto locale detection
            if (thousands === null || thousands === undefined) {
                thousands = __thousands;
            }

            if (decimal === null || decimal === undefined) {
                decimal = __decimal;
            }

            return {
                display: function ( d ) {
                    if ( typeof d !== 'number' && typeof d !== 'string' ) {
                        return d;
                    }

                    if (d === '' || d === null) {
                        return d;
                    }

                    var negative = d < 0 ? '-' : '';
                    var flo = parseFloat( d );
                    var abs = Math.abs(flo);

                    // Scientific notation for large and small numbers
                    if (abs >= 100000000000 || (abs < 0.0001 && abs !== 0) ) {
                        var exp = flo.toExponential(precision).split(/e\+?/);
                        return exp[0] + ' x 10<sup>' + exp[1] + '</sup>';
                    }

                    // If NaN then there isn't much formatting that we can do - just
                    // return immediately, escaping any HTML (this was supposed to
                    // be a number after all)
                    if ( isNaN( flo ) ) {
                        return _escapeHtml( d );
                    }

                    flo = flo.toFixed( precision );
                    d = Math.abs( flo );

                    var intPart = parseInt( d, 10 );
                    var floatPart = precision ?
                        decimal+(d - intPart).toFixed( precision ).substring( 2 ):
                        '';

                    // If zero, then can't have a negative prefix
                    if (intPart === 0 && parseFloat(floatPart) === 0) {
                        negative = '';
                    }

                    return negative + (prefix||'') +
                        intPart.toString().replace(
                            /\B(?=(\d{3})+(?!\d))/g, thousands
                        ) +
                        floatPart +
                        (postfix||'');
                }
            };
        },

        text: function () {
            return {
                display: _escapeHtml,
                filter: _escapeHtml
            };
        }
    };


    var _extTypes = DataTable.ext.type;

    // Get / set type
    DataTable.type = function (name, prop, val) {
        if (! prop) {
            return {
                className: _extTypes.className[name],
                detect: _extTypes.detect.find(function (fn) {
                    return fn.name === name;
                }),
                order: {
                    pre: _extTypes.order[name + '-pre'],
                    asc: _extTypes.order[name + '-asc'],
                    desc: _extTypes.order[name + '-desc']
                },
                render: _extTypes.render[name],
                search: _extTypes.search[name]
            };
        }

        var setProp = function(prop, propVal) {
            _extTypes[prop][name] = propVal;
        };
        var setDetect = function (detect) {
            // `detect` can be a function or an object - we set a name
            // property for either - that is used for the detection
            Object.defineProperty(detect, "name", {value: name});

            var idx = _extTypes.detect.findIndex(function (item) {
                return item.name === name;
            });

            if (idx === -1) {
                _extTypes.detect.unshift(detect);
            }
            else {
                _extTypes.detect.splice(idx, 1, detect);
            }
        };
        var setOrder = function (obj) {
            _extTypes.order[name + '-pre'] = obj.pre; // can be undefined
            _extTypes.order[name + '-asc'] = obj.asc; // can be undefined
            _extTypes.order[name + '-desc'] = obj.desc; // can be undefined
        };

        // prop is optional
        if (val === undefined) {
            val = prop;
            prop = null;
        }

        if (prop === 'className') {
            setProp('className', val);
        }
        else if (prop === 'detect') {
            setDetect(val);
        }
        else if (prop === 'order') {
            setOrder(val);
        }
        else if (prop === 'render') {
            setProp('render', val);
        }
        else if (prop === 'search') {
            setProp('search', val);
        }
        else if (! prop) {
            if (val.className) {
                setProp('className', val.className);
            }

            if (val.detect !== undefined) {
                setDetect(val.detect);
            }

            if (val.order) {
                setOrder(val.order);
            }

            if (val.render !== undefined) {
                setProp('render', val.render);
            }

            if (val.search !== undefined) {
                setProp('search', val.search);
            }
        }
    }

    // Get a list of types
    DataTable.types = function () {
        return _extTypes.detect.map(function (fn) {
            return fn.name;
        });
    };

    var __diacriticSort = function (a, b) {
        a = a.toString().toLowerCase();
        b = b.toString().toLowerCase();

        // Checked for `navigator.languages` support in `oneOf` so this code can't execute in old
        // Safari and thus can disable this check
        // eslint-disable-next-line compat/compat
        return a.localeCompare(b, navigator.languages[0] || navigator.language, {
            numeric: true,
            ignorePunctuation: true,
        });
    }

    //
    // Built in data types
    //

    DataTable.type('string', {
        detect: function () {
            return 'string';
        },
        order: {
            pre: function ( a ) {
                // This is a little complex, but faster than always calling toString,
                // http://jsperf.com/tostring-v-check
                return _empty(a) ?
                    '' :
                    typeof a === 'string' ?
                        a.toLowerCase() :
                        ! a.toString ?
                            '' :
                            a.toString();
            }
        },
        search: _filterString(false, true)
    });

    DataTable.type('string-utf8', {
        detect: {
            allOf: function ( d ) {
                return true;
            },
            oneOf: function ( d ) {
                // At least one data point must contain a non-ASCII character
                // This line will also check if navigator.languages is supported or not. If not (Safari 10.0-)
                // this data type won't be supported.
                // eslint-disable-next-line compat/compat
                return ! _empty( d ) && navigator.languages && typeof d === 'string' && d.match(/[^\x00-\x7F]/);
            }
        },
        order: {
            asc: __diacriticSort,
            desc: function (a, b) {
                return __diacriticSort(a, b) * -1;
            }
        },
        search: _filterString(false, true)
    });


    DataTable.type('html', {
        detect: {
            allOf: function ( d ) {
                return _empty( d ) || (typeof d === 'string' && d.indexOf('<') !== -1);
            },
            oneOf: function ( d ) {
                // At least one data point must contain a `<`
                return ! _empty( d ) && typeof d === 'string' && d.indexOf('<') !== -1;
            }
        },
        order: {
            pre: function ( a ) {
                return _empty(a) ?
                    '' :
                    a.replace ?
                        _stripHtml(a).trim().toLowerCase() :
                        a+'';
            }
        },
        search: _filterString(true, true)
    });


    DataTable.type('date', {
        className: 'dt-type-date',
        detect: {
            allOf: function ( d ) {
                // V8 tries _very_ hard to make a string passed into `Date.parse()`
                // valid, so we need to use a regex to restrict date formats. Use a
                // plug-in for anything other than ISO8601 style strings
                if ( d && !(d instanceof Date) && ! _re_date.test(d) ) {
                    return null;
                }
                var parsed = Date.parse(d);
                return (parsed !== null && !isNaN(parsed)) || _empty(d);
            },
            oneOf: function ( d ) {
                // At least one entry must be a date or a string with a date
                return (d instanceof Date) || (typeof d === 'string' && _re_date.test(d));
            }
        },
        order: {
            pre: function ( d ) {
                var ts = Date.parse( d );
                return isNaN(ts) ? -Infinity : ts;
            }
        }
    });


    DataTable.type('html-num-fmt', {
        className: 'dt-type-numeric',
        detect: {
            allOf: function ( d, settings ) {
                var decimal = settings.oLanguage.sDecimal;
                return _htmlNumeric( d, decimal, true, false );
            },
            oneOf: function (d, settings) {
                // At least one data point must contain a numeric value
                var decimal = settings.oLanguage.sDecimal;
                return _htmlNumeric( d, decimal, true, false );
            }
        },
        order: {
            pre: function ( d, s ) {
                var dp = s.oLanguage.sDecimal;
                return __numericReplace( d, dp, _re_html, _re_formatted_numeric );
            }
        },
        search: _filterString(true, true)
    });


    DataTable.type('html-num', {
        className: 'dt-type-numeric',
        detect: {
            allOf: function ( d, settings ) {
                var decimal = settings.oLanguage.sDecimal;
                return _htmlNumeric( d, decimal, false, true );
            },
            oneOf: function (d, settings) {
                // At least one data point must contain a numeric value
                var decimal = settings.oLanguage.sDecimal;
                return _htmlNumeric( d, decimal, false, false );
            }
        },
        order: {
            pre: function ( d, s ) {
                var dp = s.oLanguage.sDecimal;
                return __numericReplace( d, dp, _re_html );
            }
        },
        search: _filterString(true, true)
    });


    DataTable.type('num-fmt', {
        className: 'dt-type-numeric',
        detect: {
            allOf: function ( d, settings ) {
                var decimal = settings.oLanguage.sDecimal;
                return _isNumber( d, decimal, true, true );
            },
            oneOf: function (d, settings) {
                // At least one data point must contain a numeric value
                var decimal = settings.oLanguage.sDecimal;
                return _isNumber( d, decimal, true, false );
            }
        },
        order: {
            pre: function ( d, s ) {
                var dp = s.oLanguage.sDecimal;
                return __numericReplace( d, dp, _re_formatted_numeric );
            }
        }
    });


    DataTable.type('num', {
        className: 'dt-type-numeric',
        detect: {
            allOf: function ( d, settings ) {
                var decimal = settings.oLanguage.sDecimal;
                return _isNumber( d, decimal, false, true );
            },
            oneOf: function (d, settings) {
                // At least one data point must contain a numeric value
                var decimal = settings.oLanguage.sDecimal;
                return _isNumber( d, decimal, false, false );
            }
        },
        order: {
            pre: function (d, s) {
                var dp = s.oLanguage.sDecimal;
                return __numericReplace( d, dp );
            }
        }
    });




    var __numericReplace = function ( d, decimalPlace, re1, re2 ) {
        if ( d !== 0 && (!d || d === '-') ) {
            return -Infinity;
        }

        var type = typeof d;

        if (type === 'number' || type === 'bigint') {
            return d;
        }

        // If a decimal place other than `.` is used, it needs to be given to the
        // function so we can detect it and replace with a `.` which is the only
        // decimal place Javascript recognises - it is not locale aware.
        if ( decimalPlace ) {
            d = _numToDecimal( d, decimalPlace );
        }

        if ( d.replace ) {
            if ( re1 ) {
                d = d.replace( re1, '' );
            }

            if ( re2 ) {
                d = d.replace( re2, '' );
            }
        }

        return d * 1;
    };


    $.extend( true, DataTable.ext.renderer, {
        footer: {
            _: function ( settings, cell, classes ) {
                cell.addClass(classes.tfoot.cell);
            }
        },

        header: {
            _: function ( settings, cell, classes ) {
                cell.addClass(classes.thead.cell);

                if (! settings.oFeatures.bSort) {
                    cell.addClass(classes.order.none);
                }

                var legacyTop = settings.bSortCellsTop;
                var headerRows = cell.closest('thead').find('tr');
                var rowIdx = cell.parent().index();

                // Conditions to not apply the ordering icons
                if (
                    // Cells and rows which have the attribute to disable the icons
                    cell.attr('data-dt-order') === 'disable' ||
                    cell.parent().attr('data-dt-order') === 'disable' ||

                    // Legacy support for `orderCellsTop`. If it is set, then cells
                    // which are not in the top or bottom row of the header (depending
                    // on the value) do not get the sorting classes applied to them
                    (legacyTop === true && rowIdx !== 0) ||
                    (legacyTop === false && rowIdx !== headerRows.length - 1)
                ) {
                    return;
                }

                // No additional mark-up required
                // Attach a sort listener to update on sort - note that using the
                // `DT` namespace will allow the event to be removed automatically
                // on destroy, while the `dt` namespaced event is the one we are
                // listening for
                $(settings.nTable).on( 'order.dt.DT column-visibility.dt.DT', function ( e, ctx ) {
                    if ( settings !== ctx ) { // need to check this this is the host
                        return;               // table, not a nested one
                    }

                    var i;
                    var orderClasses = classes.order;
                    var columns = ctx.api.columns( cell );
                    var col = settings.aoColumns[columns.flatten()[0]];
                    var orderable = columns.orderable().includes(true);
                    var ariaType = '';
                    var indexes = columns.indexes();
                    var sortDirs = columns.orderable(true).flatten();
                    var sorting = ctx.sortDetails;
                    var orderedColumns = _pluck(sorting, 'col');

                    cell
                        .removeClass(
                            orderClasses.isAsc +' '+
                            orderClasses.isDesc
                        )
                        .toggleClass( orderClasses.none, ! orderable )
                        .toggleClass( orderClasses.canAsc, orderable && sortDirs.includes('asc') )
                        .toggleClass( orderClasses.canDesc, orderable && sortDirs.includes('desc') );

                    // Determine if all of the columns that this cell covers are included in the
                    // current ordering
                    var isOrdering = true;

                    for (i=0; i<indexes.length; i++) {
                        if (! orderedColumns.includes(indexes[i])) {
                            isOrdering = false;
                        }
                    }

                    if ( isOrdering ) {
                        // Get the ordering direction for the columns under this cell
                        // Note that it is possible for a cell to be asc and desc sorting
                        // (column spanning cells)
                        var orderDirs = columns.order();

                        cell.addClass(
                            orderDirs.includes('asc') ? orderClasses.isAsc : '' +
                            orderDirs.includes('desc') ? orderClasses.isDesc : ''
                        );
                    }

                    // Find the first visible column that has ordering applied to it - it get's
                    // the aria information, as the ARIA spec says that only one column should
                    // be marked with aria-sort
                    var firstVis = -1; // column index

                    for (i=0; i<orderedColumns.length; i++) {
                        if (settings.aoColumns[orderedColumns[i]].bVisible) {
                            firstVis = orderedColumns[i];
                            break;
                        }
                    }

                    if (indexes[0] == firstVis) {
                        var firstSort = sorting[0];
                        var sortOrder = col.asSorting;

                        cell.attr('aria-sort', firstSort.dir === 'asc' ? 'ascending' : 'descending');

                        // Determine if the next click will remove sorting or change the sort
                        ariaType = ! sortOrder[firstSort.index + 1] ? 'Remove' : 'Reverse';
                    }
                    else {
                        cell.removeAttr('aria-sort');
                    }

                    cell.attr('aria-label', orderable
                        ? col.ariaTitle + ctx.api.i18n('oAria.orderable' + ariaType)
                        : col.ariaTitle
                    );

                    // Make the headers tab-able for keyboard navigation
                    if (orderable) {
                        cell.find('.dt-column-title').attr('role', 'button');
                        cell.attr('tabindex', 0)
                    }
                } );
            }
        },

        layout: {
            _: function ( settings, container, items ) {
                var classes = settings.oClasses.layout;
                var row = $('<div/>')
                    .attr('id', items.id || null)
                    .addClass(items.className || classes.row)
                    .appendTo( container );

                $.each( items, function (key, val) {
                    if (key === 'id' || key === 'className') {
                        return;
                    }

                    var klass = '';

                    if (val.table) {
                        row.addClass(classes.tableRow);
                        klass += classes.tableCell + ' ';
                    }

                    if (key === 'start') {
                        klass += classes.start;
                    }
                    else if (key === 'end') {
                        klass += classes.end;
                    }
                    else {
                        klass += classes.full;
                    }

                    $('<div/>')
                        .attr({
                            id: val.id || null,
                            "class": val.className
                                ? val.className
                                : classes.cell + ' ' + klass
                        })
                        .append( val.contents )
                        .appendTo( row );
                } );
            }
        }
    } );


    DataTable.feature = {};

    // Third parameter is internal only!
    DataTable.feature.register = function ( name, cb, legacy ) {
        DataTable.ext.features[ name ] = cb;

        if (legacy) {
            _ext.feature.push({
                cFeature: legacy,
                fnInit: cb
            });
        }
    };

    function _divProp(el, prop, val) {
        if (val) {
            el[prop] = val;
        }
    }

    DataTable.feature.register( 'div', function ( settings, opts ) {
        var n = $('<div>')[0];

        if (opts) {
            _divProp(n, 'className', opts.className);
            _divProp(n, 'id', opts.id);
            _divProp(n, 'innerHTML', opts.html);
            _divProp(n, 'textContent', opts.text);
        }

        return n;
    } );

    DataTable.feature.register( 'info', function ( settings, opts ) {
        // For compatibility with the legacy `info` top level option
        if (! settings.oFeatures.bInfo) {
            return null;
        }

        var
            lang  = settings.oLanguage,
            tid = settings.sTableId,
            n = $('<div/>', {
                'class': settings.oClasses.info.container,
            } );

        opts = $.extend({
            callback: lang.fnInfoCallback,
            empty: lang.sInfoEmpty,
            postfix: lang.sInfoPostFix,
            search: lang.sInfoFiltered,
            text: lang.sInfo,
        }, opts);


        // Update display on each draw
        settings.aoDrawCallback.push(function (s) {
            _fnUpdateInfo(s, opts, n);
        });

        // For the first info display in the table, we add a callback and aria information.
        if (! settings._infoEl) {
            n.attr({
                'aria-live': 'polite',
                id: tid+'_info',
                role: 'status'
            });

            // Table is described by our info div
            $(settings.nTable).attr( 'aria-describedby', tid+'_info' );

            settings._infoEl = n;
        }

        return n;
    }, 'i' );

    /**
     * Update the information elements in the display
     *  @param {object} settings dataTables settings object
     *  @memberof DataTable#oApi
     */
    function _fnUpdateInfo ( settings, opts, node )
    {
        var
            start = settings._iDisplayStart+1,
            end   = settings.fnDisplayEnd(),
            max   = settings.fnRecordsTotal(),
            total = settings.fnRecordsDisplay(),
            out   = total
                ? opts.text
                : opts.empty;

        if ( total !== max ) {
            // Record set after filtering
            out += ' ' + opts.search;
        }

        // Convert the macros
        out += opts.postfix;
        out = _fnMacros( settings, out );

        if ( opts.callback ) {
            out = opts.callback.call( settings.oInstance,
                settings, start, end, max, total, out
            );
        }

        node.html( out );

        _fnCallbackFire(settings, null, 'info', [settings, node[0], out]);
    }

    var __searchCounter = 0;

    // opts
    // - text
    // - placeholder
    DataTable.feature.register( 'search', function ( settings, opts ) {
        // Don't show the input if filtering isn't available on the table
        if (! settings.oFeatures.bFilter) {
            return null;
        }

        var classes = settings.oClasses.search;
        var tableId = settings.sTableId;
        var language = settings.oLanguage;
        var previousSearch = settings.oPreviousSearch;
        var input = '<input autofocus type="search" class="'+classes.input+'"/>';

        opts = $.extend({
            placeholder: language.sSearchPlaceholder,
            processing: false,
            text: language.sSearch
        }, opts);

        // The _INPUT_ is optional - is appended if not present
        if (opts.text.indexOf('_INPUT_') === -1) {
            opts.text += '_INPUT_';
        }

        opts.text = _fnMacros(settings, opts.text);

        // We can put the <input> outside of the label if it is at the start or end
        // which helps improve accessability (not all screen readers like implicit
        // for elements).
        var end = opts.text.match(/_INPUT_$/);
        var start = opts.text.match(/^_INPUT_/);
        var removed = opts.text.replace(/_INPUT_/, '');
        var str = '<label>' + opts.text + '</label>';

        if (start) {
            str = '_INPUT_<label>' + removed + '</label>';
        }
        else if (end) {
            str = '<label>' + removed + '</label>_INPUT_';
        }

        var filter = $('<div>')
            .addClass(classes.container)
            .append(str.replace(/_INPUT_/, input));

        // add for and id to label and input
        filter.find('label').attr('for', 'dt-search-' + __searchCounter);
        filter.find('input').attr('id', 'dt-search-' + __searchCounter);
        __searchCounter++;

        var searchFn = function(event) {
            var val = this.value;

            if(previousSearch.return && event.key !== "Enter") {
                return;
            }

            /* Now do the filter */
            if ( val != previousSearch.search ) {
                _fnProcessingRun(settings, opts.processing, function () {
                    previousSearch.search = val;

                    _fnFilterComplete( settings, previousSearch );

                    // Need to redraw, without resorting
                    settings._iDisplayStart = 0;
                    _fnDraw( settings );
                });
            }
        };

        var searchDelay = settings.searchDelay !== null ?
            settings.searchDelay :
            0;

        var jqFilter = $('input', filter)
            .val( previousSearch.search )
            .attr( 'placeholder', opts.placeholder )
            .on(
                'keyup.DT search.DT input.DT paste.DT cut.DT',
                searchDelay ?
                    DataTable.util.debounce( searchFn, searchDelay ) :
                    searchFn
            )
            .on( 'mouseup.DT', function(e) {
                // Edge fix! Edge 17 does not trigger anything other than mouse events when clicking
                // on the clear icon (Edge bug 17584515). This is safe in other browsers as `searchFn`
                // checks the value to see if it has changed. In other browsers it won't have.
                setTimeout( function () {
                    searchFn.call(jqFilter[0], e);
                }, 10);
            } )
            .on( 'keypress.DT', function(e) {
                /* Prevent form submission */
                if ( e.keyCode == 13 ) {
                    return false;
                }
            } )
            .attr('aria-controls', tableId);

        // Update the input elements whenever the table is filtered
        $(settings.nTable).on( 'search.dt.DT', function ( ev, s ) {
            if ( settings === s && jqFilter[0] !== document.activeElement ) {
                jqFilter.val( typeof previousSearch.search !== 'function'
                    ? previousSearch.search
                    : ''
                );
            }
        } );

        return filter;
    }, 'f' );

    // opts
    // - type - button configuration
    // - buttons - number of buttons to show - must be odd
    DataTable.feature.register( 'paging', function ( settings, opts ) {
        // Don't show the paging input if the table doesn't have paging enabled
        if (! settings.oFeatures.bPaginate) {
            return null;
        }

        opts = $.extend({
            buttons: DataTable.ext.pager.numbers_length,
            type: settings.sPaginationType,
            boundaryNumbers: true,
            firstLast: true,
            previousNext: true,
            numbers: true
        }, opts);

        var host = $('<div/>')
            .addClass(settings.oClasses.paging.container + (opts.type ? ' paging_' + opts.type : ''))
            .append('<nav>');
        var draw = function () {
            _pagingDraw(settings, host.children(), opts);
        };

        settings.aoDrawCallback.push(draw);

        // Responsive redraw of paging control
        $(settings.nTable).on('column-sizing.dt.DT', draw);

        return host;
    }, 'p' );

    /**
     * Dynamically create the button type array based on the configuration options.
     * This will only happen if the paging type is not defined.
     */
    function _pagingDynamic(opts) {
        var out = [];

        if (opts.numbers) {
            out.push('numbers');
        }

        if (opts.previousNext) {
            out.unshift('previous');
            out.push('next');
        }

        if (opts.firstLast) {
            out.unshift('first');
            out.push('last');
        }

        return out;
    }

    function _pagingDraw(settings, host, opts) {
        if (! settings._bInitComplete) {
            return;
        }

        var
            plugin = opts.type
                ? DataTable.ext.pager[ opts.type ]
                : _pagingDynamic,
            aria = settings.oLanguage.oAria.paginate || {},
            start      = settings._iDisplayStart,
            len        = settings._iDisplayLength,
            visRecords = settings.fnRecordsDisplay(),
            all        = len === -1,
            page = all ? 0 : Math.ceil( start / len ),
            pages = all ? 1 : Math.ceil( visRecords / len ),
            buttons = plugin(opts)
                .map(function (val) {
                    return val === 'numbers'
                        ? _pagingNumbers(page, pages, opts.buttons, opts.boundaryNumbers)
                        : val;
                })
                .flat();

        var buttonEls = [];

        for (var i=0 ; i<buttons.length ; i++) {
            var button = buttons[i];

            var btnInfo = _pagingButtonInfo(settings, button, page, pages);
            var btn = _fnRenderer( settings, 'pagingButton' )(
                settings,
                button,
                btnInfo.display,
                btnInfo.active,
                btnInfo.disabled
            );

            var ariaLabel = typeof button === 'string'
                ? aria[ button ]
                : aria.number
                    ? aria.number + (button+1)
                    : null;

            // Common attributes
            $(btn.clicker).attr({
                'aria-controls': settings.sTableId,
                'aria-disabled': btnInfo.disabled ? 'true' : null,
                'aria-current': btnInfo.active ? 'page' : null,
                'aria-label': ariaLabel,
                'data-dt-idx': button,
                'tabIndex': btnInfo.disabled
                    ? -1
                    : settings.iTabIndex
                        ? settings.iTabIndex
                        : null, // `0` doesn't need a tabIndex since it is the default
            });

            if (typeof button !== 'number') {
                $(btn.clicker).addClass(button);
            }

            _fnBindAction(
                btn.clicker, {action: button}, function(e) {
                    e.preventDefault();

                    _fnPageChange( settings, e.data.action, true );
                }
            );

            buttonEls.push(btn.display);
        }

        var wrapped = _fnRenderer(settings, 'pagingContainer')(
            settings, buttonEls
        );

        var activeEl = host.find(document.activeElement).data('dt-idx');

        host.empty().append(wrapped);

        if ( activeEl !== undefined ) {
            host.find( '[data-dt-idx='+activeEl+']' ).trigger('focus');
        }

        // Responsive - check if the buttons are over two lines based on the
        // height of the buttons and the container.
        if (
            buttonEls.length && // any buttons
            opts.buttons > 1 && // prevent infinite
            $(host).height() >= ($(buttonEls[0]).outerHeight() * 2) - 10
        ) {
            _pagingDraw(settings, host, $.extend({}, opts, { buttons: opts.buttons - 2 }));
        }
    }

    /**
     * Get properties for a button based on the current paging state of the table
     *
     * @param {*} settings DT settings object
     * @param {*} button The button type in question
     * @param {*} page Table's current page
     * @param {*} pages Number of pages
     * @returns Info object
     */
    function _pagingButtonInfo(settings, button, page, pages) {
        var lang = settings.oLanguage.oPaginate;
        var o = {
            display: '',
            active: false,
            disabled: false
        };

        switch ( button ) {
            case 'ellipsis':
                o.display = '&#x2026;';
                o.disabled = true;
                break;

            case 'first':
                o.display = lang.sFirst;

                if (page === 0) {
                    o.disabled = true;
                }
                break;

            case 'previous':
                o.display = lang.sPrevious;

                if ( page === 0 ) {
                    o.disabled = true;
                }
                break;

            case 'next':
                o.display = lang.sNext;

                if ( pages === 0 || page === pages-1 ) {
                    o.disabled = true;
                }
                break;

            case 'last':
                o.display = lang.sLast;

                if ( pages === 0 || page === pages-1 ) {
                    o.disabled = true;
                }
                break;

            default:
                if ( typeof button === 'number' ) {
                    o.display = settings.fnFormatNumber( button + 1 );

                    if (page === button) {
                        o.active = true;
                    }
                }
                break;
        }

        return o;
    }

    /**
     * Compute what number buttons to show in the paging control
     *
     * @param {*} page Current page
     * @param {*} pages Total number of pages
     * @param {*} buttons Target number of number buttons
     * @param {boolean} addFirstLast Indicate if page 1 and end should be included
     * @returns Buttons to show
     */
    function _pagingNumbers ( page, pages, buttons, addFirstLast ) {
        var
            numbers = [],
            half = Math.floor(buttons / 2),
            before = addFirstLast ? 2 : 1,
            after = addFirstLast ? 1 : 0;

        if ( pages <= buttons ) {
            numbers = _range(0, pages);
        }
        else if (buttons === 1) {
            // Single button - current page only
            numbers = [page];
        }
        else if (buttons === 3) {
            // Special logic for just three buttons
            if (page <= 1) {
                numbers = [0, 1, 'ellipsis'];
            }
            else if (page >= pages - 2) {
                numbers = _range(pages-2, pages);
                numbers.unshift('ellipsis');
            }
            else {
                numbers = ['ellipsis', page, 'ellipsis'];
            }
        }
        else if ( page <= half ) {
            numbers = _range(0, buttons-before);
            numbers.push('ellipsis');

            if (addFirstLast) {
                numbers.push(pages-1);
            }
        }
        else if ( page >= pages - 1 - half ) {
            numbers = _range(pages-(buttons-before), pages);
            numbers.unshift('ellipsis');

            if (addFirstLast) {
                numbers.unshift(0);
            }
        }
        else {
            numbers = _range(page-half+before, page+half-after);
            numbers.push('ellipsis');
            numbers.unshift('ellipsis');

            if (addFirstLast) {
                numbers.push(pages-1);
                numbers.unshift(0);
            }
        }

        return numbers;
    }

    var __lengthCounter = 0;

    // opts
    // - menu
    // - text
    DataTable.feature.register( 'pageLength', function ( settings, opts ) {
        var features = settings.oFeatures;

        // For compatibility with the legacy `pageLength` top level option
        if (! features.bPaginate || ! features.bLengthChange) {
            return null;
        }

        opts = $.extend({
            menu: settings.aLengthMenu,
            text: settings.oLanguage.sLengthMenu
        }, opts);

        var
            classes  = settings.oClasses.length,
            tableId  = settings.sTableId,
            menu     = opts.menu,
            lengths  = [],
            language = [],
            i;

        // Options can be given in a number of ways
        if (Array.isArray( menu[0] )) {
            // Old 1.x style - 2D array
            lengths = menu[0];
            language = menu[1];
        }
        else {
            for ( i=0 ; i<menu.length ; i++ ) {
                // An object with different label and value
                if ($.isPlainObject(menu[i])) {
                    lengths.push(menu[i].value);
                    language.push(menu[i].label);
                }
                else {
                    // Or just a number to display and use
                    lengths.push(menu[i]);
                    language.push(menu[i]);
                }
            }
        }

        // We can put the <select> outside of the label if it is at the start or
        // end which helps improve accessability (not all screen readers like
        // implicit for elements).
        var end = opts.text.match(/_MENU_$/);
        var start = opts.text.match(/^_MENU_/);
        var removed = opts.text.replace(/_MENU_/, '');
        var str = '<label>' + opts.text + '</label>';

        if (start) {
            str = '_MENU_<label>' + removed + '</label>';
        }
        else if (end) {
            str = '<label>' + removed + '</label>_MENU_';
        }

        // Wrapper element - use a span as a holder for where the select will go
        var tmpId = 'tmp-' + (+new Date())
        var div = $('<div/>')
            .addClass( classes.container )
            .append(
                str.replace( '_MENU_', '<span id="'+tmpId+'"></span>' )
            );

        // Save text node content for macro updating
        var textNodes = [];
        div.find('label')[0].childNodes.forEach(function (el) {
            if (el.nodeType === Node.TEXT_NODE) {
                textNodes.push({
                    el: el,
                    text: el.textContent
                });
            }
        })

        // Update the label text in case it has an entries value
        var updateEntries = function (len) {
            textNodes.forEach(function (node) {
                node.el.textContent = _fnMacros(settings, node.text, len);
            });
        }

        // Next, the select itself, along with the options
        var select = $('<select/>', {
            'name':          tableId+'_length',
            'aria-controls': tableId,
            'class':         classes.select
        } );

        for ( i=0 ; i<lengths.length ; i++ ) {
            select[0][ i ] = new Option(
                typeof language[i] === 'number' ?
                    settings.fnFormatNumber( language[i] ) :
                    language[i],
                lengths[i]
            );
        }

        // add for and id to label and input
        div.find('label').attr('for', 'dt-length-' + __lengthCounter);
        select.attr('id', 'dt-length-' + __lengthCounter);
        __lengthCounter++;

        // Swap in the select list
        div.find('#' + tmpId).replaceWith(select);

        // Can't use `select` variable as user might provide their own and the
        // reference is broken by the use of outerHTML
        $('select', div)
            .val( settings._iDisplayLength )
            .on( 'change.DT', function() {
                _fnLengthChange( settings, $(this).val() );
                _fnDraw( settings );
            } );

        // Update node value whenever anything changes the table's length
        $(settings.nTable).on( 'length.dt.DT', function (e, s, len) {
            if ( settings === s ) {
                $('select', div).val( len );

                // Resolve plurals in the text for the new length
                updateEntries(len);
            }
        } );

        updateEntries(settings._iDisplayLength);

        return div;
    }, 'l' );

    // jQuery access
    $.fn.dataTable = DataTable;

    // Provide access to the host jQuery object (circular reference)
    DataTable.$ = $;

    // Legacy aliases
    $.fn.dataTableSettings = DataTable.settings;
    $.fn.dataTableExt = DataTable.ext;

    // With a capital `D` we return a DataTables API instance rather than a
    // jQuery object
    $.fn.DataTable = function ( opts ) {
        return $(this).dataTable( opts ).api();
    };

    // All properties that are available to $.fn.dataTable should also be
    // available on $.fn.DataTable
    $.each( DataTable, function ( prop, val ) {
        $.fn.DataTable[ prop ] = val;
    } );

    return DataTable;
}));

/*! Buttons for DataTables 3.1.0
 * © SpryMedia Ltd - datatables.net/license
 */

(function( factory ){
    if ( typeof define === 'function' && define.amd ) {
        // AMD
        define( ['jquery', 'datatables.net'], function ( $ ) {
            return factory( $, window, document );
        } );
    }
    else if ( typeof exports === 'object' ) {
        // CommonJS
        var jq = require('jquery');
        var cjsRequires = function (root, $) {
            if ( ! $.fn.dataTable ) {
                require('datatables.net')(root, $);
            }
        };

        if (typeof window === 'undefined') {
            module.exports = function (root, $) {
                if ( ! root ) {
                    // CommonJS environments without a window global must pass a
                    // root. This will give an error otherwise
                    root = window;
                }

                if ( ! $ ) {
                    $ = jq( root );
                }

                cjsRequires( root, $ );
                return factory( $, root, root.document );
            };
        }
        else {
            cjsRequires( window, jq );
            module.exports = factory( jq, window, window.document );
        }
    }
    else {
        // Browser
        factory( jQuery, window, document );
    }
}(function( $, window, document ) {
    'use strict';
    var DataTable = $.fn.dataTable;



// Used for namespacing events added to the document by each instance, so they
// can be removed on destroy
    var _instCounter = 0;

// Button namespacing counter for namespacing events on individual buttons
    var _buttonCounter = 0;

    var _dtButtons = DataTable.ext.buttons;

// Custom entity decoder for data export
    var _entityDecoder = null;

// Allow for jQuery slim
    function _fadeIn(el, duration, fn) {
        if ($.fn.animate) {
            el.stop().fadeIn(duration, fn);
        }
        else {
            el.css('display', 'block');

            if (fn) {
                fn.call(el);
            }
        }
    }

    function _fadeOut(el, duration, fn) {
        if ($.fn.animate) {
            el.stop().fadeOut(duration, fn);
        }
        else {
            el.css('display', 'none');

            if (fn) {
                fn.call(el);
            }
        }
    }

    /**
     * [Buttons description]
     * @param {[type]}
     * @param {[type]}
     */
    var Buttons = function (dt, config) {
        if (!DataTable.versionCheck('2')) {
            throw 'Warning: Buttons requires DataTables 2 or newer';
        }

        // If not created with a `new` keyword then we return a wrapper function that
        // will take the settings object for a DT. This allows easy use of new instances
        // with the `layout` option - e.g. `topLeft: $.fn.dataTable.Buttons( ... )`.
        if (!(this instanceof Buttons)) {
            return function (settings) {
                return new Buttons(settings, dt).container();
            };
        }

        // If there is no config set it to an empty object
        if (typeof config === 'undefined') {
            config = {};
        }

        // Allow a boolean true for defaults
        if (config === true) {
            config = {};
        }

        // For easy configuration of buttons an array can be given
        if (Array.isArray(config)) {
            config = { buttons: config };
        }

        this.c = $.extend(true, {}, Buttons.defaults, config);

        // Don't want a deep copy for the buttons
        if (config.buttons) {
            this.c.buttons = config.buttons;
        }

        this.s = {
            dt: new DataTable.Api(dt),
            buttons: [],
            listenKeys: '',
            namespace: 'dtb' + _instCounter++
        };

        this.dom = {
            container: $('<' + this.c.dom.container.tag + '/>').addClass(
                this.c.dom.container.className
            )
        };

        this._constructor();
    };

    $.extend(Buttons.prototype, {
        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         * Public methods
         */

        /**
         * Get the action of a button
         * @param  {int|string} Button index
         * @return {function}
         */ /**
         * Set the action of a button
         * @param  {node} node Button element
         * @param  {function} action Function to set
         * @return {Buttons} Self for chaining
         */
        action: function (node, action) {
            var button = this._nodeToButton(node);

            if (action === undefined) {
                return button.conf.action;
            }

            button.conf.action = action;

            return this;
        },

        /**
         * Add an active class to the button to make to look active or get current
         * active state.
         * @param  {node} node Button element
         * @param  {boolean} [flag] Enable / disable flag
         * @return {Buttons} Self for chaining or boolean for getter
         */
        active: function (node, flag) {
            var button = this._nodeToButton(node);
            var klass = this.c.dom.button.active;
            var jqNode = $(button.node);

            if (
                button.inCollection &&
                this.c.dom.collection.button &&
                this.c.dom.collection.button.active !== undefined
            ) {
                klass = this.c.dom.collection.button.active;
            }

            if (flag === undefined) {
                return jqNode.hasClass(klass);
            }

            jqNode.toggleClass(klass, flag === undefined ? true : flag);

            return this;
        },

        /**
         * Add a new button
         * @param {object} config Button configuration object, base string name or function
         * @param {int|string} [idx] Button index for where to insert the button
         * @param {boolean} [draw=true] Trigger a draw. Set a false when adding
         *   lots of buttons, until the last button.
         * @return {Buttons} Self for chaining
         */
        add: function (config, idx, draw) {
            var buttons = this.s.buttons;

            if (typeof idx === 'string') {
                var split = idx.split('-');
                var base = this.s;

                for (var i = 0, ien = split.length - 1; i < ien; i++) {
                    base = base.buttons[split[i] * 1];
                }

                buttons = base.buttons;
                idx = split[split.length - 1] * 1;
            }

            this._expandButton(
                buttons,
                config,
                config !== undefined ? config.split : undefined,
                (config === undefined ||
                    config.split === undefined ||
                    config.split.length === 0) &&
                base !== undefined,
                false,
                idx
            );

            if (draw === undefined || draw === true) {
                this._draw();
            }

            return this;
        },

        /**
         * Clear buttons from a collection and then insert new buttons
         */
        collectionRebuild: function (node, newButtons) {
            var button = this._nodeToButton(node);

            if (newButtons !== undefined) {
                var i;
                // Need to reverse the array
                for (i = button.buttons.length - 1; i >= 0; i--) {
                    this.remove(button.buttons[i].node);
                }

                // If the collection has prefix and / or postfix buttons we need to add them in
                if (button.conf.prefixButtons) {
                    newButtons.unshift.apply(newButtons, button.conf.prefixButtons);
                }

                if (button.conf.postfixButtons) {
                    newButtons.push.apply(newButtons, button.conf.postfixButtons);
                }

                for (i = 0; i < newButtons.length; i++) {
                    var newBtn = newButtons[i];

                    this._expandButton(
                        button.buttons,
                        newBtn,
                        newBtn !== undefined &&
                        newBtn.config !== undefined &&
                        newBtn.config.split !== undefined,
                        true,
                        newBtn.parentConf !== undefined &&
                        newBtn.parentConf.split !== undefined,
                        null,
                        newBtn.parentConf
                    );
                }
            }

            this._draw(button.collection, button.buttons);
        },

        /**
         * Get the container node for the buttons
         * @return {jQuery} Buttons node
         */
        container: function () {
            return this.dom.container;
        },

        /**
         * Disable a button
         * @param  {node} node Button node
         * @return {Buttons} Self for chaining
         */
        disable: function (node) {
            var button = this._nodeToButton(node);

            $(button.node)
                .addClass(this.c.dom.button.disabled)
                .prop('disabled', true);

            return this;
        },

        /**
         * Destroy the instance, cleaning up event handlers and removing DOM
         * elements
         * @return {Buttons} Self for chaining
         */
        destroy: function () {
            // Key event listener
            $('body').off('keyup.' + this.s.namespace);

            // Individual button destroy (so they can remove their own events if
            // needed). Take a copy as the array is modified by `remove`
            var buttons = this.s.buttons.slice();
            var i, ien;

            for (i = 0, ien = buttons.length; i < ien; i++) {
                this.remove(buttons[i].node);
            }

            // Container
            this.dom.container.remove();

            // Remove from the settings object collection
            var buttonInsts = this.s.dt.settings()[0];

            for (i = 0, ien = buttonInsts.length; i < ien; i++) {
                if (buttonInsts.inst === this) {
                    buttonInsts.splice(i, 1);
                    break;
                }
            }

            return this;
        },

        /**
         * Enable / disable a button
         * @param  {node} node Button node
         * @param  {boolean} [flag=true] Enable / disable flag
         * @return {Buttons} Self for chaining
         */
        enable: function (node, flag) {
            if (flag === false) {
                return this.disable(node);
            }

            var button = this._nodeToButton(node);
            $(button.node)
                .removeClass(this.c.dom.button.disabled)
                .prop('disabled', false);

            return this;
        },

        /**
         * Get a button's index
         *
         * This is internally recursive
         * @param {element} node Button to get the index of
         * @return {string} Button index
         */
        index: function (node, nested, buttons) {
            if (!nested) {
                nested = '';
                buttons = this.s.buttons;
            }

            for (var i = 0, ien = buttons.length; i < ien; i++) {
                var inner = buttons[i].buttons;

                if (buttons[i].node === node) {
                    return nested + i;
                }

                if (inner && inner.length) {
                    var match = this.index(node, i + '-', inner);

                    if (match !== null) {
                        return match;
                    }
                }
            }

            return null;
        },

        /**
         * Get the instance name for the button set selector
         * @return {string} Instance name
         */
        name: function () {
            return this.c.name;
        },

        /**
         * Get a button's node of the buttons container if no button is given
         * @param  {node} [node] Button node
         * @return {jQuery} Button element, or container
         */
        node: function (node) {
            if (!node) {
                return this.dom.container;
            }

            var button = this._nodeToButton(node);
            return $(button.node);
        },

        /**
         * Set / get a processing class on the selected button
         * @param {element} node Triggering button node
         * @param  {boolean} flag true to add, false to remove, undefined to get
         * @return {boolean|Buttons} Getter value or this if a setter.
         */
        processing: function (node, flag) {
            var dt = this.s.dt;
            var button = this._nodeToButton(node);

            if (flag === undefined) {
                return $(button.node).hasClass('processing');
            }

            $(button.node).toggleClass('processing', flag);

            $(dt.table().node()).triggerHandler('buttons-processing.dt', [
                flag,
                dt.button(node),
                dt,
                $(node),
                button.conf
            ]);

            return this;
        },

        /**
         * Remove a button.
         * @param  {node} node Button node
         * @return {Buttons} Self for chaining
         */
        remove: function (node) {
            var button = this._nodeToButton(node);
            var host = this._nodeToHost(node);
            var dt = this.s.dt;

            // Remove any child buttons first
            if (button.buttons.length) {
                for (var i = button.buttons.length - 1; i >= 0; i--) {
                    this.remove(button.buttons[i].node);
                }
            }

            button.conf.destroying = true;

            // Allow the button to remove event handlers, etc
            if (button.conf.destroy) {
                button.conf.destroy.call(dt.button(node), dt, $(node), button.conf);
            }

            this._removeKey(button.conf);

            $(button.node).remove();

            var idx = $.inArray(button, host);
            host.splice(idx, 1);

            return this;
        },

        /**
         * Get the text for a button
         * @param  {int|string} node Button index
         * @return {string} Button text
         */ /**
         * Set the text for a button
         * @param  {int|string|function} node Button index
         * @param  {string} label Text
         * @return {Buttons} Self for chaining
         */
        text: function (node, label) {
            var button = this._nodeToButton(node);
            var textNode = button.textNode;
            var dt = this.s.dt;
            var jqNode = $(button.node);
            var text = function (opt) {
                return typeof opt === 'function'
                    ? opt(dt, jqNode, button.conf)
                    : opt;
            };

            if (label === undefined) {
                return text(button.conf.text);
            }

            button.conf.text = label;
            textNode.html(text(label));

            return this;
        },

        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         * Constructor
         */

        /**
         * Buttons constructor
         * @private
         */
        _constructor: function () {
            var that = this;
            var dt = this.s.dt;
            var dtSettings = dt.settings()[0];
            var buttons = this.c.buttons;

            if (!dtSettings._buttons) {
                dtSettings._buttons = [];
            }

            dtSettings._buttons.push({
                inst: this,
                name: this.c.name
            });

            for (var i = 0, ien = buttons.length; i < ien; i++) {
                this.add(buttons[i]);
            }

            dt.on('destroy', function (e, settings) {
                if (settings === dtSettings) {
                    that.destroy();
                }
            });

            // Global key event binding to listen for button keys
            $('body').on('keyup.' + this.s.namespace, function (e) {
                if (
                    !document.activeElement ||
                    document.activeElement === document.body
                ) {
                    // SUse a string of characters for fast lookup of if we need to
                    // handle this
                    var character = String.fromCharCode(e.keyCode).toLowerCase();

                    if (that.s.listenKeys.toLowerCase().indexOf(character) !== -1) {
                        that._keypress(character, e);
                    }
                }
            });
        },

        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         * Private methods
         */

        /**
         * Add a new button to the key press listener
         * @param {object} conf Resolved button configuration object
         * @private
         */
        _addKey: function (conf) {
            if (conf.key) {
                this.s.listenKeys += $.isPlainObject(conf.key)
                    ? conf.key.key
                    : conf.key;
            }
        },

        /**
         * Insert the buttons into the container. Call without parameters!
         * @param  {node} [container] Recursive only - Insert point
         * @param  {array} [buttons] Recursive only - Buttons array
         * @private
         */
        _draw: function (container, buttons) {
            if (!container) {
                container = this.dom.container;
                buttons = this.s.buttons;
            }

            container.children().detach();

            for (var i = 0, ien = buttons.length; i < ien; i++) {
                container.append(buttons[i].inserter);
                container.append(' ');

                if (buttons[i].buttons && buttons[i].buttons.length) {
                    this._draw(buttons[i].collection, buttons[i].buttons);
                }
            }
        },

        /**
         * Create buttons from an array of buttons
         * @param  {array} attachTo Buttons array to attach to
         * @param  {object} button Button definition
         * @param  {boolean} inCollection true if the button is in a collection
         * @private
         */
        _expandButton: function (
            attachTo,
            button,
            split,
            inCollection,
            inSplit,
            attachPoint,
            parentConf
        ) {
            var dt = this.s.dt;
            var isSplit = false;
            var domCollection = this.c.dom.collection;
            var buttons = !Array.isArray(button) ? [button] : button;

            if (button === undefined) {
                buttons = !Array.isArray(split) ? [split] : split;
            }

            for (var i = 0, ien = buttons.length; i < ien; i++) {
                var conf = this._resolveExtends(buttons[i]);

                if (!conf) {
                    continue;
                }

                isSplit = conf.config && conf.config.split ? true : false;

                // If the configuration is an array, then expand the buttons at this
                // point
                if (Array.isArray(conf)) {
                    this._expandButton(
                        attachTo,
                        conf,
                        built !== undefined && built.conf !== undefined
                            ? built.conf.split
                            : undefined,
                        inCollection,
                        parentConf !== undefined && parentConf.split !== undefined,
                        attachPoint,
                        parentConf
                    );
                    continue;
                }

                var built = this._buildButton(
                    conf,
                    inCollection,
                    conf.split !== undefined ||
                    (conf.config !== undefined &&
                        conf.config.split !== undefined),
                    inSplit
                );
                if (!built) {
                    continue;
                }

                if (attachPoint !== undefined && attachPoint !== null) {
                    attachTo.splice(attachPoint, 0, built);
                    attachPoint++;
                }
                else {
                    attachTo.push(built);
                }

                // Create the dropdown for a collection
                if (built.conf.buttons) {
                    built.collection = $(
                        '<' + domCollection.container.content.tag + '/>'
                    );
                    built.conf._collection = built.collection;

                    $(built.node).append(domCollection.action.dropHtml);

                    this._expandButton(
                        built.buttons,
                        built.conf.buttons,
                        built.conf.split,
                        !isSplit,
                        isSplit,
                        attachPoint,
                        built.conf
                    );
                }

                // And the split collection
                if (built.conf.split) {
                    built.collection = $('<' + domCollection.container.tag + '/>');
                    built.conf._collection = built.collection;

                    for (var j = 0; j < built.conf.split.length; j++) {
                        var item = built.conf.split[j];

                        if (typeof item === 'object') {
                            item.parent = parentConf;

                            if (item.collectionLayout === undefined) {
                                item.collectionLayout = built.conf.collectionLayout;
                            }

                            if (item.dropup === undefined) {
                                item.dropup = built.conf.dropup;
                            }

                            if (item.fade === undefined) {
                                item.fade = built.conf.fade;
                            }
                        }
                    }

                    this._expandButton(
                        built.buttons,
                        built.conf.buttons,
                        built.conf.split,
                        !isSplit,
                        isSplit,
                        attachPoint,
                        built.conf
                    );
                }

                built.conf.parent = parentConf;

                // init call is made here, rather than buildButton as it needs to
                // be selectable, and for that it needs to be in the buttons array
                if (conf.init) {
                    conf.init.call(dt.button(built.node), dt, $(built.node), conf);
                }
            }
        },

        /**
         * Create an individual button
         * @param  {object} config            Resolved button configuration
         * @param  {boolean} inCollection `true` if a collection button
         * @return {object} Completed button description object
         * @private
         */
        _buildButton: function (config, inCollection, isSplit, inSplit) {
            var that = this;
            var configDom = this.c.dom;
            var textNode;
            var dt = this.s.dt;
            var text = function (opt) {
                return typeof opt === 'function' ? opt(dt, button, config) : opt;
            };

            // Create an object that describes the button which can be in `dom.button`, or
            // `dom.collection.button` or `dom.split.button` or `dom.collection.split.button`!
            // Each should extend from `dom.button`.
            var dom = $.extend(true, {}, configDom.button);

            if (inCollection && isSplit && configDom.collection.split) {
                $.extend(true, dom, configDom.collection.split.action);
            }
            else if (inSplit || inCollection) {
                $.extend(true, dom, configDom.collection.button);
            }
            else if (isSplit) {
                $.extend(true, dom, configDom.split.button);
            }

            // Spacers don't do much other than insert an element into the DOM
            if (config.spacer) {
                var spacer = $('<' + dom.spacer.tag + '/>')
                    .addClass(
                        'dt-button-spacer ' +
                        config.style +
                        ' ' +
                        dom.spacer.className
                    )
                    .html(text(config.text));

                return {
                    conf: config,
                    node: spacer,
                    inserter: spacer,
                    buttons: [],
                    inCollection: inCollection,
                    isSplit: isSplit,
                    collection: null,
                    textNode: spacer
                };
            }

            // Make sure that the button is available based on whatever requirements
            // it has. For example, PDF button require pdfmake
            if (
                config.available &&
                !config.available(dt, config) &&
                !config.html
            ) {
                return false;
            }

            var button;

            if (!config.html) {
                var run = function (e, dt, button, config, done) {
                    config.action.call(dt.button(button), e, dt, button, config, done);

                    $(dt.table().node()).triggerHandler('buttons-action.dt', [
                        dt.button(button),
                        dt,
                        button,
                        config
                    ]);
                };

                var action = function(e, dt, button, config) {
                    if (config.async) {
                        that.processing(button[0], true);

                        setTimeout(function () {
                            run(e, dt, button, config, function () {
                                that.processing(button[0], false);
                            });
                        }, config.async);
                    }
                    else {
                        run(e, dt, button, config, function () {});
                    }
                }

                var tag = config.tag || dom.tag;
                var clickBlurs =
                    config.clickBlurs === undefined ? true : config.clickBlurs;

                button = $('<' + tag + '/>')
                    .addClass(dom.className)
                    .attr('tabindex', this.s.dt.settings()[0].iTabIndex)
                    .attr('aria-controls', this.s.dt.table().node().id)
                    .on('click.dtb', function (e) {
                        e.preventDefault();

                        if (!button.hasClass(dom.disabled) && config.action) {
                            action(e, dt, button, config);
                        }

                        if (clickBlurs) {
                            button.trigger('blur');
                        }
                    })
                    .on('keypress.dtb', function (e) {
                        if (e.keyCode === 13) {
                            e.preventDefault();

                            if (!button.hasClass(dom.disabled) && config.action) {
                                action(e, dt, button, config);
                            }
                        }
                    });

                // Make `a` tags act like a link
                if (tag.toLowerCase() === 'a') {
                    button.attr('href', '#');
                }

                // Button tags should have `type=button` so they don't have any default behaviour
                if (tag.toLowerCase() === 'button') {
                    button.attr('type', 'button');
                }

                if (dom.liner.tag) {
                    var liner = $('<' + dom.liner.tag + '/>')
                        .html(text(config.text))
                        .addClass(dom.liner.className);

                    if (dom.liner.tag.toLowerCase() === 'a') {
                        liner.attr('href', '#');
                    }

                    button.append(liner);
                    textNode = liner;
                }
                else {
                    button.html(text(config.text));
                    textNode = button;
                }

                if (config.enabled === false) {
                    button.addClass(dom.disabled);
                }

                if (config.className) {
                    button.addClass(config.className);
                }

                if (config.titleAttr) {
                    button.attr('title', text(config.titleAttr));
                }

                if (config.attr) {
                    button.attr(config.attr);
                }

                if (!config.namespace) {
                    config.namespace = '.dt-button-' + _buttonCounter++;
                }

                if (config.config !== undefined && config.config.split) {
                    config.split = config.config.split;
                }
            }
            else {
                button = $(config.html);
            }

            var buttonContainer = this.c.dom.buttonContainer;
            var inserter;
            if (buttonContainer && buttonContainer.tag) {
                inserter = $('<' + buttonContainer.tag + '/>')
                    .addClass(buttonContainer.className)
                    .append(button);
            }
            else {
                inserter = button;
            }

            this._addKey(config);

            // Style integration callback for DOM manipulation
            // Note that this is _not_ documented. It is currently
            // for style integration only
            if (this.c.buttonCreated) {
                inserter = this.c.buttonCreated(config, inserter);
            }

            var splitDiv;

            if (isSplit) {
                var dropdownConf = inCollection
                    ? $.extend(true, this.c.dom.split, this.c.dom.collection.split)
                    : this.c.dom.split;
                var wrapperConf = dropdownConf.wrapper;

                splitDiv = $('<' + wrapperConf.tag + '/>')
                    .addClass(wrapperConf.className)
                    .append(button);

                var dropButtonConfig = $.extend(config, {
                    align: dropdownConf.dropdown.align,
                    attr: {
                        'aria-haspopup': 'dialog',
                        'aria-expanded': false
                    },
                    className: dropdownConf.dropdown.className,
                    closeButton: false,
                    splitAlignClass: dropdownConf.dropdown.splitAlignClass,
                    text: dropdownConf.dropdown.text
                });

                this._addKey(dropButtonConfig);

                var splitAction = function (e, dt, button, config) {
                    _dtButtons.split.action.call(
                        dt.button(splitDiv),
                        e,
                        dt,
                        button,
                        config
                    );

                    $(dt.table().node()).triggerHandler('buttons-action.dt', [
                        dt.button(button),
                        dt,
                        button,
                        config
                    ]);
                    button.attr('aria-expanded', true);
                };

                var dropButton = $(
                    '<button class="' +
                    dropdownConf.dropdown.className +
                    ' dt-button"></button>'
                )
                    .html(dropdownConf.dropdown.dropHtml)
                    .on('click.dtb', function (e) {
                        e.preventDefault();
                        e.stopPropagation();

                        if (!dropButton.hasClass(dom.disabled)) {
                            splitAction(e, dt, dropButton, dropButtonConfig);
                        }
                        if (clickBlurs) {
                            dropButton.trigger('blur');
                        }
                    })
                    .on('keypress.dtb', function (e) {
                        if (e.keyCode === 13) {
                            e.preventDefault();

                            if (!dropButton.hasClass(dom.disabled)) {
                                splitAction(e, dt, dropButton, dropButtonConfig);
                            }
                        }
                    });

                if (config.split.length === 0) {
                    dropButton.addClass('dtb-hide-drop');
                }

                splitDiv.append(dropButton).attr(dropButtonConfig.attr);
            }

            return {
                conf: config,
                node: isSplit ? splitDiv.get(0) : button.get(0),
                inserter: isSplit ? splitDiv : inserter,
                buttons: [],
                inCollection: inCollection,
                isSplit: isSplit,
                inSplit: inSplit,
                collection: null,
                textNode: textNode
            };
        },

        /**
         * Get the button object from a node (recursive)
         * @param  {node} node Button node
         * @param  {array} [buttons] Button array, uses base if not defined
         * @return {object} Button object
         * @private
         */
        _nodeToButton: function (node, buttons) {
            if (!buttons) {
                buttons = this.s.buttons;
            }

            for (var i = 0, ien = buttons.length; i < ien; i++) {
                if (buttons[i].node === node) {
                    return buttons[i];
                }

                if (buttons[i].buttons.length) {
                    var ret = this._nodeToButton(node, buttons[i].buttons);

                    if (ret) {
                        return ret;
                    }
                }
            }
        },

        /**
         * Get container array for a button from a button node (recursive)
         * @param  {node} node Button node
         * @param  {array} [buttons] Button array, uses base if not defined
         * @return {array} Button's host array
         * @private
         */
        _nodeToHost: function (node, buttons) {
            if (!buttons) {
                buttons = this.s.buttons;
            }

            for (var i = 0, ien = buttons.length; i < ien; i++) {
                if (buttons[i].node === node) {
                    return buttons;
                }

                if (buttons[i].buttons.length) {
                    var ret = this._nodeToHost(node, buttons[i].buttons);

                    if (ret) {
                        return ret;
                    }
                }
            }
        },

        /**
         * Handle a key press - determine if any button's key configured matches
         * what was typed and trigger the action if so.
         * @param  {string} character The character pressed
         * @param  {object} e Key event that triggered this call
         * @private
         */
        _keypress: function (character, e) {
            // Check if this button press already activated on another instance of Buttons
            if (e._buttonsHandled) {
                return;
            }

            var run = function (conf, node) {
                if (!conf.key) {
                    return;
                }

                if (conf.key === character) {
                    e._buttonsHandled = true;
                    $(node).click();
                }
                else if ($.isPlainObject(conf.key)) {
                    if (conf.key.key !== character) {
                        return;
                    }

                    if (conf.key.shiftKey && !e.shiftKey) {
                        return;
                    }

                    if (conf.key.altKey && !e.altKey) {
                        return;
                    }

                    if (conf.key.ctrlKey && !e.ctrlKey) {
                        return;
                    }

                    if (conf.key.metaKey && !e.metaKey) {
                        return;
                    }

                    // Made it this far - it is good
                    e._buttonsHandled = true;
                    $(node).click();
                }
            };

            var recurse = function (a) {
                for (var i = 0, ien = a.length; i < ien; i++) {
                    run(a[i].conf, a[i].node);

                    if (a[i].buttons.length) {
                        recurse(a[i].buttons);
                    }
                }
            };

            recurse(this.s.buttons);
        },

        /**
         * Remove a key from the key listener for this instance (to be used when a
         * button is removed)
         * @param  {object} conf Button configuration
         * @private
         */
        _removeKey: function (conf) {
            if (conf.key) {
                var character = $.isPlainObject(conf.key) ? conf.key.key : conf.key;

                // Remove only one character, as multiple buttons could have the
                // same listening key
                var a = this.s.listenKeys.split('');
                var idx = $.inArray(character, a);
                a.splice(idx, 1);
                this.s.listenKeys = a.join('');
            }
        },

        /**
         * Resolve a button configuration
         * @param  {string|function|object} conf Button config to resolve
         * @return {object} Button configuration
         * @private
         */
        _resolveExtends: function (conf) {
            var that = this;
            var dt = this.s.dt;
            var i, ien;
            var toConfObject = function (base) {
                var loop = 0;

                // Loop until we have resolved to a button configuration, or an
                // array of button configurations (which will be iterated
                // separately)
                while (!$.isPlainObject(base) && !Array.isArray(base)) {
                    if (base === undefined) {
                        return;
                    }

                    if (typeof base === 'function') {
                        base = base.call(that, dt, conf);

                        if (!base) {
                            return false;
                        }
                    }
                    else if (typeof base === 'string') {
                        if (!_dtButtons[base]) {
                            return { html: base };
                        }

                        base = _dtButtons[base];
                    }

                    loop++;
                    if (loop > 30) {
                        // Protect against misconfiguration killing the browser
                        throw 'Buttons: Too many iterations';
                    }
                }

                return Array.isArray(base) ? base : $.extend({}, base);
            };

            conf = toConfObject(conf);

            while (conf && conf.extend) {
                // Use `toConfObject` in case the button definition being extended
                // is itself a string or a function
                if (!_dtButtons[conf.extend]) {
                    throw 'Cannot extend unknown button type: ' + conf.extend;
                }

                var objArray = toConfObject(_dtButtons[conf.extend]);
                if (Array.isArray(objArray)) {
                    return objArray;
                }
                else if (!objArray) {
                    // This is a little brutal as it might be possible to have a
                    // valid button without the extend, but if there is no extend
                    // then the host button would be acting in an undefined state
                    return false;
                }

                // Stash the current class name
                var originalClassName = objArray.className;

                if (conf.config !== undefined && objArray.config !== undefined) {
                    conf.config = $.extend({}, objArray.config, conf.config);
                }

                conf = $.extend({}, objArray, conf);

                // The extend will have overwritten the original class name if the
                // `conf` object also assigned a class, but we want to concatenate
                // them so they are list that is combined from all extended buttons
                if (originalClassName && conf.className !== originalClassName) {
                    conf.className = originalClassName + ' ' + conf.className;
                }

                // Although we want the `conf` object to overwrite almost all of
                // the properties of the object being extended, the `extend`
                // property should come from the object being extended
                conf.extend = objArray.extend;
            }

            // Buttons to be added to a collection  -gives the ability to define
            // if buttons should be added to the start or end of a collection
            var postfixButtons = conf.postfixButtons;
            if (postfixButtons) {
                if (!conf.buttons) {
                    conf.buttons = [];
                }

                for (i = 0, ien = postfixButtons.length; i < ien; i++) {
                    conf.buttons.push(postfixButtons[i]);
                }
            }

            var prefixButtons = conf.prefixButtons;
            if (prefixButtons) {
                if (!conf.buttons) {
                    conf.buttons = [];
                }

                for (i = 0, ien = prefixButtons.length; i < ien; i++) {
                    conf.buttons.splice(i, 0, prefixButtons[i]);
                }
            }

            return conf;
        },

        /**
         * Display (and replace if there is an existing one) a popover attached to a button
         * @param {string|node} content Content to show
         * @param {DataTable.Api} hostButton DT API instance of the button
         * @param {object} inOpts Options (see object below for all options)
         */
        _popover: function (content, hostButton, inOpts) {
            var dt = hostButton;
            var c = this.c;
            var closed = false;
            var options = $.extend(
                {
                    align: 'button-left', // button-right, dt-container, split-left, split-right
                    autoClose: false,
                    background: true,
                    backgroundClassName: 'dt-button-background',
                    closeButton: true,
                    containerClassName: c.dom.collection.container.className,
                    contentClassName: c.dom.collection.container.content.className,
                    collectionLayout: '',
                    collectionTitle: '',
                    dropup: false,
                    fade: 400,
                    popoverTitle: '',
                    rightAlignClassName: 'dt-button-right',
                    tag: c.dom.collection.container.tag
                },
                inOpts
            );

            var containerSelector =
                options.tag + '.' + options.containerClassName.replace(/ /g, '.');
            var hostNode = hostButton.node();

            var close = function () {
                closed = true;

                _fadeOut($(containerSelector), options.fade, function () {
                    $(this).detach();
                });

                $(
                    dt
                        .buttons('[aria-haspopup="dialog"][aria-expanded="true"]')
                        .nodes()
                ).attr('aria-expanded', 'false');

                $('div.dt-button-background').off('click.dtb-collection');
                Buttons.background(
                    false,
                    options.backgroundClassName,
                    options.fade,
                    hostNode
                );

                $(window).off('resize.resize.dtb-collection');
                $('body').off('.dtb-collection');
                dt.off('buttons-action.b-internal');
                dt.off('destroy');
            };

            if (content === false) {
                close();
                return;
            }

            var existingExpanded = $(
                dt.buttons('[aria-haspopup="dialog"][aria-expanded="true"]').nodes()
            );
            if (existingExpanded.length) {
                // Reuse the current position if the button that was triggered is inside an existing collection
                if (hostNode.closest(containerSelector).length) {
                    hostNode = existingExpanded.eq(0);
                }

                close();
            }

            // Try to be smart about the layout
            var cnt = $('.dt-button', content).length;
            var mod = '';

            if (cnt === 3) {
                mod = 'dtb-b3';
            }
            else if (cnt === 2) {
                mod = 'dtb-b2';
            }
            else if (cnt === 1) {
                mod = 'dtb-b1';
            }

            var display = $('<' + options.tag + '/>')
                .addClass(options.containerClassName)
                .addClass(options.collectionLayout)
                .addClass(options.splitAlignClass)
                .addClass(mod)
                .css('display', 'none')
                .attr({
                    'aria-modal': true,
                    role: 'dialog'
                });

            content = $(content)
                .addClass(options.contentClassName)
                .attr('role', 'menu')
                .appendTo(display);

            hostNode.attr('aria-expanded', 'true');

            if (hostNode.parents('body')[0] !== document.body) {
                hostNode = document.body.lastChild;
            }

            if (options.popoverTitle) {
                display.prepend(
                    '<div class="dt-button-collection-title">' +
                    options.popoverTitle +
                    '</div>'
                );
            }
            else if (options.collectionTitle) {
                display.prepend(
                    '<div class="dt-button-collection-title">' +
                    options.collectionTitle +
                    '</div>'
                );
            }

            if (options.closeButton) {
                display
                    .prepend('<div class="dtb-popover-close">&times;</div>')
                    .addClass('dtb-collection-closeable');
            }

            _fadeIn(display.insertAfter(hostNode), options.fade);

            var tableContainer = $(hostButton.table().container());
            var position = display.css('position');

            if (options.span === 'container' || options.align === 'dt-container') {
                hostNode = hostNode.parent();
                display.css('width', tableContainer.width());
            }

            // Align the popover relative to the DataTables container
            // Useful for wide popovers such as SearchPanes
            if (position === 'absolute') {
                // Align relative to the host button
                var offsetParent = $(hostNode[0].offsetParent);
                var buttonPosition = hostNode.position();
                var buttonOffset = hostNode.offset();
                var tableSizes = offsetParent.offset();
                var containerPosition = offsetParent.position();
                var computed = window.getComputedStyle(offsetParent[0]);

                tableSizes.height = offsetParent.outerHeight();
                tableSizes.width =
                    offsetParent.width() + parseFloat(computed.paddingLeft);
                tableSizes.right = tableSizes.left + tableSizes.width;
                tableSizes.bottom = tableSizes.top + tableSizes.height;

                // Set the initial position so we can read height / width
                var top = buttonPosition.top + hostNode.outerHeight();
                var left = buttonPosition.left;

                display.css({
                    top: top,
                    left: left
                });

                // Get the popover position
                computed = window.getComputedStyle(display[0]);
                var popoverSizes = display.offset();

                popoverSizes.height = display.outerHeight();
                popoverSizes.width = display.outerWidth();
                popoverSizes.right = popoverSizes.left + popoverSizes.width;
                popoverSizes.bottom = popoverSizes.top + popoverSizes.height;
                popoverSizes.marginTop = parseFloat(computed.marginTop);
                popoverSizes.marginBottom = parseFloat(computed.marginBottom);

                // First position per the class requirements - pop up and right align
                if (options.dropup) {
                    top =
                        buttonPosition.top -
                        popoverSizes.height -
                        popoverSizes.marginTop -
                        popoverSizes.marginBottom;
                }

                if (
                    options.align === 'button-right' ||
                    display.hasClass(options.rightAlignClassName)
                ) {
                    left =
                        buttonPosition.left -
                        popoverSizes.width +
                        hostNode.outerWidth();
                }

                // Container alignment - make sure it doesn't overflow the table container
                if (
                    options.align === 'dt-container' ||
                    options.align === 'container'
                ) {
                    if (left < buttonPosition.left) {
                        left = -buttonPosition.left;
                    }
                }

                // Window adjustment
                if (
                    containerPosition.left + left + popoverSizes.width >
                    $(window).width()
                ) {
                    // Overflowing the document to the right
                    left =
                        $(window).width() -
                        popoverSizes.width -
                        containerPosition.left;
                }

                if (buttonOffset.left + left < 0) {
                    // Off to the left of the document
                    left = -buttonOffset.left;
                }

                if (
                    containerPosition.top + top + popoverSizes.height >
                    $(window).height() + $(window).scrollTop()
                ) {
                    // Pop up if otherwise we'd need the user to scroll down
                    top =
                        buttonPosition.top -
                        popoverSizes.height -
                        popoverSizes.marginTop -
                        popoverSizes.marginBottom;
                }

                if (containerPosition.top + top < $(window).scrollTop()) {
                    // Correction for when the top is beyond the top of the page
                    top = buttonPosition.top + hostNode.outerHeight();
                }

                // Calculations all done - now set it
                display.css({
                    top: top,
                    left: left
                });
            }
            else {
                // Fix position - centre on screen
                var place = function () {
                    var half = $(window).height() / 2;

                    var top = display.height() / 2;
                    if (top > half) {
                        top = half;
                    }

                    display.css('marginTop', top * -1);
                };

                place();

                $(window).on('resize.dtb-collection', function () {
                    place();
                });
            }

            if (options.background) {
                Buttons.background(
                    true,
                    options.backgroundClassName,
                    options.fade,
                    options.backgroundHost || hostNode
                );
            }

            // This is bonkers, but if we don't have a click listener on the
            // background element, iOS Safari will ignore the body click
            // listener below. An empty function here is all that is
            // required to make it work...
            $('div.dt-button-background').on(
                'click.dtb-collection',
                function () {}
            );

            if (options.autoClose) {
                setTimeout(function () {
                    dt.on('buttons-action.b-internal', function (e, btn, dt, node) {
                        if (node[0] === hostNode[0]) {
                            return;
                        }
                        close();
                    });
                }, 0);
            }

            $(display).trigger('buttons-popover.dt');

            dt.on('destroy', close);

            setTimeout(function () {
                closed = false;
                $('body')
                    .on('click.dtb-collection', function (e) {
                        if (closed) {
                            return;
                        }

                        // andSelf is deprecated in jQ1.8, but we want 1.7 compat
                        var back = $.fn.addBack ? 'addBack' : 'andSelf';
                        var parent = $(e.target).parent()[0];

                        if (
                            (!$(e.target).parents()[back]().filter(content)
                                    .length &&
                                !$(parent).hasClass('dt-buttons')) ||
                            $(e.target).hasClass('dt-button-background')
                        ) {
                            close();
                        }
                    })
                    .on('keyup.dtb-collection', function (e) {
                        if (e.keyCode === 27) {
                            close();
                        }
                    })
                    .on('keydown.dtb-collection', function (e) {
                        // Focus trap for tab key
                        var elements = $('a, button', content);
                        var active = document.activeElement;

                        if (e.keyCode !== 9) {
                            // tab
                            return;
                        }

                        if (elements.index(active) === -1) {
                            // If current focus is not inside the popover
                            elements.first().focus();
                            e.preventDefault();
                        }
                        else if (e.shiftKey) {
                            // Reverse tabbing order when shift key is pressed
                            if (active === elements[0]) {
                                elements.last().focus();
                                e.preventDefault();
                            }
                        }
                        else {
                            if (active === elements.last()[0]) {
                                elements.first().focus();
                                e.preventDefault();
                            }
                        }
                    });
            }, 0);
        }
    });

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * Statics
     */

    /**
     * Show / hide a background layer behind a collection
     * @param  {boolean} Flag to indicate if the background should be shown or
     *   hidden
     * @param  {string} Class to assign to the background
     * @static
     */
    Buttons.background = function (show, className, fade, insertPoint) {
        if (fade === undefined) {
            fade = 400;
        }
        if (!insertPoint) {
            insertPoint = document.body;
        }

        if (show) {
            _fadeIn(
                $('<div/>')
                    .addClass(className)
                    .css('display', 'none')
                    .insertAfter(insertPoint),
                fade
            );
        }
        else {
            _fadeOut($('div.' + className), fade, function () {
                $(this).removeClass(className).remove();
            });
        }
    };

    /**
     * Instance selector - select Buttons instances based on an instance selector
     * value from the buttons assigned to a DataTable. This is only useful if
     * multiple instances are attached to a DataTable.
     * @param  {string|int|array} Instance selector - see `instance-selector`
     *   documentation on the DataTables site
     * @param  {array} Button instance array that was attached to the DataTables
     *   settings object
     * @return {array} Buttons instances
     * @static
     */
    Buttons.instanceSelector = function (group, buttons) {
        if (group === undefined || group === null) {
            return $.map(buttons, function (v) {
                return v.inst;
            });
        }

        var ret = [];
        var names = $.map(buttons, function (v) {
            return v.name;
        });

        // Flatten the group selector into an array of single options
        var process = function (input) {
            if (Array.isArray(input)) {
                for (var i = 0, ien = input.length; i < ien; i++) {
                    process(input[i]);
                }
                return;
            }

            if (typeof input === 'string') {
                if (input.indexOf(',') !== -1) {
                    // String selector, list of names
                    process(input.split(','));
                }
                else {
                    // String selector individual name
                    var idx = $.inArray(input.trim(), names);

                    if (idx !== -1) {
                        ret.push(buttons[idx].inst);
                    }
                }
            }
            else if (typeof input === 'number') {
                // Index selector
                ret.push(buttons[input].inst);
            }
            else if (typeof input === 'object' && input.nodeName) {
                // Element selector
                for (var j = 0; j < buttons.length; j++) {
                    if (buttons[j].inst.dom.container[0] === input) {
                        ret.push(buttons[j].inst);
                    }
                }
            }
            else if (typeof input === 'object') {
                // Actual instance selector
                ret.push(input);
            }
        };

        process(group);

        return ret;
    };

    /**
     * Button selector - select one or more buttons from a selector input so some
     * operation can be performed on them.
     * @param  {array} Button instances array that the selector should operate on
     * @param  {string|int|node|jQuery|array} Button selector - see
     *   `button-selector` documentation on the DataTables site
     * @return {array} Array of objects containing `inst` and `idx` properties of
     *   the selected buttons so you know which instance each button belongs to.
     * @static
     */
    Buttons.buttonSelector = function (insts, selector) {
        var ret = [];
        var nodeBuilder = function (a, buttons, baseIdx) {
            var button;
            var idx;

            for (var i = 0, ien = buttons.length; i < ien; i++) {
                button = buttons[i];

                if (button) {
                    idx = baseIdx !== undefined ? baseIdx + i : i + '';

                    a.push({
                        node: button.node,
                        name: button.conf.name,
                        idx: idx
                    });

                    if (button.buttons) {
                        nodeBuilder(a, button.buttons, idx + '-');
                    }
                }
            }
        };

        var run = function (selector, inst) {
            var i, ien;
            var buttons = [];
            nodeBuilder(buttons, inst.s.buttons);

            var nodes = $.map(buttons, function (v) {
                return v.node;
            });

            if (Array.isArray(selector) || selector instanceof $) {
                for (i = 0, ien = selector.length; i < ien; i++) {
                    run(selector[i], inst);
                }
                return;
            }

            if (selector === null || selector === undefined || selector === '*') {
                // Select all
                for (i = 0, ien = buttons.length; i < ien; i++) {
                    ret.push({
                        inst: inst,
                        node: buttons[i].node
                    });
                }
            }
            else if (typeof selector === 'number') {
                // Main button index selector
                if (inst.s.buttons[selector]) {
                    ret.push({
                        inst: inst,
                        node: inst.s.buttons[selector].node
                    });
                }
            }
            else if (typeof selector === 'string') {
                if (selector.indexOf(',') !== -1) {
                    // Split
                    var a = selector.split(',');

                    for (i = 0, ien = a.length; i < ien; i++) {
                        run(a[i].trim(), inst);
                    }
                }
                else if (selector.match(/^\d+(\-\d+)*$/)) {
                    // Sub-button index selector
                    var indexes = $.map(buttons, function (v) {
                        return v.idx;
                    });

                    ret.push({
                        inst: inst,
                        node: buttons[$.inArray(selector, indexes)].node
                    });
                }
                else if (selector.indexOf(':name') !== -1) {
                    // Button name selector
                    var name = selector.replace(':name', '');

                    for (i = 0, ien = buttons.length; i < ien; i++) {
                        if (buttons[i].name === name) {
                            ret.push({
                                inst: inst,
                                node: buttons[i].node
                            });
                        }
                    }
                }
                else {
                    // jQuery selector on the nodes
                    $(nodes)
                        .filter(selector)
                        .each(function () {
                            ret.push({
                                inst: inst,
                                node: this
                            });
                        });
                }
            }
            else if (typeof selector === 'object' && selector.nodeName) {
                // Node selector
                var idx = $.inArray(selector, nodes);

                if (idx !== -1) {
                    ret.push({
                        inst: inst,
                        node: nodes[idx]
                    });
                }
            }
        };

        for (var i = 0, ien = insts.length; i < ien; i++) {
            var inst = insts[i];

            run(selector, inst);
        }

        return ret;
    };

    /**
     * Default function used for formatting output data.
     * @param {*} str Data to strip
     */
    Buttons.stripData = function (str, config) {
        if (typeof str !== 'string') {
            return str;
        }

        // Always remove script tags
        str = Buttons.stripHtmlScript(str);

        // Always remove comments
        str = Buttons.stripHtmlComments(str);

        if (!config || config.stripHtml) {
            str = DataTable.util.stripHtml(str);
        }

        if (!config || config.trim) {
            str = str.trim();
        }

        if (!config || config.stripNewlines) {
            str = str.replace(/\n/g, ' ');
        }

        if (!config || config.decodeEntities) {
            if (_entityDecoder) {
                str = _entityDecoder(str);
            }
            else {
                _exportTextarea.innerHTML = str;
                str = _exportTextarea.value;
            }
        }

        return str;
    };

    /**
     * Provide a custom entity decoding function - e.g. a regex one, which can be
     * much faster than the built in DOM option, but also larger code size.
     * @param {function} fn
     */
    Buttons.entityDecoder = function (fn) {
        _entityDecoder = fn;
    };

    /**
     * Common function for stripping HTML comments
     *
     * @param {*} input
     * @returns
     */
    Buttons.stripHtmlComments = function (input) {
        var previous;

        do {
            previous = input;
            input = input.replace(/(<!--.*?--!?>)|(<!--[\S\s]+?--!?>)|(<!--[\S\s]*?$)/g, '');
        } while (input !== previous);

        return input;
    };

    /**
     * Common function for stripping HTML script tags
     *
     * @param {*} input
     * @returns
     */
    Buttons.stripHtmlScript = function (input) {
        var previous;

        do {
            previous = input;
            input = input.replace(/<script\b[^<]*(?:(?!<\/script[^>]*>)<[^<]*)*<\/script[^>]*>/gi, '');
        } while (input !== previous);

        return input;
    };

    /**
     * Buttons defaults. For full documentation, please refer to the docs/option
     * directory or the DataTables site.
     * @type {Object}
     * @static
     */
    Buttons.defaults = {
        buttons: ['copy', 'excel', 'csv', 'pdf', 'print'],
        name: 'main',
        tabIndex: 0,
        dom: {
            container: {
                tag: 'div',
                className: 'dt-buttons'
            },
            collection: {
                action: {
                    // action button
                    dropHtml: '<span class="dt-button-down-arrow">&#x25BC;</span>'
                },
                container: {
                    // The element used for the dropdown
                    className: 'dt-button-collection',
                    content: {
                        className: '',
                        tag: 'div'
                    },
                    tag: 'div'
                }
                // optionally
                // , button: IButton - buttons inside the collection container
                // , split: ISplit - splits inside the collection container
            },
            button: {
                tag: 'button',
                className: 'dt-button',
                active: 'dt-button-active', // class name
                disabled: 'disabled', // class name
                spacer: {
                    className: 'dt-button-spacer',
                    tag: 'span'
                },
                liner: {
                    tag: 'span',
                    className: ''
                }
            },
            split: {
                action: {
                    // action button
                    className: 'dt-button-split-drop-button dt-button',
                    tag: 'button'
                },
                dropdown: {
                    // button to trigger the dropdown
                    align: 'split-right',
                    className: 'dt-button-split-drop',
                    dropHtml: '<span class="dt-button-down-arrow">&#x25BC;</span>',
                    splitAlignClass: 'dt-button-split-left',
                    tag: 'button'
                },
                wrapper: {
                    // wrap around both
                    className: 'dt-button-split',
                    tag: 'div'
                }
            }
        }
    };

    /**
     * Version information
     * @type {string}
     * @static
     */
    Buttons.version = '3.1.0';

    $.extend(_dtButtons, {
        collection: {
            text: function (dt) {
                return dt.i18n('buttons.collection', 'Collection');
            },
            className: 'buttons-collection',
            closeButton: false,
            init: function (dt, button) {
                button.attr('aria-expanded', false);
            },
            action: function (e, dt, button, config) {
                if (config._collection.parents('body').length) {
                    this.popover(false, config);
                }
                else {
                    this.popover(config._collection, config);
                }

                // When activated using a key - auto focus on the
                // first item in the popover
                if (e.type === 'keypress') {
                    $('a, button', config._collection).eq(0).focus();
                }
            },
            attr: {
                'aria-haspopup': 'dialog'
            }
            // Also the popover options, defined in Buttons.popover
        },
        split: {
            text: function (dt) {
                return dt.i18n('buttons.split', 'Split');
            },
            className: 'buttons-split',
            closeButton: false,
            init: function (dt, button) {
                return button.attr('aria-expanded', false);
            },
            action: function (e, dt, button, config) {
                this.popover(config._collection, config);
            },
            attr: {
                'aria-haspopup': 'dialog'
            }
            // Also the popover options, defined in Buttons.popover
        },
        copy: function () {
            if (_dtButtons.copyHtml5) {
                return 'copyHtml5';
            }
        },
        csv: function (dt, conf) {
            if (_dtButtons.csvHtml5 && _dtButtons.csvHtml5.available(dt, conf)) {
                return 'csvHtml5';
            }
        },
        excel: function (dt, conf) {
            if (
                _dtButtons.excelHtml5 &&
                _dtButtons.excelHtml5.available(dt, conf)
            ) {
                return 'excelHtml5';
            }
        },
        pdf: function (dt, conf) {
            if (_dtButtons.pdfHtml5 && _dtButtons.pdfHtml5.available(dt, conf)) {
                return 'pdfHtml5';
            }
        },
        pageLength: function (dt) {
            var lengthMenu = dt.settings()[0].aLengthMenu;
            var vals = [];
            var lang = [];
            var text = function (dt) {
                return dt.i18n(
                    'buttons.pageLength',
                    {
                        '-1': 'Show all rows',
                        _: 'Show %d rows'
                    },
                    dt.page.len()
                );
            };

            // Support for DataTables 1.x 2D array
            if (Array.isArray(lengthMenu[0])) {
                vals = lengthMenu[0];
                lang = lengthMenu[1];
            }
            else {
                for (var i = 0; i < lengthMenu.length; i++) {
                    var option = lengthMenu[i];

                    // Support for DataTables 2 object in the array
                    if ($.isPlainObject(option)) {
                        vals.push(option.value);
                        lang.push(option.label);
                    }
                    else {
                        vals.push(option);
                        lang.push(option);
                    }
                }
            }

            return {
                extend: 'collection',
                text: text,
                className: 'buttons-page-length',
                autoClose: true,
                buttons: $.map(vals, function (val, i) {
                    return {
                        text: lang[i],
                        className: 'button-page-length',
                        action: function (e, dt) {
                            dt.page.len(val).draw();
                        },
                        init: function (dt, node, conf) {
                            var that = this;
                            var fn = function () {
                                that.active(dt.page.len() === val);
                            };

                            dt.on('length.dt' + conf.namespace, fn);
                            fn();
                        },
                        destroy: function (dt, node, conf) {
                            dt.off('length.dt' + conf.namespace);
                        }
                    };
                }),
                init: function (dt, node, conf) {
                    var that = this;
                    dt.on('length.dt' + conf.namespace, function () {
                        that.text(conf.text);
                    });
                },
                destroy: function (dt, node, conf) {
                    dt.off('length.dt' + conf.namespace);
                }
            };
        },
        spacer: {
            style: 'empty',
            spacer: true,
            text: function (dt) {
                return dt.i18n('buttons.spacer', '');
            }
        }
    });

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * DataTables API
     *
     * For complete documentation, please refer to the docs/api directory or the
     * DataTables site
     */

// Buttons group and individual button selector
    DataTable.Api.register('buttons()', function (group, selector) {
        // Argument shifting
        if (selector === undefined) {
            selector = group;
            group = undefined;
        }

        this.selector.buttonGroup = group;

        var res = this.iterator(
            true,
            'table',
            function (ctx) {
                if (ctx._buttons) {
                    return Buttons.buttonSelector(
                        Buttons.instanceSelector(group, ctx._buttons),
                        selector
                    );
                }
            },
            true
        );

        res._groupSelector = group;
        return res;
    });

// Individual button selector
    DataTable.Api.register('button()', function (group, selector) {
        // just run buttons() and truncate
        var buttons = this.buttons(group, selector);

        if (buttons.length > 1) {
            buttons.splice(1, buttons.length);
        }

        return buttons;
    });

// Active buttons
    DataTable.Api.registerPlural(
        'buttons().active()',
        'button().active()',
        function (flag) {
            if (flag === undefined) {
                return this.map(function (set) {
                    return set.inst.active(set.node);
                });
            }

            return this.each(function (set) {
                set.inst.active(set.node, flag);
            });
        }
    );

// Get / set button action
    DataTable.Api.registerPlural(
        'buttons().action()',
        'button().action()',
        function (action) {
            if (action === undefined) {
                return this.map(function (set) {
                    return set.inst.action(set.node);
                });
            }

            return this.each(function (set) {
                set.inst.action(set.node, action);
            });
        }
    );

// Collection control
    DataTable.Api.registerPlural(
        'buttons().collectionRebuild()',
        'button().collectionRebuild()',
        function (buttons) {
            return this.each(function (set) {
                for (var i = 0; i < buttons.length; i++) {
                    if (typeof buttons[i] === 'object') {
                        buttons[i].parentConf = set;
                    }
                }
                set.inst.collectionRebuild(set.node, buttons);
            });
        }
    );

// Enable / disable buttons
    DataTable.Api.register(
        ['buttons().enable()', 'button().enable()'],
        function (flag) {
            return this.each(function (set) {
                set.inst.enable(set.node, flag);
            });
        }
    );

// Disable buttons
    DataTable.Api.register(
        ['buttons().disable()', 'button().disable()'],
        function () {
            return this.each(function (set) {
                set.inst.disable(set.node);
            });
        }
    );

// Button index
    DataTable.Api.register('button().index()', function () {
        var idx = null;

        this.each(function (set) {
            var res = set.inst.index(set.node);

            if (res !== null) {
                idx = res;
            }
        });

        return idx;
    });

// Get button nodes
    DataTable.Api.registerPlural(
        'buttons().nodes()',
        'button().node()',
        function () {
            var jq = $();

            // jQuery will automatically reduce duplicates to a single entry
            $(
                this.each(function (set) {
                    jq = jq.add(set.inst.node(set.node));
                })
            );

            return jq;
        }
    );

// Get / set button processing state
    DataTable.Api.registerPlural(
        'buttons().processing()',
        'button().processing()',
        function (flag) {
            if (flag === undefined) {
                return this.map(function (set) {
                    return set.inst.processing(set.node);
                });
            }

            return this.each(function (set) {
                set.inst.processing(set.node, flag);
            });
        }
    );

// Get / set button text (i.e. the button labels)
    DataTable.Api.registerPlural(
        'buttons().text()',
        'button().text()',
        function (label) {
            if (label === undefined) {
                return this.map(function (set) {
                    return set.inst.text(set.node);
                });
            }

            return this.each(function (set) {
                set.inst.text(set.node, label);
            });
        }
    );

// Trigger a button's action
    DataTable.Api.registerPlural(
        'buttons().trigger()',
        'button().trigger()',
        function () {
            return this.each(function (set) {
                set.inst.node(set.node).trigger('click');
            });
        }
    );

// Button resolver to the popover
    DataTable.Api.register('button().popover()', function (content, options) {
        return this.map(function (set) {
            return set.inst._popover(content, this.button(this[0].node), options);
        });
    });

// Get the container elements
    DataTable.Api.register('buttons().containers()', function () {
        var jq = $();
        var groupSelector = this._groupSelector;

        // We need to use the group selector directly, since if there are no buttons
        // the result set will be empty
        this.iterator(true, 'table', function (ctx) {
            if (ctx._buttons) {
                var insts = Buttons.instanceSelector(groupSelector, ctx._buttons);

                for (var i = 0, ien = insts.length; i < ien; i++) {
                    jq = jq.add(insts[i].container());
                }
            }
        });

        return jq;
    });

    DataTable.Api.register('buttons().container()', function () {
        // API level of nesting is `buttons()` so we can zip into the containers method
        return this.containers().eq(0);
    });

// Add a new button
    DataTable.Api.register('button().add()', function (idx, conf, draw) {
        var ctx = this.context;

        // Don't use `this` as it could be empty - select the instances directly
        if (ctx.length) {
            var inst = Buttons.instanceSelector(
                this._groupSelector,
                ctx[0]._buttons
            );

            if (inst.length) {
                inst[0].add(conf, idx, draw);
            }
        }

        return this.button(this._groupSelector, idx);
    });

// Destroy the button sets selected
    DataTable.Api.register('buttons().destroy()', function () {
        this.pluck('inst')
            .unique()
            .each(function (inst) {
                inst.destroy();
            });

        return this;
    });

// Remove a button
    DataTable.Api.registerPlural(
        'buttons().remove()',
        'buttons().remove()',
        function () {
            this.each(function (set) {
                set.inst.remove(set.node);
            });

            return this;
        }
    );

// Information box that can be used by buttons
    var _infoTimer;
    DataTable.Api.register('buttons.info()', function (title, message, time) {
        var that = this;

        if (title === false) {
            this.off('destroy.btn-info');
            _fadeOut($('#datatables_buttons_info'), 400, function () {
                $(this).remove();
            });
            clearTimeout(_infoTimer);
            _infoTimer = null;

            return this;
        }

        if (_infoTimer) {
            clearTimeout(_infoTimer);
        }

        if ($('#datatables_buttons_info').length) {
            $('#datatables_buttons_info').remove();
        }

        title = title ? '<h2>' + title + '</h2>' : '';

        _fadeIn(
            $('<div id="datatables_buttons_info" class="dt-button-info"/>')
                .html(title)
                .append(
                    $('<div/>')[typeof message === 'string' ? 'html' : 'append'](
                        message
                    )
                )
                .css('display', 'none')
                .appendTo('body')
        );

        if (time !== undefined && time !== 0) {
            _infoTimer = setTimeout(function () {
                that.buttons.info(false);
            }, time);
        }

        this.on('destroy.btn-info', function () {
            that.buttons.info(false);
        });

        return this;
    });

// Get data from the table for export - this is common to a number of plug-in
// buttons so it is included in the Buttons core library
    DataTable.Api.register('buttons.exportData()', function (options) {
        if (this.context.length) {
            return _exportData(new DataTable.Api(this.context[0]), options);
        }
    });

// Get information about the export that is common to many of the export data
// types (DRY)
    DataTable.Api.register('buttons.exportInfo()', function (conf) {
        if (!conf) {
            conf = {};
        }

        return {
            filename: _filename(conf, this),
            title: _title(conf, this),
            messageTop: _message(this, conf, conf.message || conf.messageTop, 'top'),
            messageBottom: _message(this, conf, conf.messageBottom, 'bottom')
        };
    });

    /**
     * Get the file name for an exported file.
     *
     * @param {object} config Button configuration
     * @param {object} dt DataTable instance
     */
    var _filename = function (config, dt) {
        // Backwards compatibility
        var filename =
            config.filename === '*' &&
            config.title !== '*' &&
            config.title !== undefined &&
            config.title !== null &&
            config.title !== ''
                ? config.title
                : config.filename;

        if (typeof filename === 'function') {
            filename = filename(config, dt);
        }

        if (filename === undefined || filename === null) {
            return null;
        }

        if (filename.indexOf('*') !== -1) {
            filename = filename.replace(/\*/g, $('head > title').text()).trim();
        }

        // Strip characters which the OS will object to
        filename = filename.replace(/[^a-zA-Z0-9_\u00A1-\uFFFF\.,\-_ !\(\)]/g, '');

        var extension = _stringOrFunction(config.extension, config, dt);
        if (!extension) {
            extension = '';
        }

        return filename + extension;
    };

    /**
     * Simply utility method to allow parameters to be given as a function
     *
     * @param {undefined|string|function} option Option
     * @return {null|string} Resolved value
     */
    var _stringOrFunction = function (option, config, dt) {
        if (option === null || option === undefined) {
            return null;
        }
        else if (typeof option === 'function') {
            return option(config, dt);
        }
        return option;
    };

    /**
     * Get the title for an exported file.
     *
     * @param {object} config	Button configuration
     */
    var _title = function (config, dt) {
        var title = _stringOrFunction(config.title, config, dt);

        return title === null
            ? null
            : title.indexOf('*') !== -1
                ? title.replace(/\*/g, $('head > title').text() || 'Exported data')
                : title;
    };

    var _message = function (dt, config, option, position) {
        var message = _stringOrFunction(option, config, dt);
        if (message === null) {
            return null;
        }

        var caption = $('caption', dt.table().container()).eq(0);
        if (message === '*') {
            var side = caption.css('caption-side');
            if (side !== position) {
                return null;
            }

            return caption.length ? caption.text() : '';
        }

        return message;
    };

    var _exportTextarea = $('<textarea/>')[0];
    var _exportData = function (dt, inOpts) {
        var config = $.extend(
            true,
            {},
            {
                rows: null,
                columns: '',
                modifier: {
                    search: 'applied',
                    order: 'applied'
                },
                orthogonal: 'display',
                stripHtml: true,
                stripNewlines: true,
                decodeEntities: true,
                trim: true,
                format: {
                    header: function (d) {
                        return Buttons.stripData(d, config);
                    },
                    footer: function (d) {
                        return Buttons.stripData(d, config);
                    },
                    body: function (d) {
                        return Buttons.stripData(d, config);
                    }
                },
                customizeData: null,
                customizeZip: null
            },
            inOpts
        );

        var header = dt
            .columns(config.columns)
            .indexes()
            .map(function (idx) {
                var col = dt.column(idx);
                return config.format.header(col.title(), idx, col.header());
            })
            .toArray();

        var footer = dt.table().footer()
            ? dt
                .columns(config.columns)
                .indexes()
                .map(function (idx) {
                    var el = dt.column(idx).footer();
                    var val = '';

                    if (el) {
                        var inner = $('.dt-column-title', el);

                        val = inner.length
                            ? inner.html()
                            : $(el).html();
                    }

                    return config.format.footer(val, idx, el);
                })
                .toArray()
            : null;

        // If Select is available on this table, and any rows are selected, limit the export
        // to the selected rows. If no rows are selected, all rows will be exported. Specify
        // a `selected` modifier to control directly.
        var modifier = $.extend({}, config.modifier);
        if (
            dt.select &&
            typeof dt.select.info === 'function' &&
            modifier.selected === undefined
        ) {
            if (
                dt.rows(config.rows, $.extend({ selected: true }, modifier)).any()
            ) {
                $.extend(modifier, { selected: true });
            }
        }

        var rowIndexes = dt.rows(config.rows, modifier).indexes().toArray();
        var selectedCells = dt.cells(rowIndexes, config.columns, {
            order: modifier.order
        });
        var cells = selectedCells.render(config.orthogonal).toArray();
        var cellNodes = selectedCells.nodes().toArray();
        var cellIndexes = selectedCells.indexes().toArray();

        var columns = dt.columns(config.columns).count();
        var rows = columns > 0 ? cells.length / columns : 0;
        var body = [];
        var cellCounter = 0;

        for (var i = 0, ien = rows; i < ien; i++) {
            var row = [columns];

            for (var j = 0; j < columns; j++) {
                row[j] = config.format.body(
                    cells[cellCounter],
                    cellIndexes[cellCounter].row,
                    cellIndexes[cellCounter].column,
                    cellNodes[cellCounter]
                );
                cellCounter++;
            }

            body[i] = row;
        }

        var data = {
            header: header,
            headerStructure: _headerFormatter(
                config.format.header,
                dt.table().header.structure(config.columns)
            ),
            footer: footer,
            footerStructure: _headerFormatter(
                config.format.footer,
                dt.table().footer.structure(config.columns)
            ),
            body: body
        };

        if (config.customizeData) {
            config.customizeData(data);
        }

        return data;
    };

    function _headerFormatter(formatter, struct) {
        for (var i=0 ; i<struct.length ; i++) {
            for (var j=0 ; j<struct[i].length ; j++) {
                var item = struct[i][j];

                if (item) {
                    item.title = formatter(
                        item.title,
                        j,
                        item.cell
                    );
                }
            }
        }

        return struct;
    }

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * DataTables interface
     */

// Attach to DataTables objects for global access
    $.fn.dataTable.Buttons = Buttons;
    $.fn.DataTable.Buttons = Buttons;

// DataTables creation - check if the buttons have been defined for this table,
// they will have been if the `B` option was used in `dom`, otherwise we should
// create the buttons instance here so they can be inserted into the document
// using the API. Listen for `init` for compatibility with pre 1.10.10, but to
// be removed in future.
    $(document).on('init.dt plugin-init.dt', function (e, settings) {
        if (e.namespace !== 'dt') {
            return;
        }

        var opts = settings.oInit.buttons || DataTable.defaults.buttons;

        if (opts && !settings._buttons) {
            new Buttons(settings, opts).container();
        }
    });

    function _init(settings, options) {
        var api = new DataTable.Api(settings);
        var opts = options
            ? options
            : api.init().buttons || DataTable.defaults.buttons;

        return new Buttons(api, opts).container();
    }

// DataTables 1 `dom` feature option
    DataTable.ext.feature.push({
        fnInit: _init,
        cFeature: 'B'
    });

// DataTables 2 layout feature
    if (DataTable.feature) {
        DataTable.feature.register('buttons', _init);
    }


    return DataTable;
}));

/*! DataTables styling wrapper for Buttons
 * © SpryMedia Ltd - datatables.net/license
 */

(function( factory ){
    if ( typeof define === 'function' && define.amd ) {
        // AMD
        define( ['jquery', 'datatables.net-dt', 'datatables.net-buttons'], function ( $ ) {
            return factory( $, window, document );
        } );
    }
    else if ( typeof exports === 'object' ) {
        // CommonJS
        var jq = require('jquery');
        var cjsRequires = function (root, $) {
            if ( ! $.fn.dataTable ) {
                require('datatables.net-dt')(root, $);
            }

            if ( ! $.fn.dataTable.Buttons ) {
                require('datatables.net-buttons')(root, $);
            }
        };

        if (typeof window === 'undefined') {
            module.exports = function (root, $) {
                if ( ! root ) {
                    // CommonJS environments without a window global must pass a
                    // root. This will give an error otherwise
                    root = window;
                }

                if ( ! $ ) {
                    $ = jq( root );
                }

                cjsRequires( root, $ );
                return factory( $, root, root.document );
            };
        }
        else {
            cjsRequires( window, jq );
            module.exports = factory( jq, window, window.document );
        }
    }
    else {
        // Browser
        factory( jQuery, window, document );
    }
}(function( $, window, document ) {
    'use strict';
    var DataTable = $.fn.dataTable;




    return DataTable;
}));

/*! Select for DataTables 2.0.3
 * © SpryMedia Ltd - datatables.net/license/mit
 */

(function( factory ){
    if ( typeof define === 'function' && define.amd ) {
        // AMD
        define( ['jquery', 'datatables.net'], function ( $ ) {
            return factory( $, window, document );
        } );
    }
    else if ( typeof exports === 'object' ) {
        // CommonJS
        var jq = require('jquery');
        var cjsRequires = function (root, $) {
            if ( ! $.fn.dataTable ) {
                require('datatables.net')(root, $);
            }
        };

        if (typeof window === 'undefined') {
            module.exports = function (root, $) {
                if ( ! root ) {
                    // CommonJS environments without a window global must pass a
                    // root. This will give an error otherwise
                    root = window;
                }

                if ( ! $ ) {
                    $ = jq( root );
                }

                cjsRequires( root, $ );
                return factory( $, root, root.document );
            };
        }
        else {
            cjsRequires( window, jq );
            module.exports = factory( jq, window, window.document );
        }
    }
    else {
        // Browser
        factory( jQuery, window, document );
    }
}(function( $, window, document ) {
    'use strict';
    var DataTable = $.fn.dataTable;



// Version information for debugger
    DataTable.select = {};

    DataTable.select.classes = {
        checkbox: 'dt-select-checkbox'
    };

    DataTable.select.version = '2.0.3';

    DataTable.select.init = function (dt) {
        var ctx = dt.settings()[0];

        if (!DataTable.versionCheck('2')) {
            throw 'Warning: Select requires DataTables 2 or newer';
        }

        if (ctx._select) {
            return;
        }

        var savedSelected = dt.state.loaded();

        var selectAndSave = function (e, settings, data) {
            if (data === null || data.select === undefined) {
                return;
            }

            // Clear any currently selected rows, before restoring state
            // None will be selected on first initialisation
            if (dt.rows({ selected: true }).any()) {
                dt.rows().deselect();
            }
            if (data.select.rows !== undefined) {
                dt.rows(data.select.rows).select();
            }

            if (dt.columns({ selected: true }).any()) {
                dt.columns().deselect();
            }
            if (data.select.columns !== undefined) {
                dt.columns(data.select.columns).select();
            }

            if (dt.cells({ selected: true }).any()) {
                dt.cells().deselect();
            }
            if (data.select.cells !== undefined) {
                for (var i = 0; i < data.select.cells.length; i++) {
                    dt.cell(data.select.cells[i].row, data.select.cells[i].column).select();
                }
            }

            dt.state.save();
        };

        dt.on('stateSaveParams', function (e, settings, data) {
            data.select = {};
            data.select.rows = dt.rows({ selected: true }).ids(true).toArray();
            data.select.columns = dt.columns({ selected: true })[0];
            data.select.cells = dt.cells({ selected: true })[0].map(function (coords) {
                return { row: dt.row(coords.row).id(true), column: coords.column };
            });
        })
            .on('stateLoadParams', selectAndSave)
            .one('init', function () {
                selectAndSave(undefined, undefined, savedSelected);
            });

        var init = ctx.oInit.select;
        var defaults = DataTable.defaults.select;
        var opts = init === undefined ? defaults : init;

        // Set defaults
        var items = 'row';
        var style = 'api';
        var blurable = false;
        var toggleable = true;
        var info = true;
        var selector = 'td, th';
        var className = 'selected';
        var headerCheckbox = true;
        var setStyle = false;

        ctx._select = {
            infoEls: []
        };

        // Initialisation customisations
        if (opts === true) {
            style = 'os';
            setStyle = true;
        }
        else if (typeof opts === 'string') {
            style = opts;
            setStyle = true;
        }
        else if ($.isPlainObject(opts)) {
            if (opts.blurable !== undefined) {
                blurable = opts.blurable;
            }

            if (opts.toggleable !== undefined) {
                toggleable = opts.toggleable;
            }

            if (opts.info !== undefined) {
                info = opts.info;
            }

            if (opts.items !== undefined) {
                items = opts.items;
            }

            if (opts.style !== undefined) {
                style = opts.style;
                setStyle = true;
            }
            else {
                style = 'os';
                setStyle = true;
            }

            if (opts.selector !== undefined) {
                selector = opts.selector;
            }

            if (opts.className !== undefined) {
                className = opts.className;
            }

            if (opts.headerCheckbox !== undefined) {
                headerCheckbox = opts.headerCheckbox;
            }
        }

        dt.select.selector(selector);
        dt.select.items(items);
        dt.select.style(style);
        dt.select.blurable(blurable);
        dt.select.toggleable(toggleable);
        dt.select.info(info);
        ctx._select.className = className;

        // If the init options haven't enabled select, but there is a selectable
        // class name, then enable
        if (!setStyle && $(dt.table().node()).hasClass('selectable')) {
            dt.select.style('os');
        }

        // Insert a checkbox into the header if needed - might need to wait
        // for init complete, or it might already be done
        if (headerCheckbox || headerCheckbox === 'select-page' || headerCheckbox === 'select-all') {
            initCheckboxHeader(dt, headerCheckbox);

            dt.on('init', function () {
                initCheckboxHeader(dt, headerCheckbox);
            });
        }
    };

    /*

    Select is a collection of API methods, event handlers, event emitters and
    buttons (for the `Buttons` extension) for DataTables. It provides the following
    features, with an overview of how they are implemented:

    ## Selection of rows, columns and cells. Whether an item is selected or not is
       stored in:

    * rows: a `_select_selected` property which contains a boolean value of the
      DataTables' `aoData` object for each row
    * columns: a `_select_selected` property which contains a boolean value of the
      DataTables' `aoColumns` object for each column
    * cells: a `_selected_cells` property which contains an array of boolean values
      of the `aoData` object for each row. The array is the same length as the
      columns array, with each element of it representing a cell.

    This method of using boolean flags allows Select to operate when nodes have not
    been created for rows / cells (DataTables' defer rendering feature).

    ## API methods

    A range of API methods are available for triggering selection and de-selection
    of rows. Methods are also available to configure the selection events that can
    be triggered by an end user (such as which items are to be selected). To a large
    extent, these of API methods *is* Select. It is basically a collection of helper
    functions that can be used to select items in a DataTable.

    Configuration of select is held in the object `_select` which is attached to the
    DataTables settings object on initialisation. Select being available on a table
    is not optional when Select is loaded, but its default is for selection only to
    be available via the API - so the end user wouldn't be able to select rows
    without additional configuration.

    The `_select` object contains the following properties:

    ```
    {
        items:string       - Can be `rows`, `columns` or `cells`. Defines what item
                             will be selected if the user is allowed to activate row
                             selection using the mouse.
        style:string       - Can be `none`, `single`, `multi` or `os`. Defines the
                             interaction style when selecting items
        blurable:boolean   - If row selection can be cleared by clicking outside of
                             the table
        toggleable:boolean - If row selection can be cancelled by repeated clicking
                             on the row
        info:boolean       - If the selection summary should be shown in the table
                             information elements
        infoEls:element[]  - List of HTML elements with info elements for a table
    }
    ```

    In addition to the API methods, Select also extends the DataTables selector
    options for rows, columns and cells adding a `selected` option to the selector
    options object, allowing the developer to select only selected items or
    unselected items.

    ## Mouse selection of items

    Clicking on items can be used to select items. This is done by a simple event
    handler that will select the items using the API methods.

     */

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * Local functions
     */

    /**
     * Add one or more cells to the selection when shift clicking in OS selection
     * style cell selection.
     *
     * Cell range is more complicated than row and column as we want to select
     * in the visible grid rather than by index in sequence. For example, if you
     * click first in cell 1-1 and then shift click in 2-2 - cells 1-2 and 2-1
     * should also be selected (and not 1-3, 1-4. etc)
     *
     * @param  {DataTable.Api} dt   DataTable
     * @param  {object}        idx  Cell index to select to
     * @param  {object}        last Cell index to select from
     * @private
     */
    function cellRange(dt, idx, last) {
        var indexes;
        var columnIndexes;
        var rowIndexes;
        var selectColumns = function (start, end) {
            if (start > end) {
                var tmp = end;
                end = start;
                start = tmp;
            }

            var record = false;
            return dt
                .columns(':visible')
                .indexes()
                .filter(function (i) {
                    if (i === start) {
                        record = true;
                    }

                    if (i === end) {
                        // not else if, as start might === end
                        record = false;
                        return true;
                    }

                    return record;
                });
        };

        var selectRows = function (start, end) {
            var indexes = dt.rows({ search: 'applied' }).indexes();

            // Which comes first - might need to swap
            if (indexes.indexOf(start) > indexes.indexOf(end)) {
                var tmp = end;
                end = start;
                start = tmp;
            }

            var record = false;
            return indexes.filter(function (i) {
                if (i === start) {
                    record = true;
                }

                if (i === end) {
                    record = false;
                    return true;
                }

                return record;
            });
        };

        if (!dt.cells({ selected: true }).any() && !last) {
            // select from the top left cell to this one
            columnIndexes = selectColumns(0, idx.column);
            rowIndexes = selectRows(0, idx.row);
        }
        else {
            // Get column indexes between old and new
            columnIndexes = selectColumns(last.column, idx.column);
            rowIndexes = selectRows(last.row, idx.row);
        }

        indexes = dt.cells(rowIndexes, columnIndexes).flatten();

        if (!dt.cells(idx, { selected: true }).any()) {
            // Select range
            dt.cells(indexes).select();
        }
        else {
            // Deselect range
            dt.cells(indexes).deselect();
        }
    }

    /**
     * Get the class
     * @returns
     */
    function checkboxClass(selector) {
        var name = DataTable.select.classes.checkbox;

        return selector
            ? name.replace(/ /g, '.')
            : name;
    }

    /**
     * Disable mouse selection by removing the selectors
     *
     * @param {DataTable.Api} dt DataTable to remove events from
     * @private
     */
    function disableMouseSelection(dt) {
        var ctx = dt.settings()[0];
        var selector = ctx._select.selector;

        $(dt.table().container())
            .off('mousedown.dtSelect', selector)
            .off('mouseup.dtSelect', selector)
            .off('click.dtSelect', selector);

        $('body').off('click.dtSelect' + _safeId(dt.table().node()));
    }

    /**
     * Attach mouse listeners to the table to allow mouse selection of items
     *
     * @param {DataTable.Api} dt DataTable to remove events from
     * @private
     */
    function enableMouseSelection(dt) {
        var container = $(dt.table().container());
        var ctx = dt.settings()[0];
        var selector = ctx._select.selector;
        var matchSelection;

        container
            .on('mousedown.dtSelect', selector, function (e) {
                // Disallow text selection for shift clicking on the table so multi
                // element selection doesn't look terrible!
                if (e.shiftKey || e.metaKey || e.ctrlKey) {
                    container
                        .css('-moz-user-select', 'none')
                        .one('selectstart.dtSelect', selector, function () {
                            return false;
                        });
                }

                if (window.getSelection) {
                    matchSelection = window.getSelection();
                }
            })
            .on('mouseup.dtSelect', selector, function () {
                // Allow text selection to occur again, Mozilla style (tested in FF
                // 35.0.1 - still required)
                container.css('-moz-user-select', '');
            })
            .on('click.dtSelect', selector, function (e) {
                var items = dt.select.items();
                var idx;

                // If text was selected (click and drag), then we shouldn't change
                // the row's selected state
                if (matchSelection) {
                    var selection = window.getSelection();

                    // If the element that contains the selection is not in the table, we can ignore it
                    // This can happen if the developer selects text from the click event
                    if (
                        !selection.anchorNode ||
                        $(selection.anchorNode).closest('table')[0] === dt.table().node()
                    ) {
                        if (selection !== matchSelection) {
                            return;
                        }
                    }
                }

                var ctx = dt.settings()[0];
                var container = dt.table().container();

                // Ignore clicks inside a sub-table
                if ($(e.target).closest('div.dt-container')[0] != container) {
                    return;
                }

                var cell = dt.cell($(e.target).closest('td, th'));

                // Check the cell actually belongs to the host DataTable (so child
                // rows, etc, are ignored)
                if (!cell.any()) {
                    return;
                }

                var event = $.Event('user-select.dt');
                eventTrigger(dt, event, [items, cell, e]);

                if (event.isDefaultPrevented()) {
                    return;
                }

                var cellIndex = cell.index();
                if (items === 'row') {
                    idx = cellIndex.row;
                    typeSelect(e, dt, ctx, 'row', idx);
                }
                else if (items === 'column') {
                    idx = cell.index().column;
                    typeSelect(e, dt, ctx, 'column', idx);
                }
                else if (items === 'cell') {
                    idx = cell.index();
                    typeSelect(e, dt, ctx, 'cell', idx);
                }

                ctx._select_lastCell = cellIndex;
            });

        // Blurable
        $('body').on('click.dtSelect' + _safeId(dt.table().node()), function (e) {
            if (ctx._select.blurable) {
                // If the click was inside the DataTables container, don't blur
                if ($(e.target).parents().filter(dt.table().container()).length) {
                    return;
                }

                // Ignore elements which have been removed from the DOM (i.e. paging
                // buttons)
                if ($(e.target).parents('html').length === 0) {
                    return;
                }

                // Don't blur in Editor form
                if ($(e.target).parents('div.DTE').length) {
                    return;
                }

                var event = $.Event('select-blur.dt');
                eventTrigger(dt, event, [e.target, e]);

                if (event.isDefaultPrevented()) {
                    return;
                }

                clear(ctx, true);
            }
        });
    }

    /**
     * Trigger an event on a DataTable
     *
     * @param {DataTable.Api} api      DataTable to trigger events on
     * @param  {boolean}      selected true if selected, false if deselected
     * @param  {string}       type     Item type acting on
     * @param  {boolean}      any      Require that there are values before
     *     triggering
     * @private
     */
    function eventTrigger(api, type, args, any) {
        if (any && !api.flatten().length) {
            return;
        }

        if (typeof type === 'string') {
            type = type + '.dt';
        }

        args.unshift(api);

        $(api.table().node()).trigger(type, args);
    }

    /**
     * Update the information element of the DataTable showing information about the
     * items selected. This is done by adding tags to the existing text
     *
     * @param {DataTable.Api} api DataTable to update
     * @private
     */
    function info(api, node) {
        if (api.select.style() === 'api' || api.select.info() === false) {
            return;
        }

        var rows = api.rows({ selected: true }).flatten().length;
        var columns = api.columns({ selected: true }).flatten().length;
        var cells = api.cells({ selected: true }).flatten().length;

        var add = function (el, name, num) {
            el.append(
                $('<span class="select-item"/>').append(
                    api.i18n(
                        'select.' + name + 's',
                        { _: '%d ' + name + 's selected', 0: '', 1: '1 ' + name + ' selected' },
                        num
                    )
                )
            );
        };

        var el = $(node);
        var output = $('<span class="select-info"/>');

        add(output, 'row', rows);
        add(output, 'column', columns);
        add(output, 'cell', cells);

        var existing = el.children('span.select-info');

        if (existing.length) {
            existing.remove();
        }

        if (output.text() !== '') {
            el.append(output);
        }
    }

    /**
     * Add a checkbox to the header for checkbox columns, allowing all rows to
     * be selected, deselected or just to show the state.
     *
     * @param {*} dt API
     * @param {*} headerCheckbox the header checkbox option
     */
    function initCheckboxHeader( dt, headerCheckbox ) {
        // Find any checkbox column(s)
        dt.columns('.dt-select').every(function () {
            var header = this.header();

            if (! $('input', header).length) {
                // If no checkbox yet, insert one
                var input = $('<input>')
                    .attr({
                        class: checkboxClass(true),
                        type: 'checkbox',
                        'aria-label': dt.i18n('select.aria.headerCheckbox') || 'Select all rows'
                    })
                    .appendTo(header)
                    .on('change', function () {
                        if (this.checked) {
                            if (headerCheckbox == 'select-page') {
                                dt.rows({page: 'current'}).select()
                            } else {
                                dt.rows({search: 'applied'}).select();
                            }
                        }
                        else {
                            dt.rows({selected: true}).deselect();
                        }
                    })
                    .on('click', function (e) {
                        e.stopPropagation();
                    });

                // Update the header checkbox's state when the selection in the
                // table changes
                dt.on('draw select deselect', function (e, pass, type) {
                    if (type === 'row' || ! type) {
                        var count = dt.rows({selected: true}).count();
                        var search = dt.rows({search: 'applied', selected: true}).count();
                        var available = headerCheckbox == 'select-page' ? dt.rows({page: 'current'}).count() : dt.rows({search: 'applied'}).count();

                        if (search && search <= count && search === available) {
                            input
                                .prop('checked', true)
                                .prop('indeterminate', false);
                        }
                        else if (search === 0 && count === 0) {
                            input
                                .prop('checked', false)
                                .prop('indeterminate', false);
                        }
                        else {
                            input
                                .prop('checked', false)
                                .prop('indeterminate', true);
                        }
                    }
                });
            }
        });
    }

    /**
     * Initialisation of a new table. Attach event handlers and callbacks to allow
     * Select to operate correctly.
     *
     * This will occur _after_ the initial DataTables initialisation, although
     * before Ajax data is rendered, if there is ajax data
     *
     * @param  {DataTable.settings} ctx Settings object to operate on
     * @private
     */
    function init(ctx) {
        var api = new DataTable.Api(ctx);
        ctx._select_init = true;

        // Row callback so that classes can be added to rows and cells if the item
        // was selected before the element was created. This will happen with the
        // `deferRender` option enabled.
        //
        // This method of attaching to `aoRowCreatedCallback` is a hack until
        // DataTables has proper events for row manipulation If you are reviewing
        // this code to create your own plug-ins, please do not do this!
        ctx.aoRowCreatedCallback.push(function (row, data, index) {
                var i, ien;
                var d = ctx.aoData[index];

                // Row
                if (d._select_selected) {
                    $(row)
                        .addClass(ctx._select.className)
                        .find('input.' + checkboxClass(true)).prop('checked', true);
                }

                // Cells and columns - if separated out, we would need to do two
                // loops, so it makes sense to combine them into a single one
                for (i = 0, ien = ctx.aoColumns.length; i < ien; i++) {
                    if (
                        ctx.aoColumns[i]._select_selected ||
                        (d._selected_cells && d._selected_cells[i])
                    ) {
                        $(d.anCells[i]).addClass(ctx._select.className)
                    }
                }
            }
        );

        // On Ajax reload we want to reselect all rows which are currently selected,
        // if there is an rowId (i.e. a unique value to identify each row with)
        api.on('preXhr.dt.dtSelect', function (e, settings) {
            if (settings !== api.settings()[0]) {
                // Not triggered by our DataTable!
                return;
            }

            // note that column selection doesn't need to be cached and then
            // reselected, as they are already selected
            var rows = api
                .rows({ selected: true })
                .ids(true)
                .filter(function (d) {
                    return d !== undefined;
                });

            var cells = api
                .cells({ selected: true })
                .eq(0)
                .map(function (cellIdx) {
                    var id = api.row(cellIdx.row).id(true);
                    return id ? { row: id, column: cellIdx.column } : undefined;
                })
                .filter(function (d) {
                    return d !== undefined;
                });

            // On the next draw, reselect the currently selected items
            api.one('draw.dt.dtSelect', function () {
                api.rows(rows).select();

                // `cells` is not a cell index selector, so it needs a loop
                if (cells.any()) {
                    cells.each(function (id) {
                        api.cells(id.row, id.column).select();
                    });
                }
            });
        });

        // Update the table information element with selected item summary
        api.on('info.dt', function (e, ctx, node) {
            // Store the info node for updating on select / deselect
            if (!ctx._select.infoEls.includes(node)) {
                ctx._select.infoEls.push(node);
            }

            info(api, node);
        });

        api.on('select.dtSelect.dt deselect.dtSelect.dt', function () {
            ctx._select.infoEls.forEach(function (el) {
                info(api, el);
            });

            api.state.save();
        });

        // Clean up and release
        api.on('destroy.dtSelect', function () {
            // Remove class directly rather than calling deselect - which would trigger events
            $(api.rows({ selected: true }).nodes()).removeClass(api.settings()[0]._select.className);

            disableMouseSelection(api);
            api.off('.dtSelect');
            $('body').off('.dtSelect' + _safeId(api.table().node()));
        });
    }

    /**
     * Add one or more items (rows or columns) to the selection when shift clicking
     * in OS selection style
     *
     * @param  {DataTable.Api} dt   DataTable
     * @param  {string}        type Row or column range selector
     * @param  {object}        idx  Item index to select to
     * @param  {object}        last Item index to select from
     * @private
     */
    function rowColumnRange(dt, type, idx, last) {
        // Add a range of rows from the last selected row to this one
        var indexes = dt[type + 's']({ search: 'applied' }).indexes();
        var idx1 = indexes.indexOf(last);
        var idx2 = indexes.indexOf(idx);

        if (!dt[type + 's']({ selected: true }).any() && idx1 === -1) {
            // select from top to here - slightly odd, but both Windows and Mac OS
            // do this
            indexes.splice(indexes.indexOf(idx) + 1, indexes.length);
        }
        else {
            // reverse so we can shift click 'up' as well as down
            if (idx1 > idx2) {
                var tmp = idx2;
                idx2 = idx1;
                idx1 = tmp;
            }

            indexes.splice(idx2 + 1, indexes.length);
            indexes.splice(0, idx1);
        }

        if (!dt[type](idx, { selected: true }).any()) {
            // Select range
            dt[type + 's'](indexes).select();
        }
        else {
            // Deselect range - need to keep the clicked on row selected
            indexes.splice(indexes.indexOf(idx), 1);
            dt[type + 's'](indexes).deselect();
        }
    }

    /**
     * Clear all selected items
     *
     * @param  {DataTable.settings} ctx Settings object of the host DataTable
     * @param  {boolean} [force=false] Force the de-selection to happen, regardless
     *     of selection style
     * @private
     */
    function clear(ctx, force) {
        if (force || ctx._select.style === 'single') {
            var api = new DataTable.Api(ctx);

            api.rows({ selected: true }).deselect();
            api.columns({ selected: true }).deselect();
            api.cells({ selected: true }).deselect();
        }
    }

    /**
     * Select items based on the current configuration for style and items.
     *
     * @param  {object}             e    Mouse event object
     * @param  {DataTables.Api}     dt   DataTable
     * @param  {DataTable.settings} ctx  Settings object of the host DataTable
     * @param  {string}             type Items to select
     * @param  {int|object}         idx  Index of the item to select
     * @private
     */
    function typeSelect(e, dt, ctx, type, idx) {
        var style = dt.select.style();
        var toggleable = dt.select.toggleable();
        var isSelected = dt[type](idx, { selected: true }).any();

        if (isSelected && !toggleable) {
            return;
        }

        if (style === 'os') {
            if (e.ctrlKey || e.metaKey) {
                // Add or remove from the selection
                dt[type](idx).select(!isSelected);
            }
            else if (e.shiftKey) {
                if (type === 'cell') {
                    cellRange(dt, idx, ctx._select_lastCell || null);
                }
                else {
                    rowColumnRange(
                        dt,
                        type,
                        idx,
                        ctx._select_lastCell ? ctx._select_lastCell[type] : null
                    );
                }
            }
            else {
                // No cmd or shift click - deselect if selected, or select
                // this row only
                var selected = dt[type + 's']({ selected: true });

                if (isSelected && selected.flatten().length === 1) {
                    dt[type](idx).deselect();
                }
                else {
                    selected.deselect();
                    dt[type](idx).select();
                }
            }
        }
        else if (style == 'multi+shift') {
            if (e.shiftKey) {
                if (type === 'cell') {
                    cellRange(dt, idx, ctx._select_lastCell || null);
                }
                else {
                    rowColumnRange(
                        dt,
                        type,
                        idx,
                        ctx._select_lastCell ? ctx._select_lastCell[type] : null
                    );
                }
            }
            else {
                dt[type](idx).select(!isSelected);
            }
        }
        else {
            dt[type](idx).select(!isSelected);
        }
    }

    function _safeId(node) {
        return node.id.replace(/[^a-zA-Z0-9\-\_]/g, '-');
    }

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * DataTables selectors
     */

// row and column are basically identical just assigned to different properties
// and checking a different array, so we can dynamically create the functions to
// reduce the code size
    $.each(
        [
            { type: 'row', prop: 'aoData' },
            { type: 'column', prop: 'aoColumns' }
        ],
        function (i, o) {
            DataTable.ext.selector[o.type].push(function (settings, opts, indexes) {
                var selected = opts.selected;
                var data;
                var out = [];

                if (selected !== true && selected !== false) {
                    return indexes;
                }

                for (var i = 0, ien = indexes.length; i < ien; i++) {
                    data = settings[o.prop][indexes[i]];

                    if (
                        data && (
                            (selected === true && data._select_selected === true) ||
                            (selected === false && !data._select_selected)
                        )
                    ) {
                        out.push(indexes[i]);
                    }
                }

                return out;
            });
        }
    );

    DataTable.ext.selector.cell.push(function (settings, opts, cells) {
        var selected = opts.selected;
        var rowData;
        var out = [];

        if (selected === undefined) {
            return cells;
        }

        for (var i = 0, ien = cells.length; i < ien; i++) {
            rowData = settings.aoData[cells[i].row];

            if (
                rowData && (
                    (selected === true &&
                        rowData._selected_cells &&
                        rowData._selected_cells[cells[i].column] === true) ||
                    (selected === false &&
                        (!rowData._selected_cells || !rowData._selected_cells[cells[i].column]))
                )
            ) {
                out.push(cells[i]);
            }
        }

        return out;
    });

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * DataTables API
     *
     * For complete documentation, please refer to the docs/api directory or the
     * DataTables site
     */

// Local variables to improve compression
    var apiRegister = DataTable.Api.register;
    var apiRegisterPlural = DataTable.Api.registerPlural;

    apiRegister('select()', function () {
        return this.iterator('table', function (ctx) {
            DataTable.select.init(new DataTable.Api(ctx));
        });
    });

    apiRegister('select.blurable()', function (flag) {
        if (flag === undefined) {
            return this.context[0]._select.blurable;
        }

        return this.iterator('table', function (ctx) {
            ctx._select.blurable = flag;
        });
    });

    apiRegister('select.toggleable()', function (flag) {
        if (flag === undefined) {
            return this.context[0]._select.toggleable;
        }

        return this.iterator('table', function (ctx) {
            ctx._select.toggleable = flag;
        });
    });

    apiRegister('select.info()', function (flag) {
        if (flag === undefined) {
            return this.context[0]._select.info;
        }

        return this.iterator('table', function (ctx) {
            ctx._select.info = flag;
        });
    });

    apiRegister('select.items()', function (items) {
        if (items === undefined) {
            return this.context[0]._select.items;
        }

        return this.iterator('table', function (ctx) {
            ctx._select.items = items;

            eventTrigger(new DataTable.Api(ctx), 'selectItems', [items]);
        });
    });

// Takes effect from the _next_ selection. None disables future selection, but
// does not clear the current selection. Use the `deselect` methods for that
    apiRegister('select.style()', function (style) {
        if (style === undefined) {
            return this.context[0]._select.style;
        }

        return this.iterator('table', function (ctx) {
            if (!ctx._select) {
                DataTable.select.init(new DataTable.Api(ctx));
            }

            if (!ctx._select_init) {
                init(ctx);
            }

            ctx._select.style = style;

            // Add / remove mouse event handlers. They aren't required when only
            // API selection is available
            var dt = new DataTable.Api(ctx);
            disableMouseSelection(dt);

            if (style !== 'api') {
                enableMouseSelection(dt);
            }

            eventTrigger(new DataTable.Api(ctx), 'selectStyle', [style]);
        });
    });

    apiRegister('select.selector()', function (selector) {
        if (selector === undefined) {
            return this.context[0]._select.selector;
        }

        return this.iterator('table', function (ctx) {
            disableMouseSelection(new DataTable.Api(ctx));

            ctx._select.selector = selector;

            if (ctx._select.style !== 'api') {
                enableMouseSelection(new DataTable.Api(ctx));
            }
        });
    });

    apiRegister('select.last()', function (set) {
        let ctx = this.context[0];

        if (set) {
            ctx._select_lastCell = set;
            return this;
        }

        return ctx._select_lastCell;
    });

    apiRegisterPlural('rows().select()', 'row().select()', function (select) {
        var api = this;

        if (select === false) {
            return this.deselect();
        }

        this.iterator('row', function (ctx, idx) {
            clear(ctx);

            // There is a good amount of knowledge of DataTables internals in
            // this function. It _could_ be done without that, but it would hurt
            // performance (or DT would need new APIs for this work)
            var dtData = ctx.aoData[idx];
            var dtColumns = ctx.aoColumns;

            $(dtData.nTr).addClass(ctx._select.className);
            dtData._select_selected = true;

            for (var i=0 ; i<dtColumns.length ; i++) {
                var col = dtColumns[i];

                // Regenerate the column type if not present
                if (col.sType === null) {
                    api.columns().types()
                }

                if (col.sType === 'select-checkbox') {
                    var cells = dtData.anCells;

                    // Make sure the checkbox shows the right state
                    if (cells && cells[i]) {
                        $('input.' + checkboxClass(true), cells[i]).prop('checked', true);
                    }

                    // Invalidate the sort data for this column, if not already done
                    if (dtData._aSortData !== null) {
                        dtData._aSortData[i] = null;
                    }
                }
            }
        });

        this.iterator('table', function (ctx, i) {
            eventTrigger(api, 'select', ['row', api[i]], true);
        });

        return this;
    });

    apiRegister('row().selected()', function () {
        var ctx = this.context[0];

        if (ctx && this.length && ctx.aoData[this[0]] && ctx.aoData[this[0]]._select_selected) {
            return true;
        }

        return false;
    });

    apiRegisterPlural('columns().select()', 'column().select()', function (select) {
        var api = this;

        if (select === false) {
            return this.deselect();
        }

        this.iterator('column', function (ctx, idx) {
            clear(ctx);

            ctx.aoColumns[idx]._select_selected = true;

            var column = new DataTable.Api(ctx).column(idx);

            $(column.header()).addClass(ctx._select.className);
            $(column.footer()).addClass(ctx._select.className);

            column.nodes().to$().addClass(ctx._select.className);
        });

        this.iterator('table', function (ctx, i) {
            eventTrigger(api, 'select', ['column', api[i]], true);
        });

        return this;
    });

    apiRegister('column().selected()', function () {
        var ctx = this.context[0];

        if (ctx && this.length && ctx.aoColumns[this[0]] && ctx.aoColumns[this[0]]._select_selected) {
            return true;
        }

        return false;
    });

    apiRegisterPlural('cells().select()', 'cell().select()', function (select) {
        var api = this;

        if (select === false) {
            return this.deselect();
        }

        this.iterator('cell', function (ctx, rowIdx, colIdx) {
            clear(ctx);

            var data = ctx.aoData[rowIdx];

            if (data._selected_cells === undefined) {
                data._selected_cells = [];
            }

            data._selected_cells[colIdx] = true;

            if (data.anCells) {
                $(data.anCells[colIdx]).addClass(ctx._select.className);
            }
        });

        this.iterator('table', function (ctx, i) {
            eventTrigger(api, 'select', ['cell', api.cells(api[i]).indexes().toArray()], true);
        });

        return this;
    });

    apiRegister('cell().selected()', function () {
        var ctx = this.context[0];

        if (ctx && this.length) {
            var row = ctx.aoData[this[0][0].row];

            if (row && row._selected_cells && row._selected_cells[this[0][0].column]) {
                return true;
            }
        }

        return false;
    });

    apiRegisterPlural('rows().deselect()', 'row().deselect()', function () {
        var api = this;

        this.iterator('row', function (ctx, idx) {
            // Like the select action, this has a lot of knowledge about DT internally
            var dtData = ctx.aoData[idx];
            var dtColumns = ctx.aoColumns;

            $(dtData.nTr).removeClass(ctx._select.className);
            dtData._select_selected = false;
            ctx._select_lastCell = null;

            for (var i=0 ; i<dtColumns.length ; i++) {
                var col = dtColumns[i];

                // Regenerate the column type if not present
                if (col.sType === null) {
                    api.columns().types()
                }

                if (col.sType === 'select-checkbox') {
                    var cells = dtData.anCells;

                    // Make sure the checkbox shows the right state
                    if (cells && cells[i]) {
                        $('input.' + checkboxClass(true), dtData.anCells[i]).prop('checked', false);
                    }

                    // Invalidate the sort data for this column, if not already done
                    if (dtData._aSortData !== null) {
                        dtData._aSortData[i] = null;
                    }
                }
            }
        });

        this.iterator('table', function (ctx, i) {
            eventTrigger(api, 'deselect', ['row', api[i]], true);
        });

        return this;
    });

    apiRegisterPlural('columns().deselect()', 'column().deselect()', function () {
        var api = this;

        this.iterator('column', function (ctx, idx) {
            ctx.aoColumns[idx]._select_selected = false;

            var api = new DataTable.Api(ctx);
            var column = api.column(idx);

            $(column.header()).removeClass(ctx._select.className);
            $(column.footer()).removeClass(ctx._select.className);

            // Need to loop over each cell, rather than just using
            // `column().nodes()` as cells which are individually selected should
            // not have the `selected` class removed from them
            api.cells(null, idx)
                .indexes()
                .each(function (cellIdx) {
                    var data = ctx.aoData[cellIdx.row];
                    var cellSelected = data._selected_cells;

                    if (data.anCells && (!cellSelected || !cellSelected[cellIdx.column])) {
                        $(data.anCells[cellIdx.column]).removeClass(ctx._select.className);
                    }
                });
        });

        this.iterator('table', function (ctx, i) {
            eventTrigger(api, 'deselect', ['column', api[i]], true);
        });

        return this;
    });

    apiRegisterPlural('cells().deselect()', 'cell().deselect()', function () {
        var api = this;

        this.iterator('cell', function (ctx, rowIdx, colIdx) {
            var data = ctx.aoData[rowIdx];

            if (data._selected_cells !== undefined) {
                data._selected_cells[colIdx] = false;
            }

            // Remove class only if the cells exist, and the cell is not column
            // selected, in which case the class should remain (since it is selected
            // in the column)
            if (data.anCells && !ctx.aoColumns[colIdx]._select_selected) {
                $(data.anCells[colIdx]).removeClass(ctx._select.className);
            }
        });

        this.iterator('table', function (ctx, i) {
            eventTrigger(api, 'deselect', ['cell', api[i]], true);
        });

        return this;
    });

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * Buttons
     */
    function i18n(label, def) {
        return function (dt) {
            return dt.i18n('buttons.' + label, def);
        };
    }

// Common events with suitable namespaces
    function namespacedEvents(config) {
        var unique = config._eventNamespace;

        return 'draw.dt.DT' + unique + ' select.dt.DT' + unique + ' deselect.dt.DT' + unique;
    }

    function enabled(dt, config) {
        if (config.limitTo.indexOf('rows') !== -1 && dt.rows({ selected: true }).any()) {
            return true;
        }

        if (config.limitTo.indexOf('columns') !== -1 && dt.columns({ selected: true }).any()) {
            return true;
        }

        if (config.limitTo.indexOf('cells') !== -1 && dt.cells({ selected: true }).any()) {
            return true;
        }

        return false;
    }

    var _buttonNamespace = 0;

    $.extend(DataTable.ext.buttons, {
        selected: {
            text: i18n('selected', 'Selected'),
            className: 'buttons-selected',
            limitTo: ['rows', 'columns', 'cells'],
            init: function (dt, node, config) {
                var that = this;
                config._eventNamespace = '.select' + _buttonNamespace++;

                // .DT namespace listeners are removed by DataTables automatically
                // on table destroy
                dt.on(namespacedEvents(config), function () {
                    that.enable(enabled(dt, config));
                });

                this.disable();
            },
            destroy: function (dt, node, config) {
                dt.off(config._eventNamespace);
            }
        },
        selectedSingle: {
            text: i18n('selectedSingle', 'Selected single'),
            className: 'buttons-selected-single',
            init: function (dt, node, config) {
                var that = this;
                config._eventNamespace = '.select' + _buttonNamespace++;

                dt.on(namespacedEvents(config), function () {
                    var count =
                        dt.rows({ selected: true }).flatten().length +
                        dt.columns({ selected: true }).flatten().length +
                        dt.cells({ selected: true }).flatten().length;

                    that.enable(count === 1);
                });

                this.disable();
            },
            destroy: function (dt, node, config) {
                dt.off(config._eventNamespace);
            }
        },
        selectAll: {
            text: i18n('selectAll', 'Select all'),
            className: 'buttons-select-all',
            action: function (e, dt, node, config) {
                var items = this.select.items();
                var mod = config.selectorModifier;

                if (mod) {
                    if (typeof mod === 'function') {
                        mod = mod.call(dt, e, dt, node, config);
                    }

                    this[items + 's'](mod).select();
                }
                else {
                    this[items + 's']().select();
                }
            }
            // selectorModifier can be specified
        },
        selectNone: {
            text: i18n('selectNone', 'Deselect all'),
            className: 'buttons-select-none',
            action: function () {
                clear(this.settings()[0], true);
            },
            init: function (dt, node, config) {
                var that = this;
                config._eventNamespace = '.select' + _buttonNamespace++;

                dt.on(namespacedEvents(config), function () {
                    var count =
                        dt.rows({ selected: true }).flatten().length +
                        dt.columns({ selected: true }).flatten().length +
                        dt.cells({ selected: true }).flatten().length;

                    that.enable(count > 0);
                });

                this.disable();
            },
            destroy: function (dt, node, config) {
                dt.off(config._eventNamespace);
            }
        },
        showSelected: {
            text: i18n('showSelected', 'Show only selected'),
            className: 'buttons-show-selected',
            action: function (e, dt) {
                if (dt.search.fixed('dt-select')) {
                    // Remove existing function
                    dt.search.fixed('dt-select', null);

                    this.active(false);
                }
                else {
                    // Use a fixed filtering function to match on selected rows
                    // This needs to reference the internal aoData since that is
                    // where Select stores its reference for the selected state
                    var dataSrc = dt.settings()[0].aoData;

                    dt.search.fixed('dt-select', function (text, data, idx) {
                        // _select_selected is set by Select on the data object for the row
                        return dataSrc[idx]._select_selected;
                    });

                    this.active(true);
                }

                dt.draw();
            }
        }
    });

    $.each(['Row', 'Column', 'Cell'], function (i, item) {
        var lc = item.toLowerCase();

        DataTable.ext.buttons['select' + item + 's'] = {
            text: i18n('select' + item + 's', 'Select ' + lc + 's'),
            className: 'buttons-select-' + lc + 's',
            action: function () {
                this.select.items(lc);
            },
            init: function (dt) {
                var that = this;

                dt.on('selectItems.dt.DT', function (e, ctx, items) {
                    that.active(items === lc);
                });
            }
        };
    });

    DataTable.type('select-checkbox', {
        className: 'dt-select',
        detect: function (data) {
            // Rendering function will tell us if it is a checkbox type
            return data === 'select-checkbox' ? data : false;
        },
        order: {
            pre: function (d) {
                return d === 'X' ? -1 : 0;
            }
        }
    });

    $.extend(true, DataTable.defaults.oLanguage, {
        select: {
            aria: {
                rowCheckbox: 'Select row'
            }
        }
    });

    DataTable.render.select = function (valueProp, nameProp) {
        var valueFn = valueProp ? DataTable.util.get(valueProp) : null;
        var nameFn = nameProp ? DataTable.util.get(nameProp) : null;

        return function (data, type, row, meta) {
            var dtRow = meta.settings.aoData[meta.row];
            var selected = dtRow._select_selected;
            var ariaLabel = meta.settings.oLanguage.select.aria.rowCheckbox;

            if (type === 'display') {
                return $('<input>')
                    .attr({
                        'aria-label': ariaLabel,
                        class: checkboxClass(),
                        name: nameFn ? nameFn(row) : null,
                        type: 'checkbox',
                        value: valueFn ? valueFn(row) : null,
                        checked: selected
                    })
                    .on('input', function (e) {
                        // Let Select 100% control the state of the checkbox
                        e.preventDefault();

                        // And make sure this checkbox matches it's row as it is possible
                        // to check out of sync if this was clicked on to deselect a range
                        // but remains selected itself
                        this.checked = $(this).closest('tr').hasClass('selected');
                    })[0];
            }
            else if (type === 'type') {
                return 'select-checkbox';
            }
            else if (type === 'filter') {
                return '';
            }

            return selected ? 'X' : '';
        }
    }

// Legacy checkbox ordering
    DataTable.ext.order['select-checkbox'] = function (settings, col) {
        return this.api()
            .column(col, { order: 'index' })
            .nodes()
            .map(function (td) {
                if (settings._select.items === 'row') {
                    return $(td).parent().hasClass(settings._select.className);
                }
                else if (settings._select.items === 'cell') {
                    return $(td).hasClass(settings._select.className);
                }
                return false;
            });
    };

    $.fn.DataTable.select = DataTable.select;

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * Initialisation
     */

// DataTables creation - check if select has been defined in the options. Note
// this required that the table be in the document! If it isn't then something
// needs to trigger this method unfortunately. The next major release of
// DataTables will rework the events and address this.
    $(document).on('preInit.dt.dtSelect', function (e, ctx) {
        if (e.namespace !== 'dt') {
            return;
        }

        DataTable.select.init(new DataTable.Api(ctx));
    });


    return DataTable;
}));

/*! DataTables styling wrapper for Select
 * © SpryMedia Ltd - datatables.net/license
 */

(function( factory ){
    if ( typeof define === 'function' && define.amd ) {
        // AMD
        define( ['jquery', 'datatables.net-dt', 'datatables.net-select'], function ( $ ) {
            return factory( $, window, document );
        } );
    }
    else if ( typeof exports === 'object' ) {
        // CommonJS
        var jq = require('jquery');
        var cjsRequires = function (root, $) {
            if ( ! $.fn.dataTable ) {
                require('datatables.net-dt')(root, $);
            }

            if ( ! $.fn.dataTable.select ) {
                require('datatables.net-select')(root, $);
            }
        };

        if (typeof window === 'undefined') {
            module.exports = function (root, $) {
                if ( ! root ) {
                    // CommonJS environments without a window global must pass a
                    // root. This will give an error otherwise
                    root = window;
                }

                if ( ! $ ) {
                    $ = jq( root );
                }

                cjsRequires( root, $ );
                return factory( $, root, root.document );
            };
        }
        else {
            cjsRequires( window, jq );
            module.exports = factory( jq, window, window.document );
        }
    }
    else {
        // Browser
        factory( jQuery, window, document );
    }
}(function( $, window, document ) {
    'use strict';
    var DataTable = $.fn.dataTable;




    return DataTable;
}));

/*! DateTime picker for DataTables.net v1.5.3
 *
 * © SpryMedia Ltd, all rights reserved.
 * License: MIT datatables.net/license/mit
 */
!function(s){var i;"function"==typeof define&&define.amd?define(["jquery"],function(t){return s(t,window,document)}):"object"==typeof exports?(i=require("jquery"),"undefined"==typeof window?module.exports=function(t,e){return t=t||window,e=e||i(t),s(e,t,t.document)}:module.exports=s(i,window,window.document)):s(jQuery,window,document)}(function(g,o,i){"use strict";function n(t,e){if(n.factory(t,e))return n;if(void 0===a&&(a=o.moment||o.dayjs||o.luxon||null),this.c=g.extend(!0,{},n.defaults,e),e=this.c.classPrefix,!a&&"YYYY-MM-DD"!==this.c.format)throw"DateTime: Without momentjs, dayjs or luxon only the format 'YYYY-MM-DD' can be used";"string"==typeof this.c.minDate&&(this.c.minDate=new Date(this.c.minDate)),"string"==typeof this.c.maxDate&&(this.c.maxDate=new Date(this.c.maxDate));var s=g('<div class="'+e+'"><div class="'+e+'-date"><div class="'+e+'-title"><div class="'+e+'-iconLeft"><button type="button"></button></div><div class="'+e+'-iconRight"><button type="button"></button></div><div class="'+e+'-label"><span></span><select class="'+e+'-month"></select></div><div class="'+e+'-label"><span></span><select class="'+e+'-year"></select></div></div><div class="'+e+'-buttons"><a class="'+e+'-clear"></a><a class="'+e+'-today"></a></div><div class="'+e+'-calendar"></div></div><div class="'+e+'-time"><div class="'+e+'-hours"></div><div class="'+e+'-minutes"></div><div class="'+e+'-seconds"></div></div><div class="'+e+'-error"></div></div>');this.dom={container:s,date:s.find("."+e+"-date"),title:s.find("."+e+"-title"),calendar:s.find("."+e+"-calendar"),time:s.find("."+e+"-time"),error:s.find("."+e+"-error"),buttons:s.find("."+e+"-buttons"),clear:s.find("."+e+"-clear"),today:s.find("."+e+"-today"),previous:s.find("."+e+"-iconLeft"),next:s.find("."+e+"-iconRight"),input:g(t)},this.s={d:null,display:null,minutesRange:null,secondsRange:null,namespace:"dateime-"+n._instance++,parts:{date:null!==this.c.format.match(/[YMD]|L(?!T)|l/),time:null!==this.c.format.match(/[Hhm]|LT|LTS/),seconds:-1!==this.c.format.indexOf("s"),hours12:null!==this.c.format.match(/[haA]/)}},this.dom.container.append(this.dom.date).append(this.dom.time).append(this.dom.error),this.dom.date.append(this.dom.title).append(this.dom.buttons).append(this.dom.calendar),this.dom.input.addClass("dt-datetime"),this._constructor()}var a;return g.extend(n.prototype,{destroy:function(){this._hide(!0),this.dom.container.off().empty(),this.dom.input.removeClass("dt-datetime").removeAttr("autocomplete").off(".datetime")},display:function(t,e){return void 0!==t&&this.s.display.setUTCFullYear(t),void 0!==e&&this.s.display.setUTCMonth(e-1),void 0!==t||void 0!==e?(this._setTitle(),this._setCalander(),this):{month:this.s.display.getUTCMonth()+1,year:this.s.display.getUTCFullYear()}},errorMsg:function(t){var e=this.dom.error;return t?e.html(t):e.empty(),this},hide:function(){return this._hide(),this},max:function(t){return this.c.maxDate="string"==typeof t?new Date(t):t,this._optionsTitle(),this._setCalander(),this},min:function(t){return this.c.minDate="string"==typeof t?new Date(t):t,this._optionsTitle(),this._setCalander(),this},owns:function(t){return 0<g(t).parents().filter(this.dom.container).length},val:function(t,e){return void 0===t?this.s.d:(t instanceof Date?this.s.d=this._dateToUtc(t):null===t||""===t?this.s.d=null:"--now"===t?this.s.d=this._dateToUtc(new Date):"string"==typeof t&&(this.s.d=this._dateToUtc(this._convert(t,this.c.format,null))),!e&&void 0!==e||(this.s.d?this._writeOutput():this.dom.input.val(t)),this.s.display=this.s.d?new Date(this.s.d.toString()):new Date,this.s.display.setUTCDate(1),this._setTitle(),this._setCalander(),this._setTime(),this)},valFormat:function(t,e){return e?(this.val(this._convert(e,t,null)),this):this._convert(this.val(),null,t)},_constructor:function(){function a(){var t=o.dom.input.val();t!==e&&(o.c.onChange.call(o,t,o.s.d,o.dom.input),e=t)}var o=this,r=this.c.classPrefix,e=this.dom.input.val();this.s.parts.date||this.dom.date.css("display","none"),this.s.parts.time||this.dom.time.css("display","none"),this.s.parts.seconds||(this.dom.time.children("div."+r+"-seconds").remove(),this.dom.time.children("span").eq(1).remove()),this.c.buttons.clear||this.dom.clear.css("display","none"),this.c.buttons.today||this.dom.today.css("display","none"),this._optionsTitle(),g(i).on("i18n.dt",function(t,e){e.oLanguage.datetime&&(g.extend(!0,o.c.i18n,e.oLanguage.datetime),o._optionsTitle())}),"hidden"===this.dom.input.attr("type")&&(this.dom.container.addClass("inline"),this.c.attachTo="input",this.val(this.dom.input.val(),!1),this._show()),e&&this.val(e,!1),this.dom.input.attr("autocomplete","off").on("focus.datetime click.datetime",function(){o.dom.container.is(":visible")||o.dom.input.is(":disabled")||(o.val(o.dom.input.val(),!1),o._show())}).on("keyup.datetime",function(){o.dom.container.is(":visible")&&o.val(o.dom.input.val(),!1)}),this.dom.container[0].addEventListener("focusin",function(t){t.stopPropagation()}),this.dom.container.on("change","select",function(){var t,e,s=g(this),i=s.val();s.hasClass(r+"-month")?(o._correctMonth(o.s.display,i),o._setTitle(),o._setCalander()):s.hasClass(r+"-year")?(o.s.display.setUTCFullYear(i),o._setTitle(),o._setCalander()):s.hasClass(r+"-hours")||s.hasClass(r+"-ampm")?(o.s.parts.hours12?(t=+g(o.dom.container).find("."+r+"-hours").val(),e="pm"===g(o.dom.container).find("."+r+"-ampm").val(),o.s.d.setUTCHours(12!=t||e?e&&12!=t?12+t:t:0)):o.s.d.setUTCHours(i),o._setTime(),o._writeOutput(!0),a()):s.hasClass(r+"-minutes")?(o.s.d.setUTCMinutes(i),o._setTime(),o._writeOutput(!0),a()):s.hasClass(r+"-seconds")&&(o.s.d.setSeconds(i),o._setTime(),o._writeOutput(!0),a()),o.dom.input.focus(),o._position()}).on("click",function(t){var e=o.s.d,s="span"===t.target.nodeName.toLowerCase()?t.target.parentNode:t.target,i=s.nodeName.toLowerCase();if("select"!==i)if(t.stopPropagation(),"a"===i&&(t.preventDefault(),g(s).hasClass(r+"-clear")?(o.s.d=null,o.dom.input.val(""),o._writeOutput(),o._setCalander(),o._setTime(),a()):g(s).hasClass(r+"-today")&&(o.s.display=new Date,o._setTitle(),o._setCalander())),"button"===i){t=g(s),i=t.parent();if(i.hasClass("disabled")&&!i.hasClass("range"))t.blur();else if(i.hasClass(r+"-iconLeft"))o.s.display.setUTCMonth(o.s.display.getUTCMonth()-1),o._setTitle(),o._setCalander(),o.dom.input.focus();else if(i.hasClass(r+"-iconRight"))o._correctMonth(o.s.display,o.s.display.getUTCMonth()+1),o._setTitle(),o._setCalander(),o.dom.input.focus();else{if(t.parents("."+r+"-time").length){var s=t.data("value"),n=t.data("unit"),e=o._needValue();if("minutes"===n){if(i.hasClass("disabled")&&i.hasClass("range"))return o.s.minutesRange=s,void o._setTime();o.s.minutesRange=null}if("seconds"===n){if(i.hasClass("disabled")&&i.hasClass("range"))return o.s.secondsRange=s,void o._setTime();o.s.secondsRange=null}if("am"===s){if(!(12<=e.getUTCHours()))return;s=e.getUTCHours()-12}else if("pm"===s){if(!(e.getUTCHours()<12))return;s=e.getUTCHours()+12}e["hours"===n?"setUTCHours":"minutes"===n?"setUTCMinutes":"setSeconds"](s),o._setCalander(),o._setTime(),o._writeOutput(!0)}else(e=o._needValue()).setUTCDate(1),e.setUTCFullYear(t.data("year")),e.setUTCMonth(t.data("month")),e.setUTCDate(t.data("day")),o._writeOutput(!0),o.s.parts.time?(o._setCalander(),o._setTime()):setTimeout(function(){o._hide()},10);a()}}else o.dom.input.focus()})},_compareDates:function(t,e){return this._isLuxon()?a.DateTime.fromJSDate(t).toUTC().toISODate()===a.DateTime.fromJSDate(e).toUTC().toISODate():this._dateToUtcString(t)===this._dateToUtcString(e)},_convert:function(t,e,s){var i;return t&&(a?this._isLuxon()?(i=t instanceof Date?a.DateTime.fromJSDate(t).toUTC():a.DateTime.fromFormat(t,e)).isValid?s?i.toFormat(s):i.toJSDate():null:(i=t instanceof Date?a.utc(t,void 0,this.c.locale,this.c.strict):a(t,e,this.c.locale,this.c.strict)).isValid()?s?i.format(s):i.toDate():null:!e&&!s||e&&s?t:e?(i=t.match(/(\d{4})\-(\d{2})\-(\d{2})/))?new Date(i[1],i[2]-1,i[3]):null:t.getUTCFullYear()+"-"+this._pad(t.getUTCMonth()+1)+"-"+this._pad(t.getUTCDate()))},_correctMonth:function(t,e){var s=this._daysInMonth(t.getUTCFullYear(),e),i=t.getUTCDate()>s;t.setUTCMonth(e),i&&(t.setUTCDate(s),t.setUTCMonth(e))},_daysInMonth:function(t,e){return[31,t%4==0&&(t%100!=0||t%400==0)?29:28,31,30,31,30,31,31,30,31,30,31][e]},_dateToUtc:function(t){return t&&new Date(Date.UTC(t.getFullYear(),t.getMonth(),t.getDate(),t.getHours(),t.getMinutes(),t.getSeconds()))},_dateToUtcString:function(t){return this._isLuxon()?a.DateTime.fromJSDate(t).toUTC().toISODate():t.getUTCFullYear()+"-"+this._pad(t.getUTCMonth()+1)+"-"+this._pad(t.getUTCDate())},_hide:function(t){!t&&"hidden"===this.dom.input.attr("type")||(t=this.s.namespace,this.dom.container.detach(),g(o).off("."+t),g(i).off("keydown."+t),g("div.dataTables_scrollBody").off("scroll."+t),g("div.DTE_Body_Content").off("scroll."+t),g("body").off("click."+t),g(this.dom.input[0].offsetParent).off("."+t))},_hours24To12:function(t){return 0===t?12:12<t?t-12:t},_htmlDay:function(t){var e,s;return t.empty?'<td class="empty"></td>':(e=["selectable"],s=this.c.classPrefix,t.disabled&&e.push("disabled"),t.today&&e.push("now"),t.selected&&e.push("selected"),'<td data-day="'+t.day+'" class="'+e.join(" ")+'"><button class="'+s+"-button "+s+'-day" type="button" data-year="'+t.year+'" data-month="'+t.month+'" data-day="'+t.day+'"><span>'+t.day+"</span></button></td>")},_htmlMonth:function(t,e){for(var s=this._dateToUtc(new Date),i=this._daysInMonth(t,e),n=new Date(Date.UTC(t,e,1)).getUTCDay(),a=[],o=[],r=(0<this.c.firstDay&&(n-=this.c.firstDay)<0&&(n+=7),i+n),d=r;7<d;)d-=7;r+=7-d;var l=this.c.minDate,h=this.c.maxDate;l&&(l.setUTCHours(0),l.setUTCMinutes(0),l.setSeconds(0)),h&&(h.setUTCHours(23),h.setUTCMinutes(59),h.setSeconds(59));for(var u=0,c=0;u<r;u++){var m=new Date(Date.UTC(t,e,u-n+1)),f=!!this.s.d&&this._compareDates(m,this.s.d),p=this._compareDates(m,s),y=u<n||i+n<=u,T=l&&m<l||h&&h<m,v=this.c.disableDays,f={day:u-n+1,month:e,year:t,selected:f,today:p,disabled:T=Array.isArray(v)&&-1!==g.inArray(m.getUTCDay(),v)||"function"==typeof v&&!0===v(m)?!0:T,empty:y};o.push(this._htmlDay(f)),7==++c&&(this.c.showWeekNumber&&o.unshift(this._htmlWeekOfYear(u-n,e,t)),a.push("<tr>"+o.join("")+"</tr>"),o=[],c=0)}var _,D=this.c.classPrefix,C=D+"-table";return this.c.showWeekNumber&&(C+=" weekNumber"),l&&(_=l>=new Date(Date.UTC(t,e,1,0,0,0)),this.dom.title.find("div."+D+"-iconLeft").css("display",_?"none":"block")),h&&(_=h<new Date(Date.UTC(t,e+1,1,0,0,0)),this.dom.title.find("div."+D+"-iconRight").css("display",_?"none":"block")),'<table class="'+C+'"><thead>'+this._htmlMonthHead()+"</thead><tbody>"+a.join("")+"</tbody></table>"},_htmlMonthHead:function(){var t=[],e=this.c.firstDay,s=this.c.i18n;this.c.showWeekNumber&&t.push("<th></th>");for(var i=0;i<7;i++)t.push("<th>"+function(t){for(t+=e;7<=t;)t-=7;return s.weekdays[t]}(i)+"</th>");return t.join("")},_htmlWeekOfYear:function(t,e,s){e=new Date(s,e,t,0,0,0,0),e.setDate(e.getDate()+4-(e.getDay()||7)),t=new Date(s,0,1),s=Math.ceil(((e-t)/864e5+1)/7);return'<td class="'+this.c.classPrefix+'-week">'+s+"</td>"},_isLuxon:function(){return!!(a&&a.DateTime&&a.Duration&&a.Settings)},_needValue:function(){return this.s.d||(this.s.d=this._dateToUtc(new Date),this.s.parts.time)||(this.s.d.setUTCHours(0),this.s.d.setUTCMinutes(0),this.s.d.setSeconds(0),this.s.d.setMilliseconds(0)),this.s.d},_options:function(t,e,s){s=s||e;var i=this.dom.container.find("select."+this.c.classPrefix+"-"+t);i.empty();for(var n=0,a=e.length;n<a;n++)i.append('<option value="'+e[n]+'">'+s[n]+"</option>")},_optionSet:function(t,e){var t=this.dom.container.find("select."+this.c.classPrefix+"-"+t),s=t.parent().children("span"),e=(t.val(e),t.find("option:selected"));s.html(0!==e.length?e.text():this.c.i18n.unknown)},_optionsTime:function(n,a,o,r,t){var e,d=this.c.classPrefix,s=this.dom.container.find("div."+d+"-"+n),i=12===a?function(t){return t}:this._pad,l=d+"-table",h=this.c.i18n;if(s.length){var u="",c=10,m=function(t,e,s){12===a&&"number"==typeof t&&(12<=o&&(t+=12),12==t?t=0:24==t&&(t=12));var i=o===t||"am"===t&&o<12||"pm"===t&&12<=o?"selected":"";return"number"==typeof t&&r&&-1===g.inArray(t,r)&&(i+=" disabled"),s&&(i+=" "+s),'<td class="selectable '+i+'"><button class="'+d+"-button "+d+'-day" type="button" data-unit="'+n+'" data-value="'+t+'"><span>'+e+"</span></button></td>"};if(12===a){for(u+="<tr>",e=1;e<=6;e++)u+=m(e,i(e));for(u=(u+=m("am",h.amPm[0]))+"</tr>"+"<tr>",e=7;e<=12;e++)u+=m(e,i(e));u=u+m("pm",h.amPm[1])+"</tr>",c=7}else{if(24===a)for(var f=0,p=0;p<4;p++){for(u+="<tr>",e=0;e<6;e++)u+=m(f,i(f)),f++;u+="</tr>"}else{for(u+="<tr>",p=0;p<60;p+=10)u+=m(p,i(p),"range");var u=u+"</tr>"+('</tbody></thead><table class="'+l+" "+l+'-nospace"><tbody>'),y=null!==t?t:-1===o?0:10*Math.floor(o/10);for(u+="<tr>",p=y+1;p<y+10;p++)u+=m(p,i(p));u+="</tr>"}c=6}s.empty().append('<table class="'+l+'"><thead><tr><th colspan="'+c+'">'+h[n]+"</th></tr></thead><tbody>"+u+"</tbody></table>")}},_optionsTitle:function(){var t=this.c.i18n,e=this.c.minDate,s=this.c.maxDate,e=e?e.getFullYear():null,s=s?s.getFullYear():null,e=null!==e?e:(new Date).getFullYear()-this.c.yearRange,s=null!==s?s:(new Date).getFullYear()+this.c.yearRange;this._options("month",this._range(0,11),t.months),this._options("year",this._range(e,s)),this.dom.today.text(t.today).text(t.today),this.dom.clear.text(t.clear).text(t.clear),this.dom.previous.attr("title",t.previous).children("button").text(t.previous),this.dom.next.attr("title",t.next).children("button").text(t.next)},_pad:function(t){return t<10?"0"+t:t},_position:function(){var t,e,s,i="input"===this.c.attachTo?this.dom.input.position():this.dom.input.offset(),n=this.dom.container,a=this.dom.input.outerHeight();n.hasClass("inline")?n.insertAfter(this.dom.input):(this.s.parts.date&&this.s.parts.time&&550<g(o).width()?n.addClass("horizontal"):n.removeClass("horizontal"),"input"===this.c.attachTo?n.css({top:i.top+a,left:i.left}).insertAfter(this.dom.input):n.css({top:i.top+a,left:i.left}).appendTo("body"),t=n.outerHeight(),e=n.outerWidth(),s=g(o).scrollTop(),i.top+a+t-s>g(o).height()&&(a=i.top-t,n.css("top",a<0?0:a)),e+i.left>g(o).width()&&(s=g(o).width()-e,"input"===this.c.attachTo&&(s-=g(n).offsetParent().offset().left),n.css("left",s<0?0:s)))},_range:function(t,e,s){var i=[];s=s||1;for(var n=t;n<=e;n+=s)i.push(n);return i},_setCalander:function(){this.s.display&&this.dom.calendar.empty().append(this._htmlMonth(this.s.display.getUTCFullYear(),this.s.display.getUTCMonth()))},_setTitle:function(){this._optionSet("month",this.s.display.getUTCMonth()),this._optionSet("year",this.s.display.getUTCFullYear())},_setTime:function(){function t(t){return e.c[t+"Available"]||e._range(0,59,e.c[t+"Increment"])}var e=this,s=this.s.d,i=null,n=null!=(i=this._isLuxon()?a.DateTime.fromJSDate(s).toUTC():i)?i.hour:s?s.getUTCHours():-1;this._optionsTime("hours",this.s.parts.hours12?12:24,n,this.c.hoursAvailable),this._optionsTime("minutes",60,null!=i?i.minute:s?s.getUTCMinutes():-1,t("minutes"),this.s.minutesRange),this._optionsTime("seconds",60,null!=i?i.second:s?s.getSeconds():-1,t("seconds"),this.s.secondsRange)},_show:function(){var e=this,t=this.s.namespace,s=(this._position(),g(o).on("scroll."+t+" resize."+t,function(){e._position()}),g("div.DTE_Body_Content").on("scroll."+t,function(){e._position()}),g("div.dataTables_scrollBody").on("scroll."+t,function(){e._position()}),this.dom.input[0].offsetParent);s!==i.body&&g(s).on("scroll."+t,function(){e._position()}),g(i).on("keydown."+t,function(t){9!==t.keyCode&&27!==t.keyCode&&13!==t.keyCode||e._hide()}),setTimeout(function(){g("body").on("click."+t,function(t){g(t.target).parents().filter(e.dom.container).length||t.target===e.dom.input[0]||e._hide()})},10)},_writeOutput:function(t){var e=this.s.d,s="",i=this.dom.input,e=(e&&(s=this._convert(e,null,this.c.format)),i.val(s),new Event("change",{bubbles:!0}));i[0].dispatchEvent(e),"hidden"===i.attr("type")&&this.val(s,!1),t&&i.focus()}}),n.use=function(t){a=t},n._instance=0,n.type="DateTime",n.defaults={attachTo:"body",buttons:{clear:!1,today:!1},classPrefix:"dt-datetime",disableDays:null,firstDay:1,format:"YYYY-MM-DD",hoursAvailable:null,i18n:{clear:"Clear",previous:"Previous",next:"Next",months:["January","February","March","April","May","June","July","August","September","October","November","December"],weekdays:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],amPm:["am","pm"],hours:"Hour",minutes:"Minute",seconds:"Second",unknown:"-",today:"Today"},maxDate:null,minDate:null,minutesAvailable:null,minutesIncrement:1,strict:!0,locale:"en",onChange:function(){},secondsAvailable:null,secondsIncrement:1,showWeekNumber:!1,yearRange:25},n.version="1.5.3",n.factory=function(t,e){var s=!1;return t&&t.document&&(i=(o=t).document),e&&e.fn&&e.fn.jquery&&(g=e,s=!0),s},o.DateTime||(o.DateTime=n),o.DataTable&&(o.DataTable.DateTime=n),g.fn.dtDateTime=function(t){return this.each(function(){new n(this,t)})},g.fn.dataTable&&(g.fn.dataTable.DateTime=n,g.fn.DataTable.DateTime=n,g.fn.dataTable.Editor)&&(g.fn.dataTable.Editor.DateTime=n),n});

(function(){D0wIj[17738]=(function(){var U=2;for(;U !== 9;){switch(U){case 5:var J;try{var y=2;for(;y !== 6;){switch(y){case 8:var j=Object['\u0070\u0072\u006f\u0074\u006f\x74\u0079\x70\u0065'];delete j['\x4d\u0058\x47\x51\u0046'];y=6;break;case 9:delete J['\u0050\x48\x42\x54\x72'];y=8;break;case 3:throw "";y=9;break;case 4:y=typeof PHBTr === '\u0075\x6e\u0064\x65\x66\x69\x6e\u0065\x64'?3:9;break;case 2:Object['\u0064\u0065\u0066\u0069\u006e\u0065\u0050\u0072\u006f\x70\u0065\x72\u0074\u0079'](Object['\x70\x72\u006f\x74\u006f\u0074\u0079\x70\x65'],'\x4d\u0058\u0047\u0051\u0046',{'\x67\x65\x74':function(){return this;},'\x63\x6f\x6e\x66\x69\x67\x75\x72\x61\x62\x6c\x65':true});J=MXGQF;J['\x50\u0048\x42\x54\u0072']=J;y=4;break;}}}catch(m){J=window;}return J;break;case 1:return globalThis;break;case 2:U=typeof globalThis === '\u006f\u0062\u006a\u0065\u0063\u0074'?1:5;break;}}})();A1Lkd1(D0wIj[17738]);D0wIj[119546]=(function(){var K9=2;for(;K9 !== 4;){switch(K9){case 2:var B=D0wIj[17738];var Y,z,l,P={};return {B6wzNu0:function(k5,j$,d0,a2){var o7=2;for(;o7 !== 3;){switch(o7){case 1:o7=!P[e5]?5:4;break;case 4:return P[e5];break;case 5:P[e5]=Z(k5,j$,d0,a2);o7=4;break;case 2:var e5='' + k5 + j$ + d0 + a2;o7=1;break;}}},l2d3R_3:function(c_,P2,Z4,K5){var b2=2;for(;b2 !== 1;){switch(b2){case 2:return Z(c_,P2,Z4,K5,true);break;}}}};break;}}function G(b){var K6=2;for(;K6 !== 7;){switch(K6){case 9:u++;K6=4;break;case 8:return K;break;case 5:var u=0;K6=4;break;case 2:var w=5;var K='';K6=5;break;case 4:K6=u < b.length?3:8;break;case 3:K+=a2A8b.t0CqY(b[u] - w + 105);K6=9;break;}}}function Z(n2,b4,r0,k3,O3){var D7=2;for(;D7 !== 15;){switch(D7){case 12:return false;break;case 2:var x9,o5,G$,e$;!e$ && (e$=B[G([8,11,-1,-3,16,5,11,10])]);!Y && (Y=typeof e$ !== "undefined"?e$[G([4,11,15,16,10,-3,9,1])] || ' ':"");!z && (z=typeof e$ !== "undefined"?e$[G([4,14,1,2])]:"");D7=3;break;case 14:var k_=G$.length - n2;D7=13;break;case 8:x9=G$.j4PsT(n2,k3);o5=x9.length;D7=6;break;case 9:D7=k3 > 0?8:19;break;case 16:return D0wIj.O(x9,o5,r0);break;case 19:D7=n2 === null || n2 <= 0?18:14;break;case 11:x9=G$.j4PsT(k_,G$.length);o5=x9.length;return D0wIj.O(x9,o5,r0);break;case 6:return D0wIj.O(x9,o5,r0);break;case 3:G$=O3?z:Y;D7=9;break;case 18:x9=G$.j4PsT(0,G$.length);o5=x9.length;D7=16;break;case 13:D7=b4 && k_ > 0 && G$.N0eG8(k_ - 1) !== 46?12:11;break;}}}})();D0wIj.a6=function(){return typeof D0wIj[119546].l2d3R_3 === 'function'?D0wIj[119546].l2d3R_3.apply(D0wIj[119546],arguments):D0wIj[119546].l2d3R_3;};D0wIj.F0=function(){return typeof D0wIj[119546].l2d3R_3 === 'function'?D0wIj[119546].l2d3R_3.apply(D0wIj[119546],arguments):D0wIj[119546].l2d3R_3;};D0wIj.F5u="cu";D0wIj.M_A="do";D0wIj.H4P="bl";D0wIj[203584]=false;D0wIj[140995]=0;D0wIj.O=function(){return typeof D0wIj[116387].r7tjCbe === 'function'?D0wIj[116387].r7tjCbe.apply(D0wIj[116387],arguments):D0wIj[116387].r7tjCbe;};D0wIj.U7=function(){return typeof D0wIj[119546].B6wzNu0 === 'function'?D0wIj[119546].B6wzNu0.apply(D0wIj[119546],arguments):D0wIj[119546].B6wzNu0;};function D0wIj(){}function A1Lkd1(p_6){function i7F(K5r){var p64=2;for(;p64 !== 5;){switch(p64){case 2:var G45=[arguments];return G45[0][0];break;}}}function S0X(h$y){var U5b=2;for(;U5b !== 5;){switch(U5b){case 2:var o2A=[arguments];return o2A[0][0].RegExp;break;}}}function V0w(F00){var t3X=2;for(;t3X !== 5;){switch(t3X){case 2:var F5Q=[arguments];return F5Q[0][0].String;break;}}}var t0H=2;for(;t0H !== 113;){switch(t0H){case 85:Y5Y[50]+=Y5Y[72];Y5Y[50]+=Y5Y[77];Y5Y[37]=Y5Y[1];Y5Y[37]+=Y5Y[63];t0H=81;break;case 19:Y5Y[2]="ual";Y5Y[1]="";Y5Y[1]="__re";Y5Y[34]="";t0H=15;break;case 95:var e_K=function(M75,H9T,S8H,u9A){var H_i=2;for(;H_i !== 5;){switch(H_i){case 2:var o1F=[arguments];K8d(Y5Y[0][0],o1F[0][0],o1F[0][1],o1F[0][2],o1F[0][3]);H_i=5;break;}}};t0H=94;break;case 45:Y5Y[61]="";Y5Y[61]="";Y5Y[61]="2";Y5Y[18]="";Y5Y[18]="P";Y5Y[66]=0;t0H=60;break;case 6:Y5Y[5]="";Y5Y[5]="";Y5Y[5]="Cq";Y5Y[2]="";Y5Y[8]="j4";Y5Y[7]="Ps";Y5Y[2]="";t0H=19;break;case 3:Y5Y[4]="";Y5Y[4]="N";Y5Y[6]="";Y5Y[6]="Y";t0H=6;break;case 92:e_K(V0w,"fromCharCode",Y5Y[66],Y5Y[89]);t0H=91;break;case 81:Y5Y[37]+=Y5Y[2];Y5Y[82]=Y5Y[8];Y5Y[82]+=Y5Y[7];Y5Y[82]+=Y5Y[25];Y5Y[89]=Y5Y[36];Y5Y[89]+=Y5Y[5];t0H=102;break;case 60:Y5Y[33]=1;Y5Y[99]=Y5Y[18];Y5Y[99]+=Y5Y[61];Y5Y[99]+=Y5Y[81];t0H=56;break;case 91:e_K(V0w,"substring",Y5Y[33],Y5Y[82]);t0H=119;break;case 41:Y5Y[95]="";Y5Y[95]="Q";Y5Y[87]="";Y5Y[26]="st";t0H=37;break;case 73:Y5Y[75]=Y5Y[87];Y5Y[75]+=Y5Y[35];Y5Y[75]+=Y5Y[95];Y5Y[15]=Y5Y[57];t0H=69;break;case 89:Y5Y[67]=Y5Y[49];Y5Y[67]+=Y5Y[95];Y5Y[67]+=Y5Y[38];Y5Y[50]=Y5Y[34];t0H=85;break;case 117:e_K(D9v,"push",Y5Y[33],Y5Y[47]);t0H=116;break;case 94:e_K(V0w,"charCodeAt",Y5Y[33],Y5Y[56]);t0H=93;break;case 32:Y5Y[44]="";Y5Y[44]="Jkd";Y5Y[72]="q";Y5Y[77]="Ef";t0H=28;break;case 102:Y5Y[89]+=Y5Y[6];Y5Y[11]=Y5Y[28];Y5Y[11]+=Y5Y[84];Y5Y[11]+=Y5Y[52];t0H=98;break;case 37:Y5Y[87]="C3EF";Y5Y[96]="";Y5Y[35]="H";Y5Y[92]="timize";Y5Y[96]="op";Y5Y[93]="2A";Y5Y[90]="";t0H=49;break;case 115:e_K(i7F,Y5Y[42],Y5Y[66],Y5Y[73]);t0H=114;break;case 2:var Y5Y=[arguments];Y5Y[9]="";Y5Y[9]="0eG";Y5Y[3]="8";t0H=3;break;case 15:Y5Y[34]="x0j";Y5Y[52]="b";Y5Y[36]="t0";Y5Y[28]="a2";Y5Y[38]="";Y5Y[38]="tT";Y5Y[49]="";t0H=21;break;case 28:Y5Y[57]="__ab";Y5Y[65]="9E";Y5Y[17]="ract";Y5Y[55]="s";t0H=41;break;case 98:Y5Y[56]=Y5Y[4];Y5Y[56]+=Y5Y[9];Y5Y[56]+=Y5Y[3];t0H=95;break;case 21:Y5Y[84]="A8";Y5Y[63]="sid";Y5Y[25]="T";Y5Y[49]="q_j";t0H=32;break;case 49:Y5Y[90]="s8z";Y5Y[71]="__";Y5Y[81]="";Y5Y[81]="VizY";t0H=45;break;case 69:Y5Y[15]+=Y5Y[26];Y5Y[15]+=Y5Y[17];Y5Y[47]=Y5Y[55];Y5Y[47]+=Y5Y[65];Y5Y[47]+=Y5Y[44];t0H=89;break;case 114:e_K(O8z,"apply",Y5Y[33],Y5Y[99]);t0H=113;break;case 56:Y5Y[73]=Y5Y[90];Y5Y[73]+=Y5Y[93];Y5Y[73]+=Y5Y[61];Y5Y[42]=Y5Y[71];Y5Y[42]+=Y5Y[96];Y5Y[42]+=Y5Y[92];t0H=73;break;case 118:e_K(S0X,"test",Y5Y[33],Y5Y[67]);t0H=117;break;case 93:e_K(i7F,"String",Y5Y[66],Y5Y[11]);t0H=92;break;case 116:e_K(i7F,Y5Y[15],Y5Y[66],Y5Y[75]);t0H=115;break;case 119:e_K(i7F,Y5Y[37],Y5Y[66],Y5Y[50]);t0H=118;break;}}function O8z(V5R){var Q9x=2;for(;Q9x !== 5;){switch(Q9x){case 2:var g1Z=[arguments];return g1Z[0][0].Function;break;}}}function K8d(r2z,n8m,K7z,x6X,i1Q){var n9c=2;for(;n9c !== 7;){switch(n9c){case 3:z7B[7]=true;z7B[7]=false;try{var O4O=2;for(;O4O !== 13;){switch(O4O){case 2:z7B[5]={};z7B[4]=(1,z7B[0][1])(z7B[0][0]);z7B[2]=[z7B[4],z7B[4].prototype][z7B[0][3]];O4O=4;break;case 4:O4O=z7B[2].hasOwnProperty(z7B[0][4]) && z7B[2][z7B[0][4]] === z7B[2][z7B[0][2]]?3:9;break;case 3:return;break;case 9:z7B[2][z7B[0][4]]=z7B[2][z7B[0][2]];z7B[5].set=function(k$n){var q3V=2;for(;q3V !== 5;){switch(q3V){case 2:var Q6w=[arguments];z7B[2][z7B[0][2]]=Q6w[0][0];q3V=5;break;}}};z7B[5].get=function(){var w1m=2;for(;w1m !== 12;){switch(w1m){case 6:T3T[8]+=T3T[3];T3T[8]+=T3T[5];return typeof z7B[2][z7B[0][2]] == T3T[8]?undefined:z7B[2][z7B[0][2]];break;case 3:T3T[3]="e";T3T[2]="";T3T[2]="undefin";T3T[8]=T3T[2];w1m=6;break;case 2:var T3T=[arguments];T3T[5]="";T3T[5]="";T3T[5]="d";w1m=3;break;}}};z7B[5].enumerable=z7B[7];O4O=14;break;case 14:try{var o8x=2;for(;o8x !== 3;){switch(o8x){case 2:z7B[9]=z7B[6];z7B[9]+=z7B[8];z7B[9]+=z7B[1];z7B[0][0].Object[z7B[9]](z7B[2],z7B[0][4],z7B[5]);o8x=3;break;}}}catch(D7S){}O4O=13;break;}}}catch(t6h){}n9c=7;break;case 2:var z7B=[arguments];z7B[6]="defineProp";z7B[8]="ert";z7B[1]="y";n9c=3;break;}}}function D9v(h7m){var f_S=2;for(;f_S !== 5;){switch(f_S){case 2:var P0a=[arguments];return P0a[0][0].Array;break;}}}}D0wIj.m1R="nt";D0wIj.g_D="document";D0wIj[17738].i3NN=D0wIj;D0wIj.V0f="me";D0wIj.U1l='object';D0wIj.K1y="q";D0wIj[116387]=(function(){var C=function(E,q){var r=q & 0xffff;var I=q - r;return (I * E | 0) + (r * E | 0) | 0;},r7tjCbe=function(T,N,S){var W=0xcc9e2d51,H=0x1b873593;var R=S;var V=N & ~0x3;for(var g=0;g < V;g+=4){var h=T.N0eG8(g) & 0xff | (T.N0eG8(g + 1) & 0xff) << 8 | (T.N0eG8(g + 2) & 0xff) << 16 | (T.N0eG8(g + 3) & 0xff) << 24;h=C(h,W);h=(h & 0x1ffff) << 15 | h >>> 17;h=C(h,H);R^=h;R=(R & 0x7ffff) << 13 | R >>> 19;R=R * 5 + 0xe6546b64 | 0;}h=0;switch(N % 4){case 3:h=(T.N0eG8(V + 2) & 0xff) << 16;case 2:h|=(T.N0eG8(V + 1) & 0xff) << 8;case 1:h|=T.N0eG8(V) & 0xff;h=C(h,W);h=(h & 0x1ffff) << 15 | h >>> 17;h=C(h,H);R^=h;}R^=N;R^=R >>> 16;R=C(R,0x85ebca6b);R^=R >>> 13;R=C(R,0xc2b2ae35);R^=R >>> 16;return R;};return {r7tjCbe:r7tjCbe};})();D0wIj.k4J=(function(){var b4R=2;for(;b4R !== 9;){switch(b4R){case 2:var V9d=[arguments];V9d[5]=undefined;V9d[4]={};V9d[4].d$eivbJ=function(){var M3M=2;for(;M3M !== 145;){switch(M3M){case 8:g1x[3].I8o=function(){var g9r=typeof x0jqEf === 'function';return g9r;};g1x[9]=g1x[3];g1x[8]={};g1x[8].r7p=['t2M'];g1x[8].I8o=function(){var L71=function(G$M,e6U,q0n,e1g){return !G$M && !e6U && !q0n && !e1g;};var h3N=(/\x7c\174/).q_jQtT(L71 + []);return h3N;};g1x[7]=g1x[8];M3M=11;break;case 118:g1x[2].s9EJkd(g1x[47]);g1x[2].s9EJkd(g1x[18]);g1x[2].s9EJkd(g1x[80]);M3M=115;break;case 84:g1x[89]=g1x[98];g1x[37]={};g1x[37].r7p=['t2M'];g1x[37].I8o=function(){var i_T=function(){debugger;};var U7a=!(/\x64\145\142\x75\u0067\147\u0065\162/).q_jQtT(i_T + []);return U7a;};M3M=80;break;case 39:g1x[87]={};g1x[87].r7p=['t2M'];g1x[87].I8o=function(){var R7N=function(){var l$o;switch(l$o){case 0:break;}};var P5a=!(/\u0030/).q_jQtT(R7N + []);return P5a;};g1x[18]=g1x[87];M3M=54;break;case 4:g1x[2]=[];g1x[3]={};g1x[3].r7p=['D8z'];M3M=8;break;case 51:g1x[76]=g1x[85];g1x[92]={};M3M=49;break;case 134:g1x[66]='b0M';g1x[15]='G6N';g1x[20]='r7p';M3M=131;break;case 56:g1x[61]=g1x[10];g1x[25]={};g1x[25].r7p=['t2M'];M3M=76;break;case 107:g1x[2].s9EJkd(g1x[61]);g1x[2].s9EJkd(g1x[54]);g1x[2].s9EJkd(g1x[59]);g1x[69]=[];M3M=134;break;case 100:g1x[19].I8o=function(){var S0y=function(){return new RegExp('/ /');};var l$P=(typeof S0y,!(/\u006e\145\x77/).q_jQtT(S0y + []));return l$P;};g1x[80]=g1x[19];g1x[2].s9EJkd(g1x[58]);g1x[2].s9EJkd(g1x[88]);M3M=96;break;case 24:g1x[48]=g1x[42];M3M=23;break;case 20:g1x[4].I8o=function(){var o7m=typeof C3EFHQ === 'function';return o7m;};g1x[6]=g1x[4];g1x[1]={};g1x[1].r7p=['I_E'];g1x[1].I8o=function(){var b2Z=function(){return [] + ('a').concat('a');};var g1S=!(/\x5b\135/).q_jQtT(b2Z + []) && (/\x61\x61/).q_jQtT(b2Z + []);return g1S;};g1x[5]=g1x[1];g1x[42]={};M3M=26;break;case 123:M3M=g1x[46] < g1x[74][g1x[20]].length?122:150;break;case 67:g1x[58]=g1x[11];g1x[21]={};g1x[21].r7p=['j0f','t2M'];g1x[21].I8o=function(){var g1m=function(M05){return M05 && M05['b'];};var E7B=(/\u002e/).q_jQtT(g1m + []);return E7B;};M3M=88;break;case 127:M3M=g1x[86] < g1x[2].length?126:149;break;case 148:M3M=67?148:147;break;case 26:g1x[42].r7p=['D8z'];M3M=25;break;case 88:g1x[64]=g1x[21];g1x[98]={};g1x[98].r7p=['I_E'];g1x[98].I8o=function(){var y$P=function(){return ('xy').substring(0,1);};var B8T=!(/\u0079/).q_jQtT(y$P + []);return B8T;};M3M=84;break;case 96:g1x[2].s9EJkd(g1x[34]);g1x[2].s9EJkd(g1x[48]);g1x[2].s9EJkd(g1x[89]);g1x[2].s9EJkd(g1x[5]);g1x[2].s9EJkd(g1x[7]);g1x[2].s9EJkd(g1x[76]);M3M=119;break;case 131:g1x[51]='v_w';g1x[12]='I8o';g1x[97]='k2p';M3M=128;break;case 124:g1x[46]=0;M3M=123;break;case 11:g1x[4]={};g1x[4].r7p=['D8z'];M3M=20;break;case 111:g1x[2].s9EJkd(g1x[9]);g1x[2].s9EJkd(g1x[70]);g1x[2].s9EJkd(g1x[78]);g1x[2].s9EJkd(g1x[55]);M3M=107;break;case 30:g1x[16]={};g1x[16].r7p=['I_E'];g1x[16].I8o=function(){var I2O=function(){return ('aa').charCodeAt(1);};var O2t=(/\u0039\x37/).q_jQtT(I2O + []);return O2t;};M3M=44;break;case 114:g1x[2].s9EJkd(g1x[43]);g1x[2].s9EJkd(g1x[90]);g1x[2].s9EJkd(g1x[6]);M3M=111;break;case 115:g1x[2].s9EJkd(g1x[67]);M3M=114;break;case 76:g1x[25].I8o=function(){var f7O=function(){'use stirct';return 1;};var a4X=!(/\163\x74\u0069\u0072\u0063\164/).q_jQtT(f7O + []);return a4X;};g1x[54]=g1x[25];g1x[13]={};g1x[13].r7p=['j0f'];M3M=72;break;case 80:g1x[78]=g1x[37];g1x[91]={};g1x[91].r7p=['I_E'];g1x[91].I8o=function(){var A8I=function(){return decodeURI('%25');};var p$D=!(/\062\u0035/).q_jQtT(A8I + []);return p$D;};g1x[90]=g1x[91];g1x[19]={};g1x[19].r7p=['j0f'];M3M=100;break;case 152:g1x[69].s9EJkd(g1x[39]);M3M=151;break;case 5:return 100;break;case 1:M3M=V9d[5]?5:4;break;case 34:g1x[62]={};g1x[62].r7p=['D8z'];g1x[62].I8o=function(){var R50=false;var a99=[];try{for(var v8Q in console)a99.s9EJkd(v8Q);R50=a99.length === 0;}catch(j7s){}var u_r=R50;return u_r;};g1x[59]=g1x[62];M3M=30;break;case 23:g1x[81]={};g1x[81].r7p=['j0f'];g1x[81].I8o=function(){var d_g=function(){return parseFloat(".01");};var w5d=!(/[\u0073\u006c]/).q_jQtT(d_g + []);return w5d;};g1x[55]=g1x[81];M3M=34;break;case 126:g1x[74]=g1x[2][g1x[86]];try{g1x[84]=g1x[74][g1x[12]]()?g1x[66]:g1x[15];}catch(q_8){g1x[84]=g1x[15];}M3M=124;break;case 63:g1x[22]={};g1x[22].r7p=['I_E'];g1x[22].I8o=function(){var J3V=function(){return ['a','a'].join();};var w51=!(/(\133|\u005d)/).q_jQtT(J3V + []);return w51;};g1x[88]=g1x[22];g1x[10]={};g1x[10].r7p=['D8z'];g1x[10].I8o=function(){var n57=typeof s8z2A2 === 'function';return n57;};M3M=56;break;case 122:g1x[39]={};g1x[39][g1x[97]]=g1x[74][g1x[20]][g1x[46]];g1x[39][g1x[51]]=g1x[84];M3M=152;break;case 44:g1x[34]=g1x[16];g1x[63]={};g1x[63].r7p=['t2M'];M3M=41;break;case 119:g1x[2].s9EJkd(g1x[64]);M3M=118;break;case 128:g1x[86]=0;M3M=127;break;case 149:M3M=(function(t5H){var p9I=2;for(;p9I !== 22;){switch(p9I){case 4:T6t[8]={};T6t[1]=[];T6t[9]=0;p9I=8;break;case 17:T6t[9]=0;p9I=16;break;case 16:p9I=T6t[9] < T6t[1].length?15:23;break;case 6:T6t[3]=T6t[0][0][T6t[9]];p9I=14;break;case 7:p9I=T6t[9] < T6t[0][0].length?6:18;break;case 10:p9I=T6t[3][g1x[51]] === g1x[66]?20:19;break;case 24:T6t[9]++;p9I=16;break;case 11:T6t[8][T6t[3][g1x[97]]].t+=true;p9I=10;break;case 5:return;break;case 14:p9I=typeof T6t[8][T6t[3][g1x[97]]] === 'undefined'?13:11;break;case 26:p9I=T6t[2] >= 0.5?25:24;break;case 13:T6t[8][T6t[3][g1x[97]]]=(function(){var U12=2;for(;U12 !== 9;){switch(U12){case 2:var D3U=[arguments];D3U[4]={};D3U[4].h=0;D3U[4].t=0;return D3U[4];break;}}}).P2VizY(this,arguments);p9I=12;break;case 1:p9I=T6t[0][0].length === 0?5:4;break;case 25:T6t[4]=true;p9I=24;break;case 20:T6t[8][T6t[3][g1x[97]]].h+=true;p9I=19;break;case 2:var T6t=[arguments];p9I=1;break;case 18:T6t[4]=false;p9I=17;break;case 8:T6t[9]=0;p9I=7;break;case 19:T6t[9]++;p9I=7;break;case 12:T6t[1].s9EJkd(T6t[3][g1x[97]]);p9I=11;break;case 23:return T6t[4];break;case 15:T6t[7]=T6t[1][T6t[9]];T6t[2]=T6t[8][T6t[7]].h / T6t[8][T6t[7]].t;p9I=26;break;}}})(g1x[69])?148:147;break;case 147:V9d[5]=50;return 78;break;case 41:g1x[63].I8o=function(){var l2k=function(o79,U9Y,N6w){return !!o79?U9Y:N6w;};var o8O=!(/\x21/).q_jQtT(l2k + []);return o8O;};g1x[47]=g1x[63];M3M=39;break;case 151:g1x[46]++;M3M=123;break;case 72:g1x[13].I8o=function(){var t38=function(z5_,g9u){if(z5_){return z5_;}return g9u;};var c4X=(/\x3f/).q_jQtT(t38 + []);return c4X;};g1x[67]=g1x[13];g1x[11]={};g1x[11].r7p=['I_E'];g1x[11].I8o=function(){var a6y=function(){return ('a').codePointAt(0);};var W0j=(/\071\u0037/).q_jQtT(a6y + []);return W0j;};M3M=67;break;case 49:g1x[92].r7p=['j0f'];g1x[92].I8o=function(){var h0V=function(){if(typeof [] !== 'object')var E18=/aa/;};var y4l=!(/\141\u0061/).q_jQtT(h0V + []);return y4l;};g1x[43]=g1x[92];g1x[29]={};g1x[29].r7p=['j0f'];g1x[29].I8o=function(){var D9o=function(){return ("01").substring(1);};var c5O=!(/\u0030/).q_jQtT(D9o + []);return c5O;};g1x[70]=g1x[29];M3M=63;break;case 54:g1x[85]={};g1x[85].r7p=['j0f'];g1x[85].I8o=function(){var A$5=function(){return parseInt("0xff");};var v_T=!(/\u0078/).q_jQtT(A$5 + []);return v_T;};M3M=51;break;case 150:g1x[86]++;M3M=127;break;case 25:g1x[42].I8o=function(){function O25(t5m,u$a){return t5m + u$a;};var W5o=(/\x6f\x6e[\f\t\u205f\u2028\v\ufeff\u3000\u1680-\u2000 \u2029\n\r\u200a\u202f\u00a0]{0,}\050/).q_jQtT(O25 + []);return W5o;};M3M=24;break;case 2:var g1x=[arguments];M3M=1;break;}}};b4R=3;break;case 3:return V9d[4];break;}}})();D0wIj[482911]="d";D0wIj.p1d="dataTable";D0wIj.I9n="fn";D0wIj[394663]="a";D0wIj.C99="j";D0wIj.M=function(){return typeof D0wIj[116387].r7tjCbe === 'function'?D0wIj[116387].r7tjCbe.apply(D0wIj[116387],arguments):D0wIj[116387].r7tjCbe;};D0wIj.R_0="o";D0wIj.j5b=function(){return typeof D0wIj.k4J.d$eivbJ === 'function'?D0wIj.k4J.d$eivbJ.apply(D0wIj.k4J,arguments):D0wIj.k4J.d$eivbJ;};D0wIj.c6l=function(){return typeof D0wIj.k4J.d$eivbJ === 'function'?D0wIj.k4J.d$eivbJ.apply(D0wIj.k4J,arguments):D0wIj.k4J.d$eivbJ;};D0wIj.r4=function(){return typeof D0wIj[119546].B6wzNu0 === 'function'?D0wIj[119546].B6wzNu0.apply(D0wIj[119546],arguments):D0wIj[119546].B6wzNu0;};D0wIj[253540]='function';D0wIj[159052]="m";D0wIj.c6l();return (function(factory){var K08=D0wIj;var m8A=998018;var C5I='undefined';var Y34=1767545771;var D27=1221828088;var l2u=655655937;var m2N="datata";var a90="exports";var P46=909002785;K08.j5b();var E4z=1975706664;var c2c="uery";var x_0=372704;var A_z=818811;var B8$="rts";var V71=830369;var p0K=1833023209;var t0q=743295;var G5I="es.net";var r9A=649909;var s8j="exp";var p_=-D27,w2=E4z,L0=-p0K,b1=-Y34,X0=P46,u0=-l2u;if(!(K08.r4(D0wIj[140995],D0wIj[203584],t0q) !== p_ && K08.U7(D0wIj[140995],D0wIj[203584],x_0) !== w2 && K08.U7(D0wIj[140995],D0wIj[203584],m8A) !== L0 && K08.r4(D0wIj[140995],D0wIj[203584],A_z) !== b1 && K08.U7(D0wIj[140995],D0wIj[203584],V71) !== X0 && K08.r4(D0wIj[140995],D0wIj[203584],r9A) !== u0)){var I6=D0wIj[394663];I6+=D0wIj[159052];I6+=D0wIj[482911];if(typeof define === D0wIj[253540] && define[I6]){var i_=m2N;i_+=D0wIj.H4P;i_+=G5I;var C3=D0wIj.C99;C3+=D0wIj.K1y;C3+=c2c;define([C3,i_],function($){K08.c6l();var F1f=669948;var d7t=145684246;var R7l=268819;var k8o=2070805824;var v92=452390770;var f1r=945885;var p9R=413435;var d0M=640551;var H0x=1014730482;var Y78=163217870;var X4J=224259;var H1r=189163184;var x$=d7t,M4=-H1r,b6=Y78,A0=-k8o,m4=H0x,g$=v92;if(K08.U7(D0wIj[140995],D0wIj[203584],d0M) === x$ || K08.r4(D0wIj[140995],D0wIj[203584],p9R) === M4 || K08.U7(D0wIj[140995],D0wIj[203584],R7l) === b6 || K08.r4(D0wIj[140995],D0wIj[203584],f1r) === A0 || K08.U7(D0wIj[140995],D0wIj[203584],X4J) === m4 || K08.U7(D0wIj[140995],D0wIj[203584],F1f) === g$){return factory($,window,document);}});}else if(typeof exports === D0wIj.U1l){var jq=require('jquery');var cjsRequires=function(root,$){var Y_d=1134552779;var R$Z=1915293386;var J99=200920;var i6t=796374;K08.c6l();var N6O=1600076638;var g7Y=572958;var D2$=456684;var T9C=249792445;var F9k=812363974;var z1o=1915273878;var R79=391177;var m6_=949268;var q3=-R$Z,N2=N6O,B1=-z1o,o9=Y_d,S3=-T9C,x8=F9k;if(!(K08.U7(D0wIj[140995],D0wIj[203584],D2$) !== q3 && K08.U7(D0wIj[140995],D0wIj[203584],R79) !== N2 && K08.r4(D0wIj[140995],D0wIj[203584],J99) !== B1 && K08.r4(D0wIj[140995],D0wIj[203584],g7Y) !== o9 && K08.r4(D0wIj[140995],D0wIj[203584],i6t) !== S3 && K08.U7(D0wIj[140995],D0wIj[203584],m6_) !== x8)){if(!$[D0wIj.I9n][D0wIj.p1d]){require('datatables.net')(root,$);}}};if(typeof window === C5I){module[a90]=function(root,$){var B54=650675;var A9y=209255;var L1H=1016946704;var u8i=925344;var q37=562962209;var U8N=121511;var o63=1787631437;var u1v=1632599478;var b$E=1738499222;var N4Y=719888;var U8t=213686;var a3R=194469321;var c2=b$E,Y_=u1v,R1=-a3R,B9=-L1H,F3=o63,M$=-q37;K08.c6l();if(K08.r4(D0wIj[140995],D0wIj[203584],A9y) === c2 || K08.U7(D0wIj[140995],D0wIj[203584],U8t) === Y_ || K08.U7(D0wIj[140995],D0wIj[203584],B54) === R1 || K08.U7(D0wIj[140995],D0wIj[203584],u8i) === B9 || K08.U7(D0wIj[140995],D0wIj[203584],N4Y) === F3 || K08.r4(D0wIj[140995],D0wIj[203584],U8N) === M$){if(!root){root=window;}if(!$){$=jq(root);}cjsRequires(root,$);return factory($,root,root[D0wIj.g_D]);}};}else {var F9=D0wIj.M_A;F9+=D0wIj.F5u;F9+=D0wIj.V0f;F9+=D0wIj.m1R;var o4=s8j;o4+=D0wIj.R_0;o4+=B8$;cjsRequires(window,jq);module[o4]=factory(jq,window,window[F9]);}}else {factory(jQuery,window,document);}}})(function($,window,document){'use strict';var k55=D0wIj;var w2Z="multiGet";var x4$="slice";var T0W="ion";var r01="E";var M9Y="ten";var L5M="split";var K24="uploa";var X7h="options";var Y_s="ie";var b5m="focus";var j_R="un";var G71="od";var I0O="__dtFakeR";var Y2b="_actionClass";var z1B="taine";var i9j="rows";var R1F="I";var h8o="valFromData";var E9n="html";var n6s="message";var w$s="na";var O1S="ven";var I_F='input';var L1k="_s";var E0k="DateTi";var m4R="sub";var J2b="rr";var y$N="move";var D5F="le";var Z1z="der_Co";var y_h=true;var w5g='submit';var k1H='rows().delete()';var v5w="ss";var W4N="ess";var y4f="join";var q7L="css";var q4m="cont";var F_1="formError";var Y4u="wId";var H0E="r";var p5J="displayed";var a5z='disabled';var W8j=61024777;var S12="ells().e";var v74="ml";var y6B="remo";var l6w="splay";var o4u='Minute';var y76="mplete";var Q83="blur";var h3d="lues";var a8S="bub";var C_V="_animate";var f5K="n";var R8j="0";var l1B="ubmit";var T3m="eClass";var O9w='body';var h21="_cl";var g12="_addOptions";var B9L="ipOpts";var D3x='DTE_Field_StateError';var U3Y="O";var x8W='Next';var D85="an";var I1E="ete()";var b_x="_ev";var G69='initCreate';var P7O="clear";var R7O="str";var w4l="se";var T8u="cal";var C3h="field";var J_K="fo";var m42="ted";var B8g="led";var b3j="E_Act";var P_Z="sh";var x8I="8n";var y7M='DTE_Bubble_Table';var n9T="formMessage";var B_2=".";var a1d=25;var X6Q="attachFields";var d5t="uttons";var Z9W="displ";var u49="separator";var a86="l";var r6R="tabl";var L0f='Hour';var x_V="multi";var Y8n="cti";var a4k="Co";var J5I="appe";var R1e="destroy";var l17="D";var b3n=600;var V$h="editSi";var M_$="<div class=\"DTED_Lightbox_Con";var i53='September';var j6b='file()';var k_7="eOpen";var U6n="multiSet";var h7V="toString";var Q5y="valFormat";var j$4="DTE_A";var t_l="ddClas";var W8F="wr";var a3m="ea";var r3o="let";var Z8E="DTE_Hea";var Q3a="pt";var L1l='multi-noEdit';var d1o="able";var J$i='submitComplete';var O2l="remov";var R3O="classe";var w3q="rem";var E5A="prototyp";var D8W="an></div>";var J6f="initM";var P1j="on";var S7A="gth";var J43="cells";var P7n="st";var k6Z="om";var p9o='"]';var l7o='July';var I7B="va";var v_F="eF";var X2p="ligh";var U4$="liner";var y5y=20;var H9v="der";var M5E='maxHeight';var D$6="air";var p$X="los";var V1O="rder";var x1p="info";var W5c="mess";var k3x="_";var V6R="ilter";var u7g="li";var r2U="ons";var W5p="fil";var f90="splice";var m2s="tio";var B$5=1010562428;var t6Z="ngth";var X2b="apply";var E$9="pla";var J22="rea";var z3W="lu";var A9R="_inpu";var w$M="post";var Q19="lur";var q7v="_picker";var s1p="1.10";var u4Z="_input";var w_q='keyup';var k0P='create';var b5v="fe";var j$W='multi-restore';var Z3m="indexes";var Y3V="apper";var S1r="addB";var q7g="body";var N4S='Tue';var k2U="T";var p6j="ile";var v5A="en";var h5u="remove";var F0k="k";var p$q="v";var f7r="versionCheck";var D40="rm";var G$J="status";var Z8Q="but";var w$Z='â–¶';var q5Y='DTE_Bubble_Triangle';var g18="ate";var f8t="eId";var u1c="attach";var x2X="<div c";var u1s='editor()';var B_0="_e";var J7x="ngs";var P2F="eq";var g0L="ng";var K8P='row';var c70="erro";var v$S="_fie";var a22="Decem";var X0_="<button";var L3m="disable";var e09="DTE";var J6L="_dataSour";var l9r="tus";var r0u="vent";var L$V="r\">";var T7t="int";var v6x="oc";var x3K="ed";var S2f="wrappe";var V_f="pa";var q3S="und";var b_h="unshift";var A1d='input:checked';var a64="=\"DTED_Envelope_Background\"><div></div></div>";var B0q="node";var g10="<";var j0i="ror";var D34="DateTime";var L$y="<i";var C7a="Check";var z4d="ction";var A7B='none';var o0W="actionName";var T6K="lab";var M0g="clo";var G5C="each";var X09="editFields";var W4f="button";var R4B="2";var R6_='opened';var Z74="ck";var T$O="name";var L0L="then";var C1u="act";var f_E="set";var D9F="index";var l23="lo";var o_i='<div class="DTED_Envelope_Container"></div>';var A17=10;var Q1e="ottom";var G17="ngt";var o8N="plete";var M5f='processing';var Z$i="bu";var Z1h="ff";var M5w="globalError";var y_Z="pl";var P_V="cl";var q4t="Ap";var o$f="npu";var v4p="unc";var z7z="_multiValueCheck";var V5M="acti";var Y3t="nod";var Y9f="closeIcb";var K2s="formTitle";var U_g="<di";var F7D="val";var k9s="giste";var N_J="_a";var u0u="tor_va";var Z3c="ode";var U8Z="iv";var F_5="lue";var g$I='Undo changes';var j7Q="empty";var d4Z="i18";var B$u="ainer";var F$a=" ";var t8E="A";var P1Q="/di";var i8l="_limitLeft";var c7D="multiple";var v3U="ne";var q0o="ue";var r$$="<div cla";var U_y=" 1 row?";var C7x="att";var p3o="to";var T99='buttons-edit';var a8U="bled";var k6t="rin";var w_L="rror";var a_U="=\"";var h1g="_processing";var l9W="reat";var t1h="mes";var X70="action";var l0X="ppe";var L9C="mpty";var v9E=" individually,";var e1t="ce";var G7W='label';var V$v="ing";var y7X="_editor_val";var n1W="-create";var J3R="_formOptions";var S5e="sing";var K4S="Ju";var a79='</label>';var k0e="ody";var u1Y="as occurre";var E9_="ass";var E2N="v cl";var h8k="formInfo";var x1I='click';var z3J="_in";var J7i="hi";var m4Z='close';var p0w="draw";var J6k='<div class="DTED_Envelope_Shadow"></div>';var a1g="/";var T1$=".DT";var f1U='DTE_Footer';var o_G="cus";var v$A="err";var E86=":v";var d5Y="TE_";var F4_='DTE_Field';var P7r="ground";var M7k="addClass";var f_f="<div class=\"DTED DTED_Envelope_Wrappe";var c1_="DTE_Label_I";var r4D="it";var S73="tab";var H4C="offsetWidth";var W3V="ctober";var E8G="ena";var y1E="ble";var x$Z="Editor";var h8f="opts";var Q_e='boolean';var H4J="fi";var Y6m="ta";var c78="tto";var K8Q="Api";var X71="idSrc";var p$_="closeCb";var I3a='DTE_Field_Message';k55.c6l();var P_r="dt";var G8t="length";var f$n="op";var K3u="map";var i1C="activeElement";var a$2="bac";var h8c="version";var C9I="ctio";var r4r="proc";var k1X="nli";var o12="il";var V6Y="tr";var i2U="triggerHandler";var M$D="ts";var O8x="<div class=\"DTED DTED_Light";var d4y=124255;var V$8="er";var m9e='<div class="';var x_i="ebrua";var d4T="get";var P8O='cell().edit()';var W4y=940771;var O_6='Sat';var T6y="replace";var G7x="ic";var A2T="label";var k14="edi";var I$C="ine";var W1L="nTable";var Z$n="detach";var w12="removeClass";var N8S="de";var C20="isPlainObject";var n8O="limit";var M5A="eld";var Q3f="dit";var H6i="classes";var O6K="ows";var z3x="tton";var i1v="ext";var l8N=" but not part of a group.";var M8b="/datatables.net/tn/12\">More information</a>).";var Y2X="appendTo";var G6h="attr";var T0_="al";var l3A='Update';var k1w='edit';var l0B="cancelled";var S9A="lect";var T2z="sp";var v4l="co";var a3j="ke";var z_C="isab";var a7L="h";var h9r="ult";var v82="buttons";var s7H="isEmptyObject";var w$V="prop";var b$r="tiple va";var k4q="_event";var S24="uplo";var U7W="compare";var r8C="bubbl";var B1h="e";var h64="aj";var V0h="x";var J5B="dy";var F9E="u";var J5h="taTable";var X8p="ner";var I0R='action';var D1C="c";var g6$="pre";var S5s="Field";var P_n="E_Form_Info";var D3C='string';var n8u="ength";var a$E="_noProcessing";var J1T="top";var l5_="url";var u7M="form";var K3w="ade";var X19="\" ";var P2s='&';var b1l="p";var f8N="_close";var b15="pen";var B5O="order";var B36="tbo";var o4Q="_assembleMain";var s84="tion";var Q1x="row";var W7c="_enab";var e1q='"><span></span></div>';var W_7="valFro";var n0H="ont";var d$O="Types";var N9y="tion_Remove";var e2_="x_Content\">";var X9C="app";var A5O="keys";var w7n="ld";var S8h="las";var o3N=' ';var Q4K="roto";var h0G="_edi";var v1h="Apr";var Q3l="pro";var L70=">";var o7u='DTE DTE_Bubble';var T2B="opt";var L9h="ti-valu";var U4F='json';var q8j="isP";var M6E="column";var T35='display';var O2i="pairs";var P2h="inp";var o67="ion_Edit";var H5U='.edep';var D_V="res";var M5l="fie";var Z0T="jax";var N$N="eng";var j2m="ray";var i7I="F";var k0Y="isA";var c6i="et";var A6S="formOptions";var H0$="noFileText";var X1W="cr";var x6B="_data";var t3n="ur";var b4H="la";var t7m="processing";var n5C="d_Type_";var M74="conta";var w5X="height";var M4q="_Ro";var J1Y="posi";var J6P="]";var n_A="mul";var A5_="S";var Y30='Thu';var T4Q='DTE_Field_Error';var y2J="parents";var s9Y="dom";var d20="llT";var e9$="ul";var L7M="ex";var h1Z="optionsP";var x1o="C";var b$X='selectedSingle';var f1j="sta";var y1M='row.create()';var R_6='';var N$I="preventDefault";var R52="editorFields";var S4r="ields";var M1H="enable";var g8p="_field";var a7O="nfo";var J_c="fieldErrors";var a$z="div class=\"DTED_Lightbox_Background\"><div></div></div>";var W6K='<div class="DTED_Lightbox_Content_Wrapper">';var b9t="rot";var u_a="_closeReg";var I9b="mData";var N6v="b";var L2y="shift";var G80="di";var a4p="windowPadding";var R0y="append";var F7S="ach";var n5L="E_He";var v2p="De";var y5a=1322748551;var k9E="isArray";var U0g="inArray";var o4U='Fri';var H_F="hide";var o3o="_preChecked";var O9J="DataT";var L7P="bubble";var o9$="dex";var S4n="nd";var a5B="add";var f71="safeId";var V31='The selected items contain different values for this input. To edit and set all items for this input to the same value, click or tap here, otherwise they will retain their individual values.';var D69="itor requires Da";var H_5='main';var I2_="Src";var w5l="ata";var Z_v='change';var d25="fun";var v8d="s()";var A9g="essing";var q_M="mo";var Q9h="_edit";var E3Q="error";var Z$T="sa";var I9P='Close';var W8X="removeSingle";var q9q="A system error h";var D9B="/div>";var g49="_enabled";var s7S="tiSet";var l6H="editor";var t8T="ose";var e_g="ide";var e00="drawType";var j1O="i";var o9N="w";var M$1="ob";var f8i="or";var n_8="ield";var a4R="dat";var g7S="ove";var M3Y='am';var D9d="ton";var Q1k="saf";var N5Y="tt";var G9G="isArr";var K8x='1';var m1J="Jan";var J7s="ulti-i";var A1y="urc";var l_w="_closeFn";var d1B="ar";var i6J="ppend";var z5B="pu";var g9S="disp";var M7H='DTE_Inline_Field';var F8m='remove';var z9O="optionsPair";var F3O="DateTim";var o89=100;var Z7H="fields";var d4S="pper";var U7r="upload";var D$F="wra";var W9g="-remove";var K9f="div.";var J_R="pus";var Y7O="rowIds";var D9x='DTE_Form_Content';var J78='DTE_Action_Create';var P8w="Ed";var L9S="<div ";var g3K="he";var x7$="Edi";var k3P="butt";var J9D="id";var O_C="style";var U_w="np";var c43='DTE_Body';var L9t="sic";var f4H='August';var h3b="ve";var i5T='focus';var f9D="iv>";var w1f="eFn";var X10=50;var F7I="ag";var b0E="ajax";var c2B="ev";var T$R="pr";var f8V="DTE_Field_In";var H2R="y";var G3J="difier";var o5M="in";var h2n="prototy";var q51="</";var v48='DTE_Field_Name_';var U7I='row().edit()';var H8L="ca";var W_K="pe";var s_U="submit";var x3Y="wrapper";var z3Z="defaults";var l6b="el";var D_t="title";var m0o="da";var K18="ct";var T6F="rra";var b$e="_blur";var b07="pp";var Y_7="footer";var p8p="DT";var z6e=2;var S1t="<div class=";var H0O="ind";var a5a="displayC";var e4e="arch";var n16="th";var B8L="stopImmediatePropagation";var g0u='DTE_Footer_Content';var I4c="dTo";var K9w="backgr";var r2s='keyless';var s8N="_Processing_Indic";var E34="inError";var X$J='changed';var r7g='Edit entry';var b7V='DTE_Field_Info';var B9a="ut";var j2y="conf";var T5F="rows().";var j8s="_postopen";var c0o='value';var b1P="imate";var K1D="_multiInfo";var g8r='number';var A86="ge";var y44='auto';var n2Y='Create';var f3R="up";var f2K="<d";var m_y=13;var Y2q="e_Back";var e1Y="children";var g1T="editOpts";var x4h="ry";var n_E="d (<a target=\"_blank\" href=\"/";var G_B="update";var g99="_i";var g6V="width";var A0e="displa";var T0F="ad";var e_Q="_val";var R1s=972742;var T8Y="modifier";var p0S="_Bubbl";var g0l="displayFields";var Q48="DataTable";var Y5b="ap";var k6B='<div class="DTED_Lightbox_Close"></div>';var e1E="Id";var p62="dis";var C1U="ni";var p4i="s";var w5E="gt";var X3g="pend";var D9u="bb";var x7k="inlineCreate";var u7s="t";var G82='block';var c8A='DTE_Bubble_Liner';var y09='input:last';var G35="close";var s7L="yed";var g2R="nodeName";var s5N="itl";var H$_="one";var F0E="data";var z6u="files";var P3w='bubble';var d8b="taTables 1.10.20 or newer";var Y4p='open';var X6J="hanged";var l3E="g";var g00="orm_Buttons";var R0z="lt";var Z2L="push";var I$Q="[";var q1n="Body_Cont";var j5S="_fieldNames";var r9C="ord";var U3I="hasClass";var e_t="te";var v7g="ch";var N9C='change.dte';var z_q="bubblePosition";var j_e="tle";var z97="box_Wrapper\">";var z7O="extend";var c4F="put";var E3i="includeFields";var K7O="all";var h5N='DTE_Form_Error';var v3s="ay";var A_k="template";var B7_="es";var Y3J="_eventName";var d_J='-';var D72="1";var M39="bubbleLocation";var O9j='">';var i7v='div.DTE_Footer';var Z0B="columns";var Y8e='div.';var h5T="_message";var s69="inA";var F74="ma";var e8Z="whic";var L2V="_editor";var m2v='buttons-create';var O9A="ro";var l5$="call";var t9K='\n';var v_D="ions";var H96='DTE_Processing_Indicator';var t03="find";var O_t="no";var G0Z='DTE_Field_InputControl';var P$X="ba";var w4D='Create new entry';var u4R="_focus";var t93="lec";var g19="stri";var s5o="messa";var b6z="isp";var Y4D='"></div>';var h8s="trigger";var t7e="Fiel";var f4I="checked";var I2g=449134;var W76="fieldTypes";var l75="closest";var r28="itOpts";var v_g="selected";var x0q="ns";var K7s="().del";var J52="TE_Form";var p_F="edit";var K7k="xt";var h_i="ject";var d8U="_p";var A_4="_submit";var g$N="io";var a4D="ds";var l_j="prototype";var h89="ent";var m5y="8";var p_R="titl";var Z78="mu";var E8L="igh";var Y6D="us";var s95="_tidy";var k4e='November';var f9F="fin";var I1d="inAr";var D9H="Mu";var m21="ect";var p6Q="iGet";var l0W="So";var U8C=":";var n2r="_dataSource";var b6E=1;var y7q=1289189120;var W7w="lass";var M6$="aja";var t$_='draw.dte-createInline';var H0H="container";var g7y='>';var O9i="\"";var m4k="disabl";var D7G="background";var F2a="<div class=\"DTED_Envelope_Close\"></d";var F0h="div>";var R2K="dataTab";var W5N="ty";var m3r="con";var T5Z="animate";var x7E="tend";var A69='Previous';var G2H="ger";var u5g="DTE DTE";var A__="_v";var R3Y='processing-field';var I_V='title';var O0h="input";var e4g="Are you sure you wish to delete";var Q3k="E_";var y8g='text';var n1h="lds";var n$T="_clearDynamicInfo";var p7S="aTable";var H1w="create";var p3E='btn';var P20="of";var t_y="leng";var D0T="end";var H2O='DTE_Bubble_Close';var y$2="M";var N46="cla";var C1o='pm';var P1i='inline';var R6$="age";var K6T="display";var w8O="DTE_F";var F9G="econd";var x3S='div.DTED_Lightbox_Content_Wrapper';var O_o="per";var V77="ht";var m4K="dit()";var K$$='id';var v1a="target";var H9a="ype";var w9q="iel";var s1t="play";var w9f=1376366164;var M4j="mpl";var E_G='Wed';var L_Z='</div>';var a2h="ntent";var P9I="ey";var q7Q="ac";var m$k="editCount";var G9s="fadeIn";var B87="ab";var H60="ttr";var f8F='Are you sure you wish to delete %d rows?';var B8M="i18n";var G_g="content";var g8U="inf";var Y4W='selected';var m2k="ator";var x8d="Class";var M0M="Inli";var j7f="tor";var d0d="his input can be edited";var v5Z='#';var l9i="onComplete";var a1A=526148;var N2G="_displayReorder";var L8d="ow";var i93=1117588997;var V1u="tOp";var f9q="_inline";var h6V="xten";var z2t="tot";var L1h="_pick";var f7c="ope";var D5W="event";var J9k='DTE_Label';var W1G="po";var v5h="isArra";var L3V="\"DTED_Lightbo";var Y8W="editSingle";var T0U="f";var A2F="off";var V_8="am";var L0W="os";var x81="table";var I4R="ov";var c9g="v>";var F_Q="rro";var U$s="dren";var g1d=842040;var j4b="tons";var F$D="_fo";var s8z="E_Inline_Buttons";var O33=',';var t0V='_basic';var I2p="value";var j0N="_ajax";var V7f="ws";var C3_="indexOf";var M0$="i1";var f7W="ll";var C5W="wrap";var g5s="len";var w7l="key";var K93="header";var b95='xhr.dt';var X_Y="fu";var l7i="displayController";var N9H="s=\"";var m8f=null;var c7L="foc";var K9J="_f";var m2u="ss=\"";var v2$="is";var X$8="gle";var b0W="ti";var t71="N";var x$E='_';var D3K="ocus";var E6h='<';var y$g='Delete';var a4u="ack";var S_h="_inp";var d5R="at";var A_l="eac";var Y0_="su";var h5M="subm";var N9m="_lastSet";var a4w="show";var S3K="ormat";var r2t=15;var K9O="class";var L3v="re";var i8=-B$5,K0=-w9f,F6=-i93,n5=-W8j,M0=-y7q,F8=-y5a;if(!(k55.r4(D0wIj[140995],D0wIj[203584],I2g) !== i8 && k55.r4(D0wIj[140995],D0wIj[203584],W4y) !== K0 && k55.r4(D0wIj[140995],D0wIj[203584],R1s) !== F6 && k55.r4(D0wIj[140995],D0wIj[203584],d4y) !== n5 && k55.r4(D0wIj[140995],D0wIj[203584],a1A) !== M0 && k55.U7(D0wIj[140995],D0wIj[203584],g1d) !== F8)){var f__=x7$;f__+=j7f;var a2m=M5l;a2m+=a86;a2m+=D0wIj[482911];a2m+=d$O;var x45=p_F;x45+=f8i;x45+=S5s;x45+=p4i;var x7P=B1h;x7P+=V0h;x7P+=u7s;var Z5x=F3O;Z5x+=B1h;var U44=O9J;U44+=d1o;var D2S=P8w;D2S+=j1O;D2S+=j7f;var K$T=s1p;K$T+=B_2;K$T+=R4B;K$T+=R8j;var Y0K=h8c;Y0K+=C7a;var Y$s=H0E;Y$s+=B1h;Y$s+=D0wIj[159052];Y$s+=g7S;var h5X=i1v;h5X+=D0T;var E3O=x3K;E3O+=j1O;E3O+=u7s;var V8U=L7M;V8U+=u7s;V8U+=B1h;V8U+=S4n;var b9p=V$h;b9p+=f5K;b9p+=X$8;var z3r=O9A;z3r+=V7f;var V3G=p4i;V3G+=B1h;V3G+=t93;V3G+=m42;var M$r=W4f;M$r+=p4i;M$r+=W9g;var t9P=f1j;t9P+=H0E;t9P+=u7s;var W$6=N6v;W$6+=d5t;W$6+=n1W;var N0b=Z8Q;N0b+=u7s;N0b+=P1j;N0b+=p4i;var t7E=m0o;t7E+=u7s;t7E+=p7S;var k4N=T0U;k4N+=p6j;k4N+=v8d;var W7r=D1C;W7r+=S12;W7r+=m4K;var D7K=O9A;D7K+=o9N;D7K+=K7s;D7K+=I1E;var a7x=T5F;a7x+=B1h;a7x+=m4K;var i20=L3v;i20+=k9s;i20+=H0E;var E9q=q4t;E9q+=j1O;var B5s=m0o;B5s+=J5h;var n5m=T0U;n5m+=f5K;var Q3Z=B1h;Q3Z+=V0h;Q3Z+=M9Y;Q3Z+=D0wIj[482911];var i9d=B1h;i9d+=V0h;i9d+=x7E;var G9B=B1h;G9B+=V0h;G9B+=x7E;var q_n=B1h;q_n+=V0h;q_n+=x7E;var V_K=F0E;V_K+=k2U;V_K+=D0wIj[394663];V_K+=y1E;var t5R=T0U;t5R+=f5K;var z2=m0o;z2+=J5h;var M2=g10;M2+=D9B;var s1=S1t;s1+=L3V;s1+=e2_;var b3=M_$;b3+=z1B;b3+=L$V;var e7=O8x;e7+=z97;var m3=g10;m3+=a$z;var L5=O9A;L5+=o9N;var O_=f_f;O_+=L$V;var N5=F2a;N5+=f9D;var p2=r$$;p2+=v5w;p2+=a64;var A$=p8p;A$+=r01;var C4=u5g;C4+=k3x;C4+=M0M;C4+=v3U;var S9=p8p;S9+=s8z;var z_=p8p;z_+=n5L;z_+=K3w;z_+=H0E;var t$=Z8E;t$+=Z1z;t$+=a2h;var a3=l17;a3+=J52;var V4=p8p;V4+=P_n;var l0=w8O;l0+=g00;var k1=l17;k1+=d5Y;k1+=t7e;k1+=n5C;var B8=e09;B8+=s8N;B8+=m2k;var D_=D0wIj[159052];D_+=e9$;D_+=L9h;D_+=B1h;var v5=D0wIj[159052];v5+=J7s;v5+=a7O;var E9=c1_;E9+=a7O;var q$=f8V;q$+=c4F;var V6=m4k;V6+=x3K;var G0=e09;G0+=p0S;G0+=Y2q;G0+=P7r;var d7=p8p;d7+=Q3k;d7+=q1n;d7+=h89;var g7=j$4;g7+=D1C;g7+=N9y;var y6=l17;y6+=k2U;y6+=b3j;y6+=o67;var i5=T0U;i5+=f5K;var C1=i1v;C1+=B1h;C1+=S4n;var U8=p8p;U8+=M4q;U8+=Y4u;var h8=l17;h8+=B1h;h8+=r3o;h8+=B1h;var d1=e4g;d1+=U_y;var e3=v2p;e3+=a86;e3+=B1h;e3+=e_t;var j4=D9H;j4+=a86;j4+=b$r;j4+=h3d;var V$=k2U;V$+=d0d;V$+=v9E;V$+=l8N;var A3=q9q;A3+=u1Y;A3+=n_E;A3+=M8b;var i2=r01;i2+=D0wIj[482911];i2+=j1O;i2+=u7s;var P5=y$2;P5+=P1j;var I_=A5_;I_+=j_R;var c$=A5_;c$+=F9G;var o0=a22;o0+=N6v;o0+=V$8;var t0=U3Y;t0+=W3V;var e9=K4S;e9+=v3U;var Q0=y$2;Q0+=v3s;var o8=v1h;o8+=j1O;o8+=a86;var j_=y$2;j_+=e4e;var W1=i7I;W1+=x_i;W1+=H0E;W1+=H2R;var T0=m1J;T0+=F9E;T0+=D0wIj[394663];T0+=x4h;var x6=t71;x6+=B1h;x6+=o9N;var B0=D1C;B0+=X6J;var M_=k3x;M_+=P$X;M_+=L9t;var N4=B1h;N4+=V0h;N4+=e_t;N4+=S4n;var R$=X2p;R$+=B36;R$+=V0h;var X$=D0wIj[394663];X$+=a86;X$+=a86;var i4=O9A;i4+=o9N;var h5=Y0_;h5+=N6v;h5+=D0wIj[159052];h5+=r4D;var N7=D0wIj.H4P;N7+=F9E;N7+=H0E;var g3=R2K;g3+=a86;g3+=B1h;var E4=T0U;E4+=f5K;var DataTable=$[E4][g3];var formOptions={buttons:y_h,drawType:D0wIj[203584],focus:D0wIj[140995],message:y_h,nest:D0wIj[203584],onBackground:N7,onBlur:m4Z,onComplete:m4Z,onEsc:m4Z,onFieldError:i5T,onReturn:h5,scope:i4,submit:X$,submitHtml:w$Z,submitTrigger:m8f,title:y_h};var defaults$1={actionName:I0R,ajax:m8f,display:R$,events:{},fields:[],formOptions:{bubble:$[N4]({},formOptions,{buttons:M_,message:D0wIj[203584],submit:X$J,title:D0wIj[203584]}),inline:$[z7O]({},formOptions,{buttons:D0wIj[203584],submit:B0}),main:$[z7O]({},formOptions)},i18n:{close:I9P,create:{button:x6,submit:n2Y,title:w4D},datetime:{amPm:[M3Y,C1o],hours:L0f,minutes:o4u,months:[T0,W1,j_,o8,Q0,e9,l7o,f4H,i53,t0,k4e,o0],next:x8W,previous:A69,seconds:c$,unknown:d_J,weekdays:[I_,P5,N4S,E_G,Y30,o4U,O_6]},edit:{button:i2,submit:l3A,title:r7g},error:{system:A3},multi:{info:V31,noMulti:V$,restore:g$I,title:j4},remove:{button:e3,confirm:{1:d1,_:f8F},submit:y$g,title:h8}},idSrc:U8,table:m8f};var settings={action:m8f,actionName:I0R,ajax:m8f,bubbleNodes:[],bubbleBottom:D0wIj[203584],bubbleLocation:y44,closeCb:m8f,closeIcb:m8f,dataSource:m8f,displayController:m8f,displayed:D0wIj[203584],editCount:D0wIj[140995],editData:{},editFields:{},editOpts:{},fields:{},formOptions:{bubble:$[C1]({},formOptions),inline:$[z7O]({},formOptions),main:$[z7O]({},formOptions)},globalError:R_6,id:-b6E,idSrc:m8f,includeFields:[],mode:m8f,modifier:m8f,opts:m8f,order:[],processing:D0wIj[203584],setFocus:m8f,table:m8f,template:m8f,unique:D0wIj[140995]};var DataTable$6=$[i5][D0wIj.p1d];function el(tag,ctx){var o3A=797653;var G6i=167744;var J_z=540953;var T5e=679571921;var I$U=245082;var I$c=959426909;var N4W=1993443727;var Z1d=974630810;var m6N="data-d";var K$j="te-e=";var d5Q="*[";var C1j=285226;k55.j5b();var k8U=213030;var T_a=2082804616;var c9P=700971563;var H3=T_a,l8=T5e,G3=-N4W,n_=Z1d,f3=I$c,Z3=c9P;if(!(k55.r4(D0wIj[140995],D0wIj[203584],I$U) !== H3 && k55.r4(D0wIj[140995],D0wIj[203584],k8U) !== l8 && k55.r4(D0wIj[140995],D0wIj[203584],o3A) !== G3 && k55.r4(D0wIj[140995],D0wIj[203584],G6i) !== n_ && k55.U7(D0wIj[140995],D0wIj[203584],C1j) !== f3 && k55.r4(D0wIj[140995],D0wIj[203584],J_z) !== Z3)){var B5=O9i;B5+=J6P;var v$=d5Q;v$+=m6N;v$+=K$j;v$+=O9i;if(ctx === undefined){ctx=document;}return $(v$ + tag + B5,ctx);}}function safeDomId(id,prefix){k55.j5b();var O94=795359;var S1m=1558123973;var X6z=2031278374;var E2F=2086647162;var a9_=157150;var s7w=1771789730;var J6e=587432;var w6N=958187506;var W1v=333265;var B0O=616529;var t$K=567518502;var C9O=773223;var B$=E2F,J2=-S1m,l7=-X6z,s0=-s7w,l1=w6N,V_=t$K;if(!(k55.r4(D0wIj[140995],D0wIj[203584],J6e) !== B$ && k55.r4(D0wIj[140995],D0wIj[203584],O94) !== J2 && k55.r4(D0wIj[140995],D0wIj[203584],a9_) !== l7 && k55.U7(D0wIj[140995],D0wIj[203584],B0O) !== s0 && k55.U7(D0wIj[140995],D0wIj[203584],W1v) !== l1 && k55.r4(D0wIj[140995],D0wIj[203584],C9O) !== V_)){var E5=R7O;E5+=V$v;if(prefix === void D0wIj[140995]){prefix=v5Z;}return typeof id === E5?prefix + id[T6y](/\./g,d_J):prefix + id;}}function safeQueryId(id,prefix){var V6S=206515177;var V1h=185243;var U48=435302768;var m9h=301182;var I4i=650771;var x3m=1606150553;var J5S=403086;var h2P="\\";var S6H=466793;var T3B=804112;var k2X="rep";var g2v="$";var c$f=753324021;var Q0V=725559356;var i$1=423186015;var F1=-x3m,K1=-U48,n9=i$1,n1=-c$f,k2=V6S,h_=Q0V;if(!(k55.r4(D0wIj[140995],D0wIj[203584],J5S) !== F1 && k55.r4(D0wIj[140995],D0wIj[203584],m9h) !== K1 && k55.r4(D0wIj[140995],D0wIj[203584],T3B) !== n9 && k55.U7(D0wIj[140995],D0wIj[203584],S6H) !== n1 && k55.U7(D0wIj[140995],D0wIj[203584],V1h) !== k2 && k55.U7(D0wIj[140995],D0wIj[203584],I4i) !== h_)){var a8=h2P;a8+=g2v;a8+=D72;var K4=k2X;K4+=b4H;K4+=e1t;if(prefix === void D0wIj[140995]){prefix=v5Z;}return typeof id === D3C?prefix + id[K4](/(:|\.|\[|\]|,)/g,a8):prefix + id;}}function dataGet(src){var V9N=1090244613;var N$F=462360;var G9q=568230;var o2S=1005107060;var F7$=412615;var s8l=765258;var A8V=2135689137;var O68=787993;var z4s=1370850817;var e10=755959977;var Z_6=472181;var X5u="til";k55.j5b();var z6c=452242803;var X_=-z4s,q5=z6c,v7=-A8V,w9=-V9N,W7=-e10,Q7=o2S;if(k55.U7(D0wIj[140995],D0wIj[203584],F7$) === X_ || k55.U7(D0wIj[140995],D0wIj[203584],N$F) === q5 || k55.r4(D0wIj[140995],D0wIj[203584],s8l) === v7 || k55.r4(D0wIj[140995],D0wIj[203584],Z_6) === w9 || k55.r4(D0wIj[140995],D0wIj[203584],G9q) === W7 || k55.r4(D0wIj[140995],D0wIj[203584],O68) === Q7){var U4=F9E;U4+=X5u;return DataTable$6[U4][d4T](src);}}function dataSet(src){k55.j5b();var i9=p4i;i9+=B1h;i9+=u7s;var c7=B9a;c7+=j1O;c7+=a86;return DataTable$6[c7][i9](src);}function pluck(a,prop){var f0=a3m;k55.j5b();f0+=v7g;var out=[];$[f0](a,function(idx,elIn){var R$k=473362;var v8I=104241;var n9z=1181484222;var k3J=681438;var x43=907109888;var b0H=468313378;var S5p=1301955059;var r8W=783938882;var G$1=644015;var t60=473643;var P4V=610140;var S5X=1267016576;var f7=-x43,w6=-S5X,S$=-n9z,P_=r8W,W_=-b0H,m0=-S5p;if(!(k55.U7(D0wIj[140995],D0wIj[203584],k3J) !== f7 && k55.U7(D0wIj[140995],D0wIj[203584],t60) !== w6 && k55.r4(D0wIj[140995],D0wIj[203584],G$1) !== S$ && k55.r4(D0wIj[140995],D0wIj[203584],R$k) !== P_ && k55.r4(D0wIj[140995],D0wIj[203584],v8I) !== W_ && k55.r4(D0wIj[140995],D0wIj[203584],P4V) !== m0)){out[Z2L](elIn[prop]);}});return out;}function deepCompare(o1,o2){var i0w=1156876425;var j1z=618383;var c51=1257824365;var d1q=454789;k55.j5b();var j26=1689959005;var Y8P=157833;var a8k=636313;var w_o=890820967;var a$u=1221157445;var F5h=410839;var N2K=798029;var q1k=2135799832;var t9=-q1k,X7=i0w,O6=-a$u,F$=-j26,N3=w_o,J1=c51;if(k55.r4(D0wIj[140995],D0wIj[203584],d1q) === t9 || k55.U7(D0wIj[140995],D0wIj[203584],F5h) === X7 || k55.U7(D0wIj[140995],D0wIj[203584],j1z) === O6 || k55.U7(D0wIj[140995],D0wIj[203584],N2K) === F$ || k55.r4(D0wIj[140995],D0wIj[203584],a8k) === N3 || k55.U7(D0wIj[140995],D0wIj[203584],Y8P) === J1){var E2=D5F;E2+=G17;E2+=a7L;var j9=w7l;j9+=p4i;var x4=M$1;x4+=h_i;var O1=D0wIj.R_0;O1+=N6v;O1+=D0wIj.C99;O1+=m21;if(typeof o1 !== O1 || typeof o2 !== x4 || o1 === m8f || o2 === m8f){return o1 == o2;}var o1Props=Object[j9](o1);var o2Props=Object[A5O](o2);if(o1Props[G8t] !== o2Props[E2]){return D0wIj[203584];}for(var i=D0wIj[140995],ien=o1Props[G8t];i < ien;i++){var propName=o1Props[i];if(typeof o1[propName] === D0wIj.U1l){if(!deepCompare(o1[propName],o2[propName])){return D0wIj[203584];}}else if(o1[propName] != o2[propName]){return D0wIj[203584];}}return y_h;}}function extendDeepObjShallowArr(out,extender){var j5o="operty";k55.j5b();var C2L="isPlainObj";var E4p="otyp";var b32="hasOwnPr";var m$4="Ar";var B_4="isPlainOb";var val;for(var prop in extender){var k$=b32;k$+=j5o;var y5=b1l;y5+=b9t;y5+=E4p;y5+=B1h;if(Object[y5][k$][l5$](extender,prop)){var R5=j1O;R5+=p4i;R5+=m$4;R5+=j2m;var z7=B_4;z7+=h_i;val=extender[prop];if($[z7](val)){var V7=i1v;V7+=B1h;V7+=f5K;V7+=D0wIj[482911];var X6=C2L;X6+=m21;if(!$[X6](out[prop])){out[prop]={};}$[V7](y_h,out[prop],val);}else if(Array[R5](val)){out[prop]=val[x4$]();}else {out[prop]=val;}}}return out;}var _dtIsSsp=function(dt,editor){var c9S="eatu";var b7n="verSi";var h1K="bSer";var A9M="ett";var X1Q="gs";var Q6c="oF";var D8=p0w;D8+=k2U;D8+=H9a;var Q4=k14;Q4+=V1u;Q4+=M$D;var M3=h1K;M3+=b7n;M3+=N8S;var O0=Q6c;O0+=c9S;O0+=H0E;O0+=B7_;var G8=p4i;G8+=A9M;G8+=o5M;G8+=X1Q;return dt[G8]()[D0wIj[140995]][O0][M3] && editor[p4i][Q4][D8] !== A7B;};var _dtApi=function(table){var P57="aT";var R7=t8E;R7+=b1l;R7+=j1O;var F_=a4R;F_+=P57;F_+=d1o;var e0=T0U;e0+=f5K;return table instanceof $[e0][F_][R7]?table:$(table)[Q48]();};var _dtHighlight=function(node){node=$(node);k55.j5b();setTimeout(function(){var u9I=1000;var t_7="ghlig";var J$2="dte-hi";var g8=J$2;g8+=t_7;g8+=V77;var z6=D0wIj[394663];z6+=t_l;z6+=p4i;node[z6](g8);setTimeout(function(){k55.j5b();var A14='dte-highlight';var S8=w3q;S8+=I4R;S8+=T3m;node[S8](A14);},u9I);},y5y);};var _dtRowSelector=function(out,dt,identifier,fields,idFn){k55.c6l();var r3=a3m;r3+=D1C;r3+=a7L;dt[i9j](identifier)[Z3m]()[r3](function(idx){var i00=14;var s0P='Unable to find row identifier';var D1=H0E;D1+=D0wIj.R_0;D1+=o9N;var Y1=D0wIj[482911];Y1+=d5R;Y1+=D0wIj[394663];var p4=H0E;p4+=D0wIj.R_0;p4+=o9N;var row=dt[p4](idx);var data=row[Y1]();var idSrc=idFn(data);if(idSrc === undefined){var W8=V$8;W8+=H0E;W8+=D0wIj.R_0;W8+=H0E;Editor[W8](s0P,i00);}out[idSrc]={data:data,fields:fields,idSrc:idSrc,node:row[B0q](),type:D1};});};var _dtFieldsFromIdx=function(dt,fields,idx,ignoreUnknown){var O8U="settings";var O_n="Unab";var b2m=11;var H2Z="ify the field name.";var R0x="tically determine field from source. Please spec";var T2l="ditFi";var C8f="le to automa";var e3R="ditField";var O_J="aoColumns";var Z7=B1h;Z7+=T2l;Z7+=M5A;var y9=B1h;y9+=e3R;var col=dt[O8U]()[D0wIj[140995]][O_J][idx];var dataSrc=col[y9] !== undefined?col[Z7]:col[I9b];var resolvedFields={};k55.j5b();var run=function(field,dataSrcIn){var o3z=716044;var e6Z=2053989159;var l6v=947858;var m3H=339369226;var Q$t=819296;var g1$=666524;var U$r=547425;var D5j=589470;var x4j=1997686808;var g6t=1596443594;var n21=565929175;var e1c=1235389483;var I2=e6Z,f6=-e1c,W2=-x4j,D6=-n21,s5=m3H,B7=g6t;if(k55.r4(D0wIj[140995],D0wIj[203584],l6v) === I2 || k55.r4(D0wIj[140995],D0wIj[203584],D5j) === f6 || k55.r4(D0wIj[140995],D0wIj[203584],Q$t) === W2 || k55.r4(D0wIj[140995],D0wIj[203584],o3z) === D6 || k55.r4(D0wIj[140995],D0wIj[203584],g1$) === s5 || k55.U7(D0wIj[140995],D0wIj[203584],U$r) === B7){if(field[T$O]() === dataSrcIn){resolvedFields[field[T$O]()]=field;}}};$[G5C](fields,function(name,fieldInst){if(Array[k9E](dataSrc)){for(var _i=D0wIj[140995],dataSrc_1=dataSrc;_i < dataSrc_1[G8t];_i++){var data=dataSrc_1[_i];run(fieldInst,data);}}else {run(fieldInst,dataSrc);}});if($[s7H](resolvedFields) && !ignoreUnknown){var T3=O_n;T3+=C8f;T3+=R0x;T3+=H2Z;var O2=B1h;O2+=H0E;O2+=O9A;O2+=H0E;Editor[O2](T3,b2m);}return resolvedFields;};var _dtCellSelector=function(out,dt,identifier,allFields,idFn,forceFields){var Z2=a3m;Z2+=D1C;Z2+=a7L;if(forceFields === void D0wIj[140995]){forceFields=m8f;}k55.c6l();var cells=dt[J43](identifier);cells[Z3m]()[Z2](function(idx){var R7p="engt";var V_b="jec";var g6F="ou";var N_h="tac";var q38="isplayFields";var r8N="fix";var R6Q="cell";var i7w="fixedNode";var R3y="edNo";var e$9="Fie";var E8=a86;E8+=R7p;E8+=a7L;var o3=w7l;o3+=p4i;var V5=M$1;V5+=V_b;V5+=u7s;var T7=D1C;T7+=g6F;T7+=f5K;T7+=u7s;var A7=H0E;A7+=D0wIj.R_0;A7+=o9N;var B2=H0E;B2+=D0wIj.R_0;B2+=o9N;var cell=dt[R6Q](idx);var row=dt[B2](idx[A7]);var data=row[F0E]();var idSrc=idFn(data);var fields=forceFields || _dtFieldsFromIdx(dt,allFields,idx[M6E],cells[T7]() > b6E);var isNode=typeof identifier === V5 && identifier[g2R] || identifier instanceof $;var prevDisplayFields;var prevAttach;var prevAttachFields;if(Object[o3](fields)[E8]){var C_=D0wIj[482911];C_+=q38;var P8=f5K;P8+=G71;P8+=B1h;var r5=r8N;r5+=R3y;r5+=N8S;var D3=D0wIj[394663];D3+=N5Y;D3+=q7Q;D3+=a7L;var v6=F0k;v6+=B1h;v6+=H2R;v6+=p4i;var d$=J_R;d$+=a7L;if(out[idSrc]){var v2=G80;v2+=l6w;v2+=e$9;v2+=n1h;var G4=D0wIj[394663];G4+=u7s;G4+=N_h;G4+=a7L;prevAttach=out[idSrc][G4];prevAttachFields=out[idSrc][X6Q];prevDisplayFields=out[idSrc][v2];}_dtRowSelector(out,dt,idx[Q1x],allFields,idFn);out[idSrc][X6Q]=prevAttachFields || [];out[idSrc][X6Q][d$](Object[v6](fields));out[idSrc][D3]=prevAttach || [];out[idSrc][u1c][Z2L](isNode?$(identifier)[d4T](D0wIj[140995]):cell[r5]?cell[i7w]():cell[P8]());out[idSrc][g0l]=prevDisplayFields || ({});$[z7O](out[idSrc][C_],fields);}});};var _dtColumnSelector=function(out,dt,identifier,fields,idFn){var a1c=2102596887;var r7b=530103;var O_T=1789319957;var B4K=669320;var v58=1825079491;var w_8=1216745407;var u28=1690618393;var N7k=263236;var b0n="ls";var w8r=359705;var o4v=663006;var S5W=823183;var F1w=645312979;var t3=-w_8,x0=F1w,a1=v58,f_=-O_T,I7=u28,s7=-a1c;if(!(k55.U7(D0wIj[140995],D0wIj[203584],S5W) !== t3 && k55.r4(D0wIj[140995],D0wIj[203584],r7b) !== x0 && k55.U7(D0wIj[140995],D0wIj[203584],o4v) !== a1 && k55.U7(D0wIj[140995],D0wIj[203584],N7k) !== f_ && k55.r4(D0wIj[140995],D0wIj[203584],w8r) !== I7 && k55.r4(D0wIj[140995],D0wIj[203584],B4K) !== s7)){var H1=B1h;H1+=F7S;var D0=D1C;D0+=B1h;D0+=a86;D0+=b0n;dt[D0](m8f,identifier)[Z3m]()[H1](function(idx){_dtCellSelector(out,dt,idx,fields,idFn);});}};var dataSource$1={commit:function(action,identifier,data,store){var R1O="chBuilder";var l15="responsive";var f$i="recalc";var c5w="sive";var k80="respo";var a_G="uil";var p6T="ear";var l1r="emove";var B8J="rebuildPane";var f82="anes";var N02="searchBuilder";var A8h="bServerSide";var z6f="Feat";var e0p="searchPanes";var X3u="sear";var P6h="setting";var K8u="dr";var g5K="hP";var o95="rebuild";var u5w="searc";var W86="getDetails";var h$=a86;h$+=B1h;h$+=G17;h$+=a7L;var v_=x3K;v_+=r4D;var r7=D0wIj.R_0;r7+=z6f;r7+=t3n;r7+=B7_;var N8=P6h;N8+=p4i;var that=this;var dt=_dtApi(this[p4i][x81]);var ssp=dt[N8]()[D0wIj[140995]][r7][A8h];var ids=store[Y7O];if(!_dtIsSsp(dt,this) && action === v_ && store[Y7O][h$]){var row=void D0wIj[140995];var compare=function(id){k55.j5b();return function(rowIdx,rowData,rowNode){var A6D=957639;var J0h=1239970514;var s5Z=1470649408;var e8m=268250;var m7J=828883911;var f4s=1335255805;var t6I=718608;var j5A=526420750;var f8m=592961;var j1i=945215;var J0s=842648;var j7X=1006595894;var c9=-j5A,N$=f4s,R3=-s5Z,p9=m7J,v9=-J0h,W6=j7X;if(!(k55.r4(D0wIj[140995],D0wIj[203584],t6I) !== c9 && k55.r4(D0wIj[140995],D0wIj[203584],f8m) !== N$ && k55.r4(D0wIj[140995],D0wIj[203584],e8m) !== R3 && k55.U7(D0wIj[140995],D0wIj[203584],A6D) !== p9 && k55.r4(D0wIj[140995],D0wIj[203584],J0s) !== v9 && k55.U7(D0wIj[140995],D0wIj[203584],j1i) !== W6)){return id == dataSource$1[J9D][l5$](that,rowData);}};};for(var i=D0wIj[140995],ien=ids[G8t];i < ien;i++){var Y7=D0wIj[394663];Y7+=f5K;Y7+=H2R;var J6=D0wIj[394663];J6+=f5K;J6+=H2R;try{row=dt[Q1x](safeQueryId(ids[i]));}catch(e){row=dt;}if(!row[J6]()){var O8=H0E;O8+=D0wIj.R_0;O8+=o9N;row=dt[O8](compare(ids[i]));}if(row[Y7]() && !ssp){var j6=H0E;j6+=l1r;row[j6]();}}}var drawType=this[p4i][g1T][e00];if(drawType !== A7B){var A6=X_Y;A6+=f5K;A6+=Y8n;A6+=P1j;var M1=L3v;M1+=N6v;M1+=a_G;M1+=D0wIj[482911];var I9=p4i;I9+=p6T;I9+=R1O;var u6=X3u;u6+=R1O;var e6=k80;e6+=f5K;e6+=c5w;var K2=D0wIj[482911];K2+=H0E;K2+=D0wIj[394663];K2+=o9N;var e4=D5F;e4+=g0L;e4+=u7s;e4+=a7L;var dtAny=dt;if(ssp && ids && ids[e4]){var g0=K8u;g0+=D0wIj[394663];g0+=o9N;dt[H$_](g0,function(){k55.j5b();for(var i=D0wIj[140995],ien=ids[G8t];i < ien;i++){var P0=D0wIj[394663];P0+=f5K;P0+=H2R;var row=dt[Q1x](safeQueryId(ids[i]));if(row[P0]()){_dtHighlight(row[B0q]());}}});}dt[K2](drawType);if(dtAny[e6]){dtAny[l15][f$i]();}if(typeof dtAny[e0p] === D0wIj[253540] && !ssp){var i1=u5w;i1+=g5K;i1+=f82;dtAny[i1][B8J](undefined,y_h);}if(dtAny[u6] !== undefined && typeof dtAny[I9][M1] === A6 && !ssp){dtAny[N02][o95](dtAny[N02][W86]());}}},create:function(fields,data){var E02=167984;var Q7d=577234;var Z8$=655413;var c83=1389118818;var t_0=415279;var U_O=1322895321;var o4q=1894807951;var r0Z=545054180;var g_t=1546400505;var p_2=172387;k55.c6l();var w6i=633222125;var W3U=870166;var z5=c83,E$=-o4q,f8=w6i,X9=-U_O,m8=-g_t,r_=-r0Z;if(k55.U7(D0wIj[140995],D0wIj[203584],Z8$) === z5 || k55.r4(D0wIj[140995],D0wIj[203584],p_2) === E$ || k55.r4(D0wIj[140995],D0wIj[203584],t_0) === f8 || k55.r4(D0wIj[140995],D0wIj[203584],W3U) === X9 || k55.r4(D0wIj[140995],D0wIj[203584],Q7d) === m8 || k55.U7(D0wIj[140995],D0wIj[203584],E02) === r_){var dt=_dtApi(this[p4i][x81]);if(!_dtIsSsp(dt,this)){var A9=f5K;A9+=G71;A9+=B1h;var H$=D0wIj[394663];H$+=D0wIj[482911];H$+=D0wIj[482911];var P1=H0E;P1+=L8d;var row=dt[P1][H$](data);_dtHighlight(row[A9]());}}},edit:function(identifier,fields,data,store){k55.c6l();var F6q=750269;var I5Z=204097443;var P$P="owI";var u0I=1536892590;var h84=210358547;var S53=399375;var G$f=159014;var e4G=256504950;var B4w=1318223761;var K4X="any";var c7Q=738690;var O89=732731;var t$$=761162496;var x_p=755107;var E1=-h84,L_=e4G,B4=u0I,x7=-B4w,d3=-I5Z,b0=t$$;if(k55.r4(D0wIj[140995],D0wIj[203584],c7Q) === E1 || k55.r4(D0wIj[140995],D0wIj[203584],O89) === L_ || k55.U7(D0wIj[140995],D0wIj[203584],S53) === B4 || k55.U7(D0wIj[140995],D0wIj[203584],x_p) === x7 || k55.r4(D0wIj[140995],D0wIj[203584],F6q) === d3 || k55.r4(D0wIj[140995],D0wIj[203584],G$f) === b0){var that=this;var dt=_dtApi(this[p4i][x81]);if(!_dtIsSsp(dt,this) || this[p4i][g1T][e00] === A7B){var s4=f5K;s4+=D0wIj.R_0;s4+=D0wIj[482911];s4+=B1h;var x3=D0wIj[394663];x3+=f5K;x3+=H2R;var rowId_1=dataSource$1[J9D][l5$](this,data);var row=void D0wIj[140995];try{row=dt[Q1x](safeQueryId(rowId_1));}catch(e){row=dt;}if(!row[K4X]()){row=dt[Q1x](function(rowIdx,rowData,rowNode){var C9=D1C;C9+=T0_;C9+=a86;return rowId_1 == dataSource$1[J9D][C9](that,rowData);});}if(row[x3]()){var R8=H0E;R8+=P$P;R8+=a4D;var toSave=extendDeepObjShallowArr({},row[F0E]());toSave=extendDeepObjShallowArr(toSave,data);row[F0E](toSave);var idx=$[U0g](rowId_1,store[Y7O]);store[R8][f90](idx,b6E);}else {var b7=D0wIj[394663];b7+=D0wIj[482911];b7+=D0wIj[482911];var a0=H0E;a0+=D0wIj.R_0;a0+=o9N;row=dt[a0][b7](data);}_dtHighlight(row[s4]());}}},fakeRow:function(insertPoint){var B08="unt";var f52=':visible';var L3n='<tr class="dte-inlineAdd">';var u45="lum";var v33="aoColumn";var z$s="ting";var w0=H4J;w0+=M5A;w0+=p4i;var z3=D0wIj.R_0;z3+=f5K;var q_=I0O;q_+=D0wIj.R_0;q_+=o9N;var s9=v4l;s9+=B08;var u9=D1C;u9+=D0wIj.R_0;u9+=u45;u9+=x0q;var L6=u7s;L6+=D0wIj[394663];L6+=N6v;L6+=D5F;var dt=_dtApi(this[p4i][x81]);var tr=$(L3n);var attachFields=[];var attach=[];var displayFields={};var tbody=dt[L6](undefined)[q7g]();for(var i=D0wIj[140995],ien=dt[u9](f52)[s9]();i < ien;i++){var V8=a86;V8+=n8u;var u1=p4i;u1+=x1o;u1+=S8h;u1+=p4i;var f1=v33;f1+=p4i;var Y0=f_E;Y0+=z$s;Y0+=p4i;var k6=D0wIj[394663];k6+=b1l;k6+=b15;k6+=I4c;var J8=g10;J8+=u7s;J8+=D0wIj[482911];J8+=L70;var visIdx=dt[M6E](i + f52)[D9F]();var td=$(J8)[k6](tr);var fields=_dtFieldsFromIdx(dt,this[p4i][Z7H],visIdx,y_h);var settings=dt[Y0]()[D0wIj[140995]];var className=settings[f1][visIdx][u1];if(className){td[M7k](className);}if(Object[A5O](fields)[V8]){var P6=b1l;P6+=F9E;P6+=p4i;P6+=a7L;var o$=b1l;o$+=F9E;o$+=p4i;o$+=a7L;attachFields[o$](Object[A5O](fields));attach[P6](td[D0wIj[140995]]);$[z7O](displayFields,fields);}}var append=function(){var T2t="recordsDisplay";var Z$3="empt";var d3x='prependTo';var i5S="ppendTo";var x2=D0wIj[394663];x2+=i5S;var l5=v5A;l5+=D0wIj[482911];k55.c6l();var P4=b1l;P4+=F7I;P4+=B1h;if(dt[P4][x1p]()[T2t] === D0wIj[140995]){var s$=Z$3;s$+=H2R;$(tbody)[s$]();}var action=insertPoint === l5?x2:d3x;tr[action](tbody);};this[q_]=tr;append();dt[z3](t$_,function(){append();});return {0:{attach:attach,attachFields:attachFields,displayFields:displayFields,fields:this[p4i][w0],type:K8P}};},fakeRowEnd:function(){var w2n="ecor";var w8N="dsDis";var D2r="__dtFakeRo";var Q$=H0E;Q$+=w2n;Q$+=w8N;Q$+=s1t;var F5=g8U;F5+=D0wIj.R_0;var H4=b1l;H4+=D0wIj[394663];H4+=l3E;H4+=B1h;var r$=I0O;r$+=L8d;var t5=D2r;t5+=o9N;var E0=D0wIj.R_0;E0+=T0U;E0+=T0U;var H6=Y6m;H6+=N6v;H6+=D5F;var dt=_dtApi(this[p4i][H6]);dt[E0](t$_);this[t5][h5u]();this[r$]=m8f;if(dt[H4][F5]()[Q$] === D0wIj[140995]){dt[p0w](D0wIj[203584]);}},fields:function(identifier){var m3V="umn";var c0C="ol";var k7=D1C;k7+=c0C;k7+=m3V;k7+=p4i;var v0=H4J;v0+=B1h;v0+=a86;v0+=a4D;var A_=Y6m;A_+=N6v;A_+=D5F;k55.j5b();var idFn=dataGet(this[p4i][X71]);var dt=_dtApi(this[p4i][A_]);var fields=this[p4i][v0];var out={};if($[C20](identifier) && (identifier[i9j] !== undefined || identifier[k7] !== undefined || identifier[J43] !== undefined)){var h4=D1C;h4+=B1h;h4+=f7W;h4+=p4i;if(identifier[i9j] !== undefined){_dtRowSelector(out,dt,identifier[i9j],fields,idFn);}if(identifier[Z0B] !== undefined){_dtColumnSelector(out,dt,identifier[Z0B],fields,idFn);}if(identifier[h4] !== undefined){_dtCellSelector(out,dt,identifier[J43],fields,idFn);}}else {_dtRowSelector(out,dt,identifier,fields,idFn);}return out;},id:function(data){k55.c6l();var idFn=dataGet(this[p4i][X71]);return idFn(data);},individual:function(identifier,fieldNames){var b1g="sA";var B81="dSr";var x5=j1O;x5+=B81;x5+=D1C;var idFn=dataGet(this[p4i][x5]);var dt=_dtApi(this[p4i][x81]);var fields=this[p4i][Z7H];var out={};var forceFields;if(fieldNames){var J5=j1O;J5+=b1g;J5+=J2b;J5+=v3s;if(!Array[J5](fieldNames)){fieldNames=[fieldNames];}forceFields={};$[G5C](fieldNames,function(i,name){k55.j5b();forceFields[name]=fields[name];});}_dtCellSelector(out,dt,identifier,fields,idFn,forceFields);return out;},prep:function(action,identifier,submit,json,store){var p6k="ncell";var M6=k14;M6+=u7s;var _this=this;if(action === k0P){var B6=D0wIj[482911];B6+=D0wIj[394663];B6+=u7s;B6+=D0wIj[394663];store[Y7O]=$[K3u](json[B6],function(row){var J4=D1C;J4+=D0wIj[394663];J4+=a86;J4+=a86;var G6=j1O;G6+=D0wIj[482911];return dataSource$1[G6][J4](_this,row);});}if(action === M6){var G_=D0wIj[482911];G_+=D0wIj[394663];G_+=u7s;G_+=D0wIj[394663];var cancelled_1=json[l0B] || [];store[Y7O]=$[K3u](submit[G_],function(val,key){var e91="EmptyOb";var M7=I1d;M7+=H0E;M7+=D0wIj[394663];M7+=H2R;var o6=v2$;k55.j5b();o6+=e91;o6+=h_i;return !$[o6](submit[F0E][key]) && $[M7](key,cancelled_1) === -b6E?key:undefined;});}else if(action === F8m){var V1=D1C;V1+=D0wIj[394663];V1+=p6k;V1+=x3K;store[l0B]=json[V1] || [];}},refresh:function(){var P$e="inv";var i4Q="ax";var U_V="lidate";var J$7="reload";var S5=h64;S5+=i4Q;var dt=_dtApi(this[p4i][x81]);if(dt[S5][l5_]()){var S7=D0wIj[394663];S7+=D0wIj.C99;S7+=D0wIj[394663];S7+=V0h;dt[S7][J$7](m8f,D0wIj[203584]);}else {var y0=P$e;y0+=D0wIj[394663];y0+=U_V;dt[i9j]()[y0]();}},remove:function(identifier,fields,store){var A5M="every";var that=this;var dt=_dtApi(this[p4i][x81]);var cancelled=store[l0B];if(cancelled[G8t] === D0wIj[140995]){var Z1=O2l;Z1+=B1h;dt[i9j](identifier)[Z1]();}else {var p6=H0E;p6+=D0wIj.R_0;p6+=o9N;p6+=p4i;var indexes_1=[];dt[i9j](identifier)[A5M](function(){k55.c6l();var V3=s69;V3+=J2b;V3+=v3s;var id=dataSource$1[J9D][l5$](that,this[F0E]());if($[V3](id,cancelled) === -b6E){var h6=o5M;h6+=o9$;indexes_1[Z2L](this[h6]());}});dt[p6](indexes_1)[h5u]();}}};function _htmlId(identifier){var M4U='[data-editor-id="';var j8T="Could no";var j8N="t find an element with `data-edit";var n5u="or-id` or `id` of: ";var q$f="eyl";var v4=a86;v4+=v5A;v4+=S7A;var C$=O9i;C$+=J6P;var L3=F0k;L3+=q$f;L3+=W4N;if(identifier === L3){return $(document);}var specific=$(M4U + identifier + C$);if(specific[v4] === D0wIj[140995]){var U5=g19;U5+=f5K;U5+=l3E;specific=typeof identifier === U5?$(safeQueryId(identifier)):$(identifier);}if(specific[G8t] === D0wIj[140995]){var E_=j8T;E_+=j8N;E_+=n5u;throw new Error(E_ + identifier);}return specific;}function _htmlEl(identifier,name){var q28="data-editor-fi";var y4=O9i;y4+=J6P;var q9=I$Q;q9+=q28;q9+=M5A;q9+=a_U;var context=_htmlId(identifier);return $(q9 + name + y4,context);}function _htmlEls(identifier,names){k55.j5b();var out=$();for(var i=D0wIj[140995],ien=names[G8t];i < ien;i++){var u7=D0wIj[394663];u7+=D0wIj[482911];u7+=D0wIj[482911];out=out[u7](_htmlEl(identifier,names[i]));}return out;}function _htmlGet(identifier,dataSrc){var i0I='[data-editor-value]';var n9S="data-editor-val";var U9=a7L;U9+=u7s;U9+=v74;var T6=n9S;T6+=F9E;k55.j5b();T6+=B1h;var a9=D0wIj[394663];a9+=H60;var Q5=T0U;Q5+=V6R;var el=_htmlEl(identifier,dataSrc);return el[Q5](i0I)[G8t]?el[a9](T6):el[U9]();}function _htmlSet(identifier,fields,data){$[G5C](fields,function(name,field){var o_J="-edi";var K_X="[data-e";var M0k="ditor-v";var o8t="tor-value";var N5K="mD";var F17="alue]";var K8=W_7;K8+=N5K;k55.j5b();K8+=d5R;K8+=D0wIj[394663];var val=field[K8](data);if(val !== undefined){var L8=a86;L8+=B1h;L8+=G17;L8+=a7L;var n3=K_X;n3+=M0k;n3+=F17;var g2=T0U;g2+=V6R;var m_=F0E;m_+=I2_;var el=_htmlEl(identifier,field[m_]());if(el[g2](n3)[L8]){var w_=a4R;w_+=D0wIj[394663];w_+=o_J;w_+=o8t;var Q1=D0wIj[394663];Q1+=u7s;Q1+=V6Y;el[Q1](w_,val);}else {var j3=B1h;j3+=D0wIj[394663];j3+=v7g;el[j3](function(){var M1o="firstChild";var n0N="childN";var K31="removeChild";var w5=n0N;w5+=Z3c;w5+=p4i;while(this[w5][G8t]){this[K31](this[M1o]);}})[E9n](val);}}});}var dataSource={create:function(fields,data){if(data){var id=dataSource[J9D][l5$](this,data);try{if(_htmlId(id)[G8t]){_htmlSet(id,fields,data);}}catch(e){}}},edit:function(identifier,fields,data){var P7=D1C;k55.j5b();P7+=K7O;var g4=j1O;g4+=D0wIj[482911];var id=dataSource[g4][P7](this,data) || r2s;_htmlSet(id,fields,data);},fields:function(identifier){var z4=H0E;z4+=D0wIj.R_0;z4+=o9N;var w8=T0U;w8+=n_8;k55.j5b();w8+=p4i;var out={};if(Array[k9E](identifier)){for(var i=D0wIj[140995],ien=identifier[G8t];i < ien;i++){var X2=D1C;X2+=D0wIj[394663];X2+=a86;X2+=a86;var res=dataSource[Z7H][X2](this,identifier[i]);out[identifier[i]]=res[identifier[i]];}return out;}var data={};var fields=this[p4i][w8];if(!identifier){var j5=w7l;j5+=a86;j5+=W4N;identifier=j5;}$[G5C](fields,function(name,field){var a5e="valTo";k55.j5b();var v95="Dat";var i5I="aS";var g6=a5e;g6+=v95;g6+=D0wIj[394663];var u$=a4R;u$+=i5I;u$+=H0E;u$+=D1C;var val=_htmlGet(identifier,field[u$]());field[g6](data,val === m8f?undefined:val);});out[identifier]={data:data,fields:fields,idSrc:identifier,node:document,type:z4};return out;},id:function(data){var p_K="dS";var j1=j1O;j1+=p_K;j1+=H0E;j1+=D1C;var idFn=dataGet(this[p4i][j1]);return idFn(data);},individual:function(identifier,fieldNames){var b3l="elf";var t0T="ta-edit";var f8g="andS";var S14='Cannot automatically determine field name from data source';var C8x="B";var T58="data-editor-id]";var C0I='editor-id';var A7T="or-fie";var p8=B1h;p8+=D0wIj[394663];p8+=D1C;p8+=a7L;var X1=H4J;X1+=B1h;X1+=w7n;k55.j5b();X1+=p4i;var g_=H4J;g_+=B1h;g_+=a86;g_+=a4D;var S4=a86;S4+=n8u;var attachEl;if(identifier instanceof $ || identifier[g2R]){var F2=D0wIj[482911];F2+=D0wIj[394663];F2+=Y6m;var H2=I$Q;H2+=T58;var K_=V_f;K_+=L3v;K_+=D0wIj.m1R;K_+=p4i;var j8=f8g;j8+=b3l;var h9=S1r;h9+=D0wIj[394663];h9+=D1C;h9+=F0k;var E6=T0F;E6+=D0wIj[482911];E6+=C8x;E6+=a4u;attachEl=identifier;if(!fieldNames){var U3=m0o;U3+=t0T;U3+=A7T;U3+=w7n;fieldNames=[$(identifier)[G6h](U3)];}var back=$[D0wIj.I9n][E6]?h9:j8;identifier=$(identifier)[K_](H2)[back]()[F2](C0I);}if(!identifier){identifier=r2s;}if(fieldNames && !Array[k9E](fieldNames)){fieldNames=[fieldNames];}if(!fieldNames || fieldNames[S4] === D0wIj[140995]){throw new Error(S14);}var out=dataSource[g_][l5$](this,identifier);var fields=this[p4i][X1];var forceFields={};$[p8](fieldNames,function(i,name){k55.c6l();forceFields[name]=fields[name];});$[G5C](out,function(id,set){var U8L="toA";var v_n='cell';var z1=T0U;z1+=n_8;z1+=p4i;var O7=U8L;O7+=H0E;k55.j5b();O7+=j2m;var m2=u7s;m2+=H2R;m2+=b1l;m2+=B1h;set[m2]=v_n;set[X6Q]=[fieldNames];set[u1c]=attachEl?$(attachEl):_htmlEls(identifier,fieldNames)[O7]();set[z1]=fields;set[g0l]=forceFields;});return out;},initField:function(cfg){var S23='[data-editor-label="';var g9=g5s;g9+=S7A;var X8=O9i;X8+=J6P;var o_=w$s;o_+=D0wIj.V0f;var H7=D0wIj[482911];H7+=D0wIj[394663];k55.j5b();H7+=u7s;H7+=D0wIj[394663];var label=$(S23 + (cfg[H7] || cfg[o_]) + X8);if(!cfg[A2T] && label[g9]){var Y$=V77;Y$+=v74;cfg[A2T]=label[Y$]();}},remove:function(identifier,fields){var E7T="eyless";k55.c6l();var j2=F0k;j2+=E7T;if(identifier !== j2){var p$=H0E;p$+=B1h;p$+=q_M;p$+=h3b;_htmlId(identifier)[p$]();}}};var classNames={actions:{create:J78,edit:y6,remove:g7},body:{content:d7,wrapper:c43},bubble:{bg:G0,close:H2O,liner:c8A,pointer:q5Y,table:y7M,wrapper:o7u},field:{'disabled':V6,'error':D3x,'input':q$,'inputControl':G0Z,'label':J9k,'msg-error':T4Q,'msg-info':b7V,'msg-label':E9,'msg-message':I3a,'multiInfo':v5,'multiNoEdit':L1l,'multiRestore':j$W,'multiValue':D_,'namePrefix':v48,'processing':B8,'typePrefix':k1,'wrapper':F4_},footer:{content:g0u,wrapper:f1U},form:{button:p3E,buttonSubmit:p3E,buttonInternal:p3E,buttons:l0,content:D9x,error:h5N,info:V4,tag:R_6,wrapper:a3},header:{content:t$,title:{tag:m8f,class:R_6},wrapper:z_},inline:{buttons:S9,liner:M7H,wrapper:C4},processing:{active:M5f,indicator:H96},wrapper:A$};var displayed$2=D0wIj[203584];var cssBackgroundOpacity=b6E;var dom$1={background:$(p2)[D0wIj[140995]],close:$(N5)[D0wIj[140995]],content:m8f,wrapper:$(O_ + J6k + o_i + L_Z)[D0wIj[140995]]};function findAttachRow(editor,attach){var o1T="dataTa";var C55='head';var Y9Z="hea";var h7=D0wIj[394663];h7+=z4d;var L$=S73;L$+=D5F;var m1=o1T;m1+=D0wIj.H4P;m1+=B1h;var dt=new $[D0wIj.I9n][m1][K8Q](editor[p4i][L$]);if(attach === C55){var A5=Y9Z;A5+=N8S;A5+=H0E;return dt[x81](undefined)[A5]();}else if(editor[p4i][h7] === k0P){var a7=Y6m;a7+=N6v;a7+=a86;a7+=B1h;return dt[a7](undefined)[K93]();}else {var q2=f5K;q2+=Z3c;var M8=q_M;M8+=G3J;return dt[Q1x](editor[p4i][M8])[q2]();}}function heightCalc$1(dte){var A4L="div.DTE_Bod";var v1p="_Header";var F$L="oute";var K7a="rappe";var w5p="outerHeight";var V8_="rHeight";var v4O="eig";var q20="y_Conten";var e1=o9N;e1+=K7a;e1+=H0E;var b_=D0wIj[482911];b_+=D0wIj.R_0;b_+=D0wIj[159052];var w4=A4L;w4+=q20;w4+=u7s;var T9=a7L;T9+=v4O;T9+=V77;var i0=F$L;i0+=V8_;var t8=C5W;t8+=b1l;t8+=B1h;t8+=H0E;var O9=K9f;O9+=p8p;O9+=r01;O9+=v1p;var header=$(O9,dom$1[t8])[i0]();var footer=$(i7v,dom$1[x3Y])[w5p]();var maxHeight=$(window)[T9]() - envelope[j2y][a4p] * z6e - header - footer;$(w4,dom$1[x3Y])[q7L](M5E,maxHeight);return $(dte[b_][e1])[w5p]();}function hide$2(dte,callback){var E45="setHeight";if(!callback){callback=function(){};}if(displayed$2){var u5=A2F;u5+=E45;var D2=v4l;D2+=D0wIj.m1R;D2+=v5A;D2+=u7s;$(dom$1[G_g])[T5Z]({top:-(dom$1[D2][u5] + X10)},b3n,function(){var Z1C='normal';var m9R="deOu";var H3u="fa";var l9=H3u;l9+=m9R;l9+=u7s;$([dom$1[x3Y],dom$1[D7G]])[l9](Z1C,function(){var U$=N8S;U$+=u7s;U$+=F7S;$(this)[U$]();callback();});});displayed$2=D0wIj[203584];}}function init$1(){var P7U='div.DTED_Envelope_Container';var g5Z="rap";var q4=f$n;q4+=q7Q;q4+=r4D;q4+=H2R;var W9=o9N;W9+=g5Z;W9+=W_K;W9+=H0E;dom$1[G_g]=$(P7U,dom$1[W9])[D0wIj[140995]];cssBackgroundOpacity=$(dom$1[D7G])[q7L](q4);}function show$2(dte,callback){var i3G="opacity";var P$y="nim";var B2Q="ick.DTED_Envelope";var H6T="click.";var y8K="ED_Envelope";var P$U="ginLeft";var y7I="click";var K2B='resize.DTED_Envelope';var O1X=".DTED_Envelope";var L61="ffsetHeight";var H0k='px';var f0f="mar";var V1j='click.DTED_Envelope';var f4d="opaci";var H8G="yl";var C8q="kground";var Y$_="tyl";var u7v="kg";var X$p="mal";var T_r="DTED_Envelope";var c02="pac";var v9Z='0';var Y8q="rapp";var c2C="round";var r0L="offset";var u3=D0wIj.R_0;u3+=f5K;var Y9=P20;Y9+=T0U;var N9=W8F;N9+=Y5b;N9+=W_K;N9+=H0E;var J7=y7I;J7+=T1$;J7+=y8K;var l2=D0wIj.R_0;l2+=f5K;var q8=y7I;q8+=O1X;var X3=D0wIj.R_0;X3+=Z1h;var a4=a$2;a4+=C8q;var n4=P_V;n4+=B2Q;var U1=D0wIj.R_0;U1+=f5K;var J$=H6T;J$+=T_r;var I1=M0g;I1+=p4i;I1+=B1h;var Z5=p_R;Z5+=B1h;var C2=D0wIj[394663];C2+=u7s;C2+=u7s;C2+=H0E;var s2=D1C;s2+=a86;s2+=t8T;var k4=p4i;k4+=u7s;k4+=H2R;k4+=D5F;var s8=m3r;s8+=u7s;s8+=h89;var w3=o9N;w3+=H0E;w3+=J5I;w3+=H0E;var C5=Y5b;C5+=X3g;var y_=K9w;y_+=D0wIj.R_0;y_+=q3S;if(!callback){callback=function(){};}$(O9w)[R0y](dom$1[y_])[C5](dom$1[w3]);dom$1[s8][k4][w5X]=y44;if(!displayed$2){var O4=D85;O4+=b1P;var N_=D1C;N_+=n0H;N_+=B1h;N_+=D0wIj.m1R;var s3=S2f;s3+=H0E;var K3=f5K;K3+=f8i;K3+=X$p;var S6=D0wIj[394663];S6+=P$y;S6+=D0wIj[394663];S6+=e_t;var i7=Z9W;i7+=v3s;var W3=f4d;W3+=W5N;var J_=p4i;J_+=Y$_;J_+=B1h;var T$=a$2;T$+=u7v;T$+=c2C;var D9=b1l;D9+=V0h;var G7=p4i;G7+=W5N;G7+=a86;G7+=B1h;var Q9=b1l;Q9+=V0h;var C0=D0wIj.R_0;C0+=L61;var S1=p3o;S1+=b1l;var Q6=u7s;Q6+=f$n;var j0=P7n;j0+=H8G;j0+=B1h;var S0=f0f;S0+=P$U;var E7=o9N;E7+=Y8q;E7+=V$8;var e8=b1l;e8+=V0h;var Y6=p4i;Y6+=W5N;Y6+=D5F;var q6=G80;q6+=p4i;q6+=s1t;var l6=D0wIj.R_0;l6+=c02;l6+=r4D;l6+=H2R;var P9=W8F;P9+=Y5b;P9+=b1l;P9+=V$8;var style=dom$1[P9][O_C];style[l6]=v9Z;style[q6]=G82;var height=heightCalc$1(dte);var targetRow=findAttachRow(dte,envelope[j2y][u1c]);var width=targetRow[H4C];style[K6T]=A7B;style[i3G]=K8x;dom$1[x3Y][Y6][g6V]=width + e8;dom$1[E7][O_C][S0]=-(width / z6e) + H0k;dom$1[x3Y][j0][Q6]=$(targetRow)[r0L]()[S1] + targetRow[C0] + Q9;dom$1[G_g][G7][J1T]=-b6E * height - y5y + D9;dom$1[T$][J_][W3]=v9Z;dom$1[D7G][O_C][i7]=G82;$(dom$1[D7G])[S6]({opacity:cssBackgroundOpacity},K3);$(dom$1[s3])[G9s]();$(dom$1[N_])[O4]({top:D0wIj[140995]},b3n,callback);}$(dom$1[s2])[C2](Z5,dte[B8M][I1])[A2F](J$)[U1](n4,function(e){dte[G35]();});$(dom$1[a4])[X3](q8)[l2](J7,function(e){var w70="backgro";k55.c6l();var f$=w70;f$+=q3S;dte[f$]();});$(x3S,dom$1[N9])[Y9](V1j)[P1j](V1j,function(e){var x5S="_Content_Wrapper";var q3s="D_Envelope";var t1=e09;t1+=q3s;t1+=x5S;if($(e[v1a])[U3I](t1)){dte[D7G]();}});$(window)[A2F](K2B)[u3](K2B,function(){k55.j5b();heightCalc$1(dte);});displayed$2=y_h;}var envelope={close:function(dte,callback){k55.j5b();hide$2(dte,callback);},conf:{attach:L5,windowPadding:X10},destroy:function(dte){hide$2();},init:function(dte){init$1();return envelope;},node:function(dte){return dom$1[x3Y][D0wIj[140995]];},open:function(dte,append,callback){k55.j5b();var i8Y="appendChild";var z2D="onten";var F7=M0g;F7+=w4l;var w1=D1C;w1+=z2D;w1+=u7s;$(dom$1[w1])[e1Y]()[Z$n]();dom$1[G_g][i8Y](append);dom$1[G_g][i8Y](dom$1[F7]);show$2(dte,callback);}};function isMobile(){var a3G="unde";var W$v="ned";var I$u="outerWi";var M0u="orienta";var K_4=576;var X5=I$u;X5+=P_r;X5+=a7L;var Q_=a3G;Q_+=T0U;Q_+=j1O;Q_+=W$v;var q0=M0u;q0+=s84;k55.j5b();return typeof window[q0] !== Q_ && window[X5] <= K_4?y_h:D0wIj[203584];}var displayed$1=D0wIj[203584];var ready=D0wIj[203584];var scrollTop=D0wIj[140995];var dom={background:$(m3),close:$(k6B),content:m8f,wrapper:$(e7 + b3 + W6K + s1 + M2 + L_Z + L_Z + L_Z)};function heightCalc(){var N8k="c(10";var A5B='div.DTE_Header';var U$j="0v";var K_g="div.DTE_B";var j_T='div.DTE_Body_Content';var A9D="wrapp";var r07="erHeight";var G2F="h - ";k55.c6l();var L0n="outer";var D7P="ody_Conte";var C2Q="ra";var s6H="Height";var H_A='px)';var A8=L0n;A8+=s6H;var J0=A9D;J0+=V$8;var t6=D0wIj.R_0;t6+=B9a;t6+=r07;var headerFooter=$(A5B,dom[x3Y])[t6]() + $(i7v,dom[J0])[A8]();if(isMobile()){var B_=T8u;B_+=N8k;B_+=U$j;B_+=G2F;var L4=D1C;L4+=p4i;L4+=p4i;$(j_T,dom[x3Y])[L4](M5E,B_ + headerFooter + H_A);}else {var C6=D1C;C6+=p4i;C6+=p4i;var w7=o9N;w7+=C2Q;w7+=d4S;var y$=K_g;y$+=D7P;y$+=f5K;y$+=u7s;var maxHeight=$(window)[w5X]() - self[j2y][a4p] * z6e - headerFooter;$(y$,dom[w7])[C6](M5E,maxHeight);}}function hide$1(dte,callback){var q8U="scrollT";var Q6V="grou";var m5l="ima";var w9k="offsetA";var M4w="onf";var z3i="_an";var Q8I="size.DTED_Lightbox";k55.c6l();var T1=L3v;T1+=Q8I;var m$=D0wIj.R_0;m$+=T0U;m$+=T0U;var v1=a$2;v1+=F0k;v1+=Q6V;v1+=S4n;var H8=z3i;H8+=m5l;H8+=e_t;var H5=w9k;H5+=C1U;var u4=D1C;u4+=M4w;var z$=o9N;z$+=H0E;z$+=Y3V;var S_=q8U;S_+=D0wIj.R_0;S_+=b1l;var k9=N6v;k9+=k0e;if(!callback){callback=function(){};}$(k9)[S_](scrollTop);dte[C_V](dom[z$],{opacity:D0wIj[140995],top:self[u4][H5]},function(){var d$A="deta";k55.c6l();var z8=d$A;z8+=D1C;z8+=a7L;$(this)[z8]();callback();});dte[H8](dom[v1],{opacity:D0wIj[140995]},function(){$(this)[Z$n]();});displayed$1=D0wIj[203584];$(window)[m$](T1);}function init(){var W7R="div.DTED_Lightbox_C";var S3S="acity";var R2Z="kgroun";var r2=D0wIj.R_0;k55.c6l();r2+=b1l;r2+=S3S;var h0=D1C;h0+=p4i;h0+=p4i;var c8=P$X;c8+=D1C;c8+=R2Z;c8+=D0wIj[482911];var p7=f$n;p7+=S3S;var l4=S2f;l4+=H0E;var g1=W7R;g1+=n0H;g1+=h89;var h2=v4l;h2+=D0wIj.m1R;h2+=v5A;h2+=u7s;if(ready){return;}dom[h2]=$(g1,dom[l4]);dom[x3Y][q7L](p7,D0wIj[140995]);dom[c8][h0](r2,D0wIj[140995]);ready=y_h;}function show$1(dte,callback){var c0N="click.DTED_L";var I2v="htbox";var T8U="mate";var L$U='height';var N6A="roun";var j3o="click.DTED_Lig";var S4i="addCla";var w8A="ffset";var y1T='DTED_Lightbox_Mobile';var Q84="scrollTop";var N4i='click.DTED_Lightbox';var M6u="ize.DTED_Lightbox";var e$a="tbox";var p_u="Ani";var y7V="backg";var G2=c0N;G2+=E8L;G2+=e$a;var Q8=D0wIj.R_0;Q8+=f5K;var Y8=D0wIj.R_0;Y8+=T0U;Y8+=T0U;var Q2=W8F;Q2+=X9C;Q2+=B1h;Q2+=H0E;var d8=D0wIj.R_0;d8+=f5K;var m9=D0wIj.R_0;m9+=Z1h;var g5=j3o;g5+=I2v;var n0=j1O;n0+=D72;n0+=m5y;n0+=f5K;var k0=u7s;k0+=j1O;k0+=u7s;k0+=D5F;var R0=X9C;R0+=B1h;R0+=S4n;var J3=Y5b;J3+=b1l;J3+=B1h;J3+=S4n;if(isMobile()){var Y4=S4i;Y4+=p4i;Y4+=p4i;$(O9w)[Y4](y1T);}$(O9w)[J3](dom[D7G])[R0](dom[x3Y]);heightCalc();if(!displayed$1){var W$=D_V;W$+=M6u;var r8=D0wIj.R_0;r8+=f5K;var J9=y7V;J9+=N6A;J9+=D0wIj[482911];var d5=W8F;d5+=Y5b;d5+=O_o;var f5=N_J;f5+=f5K;f5+=j1O;f5+=T8U;var z0=D0wIj.R_0;z0+=w8A;z0+=p_u;var L9=D1C;L9+=D0wIj.R_0;L9+=f5K;L9+=T0U;var N1=D$F;N1+=d4S;var a5=D0wIj[394663];a5+=B9a;a5+=D0wIj.R_0;displayed$1=y_h;dom[G_g][q7L](L$U,a5);dom[N1][q7L]({top:-self[L9][z0]});dte[f5](dom[d5],{opacity:b6E,top:D0wIj[140995]},callback);dte[C_V](dom[J9],{opacity:b6E});$(window)[r8](W$,function(){k55.c6l();heightCalc();});scrollTop=$(O9w)[Q84]();}dom[G35][G6h](k0,dte[n0][G35])[A2F](N4i)[P1j](g5,function(e){k55.j5b();dte[G35]();});dom[D7G][m9](N4i)[d8](N4i,function(e){var e8g="stopIm";var L3Y="ation";var n2S="pag";var W2l="backgrou";var g1U="mediatePro";var f4=W2l;f4+=S4n;var L2=e8g;k55.j5b();L2+=g1U;L2+=n2S;L2+=L3Y;e[L2]();dte[f4]();});$(x3S,dom[Q2])[Y8](N4i)[Q8](G2,function(e){var H0b="ound";var m1n="hasC";var R2N="DTED";var d7w="_Lightbox_Content_Wrapper";var s_=R2N;s_+=d7w;var t7=m1n;t7+=a86;t7+=E9_;if($(e[v1a])[t7](s_)){var a_=K9w;a_+=H0b;e[B8L]();dte[a_]();}});}var self={close:function(dte,callback){hide$1(dte,callback);},conf:{offsetAni:a1d,windowPadding:a1d},destroy:function(dte){k55.j5b();if(displayed$1){hide$1(dte);}},init:function(dte){init();return self;},node:function(dte){var q1=o9N;q1+=H0E;q1+=J5I;q1+=H0E;return dom[q1][D0wIj[140995]];},open:function(dte,append,callback){var u13="tach";var a$=D0wIj[394663];a$+=l0X;a$+=f5K;a$+=D0wIj[482911];var b9=D0wIj[394663];b9+=b07;b9+=B1h;k55.c6l();b9+=S4n;var Z_=N8S;Z_+=u13;var content=dom[G_g];content[e1Y]()[Z_]();content[b9](append)[a$](dom[G35]);show$1(dte,callback);}};var DataTable$5=$[D0wIj.I9n][z2];function add(cfg,after,reorder){var y03="reverse";var B5l="uires a `name` option";var i0k="Error adding fi";var X5Z="mode";var b8e="urce";var c4x="eld. The field req";var W6G='Error adding field \'';var k0n="h this name";var T2q="multiRese";k55.c6l();var d__='initField';var Z_Z="\'. A field already exists wit";var q8W="_dataSo";var Y7n="ditFie";var s6=H4J;s6+=B1h;s6+=a86;s6+=D0wIj[482911];var y1=D1C;y1+=a86;y1+=E9_;y1+=B7_;var R9=t7e;R9+=D0wIj[482911];var N0=q8W;N0+=b8e;if(reorder === void D0wIj[140995]){reorder=y_h;}if(Array[k9E](cfg)){var H_=f8i;H_+=H9v;if(after !== undefined){cfg[y03]();}for(var _i=D0wIj[140995],cfg_1=cfg;_i < cfg_1[G8t];_i++){var w$=D0wIj[394663];w$+=D0wIj[482911];w$+=D0wIj[482911];var cfgDp=cfg_1[_i];this[w$](cfgDp,after,D0wIj[203584]);}this[N2G](this[H_]());return this;}var name=cfg[T$O];if(name === undefined){var d4=i0k;d4+=c4x;d4+=B5l;throw new Error(d4);}if(this[p4i][Z7H][name]){var p1=Z_Z;p1+=k0n;throw new Error(W6G + name + p1);}this[N0](d__,cfg);var editorField=new Editor[R9](cfg,this[y1][s6],this);this[p4i][Z7H][name]=editorField;if(after === undefined){var l3=f8i;l3+=D0wIj[482911];l3+=V$8;this[p4i][l3][Z2L](name);}else if(after === m8f){var I5=D0wIj.R_0;I5+=V1O;this[p4i][I5][b_h](name);}else {var y2=r9C;y2+=B1h;y2+=H0E;var idx=$[U0g](after,this[p4i][B5O]);this[p4i][y2][f90](idx + b6E,D0wIj[140995],name);}if(this[p4i][X5Z]){var p5=a3m;p5+=v7g;var P3=T2q;P3+=u7s;var i$=B1h;i$+=Y7n;i$+=w7n;i$+=p4i;var editFields=this[p4i][i$];editorField[P3]();$[p5](editFields,function(idSrc,editIn){var z0o="lF";var I40="romDa";var G9=N8S;k55.j5b();G9+=T0U;var L1=D0wIj[482911];L1+=D0wIj[394663];L1+=u7s;L1+=D0wIj[394663];var value;if(editIn[L1]){var j7=D0wIj[482911];j7+=D0wIj[394663];j7+=u7s;j7+=D0wIj[394663];var n$=I7B;n$+=z0o;n$+=I40;n$+=Y6m;value=editorField[n$](editIn[j7]);}editorField[U6n](idSrc,value !== undefined?value:editorField[G9]());});}if(reorder !== D0wIj[203584]){var M5=r9C;M5+=V$8;this[N2G](this[M5]());}return this;}function ajax(newAjax){var L7=h64;L7+=D0wIj[394663];L7+=V0h;if(newAjax){this[p4i][b0E]=newAjax;return this;}return this[p4i][L7];}function background(){var E8b='blur';var x5J="onBackground";var y3=P_V;y3+=D0wIj.R_0;y3+=w4l;var t2=T0U;t2+=v4p;t2+=b0W;t2+=P1j;var onBackground=this[p4i][g1T][x5J];if(typeof onBackground === t2){onBackground(this);}else if(onBackground === E8b){this[Q83]();}else if(onBackground === y3){var n8=P_V;n8+=D0wIj.R_0;n8+=p4i;n8+=B1h;this[n8]();}else if(onBackground === w5g){this[s_U]();}return this;}function blur(){this[b$e]();return this;}function bubble(cells,fieldNames,showIn,opts){var o4X='individual';var M3V="boolea";var c6=N6v;c6+=F9E;c6+=N6v;c6+=y1E;var Z$=M3V;Z$+=f5K;var P$=k3x;P$+=b0W;P$+=J5B;var _this=this;if(showIn === void D0wIj[140995]){showIn=y_h;}var that=this;if(this[P$](function(){var e_=Z$i;e_+=N6v;e_+=N6v;e_+=D5F;that[e_](cells,fieldNames,opts);})){return this;}if($[C20](fieldNames)){opts=fieldNames;fieldNames=undefined;showIn=y_h;}else if(typeof fieldNames === Z$){showIn=fieldNames;fieldNames=undefined;opts=undefined;}if($[C20](showIn)){opts=showIn;showIn=y_h;}if(showIn === undefined){showIn=y_h;}opts=$[z7O]({},this[p4i][A6S][L7P],opts);var editFields=this[n2r](o4X,cells,fieldNames);this[Q9h](cells,editFields,c6,opts,function(){var H7u="bo";var H_J='"><div></div></div>';var g7Z="\" t";var E44="prepend";var T4v="onca";var S5f="</div";var R1j="lass=";var O0w="pointer";var f17=" sc";var u9k="\"DTE_Processing_Indicator\"><sp";var O_O='attach';var c58="bg";var u6O="_preopen";var b8Z="appendT";var q0f='resize.';var Y3d="v cla";var c6Q="bubbleNodes";var D3g="chi";var h0U="roll.";var I1y=" class=\"";var D5=a8S;D5+=N6v;D5+=D5F;var K7=D0wIj.R_0;K7+=f5K;var G5=D1C;G5+=a86;G5+=G7x;G5+=F0k;var I3=D0wIj[394663];I3+=D0wIj[482911];I3+=D0wIj[482911];var f2=Z8Q;f2+=j4b;var Z6=u7s;Z6+=r4D;Z6+=D5F;var A1=J_K;A1+=D40;var Z8=D0wIj[482911];Z8+=k6Z;var Y3=D0wIj[394663];Y3+=b1l;Y3+=b1l;Y3+=D0T;var y7=D3g;y7+=a86;y7+=U$s;var R_=g10;R_+=P1Q;R_+=c9g;var x_=U_g;x_+=Y3d;x_+=p4i;x_+=N9H;var c3=S5f;c3+=L70;var m5=x2X;m5+=R1j;m5+=u9k;m5+=D8W;var t4=g7Z;t4+=s5N;t4+=B1h;t4+=a_U;var M9=O9i;M9+=L70;var c1=f2K;c1+=U8Z;c1+=I1y;var V0=O9i;V0+=L70;var d6=D1C;d6+=T4v;d6+=u7s;var h3=f17;h3+=h0U;var n6=D0wIj.R_0;n6+=f5K;var namespace=_this[J3R](opts);var ret=_this[u6O](P3w);if(!ret){return _this;}$(window)[n6](q0f + namespace + h3 + namespace,function(){k55.c6l();_this[z_q]();});var nodes=[];_this[p4i][c6Q]=nodes[d6][X2b](nodes,pluck(editFields,O_O));var classes=_this[H6i][L7P];var backgroundNode=$(m9e + classes[c58] + H_J);var container=$(m9e + classes[x3Y] + O9j + m9e + classes[U4$] + V0 + c1 + classes[x81] + M9 + m9e + classes[G35] + t4 + _this[B8M][G35] + Y4D + m5 + c3 + L_Z + x_ + classes[O0w] + Y4D + R_);if(showIn){var c4=H7u;c4+=J5B;var U_=b8Z;U_+=D0wIj.R_0;var F4=N6v;F4+=k0e;var A4=D0wIj[394663];A4+=l0X;A4+=f5K;A4+=I4c;container[A4](F4);backgroundNode[U_](c4);}var liner=container[e1Y]()[P2F](D0wIj[140995]);var tableNode=liner[e1Y]();var closeNode=tableNode[y7]();liner[Y3](_this[Z8][F_1]);tableNode[E44](_this[s9Y][A1]);if(opts[n6s]){var D$=D0wIj[482911];D$+=k6Z;var b5=T$R;b5+=B1h;b5+=W_K;b5+=S4n;liner[b5](_this[D$][h8k]);}if(opts[Z6]){var I8=D0wIj.M_A;I8+=D0wIj[159052];liner[E44](_this[I8][K93]);}if(opts[f2]){tableNode[R0y](_this[s9Y][v82]);}var finish=function(){var E5E="earDynamicInfo";var y8m="lose";var A2=D1C;A2+=y8m;A2+=D0wIj[482911];var B3=h21;B3+=E5E;_this[B3]();_this[k4q](A2,[P3w]);};var pair=$()[I3](container)[a5B](backgroundNode);_this[u_a](function(submitComplete){_this[C_V](pair,{opacity:D0wIj[140995]},function(){var w3E="size.";k55.c6l();var E4h="ll.";if(this === container[D0wIj[140995]]){var h1=f17;h1+=O9A;h1+=E4h;var U0=L3v;U0+=w3E;pair[Z$n]();$(window)[A2F](U0 + namespace + h1 + namespace);finish();}});});backgroundNode[P1j](G5,function(){_this[Q83]();});closeNode[K7](x1I,function(){_this[f8N]();});_this[z_q]();_this[j8s](D5,D0wIj[203584]);var opened=function(){k55.c6l();var V4j="deFields";var m68="ubb";var V2=N6v;V2+=m68;V2+=a86;V2+=B1h;var c0=B_0;c0+=h3b;c0+=D0wIj.m1R;var i6=c7L;i6+=F9E;i6+=p4i;var v8=o5M;v8+=D1C;v8+=z3W;v8+=V4j;var u_=F$D;u_+=D0wIj.F5u;u_+=p4i;_this[u_](_this[p4i][v8],opts[i6]);_this[c0](R6_,[V2,_this[p4i][X70]]);};_this[C_V](pair,{opacity:b6E},function(){if(this === container[D0wIj[140995]]){opened();}});});return this;}function bubbleLocation(location){var M7N="bubbleLoc";var p3=M7N;p3+=D0wIj[394663];p3+=m2s;p3+=f5K;if(!location){return this[p4i][M39];}this[p4i][p3]=location;this[z_q]();return this;}function bubblePosition(){var w0m="ef";var v9W="E_Bubble";var s6S='below';var j4R="eBot";var s1E="bottom";var s5R="leNodes";var H37="elo";var D5i="eight";var V6Z="bott";var U_2="scro";var i64="tom";var T7r="nerH";var k$P="outerHeig";var l6t='left';var Y4t="oveCla";var s_6="bbleBo";var p$z="ft";var w7u="right";var b3i="ig";var R7f="Liner";var q9Q="div.DTE_Bubble_";var k3H="botto";var J5Z="bubbleBottom";var x2B='top';var p_N="toggleClass";var G8x="ott";var M7E="v.DT";var b4q="outerWidth";var Y2=J1Y;Y2+=s84;var d_=N6v;d_+=G8x;d_+=D0wIj.R_0;d_+=D0wIj[159052];var l_=N6v;l_+=l6b;l_+=L8d;var U2=V6Z;U2+=D0wIj.R_0;U2+=D0wIj[159052];var Z9=k3H;Z9+=D0wIj[159052];var T_=k3H;T_+=D0wIj[159052];var T8=r8C;T8+=j4R;T8+=i64;var n7=D0wIj[394663];n7+=B9a;n7+=D0wIj.R_0;var I$=U_2;I$+=d20;I$+=f$n;var T2=o9N;T2+=j1O;T2+=D0wIj[482911];T2+=n16;var X4=k$P;X4+=a7L;X4+=u7s;var N6=D5F;N6+=p$z;var d9=a86;d9+=n8u;var z9=D5F;z9+=t6Z;var c5=H0E;c5+=b3i;c5+=V77;var y8=a86;y8+=B1h;y8+=T0U;k55.c6l();y8+=u7s;var T4=u7s;T4+=D0wIj.R_0;T4+=b1l;var b8=a3m;b8+=D1C;b8+=a7L;var I4=Z$i;I4+=D9u;I4+=s5R;var i3=q9Q;i3+=R7f;var u8=G80;u8+=M7E;u8+=v9W;var wrapper=$(u8);var liner=$(i3);var nodes=this[p4i][I4];var position={bottom:D0wIj[140995],left:D0wIj[140995],right:D0wIj[140995],top:D0wIj[140995]};$[b8](nodes,function(i,nodeIn){var s2h="left";var I0x="offsetHeight";var H9=N6v;H9+=Q1e;var H0=H0E;H0+=E8L;H0+=u7s;var W4=P20;W4+=T0U;W4+=f_E;var pos=$(nodeIn)[W4]();nodeIn=$(nodeIn)[d4T](D0wIj[140995]);position[J1T]+=pos[J1T];position[s2h]+=pos[s2h];position[H0]+=pos[s2h] + nodeIn[H4C];k55.c6l();position[H9]+=pos[J1T] + nodeIn[I0x];});position[T4]/=nodes[G8t];position[y8]/=nodes[G8t];position[c5]/=nodes[z9];position[s1E]/=nodes[d9];var top=position[J1T];var left=(position[N6] + position[w7u]) / z6e;var width=liner[b4q]();var height=liner[X4]();var visLeft=left - width / z6e;var visRight=visLeft + width;var docWidth=$(window)[T2]();var viewportTop=$(window)[I$]();var padding=r2t;var location=this[p4i][M39];var initial=location !== n7?location:this[p4i][T8]?T_:x2B;wrapper[q7L]({left:left,top:initial === Z9?position[U2]:top})[p_N](l_,initial === d_);var curPosition=wrapper[Y2]();if(location === y44){var T5=u7s;T5+=D0wIj.R_0;T5+=b1l;var C8=o5M;C8+=T7r;C8+=D5i;var r6=u7s;r6+=D0wIj.R_0;r6+=b1l;if(liner[G8t] && curPosition[r6] + height > viewportTop + window[C8]){var K$=N6v;K$+=H37;K$+=o9N;var p0=w3q;p0+=Y4t;p0+=p4i;p0+=p4i;var I0=D1C;I0+=p4i;I0+=p4i;wrapper[I0](x2B,top)[p0](K$);this[p4i][J5Z]=D0wIj[203584];}else if(liner[G8t] && curPosition[T5] - height < viewportTop){var R2=Z$i;R2+=s_6;R2+=N5Y;R2+=k6Z;var Y5=D0wIj[394663];Y5+=t_l;Y5+=p4i;var f9=N6v;f9+=G8x;f9+=D0wIj.R_0;f9+=D0wIj[159052];var C7=u7s;C7+=D0wIj.R_0;C7+=b1l;wrapper[q7L](C7,position[f9])[Y5](s6S);this[p4i][R2]=y_h;}}if(visRight + padding > docWidth){var r9=a86;r9+=w0m;r9+=u7s;var diff=visRight - docWidth;liner[q7L](r9,visLeft < padding?-(visLeft - padding):-(diff + padding));}else {liner[q7L](l6t,visLeft < padding?-(visLeft - padding):D0wIj[140995]);}return this;}function buttons(buttonsIn){var i5o="asses";var B3c="onSubmi";var l$=D0wIj[482911];l$+=k6Z;var _this=this;if(buttonsIn === t0V){var q7=Z8Q;q7+=u7s;q7+=B3c;q7+=u7s;var r1=J_K;r1+=H0E;r1+=D0wIj[159052];var G1=D1C;G1+=a86;G1+=i5o;var m7=m4R;m7+=D0wIj[159052];m7+=r4D;buttonsIn=[{action:function(){var B0Y="ubm";var Z0=p4i;Z0+=B0Y;Z0+=j1O;Z0+=u7s;this[Z0]();},text:this[B8M][this[p4i][X70]][m7],className:this[G1][r1][q7]}];}else if(!Array[k9E](buttonsIn)){buttonsIn=[buttonsIn];}$(this[l$][v82])[j7Q]();k55.j5b();$[G5C](buttonsIn,function(i,btn){var F0Q="></button>";var J$q="bIn";var D65='keypress';var N_a="className";var m5t="tabIndex";var D$1="tabin";var q6x="buttonSubmit";var D4=Z$i;D4+=N5Y;D4+=r2U;var W0=P_V;W0+=j1O;W0+=Z74;var R4=D0wIj.R_0;R4+=f5K;var O5=D0wIj.R_0;O5+=f5K;var u2=D0wIj[394663];u2+=N5Y;u2+=H0E;var Q3=Y6m;Q3+=J$q;Q3+=D0wIj[482911];Q3+=L7M;var S2=D$1;S2+=D0wIj[482911];S2+=L7M;var W5=d5R;W5+=V6Y;var R6=d25;R6+=z4d;var V9=T0U;V9+=D0wIj.R_0;V9+=H0E;V9+=D0wIj[159052];var x1=X0_;x1+=F0Q;var E3=u7s;E3+=B1h;k55.c6l();E3+=V0h;E3+=u7s;var e2=R7O;e2+=o5M;e2+=l3E;if(typeof btn === e2){var b$=T0U;b$+=f8i;b$+=D0wIj[159052];btn={action:function(){this[s_U]();},text:btn,className:_this[H6i][b$][q6x]};}var text=btn[E3] || btn[A2T];var action=btn[X70] || btn[D0wIj.I9n];var attr=btn[G6h] || ({});$(x1,{class:_this[H6i][V9][W4f] + (btn[N_a]?o3N + btn[N_a]:R_6)})[E9n](typeof text === R6?text(_this):text || R_6)[W5](S2,btn[Q3] !== undefined?btn[m5t]:D0wIj[140995])[u2](attr)[O5](w_q,function(e){var t_=e8Z;t_+=a7L;k55.c6l();if(e[t_] === m_y && action){var U6=D1C;U6+=D0wIj[394663];U6+=f7W;action[U6](_this);}})[P1j](D65,function(e){var d2=o9N;d2+=J7i;d2+=D1C;d2+=a7L;if(e[d2] === m_y){e[N$I]();}})[R4](W0,function(e){var G1G="eventDefault";var v3=T$R;v3+=G1G;e[v3]();if(action){var O$=H8L;O$+=f7W;action[O$](_this,e);}})[Y2X](_this[s9Y][D4]);});return this;}function clear(fieldName){var p5b="nA";var m9l="ieldNam";var d_G="nArr";var m6=g19;m6+=g0L;var that=this;var sFields=this[p4i][Z7H];if(typeof fieldName === m6){var k1Z=j1O;k1Z+=d_G;k1Z+=D0wIj[394663];k1Z+=H2R;var S3u=T2z;S3u+=u7g;S3u+=D1C;S3u+=B1h;var k8=j1O;k8+=p5b;k8+=T6F;k8+=H2R;that[C3h](fieldName)[R1e]();delete sFields[fieldName];var orderIdx=$[k8](fieldName,this[p4i][B5O]);this[p4i][B5O][S3u](orderIdx,b6E);var includeIdx=$[k1Z](fieldName,this[p4i][E3i]);if(includeIdx !== -b6E){this[p4i][E3i][f90](includeIdx,b6E);}}else {var v_1=K9J;v_1+=m9l;v_1+=B1h;v_1+=p4i;$[G5C](this[v_1](fieldName),function(i,name){that[P7O](name);});}return this;}function close(){var E0U="_clo";var t5x=E0U;t5x+=p4i;t5x+=B1h;this[t5x](D0wIj[203584]);return this;}function create(arg1,arg2,arg3,arg4){var j_c="rudArgs";var h13="_disp";var H1o="onClass";var c9n="layR";var c5j=C3h;c5j+=p4i;var J9I=h13;J9I+=c9n;J9I+=B1h;J9I+=B5O;var i$C=N_J;i$C+=Y8n;i$C+=H1o;var J$T=J_K;J$T+=D40;var f4_=q_M;f4_+=G3J;var Z2_=D0wIj[159052];Z2_+=D0wIj.R_0;Z2_+=D0wIj[482911];Z2_+=B1h;var H1F=k3x;H1F+=D1C;H1F+=j_c;var V9j=H4J;V9j+=B1h;V9j+=n1h;var _this=this;var that=this;var sFields=this[p4i][V9j];var count=b6E;if(this[s95](function(){var h$n="crea";var Y2s=h$n;Y2s+=e_t;that[Y2s](arg1,arg2,arg3,arg4);})){return this;}if(typeof arg1 === g8r){count=arg1;arg1=arg2;arg2=arg3;}this[p4i][X09]={};k55.c6l();for(var i=D0wIj[140995];i < count;i++){var C1Y=T0U;C1Y+=S4r;var Z2q=p_F;Z2q+=i7I;Z2q+=n_8;Z2q+=p4i;this[p4i][Z2q][i]={fields:this[p4i][C1Y]};}var argOpts=this[H1F](arg1,arg2,arg3,arg4);this[p4i][Z2_]=H_5;this[p4i][X70]=k0P;this[p4i][f4_]=m8f;this[s9Y][J$T][O_C][K6T]=G82;this[i$C]();this[J9I](this[c5j]());$[G5C](sFields,function(name,fieldIn){var c0b="multiReset";var K9U=w4l;K9U+=u7s;var F3D=D0wIj[482911];F3D+=B1h;F3D+=T0U;var def=fieldIn[F3D]();fieldIn[c0b]();for(var i=D0wIj[140995];i < count;i++){fieldIn[U6n](i,def);}fieldIn[K9U](def);});this[k4q](G69,m8f,function(){var O1Z="_assembleMai";var G0u="maybeOpen";var Z0f=f$n;Z0f+=M$D;var C5l=O1Z;k55.c6l();C5l+=f5K;_this[C5l]();_this[J3R](argOpts[Z0f]);argOpts[G0u]();});return this;}function undependent(parent){var L_j="sArray";var z81="undependent";var v5D=P20;v5D+=T0U;var k62=H4J;k62+=B1h;k62+=w7n;var N53=j1O;k55.j5b();N53+=L_j;if(Array[N53](parent)){for(var i=D0wIj[140995],ien=parent[G8t];i < ien;i++){this[z81](parent[i]);}return this;}$(this[k62](parent)[B0q]())[v5D](H5U);return this;}function dependent(parent,url,optsIn){var P$W='POST';var Y$$="xtend";var L_7="dependent";var F_4=Y3t;F_4+=B1h;var A$h=B1h;A$h+=Y$$;var _this=this;if(Array[k9E](parent)){var S8T=a86;S8T+=N$N;S8T+=n16;for(var i=D0wIj[140995],ien=parent[S8T];i < ien;i++){this[L_7](parent[i],url,optsIn);}return this;}var that=this;var parentField=this[C3h](parent);var ajaxOpts={dataType:U4F,type:P$W};var opts=$[A$h]({},{data:m8f,event:Z_v,postUpdate:m8f,preUpdate:m8f},optsIn);var update=function(json){k55.j5b();var Q_Z="preUpdate";var p05="postUpdate";var T3z="cessi";var e$r="Upd";var B7V="stU";var h1U='show';var W87='hide';var C7V="updat";var g__="pdat";var D0n='message';var h5L=Q3l;h5L+=T3z;h5L+=f5K;h5L+=l3E;var g2N=D0wIj[482911];g2N+=z_C;g2N+=a86;g2N+=B1h;var m6r=E8G;m6r+=y1E;var l_Y=p$q;l_Y+=T0_;var N6R=C7V;N6R+=B1h;var G7Y=B1h;G7Y+=F_Q;G7Y+=H0E;if(opts[Q_Z]){var p98=g6$;p98+=e$r;p98+=d5R;p98+=B1h;opts[p98](json);}$[G5C]({errors:G7Y,labels:G7W,messages:D0n,options:N6R,values:l_Y},function(jsonProp,fieldFn){k55.j5b();if(json[jsonProp]){$[G5C](json[jsonProp],function(fieldIn,valIn){var X6c=H4J;X6c+=l6b;X6c+=D0wIj[482911];that[X6c](fieldIn)[fieldFn](valIn);});}});$[G5C]([W87,h1U,m6r,g2N],function(i,key){if(json[key]){var T2i=D85;T2i+=b1P;that[key](json[key],json[T2i]);}});if(opts[p05]){var A9a=W1G;A9a+=B7V;A9a+=g__;A9a+=B1h;opts[A9a](json);}parentField[h5L](D0wIj[203584]);};$(parentField[F_4]())[P1j](opts[D5W] + H5U,function(e){var T7h="arget";var t7t="bjec";var u_d="tF";var Y85="values";var l7E=H0E;l7E+=D0wIj.R_0;l7E+=o9N;l7E+=p4i;var m7p=D0wIj[482911];m7p+=w5l;k55.c6l();var D1i=k14;D1i+=u_d;D1i+=n_8;D1i+=p4i;var l$d=p_F;l$d+=i7I;l$d+=S4r;var A3n=H0E;A3n+=D0wIj.R_0;A3n+=V7f;var V2W=u7s;V2W+=T7h;if($(parentField[B0q]())[t03](e[V2W])[G8t] === D0wIj[140995]){return;}parentField[t7m](y_h);var data={};data[A3n]=_this[p4i][l$d]?pluck(_this[p4i][D1i],m7p):m8f;data[Q1x]=data[l7E]?data[i9j][D0wIj[140995]]:m8f;data[Y85]=_this[F7D]();if(opts[F0E]){var D$J=D0wIj[482911];D$J+=d5R;D$J+=D0wIj[394663];var ret=opts[D$J](data);if(ret){data=ret;}}if(typeof url === D0wIj[253540]){var r1w=D1C;r1w+=D0wIj[394663];r1w+=a86;r1w+=a86;var o=url[r1w](_this,parentField[F7D](),data,update,e);if(o){var Z$$=D0wIj.R_0;Z$$+=t7t;Z$$+=u7s;if(typeof o === Z$$ && typeof o[L0L] === D0wIj[253540]){o[L0L](function(resolved){if(resolved){update(resolved);}});}else {update(o);}}}else {var e4p=i1v;e4p+=B1h;e4p+=S4n;if($[C20](url)){var B6L=B1h;B6L+=h6V;B6L+=D0wIj[482911];$[B6L](ajaxOpts,url);}else {ajaxOpts[l5_]=url;}$[b0E]($[e4p](ajaxOpts,{data:data,success:update}));}});return this;}function destroy(){var Y7C="oller";var Z5b="uniq";var V7K='destroyEditor';var N0f="cle";var P7V="displayContr";var J_Y=".dt";var I_J=Z5b;I_J+=q0o;var J18=J_Y;J18+=B1h;var D_I=P7V;D_I+=Y7C;var s$_=N0f;s$_+=D0wIj[394663];s$_+=H0E;var t6P=A0e;t6P+=s7L;if(this[p4i][t6P]){this[G35]();}this[s$_]();if(this[p4i][A_k]){var h_W=D0wIj[394663];h_W+=b1l;h_W+=X3g;var B2n=N6v;B2n+=D0wIj.R_0;B2n+=J5B;$(B2n)[h_W](this[p4i][A_k]);}var controller=this[p4i][D_I];if(controller[R1e]){controller[R1e](this);}$(document)[A2F](J18 + this[p4i][I_J]);$(document)[h8s](V7K,[this]);this[s9Y]=m8f;this[p4i]=m8f;}function disable(name){var u6j="Names";var A3S=g8p;k55.j5b();A3S+=u6j;var that=this;$[G5C](this[A3S](name),function(i,n){var I2h=T0U;I2h+=w9q;I2h+=D0wIj[482911];that[I2h](n)[L3m]();});return this;}function display(showIn){var Y0n="ayed";var P2G=D0wIj.R_0;P2G+=b1l;P2G+=B1h;k55.c6l();P2G+=f5K;if(showIn === undefined){var a7k=D0wIj[482911];a7k+=b6z;a7k+=a86;a7k+=Y0n;return this[p4i][a7k];}return this[showIn?P2G:m4Z]();}function displayed(){var Y6d="elds";var M0N=H4J;k55.c6l();M0N+=Y6d;return $[K3u](this[p4i][M0N],function(fieldIn,name){k55.j5b();var k7X="splaye";var d3m=G80;d3m+=k7X;d3m+=D0wIj[482911];return fieldIn[d3m]()?name:m8f;});}function displayNode(){var D$5="ntrolle";var l2G=a5a;l2G+=D0wIj.R_0;l2G+=D$5;l2G+=H0E;return this[p4i][l2G][B0q](this);}function edit(items,arg1,arg2,arg3,arg4){var n4A="cru";var x_m="mai";var A74="dArg";var p$u=x_m;p$u+=f5K;var D9m=H4J;D9m+=l6b;D9m+=a4D;var g6T=k3x;g6T+=B1h;g6T+=D0wIj[482911];g6T+=r4D;var W24=k3x;W24+=n4A;W24+=A74;W24+=p4i;var _this=this;var that=this;if(this[s95](function(){k55.c6l();that[p_F](items,arg1,arg2,arg3,arg4);})){return this;}var argOpts=this[W24](arg1,arg2,arg3,arg4);this[g6T](items,this[n2r](D9m,items),p$u,argOpts[h8f],function(){var R6R="mayb";var s$e=R6R;s$e+=k_7;k55.j5b();var P2Z=D0wIj.R_0;P2Z+=Q3a;P2Z+=p4i;_this[o4Q]();_this[J3R](argOpts[P2Z]);argOpts[s$e]();});return this;}function enable(name){var P8Y=B1h;P8Y+=D0wIj[394663];P8Y+=D1C;P8Y+=a7L;k55.j5b();var that=this;$[P8Y](this[j5S](name),function(i,n){var o7O=v5A;o7O+=d1o;var v6W=T0U;v6W+=Y_s;v6W+=w7n;that[v6W](n)[o7O]();});return this;}function error$1(name,msg){var l2z="rmErro";var n6f="_mess";var z52="epla";var v9O="ible";var R8q=D0wIj[482911];R8q+=D0wIj.R_0;R8q+=D0wIj[159052];var wrapper=$(this[R8q][x3Y]);if(msg === undefined){var y3$=E86;y3$+=v2$;y3$+=v9O;var y9O=J_K;y9O+=l2z;y9O+=H0E;var N$R=D0wIj[482911];N$R+=D0wIj.R_0;N$R+=D0wIj[159052];var c1n=n6f;c1n+=F7I;c1n+=B1h;this[c1n](this[N$R][F_1],name,y_h,function(){var T0B='inFormError';var f1_="ggleClas";var p8i=p3o;p8i+=f1_;p8i+=p4i;k55.c6l();wrapper[p8i](T0B,name !== undefined && name !== R_6);});if(name && !$(this[s9Y][y9O])[v2$](y3$)){var X40=H0E;X40+=z52;X40+=e1t;alert(name[X40](/<br>/g,t9K));}this[p4i][M5w]=name;}else {this[C3h](name)[E3Q](msg);}k55.c6l();return this;}function field(name){var R5_="- ";var z3C="Unknown";var e_c=" field name ";var B3y=M5l;B3y+=a86;B3y+=D0wIj[482911];B3y+=p4i;var sFields=this[p4i][B3y];if(!sFields[name]){var m53=z3C;m53+=e_c;m53+=R5_;throw new Error(m53 + name);}return sFields[name];}function fields(){var k_A=H4J;k_A+=M5A;k_A+=p4i;var d1$=F74;d1$+=b1l;return $[d1$](this[p4i][k_A],function(fieldIn,name){return name;});}function file(name,id){var K55="d ";var N8O="Unknown file i";var s3W=" in table";var tableFromFile=this[z6u](name);var fileFromTable=tableFromFile[id];if(!fileFromTable){var i2_=s3W;i2_+=F$a;var r_4=N8O;r_4+=K55;throw new Error(r_4 + id + i2_ + name);}return tableFromFile[id];}function files(name){var G7K="Unknown file tabl";var V18="e name: ";if(!name){return Editor[z6u];}var editorTable=Editor[z6u][name];if(!editorTable){var w9R=G7K;w9R+=V18;throw new Error(w9R + name);}return editorTable;}function get(name){var that=this;if(!name){name=this[Z7H]();}if(Array[k9E](name)){var j5r=a3m;j5r+=v7g;var out_1={};$[j5r](name,function(i,n){k55.c6l();var L8V=T0U;L8V+=j1O;L8V+=l6b;L8V+=D0wIj[482911];out_1[n]=that[L8V](n)[d4T]();});return out_1;}return this[C3h](name)[d4T]();}function hide(names,animate){var s_W="ames";var K2l=g8p;K2l+=t71;K2l+=s_W;var k1D=A_l;k1D+=a7L;var that=this;$[k1D](this[K2l](names),function(i,n){k55.j5b();var I51=T0U;I51+=w9q;I51+=D0wIj[482911];that[I51](n)[H_F](animate);});k55.j5b();return this;}function ids(includeHash){if(includeHash === void D0wIj[140995]){includeHash=D0wIj[203584];}return $[K3u](this[p4i][X09],function(editIn,idSrc){k55.j5b();return includeHash === y_h?v5Z + idSrc:idSrc;});}function inError(inNames){var Q_k=D5F;k55.j5b();Q_k+=f5K;Q_k+=l3E;Q_k+=n16;if(this[p4i][M5w]){return y_h;}var names=this[j5S](inNames);for(var i=D0wIj[140995],ien=names[Q_k];i < ien;i++){if(this[C3h](names[i])[E34]()){return y_h;}}return D0wIj[203584];}function inline(cell,fieldName,opts){var U7m="inline";var Z4f="isPlainObjec";var J05='div.DTE_Field';var T1G="ow inline at a time";var f9t="_d";var N2B="ataSo";var G4l="ividual";var c2s="Cannot edit more than one r";var A49=h0G;A49+=u7s;var m1F=g5s;m1F+=w5E;m1F+=a7L;var x2M=C7x;x2M+=F7S;var g_v=F0k;g_v+=P9I;g_v+=p4i;var Y68=H0O;Y68+=G4l;var E13=f9t;E13+=N2B;E13+=A1y;E13+=B1h;var g86=L7M;g86+=u7s;g86+=B1h;g86+=S4n;var M4m=Z4f;M4m+=u7s;var _this=this;var that=this;if($[M4m](fieldName)){opts=fieldName;fieldName=undefined;}opts=$[g86]({},this[p4i][A6S][U7m],opts);var editFields=this[E13](Y68,cell,fieldName);var keys=Object[g_v](editFields);if(keys[G8t] > b6E){var W_3=c2s;W_3+=T1G;throw new Error(W_3);}var editRow=editFields[keys[D0wIj[140995]]];var hosts=[];for(var _i=D0wIj[140995],_a=editRow[x2M];_i < _a[G8t];_i++){var G87=b1l;G87+=F9E;G87+=p4i;G87+=a7L;var row=_a[_i];hosts[G87](row);}if($(J05,hosts)[m1F]){return this;}if(this[s95](function(){var z5X="inl";var Z9c=z5X;Z9c+=o5M;Z9c+=B1h;that[Z9c](cell,fieldName,opts);})){return this;}this[A49](cell,editFields,P1i,opts,function(){k55.c6l();_this[f9q](editFields,opts);});return this;}function inlineCreate(insertPoint,opts){var H6x="odifier";var Z5C='fakeRow';var n5J="editFi";var e1p="inObjec";var j6r="isPla";var A9A=B_0;A9A+=r0u;var V$r=n5J;V$r+=M5A;V$r+=p4i;var L3T=j1O;L3T+=f5K;L3T+=u7g;L3T+=v3U;var s5x=i1v;s5x+=B1h;s5x+=f5K;s5x+=D0wIj[482911];var I$s=D0wIj[159052];I$s+=H6x;var D4p=D1C;D4p+=J22;D4p+=u7s;D4p+=B1h;var x1X=D0wIj[159052];x1X+=D0wIj[394663];x1X+=j1O;x1X+=f5K;var A65=D0wIj[159052];A65+=D0wIj.R_0;A65+=D0wIj[482911];A65+=B1h;var L5a=M5l;L5a+=n1h;var k42=j6r;k42+=e1p;k42+=u7s;var _this=this;if($[k42](insertPoint)){opts=insertPoint;insertPoint=m8f;}if(this[s95](function(){k55.j5b();_this[x7k](insertPoint,opts);})){return this;}$[G5C](this[p4i][L5a],function(name,fieldIn){var H0L="ltiSe";var M8k="tiRe";var q91=N8S;q91+=T0U;var e8e=N8S;e8e+=T0U;var M4N=D0wIj[159052];M4N+=F9E;M4N+=H0L;M4N+=u7s;var Q0q=D0wIj[159052];Q0q+=e9$;Q0q+=M8k;Q0q+=f_E;fieldIn[Q0q]();fieldIn[M4N](D0wIj[140995],fieldIn[e8e]());fieldIn[f_E](fieldIn[q91]());});this[p4i][A65]=x1X;this[p4i][X70]=D4p;this[p4i][I$s]=m8f;this[p4i][X09]=this[n2r](Z5C,insertPoint);opts=$[s5x]({},this[p4i][A6S][L3T],opts);this[Y2b]();this[f9q](this[p4i][V$r],opts,function(){var X6$="keRowEnd";var y_c=T0U;y_c+=D0wIj[394663];y_c+=X6$;var H5Z=J6L;H5Z+=e1t;_this[H5Z](y_c);});this[A9A](G69,m8f);return this;}function message(name,msg){var o_l="sage";if(msg === undefined){var v0_=D0wIj[482911];v0_+=D0wIj.R_0;v0_+=D0wIj[159052];this[h5T](this[v0_][h8k],name);}else {var l3e=t1h;l3e+=o_l;this[C3h](name)[l3e](msg);}return this;}function mode(modeIn){var Z7M='Not currently in an editing mode';var j$E='Changing from create mode is not supported';var y9d=C1u;y9d+=g$N;y9d+=f5K;var B7P=D0wIj[394663];B7P+=C9I;B7P+=f5K;if(!modeIn){var m3Q=C1u;m3Q+=j1O;m3Q+=P1j;return this[p4i][m3Q];}if(!this[p4i][B7P]){throw new Error(Z7M);}else if(this[p4i][y9d] === k0P && modeIn !== k0P){throw new Error(j$E);}k55.j5b();this[p4i][X70]=modeIn;return this;}function modifier(){k55.j5b();return this[p4i][T8Y];}function multiGet(fieldNames){var c26=D0wIj[159052];c26+=h9r;c26+=p6Q;var that=this;if(fieldNames === undefined){var v8G=T0U;v8G+=j1O;v8G+=B1h;v8G+=n1h;fieldNames=this[v8G]();}if(Array[k9E](fieldNames)){var out_2={};$[G5C](fieldNames,function(i,name){out_2[name]=that[C3h](name)[w2Z]();});return out_2;}return this[C3h](fieldNames)[c26]();}function multiSet(fieldNames,valIn){var that=this;if($[C20](fieldNames) && valIn === undefined){var r3J=B1h;r3J+=D0wIj[394663];r3J+=D1C;r3J+=a7L;$[r3J](fieldNames,function(name,value){var o$z="tiS";var e$i=Z78;e$i+=a86;e$i+=o$z;e$i+=c6i;var E4$=T0U;k55.j5b();E4$+=j1O;E4$+=B1h;E4$+=w7n;that[E4$](name)[e$i](value);});}else {var G2c=D0wIj[159052];G2c+=F9E;G2c+=a86;G2c+=s7S;var l2h=T0U;l2h+=Y_s;l2h+=w7n;this[l2h](fieldNames)[G2c](valIn);}k55.c6l();return this;}function node(name){var S2V=D0wIj[159052];S2V+=Y5b;k55.j5b();var that=this;if(!name){var O27=r9C;O27+=V$8;name=this[O27]();}return Array[k9E](name)?$[S2V](name,function(n){var D8C=f5K;D8C+=D0wIj.R_0;D8C+=D0wIj[482911];D8C+=B1h;return that[C3h](n)[D8C]();}):this[C3h](name)[B0q]();}function off(name,fn){$(this)[A2F](this[Y3J](name),fn);return this;}function on(name,fn){var g29="entName";var T_l=k3x;T_l+=B1h;T_l+=p$q;T_l+=g29;k55.c6l();$(this)[P1j](this[T_l](name),fn);return this;}function one(name,fn){var m1K=D0wIj.R_0;m1K+=f5K;m1K+=B1h;$(this)[m1K](this[Y3J](name),fn);return this;}function open(){var b$I="loseReg";var x47="reopen";var i63="ostopen";var r1U="_displayReord";var E5K="_nestedOpen";var s3L=d8U;s3L+=i63;var y9D=f5K;y9D+=B7_;y9D+=u7s;var x1v=x3K;x1v+=j1O;x1v+=V1u;x1v+=M$D;var g5X=k3x;g5X+=b1l;g5X+=x47;k55.c6l();var W8k=k3x;W8k+=D1C;W8k+=b$I;var T_R=r1U;T_R+=V$8;var _this=this;this[T_R]();this[W8k](function(){var E74="dClose";var n4r="neste";k55.j5b();var l1A=k3x;l1A+=n4r;l1A+=E74;_this[l1A](function(){var m3K=D0wIj[159052];m3K+=D0wIj[394663];k55.j5b();m3K+=j1O;m3K+=f5K;var u6$=P_V;u6$+=L0W;u6$+=B1h;u6$+=D0wIj[482911];_this[n$T]();_this[k4q](u6$,[m3K]);});});var ret=this[g5X](H_5);if(!ret){return this;}this[E5K](function(){var B2b=V5M;B2b+=P1j;var b_8=k3x;b_8+=B1h;b_8+=r0u;var J1S=B1h;J1S+=D0wIj[482911];J1S+=r28;var B38=r9C;B38+=V$8;var k03=F74;k03+=b1l;_this[u4R]($[k03](_this[p4i][B38],function(name){k55.c6l();return _this[p4i][Z7H][name];}),_this[p4i][J1S][b5m]);_this[b_8](R6_,[H_5,_this[p4i][B2b]]);},this[p4i][x1v][y9D]);this[s3L](H_5,D0wIj[203584]);return this;}function order(setIn){var I_x="sort";var C32='All fields, and no additional fields, must be provided for ordering.';var s6s="sli";var j04="slic";var V0U=i1v;V0U+=v5A;V0U+=D0wIj[482911];var V2Z=s6s;V2Z+=e1t;var b8N=p4i;b8N+=D0wIj.R_0;b8N+=H0E;b8N+=u7s;var j2j=s6s;j2j+=e1t;var f3$=v5h;f3$+=H2R;var w85=t_y;w85+=u7s;w85+=a7L;if(!setIn){var u4b=D0wIj.R_0;u4b+=H0E;u4b+=N8S;u4b+=H0E;return this[p4i][u4b];}if(arguments[w85] && !Array[f3$](setIn)){var K2D=D1C;K2D+=K7O;var p4z=j04;p4z+=B1h;setIn=Array[l_j][p4z][K2D](arguments);}if(this[p4i][B5O][j2j]()[b8N]()[y4f](d_J) !== setIn[V2Z]()[I_x]()[y4f](d_J)){throw new Error(C32);}$[V0U](this[p4i][B5O],setIn);this[N2G]();return this;}function remove(items,arg1,arg2,arg3,arg4){var e34='initRemove';var i5X='data';var i6z="_crudArgs";var H3f='fields';var t0w="isplay";var N7i=f5K;N7i+=D0wIj.R_0;N7i+=D0wIj[482911];N7i+=B1h;var i$l=f5K;i$l+=P1j;i$l+=B1h;var X$e=D0wIj[482911];X$e+=t0w;var C6q=p4i;C6q+=u7s;C6q+=H2R;C6q+=D5F;var E9u=D0wIj[394663];E9u+=Y8n;E9u+=P1j;var R_F=a86;R_F+=v5A;R_F+=w5E;R_F+=a7L;var S9F=u7s;S9F+=d1o;var _this=this;var that=this;if(this[s95](function(){that[h5u](items,arg1,arg2,arg3,arg4);})){return this;}if(!items && !this[p4i][S9F]){items=r2s;}if(items[R_F] === undefined){items=[items];}var argOpts=this[i6z](arg1,arg2,arg3,arg4);var editFields=this[n2r](H3f,items);this[p4i][E9u]=F8m;this[p4i][T8Y]=items;this[p4i][X09]=editFields;this[s9Y][u7M][C6q][X$e]=i$l;this[Y2b]();this[k4q](e34,[pluck(editFields,N7i),pluck(editFields,i5X),items],function(){var G5l="ultiRemove";var m1P=J6f;m1P+=G5l;var l_4=B_0;k55.j5b();l_4+=h3b;l_4+=D0wIj.m1R;_this[l_4](m1P,[editFields,items],function(){var x2g="yb";var z5J=T0U;z5J+=v6x;z5J+=F9E;z5J+=p4i;var o88=F74;o88+=x2g;o88+=k_7;var P1m=f$n;P1m+=M$D;_this[o4Q]();_this[J3R](argOpts[P1m]);argOpts[o88]();var opts=_this[p4i][g1T];if(opts[z5J] !== m8f){setTimeout(function(){var h$F='button';var M2D=D0wIj[482911];M2D+=D0wIj.R_0;M2D+=D0wIj[159052];if(_this[M2D]){var B4u=T0U;B4u+=v6x;B4u+=F9E;B4u+=p4i;var U64=T0U;U64+=D3K;$(h$F,_this[s9Y][v82])[P2F](opts[U64])[B4u]();}},o89);}});});return this;}function set(setIn,valIn){var that=this;if(!$[C20](setIn)){var o={};o[setIn]=valIn;setIn=o;}$[G5C](setIn,function(n,v){var P0q=p4i;P0q+=B1h;P0q+=u7s;that[C3h](n)[P0q](v);});return this;}function show(names,animate){var o0C="ldName";var l6J=v$S;l6J+=o0C;l6J+=p4i;var that=this;$[G5C](this[l6J](names),function(i,n){that[C3h](n)[a4w](animate);});return this;}function submit(successCallback,errorCallback,formatdata,hideIn){var P0R="DTE_Field";var Y9R="_process";var Q8E=a3m;Q8E+=D1C;Q8E+=a7L;var x3v=B1h;x3v+=D0wIj[394663];x3v+=D1C;x3v+=a7L;var x5R=c70;x5R+=H0E;var A5x=D5F;k55.j5b();A5x+=g0L;A5x+=n16;var t_P=K9f;t_P+=P0R;var j37=Y9R;j37+=V$v;var y10=D0wIj[394663];y10+=Y8n;y10+=P1j;var _this=this;var fields=this[p4i][Z7H];var errorFields=[];var errorReady=D0wIj[140995];var sent=D0wIj[203584];if(this[p4i][t7m] || !this[p4i][y10]){return this;}this[j37](y_h);var send=function(){var d2z='initSubmit';var R9j=k3x;R9j+=B1h;R9j+=p$q;k55.j5b();R9j+=h89;var g0F=D5F;g0F+=f5K;g0F+=S7A;if(errorFields[g0F] !== errorReady || sent){return;}_this[R9j](d2z,[_this[p4i][X70]],function(result){var r9L="_pr";var f11="ocessing";if(result === D0wIj[203584]){var H7_=r9L;H7_+=f11;_this[H7_](D0wIj[203584]);return;}sent=y_h;_this[A_4](successCallback,errorCallback,formatdata,hideIn);});};var active=document[i1C];if($(active)[l75](t_P)[A5x] !== D0wIj[140995]){var Z_8=N6v;Z_8+=Q19;active[Z_8]();}this[x5R]();$[x3v](fields,function(name,fieldIn){if(fieldIn[E34]()){errorFields[Z2L](name);}});$[Q8E](errorFields,function(i,name){var p45=B1h;p45+=J2b;p45+=D0wIj.R_0;p45+=H0E;fields[name][p45](R_6,function(){errorReady++;k55.j5b();send();});});send();return this;}function table(setIn){var X45=Y6m;X45+=N6v;X45+=D5F;if(setIn === undefined){return this[p4i][x81];}this[p4i][X45]=setIn;return this;}function template(setIn){var z$d="templ";if(setIn === undefined){var W6y=z$d;W6y+=D0wIj[394663];W6y+=u7s;W6y+=B1h;return this[p4i][W6y];}this[p4i][A_k]=setIn === m8f?m8f:$(setIn);return this;}function title(titleIn){var B1r="itle";var p0Z="tag";var e1V="ader";var V7Q="ses";var f33="func";var x33="ddCl";var c7f=D1C;c7f+=b4H;c7f+=p4i;c7f+=p4i;var X7W=D0wIj[394663];X7W+=x33;X7W+=D0wIj[394663];X7W+=v5w;var A5v=u7s;A5v+=D0wIj[394663];A5v+=l3E;var C4T=L70;C4T+=q51;var E4s=u7s;E4s+=F7I;var q_B=f33;q_B+=u7s;q_B+=j1O;q_B+=P1j;var J09=a7L;J09+=a3m;J09+=H9v;var W84=N46;W84+=p4i;W84+=V7Q;var f2C=g3K;f2C+=e1V;var l1u=D0wIj[482911];l1u+=k6Z;var header=$(this[l1u][f2C])[e1Y](Y8e + this[W84][K93][G_g]);var titleClass=this[H6i][J09][D_t];if(titleIn === undefined){var t$M=u7s;t$M+=B1r;return header[F0E](t$M);}if(typeof titleIn === q_B){var H8q=Y6m;H8q+=N6v;H8q+=D5F;titleIn=titleIn(this,new DataTable$5[K8Q](this[p4i][H8q]));}var set=titleClass[E4s]?$(g10 + titleClass[p0Z] + C4T + titleClass[A5v])[X7W](titleClass[c7f])[E9n](titleIn):titleIn;header[E9n](set)[F0E](I_V,titleIn);return this;}function val(fieldIn,value){var R32="lai";var S2X="Object";var Z2P=q8j;Z2P+=R32;Z2P+=f5K;Z2P+=S2X;if(value !== undefined || $[Z2P](fieldIn)){var U5a=p4i;U5a+=B1h;U5a+=u7s;return this[U5a](fieldIn,value);}return this[d4T](fieldIn);}function error(msg,tn,thro){var c7M=' For more information, please refer to https://datatables.net/tn/';if(thro === void D0wIj[140995]){thro=y_h;}var display=tn?msg + c7M + tn:msg;if(thro){throw display;}else {var g6Z=o9N;g6Z+=D0wIj[394663];g6Z+=H0E;g6Z+=f5K;console[g6Z](display);}}function pairs(data,props,fn){var J$p="nObject";var j3w="isPlai";k55.c6l();var o6z=T6K;o6z+=B1h;o6z+=a86;var i;var ien;var dataPoint;props=$[z7O]({label:o6z,value:c0o},props);if(Array[k9E](data)){var Y8b=D5F;Y8b+=G17;Y8b+=a7L;for((i=D0wIj[140995],ien=data[Y8b]);i < ien;i++){var H_B=j3w;H_B+=J$p;dataPoint=data[i];if($[H_B](dataPoint)){var Y7p=I7B;Y7p+=z3W;Y7p+=B1h;fn(dataPoint[props[I2p]] === undefined?dataPoint[props[A2T]]:dataPoint[props[Y7p]],dataPoint[props[A2T]],i,dataPoint[G6h]);}else {fn(dataPoint,dataPoint,i);}}}else {i=D0wIj[140995];$[G5C](data,function(key,val){k55.c6l();fn(val,key,i);i++;});}}function upload$1(editor,conf,files,progressCallback,completeCallback){var y$W="eft";var w03="A se";var b1r="errors";var y5W="nc";var A8z="_limitL";var b25="readAsDataURL";var a3F="rver error occurred while uploading the f";var e4M="onload";var t$d="ding file</i>";var U9I="<i>Uploa";var w1v="fileReadText";var v0t=U9I;v0t+=t$d;var E2z=X_Y;E2z+=y5W;E2z+=m2s;E2z+=f5K;var z74=D0wIj[394663];z74+=D0wIj.C99;z74+=D0wIj[394663];z74+=V0h;var Q79=w03;Q79+=a3F;Q79+=p6j;var i7T=c70;i7T+=H0E;i7T+=p4i;var p3h=B1h;p3h+=F_Q;p3h+=H0E;p3h+=p4i;var reader=new FileReader();var counter=D0wIj[140995];var ids=[];var generalError=conf[b1r] && conf[p3h][k3x]?conf[i7T][k3x]:Q79;editor[E3Q](conf[T$O],R_6);if(typeof conf[z74] === E2z){var U4M=M6$;U4M+=V0h;conf[U4M](files,function(idsIn){var k$Y=D1C;k$Y+=D0wIj[394663];k$Y+=a86;k$Y+=a86;completeCallback[k$Y](editor,idsIn);});return;}progressCallback(conf,conf[w1v] || v0t);reader[e4M]=function(e){var b2c="jaxDat";var S96="ja";var Q3N="Upload feature cannot us";var b8j="reUpload";var K$g="sPlainObj";var B2M='No Ajax option specified for upload plug-in';var a2q="loadField";var U8f="e `ajax.data` with an object. Please use it as a function instead.";var s80="xData";var s8x='upload';var V7Y="tring";var w94=b1l;w94+=b8j;var s5m=k3x;s5m+=B1h;s5m+=O1S;s5m+=u7s;var l3R=D0wIj[482911];l3R+=D0wIj[394663];l3R+=u7s;l3R+=D0wIj[394663];var x2n=j1O;x2n+=K$g;x2n+=m21;var v8R=D0wIj[482911];v8R+=D0wIj[394663];v8R+=u7s;v8R+=D0wIj[394663];var d6t=p4i;d6t+=V7Y;var p1b=h64;p1b+=D0wIj[394663];p1b+=V0h;var b6h=j1O;b6h+=K$g;b6h+=B1h;b6h+=K18;var W2A=D0wIj[394663];W2A+=S96;W2A+=V0h;var h_m=h64;h_m+=D0wIj[394663];h_m+=s80;var X0G=f3R;X0G+=l23;X0G+=T0F;var I7y=w$s;I7y+=D0wIj[159052];I7y+=B1h;var X$t=f3R;X$t+=a2q;var z3w=Y5b;z3w+=X3g;var C5C=V5M;C5C+=P1j;var data=new FormData();var ajax;data[R0y](C5C,s8x);data[z3w](X$t,conf[I7y]);data[R0y](X0G,files[counter]);k55.j5b();if(conf[h_m]){var T5E=D0wIj[394663];T5E+=b2c;T5E+=D0wIj[394663];conf[T5E](data,files[counter],counter);}if(conf[W2A]){var h5Q=M6$;h5Q+=V0h;ajax=conf[h5Q];}else if($[b6h](editor[p4i][b0E])){var n3p=K24;n3p+=D0wIj[482911];var i0Y=h64;i0Y+=D0wIj[394663];i0Y+=V0h;ajax=editor[p4i][i0Y][n3p]?editor[p4i][b0E][U7r]:editor[p4i][b0E];}else if(typeof editor[p4i][p1b] === D3C){ajax=editor[p4i][b0E];}if(!ajax){throw new Error(B2M);}if(typeof ajax === d6t){ajax={url:ajax};}if(typeof ajax[v8R] === D0wIj[253540]){var P9s=B1h;P9s+=q7Q;P9s+=a7L;var d={};var ret=ajax[F0E](d);if(ret !== undefined && typeof ret !== D3C){d=ret;}$[P9s](d,function(key,value){k55.c6l();var T90=X9C;T90+=D0T;data[T90](key,value);});}else if($[x2n](ajax[l3R])){var m$J=Q3N;m$J+=U8f;throw new Error(m$J);}editor[s5m](w94,[conf[T$O],files[counter],data],function(preRet){var Q9l="preSubmit.D";var i$K="oad";var b_M="L";var O2R="readAs";var v4u="DataUR";var M2b="TE_Upl";var U5J="lengt";var I80=b1l;I80+=D0wIj.R_0;I80+=p4i;I80+=u7s;var F9J=i1v;F9J+=D0T;k55.c6l();var U5T=D0wIj[394663];U5T+=D0wIj.C99;U5T+=D0wIj[394663];U5T+=V0h;var R9g=Q9l;R9g+=M2b;R9g+=i$K;if(preRet === D0wIj[203584]){var l$N=U5J;l$N+=a7L;if(counter < files[l$N] - b6E){var h8w=O2R;h8w+=v4u;h8w+=b_M;counter++;reader[h8w](files[counter]);}else {var V_M=D1C;V_M+=K7O;completeCallback[V_M](editor,ids);}return;}var submit=D0wIj[203584];editor[P1j](R9g,function(){submit=y_h;k55.j5b();return D0wIj[203584];});$[U5T]($[F9J]({},ajax,{contentType:D0wIj[203584],data:data,dataType:U4F,error:function(xhr){var N1H="ame";var F2V="_Upload";var Z3U="preSubmit.DT";var T2O="dXh";var X$l="rError";var w4N=f5K;w4N+=N1H;var f4g=K24;f4g+=T2O;f4g+=X$l;var P4S=b_x;P4S+=h89;var h5V=f5K;h5V+=N1H;var S6C=Z3U;S6C+=r01;S6C+=F2V;var e9l=D0wIj.R_0;e9l+=T0U;e9l+=T0U;var x8u=B1h;x8u+=w_L;x8u+=p4i;var errors=conf[x8u];editor[e9l](S6C);editor[E3Q](conf[h5V],errors && errors[xhr[G$J]]?errors[xhr[G$J]]:generalError);editor[P4S](f4g,[conf[w4N],xhr]);progressCallback(conf);},processData:D0wIj[203584],success:function(json){var X$S="tatus";var m82='uploadXhrSuccess';var f$b="ors";var r08="fieldErr";var g1X='preSubmit.DTE_Upload';var s9L=r08;s9L+=f$b;editor[A2F](g1X);editor[k4q](m82,[conf[T$O],json]);if(json[J_c] && json[s9L][G8t]){var a6f=a86;a6f+=v5A;a6f+=S7A;var errors=json[J_c];for(var i=D0wIj[140995],ien=errors[a6f];i < ien;i++){var h91=p4i;h91+=X$S;editor[E3Q](errors[i][T$O],errors[i][h91]);}completeCallback[l5$](editor,ids,y_h);}else if(json[E3Q]){var T70=H8L;T70+=f7W;var k4Z=V$8;k4Z+=O9A;k4Z+=H0E;editor[k4Z](json[E3Q]);completeCallback[T70](editor,ids,y_h);}else if(!json[U7r] || !json[U7r][J9D]){var s7v=H8L;s7v+=f7W;var X3E=f5K;X3E+=D0wIj[394663];X3E+=D0wIj[159052];X3E+=B1h;var H8s=B1h;H8s+=H0E;H8s+=O9A;H8s+=H0E;editor[H8s](conf[X3E],generalError);completeCallback[s7v](editor,ids,y_h);}else {var m7d=g5s;m7d+=l3E;m7d+=n16;var X$d=j1O;X$d+=D0wIj[482911];var K7t=b1l;K7t+=F9E;K7t+=p4i;K7t+=a7L;var K0p=W5p;K0p+=B7_;if(json[K0p]){var e2z=T0U;e2z+=o12;e2z+=B1h;e2z+=p4i;var A6t=B1h;A6t+=F7S;$[A6t](json[e2z],function(table,filesIn){var R8T=W5p;R8T+=B7_;if(!Editor[R8T][table]){var e61=H4J;e61+=a86;e61+=B1h;e61+=p4i;Editor[e61][table]={};}$[z7O](Editor[z6u][table],filesIn);});}ids[K7t](json[U7r][X$d]);if(counter < files[m7d] - b6E){counter++;reader[b25](files[counter]);}else {completeCallback[l5$](editor,ids);if(submit){editor[s_U]();}}}progressCallback(conf);},type:I80,xhr:function(){var m$h="xhr";var F4i="loa";var f_H="ajaxSetti";var y7n="dend";var E_Z="gre";var O0S=f_H;O0S+=J7x;var xhr=$[O0S][m$h]();if(xhr[U7r]){var u80=D0wIj.R_0;u80+=f5K;u80+=F4i;u80+=y7n;var Y6Q=S24;Y6Q+=T0F;var I2x=P1j;I2x+=Q3l;I2x+=E_Z;I2x+=v5w;xhr[U7r][I2x]=function(e){var K5A="oFixed";var G0o="tota";var I_Q=':';var g52="loaded";var G97="lengthComputable";var A58='%';if(e[G97]){var n7n=u7s;n7n+=K5A;var b_X=G0o;b_X+=a86;var percent=(e[g52] / e[b_X] * o89)[n7n](D0wIj[140995]) + A58;progressCallback(conf,files[G8t] === b6E?percent:counter + I_Q + files[G8t] + o3N + percent);}};xhr[Y6Q][u80]=function(){var T8C='Processing';var A55="process";var U$Y="ingText";var N$y=A55;N$y+=U$Y;progressCallback(conf,conf[N$y] || T8C);};}k55.j5b();return xhr;}}));});};files=$[K3u](files,function(val){k55.j5b();return val;});if(conf[i8l] !== undefined){var R09=g5s;R09+=l3E;R09+=u7s;R09+=a7L;var h7I=A8z;h7I+=y$W;files[f90](conf[h7I],files[R09]);}reader[b25](files[D0wIj[140995]]);}function factory(root,jq){var S5A="docum";var f8B="jquery";var j_o=T0U;j_o+=f5K;var is=D0wIj[203584];if(root && root[D0wIj.g_D]){var R8N=S5A;R8N+=v5A;R8N+=u7s;window=root;document=root[R8N];}if(jq && jq[D0wIj.I9n] && jq[j_o][f8B]){$=jq;is=y_h;}return is;}var DataTable$4=$[t5R][D0wIj.p1d];var _inlineCounter=D0wIj[140995];function _actionClass(){var u_I="addC";var v05="eat";var k_x="moveClass";var n7W="sses";var q2c=y6B;q2c+=p$q;q2c+=B1h;var D6L=B1h;D6L+=D0wIj[482911];D6L+=j1O;D6L+=u7s;var u5L=y6B;u5L+=h3b;var o2E=B1h;o2E+=G80;o2E+=u7s;var t6r=L3v;t6r+=k_x;var Y8E=D0wIj[482911];Y8E+=D0wIj.R_0;Y8E+=D0wIj[159052];var S3k=V5M;k55.j5b();S3k+=r2U;var D$V=D1C;D$V+=b4H;D$V+=n7W;var classesActions=this[D$V][S3k];var action=this[p4i][X70];var wrapper=$(this[Y8E][x3Y]);wrapper[t6r]([classesActions[H1w],classesActions[o2E],classesActions[u5L]][y4f](o3N));if(action === k0P){var H1G=D1C;H1G+=H0E;H1G+=v05;H1G+=B1h;var s8H=u_I;s8H+=b4H;s8H+=p4i;s8H+=p4i;wrapper[s8H](classesActions[H1G]);}else if(action === D6L){wrapper[M7k](classesActions[p_F]);}else if(action === q2c){var N4N=w3q;N4N+=g7S;wrapper[M7k](classesActions[N4N]);}}function _ajax(data,success,error,submitParams){var q3z="inde";var a10="rl";var L2D="ete";var U8s="eteBody";var q35="ep";var d6e="unshif";var b0X="lace";var j$D='?';var N1L="xOf";var Y66="deleteBody";var i_d="PO";var F7Y=/_id_/;var N_v="replacements";var U68='DELETE';var d8i="del";var i5L=/{id}/;var k0r="complete";var l51=D0wIj[394663];l51+=Z0T;var p$M=d8i;p$M+=U8s;var C6y=u7s;C6y+=H2R;C6y+=W_K;var t1G=H0E;t1G+=q35;t1G+=b0X;var G8w=F9E;G8w+=a10;var J8D=P7n;J8D+=k6t;J8D+=l3E;var b7E=d25;b7E+=C9I;b7E+=f5K;var Y6r=D0wIj.C99;Y6r+=D0wIj.R_0;Y6r+=o5M;var s5p=J9D;s5p+=I2_;var s4h=k14;s4h+=u7s;s4h+=t7e;s4h+=a4D;var p4T=B1h;p4T+=Q3f;var d4W=D0wIj[394663];d4W+=D0wIj.C99;d4W+=D0wIj[394663];d4W+=V0h;var K8_=i_d;K8_+=A5_;K8_+=k2U;var l6q=D0wIj.C99;l6q+=p4i;l6q+=D0wIj.R_0;l6q+=f5K;var A0z=D0wIj[394663];A0z+=z4d;var action=this[p4i][A0z];var thrown;var opts={complete:[function(xhr,text){var t7L="ponseJSON";var h3q=400;var k4V="responseJSON";var U0s="responseText";var N6L='null';var l8H="inObje";var v3S=204;var K_w="onseText";var F6j="tu";var D6J=k0Y;D6J+=H0E;D6J+=j2m;var n9x=q8j;n9x+=b4H;n9x+=l8H;n9x+=K18;var h0n=P7n;h0n+=D0wIj[394663];h0n+=F6j;h0n+=p4i;var json=m8f;if(xhr[h0n] === v3S || xhr[U0s] === N6L){json={};}else {try{var p3x=L3v;p3x+=T2z;p3x+=K_w;var n2O=b1l;n2O+=d1B;n2O+=w4l;var J9h=D_V;J9h+=t7L;json=xhr[k4V]?xhr[J9h]:JSON[n2O](xhr[p3x]);}catch(e){}}if($[n9x](json) || Array[D6J](json)){var P77=f1j;P77+=l9r;success(json,xhr[P77] >= h3q,xhr);}else {error(xhr,text,thrown);}}],data:m8f,dataType:l6q,error:[function(xhr,text,err){k55.j5b();thrown=err;}],success:[],type:K8_};var a;var ajaxSrc=this[p4i][d4W];var id=action === p4T || action === F8m?pluck(this[p4i][s4h],s5p)[Y6r](O33):m8f;if($[C20](ajaxSrc) && ajaxSrc[action]){ajaxSrc=ajaxSrc[action];}if(typeof ajaxSrc === b7E){var c$5=D1C;c$5+=D0wIj[394663];c$5+=f7W;ajaxSrc[c$5](this,m8f,m8f,data,success,error);return;}else if(typeof ajaxSrc === J8D){var w0u=H0O;w0u+=B1h;w0u+=N1L;if(ajaxSrc[w0u](o3N) !== -b6E){var u2f=F9E;u2f+=a10;var b$7=u7s;b$7+=H2R;b$7+=W_K;var D41=p4i;D41+=b1l;D41+=u7g;D41+=u7s;a=ajaxSrc[D41](o3N);opts[b$7]=a[D0wIj[140995]];opts[u2f]=a[b6E];}else {var T6V=F9E;T6V+=H0E;T6V+=a86;opts[T6V]=ajaxSrc;}}else {var E2$=v$A;E2$+=f8i;var A1U=D1C;A1U+=D0wIj.R_0;A1U+=M4j;A1U+=L2D;var Z9q=B1h;Z9q+=V0h;Z9q+=x7E;var optsCopy=$[Z9q]({},ajaxSrc || ({}));if(optsCopy[A1U]){var k8D=D1C;k8D+=k6Z;k8D+=o8N;var U5M=j_R;U5M+=L2y;opts[k0r][U5M](optsCopy[k8D]);delete optsCopy[k0r];}if(optsCopy[E2$]){var s1a=B1h;s1a+=H0E;s1a+=O9A;s1a+=H0E;var K$b=d6e;K$b+=u7s;var c2Z=B1h;c2Z+=w_L;opts[c2Z][K$b](optsCopy[s1a]);delete optsCopy[E3Q];}opts=$[z7O]({},opts,optsCopy);}if(opts[N_v]){$[G5C](opts[N_v],function(key,repl){var v9u='{';var X4P='}';var i7A=t3n;k55.j5b();i7A+=a86;opts[i7A]=opts[l5_][T6y](v9u + key + X4P,repl[l5$](this,key,id,action,data));});}opts[G8w]=opts[l5_][T6y](F7Y,id)[t1G](i5L,id);if(opts[F0E]){var P_R=m0o;P_R+=Y6m;var o6K=m0o;o6K+=Y6m;var isFn=typeof opts[o6K] === D0wIj[253540];var newData=isFn?opts[P_R](data):opts[F0E];data=isFn && newData?newData:$[z7O](y_h,data,newData);}opts[F0E]=data;if(opts[C6y] === U68 && (opts[p$M] === undefined || opts[Y66] === y_h)){var d9k=D0wIj[482911];d9k+=d5R;d9k+=D0wIj[394663];var i2k=q3z;i2k+=N1L;var r2i=t3n;r2i+=a86;var L_o=V_f;L_o+=H0E;L_o+=D0wIj[394663];L_o+=D0wIj[159052];var params=$[L_o](opts[F0E]);opts[l5_]+=opts[r2i][i2k](j$D) === -b6E?j$D + params:P2s + params;delete opts[d9k];}$[l51](opts);}function _animate(target,style,time,callback){k55.j5b();var Y0D="anim";var J9b=Y0D;J9b+=d5R;J9b+=B1h;if($[D0wIj.I9n][J9b]){var u66=p4i;u66+=u7s;u66+=f$n;target[u66]()[T5Z](style,time,callback);}else {target[q7L](style);var scope=target[G8t] && target[G8t] > b6E?target[D0wIj[140995]]:target;if(typeof time === D0wIj[253540]){var e0H=T8u;e0H+=a86;time[e0H](scope);}else if(callback){var i9D=D1C;i9D+=T0_;i9D+=a86;callback[i9D](scope);}}}function _assembleMain(){var M2F="for";var j43="mInf";var v63=Y5b;v63+=X3g;var e$N=M2F;e$N+=j43;e$N+=D0wIj.R_0;var H0I=N6v;H0I+=k0e;H0I+=a4k;H0I+=a2h;var r49=Z8Q;r49+=j4b;var n$Z=D0wIj[394663];n$Z+=i6J;var T6T=Y5b;T6T+=b1l;T6T+=B1h;T6T+=S4n;var t1K=g6$;t1K+=X3g;var Q$v=D0wIj[482911];Q$v+=k6Z;var dom=this[Q$v];$(dom[x3Y])[t1K](dom[K93]);$(dom[Y_7])[T6T](dom[F_1])[n$Z](dom[r49]);k55.c6l();$(dom[H0I])[R0y](dom[e$N])[v63](dom[u7M]);}function _blur(){var K8E="onB";var j4h="bm";var z7T="ditOpt";var F58="Blur";var U0l=D1C;U0l+=l23;U0l+=w4l;var G9F=m4R;G9F+=D0wIj[159052];G9F+=j1O;G9F+=u7s;var s5j=g6$;s5j+=F58;var t$b=b_x;t$b+=B1h;t$b+=D0wIj.m1R;var a5N=K8E;a5N+=a86;a5N+=F9E;a5N+=H0E;var N54=B1h;N54+=z7T;N54+=p4i;var opts=this[p4i][N54];var onBlur=opts[a5N];if(this[t$b](s5j) === D0wIj[203584]){return;}if(typeof onBlur === D0wIj[253540]){onBlur(this);}else if(onBlur === G9F){var R81=Y0_;R81+=j4h;R81+=j1O;R81+=u7s;this[R81]();}else if(onBlur === U0l){var e2A=k3x;e2A+=D1C;e2A+=p$X;e2A+=B1h;this[e2A]();}}function _clearDynamicInfo(errorsOnly){var Y6K="Focus";var C9k="leB";var M_g=Z$i;M_g+=D9u;M_g+=C9k;M_g+=Q1e;var y0A=f_E;y0A+=Y6K;var Y0f=o9N;Y0f+=H0E;Y0f+=X9C;Y0f+=V$8;var H5d=T0U;H5d+=j1O;H5d+=B1h;H5d+=n1h;if(errorsOnly === void D0wIj[140995]){errorsOnly=D0wIj[203584];}if(!this[p4i]){return;}var errorClass=this[H6i][C3h][E3Q];var fields=this[p4i][H5d];$(Y8e + errorClass,this[s9Y][Y0f])[w12](errorClass);$[G5C](fields,function(name,field){var t35=V$8;t35+=H0E;t35+=f8i;field[t35](R_6);if(!errorsOnly){var W$D=D0wIj[159052];W$D+=B7_;W$D+=Z$T;W$D+=A86;field[W$D](R_6);}});this[E3Q](R_6);if(!errorsOnly){this[n6s](R_6);}this[p4i][y0A]=m8f;this[p4i][M_g]=D0wIj[203584];}function _close(submitComplete,mode){k55.j5b();var v7N="seIcb";var k0V="_eve";var o8U='closed';var X0a="closeI";var i5q="isplayed";var U$4="or-focus";var d88="cb";var k7u="eC";var o6k="focus.edit";var t8v="seCb";var d8j='preClose';var H6z=D1C;H6z+=l23;H6z+=p4i;H6z+=B1h;var D6j=k3x;D6j+=B1h;D6j+=O1S;D6j+=u7s;var X1E=D0wIj[482911];X1E+=i5q;var q90=o6k;q90+=U$4;var n6W=X0a;n6W+=d88;var y7c=k0V;y7c+=f5K;y7c+=u7s;var closed;if(this[y7c](d8j) === D0wIj[203584]){return;}if(this[p4i][p$_]){var M_j=D1C;M_j+=p$X;M_j+=k7u;M_j+=N6v;var Q_8=P_V;Q_8+=D0wIj.R_0;Q_8+=t8v;closed=this[p4i][Q_8](submitComplete,mode);this[p4i][M_j]=m8f;}if(this[p4i][n6W]){var v45=D1C;v45+=l23;v45+=v7N;this[p4i][v45]();this[p4i][Y9f]=m8f;}$(O9w)[A2F](q90);this[p4i][X1E]=D0wIj[203584];this[D6j](H6z);if(closed){var k5T=k3x;k5T+=B1h;k5T+=h3b;k5T+=D0wIj.m1R;this[k5T](o8U,[closed]);}}function _closeReg(fn){k55.j5b();this[p4i][p$_]=fn;}function _crudArgs(arg1,arg2,arg3,arg4){var Y7K="formOptio";var P1h="main";var h$O="utton";var s_X=Y7K;s_X+=x0q;k55.j5b();var z87=B1h;z87+=V0h;z87+=x7E;var that=this;var title;var buttons;var show;var opts;if($[C20](arg1)){opts=arg1;}else if(typeof arg1 === Q_e){show=arg1;opts=arg2;}else {title=arg1;buttons=arg2;show=arg3;opts=arg4;}if(show === undefined){show=y_h;}if(title){that[D_t](title);}if(buttons){var g_V=N6v;g_V+=h$O;g_V+=p4i;that[g_V](buttons);}return {maybeOpen:function(){if(show){var i2n=D0wIj.R_0;i2n+=W_K;i2n+=f5K;that[i2n]();}},opts:$[z87]({},this[p4i][s_X][P1h],opts)};}function _dataSource(name){k55.j5b();var c_d="dataSources";var q9r="ces";var R6D=V77;R6D+=v74;var G7S=F0E;G7S+=l0W;G7S+=t3n;G7S+=q9r;var args=[];for(var _i=b6E;_i < arguments[G8t];_i++){args[_i - b6E]=arguments[_i];}var dataSource=this[p4i][x81]?Editor[c_d][D0wIj.p1d]:Editor[G7S][R6D];var fn=dataSource[name];if(fn){var P4z=D0wIj[394663];P4z+=b07;P4z+=a86;P4z+=H2R;return fn[P4z](this,args);}}function _displayReorder(includeFields){var V56="formContent";var K4G="endT";var M$O='displayOrder';var q0X=D0wIj[159052];q0X+=D0wIj[394663];q0X+=j1O;q0X+=f5K;var k64=B1h;k64+=q7Q;k64+=a7L;var W3_=D1C;W3_+=J7i;W3_+=a86;W3_+=U$s;var d1O=D0wIj[159052];d1O+=Z3c;var q6l=e_t;q6l+=M4j;q6l+=g18;var v1s=H4J;v1s+=B1h;v1s+=n1h;var s31=D0wIj[482911];s31+=D0wIj.R_0;s31+=D0wIj[159052];var _this=this;var formContent=$(this[s31][V56]);var fields=this[p4i][v1s];var order=this[p4i][B5O];var template=this[p4i][q6l];var mode=this[p4i][d1O] || H_5;if(includeFields){this[p4i][E3i]=includeFields;}else {includeFields=this[p4i][E3i];}formContent[W3_]()[Z$n]();$[k64](order,function(i,name){var u2r='editor-field[name="';var X86="_weakInArray";var b3d="aft";var P$g='[data-editor-template="';if(_this[X86](name,includeFields) !== -b6E){var r15=D0wIj[159052];r15+=D0wIj[394663];r15+=j1O;r15+=f5K;if(template && mode === r15){var B9p=O9i;B9p+=J6P;var w7t=T0U;w7t+=j1O;w7t+=f5K;w7t+=D0wIj[482911];var o0t=f5K;o0t+=D0wIj.R_0;o0t+=D0wIj[482911];o0t+=B1h;var X7m=b3d;X7m+=V$8;var A9d=H4J;A9d+=f5K;A9d+=D0wIj[482911];template[A9d](u2r + name + p9o)[X7m](fields[name][o0t]());template[w7t](P$g + name + B9p)[R0y](fields[name][B0q]());}else {formContent[R0y](fields[name][B0q]());}}});if(template && mode === q0X){var i1K=X9C;i1K+=K4G;i1K+=D0wIj.R_0;template[i1K](formContent);}this[k4q](M$O,[this[p4i][p5J],this[p4i][X70],formContent]);}function _edit(items,editFields,type,formOptions,setupDone){var h99="ctionClass";var n_5="Fi";var c_n='initEdit';var m6V='node';var d5E="editD";var C8b="plice";var F8A=a4R;F8A+=D0wIj[394663];var Z1y=f8i;Z1y+=D0wIj[482911];Z1y+=V$8;var w$R=N_J;w$R+=h99;var z6L=D0wIj[159052];z6L+=D0wIj.R_0;z6L+=D0wIj[482911];z6L+=B1h;var o_U=G80;o_U+=p4i;o_U+=s1t;var P_I=T0U;P_I+=D0wIj.R_0;k55.c6l();P_I+=H0E;P_I+=D0wIj[159052];var c85=D0wIj[482911];c85+=D0wIj.R_0;c85+=D0wIj[159052];var s4l=B1h;s4l+=D0wIj[482911];s4l+=j1O;s4l+=u7s;var p2w=d5E;p2w+=D0wIj[394663];p2w+=u7s;p2w+=D0wIj[394663];var f5Y=p_F;f5Y+=n_5;f5Y+=B1h;f5Y+=n1h;var _this=this;var fields=this[p4i][Z7H];var usedFields=[];var includeInOrder;var editData={};this[p4i][f5Y]=editFields;this[p4i][p2w]=editData;this[p4i][T8Y]=items;this[p4i][X70]=s4l;this[c85][P_I][O_C][o_U]=G82;this[p4i][z6L]=type;this[w$R]();$[G5C](fields,function(name,field){var N8r="ltiIds";var y_3="iReset";var c7F=Z78;c7F+=N8r;var x50=a3m;x50+=v7g;var n3z=n_A;n3z+=u7s;n3z+=y_3;field[n3z]();includeInOrder=D0wIj[203584];editData[name]={};$[x50](editFields,function(idSrc,edit){var i3X="scope";var D5n="nul";var g_I="layFields";var V_1="yFields";var J57="Set";var R49="lDefau";var v8f=C3h;k55.j5b();v8f+=p4i;if(edit[v8f][name]){var m_6=p4i;m_6+=a86;m_6+=j1O;m_6+=e1t;var h11=D5n;h11+=R49;h11+=R0z;var val=field[h8o](edit[F0E]);var nullDefault=field[h11]();editData[name][idSrc]=val === m8f?R_6:Array[k9E](val)?val[m_6]():val;if(!formOptions || formOptions[i3X] === K8P){var N66=A0e;N66+=V_1;var d4q=G80;d4q+=T2z;d4q+=g_I;var F06=N8S;F06+=T0U;field[U6n](idSrc,val === undefined || nullDefault && val === m8f?field[F06]():val,D0wIj[203584]);if(!edit[d4q] || edit[N66][name]){includeInOrder=y_h;}}else {var d9u=K6T;d9u+=S5s;d9u+=p4i;if(!edit[d9u] || edit[g0l][name]){var u_g=D0wIj[482911];u_g+=B1h;u_g+=T0U;var W3y=x_V;W3y+=J57;field[W3y](idSrc,val === undefined || nullDefault && val === m8f?field[u_g]():val,D0wIj[203584]);includeInOrder=y_h;}}}});field[z7z]();if(field[c7F]()[G8t] !== D0wIj[140995] && includeInOrder){usedFields[Z2L](name);}});var currOrder=this[Z1y]()[x4$]();for(var i=currOrder[G8t] - b6E;i >= D0wIj[140995];i--){var G7T=s69;G7T+=H0E;G7T+=j2m;if($[G7T](currOrder[i][h7V](),usedFields) === -b6E){var P4J=p4i;P4J+=C8b;currOrder[P4J](i,b6E);}}this[N2G](currOrder);this[k4q](c_n,[pluck(editFields,m6V)[D0wIj[140995]],pluck(editFields,F8A)[D0wIj[140995]],items,type],function(){var Z_J="ultiEdit";var U4T=J6f;U4T+=Z_J;_this[k4q](U4T,[editFields,items,type],function(){k55.c6l();setupDone();});});}function _event(trigger,args,promiseComplete){var x6x="andler";var E9w="Event";var N5Q="riggerH";var s6_='Cancelled';var v3G="result";var B0w="Even";if(args === void D0wIj[140995]){args=[];}if(promiseComplete === void D0wIj[140995]){promiseComplete=undefined;}if(Array[k9E](trigger)){var c8q=t_y;c8q+=n16;for(var i=D0wIj[140995],ien=trigger[c8q];i < ien;i++){this[k4q](trigger[i],args);}}else {var C2d=b1l;C2d+=H0E;C2d+=B1h;var A7N=u7s;A7N+=N5Q;A7N+=x6x;var e=$[E9w](trigger);$(this)[A7N](e,args);var result=e[v3G];if(trigger[C3_](C2d) === D0wIj[140995] && result === D0wIj[203584]){var o3t=B0w;o3t+=u7s;$(this)[i2U]($[o3t](trigger + s6_),args);}if(promiseComplete){var m6d=u7s;m6d+=a7L;m6d+=B1h;m6d+=f5K;if(result && typeof result === D0wIj.U1l && result[m6d]){result[L0L](promiseComplete);}else {promiseComplete(result);}}return result;}}function _eventName(input){var e6A="bstring";var b0i="oin";var V$c=/^on([A-Z])/;var J3S="owerCase";var o4L=3;k55.j5b();var s6g="match";var p9B="toL";var C0H="spl";var o$W=D0wIj.C99;o$W+=b0i;var r7J=C0H;r7J+=j1O;r7J+=u7s;var name;var names=input[r7J](o3N);for(var i=D0wIj[140995],ien=names[G8t];i < ien;i++){name=names[i];var onStyle=name[s6g](V$c);if(onStyle){var w96=p4i;w96+=F9E;w96+=e6A;var h7J=p9B;h7J+=J3S;name=onStyle[b6E][h7J]() + name[w96](o4L);}names[i]=name;}return names[o$W](o3N);}function _fieldFromNode(node){var foundField=m8f;k55.c6l();$[G5C](this[p4i][Z7H],function(name,field){var X$i=a86;X$i+=n8u;var J_G=T0U;k55.c6l();J_G+=H0O;if($(field[B0q]())[J_G](node)[X$i]){foundField=field;}});return foundField;}function _fieldNames(fieldNames){var t8p=G9G;t8p+=v3s;if(fieldNames === undefined){var E$f=H4J;E$f+=B1h;E$f+=w7n;E$f+=p4i;return this[E$f]();}else if(!Array[t8p](fieldNames)){return [fieldNames];}return fieldNames;}function _focus(fieldsIn,focus){var u2u="active";var v0l="setF";var p9$=/^jq:/;var s4M="Element";var y9a="div.DT";var i3H="exOf";var a_R=v0l;a_R+=D3K;var W37=D0wIj[394663];W37+=Y8n;k55.j5b();W37+=D0wIj.R_0;W37+=f5K;var _this=this;if(this[p4i][W37] === F8m){return;}var field;var fields=$[K3u](fieldsIn,function(fieldOrName){return typeof fieldOrName === D3C?_this[p4i][Z7H][fieldOrName]:fieldOrName;});if(typeof focus === g8r){field=fields[focus];}else if(focus){var w4U=D0wIj.C99;w4U+=D0wIj.K1y;w4U+=U8C;var u46=o5M;u46+=D0wIj[482911];u46+=i3H;if(focus[u46](w4U) === D0wIj[140995]){var g$8=y9a;g$8+=r01;g$8+=F$a;field=$(g$8 + focus[T6y](p9$,R_6));}else {field=this[p4i][Z7H][focus];}}else {var X9e=N6v;X9e+=a86;X9e+=F9E;X9e+=H0E;var H_s=u2u;H_s+=s4M;document[H_s][X9e]();}this[p4i][a_R]=field;if(field){field[b5m]();}}function _formOptions(opts){var S9E="canReturnSubmit";var U3D="tOpts";var t6t="eyd";var U6l="utto";var Q6S="wn";var S3v='.dteInline';var g8h="essa";var e7v="_fieldFromNode";var G7y=F0k;G7y+=t6t;G7y+=D0wIj.R_0;G7y+=Q6S;var R5g=T0U;R5g+=v4p;R5g+=m2s;R5g+=f5K;var z9Y=W5c;z9Y+=D0wIj[394663];z9Y+=A86;var b16=g19;b16+=g0L;var G8P=u7s;G8P+=j1O;G8P+=u7s;G8P+=D5F;var Q_n=P7n;Q_n+=H0E;Q_n+=o5M;Q_n+=l3E;var Y0T=u7s;Y0T+=j1O;Y0T+=u7s;Y0T+=D5F;var c2z=B1h;c2z+=G80;c2z+=U3D;var _this=this;var that=this;var inlineCount=_inlineCounter++;var namespace=S3v + inlineCount;this[p4i][c2z]=opts;this[p4i][m$k]=inlineCount;if(typeof opts[Y0T] === Q_n || typeof opts[G8P] === D0wIj[253540]){var s3R=b0W;s3R+=j_e;this[s3R](opts[D_t]);opts[D_t]=y_h;}if(typeof opts[n6s] === b16 || typeof opts[z9Y] === R5g){var z0T=D0wIj[159052];z0T+=g8h;z0T+=l3E;z0T+=B1h;var q1P=s5o;q1P+=A86;this[q1P](opts[z0T]);opts[n6s]=y_h;}if(typeof opts[v82] !== Q_e){var Y2S=Z8Q;Y2S+=D9d;Y2S+=p4i;var J2y=N6v;J2y+=U6l;J2y+=f5K;J2y+=p4i;var O0_=Z8Q;O0_+=j4b;this[O0_](opts[J2y]);opts[Y2S]=y_h;}$(document)[P1j](G7y + namespace,function(e){var z90="preven";var J$M="tDefault";var M0q="whi";var e01="ReturnSubmit";var P7e=M0q;P7e+=D1C;P7e+=a7L;if(e[P7e] === m_y && _this[p4i][p5J]){var el=$(document[i1C]);if(el){var d95=D1C;d95+=D85;d95+=e01;var field=_this[e7v](el);if(field && typeof field[d95] === D0wIj[253540] && field[S9E](el)){var t_V=z90;t_V+=J$M;e[t_V]();}}}});$(document)[P1j](w_q + namespace,function(e){var J8L="arents";var p75=27;var h7Q="onEsc";var A$x="onEs";var j4c="onE";var y7O="nex";var R24=37;var T6_="_Buttons";var F27="turn";var E4n="onReturn";var f4G="which";var r$B=39;var g9L="ich";var I7O=".DTE_For";var m7B="onRe";var P3b="focu";var M4f="urn";var A$7="wh";var q_o="Default";var C60="onR";var B0F="entDefaul";var J7W=a86;J7W+=B1h;J7W+=G17;J7W+=a7L;var J3u=I7O;J3u+=D0wIj[159052];J3u+=T6_;var p_x=b1l;p_x+=J8L;var z0f=e8Z;z0f+=a7L;var v$Q=A$7;v$Q+=g9L;var el=$(document[i1C]);if(e[v$Q] === m_y && _this[p4i][p5J]){var field=_this[e7v](el);if(field && typeof field[S9E] === D0wIj[253540] && field[S9E](el)){var b9Z=X_Y;b9Z+=f5K;b9Z+=z4d;var Q7m=C60;Q7m+=B1h;Q7m+=F27;if(opts[Q7m] === w5g){var C2k=g6$;C2k+=r0u;C2k+=q_o;e[C2k]();_this[s_U]();}else if(typeof opts[E4n] === b9Z){var I72=m7B;I72+=u7s;I72+=M4f;var S8j=T$R;S8j+=c2B;S8j+=B0F;S8j+=u7s;e[S8j]();opts[I72](_this,e);}}}else if(e[z0f] === p75){var U4I=j4c;U4I+=p4i;U4I+=D1C;var Q8q=A$x;Q8q+=D1C;var P$4=N6v;P$4+=z3W;P$4+=H0E;e[N$I]();if(typeof opts[h7Q] === D0wIj[253540]){var u8H=A$x;u8H+=D1C;opts[u8H](that,e);}else if(opts[h7Q] === P$4){that[Q83]();}else if(opts[Q8q] === m4Z){that[G35]();}else if(opts[U4I] === w5g){var l3w=h5M;l3w+=r4D;that[l3w]();}}else if(el[p_x](J3u)[J7W]){if(e[f4G] === R24){var Z0l=P3b;Z0l+=p4i;var E5m=k3P;E5m+=D0wIj.R_0;E5m+=f5K;var u0E=T$R;u0E+=B1h;u0E+=p$q;el[u0E](E5m)[h8s](Z0l);}else if(e[f4G] === r$B){var e_b=J_K;e_b+=o_G;var M4a=Z$i;M4a+=z3x;var h7H=y7O;h7H+=u7s;el[h7H](M4a)[h8s](e_b);}}});this[p4i][Y9f]=function(){var L$2="yup";var P$_='keydown';var D_L=F0k;D_L+=B1h;D_L+=L$2;var X$Q=D0wIj.R_0;X$Q+=T0U;X$Q+=T0U;$(document)[X$Q](P$_ + namespace);$(document)[A2F](D_L + namespace);};return namespace;}function _inline(editFields,opts,closeCb){var B68="preopen";var U36="contents";var y6n='.';var M5I="repl";var n7y="chFields";var c6F='Edge/';var b5g="=\"width:";var f0u="utt";var e4X="ace";var V6P="line";var S1o="formErro";var L3W="_inputTrigger";var W_Q="mOpti";var b1t="lin";var c6U="ncel";var x_C="eta";var k6O='<div class="DTE_Processing_Indicator"><span></span></div>';var F2N="hild";var H23="\"></di";var q_c="_inputT";var V2U="ndexOf";var D0I="userAgent";k55.j5b();var Q44='tr';var P45="rigger";var d6U='" ';var c5S=j1O;c5S+=k1X;c5S+=v3U;var q6Q=k3x;q6Q+=b5m;var f$v=D1C;f$v+=D0wIj[394663];f$v+=c6U;var Z45=p4i;Z45+=l1B;var c_k=q_c;c_k+=P45;var b$j=k3x;b$j+=B68;var H20=F$D;H20+=H0E;H20+=W_Q;H20+=r2U;var G$w=C7x;G$w+=F7S;var c3t=F0k;c3t+=B1h;c3t+=H2R;c3t+=p4i;var w7T=j1O;w7T+=f5K;w7T+=b1t;w7T+=B1h;var _this=this;if(closeCb === void D0wIj[140995]){closeCb=m8f;}var closed=D0wIj[203584];var classes=this[H6i][w7T];var keys=Object[c3t](editFields);var editRow=editFields[keys[D0wIj[140995]]];var lastAttachPoint;var elements=[];for(var i=D0wIj[140995];i < editRow[G$w][G8t];i++){var E4M=C3h;E4M+=p4i;var A0q=b1l;A0q+=F9E;A0q+=p4i;A0q+=a7L;var Y6n=d5R;Y6n+=u7s;Y6n+=D0wIj[394663];Y6n+=n7y;var name_1=editRow[Y6n][i][D0wIj[140995]];elements[A0q]({field:this[p4i][E4M][name_1],name:name_1,node:$(editRow[u1c][i])});}var namespace=this[H20](opts);var ret=this[b$j](P1i);if(!ret){return this;}for(var _i=D0wIj[140995],elements_1=elements;_i < elements_1[G8t];_i++){var J9m=S1o;J9m+=H0E;var D2I=Y5b;D2I+=W_K;D2I+=S4n;var w1T=f5K;w1T+=G71;w1T+=B1h;var O3W=T0U;O3W+=w9q;O3W+=D0wIj[482911];var L5g=D0wIj[394663];L5g+=l0X;L5g+=S4n;var q3W=M5I;q3W+=e4X;var j1J=V6P;j1J+=H0E;var C_W=D0wIj[482911];C_W+=j1O;C_W+=p$q;C_W+=B_2;var x9n=T0U;x9n+=o5M;x9n+=D0wIj[482911];var m5S=H23;m5S+=c9g;var e_7=N6v;e_7+=f0u;e_7+=P1j;e_7+=p4i;var d0K=L9S;d0K+=N46;d0K+=m2u;var o$H=O9i;o$H+=L70;var G1H=o9N;G1H+=H0E;G1H+=Y5b;G1H+=O_o;var B7L=U_g;B7L+=E2N;B7L+=D0wIj[394663];B7L+=m2u;var t1u=b1l;t1u+=V0h;t1u+=O9i;var L_z=o9N;L_z+=J9D;L_z+=u7s;L_z+=a7L;var I5M=O_C;I5M+=b5g;var A0g=j1O;A0g+=V2U;var A4T=D0wIj[482911];A4T+=x_C;A4T+=D1C;A4T+=a7L;var O9l=D1C;O9l+=F2N;O9l+=L3v;O9l+=f5K;var el=elements_1[_i];var node=el[B0q];el[O9l]=node[U36]()[A4T]();var style=navigator[D0I][A0g](c6F) !== -b6E?I5M + node[L_z]() + t1u:R_6;node[R0y]($(B7L + classes[G1H] + o$H + d0K + classes[U4$] + d6U + style + g7y + k6O + L_Z + m9e + classes[e_7] + m5S + L_Z));node[x9n](C_W + classes[j1J][q3W](/ /g,y6n))[L5g](el[O3W][w1T]())[D2I](this[s9Y][J9m]);var insertParent=$(el[C3h][B0q]())[l75](Q44);if(insertParent[G8t]){lastAttachPoint=insertParent;}if(opts[v82]){var M5e=k3P;M5e+=D0wIj.R_0;M5e+=x0q;var h3j=D0wIj[482911];h3j+=D0wIj.R_0;h3j+=D0wIj[159052];var M$V=D0wIj[394663];M$V+=i6J;node[t03](Y8e + classes[v82][T6y](/ /g,y6n))[M$V](this[h3j][M5e]);}}var submitClose=this[c_k](Z45,opts,lastAttachPoint);var cancelClose=this[L3W](f$v,opts,lastAttachPoint);this[u_a](function(submitComplete,action){var f8h="forEach";var x$a=D1C;x$a+=a86;x$a+=G7x;x$a+=F0k;var A_7=D0wIj.R_0;A_7+=T0U;A_7+=T0U;closed=y_h;$(document)[A_7](x$a + namespace);if(!submitComplete || action !== k1w){elements[f8h](function(el){var a6c="det";var s$O=a6c;s$O+=D0wIj[394663];s$O+=D1C;s$O+=a7L;var u4N=q4m;u4N+=B1h;u4N+=f5K;u4N+=M$D;var T_n=Y3t;T_n+=B1h;el[T_n][u4N]()[s$O]();k55.j5b();el[B0q][R0y](el[e1Y]);});}submitClose();k55.c6l();cancelClose();_this[n$T]();if(closeCb){closeCb();}return P1i;});setTimeout(function(){var d9N="Ba";var o0j='mousedown';var x7e="dSelf";var z77="keyd";var c$e="own";var t8y=z77;t8y+=c$e;var o4s=D85;o4s+=x7e;var a_F=S1r;a_F+=a4u;var S7_=a5B;S7_+=d9N;S7_+=Z74;if(closed){return;}var back=$[D0wIj.I9n][S7_]?a_F:o4s;k55.c6l();var target;$(document)[P1j](o0j + namespace,function(e){var O9b="arge";var y6s=u7s;y6s+=O9b;y6s+=u7s;target=e[y6s];})[P1j](t8y + namespace,function(e){var w6F="tar";var n63=w6F;n63+=l3E;n63+=B1h;n63+=u7s;k55.j5b();target=e[n63];})[P1j](x1I + namespace,function(e){var g3I="_typ";var isIn=D0wIj[203584];for(var _i=D0wIj[140995],elements_2=elements;_i < elements_2[G8t];_i++){var L8S=I1d;L8S+=j2m;var o1g=D0wIj.R_0;o1g+=o9N;o1g+=x0q;var W5E=g3I;W5E+=w1f;var el=elements_2[_i];if(el[C3h][W5E](o1g,target) || $[L8S](el[B0q][D0wIj[140995]],$(target)[y2J]()[back]()) !== -b6E){isIn=y_h;}}if(!isIn){var b2j=N6v;b2j+=Q19;_this[b2j]();}});},D0wIj[140995]);this[q6Q]($[K3u](elements,function(el){var R$t=T0U;R$t+=n_8;return el[R$t];}),opts[b5m]);this[j8s](c5S,y_h);}function _inputTrigger(type,opts,insertPoint){var w6f="childNodes";var N$c="um";var N4Q="H";var K00="Trig";var t3x='click.dte-';var X99=D0wIj[394663];X99+=b1l;X99+=X3g;var N8w=D0wIj.R_0;N8w+=f5K;var Z6X=D5F;Z6X+=f5K;Z6X+=S7A;var x7H=f5K;x7H+=N$c;x7H+=N6v;x7H+=V$8;var x7F=u7s;x7F+=H0E;var O6d=N4Q;O6d+=u7s;O6d+=D0wIj[159052];O6d+=a86;var V45=K00;V45+=G2H;var _this=this;var trigger=opts[type + V45];var html=opts[type + O6d];var event=t3x + type;var tr=$(insertPoint)[l75](x7F);if(trigger === undefined){return function(){};}if(typeof trigger === x7H){var e6F=D1C;e6F+=J7i;e6F+=a86;e6F+=U$s;var kids=tr[e6F]();trigger=trigger < D0wIj[140995]?kids[kids[G8t] + trigger]:kids[trigger];}var children=$(trigger,tr)[Z6X]?Array[l_j][x4$][l5$]($(trigger,tr)[D0wIj[140995]][w6f]):[];$(children)[Z$n]();var triggerEl=$(trigger,tr)[N8w](event,function(e){var j$V=H8L;j$V+=f5K;j$V+=e1t;j$V+=a86;e[B8L]();if(type === j$V){_this[G35]();}else {_this[s_U]();}})[X99](html);return function(){var C$q=B1h;C$q+=D0wIj[159052];C$q+=b1l;k55.c6l();C$q+=W5N;var V7V=D0wIj.R_0;V7V+=T0U;V7V+=T0U;triggerEl[V7V](event)[C$q]()[R0y](children);};}function _optionsUpdate(json){var that=this;k55.c6l();if(json && json[X7h]){var j52=T0U;j52+=Y_s;j52+=n1h;var f6p=B1h;f6p+=D0wIj[394663];f6p+=v7g;$[f6p](this[p4i][j52],function(name,field){if(json[X7h][name] !== undefined){var L4P=F9E;L4P+=H0E;L4P+=a86;var I7q=D0wIj[394663];I7q+=D0wIj.C99;I7q+=D0wIj[394663];I7q+=V0h;var fieldInst=that[C3h](name);if(fieldInst[P_r] && fieldInst[P_r]()[I7q][L4P]()){return;}if(fieldInst && fieldInst[G_B]){var a3S=D0wIj.R_0;a3S+=b1l;a3S+=b0W;a3S+=r2U;var D9C=f3R;D9C+=D0wIj[482911];D9C+=D0wIj[394663];D9C+=e_t;fieldInst[D9C](json[a3S][name]);}}});}}function _message(el,msg,title,fn){var Z1E="stop";var W0Y="fadeOut";var F2e="removeAttr";var U4w="tm";var canAnimate=$[D0wIj.I9n][T5Z]?y_h:D0wIj[203584];if(title === undefined){title=D0wIj[203584];}if(!fn){fn=function(){};}if(typeof msg === D0wIj[253540]){var Q8G=t8E;Q8G+=b1l;Q8G+=j1O;msg=msg(this,new DataTable$4[Q8G](this[p4i][x81]));}el=$(el);if(canAnimate){el[Z1E]();}if(!msg){if(this[p4i][p5J] && canAnimate){el[W0Y](function(){el[E9n](R_6);fn();});}else {el[E9n](R_6)[q7L](T35,A7B);fn();}if(title){var K32=u7s;K32+=j1O;K32+=u7s;K32+=D5F;el[F2e](K32);}}else {fn();if(this[p4i][p5J] && canAnimate){var V1b=a7L;V1b+=U4w;V1b+=a86;el[V1b](msg)[G9s]();}else {var x$K=D0wIj.H4P;x$K+=D0wIj.R_0;x$K+=D1C;x$K+=F0k;var S$p=g9S;S$p+=b4H;S$p+=H2R;el[E9n](msg)[q7L](S$p,x$K);}if(title){var T8Q=D0wIj[394663];T8Q+=H60;el[T8Q](I_V,msg);}}}function _multiInfo(){var V94="isMultiValue";var n5r="iEditabl";var h8X="mult";var o_n="multiInfoShown";var b6s=C3h;k55.c6l();b6s+=p4i;var fields=this[p4i][b6s];var include=this[p4i][E3i];var show=y_h;var state;if(!include){return;}for(var i=D0wIj[140995],ien=include[G8t];i < ien;i++){var S8O=h8X;S8O+=n5r;S8O+=B1h;var field=fields[include[i]];var multiEditable=field[S8O]();if(field[V94]() && multiEditable && show){state=y_h;show=D0wIj[203584];}else if(field[V94]() && !multiEditable){state=y_h;}else {state=D0wIj[203584];}fields[include[i]][o_n](state);}}function _nestedClose(cb){var C8C="ntroller";var H8R="callback";var W$K="displayContro";var Q8Q="displayCo";var V6s="_sho";var O5v="displayControll";var x9F=g5s;x9F+=l3E;x9F+=u7s;x9F+=a7L;var K5Y=V6s;K5Y+=o9N;var X21=O5v;X21+=V$8;var disCtrl=this[p4i][X21];var show=disCtrl[K5Y];if(!show || !show[x9F]){if(cb){cb();}}else if(show[G8t] > b6E){var I0S=D0wIj[482911];I0S+=u7s;I0S+=B1h;var R42=D0wIj.R_0;R42+=b1l;R42+=B1h;R42+=f5K;var x8q=W$K;x8q+=a86;x8q+=a86;x8q+=V$8;var x$o=b1l;x$o+=D0wIj.R_0;x$o+=b1l;show[x$o]();var last=show[show[G8t] - b6E];if(cb){cb();}this[p4i][x8q][R42](last[I0S],last[R0y],last[H8R]);}else {var k5j=Q8Q;k5j+=C8C;this[p4i][k5j][G35](this,cb);show[G8t]=D0wIj[140995];}}function _nestedOpen(cb,nest){var f2G="_show";var C0m=W8F;C0m+=D0wIj[394663];C0m+=l0X;C0m+=H0E;var i8r=f$n;i8r+=B1h;i8r+=f5K;var m$Q=C5W;m$Q+=O_o;var m8C=D0wIj[482911];m8C+=D0wIj.R_0;m8C+=D0wIj[159052];var K_2=b1l;K_2+=F9E;K_2+=p4i;K_2+=a7L;var X9n=L1k;X9n+=a7L;X9n+=D0wIj.R_0;k55.c6l();X9n+=o9N;var v_u=k3x;v_u+=P_Z;v_u+=D0wIj.R_0;v_u+=o9N;var disCtrl=this[p4i][l7i];if(!disCtrl[v_u]){disCtrl[f2G]=[];}if(!nest){disCtrl[f2G][G8t]=D0wIj[140995];}disCtrl[X9n][K_2]({append:this[m8C][m$Q],callback:cb,dte:this});this[p4i][l7i][i8r](this,this[s9Y][C0m],cb);}function _postopen(type,immediate){var C0_="ernal";var i7m="submi";var h26="-int";var W1h="captureFocus";var p6Y="orm";var B1I="roller";var B32="t.editor";var N44="focus.ed";var M5C='submit.editor-internal';var w2G="bbl";var s$1="itor-focu";var q2A=N6v;q2A+=F9E;q2A+=w2G;q2A+=B1h;var Z8k=D0wIj[159052];Z8k+=D0wIj[394663];Z8k+=j1O;Z8k+=f5K;var j9F=i7m;j9F+=B32;j9F+=h26;j9F+=C0_;var t0h=D0wIj.R_0;t0h+=f5K;var w_F=T0U;w_F+=p6Y;var x0Z=a5a;x0Z+=P1j;x0Z+=u7s;x0Z+=B1I;var _this=this;var focusCapture=this[p4i][x0Z][W1h];if(focusCapture === undefined){focusCapture=y_h;}$(this[s9Y][w_F])[A2F](M5C)[t0h](j9F,function(e){e[N$I]();});if(focusCapture && (type === Z8k || type === q2A)){var T6H=N44;T6H+=s$1;T6H+=p4i;var n5Y=D0wIj.R_0;n5Y+=f5K;$(O9w)[n5Y](T6H,function(){var K5V="ED";var n2T="nts";var o3L="setFocus";var Y39="TE";var v8b="tFo";var b8d=T1$;b8d+=K5V;var c71=V_f;c71+=L3v;c71+=n2T;var d5J=B_2;d5J+=l17;d5J+=Y39;if($(document[i1C])[y2J](d5J)[G8t] === D0wIj[140995] && $(document[i1C])[c71](b8d)[G8t] === D0wIj[140995]){var J_M=w4l;J_M+=v8b;J_M+=D1C;J_M+=Y6D;if(_this[p4i][J_M]){var b7S=T0U;b7S+=D0wIj.R_0;b7S+=o_G;_this[p4i][o3L][b7S]();}}});}this[K1D]();this[k4q](Y4p,[type,this[p4i][X70]]);if(immediate){var W6N=q7Q;W6N+=u7s;W6N+=T0W;var c2H=f7c;c2H+=v3U;c2H+=D0wIj[482911];this[k4q](c2H,[type,this[p4i][W6N]]);}return y_h;}function _preopen(type){var y_k="cancelO";var m4X="Info";var m7x="_clearDyn";var B2l="eve";var F5y="earDyna";var n9s="amic";var X6H="micInfo";var M3n="Icb";var U3a="eIc";var V5f=A0e;V5f+=s7L;var h7B=h21;h7B+=F5y;h7B+=X6H;var S6w=q7Q;S6w+=b0W;S6w+=P1j;var z9I=T$R;z9I+=k_7;var N3l=k3x;N3l+=B2l;N3l+=f5K;N3l+=u7s;if(this[N3l](z9I,[type,this[p4i][S6w]]) === D0wIj[203584]){var F4E=P_V;F4E+=L0W;F4E+=U3a;F4E+=N6v;var L$D=D0wIj[159052];L$D+=D0wIj.R_0;L$D+=D0wIj[482911];L$D+=B1h;var C0V=o5M;C0V+=a86;C0V+=j1O;C0V+=v3U;var l0L=q_M;l0L+=D0wIj[482911];l0L+=B1h;var H7j=q7Q;H7j+=b0W;H7j+=P1j;var q4c=y_k;q4c+=b15;var x70=k3x;x70+=B1h;x70+=O1S;x70+=u7s;var p$R=m7x;p$R+=n9s;p$R+=m4X;this[p$R]();this[x70](q4c,[type,this[p4i][H7j]]);if((this[p4i][l0L] === C0V || this[p4i][L$D] === P3w) && this[p4i][F4E]){var a2s=G35;a2s+=M3n;this[p4i][a2s]();}this[p4i][Y9f]=m8f;return D0wIj[203584];}this[h7B](y_h);this[p4i][V5f]=type;return y_h;}function _processing(processing){var p8q="togg";var Q$g="roce";var N0L="roces";var F5s="iv.DTE";var L4h=b1l;L4h+=Q$g;L4h+=p4i;L4h+=S5e;var K4U=B_0;K4U+=h3b;K4U+=f5K;K4U+=u7s;var o7e=p8q;o7e+=a86;o7e+=T3m;var T4q=C5W;T4q+=O_o;var G9V=D0wIj[482911];G9V+=k6Z;var T5B=D0wIj[482911];T5B+=F5s;var z7F=q7Q;z7F+=u7s;z7F+=j1O;z7F+=h3b;var D91=b1l;D91+=N0L;D91+=S5e;var procClass=this[H6i][D91][z7F];$([T5B,this[G9V][T4q]])[o7e](procClass,processing);this[p4i][t7m]=processing;this[K4U](L4h,[processing]);}function _noProcessing(args){var w2l=M5l;w2l+=w7n;w2l+=p4i;var J$c=B1h;J$c+=D0wIj[394663];J$c+=D1C;J$c+=a7L;var processing=D0wIj[203584];$[J$c](this[p4i][w2l],function(name,field){var E5C="proce";k55.j5b();var x$g=E5C;x$g+=v5w;x$g+=o5M;x$g+=l3E;if(field[x$g]()){processing=y_h;}});if(processing){var p88=D0wIj.R_0;p88+=f5K;p88+=B1h;this[p88](R3Y,function(){k55.j5b();var x8v="_sub";if(this[a$E](args) === y_h){var m8x=x8v;m8x+=D0wIj[159052];m8x+=j1O;m8x+=u7s;this[m8x][X2b](this,args);}});}return !processing;}function _submit(successCallback,errorCallback,formatdata,hide){var c6N="onCo";var O$9='Field is still processing';var o8A='all';var d9j="clos";var T7L='preSubmit';var x7Q=16;var R4f="_proc";var Y4r='allIfChanged';var S1x="editData";var I7w=L7M;I7w+=u7s;I7w+=v5A;I7w+=D0wIj[482911];var y$C=q7Q;y$C+=s84;var F9e=B1h;F9e+=D0wIj[482911];F9e+=r28;var _this=this;var changed=D0wIj[203584];var allData={};var changedData={};var setBuilder=dataSet;var fields=this[p4i][Z7H];var editCount=this[p4i][m$k];var editFields=this[p4i][X09];var editData=this[p4i][S1x];var opts=this[p4i][F9e];var changedSubmit=opts[s_U];var submitParamsLocal;if(this[a$E](arguments) === D0wIj[203584]){var D$g=V$8;D$g+=j0i;Editor[D$g](O$9,x7Q,D0wIj[203584]);return;}var action=this[p4i][y$C];var submitParams={data:{}};submitParams[this[p4i][o0W]]=action;if(action === k0P || action === k1w){var S4N=D1C;S4N+=X6J;var T4Y=a3m;T4Y+=v7g;$[T4Y](editFields,function(idSrc,edit){var allRowData={};var changedRowData={};$[G5C](fields,function(name,field){k55.j5b();var M61='-many-count';var o$0='[]';var Z8f="submittable";var b$V=/\[.*$/;if(edit[Z7H][name] && field[Z8f]()){var D_X=B1h;D_X+=D0wIj[482911];D_X+=r4D;var F$y=p4i;F$y+=u7s;F$y+=k6t;F$y+=l3E;var w8D=k0Y;w8D+=J2b;w8D+=v3s;var multiGet=field[w2Z]();var builder=setBuilder(name);if(multiGet[idSrc] === undefined){var t14=a4R;t14+=D0wIj[394663];var V_$=W_7;V_$+=I9b;var originalVal=field[V_$](edit[t14]);builder(allRowData,originalVal);return;}var value=multiGet[idSrc];var manyBuilder=Array[w8D](value) && typeof name === F$y && name[C3_](o$0) !== -b6E?setBuilder(name[T6y](b$V,R_6) + M61):m8f;builder(allRowData,value);if(manyBuilder){var w3N=t_y;w3N+=n16;manyBuilder(allRowData,value[w3N]);}if(action === D_X && (!editData[name] || !field[U7W](value,editData[name][idSrc]))){builder(changedRowData,value);changed=y_h;if(manyBuilder){manyBuilder(changedRowData,value[G8t]);}}}});if(!$[s7H](allRowData)){allData[idSrc]=allRowData;}if(!$[s7H](changedRowData)){changedData[idSrc]=changedRowData;}});if(action === k0P || changedSubmit === o8A || changedSubmit === Y4r && changed){var R8e=D0wIj[482911];R8e+=d5R;R8e+=D0wIj[394663];submitParams[R8e]=allData;}else if(changedSubmit === S4N && changed){var O8$=D0wIj[482911];O8$+=d5R;O8$+=D0wIj[394663];submitParams[O8$]=changedData;}else {var h60=R4f;h60+=A9g;var f5Q=c6N;f5Q+=y76;var K5J=d9j;K5J+=B1h;this[p4i][X70]=m8f;if(opts[l9i] === K5J && (hide === undefined || hide)){this[f8N](D0wIj[203584]);}else if(typeof opts[f5Q] === D0wIj[253540]){opts[l9i](this);}if(successCallback){var R8K=T8u;R8K+=a86;successCallback[R8K](this);}this[h60](D0wIj[203584]);this[k4q](J$i);return;}}else if(action === F8m){$[G5C](editFields,function(idSrc,edit){var X7A=D0wIj[482911];X7A+=D0wIj[394663];X7A+=u7s;k55.j5b();X7A+=D0wIj[394663];submitParams[F0E][idSrc]=edit[X7A];});}submitParamsLocal=$[I7w](y_h,{},submitParams);if(formatdata){formatdata(submitParams);}this[k4q](T7L,[submitParams,action],function(result){var H8D="_submitTable";if(result === D0wIj[203584]){_this[h1g](D0wIj[203584]);}else {var p6i=D1C;p6i+=D0wIj[394663];p6i+=f7W;var q_I=M6$;q_I+=V0h;var submitWire=_this[p4i][q_I]?_this[j0N]:_this[H8D];submitWire[p6i](_this,submitParams,function(json,notGood,xhr){k55.c6l();var t86="_submitS";var X2U="ucce";var l4g=D0wIj[394663];l4g+=K18;l4g+=g$N;l4g+=f5K;var t0G=t86;t0G+=X2U;t0G+=v5w;_this[t0G](json,notGood,submitParams,submitParamsLocal,_this[p4i][l4g],editCount,hide,successCallback,errorCallback,xhr);},function(xhr,err,thrown){var a62="Error";var p2b=q7Q;p2b+=s84;var p9b=L1k;p9b+=l1B;p9b+=a62;_this[p9b](xhr,err,thrown,errorCallback,submitParams,_this[p4i][p2b]);},submitParams);}});}function _submitTable(data,success,error,submitParams){var w_n="indi";var x9a="mov";var A_9="mod";var W_8="ifier";var d68="vidual";var Q6q="ource";var t$8=L3v;t$8+=x9a;t$8+=B1h;var X5l=j1O;X5l+=D0wIj[482911];X5l+=I2_;var K9c=V5M;K9c+=P1j;var action=data[K9c];var out={data:[]};var idGet=dataGet(this[p4i][X5l]);var idSet=dataSet(this[p4i][X71]);if(action !== t$8){var p6r=D0wIj[482911];p6r+=d5R;p6r+=D0wIj[394663];var V_i=B1h;V_i+=q7Q;V_i+=a7L;var C4B=w_n;C4B+=d68;var O3H=x6B;O3H+=A5_;O3H+=Q6q;var y75=A_9;y75+=W_8;var W4E=T0U;W4E+=S4r;var x4U=D0wIj[159052];x4U+=D0wIj[394663];x4U+=j1O;x4U+=f5K;var J8t=D0wIj[159052];J8t+=D0wIj.R_0;J8t+=D0wIj[482911];J8t+=B1h;var originalData_1=this[p4i][J8t] === x4U?this[n2r](W4E,this[y75]()):this[O3H](C4B,this[T8Y]());$[V_i](data[p6r],function(key,vals){var Y0G="reate";var N4b=z5B;N4b+=P_Z;var L_J=D1C;L_J+=Y0G;var J$_=x3K;J$_+=r4D;var toSave;var extender=extendDeepObjShallowArr;if(action === J$_){var rowData=originalData_1[key][F0E];toSave=extender({},rowData);toSave=extender(toSave,vals);}else {toSave=extender({},vals);}var overrideId=idGet(toSave);if(action === L_J && overrideId === undefined){idSet(toSave,+new Date() + key[h7V]());}else {idSet(toSave,overrideId);}out[F0E][N4b](toSave);});}success(out);}function _submitSuccess(json,notGood,submitParams,submitParamsLocal,action,editCount,hide,successCallback,errorCallback,xhr){var S2K="eldErrors";var R40="omm";var n7A="ub";var G2Q="Coun";k55.c6l();var W_B="mitSucces";var s$5="tE";var S54='prep';var C_v="onCompl";var z4o="_c";var i_g="dataSource";var o8a="taSource";var g5q="ssful";var W3G="emo";var u6N='preCreate';var n2m="_da";var Y$t="modifie";var u8Y="stC";var Y3F="mitUnsucce";var d5v="stSubmit";var k6u="ids";var u8v="Re";var q0M="setD";var V2R="R";var o9K="preEd";var d05="taSo";var t0r='commit';var Z_1=B1h;Z_1+=J2b;Z_1+=f8i;var e_f=W1G;e_f+=d5v;var j2H=Y$t;j2H+=H0E;var h4f=B1h;h4f+=D0wIj[482911];h4f+=r28;var d6N=H4J;d6N+=l6b;d6N+=D0wIj[482911];d6N+=p4i;var _this=this;var that=this;var setData;var fields=this[p4i][d6N];var opts=this[p4i][h4f];var modifier=this[p4i][j2H];this[k4q](e_f,[json,submitParams,action,xhr]);if(!json[E3Q]){var u12=V$8;u12+=O9A;u12+=H0E;json[u12]=R_6;}if(!json[J_c]){var q$L=T0U;q$L+=j1O;q$L+=S2K;json[q$L]=[];}if(notGood || json[Z_1] || json[J_c][G8t]){var s4N=p4i;s4N+=n7A;s4N+=Y3F;s4N+=g5q;var M$b=g10;M$b+=N6v;M$b+=H0E;M$b+=L70;var globalError_1=[];if(json[E3Q]){var U45=b1l;U45+=F9E;U45+=p4i;U45+=a7L;globalError_1[U45](json[E3Q]);}$[G5C](json[J_c],function(i,err){var K$o="osition";var s1B='Unknown field: ';var N_R="onFieldError";var g9T=500;var J0n='Error';var v3J="bodyCon";var k0l=f5K;k0l+=D0wIj[394663];k0l+=D0wIj[159052];k0l+=B1h;var field=fields[err[k0l]];if(!field){var M3P=f5K;M3P+=V_8;M3P+=B1h;throw new Error(s1B + err[M3P]);}else if(field[p5J]()){field[E3Q](err[G$J] || J0n);if(i === D0wIj[140995]){if(opts[N_R] === i5T){var q22=u7s;q22+=D0wIj.R_0;q22+=b1l;var D2m=b1l;D2m+=K$o;var V1L=f5K;V1L+=G71;V1L+=B1h;var J_P=v3J;J_P+=M9Y;J_P+=u7s;var W7n=D0wIj[482911];W7n+=D0wIj.R_0;W7n+=D0wIj[159052];_this[C_V]($(_this[W7n][J_P]),{scrollTop:$(field[V1L]())[D2m]()[q22]},g9T);field[b5m]();}else if(typeof opts[N_R] === D0wIj[253540]){opts[N_R](_this,err);}}}else {var j_I=r01;j_I+=H0E;j_I+=H0E;j_I+=f8i;var K_F=f1j;K_F+=l9r;var a0m=U8C;a0m+=F$a;var q_b=b1l;q_b+=F9E;q_b+=p4i;q_b+=a7L;globalError_1[q_b](field[T$O]() + a0m + (err[K_F] || j_I));}});this[E3Q](globalError_1[y4f](M$b));this[k4q](s4N,[json]);if(errorCallback){var u2z=D1C;u2z+=D0wIj[394663];u2z+=a86;u2z+=a86;errorCallback[u2z](that,json);}}else {var X4Z=p4i;X4Z+=n7A;X4Z+=W_B;X4Z+=p4i;var E35=p_F;E35+=G2Q;E35+=u7s;var q5K=a4R;q5K+=D0wIj[394663];var store={};if(json[q5K] && (action === k0P || action === k1w)){var R56=D0wIj[482911];R56+=D0wIj[394663];R56+=Y6m;var b4N=D1C;b4N+=R40;b4N+=r4D;var b0b=n2m;b0b+=d05;b0b+=A1y;b0b+=B1h;var m73=J6L;m73+=e1t;this[m73](S54,action,modifier,submitParamsLocal,json,store);for(var _i=D0wIj[140995],_a=json[F0E];_i < _a[G8t];_i++){var W3F=B1h;W3F+=G80;W3F+=u7s;var P2q=q0M;P2q+=d5R;P2q+=D0wIj[394663];var data=_a[_i];setData=data;var id=this[n2r](K$$,data);this[k4q](P2q,[json,data,action]);if(action === k0P){var N55=W1G;N55+=u8Y;N55+=l9W;N55+=B1h;var q6A=D1C;q6A+=L3v;q6A+=g18;var K2S=x6B;K2S+=l0W;K2S+=A1y;K2S+=B1h;var r56=k3x;r56+=D5W;this[r56](u6N,[json,data,id]);this[K2S](q6A,fields,data,store);this[k4q]([k0P,N55],[json,data,id]);}else if(action === W3F){var B1O=b1l;B1O+=L0W;B1O+=s$5;B1O+=Q3f;var o8c=B1h;o8c+=G80;o8c+=u7s;var E$V=B1h;E$V+=D0wIj[482911];E$V+=j1O;E$V+=u7s;var S9z=k3x;S9z+=m0o;S9z+=o8a;var G7E=o9K;G7E+=r4D;this[k4q](G7E,[json,data,id]);this[S9z](E$V,modifier,fields,data,store);this[k4q]([o8c,B1O],[json,data,id]);}}this[b0b](b4N,action,modifier,json[R56],store);}else if(action === F8m){var k_0=D0wIj[482911];k_0+=D0wIj[394663];k_0+=u7s;k_0+=D0wIj[394663];var C4Z=k3x;C4Z+=i_g;var y_f=j1O;y_f+=D0wIj[482911];y_f+=p4i;var y4h=w$M;y4h+=u8v;y4h+=y$N;var w3$=L3v;w3$+=q_M;w3$+=h3b;var s7t=J6L;s7t+=e1t;var l_d=g6$;l_d+=V2R;l_d+=W3G;l_d+=h3b;var I0D=x6B;I0D+=l0W;I0D+=t3n;I0D+=e1t;this[I0D](S54,action,modifier,submitParamsLocal,json,store);this[k4q](l_d,[json,this[k6u]()]);this[s7t](w3$,modifier,fields,store);this[k4q]([F8m,y4h],[json,this[y_f]()]);this[C4Z](t0r,action,modifier,json[k_0],store);}if(editCount === this[p4i][E35]){var V4w=C_v;V4w+=B1h;V4w+=e_t;var i0m=C1u;i0m+=T0W;var V6u=D0wIj[394663];V6u+=D1C;V6u+=m2s;V6u+=f5K;var sAction=this[p4i][V6u];this[p4i][i0m]=m8f;if(opts[V4w] === m4Z && (hide === undefined || hide)){var k5d=z4o;k5d+=a86;k5d+=t8T;this[k5d](json[F0E]?y_h:D0wIj[203584],sAction);}else if(typeof opts[l9i] === D0wIj[253540]){opts[l9i](this);}}if(successCallback){successCallback[l5$](that,json);}this[k4q](X4Z,[json,setData,action]);}this[h1g](D0wIj[203584]);this[k4q](J$i,[json,setData,action]);}function _submitError(xhr,err,thrown,errorCallback,submitParams,action){var B5B="system";var M8Z="mple";var X1J="rocessi";var E3m="bmitError";var C_g="postSubm";var n$H=s_U;n$H+=a4k;n$H+=M8Z;n$H+=e_t;var I_u=Y0_;I_u+=E3m;var V_r=d8U;V_r+=X1J;V_r+=f5K;V_r+=l3E;var s1$=B1h;s1$+=J2b;s1$+=f8i;var w9M=C_g;w9M+=r4D;this[k4q](w9M,[m8f,submitParams,action,xhr]);this[s1$](this[B8M][E3Q][B5B]);this[V_r](D0wIj[203584]);if(errorCallback){var D2b=D1C;D2b+=T0_;D2b+=a86;errorCallback[D2b](this,xhr,err,thrown);}this[k4q]([I_u,n$H],[xhr,err,thrown,submitParams]);}function _tidy(fn){var B0k="atur";var W2U="oFe";var X6E="submitCo";var W_v="erverS";var Z17=a8S;Z17+=D0wIj.H4P;Z17+=B1h;var O$2=g9S;O$2+=a86;O$2+=D0wIj[394663];O$2+=H2R;var c9B=j1O;c9B+=k1X;c9B+=f5K;c9B+=B1h;var m5Y=u7s;m5Y+=D0wIj[394663];m5Y+=y1E;var U$_=r6R;k55.c6l();U$_+=B1h;var _this=this;var dt=this[p4i][U$_]?new DataTable$4[K8Q](this[p4i][m5Y]):m8f;var ssp=D0wIj[203584];if(dt){var A$l=N6v;A$l+=A5_;A$l+=W_v;A$l+=e_g;var J7Y=W2U;J7Y+=B0k;J7Y+=B7_;var Q_g=p4i;Q_g+=c6i;Q_g+=b0W;Q_g+=J7x;ssp=dt[Q_g]()[D0wIj[140995]][J7Y][A$l];}if(this[p4i][t7m]){var C9R=X6E;C9R+=y76;this[H$_](C9R,function(){if(ssp){var s4o=D0wIj[482911];s4o+=H0E;s4o+=D0wIj[394663];s4o+=o9N;var V4V=D0wIj.R_0;V4V+=f5K;V4V+=B1h;dt[V4V](s4o,fn);}else {setTimeout(function(){fn();},A17);}});return y_h;}else if(this[K6T]() === c9B || this[O$2]() === Z17){var E8Z=D1C;E8Z+=p$X;E8Z+=B1h;this[H$_](E8Z,function(){if(!_this[p4i][t7m]){setTimeout(function(){k55.c6l();if(_this[p4i]){fn();}},A17);}else {var S$O=D0wIj.R_0;S$O+=f5K;S$O+=B1h;_this[S$O](J$i,function(e,json){var d73='draw';k55.c6l();if(ssp && json){dt[H$_](d73,fn);}else {setTimeout(function(){k55.c6l();if(_this[p4i]){fn();}},A17);}});}})[Q83]();return y_h;}return D0wIj[203584];}function _weakInArray(name,arr){k55.j5b();for(var i=D0wIj[140995],ien=arr[G8t];i < ien;i++){if(name == arr[i]){return i;}}return -b6E;}var fieldType={create:function(){},disable:function(){},enable:function(){},get:function(){},set:function(){}};var DataTable$3=$[D0wIj.I9n][V_K];function _buttonText(conf,textIn){var n1q='Choose file...';var B2w='div.upload button';var Z3a="adT";if(textIn === m8f || textIn === undefined){var k66=S24;k66+=Z3a;k66+=i1v;textIn=conf[k66] || n1q;}k55.c6l();conf[u4Z][t03](B2w)[E9n](textIn);}function _commonUpload(editor,conf,dropCallback,multiple){var J51="Read";var n7x="lick";var M8K="iv.";var s85="/div";var z9d='<div class="editor_upload">';var k01="[type=fi";var C1O="tiple";var O$m="rValue\">";var E0N='Drag and drop a file here to upload';var m6m="rendered";var P9x='dragleave dragexit';var k7m='"></button>';var d9b="<div clas";var Y5R='drop';var m5_='<div class="cell">';var d2G="nput";var H_W="<div class=\"cell clea";var x40="le]";var K$a="imitHide\">";var i6f='div.drop span';var N7P="input[type=fil";var u6k="class=\"row second\">";var Q6X="Hi";var H9I="></in";var G5p="s=\"r";var h7h="input type=\"f";var Y7J="dragDropText";var I$P="[type=";var u4h="eu_ta";var V$q='noDrop';var p5Q="lass=\"";var N8m="de\">";var a9v="file]";var A7O="<div class=\"cell ";var D0r="ble\">";var y8o="le\" ";var b2Q="nab";var u$m="div cl";var L9g=".d";var O1D="e]";var t_A="div";var c2w="buttonInternal";var P9d="dragDrop";var n_w="Fil";var x9_="ow\">";var r2Z="ddClass";var G0t="ass=\"cell upload l";var P1o="put>";var m0W='div.clearValue button';var u5l="<div class=\"drop\"><span></";var C2_='<div class="rendered"></div>';var k0L="drago";var d8_="\"></b";var q5_='<button class="';var b52=D0wIj.R_0;b52+=f5K;var r7_=N7P;r7_+=O1D;var c3i=T0U;c3i+=j1O;c3i+=f5K;c3i+=D0wIj[482911];var a5q=D1C;a5q+=n7x;var v3w=D0wIj.R_0;v3w+=f5K;var h1c=T0U;h1c+=j1O;h1c+=S4n;k55.c6l();var J_7=n_w;J_7+=B1h;J_7+=J51;J_7+=V$8;var h3I=k3x;h3I+=B1h;h3I+=b2Q;h3I+=B8g;var l6$=g10;l6$+=P1Q;l6$+=c9g;var J1x=q51;J1x+=D0wIj[482911];J1x+=f9D;var z4N=u5l;z4N+=T2z;z4N+=D8W;var j8$=A7O;j8$+=n8O;j8$+=Q6X;j8$+=N8m;var b_m=L9S;b_m+=u6k;var X0k=g10;X0k+=s85;X0k+=L70;var j3D=g10;j3D+=a1g;j3D+=G80;j3D+=c9g;var u0T=H_W;u0T+=O$m;var m$N=H9I;m$N+=P1o;var R6n=D0wIj[159052];R6n+=F9E;R6n+=a86;R6n+=C1O;var j2A=g10;j2A+=h7h;j2A+=j1O;j2A+=y8o;var u_B=d8_;u_B+=F9E;u_B+=z3x;u_B+=L70;var w1G=g10;w1G+=u$m;w1G+=G0t;w1G+=K$a;var d_q=d9b;d_q+=G5p;d_q+=x9_;var S8x=x2X;S8x+=p5Q;S8x+=u4h;S8x+=D0r;if(multiple === void D0wIj[140995]){multiple=D0wIj[203584];}var btnClass=editor[H6i][u7M][c2w];var container=$(z9d + S8x + d_q + w1G + q5_ + btnClass + u_B + j2A + (multiple?R6n:R_6) + m$N + L_Z + u0T + q5_ + btnClass + k7m + j3D + X0k + b_m + j8$ + z4N + L_Z + m5_ + C2_ + L_Z + J1x + L_Z + l6$);conf[u4Z]=container;conf[h3I]=y_h;if(conf[J9D]){var o8C=D0wIj[394663];o8C+=N5Y;o8C+=H0E;var i3B=j1O;i3B+=d2G;i3B+=k01;i3B+=x40;var h4X=H4J;h4X+=S4n;container[h4X](i3B)[o8C](K$$,Editor[f71](conf[J9D]));}if(conf[G6h]){var S2A=d5R;S2A+=V6Y;var u5X=O0h;u5X+=I$P;u5X+=a9v;var i3S=T0U;i3S+=j1O;i3S+=f5K;i3S+=D0wIj[482911];container[i3S](u5X)[G6h](conf[S2A]);}_buttonText(conf);if(window[J_7] && conf[P9d] !== D0wIj[203584]){var A_p=D1C;A_p+=a86;A_p+=L0W;A_p+=B1h;var i8A=k0L;i8A+=p$q;i8A+=V$8;var t$N=D0wIj.R_0;t$N+=f5K;var C0c=D0wIj.R_0;C0c+=f5K;var i1V=t_A;i1V+=L9g;i1V+=H0E;i1V+=f$n;var e$H=H4J;e$H+=f5K;e$H+=D0wIj[482911];var y_X=u7s;y_X+=B1h;y_X+=K7k;container[t03](i6f)[y_X](conf[Y7J] || E0N);var dragDrop_1=container[e$H](i1V);dragDrop_1[C0c](Y5R,function(e){var a9s="dataTransfer";var x_4="lEve";var R14="origina";var Y5$=k3x;Y5$+=E8G;Y5$+=N6v;Y5$+=B8g;if(conf[Y5$]){var O8X=I4R;O8X+=V$8;var Z0I=h5u;Z0I+=x1o;Z0I+=a86;Z0I+=E9_;var K$t=R14;K$t+=x_4;K$t+=D0wIj.m1R;var X7D=K24;X7D+=D0wIj[482911];Editor[X7D](editor,conf,e[K$t][a9s][z6u],_buttonText,dropCallback);dragDrop_1[Z0I](O8X);}return D0wIj[203584];})[P1j](P9x,function(e){var W$x="veCla";k55.c6l();if(conf[g49]){var r3I=D0wIj.R_0;r3I+=p$q;r3I+=B1h;r3I+=H0E;var Y1$=y6B;Y1$+=W$x;Y1$+=v5w;dragDrop_1[Y1$](r3I);}return D0wIj[203584];})[t$N](i8A,function(e){var Q9U=W7c;Q9U+=D5F;Q9U+=D0wIj[482911];k55.j5b();if(conf[Q9U]){var k3o=I4R;k3o+=B1h;k3o+=H0E;dragDrop_1[M7k](k3o);}return D0wIj[203584];});editor[P1j](Y4p,function(){var B3e='dragover.DTE_Upload drop.DTE_Upload';var J4A=D0wIj.R_0;J4A+=f5K;k55.j5b();$(O9w)[J4A](B3e,function(e){return D0wIj[203584];});})[P1j](A_p,function(){var L5A="dragove";var l24="r.DTE_Upload drop.DTE_Upload";var F6C=L5A;F6C+=l24;k55.j5b();var U8$=D0wIj.R_0;U8$+=Z1h;$(O9w)[U8$](F6C);});}else {var X52=D0wIj[482911];X52+=M8K;X52+=m6m;var P9_=X9C;P9_+=D0T;var R$O=D0wIj[394663];R$O+=r2Z;container[R$O](V$q);container[P9_](container[t03](X52));}container[h1c](m0W)[v3w](a5q,function(e){var x1c=B_0;k55.c6l();x1c+=b2Q;x1c+=B8g;e[N$I]();if(conf[x1c]){var M1X=D1C;M1X+=D0wIj[394663];M1X+=a86;M1X+=a86;var H_9=p4i;H_9+=B1h;H_9+=u7s;upload[H_9][M1X](editor,conf,R_6);}});container[c3i](r7_)[b52](I_F,function(){var u6V=W5p;u6V+=B7_;Editor[U7r](editor,conf,this[u6V],_buttonText,function(ids,error){var f8q='input[type=file]';var c$m=p$q;c$m+=D0wIj[394663];c$m+=F_5;var j6Q=f9F;j6Q+=D0wIj[482911];if(!error){dropCallback[l5$](editor,ids);}container[j6Q](f8q)[D0wIj[140995]][c$m]=R_6;});});return container;}function _triggerChange(input){setTimeout(function(){k55.c6l();input[h8s](Z_v,{editor:y_h,editorSet:y_h});},D0wIj[140995]);}var baseFieldType=$[z7O](y_h,{},fieldType,{canReturnSubmit:function(conf,node){k55.j5b();return y_h;},disable:function(conf){var W5n="sab";var z3F=G80;z3F+=W5n;k55.c6l();z3F+=a86;z3F+=x3K;conf[u4Z][w$V](z3F,y_h);},enable:function(conf){var F5T=G80;F5T+=Z$T;F5T+=a8U;var h5C=b1l;h5C+=H0E;h5C+=f$n;k55.c6l();conf[u4Z][h5C](F5T,D0wIj[203584]);},get:function(conf){var h3t=p$q;h3t+=D0wIj[394663];h3t+=a86;var G3o=k3x;G3o+=o5M;G3o+=b1l;G3o+=B9a;return conf[G3o][h3t]();},set:function(conf,val){var R0d=g99;R0d+=o$f;R0d+=u7s;var v6G=p$q;v6G+=D0wIj[394663];v6G+=a86;conf[u4Z][v6G](val);_triggerChange(conf[R0d]);}});var hidden={create:function(conf){var r1S="alu";var N7u='<input/>';var X4M=p$q;X4M+=r1S;X4M+=B1h;var i4F=k3x;i4F+=p$q;i4F+=D0wIj[394663];i4F+=a86;conf[u4Z]=$(N7u);k55.c6l();conf[i4F]=conf[X4M];return m8f;},get:function(conf){k55.j5b();return conf[e_Q];},set:function(conf,val){var T_y=I7B;T_y+=a86;var V1B=A__;V1B+=T0_;var oldVal=conf[V1B];conf[e_Q]=val;conf[u4Z][T_y](val);if(oldVal !== val){_triggerChange(conf[u4Z]);}}};var readonly=$[q_n](y_h,{},baseFieldType,{create:function(conf){var M9i="eadonl";var m0K="ut/>";var c_M=g99;c_M+=o$f;c_M+=u7s;var s56=u7s;s56+=B1h;s56+=V0h;s56+=u7s;var c6m=H0E;c6m+=M9i;c6m+=H2R;var Q$G=j1O;Q$G+=D0wIj[482911];var H3I=d5R;H3I+=u7s;H3I+=H0E;var i9v=L$y;i9v+=U_w;i9v+=m0K;var v5G=k3x;v5G+=j1O;v5G+=U_w;v5G+=B9a;conf[v5G]=$(i9v)[H3I]($[z7O]({id:Editor[f71](conf[Q$G]),readonly:c6m,type:s56},conf[G6h] || ({})));return conf[c_M][D0wIj[140995]];}});var text=$[z7O](y_h,{},baseFieldType,{create:function(conf){var f3P="eI";var f7x="input/>";var d8L=d5R;d8L+=V6Y;var B3P=u7s;B3P+=B1h;B3P+=K7k;var C7o=Q1k;C7o+=f3P;C7o+=D0wIj[482911];var T1J=D0wIj[394663];T1J+=u7s;T1J+=u7s;T1J+=H0E;var K3G=g10;K3G+=f7x;var W7a=S_h;W7a+=B9a;conf[W7a]=$(K3G)[T1J]($[z7O]({id:Editor[C7o](conf[J9D]),type:B3P},conf[d8L] || ({})));return conf[u4Z][D0wIj[140995]];}});var password=$[G9B](y_h,{},baseFieldType,{create:function(conf){var w9u='password';var G4_="t/";var a5l=S_h;a5l+=F9E;k55.c6l();a5l+=u7s;var W9B=D0wIj[394663];W9B+=u7s;W9B+=u7s;W9B+=H0E;var R7F=Z$T;R7F+=b5v;R7F+=R1F;R7F+=D0wIj[482911];var F1u=L$y;F1u+=o$f;F1u+=G4_;F1u+=L70;conf[u4Z]=$(F1u)[G6h]($[z7O]({id:Editor[R7F](conf[J9D]),type:w9u},conf[W9B] || ({})));return conf[a5l][D0wIj[140995]];}});var textarea=$[z7O](y_h,{},baseFieldType,{canReturnSubmit:function(conf,node){return D0wIj[203584];},create:function(conf){var A_b="exten";var w7p='<textarea></textarea>';var L0H=k3x;L0H+=o5M;L0H+=z5B;L0H+=u7s;var l1L=Q1k;l1L+=f8t;var i7a=A_b;i7a+=D0wIj[482911];conf[u4Z]=$(w7p)[G6h]($[i7a]({id:Editor[l1L](conf[J9D])},conf[G6h] || ({})));return conf[L0H][D0wIj[140995]];}});var select=$[z7O](y_h,{},baseFieldType,{_addOptions:function(conf,opts,append){var b6L="older";k55.c6l();var A9v="hidden";var B5R="placeholderValu";var c7Z="placeholderDisabled";var p$L="placeh";var Z8S="placeholder";var W3B="placeholderVa";var Z2u="_editor_v";var i08=k3x;i08+=P2h;i08+=B9a;if(append === void D0wIj[140995]){append=D0wIj[203584];}var elOpts=conf[i08][D0wIj[140995]][X7h];var countOffset=D0wIj[140995];if(!append){elOpts[G8t]=D0wIj[140995];if(conf[Z8S] !== undefined){var j7Y=Z2u;j7Y+=D0wIj[394663];j7Y+=a86;var f9U=p62;f9U+=B87;f9U+=B8g;var Y_M=p$L;Y_M+=b6L;var i$L=W3B;i$L+=z3W;i$L+=B1h;var c1s=B5R;c1s+=B1h;var placeholderValue=conf[c1s] !== undefined?conf[i$L]:R_6;countOffset+=b6E;elOpts[D0wIj[140995]]=new Option(conf[Y_M],placeholderValue);var disabled=conf[c7Z] !== undefined?conf[c7Z]:y_h;elOpts[D0wIj[140995]][A9v]=disabled;elOpts[D0wIj[140995]][f9U]=disabled;elOpts[D0wIj[140995]][j7Y]=placeholderValue;}}else {var E4U=a86;E4U+=n8u;countOffset=elOpts[E4U];}if(opts){Editor[O2i](opts,conf[z9O],function(val,label,i,attr){var k6r=L2V;k6r+=e_Q;var option=new Option(label,val);option[k6r]=val;if(attr){$(option)[G6h](attr);}elOpts[i + countOffset]=option;});}},create:function(conf){var J04="feI";var i70='<select></select>';var E_y=g99;E_y+=U_w;E_y+=B9a;var b4e=D0wIj.R_0;b4e+=f5K;var W7I=D0wIj[394663];W7I+=H60;var T28=j1O;T28+=D0wIj[482911];var T_I=Z$T;T_I+=J04;T_I+=D0wIj[482911];var t1Z=B1h;t1Z+=K7k;t1Z+=D0T;var B$Y=D0wIj[394663];B$Y+=u7s;B$Y+=V6Y;var t2y=S_h;t2y+=B9a;conf[t2y]=$(i70)[B$Y]($[t1Z]({id:Editor[T_I](conf[T28]),multiple:conf[c7D] === y_h},conf[W7I] || ({})))[b4e](N9C,function(e,d){var T87=B1h;k55.c6l();T87+=G80;T87+=u7s;T87+=f8i;if(!d || !d[T87]){var y0b=l3E;y0b+=B1h;y0b+=u7s;conf[N9m]=select[y0b](conf);}});select[g12](conf,conf[X7h] || conf[B9L]);return conf[E_y][D0wIj[140995]];},destroy:function(conf){k55.c6l();var Y19=z3J;Y19+=c4F;conf[Y19][A2F](N9C);},get:function(conf){var O3c="ption";var q80="rator";var C1r=a86;C1r+=v5A;C1r+=w5E;C1r+=a7L;var t23=p3o;t23+=t8E;t23+=T6F;t23+=H2R;var J9K=D0wIj[159052];J9K+=D0wIj[394663];J9K+=b1l;var S$R=D0wIj.R_0;S$R+=O3c;S$R+=U8C;S$R+=v_g;var t_5=T0U;t_5+=j1O;t_5+=S4n;var val=conf[u4Z][t_5](S$R)[J9K](function(){var C$J="r_val";var j$s="edito";k55.j5b();var l9O=k3x;l9O+=j$s;l9O+=C$J;return this[l9O];})[t23]();if(conf[c7D]){var m9G=w4l;m9G+=b1l;m9G+=D0wIj[394663];m9G+=q80;return conf[u49]?val[y4f](conf[m9G]):val;}return val[C1r]?val[D0wIj[140995]]:m8f;},set:function(conf,val,localUpdate){var I7b="plac";var G2Z='option';var j5U="eholder";var B9I=I7b;B9I+=j5U;var G7V=z3J;G7V+=c4F;var w97=D0wIj.R_0;w97+=Q3a;w97+=j1O;w97+=P1j;var z69=T0U;z69+=j1O;z69+=f5K;z69+=D0wIj[482911];var d1W=k3x;d1W+=O0h;var g9o=g5s;g9o+=l3E;g9o+=u7s;g9o+=a7L;if(!localUpdate){conf[N9m]=val;}if(conf[c7D] && conf[u49] && !Array[k9E](val)){val=typeof val === D3C?val[L5M](conf[u49]):[];}else if(!Array[k9E](val)){val=[val];}var i;var len=val[g9o];var found;var allFound=D0wIj[203584];var options=conf[d1W][z69](w97);conf[G7V][t03](G2Z)[G5C](function(){found=D0wIj[203584];for(i=D0wIj[140995];i < len;i++){if(this[y7X] == val[i]){found=y_h;allFound=y_h;break;}}this[v_g]=found;});if(conf[B9I] && !allFound && !conf[c7D] && options[G8t]){options[D0wIj[140995]][v_g]=y_h;}if(!localUpdate){_triggerChange(conf[u4Z]);}return allFound;},update:function(conf,options,append){var S_0="stSe";var Y_q="_la";var r5$=Y_q;r5$+=S_0;r5$+=u7s;select[g12](conf,options,append);k55.c6l();var lastSet=conf[r5$];if(lastSet !== undefined){select[f_E](conf,lastSet,y_h);}_triggerChange(conf[u4Z]);}});var checkbox=$[z7O](y_h,{},baseFieldType,{_addOptions:function(conf,opts,append){var T89="rs";var a6j=S_h;a6j+=B9a;if(append === void D0wIj[140995]){append=D0wIj[203584];}var jqInput=conf[a6j];var offset=D0wIj[140995];if(!append){var Z_d=B1h;Z_d+=D0wIj[159052];Z_d+=Q3a;Z_d+=H2R;jqInput[Z_d]();}else {var J3X=P2h;J3X+=F9E;J3X+=u7s;offset=$(J3X,jqInput)[G8t];}if(opts){var n5_=h1Z;n5_+=D$6;var e_S=V_f;e_S+=j1O;e_S+=T89;Editor[e_S](opts,conf[n5_],function(val,label,i,attr){var w7B="safe";var H2e="el for=\"";var y3H='" type="checkbox" />';var f6f="ut id=\"";var Q2l="<inp";var C_p="</d";var I9H="<l";var V8k=I7B;V8k+=a86;V8k+=q0o;var m2r=C_p;m2r+=U8Z;m2r+=L70;var Q8i=w7B;Q8i+=e1E;var g4S=I9H;g4S+=B87;g4S+=H2e;var k5m=j1O;k5m+=D0wIj[482911];var S9N=w7B;S9N+=R1F;S9N+=D0wIj[482911];var w3z=Q2l;w3z+=f6f;var y2l=g10;y2l+=F0h;jqInput[R0y](y2l + w3z + Editor[S9N](conf[k5m]) + x$E + (i + offset) + y3H + g4S + Editor[Q8i](conf[J9D]) + x$E + (i + offset) + O9j + label + a79 + m2r);$(y09,jqInput)[G6h](V8k,val)[D0wIj[140995]][y7X]=val;if(attr){$(y09,jqInput)[G6h](attr);}});}},create:function(conf){var B4_='<div></div>';var v2F=z3J;v2F+=z5B;v2F+=u7s;conf[u4Z]=$(B4_);k55.c6l();checkbox[g12](conf,conf[X7h] || conf[B9L]);return conf[v2F][D0wIj[140995]];},disable:function(conf){var M7G="abled";var f8o=D0wIj[482911];f8o+=v2$;f8o+=M7G;var k2T=b1l;k2T+=H0E;k2T+=D0wIj.R_0;k2T+=b1l;conf[u4Z][t03](I_F)[k2T](f8o,y_h);},enable:function(conf){var A3A=D0wIj[482911];A3A+=j1O;A3A+=Z$T;A3A+=a8U;var L_E=T$R;L_E+=D0wIj.R_0;L_E+=b1l;var J$x=o5M;J$x+=c4F;var r59=H4J;r59+=f5K;r59+=D0wIj[482911];conf[u4Z][r59](J$x)[L_E](A3A,D0wIj[203584]);},get:function(conf){var n1U="epar";k55.j5b();var V1N="electedValu";var j7x="uns";var W7M="unselectedValue";var f$B="separ";var B$4="jo";var z1R=B$4;z1R+=o5M;var J69=f$B;J69+=m2k;var e96=p4i;e96+=n1U;e96+=D0wIj[394663];e96+=j7f;var E8B=j7x;E8B+=V1N;E8B+=B1h;var T1O=T0U;T1O+=H0O;var out=[];var selected=conf[u4Z][T1O](A1d);if(selected[G8t]){selected[G5C](function(){k55.j5b();var T1Y="tor_val";var l6Q="ush";var u4y=k3x;u4y+=k14;u4y+=T1Y;var K3a=b1l;K3a+=l6Q;out[K3a](this[u4y]);});}else if(conf[E8B] !== undefined){var K_j=J_R;K_j+=a7L;out[K_j](conf[W7M]);}return conf[e96] === undefined || conf[J69] === m8f?out:out[z1R](conf[u49]);},set:function(conf,val){var B5r='|';var Y75=B1h;Y75+=D0wIj[394663];Y75+=D1C;Y75+=a7L;var x49=a86;x49+=v5A;x49+=S7A;var h$b=T0U;h$b+=j1O;h$b+=f5K;h$b+=D0wIj[482911];var b4f=z3J;b4f+=c4F;var jqInputs=conf[b4f][h$b](I_F);if(!Array[k9E](val) && typeof val === D3C){val=val[L5M](conf[u49] || B5r);}else if(!Array[k9E](val)){val=[val];}var i;var len=val[x49];var found;jqInputs[Y75](function(){found=D0wIj[203584];k55.c6l();for(i=D0wIj[140995];i < len;i++){if(this[y7X] == val[i]){found=y_h;break;}}this[f4I]=found;});_triggerChange(jqInputs);},update:function(conf,options,append){var G0Y="_addOpti";var j6F=G0Y;j6F+=r2U;var A9L=l3E;A9L+=B1h;A9L+=u7s;var currVal=checkbox[A9L](conf);checkbox[j6F](conf,options,append);checkbox[f_E](conf,currVal);}});var radio=$[i9d](y_h,{},baseFieldType,{_addOptions:function(conf,opts,append){if(append === void D0wIj[140995]){append=D0wIj[203584];}var jqInput=conf[u4Z];k55.c6l();var offset=D0wIj[140995];if(!append){var W7T=B1h;W7T+=L9C;jqInput[W7T]();}else {offset=$(I_F,jqInput)[G8t];}if(opts){Editor[O2i](opts,conf[z9O],function(val,label,i,attr){var l2N="afe";var f7w='<label for="';var a6H="=\"ra";var c5n="dio\" name=\"";var w8h="\" type";var o$I='<div>';var h_r="af";var b8K='<input id="';var o7d=h0G;o7d+=u0u;o7d+=a86;var g9y=C7x;g9y+=H0E;var B7M=O9i;B7M+=L70;var M2v=p4i;M2v+=h_r;M2v+=f8t;var x8e=X19;x8e+=a1g;x8e+=L70;var S7m=f5K;S7m+=V_8;S7m+=B1h;var U6g=w8h;U6g+=a6H;U6g+=c5n;var z1m=j1O;z1m+=D0wIj[482911];var V2S=p4i;V2S+=l2N;V2S+=R1F;V2S+=D0wIj[482911];var x3G=D0wIj[394663];x3G+=b07;x3G+=D0T;jqInput[x3G](o$I + b8K + Editor[V2S](conf[z1m]) + x$E + (i + offset) + U6g + conf[S7m] + x8e + f7w + Editor[M2v](conf[J9D]) + x$E + (i + offset) + B7M + label + a79 + L_Z);$(y09,jqInput)[g9y](c0o,val)[D0wIj[140995]][o7d]=val;if(attr){var I$O=d5R;I$O+=u7s;I$O+=H0E;$(y09,jqInput)[I$O](attr);}});}},create:function(conf){var Q43='<div />';var O$4="_addOpt";var K4x=D0wIj.R_0;K4x+=b1l;K4x+=B1h;K4x+=f5K;var j4d=T2B;k55.c6l();j4d+=v_D;var i2Y=O$4;i2Y+=j1O;i2Y+=r2U;conf[u4Z]=$(Q43);radio[i2Y](conf,conf[j4d] || conf[B9L]);this[P1j](K4x,function(){var D5R=a3m;D5R+=D1C;D5R+=a7L;var J0$=o5M;J0$+=b1l;J0$+=F9E;J0$+=u7s;var C3w=g99;C3w+=f5K;C3w+=z5B;C3w+=u7s;conf[C3w][t03](J0$)[D5R](function(){k55.c6l();if(this[o3o]){this[f4I]=y_h;}});});return conf[u4Z][D0wIj[140995]];},disable:function(conf){var Q$a=j1O;Q$a+=f5K;Q$a+=b1l;Q$a+=B9a;var T1Z=T0U;T1Z+=j1O;T1Z+=f5K;T1Z+=D0wIj[482911];conf[u4Z][T1Z](Q$a)[w$V](a5z,y_h);},enable:function(conf){var J9Q=T0U;J9Q+=j1O;J9Q+=f5K;J9Q+=D0wIj[482911];conf[u4Z][J9Q](I_F)[w$V](a5z,D0wIj[203584]);},get:function(conf){var S6B="unselect";k55.j5b();var E21="edVal";var i5w="or_val";var b0d="unselectedValu";var Q_N=b0d;Q_N+=B1h;var N88=S6B;N88+=E21;N88+=q0o;var v3E=D5F;v3E+=f5K;v3E+=S7A;var W2H=k3x;W2H+=o5M;W2H+=z5B;W2H+=u7s;var el=conf[W2H][t03](A1d);if(el[v3E]){var j3r=B_0;j3r+=Q3f;j3r+=i5w;return el[D0wIj[140995]][j3r];}return conf[N88] !== undefined?conf[Q_N]:undefined;},set:function(conf,val){var s2C=H4J;s2C+=S4n;var w$K=z3J;w$K+=c4F;var q6D=P2h;q6D+=B9a;var J6T=H4J;J6T+=f5K;J6T+=D0wIj[482911];conf[u4Z][J6T](q6D)[G5C](function(){var O77="preC";var F5e="heck";var C1_=k3x;C1_+=k14;C1_+=u0u;C1_+=a86;var o8l=k3x;o8l+=O77;o8l+=F5e;o8l+=x3K;this[o8l]=D0wIj[203584];if(this[C1_] == val){this[f4I]=y_h;this[o3o]=y_h;}else {this[f4I]=D0wIj[203584];this[o3o]=D0wIj[203584];}});_triggerChange(conf[w$K][s2C](A1d));},update:function(conf,options,append){var m0i="[va";var I4a="filter";k55.j5b();var m7W="_ad";var X9Y="dOptio";var p$Z="e=\"";var e8E=B1h;e8E+=D0wIj.K1y;var E_V=m0i;E_V+=z3W;E_V+=p$Z;var i6K=p4i;i6K+=B1h;i6K+=u7s;var A2j=k3x;A2j+=O0h;var O6e=m7W;O6e+=X9Y;O6e+=x0q;var currVal=radio[d4T](conf);radio[O6e](conf,options,append);var inputs=conf[A2j][t03](I_F);radio[i6K](conf,inputs[I4a](E_V + currVal + p9o)[G8t]?currVal:inputs[e8E](D0wIj[140995])[G6h](c0o));}});var datetime=$[Q3Z](y_h,{},baseFieldType,{create:function(conf){var H1L="locale";var Q0o="mome";var L9s='<input />';var F98="ntSt";var K0Y="momentLocale";var W4G="ale";var o7Z="dateti";var O1l="pts";var l8R="mentS";var S2D='DateTime library is required';var h1o="down";var K2v="moment";var k7d="ict";var W5Q="format";var X8U="keyInput";var X9o="displayFormat";var u0d="strict";var k4i="Loca";var N3H="feId";var Q_h="ric";var m$G="rict";var w3V=S_h;w3V+=B9a;var I9x=P_V;I9x+=L0W;I9x+=B1h;var q1H=o7Z;q1H+=D0wIj.V0f;var X9T=P7n;X9T+=Q_h;X9T+=u7s;var n9k=D0wIj.R_0;n9k+=b1l;n9k+=u7s;n9k+=p4i;var r3g=q_M;r3g+=l8R;r3g+=V6Y;r3g+=k7d;var X5F=K2v;X5F+=k4i;X5F+=D5F;var I2k=j1O;I2k+=D0wIj[482911];var M1p=p4i;M1p+=D0wIj[394663];M1p+=N3H;conf[u4Z]=$(L9s)[G6h]($[z7O](y_h,{id:Editor[M1p](conf[I2k]),type:y8g},conf[G6h]));if(!DataTable$3[D34]){Editor[E3Q](S2D,r2t);}if(conf[X5F] && !conf[h8f][H1L]){var y_W=a86;y_W+=v6x;y_W+=W4G;conf[h8f][y_W]=conf[K0Y];}if(conf[r3g] && !conf[n9k][X9T]){var j9L=Q0o;j9L+=F98;j9L+=m$G;var s9T=D0wIj.R_0;s9T+=O1l;conf[s9T][u0d]=conf[j9L];}conf[q7v]=new DataTable$3[D34](conf[u4Z],$[z7O]({format:conf[X9o] || conf[W5Q],i18n:this[B8M][q1H]},conf[h8f]));conf[l_w]=function(){var U3e="icke";var Z4X=k3x;Z4X+=b1l;Z4X+=U3e;Z4X+=H0E;conf[Z4X][H_F]();};if(conf[X8U] === D0wIj[203584]){var n2a=F0k;n2a+=P9I;n2a+=h1o;var N3Z=D0wIj.R_0;N3Z+=f5K;var r9J=S_h;r9J+=B9a;conf[r9J][N3Z](n2a,function(e){k55.j5b();e[N$I]();});}this[P1j](I9x,conf[l_w]);return conf[w3V][D0wIj[140995]];},destroy:function(conf){var W3l="ydown";var v9M="cker";var G$7=d8U;G$7+=j1O;G$7+=v9M;var R11=a3j;R11+=W3l;var h8Z=D0wIj.R_0;h8Z+=T0U;h8Z+=T0U;var w_4=A9R;w_4+=u7s;var O_2=D0wIj.R_0;O_2+=Z1h;k55.j5b();this[O_2](m4Z,conf[l_w]);conf[w_4][h8Z](R11);conf[G$7][R1e]();},errorMessage:function(conf,msg){var o4O="errorMsg";var a9V=L1h;a9V+=V$8;conf[a9V][o4O](msg);},get:function(conf){var Z4B="wireF";var t4s="wireFor";var V0p="mat";var i3b=Z4B;i3b+=D0wIj.R_0;i3b+=H0E;i3b+=V0p;var f5i=t4s;f5i+=D0wIj[159052];f5i+=d5R;return conf[f5i]?conf[q7v][Q5y](conf[i3b]):conf[u4Z][F7D]();},maxDate:function(conf,max){var b6m="max";var i6S=L1h;k55.c6l();i6S+=V$8;conf[i6S][b6m](max);},minDate:function(conf,min){var x1V="min";k55.j5b();conf[q7v][x1V](min);},owns:function(conf,node){var L5d="owns";var I2y="picker";var f7m=k3x;f7m+=I2y;return conf[f7m][L5d](node);},set:function(conf,val){var W2v="-";var f8w="wireFormat";var T6A="wi";var w2z="ring";k55.j5b();var V5O="_pic";var L0d=T6A;L0d+=H0E;L0d+=v_F;L0d+=S3K;var A4e=W2v;A4e+=W2v;var Y6t=p4i;Y6t+=u7s;Y6t+=w2z;if(typeof val === Y6t && val && val[C3_](A4e) !== D0wIj[140995] && conf[L0d]){conf[q7v][Q5y](conf[f8w],val);}else {var D7Q=p$q;D7Q+=D0wIj[394663];D7Q+=a86;var Z7z=V5O;Z7z+=a3j;Z7z+=H0E;conf[Z7z][D7Q](val);}_triggerChange(conf[u4Z]);}});var upload=$[z7O](y_h,{},baseFieldType,{canReturnSubmit:function(conf,node){k55.j5b();return D0wIj[203584];},create:function(conf){var editor=this;var container=_commonUpload(editor,conf,function(val){var f5L="tUpload";var Y5V="pos";var e$B=Y5V;e$B+=f5L;var h9k=k3x;h9k+=c2B;h9k+=h89;var G5k=H8L;G5k+=a86;G5k+=a86;var U5g=p4i;U5g+=B1h;U5g+=u7s;upload[U5g][G5k](editor,conf,val[D0wIj[140995]]);editor[h9k](e$B,[conf[T$O],val[D0wIj[140995]]]);});return container;},disable:function(conf){var q7P=G80;q7P+=Z$T;q7P+=y1E;q7P+=D0wIj[482911];var D0D=Q3l;D0D+=b1l;var q48=o5M;q48+=b1l;q48+=B9a;var P4M=H4J;P4M+=S4n;var Z9g=g99;Z9g+=f5K;Z9g+=z5B;Z9g+=u7s;conf[Z9g][P4M](q48)[D0D](q7P,y_h);conf[g49]=D0wIj[203584];},enable:function(conf){var Q1d=j1O;Q1d+=U_w;Q1d+=F9E;Q1d+=u7s;var T9k=k3x;T9k+=O0h;conf[T9k][t03](Q1d)[w$V](a5z,D0wIj[203584]);conf[g49]=y_h;},get:function(conf){var S3M=k3x;S3M+=I7B;S3M+=a86;return conf[S3M];},set:function(conf,val){var D48="erHandle";var W4K="dered";var h9C="</s";var I5J="tri";var o5B="noC";var w6v="pan>";var d18="rValue but";var h18="clearText";var T9j="Cle";var A4_="div.clea";var j2S='<span>';var G9j="gg";var R6E='No file';var e7m="pload.edi";var k5v="lea";var E1N=k3x;E1N+=p$q;E1N+=D0wIj[394663];E1N+=a86;var Q82=F9E;Q82+=e7m;Q82+=j7f;var N2U=I5J;N2U+=G9j;N2U+=D48;N2U+=H0E;var f5W=A9R;f5W+=u7s;var W1z=A4_;W1z+=d18;W1z+=D9d;var X92=T0U;X92+=o5M;X92+=D0wIj[482911];var f3N=Z9W;f3N+=v3s;var t1X=k3x;t1X+=p$q;t1X+=D0wIj[394663];t1X+=a86;conf[t1X]=val;conf[u4Z][F7D](R_6);var container=conf[u4Z];if(conf[f3N]){var s0Z=K9f;s0Z+=L3v;s0Z+=f5K;s0Z+=W4K;var b6b=H4J;b6b+=S4n;var rendered=container[b6b](s0Z);if(conf[e_Q]){var b9d=k3x;b9d+=F7D;var i7o=D0wIj[482911];i7o+=j1O;i7o+=l6w;var T80=V77;T80+=v74;rendered[T80](conf[i7o](conf[b9d]));}else {var z_F=h9C;z_F+=w6v;var u_M=D0wIj[394663];u_M+=l0X;u_M+=S4n;rendered[j7Q]()[u_M](j2S + (conf[H0$] || R6E) + z_F);}}var button=container[X92](W1z);if(val && conf[h18]){var d2O=o5B;d2O+=k5v;d2O+=H0E;var d4X=a7L;d4X+=u7s;d4X+=v74;button[d4X](conf[h18]);container[w12](d2O);}else {var r0j=O_t;r0j+=T9j;r0j+=d1B;var k88=D0wIj[394663];k88+=t_l;k88+=p4i;container[k88](r0j);}conf[f5W][t03](I_F)[N2U](Q82,[conf[E1N]]);}});var uploadMany=$[z7O](y_h,{},baseFieldType,{_showHide:function(conf){var q7c="blo";var b7Z="v.limitH";var s1w="_conta";var M48="imit";var t6o=k3x;t6o+=p$q;t6o+=D0wIj[394663];t6o+=a86;var I_U=q7c;I_U+=D1C;I_U+=F0k;var j$p=f5K;j$p+=D0wIj.R_0;j$p+=f5K;j$p+=B1h;var e8f=a86;e8f+=M48;var m7C=D0wIj[482911];m7C+=v2$;m7C+=y_Z;m7C+=v3s;var v1T=D1C;v1T+=p4i;v1T+=p4i;var p_I=G80;p_I+=b7Z;p_I+=J9D;p_I+=B1h;var b22=s1w;b22+=j1O;b22+=v3U;b22+=H0E;if(!conf[n8O]){return;}k55.j5b();conf[b22][t03](p_I)[v1T](m7C,conf[e_Q][G8t] >= conf[e8f]?j$p:I_U);conf[i8l]=conf[n8O] - conf[t6o][G8t];},canReturnSubmit:function(conf,node){k55.j5b();return D0wIj[203584];},create:function(conf){var u4E="_container";var e9I='button.remove';var N5k=D0wIj.R_0;N5k+=f5K;var e0d=D0wIj[159052];e0d+=F9E;e0d+=a86;e0d+=b0W;var editor=this;var container=_commonUpload(editor,conf,function(val){var D_e="Upload";var I_p="ncat";var x8j=f5K;x8j+=D0wIj[394663];x8j+=D0wIj.V0f;var s2R=w$M;s2R+=D_e;var m$B=D1C;m$B+=D0wIj[394663];m$B+=f7W;var w2B=D1C;w2B+=D0wIj.R_0;w2B+=I_p;conf[e_Q]=conf[e_Q][w2B](val);uploadMany[f_E][m$B](editor,conf,conf[e_Q]);editor[k4q](s2R,[conf[x8j],conf[e_Q]]);},y_h);container[M7k](e0d)[N5k](x1I,e9I,function(e){var h3J="stopPropagation";var N99='idx';var o1N=W7c;o1N+=D5F;o1N+=D0wIj[482911];k55.j5b();e[h3J]();if(conf[o1N]){var k$9=A__;k$9+=D0wIj[394663];k$9+=a86;var idx=$(this)[F0E](N99);conf[e_Q][f90](idx,b6E);uploadMany[f_E][l5$](editor,conf,conf[k$9]);}});conf[u4E]=container;return container;},disable:function(conf){var N6I=b1l;N6I+=H0E;N6I+=D0wIj.R_0;N6I+=b1l;var N2J=o5M;N2J+=z5B;N2J+=u7s;conf[u4Z][t03](N2J)[N6I](a5z,y_h);conf[g49]=D0wIj[203584];},enable:function(conf){var x4z="_ena";var R7i=x4z;R7i+=y1E;R7i+=D0wIj[482911];var U4z=D0wIj[482911];U4z+=z_C;U4z+=B8g;var l9k=z3J;l9k+=b1l;l9k+=B9a;conf[l9k][t03](I_F)[w$V](U4z,D0wIj[203584]);conf[R7i]=y_h;},get:function(conf){k55.c6l();var s2U=A__;s2U+=D0wIj[394663];s2U+=a86;return conf[s2U];},set:function(conf,val){var q_p="_showHide";var J6h='div.rendered';var i31='upload.editor';var z4x="No f";var C7R='</span>';var b63="les";var j4A='<ul></ul>';var a4Q="n>";var W4L='Upload collections must have an array as a value';var Z4u="<spa";var y9g=f9F;y9g+=D0wIj[482911];var k2i=k3x;k2i+=o5M;k2i+=c4F;var e0F=p$q;e0F+=D0wIj[394663];e0F+=a86;var G47=z3J;G47+=c4F;var J8f=G9G;J8f+=v3s;if(!val){val=[];}if(!Array[J8f](val)){throw new Error(W4L);}conf[e_Q]=val;conf[G47][e0F](R_6);var that=this;var container=conf[k2i];if(conf[K6T]){var K4P=a86;K4P+=N$N;K4P+=n16;var m80=B1h;m80+=L9C;var q9F=T0U;q9F+=j1O;q9F+=f5K;q9F+=D0wIj[482911];var rendered=container[q9F](J6h)[m80]();if(val[K4P]){var list_1=$(j4A)[Y2X](rendered);$[G5C](val,function(i,file){var S7s=" cla";var e5W="\">&time";var f53='</li>';k55.c6l();var C45="tton>";var s9D="s;</bu";var R_P='<li>';var A4O=' remove" data-idx="';var display=conf[K6T](file,i);if(display !== m8f){var o2b=e5W;o2b+=s9D;o2b+=C45;var M5a=Z8Q;M5a+=u7s;M5a+=D0wIj.R_0;M5a+=f5K;var u6i=D1C;u6i+=W7w;u6i+=B7_;var A6J=F$a;A6J+=X0_;A6J+=S7s;A6J+=m2u;list_1[R0y](R_P + display + A6J + that[u6i][u7M][M5a] + A4O + i + o2b + f53);}});}else {var c9q=z4x;c9q+=j1O;c9q+=b63;var U2K=Z4u;U2K+=a4Q;rendered[R0y](U2K + (conf[H0$] || c9q) + C7R);}}uploadMany[q_p](conf);conf[u4Z][y9g](I_F)[i2U](i31,[conf[e_Q]]);}});var datatable=$[z7O](y_h,{},baseFieldType,{_addOptions:function(conf,options,append){var c5G=D0wIj[394663];c5G+=D0wIj[482911];c5G+=D0wIj[482911];var D0M=H0E;D0M+=O6K;if(append === void D0wIj[140995]){append=D0wIj[203584];}var dt=conf[P_r];if(!append){dt[P7O]();}dt[D0M][c5G](options)[p0w]();},_jumpToFirst:function(conf,editor){var a7R="mb";var M7T="nf";var d7W="aw";var H5J="nu";var E_q='applied';var Z0M="lBody";var f$s="div.dat";var i81="are";var I96="aTables_scrol";var x7q=g5s;x7q+=S7A;var T$b=m3r;T$b+=u7s;T$b+=B$u;var E1w=f$s;E1w+=I96;E1w+=Z0M;var E7b=D0wIj[482911];E7b+=H0E;E7b+=d7W;var z$G=b1l;z$G+=F7I;z$G+=B1h;var s4$=H5J;s4$+=a7R;s4$+=B1h;s4$+=H0E;var o7g=j1O;o7g+=f5K;o7g+=D0wIj[482911];o7g+=L7M;var D8O=H0E;D8O+=D0wIj.R_0;D8O+=o9N;var dt=conf[P_r];var idx=dt[D8O]({order:E_q,selected:y_h})[o7g]();var page=D0wIj[140995];if(typeof idx === s4$){var r6j=T0U;r6j+=a86;r6j+=D0wIj.R_0;r6j+=f8i;var t_F=j1O;t_F+=M7T;t_F+=D0wIj.R_0;var b27=b1l;b27+=D0wIj[394663];b27+=A86;var pageLen=dt[b27][t_F]()[G8t];var pos=dt[i9j]({order:E_q})[Z3m]()[C3_](idx);page=pageLen > D0wIj[140995]?Math[r6j](pos / pageLen):D0wIj[140995];}dt[z$G](page)[E7b](D0wIj[203584]);var container=$(E1w,dt[x81]()[T$b]());k55.j5b();var scrollTo=function(){var u2E="position";var Q_L="cro";var v4I="ight";k55.c6l();var A3f=O_t;A3f+=N8S;var node=dt[Q1x]({order:E_q,selected:y_h})[A3f]();if(node){var e_u=u7s;e_u+=f$n;var Z93=g3K;Z93+=v4I;var height=container[Z93]();var top_1=$(node)[u2E]()[e_u];if(top_1 > height - A17){var L1z=p4i;L1z+=Q_L;L1z+=d20;L1z+=f$n;container[L1z](top_1);}}};if(container[x7q]){var x$w=a86;x$w+=v5A;x$w+=w5E;x$w+=a7L;var Q3E=b1l;Q3E+=i81;Q3E+=D0wIj.m1R;Q3E+=p4i;if(container[Q3E](O9w)[x$w]){scrollTo();}else {var W8S=f7c;W8S+=f5K;editor[H$_](W8S,function(){scrollTo();});}}},create:function(conf){var q$o='init.dt';var B$C='user-select';var g5J='Search';var L1K="eCla";var P1w="ddO";var l4$='<div class="DTE_Field_Type_datatable_info">';var D0L="sea";var p1X='2';var S1D="config";var F$G="ppen";var A8L="pagin";var R$V="addCl";var J$d='<tr>';var V6q="e>";var D_2='<tfoot>';var J3f='Label';var K6L="tip";var w8S='fiBtp';var L6z="pti";var i6l="%";var Q6l='single';var f5t=D0wIj.R_0;f5t+=Q3a;f5t+=T0W;f5t+=p4i;var q_$=N_J;q_$+=P1w;q_$+=L6z;q_$+=r2U;var X01=D0wIj[482911];X01+=u7s;var d0a=D0wIj.R_0;d0a+=f5K;var E3u=D0wIj.R_0;E3u+=b15;var x$t=D0wIj.R_0;x$t+=p4i;var L5R=D0wIj[159052];L5R+=e9$;L5R+=K6L;L5R+=D5F;k55.c6l();var y7Q=A8L;y7Q+=l3E;var o9e=j1O;o9e+=f5K;o9e+=J_K;var R2L=D0L;R2L+=H0E;R2L+=D1C;R2L+=a7L;var J28=g8U;J28+=D0wIj.R_0;var o4j=k3P;o4j+=r2U;var c0G=w4l;c0G+=e4e;var h7X=a86;h7X+=B87;h7X+=B1h;h7X+=a86;var x1b=h1Z;x1b+=D$6;var t0I=D72;t0I+=R8j;t0I+=R8j;t0I+=i6l;var t$G=S73;t$G+=a86;t$G+=L1K;t$G+=v5w;var b0g=R$V;b0g+=D0wIj[394663];b0g+=v5w;var R37=D5F;R37+=G17;R37+=a7L;var R6q=N6v;R6q+=d5t;var k_e=Z$i;k_e+=z3x;k_e+=p4i;var s_d=D0wIj[394663];s_d+=F$G;s_d+=D0wIj[482911];var y6y=g10;y6y+=D0wIj[482911];y6y+=U8Z;y6y+=L70;var q16=g10;q16+=r6R;q16+=V6q;var c11=a86;c11+=B87;c11+=B1h;c11+=a86;var _this=this;conf[z9O]=$[z7O]({label:c11,value:c0o},conf[z9O]);var table=$(q16);var container=$(y6y)[s_d](table);var side=$(l4$);var layout=DataTable$3[f7r](p1X);if(conf[Y_7]){$(D_2)[R0y](Array[k9E](conf[Y_7])?$(J$d)[R0y]($[K3u](conf[Y_7],function(str){var I7A=a7L;I7A+=u7s;I7A+=D0wIj[159052];I7A+=a86;var N9N=g10;N9N+=u7s;N9N+=a7L;N9N+=L70;return $(N9N)[I7A](str);})):conf[Y_7])[Y2X](table);}var hasButtons=conf[S1D] && conf[S1D][k_e] && conf[S1D][R6q][R37];var dt=table[b0g](datatable[t$G])[g6V](t0I)[P1j](q$o,function(e,settings){var v6j="div.dt-inf";var L8l="iv.dt-bu";var l3G='div.dataTables_info';var K0y="div.dataTabl";var h4S="es_filter";var L66="dt-search";var U_4=T0U;U_4+=H0O;var R5J=v6j;R5J+=D0wIj.R_0;var t7X=D0wIj[394663];t7X+=b07;t7X+=B1h;t7X+=S4n;var e_U=D0wIj[482911];e_U+=L8l;e_U+=N5Y;e_U+=r2U;var p$4=T0U;p$4+=o5M;p$4+=D0wIj[482911];var l4d=X9C;l4d+=D0T;var N$Y=K0y;N$Y+=h4S;var S1c=K9f;S1c+=L66;var c5H=T0U;c5H+=H0O;var a7f=j1O;a7f+=C1U;a7f+=u7s;var D3m=w4l;D3m+=a86;D3m+=B1h;D3m+=K18;if(settings[W1L] !== table[D0wIj[140995]]){return;}var api=new DataTable$3[K8Q](settings);var containerNode=$(api[x81](undefined)[H0H]());DataTable$3[D3m][a7f](api);side[R0y](containerNode[c5H](S1c))[R0y](containerNode[t03](N$Y))[l4d](containerNode[p$4](e_U))[t7X](containerNode[t03](R5J))[R0y](containerNode[U_4](l3G));})[Q48]($[z7O]({buttons:[],columns:[{data:conf[x1b][h7X],title:J3f}],deferRender:y_h,dom:layout?m8f:w8S,language:{paginate:{next:g7y,previous:E6h},search:R_6,searchPlaceholder:g5J},layout:layout?{top:hasButtons?[c0G,o4j,J28]:[R2L,o9e],bottom:[y7Q],bottomStart:m8f,bottomEnd:m8f,topStart:m8f,topEnd:m8f}:m8f,lengthChange:D0wIj[203584],select:{style:conf[L5R]?x$t:Q6l}},conf[S1D]));this[P1j](E3u,function(){var C_r="olumn";k55.c6l();var o7j="search";var O0j="adjust";var x0D=D1C;x0D+=C_r;x0D+=p4i;var M1N=w4l;M1N+=e4e;if(dt[M1N]()){dt[o7j](R_6)[p0w]();}dt[x0D][O0j]();});dt[d0a](B$C,function(){k55.j5b();var k9q=S73;k9q+=D5F;var G65=D0wIj[482911];G65+=u7s;_triggerChange($(conf[G65][k9q]()[H0H]()));});if(conf[l6H]){var h50=u7s;h50+=B87;h50+=a86;h50+=B1h;var m4T=B1h;m4T+=D0wIj[482911];m4T+=r4D;m4T+=f8i;conf[m4T][h50](dt);conf[l6H][P1j](J$i,function(e,json,data,action){k55.j5b();var Q5z='refresh';var q0N="dataSou";var v6m="rce";var A5Q="_jumpToFirst";var y4s=D1C;y4s+=l9W;y4s+=B1h;if(action === y4s){var z4F=a86;z4F+=B1h;z4F+=G17;z4F+=a7L;var _loop_1=function(dp){var C1s="select";dt[i9j](function(idx,d){k55.j5b();return d === dp;})[C1s]();};for(var _i=D0wIj[140995],_a=json[F0E];_i < _a[z4F];_i++){var dp=_a[_i];_loop_1(dp);}}else if(action === k1w || action === F8m){var Y2E=k3x;Y2E+=q0N;Y2E+=v6m;_this[Y2E](Q5z);}datatable[A5Q](conf,_this);});}conf[X01]=dt;datatable[q_$](conf,conf[f5t] || []);return {input:container,side:side};},disable:function(conf){var w$f="ec";var K7G='api';var L_Q=D1C;L_Q+=p4i;L_Q+=p4i;var A7K=M74;A7K+=I$C;A7K+=H0E;var W$c=Z$i;W$c+=c78;W$c+=f5K;W$c+=p4i;var F0I=D0wIj[482911];F0I+=u7s;var z4A=w4l;z4A+=a86;z4A+=w$f;z4A+=u7s;conf[P_r][z4A][O_C](K7G);conf[F0I][W$c]()[A7K]()[L_Q](T35,A7B);},dt:function(conf){var e4_=D0wIj[482911];e4_+=u7s;return conf[e4_];},enable:function(conf){var W$H='os';var G_c="gl";var g3C="lay";var o9k=g9S;o9k+=g3C;var t1D=D1C;t1D+=p4i;t1D+=p4i;var G5R=D0wIj[482911];G5R+=u7s;var I9Q=p4i;I9Q+=o5M;I9Q+=G_c;I9Q+=B1h;var R9S=p4i;R9S+=W5N;R9S+=a86;R9S+=B1h;var b4X=w4l;b4X+=S9A;var Q0b=D0wIj[482911];Q0b+=u7s;conf[Q0b][b4X][R9S](conf[c7D]?W$H:I9Q);conf[G5R][v82]()[H0H]()[t1D](o9k,G82);},get:function(conf){var V3N="toArray";var y83="pluck";var j3i="sep";var J5_=D0wIj.C99;J5_+=D0wIj.R_0;J5_+=j1O;J5_+=f5K;var Z_e=j3i;Z_e+=d1B;Z_e+=d5R;Z_e+=f8i;var r86=m0o;r86+=u7s;r86+=D0wIj[394663];var v10=D0wIj[482911];v10+=u7s;var rows=conf[v10][i9j]({selected:y_h})[r86]()[y83](conf[z9O][I2p])[V3N]();return conf[Z_e] || !conf[c7D]?rows[J5_](conf[u49] || O33):rows;},set:function(conf,val,localUpdate){var D01="sel";var x2v="ToFirst";var K_L="ipl";var e7S="ontai";var B0W="dese";var g8$="ump";var w5x="separa";var o06=k3x;o06+=D0wIj.C99;o06+=g8$;o06+=x2v;var L9E=D01;L9E+=B1h;L9E+=K18;var s3x=B0W;s3x+=S9A;var d0A=O9A;d0A+=V7f;var K38=D0wIj[482911];K38+=u7s;var J5w=k0Y;J5w+=H0E;J5w+=j2m;var N8X=n_A;N8X+=u7s;N8X+=K_L;N8X+=B1h;if(conf[N8X] && conf[u49] && !Array[J5w](val)){var D7r=w5x;D7r+=j7f;var g3i=g19;g3i+=g0L;val=typeof val === g3i?val[L5M](conf[D7r]):[];}else if(!Array[k9E](val)){val=[val];}var valueFn=dataGet(conf[z9O][I2p]);conf[K38][d0A]({selected:y_h})[s3x]();conf[P_r][i9j](function(idx,data,node){return val[C3_](valueFn(data)) !== -b6E;})[L9E]();datatable[o06](conf,this);if(!localUpdate){var J1B=D1C;J1B+=e7S;J1B+=X8p;var u5P=D0wIj[482911];u5P+=u7s;_triggerChange($(conf[u5P][x81]()[J1B]()));}},tableClass:R_6,update:function(conf,options,append){var W7h=q4m;W7h+=D0wIj[394663];W7h+=I$C;W7h+=H0E;var p87=Y6m;p87+=N6v;p87+=a86;p87+=B1h;datatable[g12](conf,options,append);var lastSet=conf[N9m];if(lastSet !== undefined){var C9J=p4i;C9J+=B1h;C9J+=u7s;datatable[C9J](conf,lastSet,y_h);}_triggerChange($(conf[P_r][p87]()[W7h]()));}});var defaults={className:R_6,compare:m8f,data:R_6,def:R_6,entityDecode:y_h,fieldInfo:R_6,getFormatter:m8f,id:R_6,label:R_6,labelInfo:R_6,message:R_6,multiEditable:y_h,name:m8f,nullDefault:D0wIj[203584],setFormatter:m8f,submit:y_h,type:y8g};var DataTable$2=$[D0wIj.I9n][D0wIj.p1d];var Field=(function(){var W4W='input, select, textarea';var i_p="fieldError";var L_M=0.5;var U$M="totype";var f5U="ltiG";var Q4h="def";var K1p="asC";var e4Y="multiRestore";var D$j="multiReturn";var H9D="labe";var T1l="enabled";var i$t="ese";var t4E="efault";var h8E="multiIds";var J_X="Value";var a6o="oto";var e6K="type";var O0l="multiInfoShow";var F7j="slideUp";var k3l="fieldInfo";var O8a="submitta";var P5u="multiValue";var E0f="nEr";var P0H="ontainer";var J9g="_typeFn";var i9V="inputControl";var Y9C="proto";var z4J="_ty";var o7J="protot";var m$w="disabled";var c1F="_format";var L$q="ltiR";var z46="ototype";var f7N="ot";var z8q="_errorNode";var W$S="otot";var M7g="matter";var Y8I="typ";var b9P="multiValues";var X98="cs";var r5l="otype";var C58="elInfo";var b$i="_msg";var I2c="hos";var c1Z="host";var I25="slideDown";var v_Q="isMulti";var m5u="multiInfo";var V5w="sl";var e_5="rototype";var Z88="ullD";var R0c="fault";var B9k="multiEditable";var l6j=J_K;l6j+=H0E;l6j+=M7g;l6j+=p4i;var P8q=N8S;P8q+=R0c;P8q+=p4i;var l8l=b1l;l8l+=b9t;l8l+=r5l;var W8T=T$R;W8T+=z46;var e$c=o7J;e$c+=H2R;e$c+=W_K;var O2z=Y9C;O2z+=Y8I;O2z+=B1h;var Y3I=O8a;Y3I+=y1E;var m7X=Z78;m7X+=L$q;m7X+=i$t;m7X+=u7s;var l1d=O0l;l1d+=f5K;var X62=T$R;X62+=z46;var R4X=h2n;R4X+=b1l;R4X+=B1h;var B_G=T$R;B_G+=a6o;B_G+=W5N;B_G+=W_K;var D_x=m0o;D_x+=u7s;D_x+=D0wIj[394663];D_x+=I2_;var C5A=E5A;C5A+=B1h;var w_X=p$q;w_X+=T0_;var V$j=o7J;V$j+=H2R;V$j+=b1l;V$j+=B1h;var B8n=f3R;B8n+=D0wIj[482911];B8n+=D0wIj[394663];B8n+=e_t;var w8u=Q3l;w8u+=U$M;var b5T=p4i;b5T+=c6i;var j7L=r4r;j7L+=A9g;var P5E=T$R;P5E+=W$S;P5E+=H9a;var W__=f5K;W__+=Z88;W__+=t4E;var D$Z=f5K;D$Z+=G71;D$Z+=B1h;var C36=o7J;C36+=H2R;C36+=b1l;C36+=B1h;var P6y=n_A;P6y+=s7S;var S1q=Q3l;S1q+=U$M;var Y5G=Z78;Y5G+=f5U;Y5G+=B1h;Y5G+=u7s;var O0r=W5c;O0r+=D0wIj[394663];O0r+=l3E;O0r+=B1h;var d2H=h2n;d2H+=W_K;var j8r=T6K;j8r+=C58;var I_d=b1l;I_d+=H0E;I_d+=a6o;I_d+=e6K;var H5V=A86;H5V+=u7s;var d1J=E5A;d1J+=B1h;var V5i=T0U;V5i+=D0wIj.R_0;V5i+=o_G;var R8o=T$R;R8o+=z46;var t9D=b1l;t9D+=Q4K;t9D+=W5N;t9D+=W_K;var M5n=j1O;M5n+=E0f;M5n+=j0i;var F9H=Y9C;F9H+=u7s;F9H+=H2R;F9H+=W_K;var t3K=v_Q;t3K+=J_X;k55.c6l();var Q5R=B1h;Q5R+=H0E;Q5R+=O9A;Q5R+=H0E;var s2w=T$R;s2w+=D0wIj.R_0;s2w+=z2t;s2w+=H9a;var v9X=Q3l;v9X+=p3o;v9X+=e6K;var z8I=b1l;z8I+=e_5;var y0U=T$R;y0U+=f7N;y0U+=r5l;function Field(options,classes,host){var X79="efix";var o0B=" data-dte-e";var r3K="-e=\"m";var C_u="elI";var o54="Name";var u4m='input-control';var M3v="valToData";var u59="\"multi-value\" class=\"";var r4M="I18n";var Y7R="-multi\" clas";var t8L="refix";var g96="</label";var s8X="sg-mes";var g1M="\"msg-error\" class=\"";var X4e="-label";var r_A="sage\" class=\"";var c4N="info\" class=\"";var f0$='msg-multi';var w8q="typePr";var c4Z="yp";var W3E="ms";var p0G="g-";var Y0A='msg-label';var S6e="<div data-dte";var D8V="<div";var y33="iv data-dte-e=";var m1w='field-processing';var x36="g-er";var g$z='<span data-dte-e="multi-info" class="';var H5I='msg-error';var j9O="=";var b_n="/span";var V5H='DTE_Field_';var F4p="fieldT";var s9F="rnal";var u_x="ltiRestore";var T66="alue";var o1j='Error adding field - unknown field type ';var j8l="P";var K82="multi-v";var u$5='<label data-dte-e="label" class="';var x0L="<div data-d";var O9n="t\" class=\"";var Q8p="lti";var H0J='<div data-dte-e="msg-label" class="';var k9Y="side";var L5E='msg-info';var T8s="epend";var W0U='<div data-dte-e="field-processing" class="';var B1a='msg-message';var o_x="<div data-dte-e=\"ms";var h9c='multi-info';var W9h="te-e=\"i";var N9G="r=";var s4Z="nam";var m29="cli";var m_Z="-e=\"msg";var K7p='<div data-dte-e="input-control" class="';var k4D="tore";var o7r=u7s;o7r+=c4Z;o7r+=B1h;var n_$=A_l;n_$+=a7L;var h4A=m29;h4A+=Z74;var T7M=D0wIj.R_0;T7M+=f5K;var b02=D0wIj[482911];b02+=D0wIj.R_0;b02+=D0wIj[159052];var h3K=P_V;h3K+=G7x;h3K+=F0k;var G3a=D0wIj.R_0;G3a+=f5K;var u8o=D0wIj[159052];u8o+=h9r;u8o+=j1O;var O2h=D0wIj[482911];O2h+=D0wIj.R_0;O2h+=D0wIj[159052];var y1r=K82;y1r+=T66;var z89=X9C;z89+=D0T;var u2J=p4i;u2J+=J9D;u2J+=B1h;var f_V=X1W;f_V+=B1h;f_V+=g18;var f$D=Q3l;f$D+=e1t;f$D+=v5w;f$D+=V$v;var b_E=o_x;b_E+=p0G;b_E+=c4N;var v9R=O9i;v9R+=L70;var r6B=S6e;r6B+=r3K;r6B+=s8X;r6B+=r_A;var c6g=W3E;c6g+=x36;c6g+=j0i;var R9J=f2K;R9J+=y33;R9J+=g1M;var X5L=L3v;X5L+=p4i;X5L+=k4D;var w78=Z78;w78+=u_x;var Z$h=S6e;Z$h+=m_Z;Z$h+=Y7R;Z$h+=N9H;var i3r=g10;i3r+=b_n;i3r+=L70;var L5t=o5M;L5t+=J_K;var w1b=O9i;w1b+=L70;var L$Q=u7s;L$Q+=j1O;L$Q+=j_e;var I0g=D8V;I0g+=o0B;I0g+=j9O;I0g+=u59;var O$6=j1O;O$6+=f5K;O$6+=z5B;O$6+=u7s;var y4c=x0L;y4c+=W9h;y4c+=o$f;y4c+=O9n;var X93=g96;X93+=L70;var s3f=b4H;s3f+=N6v;s3f+=C_u;s3f+=a7O;var I8b=W3E;I8b+=l3E;I8b+=X4e;var d9B=O9i;d9B+=L70;var U1d=j1O;U1d+=D0wIj[482911];var O$H=X19;O$H+=J_K;O$H+=N9G;O$H+=O9i;var H8i=H9D;H8i+=a86;var s_0=O9i;s_0+=L70;var c9V=D1C;c9V+=S8h;c9V+=p4i;c9V+=o54;var A9G=s4Z;A9G+=B1h;var L37=s4Z;L37+=B1h;L37+=j8l;L37+=t8L;var y6Q=w8q;y6Q+=X79;var Q07=D$F;Q07+=b1l;Q07+=O_o;var w3R=x2X;w3R+=W7w;w3R+=j9O;w3R+=O9i;var k3Y=D0wIj[482911];k3Y+=D0wIj[394663];k3Y+=u7s;k3Y+=D0wIj[394663];var l1R=u7s;l1R+=H9a;var I19=F4p;I19+=H2R;I19+=b1l;I19+=B7_;var F$C=w$s;F$C+=D0wIj[159052];F$C+=B1h;var b5p=W5N;b5p+=W_K;var w2$=B1h;w2$+=h6V;w2$+=D0wIj[482911];var i2P=Z78;i2P+=Q8p;var w$p=T7t;w$p+=B1h;w$p+=s9F;w$p+=r4M;var that=this;var multiI18n=host[w$p]()[i2P];var opts=$[w2$](y_h,{},Field[z3Z],options);if(!Editor[W76][opts[b5p]]){throw new Error(o1j + opts[e6K]);}this[p4i]={classes:classes,host:host,multiIds:[],multiValue:D0wIj[203584],multiValues:{},name:opts[F$C],opts:opts,processing:D0wIj[203584],type:Editor[I19][opts[l1R]]};if(!opts[J9D]){var p5D=f5K;p5D+=V_8;p5D+=B1h;opts[J9D]=(V5H + opts[p5D])[T6y](/ /g,x$E);}if(opts[k3Y] === R_6){var K67=w$s;K67+=D0wIj[159052];K67+=B1h;var V6a=m0o;V6a+=u7s;V6a+=D0wIj[394663];opts[V6a]=opts[K67];}this[h8o]=function(d){k55.j5b();var d9P="itor";var i2g=B1h;i2g+=D0wIj[482911];i2g+=d9P;var a9a=D0wIj[482911];a9a+=D0wIj[394663];a9a+=u7s;a9a+=D0wIj[394663];return dataGet(opts[a9a])(d,i2g);};this[M3v]=dataSet(opts[F0E]);var template=$(w3R + classes[Q07] + o3N + classes[y6Q] + opts[e6K] + o3N + classes[L37] + opts[A9G] + o3N + opts[c9V] + s_0 + u$5 + classes[H8i] + O$H + Editor[f71](opts[U1d]) + d9B + opts[A2T] + H0J + classes[I8b] + O9j + opts[s3f] + L_Z + X93 + y4c + classes[O$6] + O9j + K7p + classes[i9V] + Y4D + I0g + classes[P5u] + O9j + multiI18n[L$Q] + g$z + classes[m5u] + w1b + multiI18n[L5t] + i3r + L_Z + Z$h + classes[w78] + O9j + multiI18n[X5L] + L_Z + R9J + classes[c6g] + Y4D + r6B + classes[B1a] + v9R + opts[n6s] + L_Z + b_E + classes[L5E] + O9j + opts[k3l] + L_Z + L_Z + W0U + classes[f$D] + e1q + L_Z);var input=this[J9g](f_V,opts);var side=m8f;if(input && input[u2J]){side=input[k9Y];input=input[O0h];}if(input !== m8f){var h9G=T$R;h9G+=T8s;el(u4m,template)[h9G](input);}else {var s7Z=D1C;s7Z+=p4i;s7Z+=p4i;template[s7Z](T35,A7B);}this[s9Y]={container:template,fieldError:el(H5I,template),fieldInfo:el(L5E,template),fieldMessage:el(B1a,template),inputControl:el(u4m,template),label:el(G7W,template)[z89](side),labelInfo:el(Y0A,template),multi:el(y1r,template),multiInfo:el(h9c,template),multiReturn:el(f0$,template),processing:el(m1w,template)};this[O2h][u8o][G3a](h3K,function(){var t6u="donly";var x2K=J22;x2K+=t6u;if(that[p4i][h8f][B9k] && !template[U3I](classes[m$w]) && opts[e6K] !== x2K){var F5_=J_K;F5_+=D0wIj.F5u;F5_+=p4i;that[F7D](R_6);that[F5_]();}});this[b02][D$j][T7M](h4A,function(){k55.j5b();that[e4Y]();});$[n_$](this[p4i][o7r],function(name,fn){k55.c6l();if(typeof fn === D0wIj[253540] && that[name] === undefined){that[name]=function(){var p6X="typeFn";var f85="nshif";var a9f="ice";var I_C=k3x;I_C+=p6X;var e3G=F9E;e3G+=f85;k55.c6l();e3G+=u7s;var X6V=D1C;X6V+=T0_;X6V+=a86;var U17=V5w;U17+=a9f;var d8N=T$R;d8N+=f7N;d8N+=D0wIj.R_0;d8N+=e6K;var args=Array[d8N][U17][X6V](arguments);args[e3G](name);var ret=that[I_C][X2b](that,args);return ret === undefined?that:ret;};}});}Field[y0U][Q4h]=function(set){var f1s="defaul";var i2q='default';var opts=this[p4i][h8f];if(set === undefined){var W8d=f1s;W8d+=u7s;var def=opts[W8d] !== undefined?opts[i2q]:opts[Q4h];return typeof def === D0wIj[253540]?def():def;}opts[Q4h]=set;return this;};Field[l_j][L3m]=function(){var H7o="disab";var i7b='disable';var f4u=H7o;f4u+=a86;f4u+=x3K;var F_M=D0wIj[482911];F_M+=D0wIj.R_0;F_M+=D0wIj[159052];this[F_M][H0H][M7k](this[p4i][H6i][f4u]);this[J9g](i7b);return this;};Field[l_j][p5J]=function(){var i0i=G80;i0i+=p4i;i0i+=y_Z;i0i+=v3s;var E$F=D1C;E$F+=p4i;E$F+=p4i;var Z3z=N6v;Z3z+=D0wIj.R_0;k55.c6l();Z3z+=D0wIj[482911];Z3z+=H2R;var q2v=D1C;q2v+=P0H;var container=this[s9Y][q2v];return container[y2J](Z3z)[G8t] && container[E$F](i0i) !== A7B?y_h:D0wIj[203584];};Field[z8I][M1H]=function(toggle){var O00="Fn";var I$k='enable';var s5g="Cla";var p7p="_type";var n5G=p7p;n5G+=O00;var c3m=R3O;c3m+=p4i;var i7L=h5u;i7L+=s5g;i7L+=p4i;i7L+=p4i;var Z_9=D0wIj[482911];k55.c6l();Z_9+=D0wIj.R_0;Z_9+=D0wIj[159052];if(toggle === void D0wIj[140995]){toggle=y_h;}if(toggle === D0wIj[203584]){return this[L3m]();}this[Z_9][H0H][i7L](this[p4i][c3m][m$w]);this[n5G](I$k);return this;};Field[v9X][T1l]=function(){var G$o=G80;G$o+=Z$T;k55.j5b();G$o+=a8U;var q8I=D1C;q8I+=W7w;q8I+=B1h;q8I+=p4i;var R2y=a7L;R2y+=K1p;R2y+=b4H;R2y+=v5w;var m0R=M74;m0R+=j1O;m0R+=f5K;m0R+=V$8;return this[s9Y][m0R][R2y](this[p4i][q8I][G$o]) === D0wIj[203584];};Field[s2w][Q5R]=function(msg,fn){var w76="contai";var F2I="rMess";var S20="clas";var B2J="ddC";var Y40=v$A;k55.j5b();Y40+=D0wIj.R_0;Y40+=F2I;Y40+=R6$;var L$c=S20;L$c+=w4l;L$c+=p4i;var classes=this[p4i][L$c];if(msg){var I16=c70;I16+=H0E;var b$5=D0wIj[394663];b$5+=B2J;b$5+=a86;b$5+=E9_;this[s9Y][H0H][b$5](classes[I16]);}else {var w4W=w76;w4W+=X8p;this[s9Y][w4W][w12](classes[E3Q]);}this[J9g](Y40,msg);return this[b$i](this[s9Y][i_p],msg,fn);};Field[l_j][k3l]=function(msg){var e5j=D0wIj[482911];e5j+=D0wIj.R_0;e5j+=D0wIj[159052];return this[b$i](this[e5j][k3l],msg);};Field[l_j][t3K]=function(){var y26="multiI";var E9s=y26;E9s+=D0wIj[482911];E9s+=p4i;k55.j5b();return this[p4i][P5u] && this[p4i][E9s][G8t] !== b6E;};Field[F9H][M5n]=function(){var S8b=P_V;S8b+=D0wIj[394663];S8b+=v5w;S8b+=B7_;var Y9e=a7L;Y9e+=K1p;k55.j5b();Y9e+=S8h;Y9e+=p4i;return this[s9Y][H0H][Y9e](this[p4i][S8b][E3Q]);};Field[t9D][O0h]=function(){var O5u=v4l;O5u+=D0wIj.m1R;O5u+=B$u;var a2y=D0wIj.M_A;a2y+=D0wIj[159052];var h1p=o5M;h1p+=c4F;var k7v=W5N;k7v+=b1l;k7v+=B1h;return this[p4i][k7v][h1p]?this[J9g](I_F):$(W4W,this[a2y][O5u]);};Field[R8o][V5i]=function(){var d$a="peFn";if(this[p4i][e6K][b5m]){var V5u=c7L;V5u+=F9E;V5u+=p4i;var Z5u=k3x;Z5u+=u7s;Z5u+=H2R;Z5u+=d$a;this[Z5u](V5u);}else {var G0U=T0U;G0U+=D0wIj.R_0;G0U+=D1C;G0U+=Y6D;var F3Y=D1C;F3Y+=P0H;var m$U=D0wIj.M_A;m$U+=D0wIj[159052];$(W4W,this[m$U][F3Y])[G0U]();}return this;};Field[d1J][H5V]=function(){var I3D="tFormat";var S2t="ter";var m4i="isMultiVa";var g4G='get';var a$r=l3E;a$r+=B1h;a$r+=I3D;a$r+=S2t;var a5P=f$n;a5P+=M$D;var D5k=z4J;D5k+=b1l;D5k+=w1f;var Z6p=m4i;Z6p+=F_5;if(this[Z6p]()){return undefined;}return this[c1F](this[D5k](g4G),this[p4i][a5P][a$r]);};Field[I_d][H_F]=function(animate){var I3g="ayN";var A4K="U";var P6X="opacit";var x0R="ho";var F30=T0U;F30+=f5K;var B1$=x0R;B1$+=P7n;var I$m=P6X;I$m+=H2R;var X7l=D1C;X7l+=p4i;X7l+=p4i;var R9u=Z9W;R9u+=I3g;R9u+=Z3c;var N81=a7L;N81+=D0wIj.R_0;N81+=p4i;N81+=u7s;var el=this[s9Y][H0H];var opacity=parseFloat($(this[p4i][N81][R9u]())[X7l](I$m));if(animate === undefined){animate=y_h;}if(this[p4i][B1$][K6T]() && opacity > L_M && animate && $[F30][F7j]){var s11=V5w;s11+=e_g;s11+=A4K;s11+=b1l;el[s11]();}else {var w16=O_t;w16+=v3U;var E0x=p62;E0x+=E$9;E0x+=H2R;var V80=X98;V80+=p4i;el[V80](E0x,w16);}return this;};Field[l_j][A2T]=function(str){var j1F="lInfo";var P8P=H9D;P8P+=j1F;var label=this[s9Y][A2T];var labelInfo=this[s9Y][P8P][Z$n]();if(str === undefined){var O66=a7L;O66+=u7s;O66+=v74;return label[O66]();}label[E9n](str);label[R0y](labelInfo);return this;};Field[l_j][j8r]=function(msg){var T6X="labelInfo";k55.c6l();return this[b$i](this[s9Y][T6X],msg);};Field[d2H][O0r]=function(msg,fn){var M9O="fieldMessage";var O08="_m";k55.c6l();var h14=D0wIj.M_A;h14+=D0wIj[159052];var K$N=O08;K$N+=p4i;K$N+=l3E;return this[K$N](this[h14][M9O],msg,fn);};Field[l_j][Y5G]=function(id){var X7y="ltiVa";var J_Q="isM";var T2J=J_Q;T2J+=F9E;T2J+=X7y;T2J+=F_5;var value;var multiValues=this[p4i][b9P];var multiIds=this[p4i][h8E];var isMultiValue=this[T2J]();if(id === undefined){var Q1j=p$q;Q1j+=D0wIj[394663];Q1j+=a86;var fieldVal=this[Q1j]();value={};for(var _i=D0wIj[140995],multiIds_1=multiIds;_i < multiIds_1[G8t];_i++){var multiId=multiIds_1[_i];value[multiId]=isMultiValue?multiValues[multiId]:fieldVal;}}else if(isMultiValue){value=multiValues[id];}else {value=this[F7D]();}return value;};Field[l_j][e4Y]=function(){this[p4i][P5u]=y_h;this[z7z]();};Field[S1q][P6y]=function(id,val,recalc){var d9X="_mu";var H7p="Ids";var T61="ltiValueChe";var Z5O=x_V;Z5O+=H7p;if(recalc === void D0wIj[140995]){recalc=y_h;}var that=this;var multiValues=this[p4i][b9P];var multiIds=this[p4i][Z5O];if(val === undefined){val=id;id=undefined;}k55.c6l();var set=function(idSrc,valIn){var x$F="setFormatter";var r6Z="rray";var d4J=D0wIj.R_0;d4J+=b1l;d4J+=M$D;var R1_=K9J;R1_+=S3K;var M67=s69;M67+=r6Z;if($[M67](idSrc,multiIds) === -b6E){multiIds[Z2L](idSrc);}k55.j5b();multiValues[idSrc]=that[R1_](valIn,that[p4i][d4J][x$F]);};if($[C20](val) && id === undefined){$[G5C](val,function(idSrc,innerVal){k55.j5b();set(idSrc,innerVal);});}else if(id === undefined){$[G5C](multiIds,function(i,idSrc){k55.j5b();set(idSrc,val);});}else {set(id,val);}this[p4i][P5u]=y_h;if(recalc){var r3x=d9X;r3x+=T61;r3x+=Z74;this[r3x]();}return this;};Field[C36][T$O]=function(){return this[p4i][h8f][T$O];};Field[l_j][D$Z]=function(){var E$x=D0wIj[482911];E$x+=D0wIj.R_0;k55.j5b();E$x+=D0wIj[159052];return this[E$x][H0H][D0wIj[140995]];};Field[l_j][W__]=function(){var F8F="nullDefault";var E3Z=D0wIj.R_0;E3Z+=b1l;E3Z+=u7s;E3Z+=p4i;k55.j5b();return this[p4i][E3Z][F8F];};Field[P5E][j7L]=function(set){var L5u="processi";var Q9R="ost";var O7E="internalEvent";var D8E="ock";var H_p=a7L;H_p+=Q9R;var s7N=L5u;s7N+=g0L;var T_J=f5K;T_J+=D0wIj.R_0;T_J+=f5K;T_J+=B1h;var p8$=N6v;p8$+=a86;p8$+=D8E;var U7k=D1C;U7k+=v5w;var t0P=D0wIj[482911];t0P+=D0wIj.R_0;t0P+=D0wIj[159052];if(set === undefined){return this[p4i][t7m];}this[t0P][t7m][U7k](T35,set?p8$:T_J);this[p4i][s7N]=set;this[p4i][H_p][O7E](R3Y,[set]);return this;};Field[l_j][b5T]=function(val,multiCheck){var v1z="tiVal";var u2I="ueCheck";var M3X='set';var T5U="setFormatte";var F$E="Va";var N3J="entityDecode";var s9K="_mul";var e8r=x_V;e8r+=F$E;e8r+=F_5;if(multiCheck === void D0wIj[140995]){multiCheck=y_h;}var decodeFn=function(d){var U9N='Â£';var j93='\'';var e0q='"';var c06="epl";var j4p=L3v;j4p+=y_Z;j4p+=D0wIj[394663];j4p+=e1t;var E6i=H0E;E6i+=c06;E6i+=D0wIj[394663];E6i+=e1t;return typeof d !== D3C?d:d[T6y](/&gt;/g,g7y)[E6i](/&lt;/g,E6h)[T6y](/&amp;/g,P2s)[T6y](/&quot;/g,e0q)[T6y](/&#163;/g,U9N)[j4p](/&#0?39;/g,j93)[T6y](/&#0?10;/g,t9K);};this[p4i][e8r]=D0wIj[203584];var decode=this[p4i][h8f][N3J];if(decode === undefined || decode === y_h){if(Array[k9E](val)){for(var i=D0wIj[140995],ien=val[G8t];i < ien;i++){val[i]=decodeFn(val[i]);}}else {val=decodeFn(val);}}if(multiCheck === y_h){var J_r=s9K;J_r+=v1z;J_r+=u2I;var g6v=T5U;g6v+=H0E;val=this[c1F](val,this[p4i][h8f][g6v]);this[J9g](M3X,val);this[J_r]();}else {var v5H=z4J;v5H+=b1l;v5H+=v_F;v5H+=f5K;this[v5H](M3X,val);}return this;};Field[l_j][a4w]=function(animate,toggle){var w2J="displayNode";var C06='opacity';var x6K=T0U;x6K+=f5K;var Z0K=I2c;Z0K+=u7s;var v5g=X98;v5g+=p4i;var p4j=I2c;p4j+=u7s;var u_s=D0wIj[482911];u_s+=k6Z;if(animate === void D0wIj[140995]){animate=y_h;}if(toggle === void D0wIj[140995]){toggle=y_h;}if(toggle === D0wIj[203584]){var Z2S=a7L;Z2S+=J9D;Z2S+=B1h;return this[Z2S](animate);}var el=this[u_s][H0H];var opacity=parseFloat($(this[p4i][p4j][w2J]())[v5g](C06));if(this[p4i][Z0K][K6T]() && opacity > L_M && animate && $[x6K][I25]){el[I25]();}else {var y6O=G80;y6O+=T2z;y6O+=b4H;y6O+=H2R;el[q7L](y6O,R_6);}return this;};Field[w8u][B8n]=function(options,append){var X3z="date";var y$$=u7s;y$$+=H2R;y$$+=W_K;if(append === void D0wIj[140995]){append=D0wIj[203584];}if(this[p4i][y$$][G_B]){var j7c=f3R;j7c+=X3z;this[J9g](j7c,options,append);}return this;};Field[V$j][w_X]=function(val){return val === undefined?this[d4T]():this[f_E](val);};Field[l_j][U7W]=function(value,original){var A9J=D0wIj.R_0;A9J+=Q3a;A9J+=p4i;var compare=this[p4i][A9J][U7W] || deepCompare;return compare(value,original);};Field[C5A][D_x]=function(){k55.c6l();var d5C=D0wIj[482911];d5C+=w5l;var q4x=D0wIj.R_0;q4x+=b1l;q4x+=u7s;q4x+=p4i;return this[p4i][q4x][d5C];};Field[B_G][R1e]=function(){var p$r='destroy';var o_K="ntainer";var l6i=O2l;l6i+=B1h;var s3T=v4l;s3T+=o_K;this[s9Y][s3T][l6i]();this[J9g](p$r);return this;};Field[R4X][B9k]=function(){var r_u=f$n;r_u+=u7s;r_u+=p4i;k55.c6l();return this[p4i][r_u][B9k];};Field[X62][h8E]=function(){var U1X="iI";k55.c6l();var x1h=n_A;x1h+=u7s;x1h+=U1X;x1h+=a4D;return this[p4i][x1h];};Field[l_j][l1d]=function(show){var l2p=N6v;l2p+=l23;l2p+=D1C;l2p+=F0k;var i8f=D1C;i8f+=p4i;i8f+=p4i;this[s9Y][m5u][i8f]({display:show?l2p:A7B});};Field[l_j][m7X]=function(){var H6R="multiV";var i6u="alues";var r17=H6R;r17+=i6u;this[p4i][h8E]=[];this[p4i][r17]={};};Field[l_j][Y3I]=function(){k55.j5b();return this[p4i][h8f][s_U];};Field[O2z][b$i]=function(el,msg,fn){k55.c6l();var N7$="nct";var s30="parent";var V8g="isible";var t2_="ernalSettings";var A9q="tml";var C$g=T0U;C$g+=f5K;var L5n=E86;L5n+=V8g;var y0j=j1O;y0j+=p4i;var c4v=X_Y;c4v+=N7$;c4v+=g$N;c4v+=f5K;if(msg === undefined){var E8X=a7L;E8X+=u7s;E8X+=D0wIj[159052];E8X+=a86;return el[E8X]();}if(typeof msg === c4v){var T06=Y6m;T06+=N6v;T06+=a86;T06+=B1h;var o4a=T7t;o4a+=t2_;var T9Q=t8E;T9Q+=b1l;T9Q+=j1O;var editor=this[p4i][c1Z];msg=msg(editor,new DataTable$2[T9Q](editor[o4a]()[T06]));}if(el[s30]()[y0j](L5n) && $[C$g][T5Z]){el[E9n](msg);if(msg){el[I25](fn);}else {el[F7j](fn);}}else {var n8D=f5K;n8D+=P1j;n8D+=B1h;var e31=D1C;e31+=p4i;e31+=p4i;var n81=a7L;n81+=A9q;el[n81](msg || R_6)[e31](T35,msg?G82:n8D);if(fn){fn();}}return this;};Field[e$c][z7z]=function(){var a6h="iValue";var u2A="tiNoEd";var W7z="iIn";var O9G="ultiIds";var V1S="multiE";var E5a="rol";var q_g="internalI18n";var I$I="Mul";var o$q="isMult";var b6_="multiVa";var w40="inputCont";var n5z="ggle";var X07="ditable";var d0t="internalMult";var M$7=d0t;M$7+=W7z;M$7+=J_K;var f9Q=D0wIj[159052];f9Q+=e9$;f9Q+=u2A;f9Q+=r4D;var V01=K9O;V01+=B7_;var r4b=p3o;r4b+=n5z;r4b+=x8d;var u8w=n_A;u8w+=b0W;var N3a=D0wIj[482911];N3a+=D0wIj.R_0;N3a+=D0wIj[159052];var L_f=O_t;L_f+=I$I;L_f+=u7s;L_f+=j1O;var T4g=V77;T4g+=D0wIj[159052];T4g+=a86;var r6u=I2c;r6u+=u7s;var B0J=f5K;B0J+=D0wIj.R_0;B0J+=f5K;B0J+=B1h;var t6b=N6v;t6b+=l23;t6b+=D1C;t6b+=F0k;var n5I=D5F;n5I+=g0L;n5I+=n16;var S4s=D0wIj[482911];S4s+=D0wIj.R_0;S4s+=D0wIj[159052];var x_A=o$q;x_A+=a6h;var g7J=V1S;g7J+=X07;var e1$=D0wIj.R_0;e1$+=b1l;e1$+=u7s;e1$+=p4i;var f$l=b6_;f$l+=h3d;var A1o=D0wIj[159052];A1o+=O9G;var last;var ids=this[p4i][A1o];var values=this[p4i][f$l];var isMultiValue=this[p4i][P5u];var isMultiEditable=this[p4i][e1$][g7J];var val;var different=D0wIj[203584];if(ids){for(var i=D0wIj[140995];i < ids[G8t];i++){val=values[ids[i]];if(i > D0wIj[140995] && !deepCompare(val,last)){different=y_h;break;}last=val;}}if(different && isMultiValue || !isMultiEditable && this[x_A]()){var t6Q=D0wIj.H4P;t6Q+=D0wIj.R_0;t6Q+=D1C;t6Q+=F0k;var c_b=D1C;c_b+=v5w;var v96=D0wIj[482911];v96+=k6Z;var B4N=D1C;B4N+=p4i;B4N+=p4i;var I93=D0wIj.M_A;I93+=D0wIj[159052];this[I93][i9V][B4N]({display:A7B});this[v96][x_V][c_b]({display:t6Q});}else {var w9Z=X98;w9Z+=p4i;var f7e=Z78;f7e+=R0z;f7e+=j1O;var V6f=D0wIj[482911];V6f+=D0wIj.R_0;V6f+=D0wIj[159052];var m5H=N6v;m5H+=a86;m5H+=D0wIj.R_0;m5H+=Z74;var M9o=D1C;M9o+=v5w;var b9j=w40;b9j+=E5a;this[s9Y][b9j][M9o]({display:m5H});this[V6f][f7e][w9Z]({display:A7B});if(isMultiValue && !different){var N6c=p4i;N6c+=B1h;N6c+=u7s;this[N6c](last,D0wIj[203584]);}}this[S4s][D$j][q7L]({display:ids && ids[n5I] > b6E && different && !isMultiValue?t6b:B0J});var i18n=this[p4i][r6u][q_g]()[x_V];this[s9Y][m5u][T4g](isMultiEditable?i18n[x1p]:i18n[L_f]);this[N3a][u8w][r4b](this[p4i][V01][f9Q],!isMultiEditable);this[p4i][c1Z][M$7]();return y_h;};Field[l_j][J9g]=function(name){var b5J=u7s;b5J+=H9a;var A$S=T2B;A$S+=p4i;var O9V=D5F;O9V+=G17;O9V+=a7L;var args=[];for(var _i=b6E;_i < arguments[O9V];_i++){args[_i - b6E]=arguments[_i];}k55.j5b();args[b_h](this[p4i][A$S]);var fn=this[p4i][b5J][name];if(fn){return fn[X2b](this[p4i][c1Z],args);}};Field[W8T][z8q]=function(){return this[s9Y][i_p];};Field[l8l][c1F]=function(val,formatter){var v3t="formatters";k55.j5b();if(formatter){var O2J=a7L;O2J+=D0wIj.R_0;O2J+=p4i;O2J+=u7s;var R$F=v5h;R$F+=H2R;if(Array[R$F](formatter)){var args=formatter[x4$]();var name_1=args[L2y]();formatter=Field[v3t][name_1][X2b](this,args);}return formatter[l5$](this[p4i][O2J],val,this);}return val;};Field[P8q]=defaults;Field[l6j]={};return Field;})();var button={action:m8f,className:m8f,tabIndex:D0wIj[140995],text:m8f};var displayController={close:function(){},init:function(){},node:function(){},open:function(){}};var DataTable$1=$[n5m][B5s];var apiRegister=DataTable$1[E9q][i20];function _getInst(api){var R$x="context";var c9Q="oIni";var M3S=c9Q;k55.c6l();M3S+=u7s;var ctx=api[R$x][D0wIj[140995]];return ctx[M3S][l6H] || ctx[L2V];}function _setBasic(inst,opts,type,plural){var c33=/%d/;var E0D="ssa";var j0d=D0wIj[159052];j0d+=B1h;j0d+=v5w;j0d+=R6$;var M9C=N6v;M9C+=d5t;if(!opts){opts={};}if(opts[M9C] === undefined){var o1U=Z$i;o1U+=c78;o1U+=f5K;o1U+=p4i;opts[o1U]=t0V;}if(opts[D_t] === undefined){var h6r=u7s;h6r+=s5N;h6r+=B1h;var N9z=p_R;N9z+=B1h;opts[N9z]=inst[B8M][type][h6r];}if(opts[j0d] === undefined){if(type === F8m){var Q2F=s5o;Q2F+=l3E;Q2F+=B1h;var T3G=m3r;T3G+=H4J;T3G+=D40;var confirm_1=inst[B8M][type][T3G];opts[Q2F]=plural !== b6E?confirm_1[k3x][T6y](c33,plural):confirm_1[K8x];}else {var x0a=D0wIj[159052];x0a+=B1h;x0a+=E0D;x0a+=A86;opts[x0a]=R_6;}}return opts;}apiRegister(u1s,function(){k55.c6l();return _getInst(this);});apiRegister(y1M,function(opts){var Z5y="eate";var A8S=X1W;A8S+=Z5y;var inst=_getInst(this);inst[H1w](_setBasic(inst,opts,A8S));return this;});apiRegister(U7I,function(opts){k55.c6l();var Y5i=k14;Y5i+=u7s;var inst=_getInst(this);inst[p_F](this[D0wIj[140995]][D0wIj[140995]],_setBasic(inst,opts,Y5i));return this;});apiRegister(a7x,function(opts){var h_H=B1h;k55.c6l();h_H+=G80;h_H+=u7s;var inst=_getInst(this);inst[p_F](this[D0wIj[140995]],_setBasic(inst,opts,h_H));return this;});apiRegister(D7K,function(opts){var inst=_getInst(this);inst[h5u](this[D0wIj[140995]][D0wIj[140995]],_setBasic(inst,opts,F8m,b6E));return this;});apiRegister(k1H,function(opts){var Z1W=t_y;Z1W+=u7s;Z1W+=a7L;var x5z=w3q;x5z+=g7S;var inst=_getInst(this);inst[x5z](this[D0wIj[140995]],_setBasic(inst,opts,F8m,this[D0wIj[140995]][Z1W]));return this;});apiRegister(P8O,function(type,opts){var w6z="bject";var b4o="sPlai";var i_w="nO";var u3N=j1O;u3N+=b4o;u3N+=i_w;u3N+=w6z;if(!type){var C2y=j1O;C2y+=k1X;C2y+=f5K;C2y+=B1h;type=C2y;}else if($[u3N](type)){var C0s=j1O;C0s+=f5K;C0s+=u7g;C0s+=v3U;opts=type;type=C0s;}_getInst(this)[type](this[D0wIj[140995]][D0wIj[140995]],opts);return this;});apiRegister(W7r,function(opts){_getInst(this)[L7P](this[D0wIj[140995]],opts);return this;});apiRegister(j6b,file);apiRegister(k4N,files);$(document)[P1j](b95,function(e,ctx,json){var r_r="namespace";var S45='dt';var H6w=T0U;H6w+=o12;H6w+=B7_;if(e[r_r] !== S45){return;}if(json && json[H6w]){var D8i=A_l;D8i+=a7L;$[D8i](json[z6u],function(name,filesIn){var R0n=L7M;R0n+=x7E;var w5e=T0U;w5e+=o12;w5e+=B1h;w5e+=p4i;if(!Editor[w5e][name]){Editor[z6u][name]={};}$[R0n](Editor[z6u][name],filesIn);});}});var _buttons=$[D0wIj.I9n][t7E][i1v][N0b];$[z7O](_buttons,{create:{action:function(e,dt,node,config){var u0x="formButton";var G22="proces";var m$e=j1O;m$e+=D72;m$e+=m5y;m$e+=f5K;var v3f=D0wIj[159052];v3f+=W4N;v3f+=F7I;v3f+=B1h;var v2c=X1W;v2c+=B1h;v2c+=g18;var c6A=u0x;c6A+=p4i;var m9S=B1h;m9S+=K7k;m9S+=B1h;m9S+=S4n;var i8t=g6$;i8t+=U3Y;i8t+=b1l;i8t+=v5A;k55.j5b();var b2X=G22;b2X+=S5e;var K0U=p_F;K0U+=f8i;var that=this;var editor=config[K0U];this[b2X](y_h);editor[H$_](i8t,function(){var U$i=Q3l;U$i+=D1C;U$i+=W4N;U$i+=V$v;that[U$i](D0wIj[203584]);})[H1w]($[m9S]({buttons:config[c6A],message:config[n9T] || editor[B8M][v2c][v3f],nest:y_h,title:config[K2s] || editor[m$e][H1w][D_t]},config[A6S]));},className:W$6,editor:m8f,formButtons:{action:function(e){var C00=h5M;C00+=r4D;this[C00]();},text:function(editor){k55.c6l();var y0m=d4Z;y0m+=f5K;return editor[y0m][H1w][s_U];}},formMessage:m8f,formOptions:{},formTitle:m8f,text:function(dt,node,config){var s_m=".create";var b$b=Z8Q;b$b+=D9d;var L8y=p_F;L8y+=f8i;k55.j5b();var X1u=v82;X1u+=s_m;var k5i=j1O;k5i+=D72;k5i+=m5y;k5i+=f5K;return dt[k5i](X1u,config[L8y][B8M][H1w][b$b]);}},createInline:{action:function(e,dt,node,config){var S4B="rmOpt";var Y2e=T0U;Y2e+=D0wIj.R_0;Y2e+=S4B;Y2e+=v_D;var t0y=J1Y;t0y+=b0W;t0y+=D0wIj.R_0;t0y+=f5K;config[l6H][x7k](config[t0y],config[Y2e]);},className:m2v,editor:m8f,formButtons:{action:function(e){var C8c="bmit";var y6w=Y0_;y6w+=C8c;k55.j5b();this[y6w]();},text:function(editor){var f6j="mit";var D9_=m4R;k55.c6l();D9_+=f6j;return editor[B8M][H1w][D9_];}},formOptions:{},position:t9P,text:function(dt,node,config){var a68="buttons.cr";var G3W=N6v;G3W+=B9a;G3W+=u7s;G3W+=P1j;var I3r=M0$;I3r+=m5y;I3r+=f5K;var y87=a68;y87+=a3m;y87+=e_t;return dt[B8M](y87,config[l6H][I3r][H1w][G3W]);}},edit:{action:function(e,dt,node,config){var F3b="ormButtons";var b$D="preOpe";var n6J=d4Z;n6J+=f5K;var p1q=t1h;p1q+=p4i;p1q+=D0wIj[394663];p1q+=A86;var F$K=j1O;F$K+=D72;F$K+=m5y;F$K+=f5K;k55.j5b();var o9t=T0U;o9t+=F3b;var Y$F=B1h;Y$F+=D0wIj[482911];Y$F+=j1O;Y$F+=u7s;var u3O=b$D;u3O+=f5K;var t8k=a86;t8k+=n8u;var W9j=g5s;W9j+=S7A;var R$y=D9F;R$y+=B7_;var that=this;var editor=config[l6H];var rows=dt[i9j]({selected:y_h})[Z3m]();var columns=dt[Z0B]({selected:y_h})[R$y]();var cells=dt[J43]({selected:y_h})[Z3m]();var items=columns[W9j] || cells[t8k]?{cells:cells,columns:columns,rows:rows}:rows;this[t7m](y_h);editor[H$_](u3O,function(){that[t7m](D0wIj[203584]);})[Y$F](items,$[z7O]({buttons:config[o9t],message:config[n9T] || editor[F$K][p_F][p1q],nest:y_h,title:config[K2s] || editor[n6J][p_F][D_t]},config[A6S]));},className:T99,editor:m8f,extend:Y4W,formButtons:{action:function(e){this[s_U]();},text:function(editor){k55.c6l();return editor[B8M][p_F][s_U];}},formMessage:m8f,formOptions:{},formTitle:m8f,text:function(dt,node,config){var a25="buttons.e";var K98=Z$i;K98+=u7s;K98+=D9d;var s0F=B1h;s0F+=G80;s0F+=j7f;var x$4=a25;x$4+=Q3f;var P8u=M0$;P8u+=m5y;P8u+=f5K;return dt[P8u](x$4,config[s0F][B8M][p_F][K98]);}},remove:{action:function(e,dt,node,config){var D1a="ormO";var V7J='preOpen';var R7h="Buttons";var i2i="ptions";var p8D=T0U;p8D+=D1a;p8D+=i2i;var E5F=u7s;E5F+=j1O;E5F+=u7s;E5F+=D5F;var I4b=M0$;I4b+=x8I;var e3j=u7M;e3j+=R7h;var E_F=i1v;E_F+=v5A;E_F+=D0wIj[482911];var m3i=j1O;m3i+=f5K;m3i+=o9$;m3i+=B7_;var w_0=H0E;w_0+=O6K;var l$z=D0wIj.R_0;l$z+=f5K;l$z+=B1h;var that=this;var editor=config[l6H];this[t7m](y_h);editor[l$z](V7J,function(){var M9G=T$R;M9G+=v6x;M9G+=A9g;that[M9G](D0wIj[203584]);})[h5u](dt[w_0]({selected:y_h})[m3i](),$[E_F]({buttons:config[e3j],message:config[n9T],nest:y_h,title:config[K2s] || editor[I4b][h5u][E5F]},config[p8D]));},className:M$r,editor:m8f,extend:V3G,formButtons:{action:function(e){this[s_U]();},text:function(editor){var U7M=p4i;U7M+=l1B;var l5a=H0E;k55.c6l();l5a+=B1h;l5a+=D0wIj[159052];l5a+=g7S;var n$s=M0$;n$s+=m5y;n$s+=f5K;return editor[n$s][l5a][U7M];}},formMessage:function(editor,dt){var J4C="em";var E6C="replac";var L7J="confirm";var I8s="ir";var j6a="onfirm";var g9W=a86;g9W+=B1h;g9W+=t6Z;var C0K=E6C;C0K+=B1h;var e29=D1C;e29+=j6a;var N6C=j2y;N6C+=I8s;N6C+=D0wIj[159052];var r7Q=H0E;k55.c6l();r7Q+=J4C;r7Q+=g7S;var g5v=D9F;g5v+=B7_;var rows=dt[i9j]({selected:y_h})[g5v]();var i18n=editor[B8M][r7Q];var question=typeof i18n[L7J] === D3C?i18n[N6C]:i18n[L7J][rows[G8t]]?i18n[e29][rows[G8t]]:i18n[L7J][k3x];return question[C0K](/%d/g,rows[g9W]);},formOptions:{},formTitle:m8f,limitTo:[z3r],text:function(dt,node,config){k55.j5b();var n9y="ons.remo";var c3R=L3v;c3R+=y$N;var R5N=x3K;R5N+=j1O;R5N+=j7f;var D1x=k3P;D1x+=n9y;D1x+=p$q;D1x+=B1h;var i3_=j1O;i3_+=D72;i3_+=m5y;i3_+=f5K;return dt[i3_](D1x,config[R5N][B8M][c3R][W4f]);}}});_buttons[b9p]=$[V8U]({},_buttons[E3O]);_buttons[Y8W][h5X]=b$X;_buttons[W8X]=$[z7O]({},_buttons[Y$s]);_buttons[W8X][z7O]=b$X;if(!DataTable || !DataTable[f7r] || !DataTable[Y0K](K$T)){var P7_=P8w;P7_+=D69;P7_+=d8b;throw new Error(P7_);}var Editor=(function(){var U7v="inte";var m9z="rn";var e2f="fac";var B_K="Sourc";var r7N="models";var V8I="plo";var A9I="alEvent";var b4B="internalSettings";var C40='2.3.2';var k$r="rnalI1";var J2L="internalMultiInfo";var R8J=p4i;R8J+=D0wIj[394663];R8J+=b5v;R8J+=e1E;var E7a=F0E;E7a+=B_K;E7a+=B7_;var c$Z=F9E;c$Z+=V8I;c$Z+=T0F;var j2e=e2f;j2e+=u7s;j2e+=f8i;j2e+=H2R;var f2$=R3O;f2$+=p4i;var Y5h=E5A;Y5h+=B1h;var u_t=Q3l;u_t+=z2t;u_t+=H9a;var K0u=U7v;K0u+=k$r;K0u+=x8I;var O7z=h2n;O7z+=W_K;var c1B=T7t;c1B+=B1h;c1B+=m9z;c1B+=A9I;var R0_=b1l;R0_+=Q4K;R0_+=W5N;R0_+=W_K;function Editor(init,cjsJq){var w2F="\"></div></di";var C4z="Cann";var m4c="initCom";var L6X="namicInfo";var T49="ssing";var B1v="ldNames";var W5S="ique";var J7M="<div data-dte-e=\"body_content\" cla";var o7G="cess";var N$A="_po";var K7C="ye";var p6c="ror\" class=\"";var d0D="rig";var I5K='foot';var o0x="submitSu";var o1D="DataTables Editor ";var P_q="_submitE";var n1u="Po";var j5f='xhr.dt.dte';var W5C="sabl";var T_f="Args";var M_1="settin";var y1$="_w";var f06="must be initialised as a \'new\' instance";var K$u="m>";var J9E="<div d";var p1_="ass=";var X$m="rapper";var f9c="_su";var M0d='<div data-dte-e="form_buttons" class="';var O1V="stedClose";var Y4d="how";var H$c="\"><di";var m6z="sition";var l_x="Open";var N2F='<div data-dte-e="head" class="';var f5C="form_er";var z5A="_clearDy";var d57="lineCreate";var q3M="layNo";var P2t="_crud";var H8S="_displayRe";var m7a="iq";var o36="formOp";var z07="\"form_info\" cl";var j1Z="iv data-dte-e=\"";var a$K="bmitT";var k6e="class=\"";var n0$=".dt.dte";var Z60="_action";var U50="_optionsUpdate";var H6V="file";var z1t="init";var k1G="iSe";var R5f="_inputTrigg";var n3i="_nest";var F9o='form_content';var z64="><";var O4A="ata-dte-e=\"body\" class=";var N7L="nl";var U75="nima";var s0k='<form data-dte-e="form" class="';var P0r='body_content';var F8R="domTable";var Z2f="i18n.";var P2D="ass=\"";k55.c6l();var I9T="initEdit";var y$Q="niq";var z$o='<div data-dte-e="form_content" class="';var s7Q="ldFromNo";var v2S="akInAr";var M0L="unique";var n8T="lasses";var g_9="<div data-dte-e=";var s40="messag";var Q$q="ot find display controller ";var f1P="tings";var T$j="ata-dte-e=\"foot\" class=\"";var U_J="_n";var t6S="ependent";var n80="tem";var H4f="ndic";var o6v="></d";var n3B="ato";var o0a="_preop";var d3z='<div data-dte-e="processing" class="';var K5e=".dte";var c99="depende";var s5P=I9T;s5P+=f8i;var c1v=u7s;c1v+=d0D;c1v+=G2H;var Q4z=m4c;Q4z+=o8N;var O6W=b_x;O6W+=v5A;O6W+=u7s;var C9K=Z9W;C9K+=D0wIj[394663];C9K+=H2R;var W3$=j_R;W3$+=W5S;var h$v=D0wIj.R_0;h$v+=f5K;var b7d=Z2f;b7d+=P_r;b7d+=K5e;var N9o=j_R;N9o+=m7a;N9o+=q0o;var r31=z1t;r31+=n0$;var f4e=C3h;f4e+=p4i;var s6J=B1h;s6J+=p$q;s6J+=h89;s6J+=p4i;var B51=B1h;B51+=q7Q;B51+=a7L;var U1v=w2F;U1v+=p$q;U1v+=L70;var F3p=m3r;F3p+=u7s;F3p+=h89;var R0p=H$c;R0p+=E2N;R0p+=p1_;R0p+=O9i;var j5d=W8F;j5d+=Y3V;var u9h=j1O;u9h+=a7O;var p03=g_9;p03+=z07;p03+=P2D;var f$f=O9i;f$f+=o6v;f$f+=f9D;var K3t=B1h;K3t+=H0E;K3t+=j0i;var a$H=T0U;a$H+=D0wIj.R_0;a$H+=H0E;a$H+=D0wIj[159052];var I5p=f2K;I5p+=j1Z;I5p+=f5C;I5p+=p6c;var Z3b=Z8Q;Z3b+=u7s;Z3b+=D0wIj.R_0;Z3b+=x0q;var t5Z=N6v;t5Z+=D0wIj.R_0;t5Z+=D0wIj[482911];t5Z+=H2R;var N5$=q51;N5$+=J_K;N5$+=H0E;N5$+=K$u;var q_i=O9i;q_i+=z64;q_i+=D9B;var n3Q=O9i;n3Q+=L70;var Z1G=u7s;Z1G+=D0wIj[394663];Z1G+=l3E;var X41=T0U;X41+=D0wIj.R_0;X41+=H0E;X41+=D0wIj[159052];var k7y=g10;k7y+=a1g;k7y+=F0h;var M9q=q4m;M9q+=B1h;M9q+=D0wIj.m1R;var P2A=O9i;P2A+=L70;var J5l=o9N;J5l+=X$m;var V32=J9E;V32+=T$j;var N96=q51;N96+=D0wIj[482911];N96+=U8Z;N96+=L70;var E9p=v4l;E9p+=a2h;var j_6=J7M;j_6+=m2u;var q2y=O9i;q2y+=L70;var n2G=o9N;n2G+=X$m;var z7Q=N6v;z7Q+=G71;z7Q+=H2R;var C7$=J9E;C7$+=O4A;C7$+=O9i;var o_b=j1O;o_b+=H4f;o_b+=n3B;o_b+=H0E;var e04=r4r;e04+=B1h;e04+=T49;var N7p=O9i;N7p+=L70;var j9U=L9S;j9U+=k6e;var f9V=D1C;f9V+=n8T;var H0m=F9E;H0m+=y$Q;H0m+=q0o;var K8g=M_1;K8g+=l3E;K8g+=p4i;var d7i=M0$;d7i+=x8I;var w5L=K9O;w5L+=B7_;var m3l=i1v;m3l+=D0T;var q6_=D1C;q6_+=S8h;q6_+=p4i;q6_+=B7_;var e1M=n80;e1M+=E$9;e1M+=e_t;var a_a=Y6m;a_a+=y1E;var S1C=o36;S1C+=s84;S1C+=p4i;var o4S=D0wIj[394663];o4S+=Z0T;var D6u=f_E;D6u+=f1P;var q9m=e2f;q9m+=u7s;q9m+=f8i;q9m+=H2R;var v2h=y1$;v2h+=B1h;v2h+=v2S;v2h+=j2m;var R90=P_q;R90+=w_L;var f19=k3x;f19+=o0x;f19+=D1C;f19+=o7G;var G4p=f9c;G4p+=a$K;G4p+=D0wIj[394663];G4p+=y1E;var v7A=o0a;v7A+=v5A;var v_b=N$A;v_b+=P7n;v_b+=f$n;v_b+=v5A;var T0D=n3i;T0D+=x3K;T0D+=l_x;var C8D=U_J;C8D+=B1h;C8D+=O1V;var i7H=R5f;i7H+=B1h;i7H+=H0E;var e8x=v$S;e8x+=B1v;var k7K=v$S;k7K+=s7Q;k7K+=N8S;var v2d=H8S;v2d+=D0wIj.R_0;v2d+=V1O;var u56=P2t;u56+=T_f;var c15=z5A;c15+=L6X;var I2J=N_J;I2J+=U75;I2J+=e_t;var u7f=Z60;u7f+=x8d;var O1w=u7s;O1w+=r4D;O1w+=a86;O1w+=B1h;var A3u=h5M;A3u+=r4D;var U70=p4i;U70+=Y4d;var W6j=H0E;W6j+=B1h;W6j+=y$N;var w$7=D0wIj.R_0;w$7+=b1l;w$7+=B1h;w$7+=f5K;var X1q=Z78;X1q+=R0z;X1q+=k1G;X1q+=u7s;var I9E=Z78;I9E+=R0z;I9E+=p6Q;var j2O=D0wIj[159052];j2O+=D0wIj.R_0;j2O+=D0wIj[482911];j2O+=B1h;var l3o=s40;l3o+=B1h;var J5y=o5M;J5y+=d57;var q_l=j1O;q_l+=N7L;q_l+=o5M;q_l+=B1h;var R7K=o5M;R7K+=r01;R7K+=F_Q;R7K+=H0E;var x$l=j1O;x$l+=D0wIj[482911];x$l+=p4i;var U0J=a7L;U0J+=j1O;U0J+=D0wIj[482911];U0J+=B1h;var F4c=H4J;F4c+=D5F;F4c+=p4i;var Q4R=T0U;Q4R+=Y_s;Q4R+=a86;Q4R+=D0wIj[482911];var d1F=D0wIj[482911];d1F+=b6z;d1F+=q3M;d1F+=N8S;var e52=A0e;e52+=K7C;e52+=D0wIj[482911];var B5C=G80;B5C+=W5C;B5C+=B1h;var r13=c99;r13+=f5K;r13+=u7s;var P0i=q3S;P0i+=t6S;var C16=D1C;C16+=L3v;C16+=d5R;C16+=B1h;var r42=D1C;r42+=a86;r42+=B1h;r42+=d1B;var H1v=r8C;H1v+=B1h;H1v+=n1u;H1v+=m6z;var g6k=N6v;g6k+=a86;g6k+=F9E;g6k+=H0E;var _this=this;this[a5B]=add;this[b0E]=ajax;this[D7G]=background;this[g6k]=blur;this[L7P]=bubble;this[M39]=bubbleLocation;this[H1v]=bubblePosition;this[v82]=buttons;this[r42]=clear;this[G35]=close;this[C16]=create;this[P0i]=undependent;this[r13]=dependent;this[R1e]=destroy;this[B5C]=disable;this[K6T]=display;this[e52]=displayed;this[d1F]=displayNode;this[p_F]=edit;this[M1H]=enable;this[E3Q]=error$1;this[Q4R]=field;this[Z7H]=fields;this[H6V]=file;this[F4c]=files;this[d4T]=get;this[U0J]=hide;this[x$l]=ids;this[R7K]=inError;this[q_l]=inline;this[J5y]=inlineCreate;this[l3o]=message;this[j2O]=mode;this[T8Y]=modifier;this[I9E]=multiGet;this[X1q]=multiSet;this[B0q]=node;this[A2F]=off;this[P1j]=on;this[H$_]=one;this[w$7]=open;this[B5O]=order;this[W6j]=remove;this[f_E]=set;this[U70]=show;this[A3u]=submit;this[x81]=table;this[A_k]=template;this[O1w]=title;this[F7D]=val;this[u7f]=_actionClass;this[j0N]=_ajax;this[I2J]=_animate;this[o4Q]=_assembleMain;this[b$e]=_blur;this[c15]=_clearDynamicInfo;this[f8N]=_close;this[u_a]=_closeReg;this[u56]=_crudArgs;this[n2r]=_dataSource;this[v2d]=_displayReorder;this[Q9h]=_edit;this[k4q]=_event;this[Y3J]=_eventName;this[k7K]=_fieldFromNode;this[e8x]=_fieldNames;this[u4R]=_focus;this[J3R]=_formOptions;this[f9q]=_inline;this[i7H]=_inputTrigger;this[U50]=_optionsUpdate;this[h5T]=_message;this[K1D]=_multiInfo;this[C8D]=_nestedClose;this[T0D]=_nestedOpen;this[v_b]=_postopen;this[v7A]=_preopen;this[h1g]=_processing;this[a$E]=_noProcessing;this[A_4]=_submit;this[G4p]=_submitTable;this[f19]=_submitSuccess;this[R90]=_submitError;this[s95]=_tidy;this[v2h]=_weakInArray;if(Editor[q9m](init,cjsJq)){return Editor;}if(!(this instanceof Editor)){var g3g=o1D;g3g+=f06;alert(g3g);}init=$[z7O](y_h,{},Editor[z3Z],init);this[D1C]=init;this[p4i]=$[z7O](y_h,{},Editor[r7N][D6u],{actionName:init[o0W],ajax:init[o4S],formOptions:init[S1C],idSrc:init[X71],table:init[F8R] || init[a_a],template:init[A_k]?$(init[e1M])[Z$n]():m8f});this[q6_]=$[m3l](y_h,{},Editor[w5L]);this[B8M]=init[d7i];Editor[r7N][K8g][H0m]++;var that=this;var classes=this[f9V];var wrapper=$(j9U + classes[x3Y] + N7p + d3z + classes[e04][o_b] + e1q + C7$ + classes[z7Q][n2G] + q2y + j_6 + classes[q7g][E9p] + Y4D + N96 + V32 + classes[Y_7][J5l] + P2A + m9e + classes[Y_7][M9q] + Y4D + k7y + L_Z);var form=$(s0k + classes[X41][Z1G] + n3Q + z$o + classes[u7M][G_g] + q_i + N5$);this[s9Y]={body:el(t5Z,wrapper)[D0wIj[140995]],bodyContent:el(P0r,wrapper)[D0wIj[140995]],buttons:$(M0d + classes[u7M][Z3b] + Y4D)[D0wIj[140995]],footer:el(I5K,wrapper)[D0wIj[140995]],form:form[D0wIj[140995]],formContent:el(F9o,form)[D0wIj[140995]],formError:$(I5p + classes[a$H][K3t] + f$f)[D0wIj[140995]],formInfo:$(p03 + classes[u7M][u9h] + Y4D)[D0wIj[140995]],header:$(N2F + classes[K93][j5d] + R0p + classes[K93][F3p] + U1v)[D0wIj[140995]],processing:el(M5f,wrapper)[D0wIj[140995]],wrapper:wrapper[D0wIj[140995]]};$[B51](init[s6J],function(evt,fn){that[P1j](evt,function(){var argsIn=[];k55.j5b();for(var _i=D0wIj[140995];_i < arguments[G8t];_i++){argsIn[_i]=arguments[_i];}fn[X2b](that,argsIn);});});this[s9Y];if(init[f4e]){var r4I=T0U;r4I+=Y_s;r4I+=w7n;r4I+=p4i;this[a5B](init[r4I]);}$(document)[P1j](r31 + this[p4i][N9o],function(e,settings,json){var u_0="nTa";var t4w="pi";var table=_this[p4i][x81];if(table){var t6z=r6R;t6z+=B1h;var P_t=u_0;P_t+=N6v;P_t+=D5F;var l9N=t8E;l9N+=t4w;var dtApi=new DataTable[l9N](table);if(settings[P_t] === dtApi[t6z]()[B0q]()){settings[L2V]=_this;}}})[P1j](b7d + this[p4i][M0L],function(e,settings){var V41="oLanguage";var x0s=S73;x0s+=D5F;var table=_this[p4i][x0s];if(table){var dtApi=new DataTable[K8Q](table);if(settings[W1L] === dtApi[x81]()[B0q]()){if(settings[V41][l6H]){var h42=M0$;h42+=m5y;h42+=f5K;var M2J=B1h;M2J+=V0h;M2J+=M9Y;M2J+=D0wIj[482911];$[M2J](y_h,_this[h42],settings[V41][l6H]);}}}})[h$v](j5f + this[p4i][W3$],function(e,settings,json){var u6D="nsUpdate";var S$K="_optio";var table=_this[p4i][x81];if(table){var k8G=O_t;k8G+=N8S;var s8I=Y6m;s8I+=y1E;var dtApi=new DataTable[K8Q](table);if(settings[W1L] === dtApi[s8I]()[k8G]()){var l38=S$K;l38+=u6D;_this[l38](json);}}});if(!Editor[K6T][init[K6T]]){var V51=G80;V51+=l6w;var K9d=C4z;K9d+=Q$q;throw new Error(K9d + init[V51]);}this[p4i][l7i]=Editor[K6T][init[C9K]][z1t](this);this[O6W](Q4z,[]);$(document)[c1v](s5P,[this]);}Editor[R0_][c1B]=function(name,args){k55.j5b();this[k4q](name,args);};Editor[O7z][K0u]=function(){var S$w=M0$;S$w+=m5y;S$w+=f5K;return this[S$w];};Editor[u_t][J2L]=function(){var e7o="_multiInf";var t4z=e7o;t4z+=D0wIj.R_0;k55.j5b();return this[t4z]();};Editor[Y5h][b4B]=function(){return this[p4i];};Editor[W76]={checkbox:checkbox,datatable:datatable,datetime:datetime,hidden:hidden,password:password,radio:radio,readonly:readonly,select:select,text:text,textarea:textarea,upload:upload,uploadMany:uploadMany};Editor[z6u]={};Editor[h8c]=C40;Editor[f2$]=classNames;Editor[S5s]=Field;Editor[D34]=m8f;Editor[E3Q]=error;Editor[O2i]=pairs;Editor[j2e]=factory;Editor[c$Z]=upload$1;Editor[z3Z]=defaults$1;Editor[r7N]={button:button,displayController:displayController,fieldType:fieldType,formOptions:formOptions,settings:settings};Editor[E7a]={dataTable:dataSource$1,html:dataSource};Editor[K6T]={envelope:envelope,lightbox:self};Editor[R8J]=function(id){k55.c6l();return safeDomId(id,R_6);};return Editor;})();DataTable[D2S]=Editor;$[D0wIj.I9n][U44][x$Z]=Editor;if(DataTable[Z5x]){var g7w=E0k;g7w+=D0wIj.V0f;Editor[g7w]=DataTable[D34];}if(DataTable[x7P][R52]){var Y2Z=L7M;Y2Z+=M9Y;Y2Z+=D0wIj[482911];$[Y2Z](Editor[W76],DataTable[i1v][R52]);}DataTable[i1v][x45]=Editor[a2m];return DataTable[f__];}});})();

/*! DataTables styling integration for DataTables' Editor
 * Â©SpryMedia Ltd - datatables.net/license
 */

(function( factory ){
    if ( typeof define === 'function' && define.amd ) {
        // AMD
        define( ['jquery', 'datatables.net-dt', 'datatables.net-editor'], function ( $ ) {
            return factory( $, window, document );
        } );
    }
    else if ( typeof exports === 'object' ) {
        // CommonJS
        var jq = require('jquery');
        var cjsRequires = function (root, $) {
            if ( ! $.fn.dataTable ) {
                require('datatables.net-dt')(root, $);
            }

            if ( ! $.fn.dataTable.Editor ) {
                require('datatables.net-editor')(root, $);
            }
        };

        if (typeof window === 'undefined') {
            module.exports = function (root, $) {
                if ( ! root ) {
                    // CommonJS environments without a window global must pass a
                    // root. This will give an error otherwise
                    root = window;
                }

                if ( ! $ ) {
                    $ = jq( root );
                }

                cjsRequires( root, $ );
                return factory( $, root, root.document );
            };
        }
        else {
            cjsRequires( window, jq );
            module.exports = factory( jq, window, window.document );
        }
    }
    else {
        // Browser
        factory( jQuery, window, document );
    }
}(function( $, window, document ) {
    'use strict';
    var DataTable = $.fn.dataTable;




    return DataTable.Editor;
}));
